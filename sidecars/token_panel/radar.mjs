/**
 * Local multi-tool radar: fast read-only directory probes for external AI coding tools (60s cached).
 */
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CACHE_TTL_MS = 60_000;
const MAX_ENTRIES = 2000;

let cachedResult = null;
let cachedAt = 0;

function safeExists(dir) {
  try { return existsSync(dir); } catch { return false; }
}

function safeReadDir(dir) {
  try { return readdirSync(dir, { withFileTypes: true }); } catch { return []; }
}

function scoreEntry(dir, ent, ext, maxDepth, depth, budget) {
  if (ent.isFile()) return ent.name.endsWith(ext) ? 1 : 0;
  if (!ent.isDirectory() || depth >= maxDepth) return 0;
  return walkEntries(join(dir, ent.name), ext, maxDepth, depth + 1, budget);
}

function walkEntries(dir, ext, maxDepth, depth, budget) {
  let count = 0;
  for (const ent of safeReadDir(dir)) {
    if (budget.left <= 0) break;
    budget.left -= 1;
    count += scoreEntry(dir, ent, ext, maxDepth, depth, budget);
  }
  return count;
}

function countSubdirs(dir) {
  let count = 0;
  for (const ent of safeReadDir(dir)) {
    if (ent.isDirectory() && !ent.name.startsWith('.')) count += 1;
  }
  return count;
}

function countGeminiCli(dir) {
  const files = walkEntries(dir, '.json', 2, 0, { left: MAX_ENTRIES });
  return files > 0 ? files : countSubdirs(dir);
}

function cursorStorageDir(home) {
  if (process.platform === 'darwin') return join(home, 'Library', 'Application Support', 'Cursor', 'User', 'workspaceStorage');
  if (process.platform === 'win32') return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'Cursor', 'User', 'workspaceStorage');
  return join(home, '.config', 'Cursor', 'User', 'workspaceStorage');
}

function toolSpecs(home) {
  return [
    { id: 'claude_code', name: 'Claude Code', dir: join(home, '.claude', 'projects'), count: (d) => walkEntries(d, '.jsonl', 2, 0, { left: MAX_ENTRIES }) },
    { id: 'codex', name: 'Codex', dir: join(home, '.codex', 'sessions'), count: (d) => walkEntries(d, '.jsonl', 4, 0, { left: MAX_ENTRIES }) },
    { id: 'cursor', name: 'Cursor', dir: cursorStorageDir(home), count: countSubdirs },
    { id: 'gemini_cli', name: 'Gemini CLI', dir: join(home, '.gemini', 'tmp'), count: countGeminiCli },
  ];
}

function probeTool(spec) {
  if (!safeExists(spec.dir)) return { id: spec.id, name: spec.name, detected: false, count: 0 };
  return { id: spec.id, name: spec.name, detected: true, count: spec.count(spec.dir) };
}

export function detectLocalTools(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedResult && now - cachedAt < CACHE_TTL_MS) return cachedResult;
  const tools = toolSpecs(homedir()).map(probeTool);
  const totalExternalSessions = tools.reduce((sum, t) => sum + t.count, 0);
  cachedResult = { scannedAt: new Date(now).toISOString(), totalExternalSessions, tools };
  cachedAt = now;
  return cachedResult;
}
