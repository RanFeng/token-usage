/**
 * Global overview scanner with per-file mtime/size cache for fast cross-session analytics and billing export.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  addIntoBucket, buildAchievements, buildDaily, buildForecast, buildFunStats,
  buildHallOfFame, buildHealth, buildHeatmap, buildHours, buildProjects,
  buildTools, buildWeekSplit, cycleMeta, dateKey, emptyBucket, emptyOverviewPayload,
  lastNDays, sumToolCalls,
} from './analytics.mjs';
import { extractPathsFromRecord, pickPrimaryWorkspace } from './diagnostics.mjs';
import { cleanPrompt, resolveAppData, transcriptPath } from './parser.mjs';
import { estimateCost, mergeCost } from './pricing.mjs';
import { detectLocalTools } from './radar.mjs';

const fileCache = new Map();
const VALID_RANGES = new Set(['month', '30d', 'all']);
const CSV_HEADERS = [
  'date', 'session_id', 'title', 'project', 'model', 'turns',
  'input_tokens', 'cache_read_tokens', 'output_tokens', 'total_tokens',
  'actual_usd', 'saved_usd', 'source',
];

function parseRecTs(rec) {
  const ms = rec?.created_at ? Date.parse(rec.created_at) : NaN;
  return Number.isFinite(ms) ? ms : 0;
}

function createScanState(cid, st) {
  return {
    cid, title: '', updatedMs: st.mtimeMs, mtimeMs: st.mtimeMs, size: st.size,
    lastModel: '', tot: emptyBucket(),
    byModel: new Map(), byDay: new Map(), byTool: new Map(), pathCounts: new Map(),
    hourTotals: new Array(24).fill(0), hourSteps: new Array(24).fill(0),
    pendingTools: [], prevCtx: 0, peakCtx: 0, compacts: 0,
    curTurn: null, turnsList: [], maxTurnSteps: 0,
  };
}

function closeCurTurn(s) {
  const t = s.curTurn;
  if (!t) return;
  const durationSec = t.startMs && t.endMs ? Math.max(0, Math.round((t.endMs - t.startMs) / 1000)) : 0;
  s.maxTurnSteps = Math.max(s.maxTurnSteps, t.steps);
  s.turnsList.push({
    cid: s.cid, title: s.title || '(无标题会话)',
    turn: t.turn, durationSec, total: t.total, prompt: t.prompt,
  });
}

function handleUserInput(rec, rawTs, s) {
  closeCurTurn(s);
  s.pendingTools.length = 0;
  s.tot.turns += 1;
  const prompt = cleanPrompt(rec.content, 60) || '(无文本)';
  if (!s.title) s.title = cleanPrompt(rec.content, 44);
  const day = dateKey(rawTs || s.updatedMs);
  const db = s.byDay.get(day) || emptyBucket();
  db.turns += 1;
  s.byDay.set(day, db);
  s.curTurn = { turn: s.tot.turns, prompt, startMs: rawTs, endMs: rawTs, total: 0, steps: 0 };
}

function trackToolResult(rec, s) {
  if (rec.type !== 'GENERIC' || !s.pendingTools.length) return;
  const name = s.pendingTools.shift();
  const entry = s.byTool.get(name);
  if (entry && (rec.status === 'ERROR' || rec.error)) entry.errors += 1;
}

function trackToolCalls(rec, s) {
  if (rec.type === 'PLANNER_RESPONSE') s.pendingTools.length = 0;
  if (!Array.isArray(rec.tool_calls) || !rec.tool_calls.length) return;
  for (const tc of rec.tool_calls) {
    if (!tc?.name) continue;
    s.pendingTools.push(tc.name);
    const entry = s.byTool.get(tc.name) || { name: tc.name, count: 0, errors: 0 };
    entry.count += 1;
    s.byTool.set(tc.name, entry);
  }
}

function trackWorkspacePaths(rec, s) {
  for (const p of extractPathsFromRecord(rec)) {
    s.pathCounts.set(p, (s.pathCounts.get(p) || 0) + 1);
  }
}

function recordModelAndDay(inp, cac, out, model, ts, cost, s) {
  const total = inp + cac + out;
  const m = s.byModel.get(model) || { model, steps: 0, input: 0, cache: 0, output: 0, total: 0, actualUsd: 0 };
  m.steps += 1; m.input += inp; m.cache += cac; m.output += out; m.total += total; m.actualUsd += cost.actualUsd;
  s.byModel.set(model, m);
  const day = dateKey(ts);
  const db = s.byDay.get(day) || emptyBucket();
  db.input += inp; db.cache += cac; db.output += out; db.total += total;
  mergeCost(db, cost);
  s.byDay.set(day, db);
  const hr = new Date(ts).getHours();
  s.hourTotals[hr] += total;
  s.hourSteps[hr] += 1;
}

function updateCurTurnTokens(cur, total) {
  if (!cur) return;
  cur.total += total;
  cur.steps += 1;
}

function recordTokens(rec, ts, s) {
  const inp = rec.input_tokens || 0;
  const cac = rec.cache_read_tokens || 0;
  const out = rec.output_tokens || 0;
  const total = inp + cac + out;
  if (!total) return;
  const model = rec.model || s.lastModel || 'unknown';
  s.lastModel = model;
  const cost = estimateCost(inp, cac, out, model);
  s.tot.input += inp; s.tot.cache += cac; s.tot.output += out; s.tot.total += total;
  mergeCost(s.tot, cost);
  if (s.prevCtx >= 20000 && total / s.prevCtx <= 0.75) s.compacts += 1;
  s.prevCtx = total;
  s.peakCtx = Math.max(s.peakCtx, total);
  recordModelAndDay(inp, cac, out, model, ts, cost, s);
  updateCurTurnTokens(s.curTurn, total);
}

function processRecord(rec, s) {
  const rawTs = parseRecTs(rec);
  if (rec.type === 'USER_INPUT') return handleUserInput(rec, rawTs, s);
  if (s.curTurn && rawTs > s.curTurn.endMs) s.curTurn.endMs = rawTs;
  trackToolResult(rec, s);
  trackToolCalls(rec, s);
  trackWorkspacePaths(rec, s);
  recordTokens(rec, rawTs || s.updatedMs, s);
}

function finalizeSession(s) {
  closeCurTurn(s);
  const topTurns = s.turnsList.sort((a, b) => b.durationSec - a.durationSec).slice(0, 3);
  return {
    cid: s.cid, title: s.title || '(无标题会话)',
    updatedMs: s.updatedMs, mtimeMs: s.mtimeMs, size: s.size,
    model: s.lastModel, workspace: pickPrimaryWorkspace(s.pathCounts), source: 'antigravity',
    ...s.tot,
    byModel: [...s.byModel.values()], byDay: [...s.byDay.entries()],
    byTool: [...s.byTool.values()],
    hourTotals: s.hourTotals, hourSteps: s.hourSteps,
    peakCtx: s.peakCtx, compacts: s.compacts,
    maxTurnSteps: s.maxTurnSteps, topTurns,
  };
}

function scanOneSession(cid, filePath, st) {
  const cached = fileCache.get(cid);
  if (cached && cached.mtimeMs === st.mtimeMs && cached.size === st.size) return cached;
  const s = createScanState(cid, st);
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    if (!line.trim()) continue;
    try { processRecord(JSON.parse(line), s); } catch { continue; }
  }
  const entry = finalizeSession(s);
  fileCache.set(cid, entry);
  return entry;
}

function loadAllSessions(brainDir) {
  const sessions = [];
  for (const name of readdirSync(brainDir)) {
    const fp = transcriptPath(name);
    if (!existsSync(fp)) continue;
    try { sessions.push(scanOneSession(name, fp, statSync(fp))); } catch { continue; }
  }
  return sessions;
}

function loadSessionsSafe() {
  const brainDir = join(resolveAppData(), 'brain');
  return existsSync(brainDir) ? loadAllSessions(brainDir) : [];
}

function createGlobalAgg(cycle) {
  return {
    periods: {
      today: emptyBucket(),
      week: emptyBucket(),
      month: {
        ...emptyBucket(),
        daysElapsed: cycle.daysElapsed,
        daysInMonth: cycle.daysInCycle,
        cycleStart: cycle.startKey,
        cycleEnd: cycle.endKey,
        cycleType: cycle.type,
        resetDay: cycle.resetDay,
        isCustomCycle: cycle.isCustom,
      },
      all: emptyBucket(),
    },
    allDays: new Map(), daySessions: new Map(),
    modelMap: new Map(), toolMap: new Map(),
    hourTotals: new Array(24).fill(0), hourSteps: new Array(24).fill(0),
    maxTurnSteps: 0,
  };
}

function mergeDayIntoPeriods(day, b, periods, ctx) {
  if (day === ctx.todayKey) addIntoBucket(periods.today, b);
  if (ctx.weekSet.has(day)) addIntoBucket(periods.week, b);
  if (day >= ctx.cycle.startKey && day <= ctx.cycle.endKey) addIntoBucket(periods.month, b);
}

function mergeSessionDays(s, agg, ctx) {
  for (const [day, b] of s.byDay) {
    const allB = agg.allDays.get(day) || emptyBucket();
    addIntoBucket(allB, b);
    agg.allDays.set(day, allB);
    if (b.total > 0 || b.turns > 0) agg.daySessions.set(day, (agg.daySessions.get(day) || 0) + 1);
    mergeDayIntoPeriods(day, b, agg.periods, ctx);
  }
}

function mergeSessionStats(s, agg) {
  for (const m of s.byModel) {
    const dst = agg.modelMap.get(m.model) || { model: m.model, steps: 0, input: 0, cache: 0, output: 0, total: 0, actualUsd: 0 };
    dst.steps += m.steps; dst.input += m.input; dst.cache += m.cache; dst.output += m.output; dst.total += m.total; dst.actualUsd += m.actualUsd;
    agg.modelMap.set(m.model, dst);
  }
  for (const t of s.byTool) {
    const dst = agg.toolMap.get(t.name) || { name: t.name, count: 0, errors: 0 };
    dst.count += t.count; dst.errors += t.errors;
    agg.toolMap.set(t.name, dst);
  }
  for (let h = 0; h < 24; h++) {
    agg.hourTotals[h] += s.hourTotals[h];
    agg.hourSteps[h] += s.hourSteps[h];
  }
}

function toSlimSession(s) {
  return {
    cid: s.cid, title: s.title, updatedMs: s.updatedMs, turns: s.turns,
    input: s.input, cache: s.cache, output: s.output, total: s.total,
    model: s.model, actualUsd: s.actualUsd, noCacheUsd: s.noCacheUsd, savedUsd: s.savedUsd,
    workspace: s.workspace || '', source: s.source || 'antigravity',
  };
}

function assemblePayload(sessions, agg, sortBy, now) {
  const cmp = sortBy === 'tokens' ? (a, b) => b.total - a.total : (a, b) => b.updatedMs - a.updatedMs;
  const hours = buildHours(agg.hourTotals, agg.hourSteps);
  const health = buildHealth(sessions);
  const totalToolCalls = sumToolCalls(agg.toolMap);
  return {
    schemaVersion: 2, source: 'antigravity',
    sessions: [...sessions].sort(cmp).map(toSlimSession),
    periods: agg.periods,
    forecast: buildForecast(agg.periods),
    daily: buildDaily(agg.allDays, now),
    heatmap: buildHeatmap(agg.allDays, agg.daySessions, now),
    hours,
    weekSplit: buildWeekSplit(agg.allDays),
    models: [...agg.modelMap.values()].sort((a, b) => b.total - a.total),
    tools: buildTools(agg.toolMap),
    projects: buildProjects(sessions),
    radar: detectLocalTools(),
    health,
    funStats: buildFunStats(agg.periods.all),
    hallOfFame: buildHallOfFame(sessions),
    achievements: buildAchievements({ all: agg.periods.all, hours, health, maxTurnSteps: agg.maxTurnSteps, totalToolCalls }),
  };
}

export function buildOverviewPayload(sortBy = 'recent', cycleOpts = {}) {
  const now = new Date();
  const brainDir = join(resolveAppData(), 'brain');
  if (!existsSync(brainDir)) return emptyOverviewPayload(now, cycleOpts);
  const sessions = loadAllSessions(brainDir);
  const cycle = cycleMeta(now, cycleOpts.cycleType, cycleOpts.resetDay);
  const ctx = { todayKey: dateKey(now.getTime()), weekSet: new Set(lastNDays(7, now)), cycle };
  const agg = createGlobalAgg(cycle);
  for (const s of sessions) {
    addIntoBucket(agg.periods.all, s);
    mergeSessionDays(s, agg, ctx);
    mergeSessionStats(s, agg);
    agg.maxTurnSteps = Math.max(agg.maxTurnSteps, s.maxTurnSteps);
  }
  return assemblePayload(sessions, agg, sortBy, now);
}

export function normalizeRange(range) {
  return VALID_RANGES.has(range) ? range : 'all';
}

function filterSessionsByRange(sessions, safeRange, now, cycleOpts = {}) {
  const sorted = [...sessions].sort((a, b) => b.updatedMs - a.updatedMs);
  if (safeRange === 'all') return sorted;
  if (safeRange === 'month') {
    const cy = cycleMeta(now, cycleOpts.cycleType, cycleOpts.resetDay);
    return sorted.filter((s) => {
      const k = dateKey(s.updatedMs);
      return k >= cy.startKey && k <= cy.endKey;
    });
  }
  const days30 = new Set(lastNDays(30, now));
  return sorted.filter((s) => days30.has(dateKey(s.updatedMs)));
}

function summarizeExport(sessions) {
  const acc = emptyBucket();
  for (const s of sessions) addIntoBucket(acc, s);
  return {
    sessions: sessions.length, turns: acc.turns,
    input: acc.input, cache: acc.cache, output: acc.output, total: acc.total,
    actualUsd: Number(acc.actualUsd.toFixed(4)), savedUsd: Number(acc.savedUsd.toFixed(4)),
  };
}

export function buildExportData(range = 'all', cycleOpts = {}) {
  const now = new Date();
  const safeRange = normalizeRange(range);
  const filtered = filterSessionsByRange(loadSessionsSafe(), safeRange, now, cycleOpts);
  return {
    schemaVersion: 2, source: 'antigravity',
    exportedAt: now.toISOString(), range: safeRange,
    summary: summarizeExport(filtered),
    sessions: filtered.map((s) => ({ date: dateKey(s.updatedMs), ...toSlimSession(s) })),
  };
}

function csvCell(val) {
  const s = String(val ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function sessionCsvRow(s) {
  return [
    s.date, s.cid, s.title, s.workspace || '', s.model || '', s.turns,
    s.input, s.cache, s.output, s.total,
    Number(s.actualUsd || 0).toFixed(4), Number(s.savedUsd || 0).toFixed(4),
    s.source || 'antigravity',
  ].map(csvCell).join(',');
}

export function buildExportCsv(range = 'all', cycleOpts = {}) {
  const data = buildExportData(range, cycleOpts);
  const lines = [CSV_HEADERS.join(','), ...data.sessions.map(sessionCsvRow)];
  return `\uFEFF${lines.join('\n')}`;
}
