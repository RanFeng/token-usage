/**
 * Single-conversation transcript parser: turns, timings, deltas, models, tools, DLP, diagnostics, and full turn detail.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  buildDiagnostics, createDlpScanner, extractPathsFromRecord,
  finalizeDlp, pickPrimaryWorkspace, scanRecordDlp,
} from './diagnostics.mjs';
import { estimateCost, mergeCost } from './pricing.mjs';

export const ID_RE = /^[0-9a-f-]{8,}$/i;

export function resolveAppData() {
  return process.env.ANTIGRAVITY_APP_DATA || join(homedir(), '.gemini', 'antigravity');
}

export function transcriptPath(convId, full = false) {
  const file = full ? 'transcript_full.jsonl' : 'transcript.jsonl';
  return join(resolveAppData(), 'brain', convId, '.system_generated', 'logs', file);
}

export function stripTags(raw) {
  return String(raw || '')
    .replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, '')
    .replace(/<USER_SETTINGS_CHANGE>[\s\S]*?<\/USER_SETTINGS_CHANGE>/g, '')
    .replace(/<\/?USER_REQUEST>/g, '')
    .trim();
}

export function cleanPrompt(raw, limit = 60) {
  const text = stripTags(raw).replace(/\s+/g, ' ');
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function clipText(raw, max = 4000) {
  const s = String(raw || '').trim();
  return s.length > max ? `${s.slice(0, max)}\n... (已截断，共 ${s.length} 字)` : s;
}

function parseTs(rec) {
  const ms = rec?.created_at ? Date.parse(rec.created_at) : 0;
  return Number.isFinite(ms) ? ms : 0;
}

function parseJsonLine(line) {
  if (!line.trim()) return null;
  try { return JSON.parse(line); } catch { return null; }
}

function contextLimitFor(model) {
  return /claude|sonnet|opus|haiku/i.test(String(model || '')) ? 200000 : 1000000;
}

function addTokens(target, rec) {
  target.input += rec.input_tokens || 0;
  target.cache += rec.cache_read_tokens || 0;
  target.output += rec.output_tokens || 0;
  target.total = target.input + target.output;
}

function extractStep(rec) {
  const input = rec.input_tokens || 0;
  const cache = rec.cache_read_tokens || 0;
  const output = rec.output_tokens || 0;
  if (!input && !cache && !output) return null;
  const tools = Array.isArray(rec.tool_calls) ? rec.tool_calls.map((t) => t?.name).filter(Boolean) : [];
  const startMs = parseTs(rec);
  return {
    model: rec.model || '', input, cache, output,
    contextUsed: input + cache + output, tools, startMs, firstToolMs: 0, endMs: startMs,
  };
}

function updateModelMap(map, step, costAcc) {
  const name = step.model || 'unknown';
  const entry = map.get(name) || { model: name, steps: 0, input: 0, cache: 0, output: 0, total: 0, actualUsd: 0 };
  const c = estimateCost(step.input, step.cache, step.output, name);
  entry.steps += 1;
  entry.input += step.input;
  entry.cache += step.cache;
  entry.output += step.output;
  entry.total += step.input + step.cache + step.output;
  entry.actualUsd += c.actualUsd;
  map.set(name, entry);
  mergeCost(costAcc, c);
}

function updateToolMap(toolMap, step) {
  for (const name of step.tools) {
    const entry = toolMap.get(name) || { name, count: 0, errors: 0, totalSec: 0 };
    entry.count += 1;
    entry.totalSec += step.toolSec || 0;
    toolMap.set(name, entry);
  }
}

function calcSec(startMs, endMs) {
  return startMs && endMs ? Math.max(0, Math.round((endMs - startMs) / 1000)) : 0;
}

function finalizeStep(s, nextStart, toolMap) {
  const end = Math.max(s.endMs, nextStart || s.startMs);
  s.durationSec = calcSec(s.startMs, end);
  s.modelSec = calcSec(s.startMs, s.firstToolMs || end);
  s.toolSec = Math.max(0, s.durationSec - s.modelSec);
  updateToolMap(toolMap, s);
}

function finalizeTurn(t, prevEndCtx, toolMap, dlpByTurn) {
  t.durationSec = calcSec(t.startMs, t.endMs);
  t.dlpCount = dlpByTurn[t.turn] || 0;
  for (let i = 0; i < t.steps.length; i++) {
    const nextStart = i + 1 < t.steps.length ? t.steps[i + 1].startMs : t.endMs;
    finalizeStep(t.steps[i], nextStart, toolMap);
  }
  const endCtx = t.steps.length ? t.steps[t.steps.length - 1].contextUsed : prevEndCtx;
  t.endContext = endCtx;
  t.deltaUsed = prevEndCtx > 0 ? endCtx - prevEndCtx : endCtx;
  t.isCompact = prevEndCtx >= 20000 && endCtx / prevEndCtx <= 0.75;
  return endCtx;
}

function addPaths(pathCounts, rec) {
  for (const p of extractPathsFromRecord(rec)) {
    pathCounts.set(p, (pathCounts.get(p) || 0) + 1);
  }
}

function updateStepTiming(cur, ts) {
  if (!cur || !cur.steps.length || !ts) return;
  const prev = cur.steps[cur.steps.length - 1];
  if (!prev.firstToolMs) prev.firstToolMs = ts;
  if (ts > prev.endMs) prev.endMs = ts;
}

function recordStep(rec, ts, state) {
  const step = extractStep(rec);
  if (!step) return updateStepTiming(state.cur, ts);
  state.lastStep = step;
  state.history.push({ turn: state.cur ? state.cur.turn : 0, used: step.contextUsed });
  updateModelMap(state.modelMap, step, state.costAcc);
  if (state.cur) state.cur.steps.push(step);
}

function isErrorRec(rec) {
  return Boolean(rec.status === 'ERROR' || rec.type === 'ERROR_MESSAGE' || rec.error);
}

function updateCurMeta(rec, ts, cur) {
  cur.endMs = Math.max(cur.endMs, ts);
  cur.errorCount += isErrorRec(rec) ? 1 : 0;
  addTokens(cur, rec);
  if (rec.model) cur.model = rec.model;
}

function recordNonUser(rec, ts, state) {
  addTokens(state.totals, rec);
  addPaths(state.pathCounts, rec);
  scanRecordDlp(state.dlpScanner, rec, state.cur ? state.cur.turn : 0);
  recordStep(rec, ts, state);
  if (state.cur) updateCurMeta(rec, ts, state.cur);
}

function createParseState() {
  return {
    turns: [], history: [], totals: { input: 0, cache: 0, output: 0, total: 0 },
    modelMap: new Map(), costAcc: { actualUsd: 0, noCacheUsd: 0, savedUsd: 0 },
    pathCounts: new Map(), dlpScanner: createDlpScanner(), cur: null, lastStep: null,
  };
}

function startUserTurn(rec, ts, state) {
  const mediaCount = Array.isArray(rec.media) ? rec.media.length : 0;
  state.cur = {
    turn: state.turns.length + 1, prompt: cleanPrompt(rec.content),
    input: 0, cache: 0, output: 0, total: 0, model: '',
    startMs: ts, endMs: ts, mediaCount, errorCount: 0, dlpCount: 0, steps: [],
  };
  state.turns.push(state.cur);
  scanRecordDlp(state.dlpScanner, rec, state.cur.turn);
}

function processTranscriptLine(line, state) {
  const rec = parseJsonLine(line);
  if (!rec) return;
  const ts = parseTs(rec);
  if (rec.type === 'USER_INPUT') startUserTurn(rec, ts, state);
  else recordNonUser(rec, ts, state);
}

function buildContext(lastStep) {
  if (!lastStep) return null;
  const limit = contextLimitFor(lastStep.model);
  return { ...lastStep, limit, percent: Number(((lastStep.contextUsed / limit) * 100).toFixed(2)) };
}

export function parseTranscript(filePath) {
  const state = createParseState();
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    processTranscriptLine(line, state);
  }
  const dlp = finalizeDlp(state.dlpScanner);
  const toolMap = new Map();
  let prevCtx = 0;
  for (const t of state.turns) prevCtx = finalizeTurn(t, prevCtx, toolMap, dlp.byTurn);
  const models = [...state.modelMap.values()].sort((a, b) => b.total - a.total);
  const tools = [...toolMap.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  const base = {
    turns: state.turns, totals: state.totals, history: state.history,
    context: buildContext(state.lastStep), models, tools, cost: state.costAcc,
    workspace: pickPrimaryWorkspace(state.pathCounts), dlp,
  };
  return { ...base, diagnostics: buildDiagnostics(base) };
}

export function buildUsagePayload(convId, etagClient) {
  const head = { schemaVersion: 2, source: 'antigravity' };
  if (!convId || !ID_RE.test(convId)) return { ...head, conversationId: convId || null, ready: false };
  const filePath = transcriptPath(convId);
  if (!existsSync(filePath)) return { ...head, conversationId: convId, ready: false };
  const st = statSync(filePath);
  const etag = `${convId}:${st.mtimeMs}:${st.size}`;
  if (etagClient && etagClient === etag) return { ...head, conversationId: convId, ready: true, unchanged: true, etag };
  return { ...head, conversationId: convId, ready: true, etag, ...parseTranscript(filePath) };
}

function parseToolArgs(t) {
  const raw = t?.arguments ?? t?.args ?? {};
  if (typeof raw !== 'string') return raw;
  try { return JSON.parse(raw); } catch { return raw; }
}

function formatArgVal(first) {
  if (typeof first === 'string') return first.replace(/\s+/g, ' ').slice(0, 42);
  return JSON.stringify(first)?.slice(0, 42) || '';
}

function summarizeArgs(args) {
  if (!args || typeof args !== 'object') return clipText(args, 70);
  const keys = Object.keys(args);
  if (!keys.length) return '{}';
  const extra = keys.length > 1 ? ` (+${keys.length - 1})` : '';
  return `${keys[0]}: ${formatArgVal(args[keys[0]])}${extra}`;
}

function formatToolCall(t) {
  const args = parseToolArgs(t);
  return { name: t?.name || '', preview: summarizeArgs(args), args };
}

function formatDetailItem(rec) {
  const rawContent = rec.type === 'USER_INPUT' ? stripTags(rec.content) : rec.content;
  return {
    type: rec.type || '', model: rec.model || '', createdAt: rec.created_at || '', status: rec.status || '',
    input: rec.input_tokens || 0, cache: rec.cache_read_tokens || 0, output: rec.output_tokens || 0,
    thinking: clipText(rec.thinking, 3000), content: clipText(rawContent, 4000),
    tools: Array.isArray(rec.tool_calls) ? rec.tool_calls.map(formatToolCall) : [],
  };
}

function collectTurnItems(filePath, targetTurn) {
  const items = [];
  let turnNo = 0;
  for (const rec of readFileSync(filePath, 'utf-8').split('\n').map(parseJsonLine).filter(Boolean)) {
    if (rec.type === 'USER_INPUT') turnNo += 1;
    if (turnNo > targetTurn) break;
    if (turnNo === targetTurn) items.push(formatDetailItem(rec));
  }
  return items;
}

export function readTurnDetail(convId, targetTurn) {
  if (!convId || !ID_RE.test(convId) || !targetTurn) return { ok: false };
  const fullPath = transcriptPath(convId, true);
  const filePath = existsSync(fullPath) ? fullPath : transcriptPath(convId, false);
  if (!existsSync(filePath)) return { ok: false };
  return { ok: true, turn: targetTurn, items: collectTurnItems(filePath, targetTurn) };
}
