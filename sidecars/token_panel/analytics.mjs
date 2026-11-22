/**
 * Pure analytics builders for global overview metrics, heatmap, schedule, projects, health, and achievements.
 */
import { mergeCost } from './pricing.mjs';
import { detectLocalTools } from './radar.mjs';

const PERSONAS = [
  { id: 'night_owl', match: (h) => h >= 22 || h <= 4, label: '深夜炼丹师', desc: '夜深人静灵感爆发，越夜越高效' },
  { id: 'early_bird', match: (h) => h >= 5 && h <= 10, label: '早起卷王', desc: '晨光微熹即刻开工，抢占全天先机' },
  { id: 'afternoon_pro', match: (h) => h >= 11 && h <= 17, label: '午后高产型', desc: '白昼稳健输出，黄金时段火力全开' },
  { id: 'evening_sprinter', match: () => true, label: '晚间冲刺手', desc: '晚间余热不减，高效冲刺收尾大师' },
];

export function dateKey(ms) {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function emptyBucket() {
  return { input: 0, cache: 0, output: 0, total: 0, turns: 0, actualUsd: 0, noCacheUsd: 0, savedUsd: 0 };
}

export function addIntoBucket(dst, src) {
  dst.input += src.input;
  dst.cache += src.cache;
  dst.output += src.output;
  dst.total += src.total;
  dst.turns += src.turns || 0;
  mergeCost(dst, src);
}

export function lastNDays(n, now = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(dateKey(d.getTime()));
  }
  return out;
}

export function monthMeta(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return {
    prefix: `${y}-${String(m).padStart(2, '0')}-`,
    daysElapsed: now.getDate(),
    daysInMonth: new Date(y, m, 0).getDate(),
  };
}

export function normalizeCycleConfig(cycleType, resetDay) {
  const type = cycleType === 'weekly' ? 'weekly' : 'monthly';
  const maxDay = type === 'weekly' ? 7 : 31;
  const n = Math.round(Number(resetDay));
  const day = Number.isFinite(n) && n >= 1 && n <= maxDay ? n : 1;
  return { type, resetDay: day };
}

function clampedMonthDate(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

function monthlyCycleBounds(todayStart, resetDay) {
  const y = todayStart.getFullYear();
  const m = todayStart.getMonth();
  const thisReset = clampedMonthDate(y, m, resetDay);
  const start = todayStart >= thisReset ? thisReset : clampedMonthDate(y, m - 1, resetDay);
  const nextReset = todayStart >= thisReset ? clampedMonthDate(y, m + 1, resetDay) : thisReset;
  return { start, nextReset };
}

function weeklyCycleBounds(todayStart, resetDay) {
  const dow = todayStart.getDay() || 7;
  const diff = (dow - resetDay + 7) % 7;
  const start = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() - diff);
  const nextReset = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return { start, nextReset };
}

export function cycleMeta(now = new Date(), cycleType = 'monthly', resetDay = 1) {
  const cfg = normalizeCycleConfig(cycleType, resetDay);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const { start, nextReset } = cfg.type === 'weekly'
    ? weeklyCycleBounds(todayStart, cfg.resetDay)
    : monthlyCycleBounds(todayStart, cfg.resetDay);
  const end = new Date(nextReset.getFullYear(), nextReset.getMonth(), nextReset.getDate() - 1);
  const daysInCycle = Math.max(1, Math.round((nextReset - start) / 86400000));
  const daysElapsed = Math.max(1, Math.min(daysInCycle, Math.round((todayStart - start) / 86400000) + 1));
  return {
    type: cfg.type,
    resetDay: cfg.resetDay,
    startKey: dateKey(start.getTime()),
    endKey: dateKey(end.getTime()),
    daysElapsed,
    daysInCycle,
    isCustom: cfg.type !== 'monthly' || cfg.resetDay !== 1,
  };
}

export function buildForecast(periods) {
  const rawDailyUsd = periods.week.actualUsd / 7;
  const dailyAvgTokens = Math.round(periods.week.total / 7);
  const dailyAvgUsd = Number(rawDailyUsd.toFixed(4));
  const rem = Math.max(0, periods.month.daysInMonth - periods.month.daysElapsed);
  const eomTokens = Math.round(periods.month.total + dailyAvgTokens * rem);
  const eomUsd = Number((periods.month.actualUsd + rawDailyUsd * rem).toFixed(4));
  return { dailyAvgTokens, dailyAvgUsd, eomTokens, eomUsd };
}

export function buildDaily(allDays, now = new Date()) {
  return lastNDays(14, now).map((date) => {
    const b = allDays.get(date) || emptyBucket();
    return {
      date, total: b.total, input: b.input, cache: b.cache,
      output: b.output, turns: b.turns, actualUsd: b.actualUsd, savedUsd: b.savedUsd,
    };
  });
}

function calcLevel(total, sorted) {
  if (!total || !sorted.length) return 0;
  const rank = sorted.lastIndexOf(total) + 1;
  return Math.min(4, Math.max(1, Math.ceil((rank / sorted.length) * 4)));
}

function calcCurrentStreak(days) {
  let idx = days.length - 1;
  if (idx >= 0 && days[idx].total === 0) idx -= 1;
  let streak = 0;
  while (idx >= 0 && days[idx].total > 0) {
    streak += 1;
    idx -= 1;
  }
  return streak;
}

function calcLongestStreak(days) {
  let best = 0;
  let cur = 0;
  for (const d of days) {
    cur = d.total > 0 ? cur + 1 : 0;
    if (cur > best) best = cur;
  }
  return best;
}

function findBestDay(days) {
  let best = { date: '', total: 0, actualUsd: 0 };
  for (const d of days) {
    if (d.total > best.total) best = { date: d.date, total: d.total, actualUsd: d.actualUsd };
  }
  return best;
}

export function buildHeatmap(allDays, daySessions, now = new Date()) {
  const raw = lastNDays(91, now).map((date) => {
    const b = allDays.get(date) || emptyBucket();
    return { date, total: b.total, sessions: daySessions.get(date) || 0, turns: b.turns, actualUsd: b.actualUsd };
  });
  const sorted = raw.map((d) => d.total).filter((v) => v > 0).sort((a, b) => a - b);
  const days = raw.map((d) => ({ ...d, level: calcLevel(d.total, sorted) }));
  return {
    days,
    currentStreak: calcCurrentStreak(days),
    longestStreak: calcLongestStreak(days),
    bestDay: findBestDay(days),
  };
}

function resolvePersona(peakHour, hasActivity) {
  if (!hasActivity) return { id: 'idle', label: '蓄势待发', desc: '暂无足够时段活跃记录' };
  const found = PERSONAS.find((p) => p.match(peakHour));
  return { id: found.id, label: found.label, desc: found.desc };
}

export function buildHours(hourTotals, hourSteps) {
  const buckets = [];
  let peakHour = 0;
  for (let hour = 0; hour < 24; hour++) {
    const total = hourTotals[hour] || 0;
    buckets.push({ hour, total, steps: hourSteps[hour] || 0 });
    if (total > buckets[peakHour].total) peakHour = hour;
  }
  return { buckets, peakHour, persona: resolvePersona(peakHour, buckets[peakHour].total > 0) };
}

function isWeekendDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 0 || dow === 6;
}

function finishSplit(bucket) {
  const avgPerDay = bucket.activeDays ? Math.round(bucket.total / bucket.activeDays) : 0;
  return { total: bucket.total, activeDays: bucket.activeDays, avgPerDay };
}

export function buildWeekSplit(allDays) {
  const weekday = { total: 0, activeDays: 0 };
  const weekend = { total: 0, activeDays: 0 };
  for (const [date, b] of allDays) {
    if (!b.total) continue;
    const dst = isWeekendDate(date) ? weekend : weekday;
    dst.total += b.total;
    dst.activeDays += 1;
  }
  return { weekday: finishSplit(weekday), weekend: finishSplit(weekend) };
}

export function sumToolCalls(toolMap) {
  let total = 0;
  for (const t of toolMap.values()) total += t.count;
  return total;
}

export function buildTools(toolMap) {
  return [...toolMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((t) => ({
      name: t.name,
      count: t.count,
      errors: t.errors,
      errorRate: t.count ? Number(((t.errors / t.count) * 100).toFixed(1)) : 0,
    }));
}

function emptyProject(name) {
  return { name, sessions: 0, turns: 0, input: 0, cache: 0, output: 0, total: 0, actualUsd: 0, savedUsd: 0 };
}

function addSessionToProject(map, s) {
  const name = s.workspace || '__other__';
  if (name === '__other__' && !s.total) return;
  const p = map.get(name) || emptyProject(name);
  p.sessions += 1;
  p.turns += s.turns || 0;
  p.input += s.input || 0;
  p.cache += s.cache || 0;
  p.output += s.output || 0;
  p.total += s.total || 0;
  p.actualUsd += s.actualUsd || 0;
  p.savedUsd += s.savedUsd || 0;
  map.set(name, p);
}

function finalizeProject(p) {
  const totalIn = p.input + p.cache;
  const cacheRate = totalIn ? Number(((p.cache / totalIn) * 100).toFixed(1)) : 0;
  return { ...p, cacheRate };
}

export function buildProjects(sessions) {
  const map = new Map();
  for (const s of sessions || []) addSessionToProject(map, s);
  return [...map.values()]
    .filter((p) => p.sessions > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(finalizeProject);
}

function safeAvg(sum, count, decimals) {
  if (!count) return 0;
  return decimals ? Number((sum / count).toFixed(decimals)) : Math.round(sum / count);
}

function findMaxTurnsSession(sessions) {
  let best = { cid: '', title: '', turns: 0 };
  for (const s of sessions) {
    if (s.turns > best.turns) best = { cid: s.cid, title: s.title, turns: s.turns };
  }
  return best;
}

export function buildHealth(sessions) {
  let sumTurns = 0;
  let sumPeak = 0;
  let peakCount = 0;
  let totalCompacts = 0;
  for (const s of sessions) {
    sumTurns += s.turns;
    totalCompacts += s.compacts;
    if (s.peakCtx > 0) { sumPeak += s.peakCtx; peakCount += 1; }
  }
  return {
    totalSessions: sessions.length,
    avgTurns: safeAvg(sumTurns, sessions.length, 1),
    avgPeakCtx: safeAvg(sumPeak, peakCount, 0),
    totalCompacts,
    maxTurnsSession: findMaxTurnsSession(sessions),
  };
}

export function buildFunStats(all) {
  return {
    threeBodyBooks: Number(((all.input + all.cache) / 500000).toFixed(1)),
    codeLines: Math.round(all.output / 15),
  };
}

export function buildHallOfFame(sessions) {
  const topSessions = [...sessions]
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map(({ cid, title, total, actualUsd, turns }) => ({ cid, title, total, actualUsd, turns }));
  const allTurns = [];
  for (const s of sessions) allTurns.push(...s.topTurns);
  const topTurns = allTurns.sort((a, b) => b.durationSec - a.durationSec).slice(0, 3);
  return { topSessions, topTurns };
}

function fmtShort(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

function badge(id, icon, name, desc, unlocked, progress, cur, target) {
  return { id, icon, name, desc, unlocked, progress, cur, target };
}

export function buildAchievements({ all, hours, health, maxTurnSteps, totalToolCalls }) {
  const totalIn = all.input + all.cache;
  const cacheRate = totalIn ? (all.cache / totalIn) * 100 : 0;
  const nightSteps = hours.buckets[2].steps + hours.buckets[3].steps + hours.buckets[4].steps;
  const maxTurns = health.maxTurnsSession.turns;
  return [
    badge('million_club', '💎', '百万俱乐部', '累计消耗达到 1M Tokens', all.total >= 1e6, `${fmtShort(all.total)} / 1M`, all.total, 1e6),
    badge('ten_million_driver', '🚀', '千万老司机', '累计消耗达到 10M Tokens', all.total >= 1e7, `${fmtShort(all.total)} / 10M`, all.total, 1e7),
    badge('cache_master', '⚡', '缓存大师', '全局缓存命中率达到 85%', cacheRate >= 85, `${cacheRate.toFixed(1)}% / 85%`, Number(cacheRate.toFixed(1)), 85),
    badge('night_owl', '🦉', '深夜不眠人', '凌晨 02:00-04:59 有活跃记录', nightSteps > 0, nightSteps > 0 ? `${nightSteps} 步` : '暂无凌晨记录', nightSteps, 1),
    badge('sharpshooter', '🎯', '百步穿杨', '单轮对话执行达到 20 步以上', maxTurnSteps >= 20, `${maxTurnSteps} / 20 步`, maxTurnSteps, 20),
    badge('marathoner', '🏃', '马拉松选手', '单个会话达到 50 轮以上', maxTurns >= 50, `${maxTurns} / 50 轮`, maxTurns, 50),
    badge('tool_maniac', '🛠️', '工具狂魔', '累计调用工具达到 500 次', totalToolCalls >= 500, `${totalToolCalls} / 500 次`, totalToolCalls, 500),
    badge('money_saver', '💰', '省钱达人', '缓存累计节省费用达到 $50', all.savedUsd >= 50, `$${all.savedUsd.toFixed(2)} / $50`, Number(all.savedUsd.toFixed(2)), 50),
  ];
}

export function emptyOverviewPayload(now = new Date(), cycleOpts = {}) {
  const cy = cycleMeta(now, cycleOpts.cycleType, cycleOpts.resetDay);
  const periods = {
    today: emptyBucket(),
    week: emptyBucket(),
    month: {
      ...emptyBucket(),
      daysElapsed: cy.daysElapsed,
      daysInMonth: cy.daysInCycle,
      cycleStart: cy.startKey,
      cycleEnd: cy.endKey,
      cycleType: cy.type,
      resetDay: cy.resetDay,
      isCustomCycle: cy.isCustom,
    },
    all: emptyBucket(),
  };
  const hours = buildHours(new Array(24).fill(0), new Array(24).fill(0));
  const health = buildHealth([]);
  return {
    schemaVersion: 2, source: 'antigravity',
    sessions: [], periods, forecast: buildForecast(periods),
    daily: buildDaily(new Map(), now), heatmap: buildHeatmap(new Map(), new Map(), now),
    hours, weekSplit: buildWeekSplit(new Map()), models: [], tools: [], projects: [],
    radar: detectLocalTools(),
    health, funStats: buildFunStats(periods.all), hallOfFame: buildHallOfFame([]),
    achievements: buildAchievements({ all: periods.all, hours, health, maxTurnSteps: 0, totalToolCalls: 0 }),
  };
}
