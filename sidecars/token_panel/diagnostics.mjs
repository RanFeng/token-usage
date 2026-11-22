/**
 * Session diagnostics: Lite DLP local secret scanner, realtime health alerts, and workspace inference.
 */
import { createHash } from 'node:crypto';

const DLP_RULES = [
  { type: 'api_key', re: /sk-[A-Za-z0-9_-]{20,}/g },
  { type: 'aws_key', re: /AKIA[0-9A-Z]{16}/g },
  { type: 'github_token', re: /(?:ghp|gho|ghu|ghs)_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/g },
  { type: 'google_key', re: /AIza[0-9A-Za-z_-]{35}/g },
  { type: 'jwt', re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { type: 'private_key', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g },
  { type: 'db_uri', re: /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s'"`]+:[^@\s'"`]{4,}@[^\s'"`]+/g },
];

const PATH_KEYS = [
  'Path', 'Cwd', 'DirectoryPath', 'TargetFile', 'SearchPath',
  'AbsolutePath', 'WorkspacePath', 'path', 'cwd', 'file_path', 'directory', 'workdir',
];
const CMD_KEYS = ['CommandLine', 'command', 'cmd'];
const CMD_PATH_RE = /(?:^|[\s'"=(])((?:[A-Za-z]:\\|\/)[^\s'"`;|&<>)]{2,})/g;
const FILE_EXT_RE = /\.(?:md|txt|json|jsonl|js|mjs|cjs|ts|tsx|jsx|py|go|rs|java|c|cpp|h|css|html|yml|yaml|toml|sh|zsh|log|lock|env|png|jpg|svg|pdf)$/i;

const ROOT_SYSTEM_DIRS = new Set([
  'var', 'tmp', 'private', 'etc', 'usr', 'bin', 'sbin', 'opt', 'dev', 'proc', 'sys',
  'system', 'library', 'applications', 'windows', 'program files', 'program files (x86)', 'programdata',
]);
const SKIP_ANYWHERE = new Set(['.gemini', 'node_modules', 'library', 'appdata']);
const CONTAINERS = new Set([
  'code', 'projects', 'project', 'repos', 'repo', 'workspace', 'workspaces',
  'dev', 'work', 'git', 'github', 'gitlab',
]);
const IGNORED_NAMES = new Set([
  'tmp', 'temp', 'desktop', 'downloads', 'documents', 'pictures', 'movies', 'music',
  'public', 'applications', 'library', 'users', 'home', 'root', 'src', ...CONTAINERS,
]);

export function maskSecret(type, raw) {
  if (type === 'private_key') return '-----BEGIN ... PRIVATE KEY-----';
  if (type === 'db_uri') return `${raw.slice(0, raw.indexOf('://') + 3)}***`;
  return raw.length > 9 ? `${raw.slice(0, 4)}***${raw.slice(-3)}` : `${raw.slice(0, 2)}***`;
}

function secretHash(raw) {
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export function createDlpScanner() {
  return { totalCount: 0, byTurn: {}, findings: [], seen: new Set() };
}

export function finalizeDlp(scanner) {
  return { totalCount: scanner.totalCount, byTurn: scanner.byTurn, findings: scanner.findings };
}

function addFinding(scanner, type, turn, source, raw) {
  const key = `${turn}:${type}:${secretHash(raw)}`;
  if (scanner.seen.has(key)) return;
  scanner.seen.add(key);
  scanner.totalCount += 1;
  scanner.byTurn[turn] = (scanner.byTurn[turn] || 0) + 1;
  scanner.findings.push({ type, turn, source, masked: maskSecret(type, raw) });
}

function scanRule(scanner, rule, text, turn, source) {
  rule.re.lastIndex = 0;
  let match;
  while ((match = rule.re.exec(text)) !== null) {
    addFinding(scanner, rule.type, turn, source, match[0]);
  }
}

export function scanTextDlp(scanner, text, turn, source) {
  if (!text || typeof text !== 'string') return;
  for (const rule of DLP_RULES) scanRule(scanner, rule, text, turn, source);
}

function unwrapString(val) {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return trimmed;
  try { return String(JSON.parse(trimmed)); } catch { return trimmed; }
}

function readToolArgs(tc) {
  const raw = tc?.args ?? tc?.arguments;
  if (typeof raw !== 'string') return raw && typeof raw === 'object' ? raw : null;
  try { return JSON.parse(raw); } catch { return { _raw: raw }; }
}

function collectArgStrings(obj, out) {
  for (const val of Object.values(obj)) {
    if (typeof val === 'string') out.push(unwrapString(val));
    else if (val && typeof val === 'object') out.push(JSON.stringify(val));
  }
}

function scanToolCallsDlp(scanner, toolCalls, turn) {
  if (!Array.isArray(toolCalls)) return;
  for (const tc of toolCalls) {
    const args = readToolArgs(tc);
    if (!args) continue;
    const texts = [];
    collectArgStrings(args, texts);
    for (const txt of texts) scanTextDlp(scanner, txt, turn, 'tool_args');
  }
}

export function scanRecordDlp(scanner, rec, turn) {
  if (!rec || rec.type === 'SYSTEM_MESSAGE') return;
  if (rec.type === 'USER_INPUT') return scanTextDlp(scanner, rec.content, turn, 'prompt');
  scanToolCallsDlp(scanner, rec.tool_calls, turn);
  const src = rec.type === 'GENERIC' ? 'tool_output' : 'content';
  scanTextDlp(scanner, rec.content, turn, src);
  scanTextDlp(scanner, rec.thinking, turn, 'content');
}

function checkNearCompact(ctx) {
  const pct = Number(ctx?.percent || 0);
  if (pct < 80) return null;
  const level = pct >= 90 ? 'danger' : 'warn';
  return { id: 'near_compact', level, code: 'near_compact', params: { percent: Number(pct.toFixed(1)) } };
}

function checkErrorBurn(turns) {
  let worst = null;
  for (const t of turns) {
    if ((t.errorCount || 0) >= 3 && (!worst || t.errorCount >= worst.errorCount)) worst = t;
  }
  if (!worst) return null;
  return { id: 'error_burn', level: 'danger', code: 'error_burn', params: { turn: worst.turn, count: worst.errorCount } };
}

function turnTokens(t) {
  return (t.input || 0) + (t.cache || 0) + (t.output || 0);
}

function findPeakTurn(turns) {
  let best = null;
  let bestTok = 0;
  for (const t of turns) {
    const tok = turnTokens(t);
    if (tok > bestTok) { bestTok = tok; best = t; }
  }
  return { best, bestTok };
}

function checkTokenSpike(turns) {
  if (turns.length < 3) return null;
  const avg = turns.reduce((acc, t) => acc + turnTokens(t), 0) / turns.length;
  const { best, bestTok } = findPeakTurn(turns);
  if (!best || bestTok < 80000 || bestTok < 3 * avg) return null;
  const ratio = Number((bestTok / Math.max(avg, 1)).toFixed(1));
  return { id: 'token_spike', level: 'warn', code: 'token_spike', params: { turn: best.turn, tokens: bestTok, ratio } };
}

function checkLowCache(totals) {
  const totalIn = (totals?.input || 0) + (totals?.cache || 0);
  if (totalIn < 50000) return null;
  const rate = Number(((totals.cache / totalIn) * 100).toFixed(1));
  if (rate >= 30) return null;
  return { id: 'low_cache', level: 'info', code: 'low_cache', params: { rate } };
}

export function buildDiagnostics(parsed) {
  if (!parsed) return [];
  return [
    checkNearCompact(parsed.context),
    checkErrorBurn(parsed.turns || []),
    checkTokenSpike(parsed.turns || []),
    checkLowCache(parsed.totals),
  ].filter(Boolean);
}

function collectCmdPaths(cmd, out) {
  if (!cmd) return;
  CMD_PATH_RE.lastIndex = 0;
  let match;
  while ((match = CMD_PATH_RE.exec(cmd)) !== null) out.push(match[1]);
}

function collectArgsPaths(args, out) {
  for (const key of PATH_KEYS) {
    const val = unwrapString(args[key]);
    if (val) out.push(val);
  }
  for (const key of CMD_KEYS) collectCmdPaths(unwrapString(args[key]), out);
}

export function extractPathsFromRecord(rec) {
  if (!Array.isArray(rec?.tool_calls) || !rec.tool_calls.length) return [];
  const out = [];
  for (const tc of rec.tool_calls) {
    const args = readToolArgs(tc);
    if (args) collectArgsPaths(args, out);
  }
  return out;
}

function isValidCandidate(name, isLastSeg) {
  if (!name || name.length < 2 || name.startsWith('.')) return false;
  if (IGNORED_NAMES.has(name.toLowerCase())) return false;
  return !(isLastSeg && FILE_EXT_RE.test(name));
}

function homeChildIndex(segs) {
  if (!segs.length) return -1;
  const first = segs[0].toLowerCase();
  if (first === 'users' || first === 'home') return 2;
  return /^[a-z]:$/i.test(segs[0]) && segs[1]?.toLowerCase() === 'users' ? 3 : -1;
}

function isSrcContainer(segs, idx) {
  if (segs[idx].toLowerCase() !== 'src') return false;
  const homeIdx = homeChildIndex(segs);
  return idx === 0 || idx === homeIdx || (idx === 1 && /^[a-z]:$/i.test(segs[0]));
}

function findContainerProject(segs) {
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i].toLowerCase();
    if (!CONTAINERS.has(seg) && !isSrcContainer(segs, i)) continue;
    const cand = segs[i + 1];
    if (isValidCandidate(cand, i + 1 === segs.length - 1)) return cand;
  }
  return null;
}

function hasIgnoredSegment(segs) {
  if (!segs.length || ROOT_SYSTEM_DIRS.has(segs[0].toLowerCase())) return true;
  return segs.some((s) => SKIP_ANYWHERE.has(s.toLowerCase()));
}

function inferHomeProject(segs) {
  const homeIdx = homeChildIndex(segs);
  if (homeIdx < 0 || homeIdx >= segs.length) return null;
  return isValidCandidate(segs[homeIdx], homeIdx === segs.length - 1) ? segs[homeIdx] : null;
}

function inferFromSegments(segs) {
  if (hasIgnoredSegment(segs)) return null;
  return findContainerProject(segs) || inferHomeProject(segs);
}

export function inferProjectName(rawPath) {
  const norm = unwrapString(rawPath).replace(/\\/g, '/').replace(/\/+$/, '');
  if (!norm.includes('/')) return isValidCandidate(norm, false) ? norm : null;
  return inferFromSegments(norm.split('/').filter(Boolean));
}

function countProjectWeights(entries) {
  const weights = new Map();
  for (const [rawPath, weight] of entries) {
    const proj = inferProjectName(rawPath);
    if (proj) weights.set(proj, (weights.get(proj) || 0) + Number(weight || 0));
  }
  return weights;
}

export function pickPrimaryWorkspace(pathCounts) {
  const entries = pathCounts instanceof Map ? pathCounts.entries() : Object.entries(pathCounts || {});
  const weights = countProjectWeights(entries);
  let bestName = '';
  let bestCount = 0;
  for (const [name, count] of weights) {
    if (count > bestCount) { bestCount = count; bestName = name; }
  }
  return bestName;
}
