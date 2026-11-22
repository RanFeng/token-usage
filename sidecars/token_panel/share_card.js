/**
 * Pure HTML5 Canvas 2D shareable PNG card generator (2x Retina, dark/light themes).
 * Classic browser IIFE exposing window.TokenShareCard (zero external dependencies).
 */
(() => {
const W = 460;
const SCALE = 2;
const PX = 20;
const IW = W - PX * 2;
const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const FONT_MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

const COPY = {
  brand: ['Token Usage', 'Token Usage'],
  roiTitle: ['💳 订阅回本 ROI', '💳 Monthly ROI'],
  monthTokens: ['本月消耗', 'Month'],
  dayPrefix: ['本月第 ', 'Day '],
  daySuffix: [' 天', ''],
  cacheHit: ['缓存命中', 'Cache'],
  kpiTotal: ['⚡ 累计消耗', '⚡ Total Tokens'],
  kpiSaved: ['💰 缓存节省', '💰 Cache Saved'],
  coffees: ['杯咖啡', 'coffees'],
  kpiStreak: ['🔥 活跃连击', '🔥 Active Streak'],
  days: ['天', 'd'],
  longest: ['最长', 'Best'],
  kpiPersona: ['🕒 编程作息', '🕒 Coding Persona'],
  peakHour: ['峰值', 'Peak'],
  personaIdle: ['作息观察中', 'Warming Up'],
  hmTitle: ['🗓 90 天活跃热力图', '🗓 90-Day Activity'],
  hmLess: ['少', 'Less'],
  hmMore: ['多', 'More'],
  hmActive: ['活跃天数', 'Active Days'],
  hmBest: ['单日最高', 'Best Day'],
  hmSessions: ['总会话数', 'Sessions'],
  none: ['暂无', 'N/A'],
  modelsTitle: ['🤖 主力模型 Top 3', '🤖 Top Models'],
  modelsUnit: ['个模型', 'models'],
  noModels: ['暂无模型记录', 'No model data yet'],
  noBadges: ['继续探索解锁更多徽章', 'Keep coding to unlock badges'],
  diagTitle: ['单会话脱敏诊断图', 'Session Diagnostic Snapshot'],
  desensitized: ['🔒 已脱敏', '🔒 Desensitized'],
  kpiTurns: ['💬 对话轮次', '💬 Turns'],
  steps: ['步', 'steps'],
  kpiSessTokens: ['⚡ 会话总消耗', '⚡ Session Tokens'],
  kpiCache: ['🎯 缓存命中率', '🎯 Cache Hit'],
  cached: ['命中', 'Cached'],
  kpiCost: ['💳 参考费用', '💳 Ref Cost'],
  saved: ['已省', 'Saved'],
  curveTitle: ['📈 上下文增长曲线', '📈 Context Growth'],
  peak: ['峰值', 'Peak'],
  step1: ['第 1 步', 'Step 1'],
  latest: ['最新', 'Latest'],
  redDot: ['红点=Compact', 'Red=Compact'],
  curveEmpty: ['暂无足够上下文历史点', 'Not enough context history'],
  diagModels: ['🤖 模型归因', '🤖 Models'],
  diagTools: ['🛠 高频工具 Top 4', '🛠 Top Tools'],
  noTools: ['暂无工具调用记录', 'No tool calls'],
};

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pad2 = (n) => String(Math.floor(num(n))).padStart(2, '0');
const txt = (lang, key) => (COPY[key] || ['', ''])[lang === 'en' ? 1 : 0];
const safeFn = (fn, fallback) => (typeof fn === 'function' ? fn : fallback);

function defaultFmtMoney(v) {
  const n = Math.max(0, num(v));
  if (n <= 0) return '$0.00';
  return n < 0.01 ? '<$0.01' : `$${n.toFixed(2)}`;
}

function shortNum(n) {
  const v = Math.max(0, num(n));
  if (v < 1000) return String(Math.round(v));
  if (v < 1e6) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return `${(v / 1e6).toFixed(2).replace(/\.?0+$/, '')}M`;
}

function pctNum(part, total) {
  return total > 0 ? ((part / total) * 100).toFixed(1) : '0.0';
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function normOpts(raw) {
  const o = raw || {};
  const th = window.TokenSharePrefs.resolveTheme(o.theme, o.colors);
  return {
    planUsd: Math.max(1, Math.round(num(o.planUsd) || 20)),
    theme: th,
    lang: o.lang === 'en' ? 'en' : 'zh',
    modules: Array.isArray(o.modules) && o.modules.length ? o.modules : null,
    fmtMoney: safeFn(o.fmtMoney, defaultFmtMoney),
    t: safeFn(o.t, null),
    repoLabel: o.repoLabel || 'github.com/RanFeng/token-usage',
    version: o.version || '1.1.0',
  };
}

function createCanvas(h) {
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = h * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  return { canvas, ctx };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fillBox(ctx, x, y, w, h, r, fill, stroke) {
  roundRectPath(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

function hGrad(ctx, x, w, c0, c1) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

function fontSpec(size, weight, mono) {
  return `${weight || 400} ${size}px ${mono ? FONT_MONO : FONT_SANS}`;
}

function drawText(ctx, str, x, y, cfg) {
  const c = cfg || {};
  ctx.font = fontSpec(c.size || 12, c.weight || 400, c.mono);
  ctx.fillStyle = c.color || '#ffffff';
  ctx.textAlign = c.align || 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(String(str), x, y);
}

function fitText(ctx, str, maxW) {
  const s = String(str || '');
  if (ctx.measureText(s).width <= maxW) return s;
  let end = s.length;
  while (end > 1 && ctx.measureText(`${s.slice(0, end)}…`).width > maxW) end -= 1;
  return `${s.slice(0, end)}…`;
}

function drawPill(ctx, label, x, y, cfg) {
  const c = cfg || {};
  const sz = c.size || 10.5;
  ctx.font = fontSpec(sz, 600, c.mono);
  const pw = Math.ceil(ctx.measureText(label).width) + 18;
  const ph = c.h || 22;
  const rx = c.alignRight ? x - pw : x;
  fillBox(ctx, rx, y, pw, ph, ph / 2, c.bg, c.border);
  drawText(ctx, label, rx + pw / 2, y + Math.floor((ph - sz) / 2), {
    size: sz, weight: 600, mono: c.mono, color: c.color, align: 'center',
  });
  return pw;
}

function drawDivider(ctx, x, y, w, color) {
  ctx.beginPath();
  ctx.moveTo(x, y + 0.5);
  ctx.lineTo(x + w, y + 0.5);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBg(ctx, h, th) {
  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, W, h);
  ctx.fillStyle = hGrad(ctx, 0, W, th.pillStart, th.pillEnd);
  ctx.fillRect(0, 0, W, 4);
}

function drawFooter(ctx, h, label, th) {
  ctx.save();
  ctx.globalAlpha = 0.72;
  drawText(ctx, label, W / 2, h - 22, { size: 9.5, color: th.muted, align: 'center' });
  ctx.restore();
}

function drawProgressBar(ctx, x, y, w, h, pct, th, isGold) {
  fillBox(ctx, x, y, w, h, h / 2, th.track, null);
  if (pct <= 0) return;
  const fw = Math.min(w, Math.max(h, (pct / 100) * w));
  const fill = isGold
    ? hGrad(ctx, x, fw, th.goldStart, th.goldEnd)
    : hGrad(ctx, x, fw, th.pillStart, th.pillEnd);
  fillBox(ctx, x, y, fw, h, h / 2, fill, null);
}

function drawKpiBox(ctx, x, y, item, th) {
  fillBox(ctx, x, y, 205, 62, 12, th.card, th.border);
  drawText(ctx, item.label, x + 12, y + 10, { size: 10.5, weight: 500, color: th.muted });
  const sz = item.size || 18;
  ctx.font = fontSpec(sz, 700, item.mono);
  drawText(ctx, fitText(ctx, item.value, 181), x + 12, y + 26, {
    size: sz, weight: 700, mono: item.mono, color: item.color || th.text,
  });
  ctx.font = fontSpec(10, 400, false);
  drawText(ctx, fitText(ctx, item.sub, 181), x + 12, y + 47, { size: 10, color: th.muted });
}

function drawModelBarRow(ctx, m, maxM, idx, y, opts) {
  const th = opts.theme;
  const palette = [th.blue, th.green, th.amber];
  const rightStr = `${shortNum(m.total)} · ${opts.fmtMoney(m.actualUsd)}`;
  ctx.font = fontSpec(10, 500, true);
  const rw = ctx.measureText(rightStr).width;
  ctx.font = fontSpec(10.5, 500, false);
  const name = fitText(ctx, m.model || 'unknown', Math.max(80, 388 - rw - 10));
  drawText(ctx, name, 36, y, { size: 10.5, weight: 500, color: th.text });
  drawText(ctx, rightStr, W - 36, y + 0.5, { size: 10, weight: 500, mono: true, color: th.muted, align: 'right' });
  fillBox(ctx, 36, y + 14, 388, 5, 2.5, th.track, null);
  const bw = Math.min(388, Math.max(6, (num(m.total) / maxM) * 388));
  fillBox(ctx, 36, y + 14, bw, 5, 2.5, palette[idx % 3], null);
}

/* ==================== Overview Card ==================== */

function drawBrandLogo(ctx, x, y, size) {
  const s = size / 128;
  const deg = (d) => (d * Math.PI) / 180;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.lineWidth = 11;
  ctx.strokeStyle = 'rgba(148,163,184,0.24)';
  ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2); ctx.stroke();
  [[-95, 125, true, '#2563EB'], [-70, 30, false, '#059669'], [48, 106, false, '#D97706']].forEach(([a0, a1, ccw, color]) => {
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.arc(64, 64, 50, deg(a0), deg(a1), ccw); ctx.stroke();
  });
  ctx.beginPath();
  [[64, 32], [91.7, 48], [91.7, 80], [64, 96], [36.3, 80], [36.3, 48]].forEach(([px, py], i) => (
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  ));
  ctx.closePath();
  ctx.fillStyle = 'rgba(15,23,42,0.12)'; ctx.fill();
  ctx.strokeStyle = 'rgba(100,116,139,0.45)'; ctx.lineWidth = 2.5; ctx.stroke();
  [[48, 61, 19, '#2563EB'], [60.25, 48, 32, '#059669'], [72.5, 56, 24, '#D97706']].forEach(([bx, by, bh, c]) => {
    fillBox(ctx, bx, by, 7.5, bh, 3.75, c, null);
  });
  ctx.restore();
}

function drawToolIcon(ctx, source, x, y, size, th) {
  fillBox(ctx, x, y, size, size, 6, th.card, th.border);
  const pad = 3.5;
  const inner = size - pad * 2;
  const isDark = th.text === '#f8fafc';
  const img = window.TokenAgentIcons?.getImg?.(source || 'antigravity', isDark);
  if (!img) return;
  const paint = () => { try { ctx.drawImage(img, x + pad, y + pad, inner, inner); } catch {} };
  if (img.complete && img.naturalWidth > 0) paint();
  else img.addEventListener?.('load', paint, { once: true });
}

function drawOverviewHeader(ctx, ov, opts) {
  const th = opts.theme;
  drawBrandLogo(ctx, PX, 20, 22);
  const grad = hGrad(ctx, PX + 28, 146, th.pillStart, th.pillEnd);
  const pw = drawPill(ctx, txt(opts.lang, 'brand'), PX + 28, 20, { bg: grad, color: '#ffffff', size: 10.5 });
  drawToolIcon(ctx, ov.source || 'antigravity', PX + 28 + pw + 8, 20, 22, th);
  const vw = drawPill(ctx, `v${opts.version}`, W - PX, 20, { bg: th.card, border: th.border, color: th.muted, mono: true, size: 10, alignRight: true });
  drawText(ctx, todayStr(), W - PX - vw - 8, 25, { size: 10.5, mono: true, color: th.muted, align: 'right' });
}

function roiInfo(month, planUsd) {
  const actual = Math.max(0, num(month.actualUsd));
  const ratio = actual / planUsd;
  const pct = Math.min(100, ratio * 100);
  const paid = actual >= planUsd;
  const badge = paid ? `🏆 ${ratio.toFixed(1)}× ROI` : `${Math.round(pct)}% ROI`;
  return { actual, pct, paid, badge };
}

function drawRoiCard(ctx, ov, opts) {
  const th = opts.theme;
  const month = (ov.periods && ov.periods.month) || {};
  const info = roiInfo(month, opts.planUsd);
  fillBox(ctx, PX, 84, IW, 116, 14, th.card, info.paid ? th.amber : th.border);
  drawText(ctx, txt(opts.lang, 'roiTitle'), 36, 98, { size: 11.5, weight: 600, color: th.muted });
  const pillCfg = info.paid
    ? { bg: th.amberSoft, color: th.amber, alignRight: true }
    : { bg: th.blueSoft, color: th.blue, alignRight: true };
  drawPill(ctx, info.badge, W - 36, 94, pillCfg);
  const mainAmt = opts.fmtMoney(info.actual);
  ctx.font = fontSpec(22, 700, true);
  const aw = ctx.measureText(mainAmt).width;
  drawText(ctx, mainAmt, 36, 124, { size: 22, weight: 700, mono: true, color: th.text });
  drawText(ctx, `/ ${opts.fmtMoney(opts.planUsd)}`, 36 + aw + 6, 133, { size: 11.5, mono: true, color: th.muted });
  drawText(ctx, `${txt(opts.lang, 'monthTokens')} ${shortNum(month.total)}`, W - 36, 133, { size: 11, mono: true, color: th.muted, align: 'right' });
  drawProgressBar(ctx, 36, 162, 388, 9, info.pct, th, info.paid);
  const dayStr = `${txt(opts.lang, 'dayPrefix')}${num(month.daysElapsed)}/${num(month.daysInMonth) || 30}${txt(opts.lang, 'daySuffix')}`;
  const mIn = num(month.input) + num(month.cache);
  drawText(ctx, dayStr, 36, 180, { size: 10, color: th.muted });
  drawText(ctx, `${txt(opts.lang, 'cacheHit')} ${pctNum(num(month.cache), mIn)}%`, W - 36, 180, { size: 10, weight: 600, color: th.green, align: 'right' });
}

function resolvePersona(hours, opts) {
  const p = (hours && hours.persona) || {};
  const id = p.id || '';
  if (id && opts.t) {
    const key = `persona.${id}`;
    const localized = opts.t(key);
    if (localized && localized !== key) return localized;
  }
  return p.label || txt(opts.lang, 'personaIdle');
}

function drawOverviewKpis(ctx, ov, opts) {
  const th = opts.theme;
  const lang = opts.lang;
  const all = (ov.periods && ov.periods.all) || {};
  const hm = ov.heatmap || {};
  const hours = ov.hours || {};
  const allIn = num(all.input) + num(all.cache);
  const coffees = (Math.max(0, num(all.savedUsd)) / 5).toFixed(1);
  drawKpiBox(ctx, 20, 212, {
    label: txt(lang, 'kpiTotal'), value: shortNum(all.total), mono: true,
    sub: `↑${shortNum(allIn)}  ↓${shortNum(all.output)}`,
  }, th);
  drawKpiBox(ctx, 235, 212, {
    label: txt(lang, 'kpiSaved'), value: opts.fmtMoney(all.savedUsd), color: th.green, mono: true,
    sub: `☕ ${coffees} ${txt(lang, 'coffees')}`,
  }, th);
  drawKpiBox(ctx, 20, 284, {
    label: txt(lang, 'kpiStreak'), value: `${num(hm.currentStreak)} ${txt(lang, 'days')}`, color: th.amber, mono: true,
    sub: `${txt(lang, 'longest')} ${num(hm.longestStreak)} ${txt(lang, 'days')}`,
  }, th);
  drawKpiBox(ctx, 235, 284, {
    label: txt(lang, 'kpiPersona'), value: resolvePersona(hours, opts), color: th.blue, size: 15,
    sub: `${txt(lang, 'peakHour')} ${pad2(hours.peakHour)}:00`,
  }, th);
}

function drawHmLegend(ctx, y, opts) {
  const th = opts.theme;
  const more = txt(opts.lang, 'hmMore');
  ctx.font = fontSpec(9.5, 400, false);
  const mw = ctx.measureText(more).width;
  drawText(ctx, more, W - 36, y, { size: 9.5, color: th.muted, align: 'right' });
  const startX = W - 36 - mw - 58;
  for (let i = 0; i < 5; i++) {
    fillBox(ctx, startX + i * 11, y + 1, 8, 8, 2, th.hm[i], null);
  }
  drawText(ctx, txt(opts.lang, 'hmLess'), startX - 5, y, { size: 9.5, color: th.muted, align: 'right' });
}

function drawHmGrid(ctx, days, th) {
  const offset = Math.max(0, 91 - days.length);
  for (let i = 0; i < 91; i++) {
    const day = i >= offset ? days[i - offset] : null;
    const lvl = day ? Math.max(0, Math.min(4, Math.round(num(day.level)))) : 0;
    fillBox(ctx, 36 + Math.floor(i / 7) * 14, 392 + (i % 7) * 13, 11, 10, 2.5, th.hm[lvl], null);
  }
}

function drawHmStats(ctx, ov, days, opts) {
  const th = opts.theme;
  const lang = opts.lang;
  const hm = ov.heatmap || {};
  const health = ov.health || {};
  const active = days.filter((d) => num(d.total) > 0).length;
  const best = hm.bestDay;
  const bestStr = best && num(best.total) > 0
    ? `${String(best.date || '').slice(5)} · ${shortNum(best.total)}`
    : txt(lang, 'none');
  fillBox(ctx, 230, 392, 194, 88, 10, th.cardAlt, th.border);
  const rows = [
    [txt(lang, 'hmActive'), `${active} / 91`],
    [txt(lang, 'hmBest'), bestStr],
    [txt(lang, 'hmSessions'), String(num(health.totalSessions))],
  ];
  rows.forEach(([k, v], i) => {
    const ry = 404 + i * 26;
    drawText(ctx, k, 242, ry, { size: 10, color: th.muted });
    drawText(ctx, v, 412, ry - 0.5, { size: 11, weight: 600, mono: true, color: th.text, align: 'right' });
  });
}

function drawHeatmapSection(ctx, ov, opts) {
  const th = opts.theme;
  const days = ((ov.heatmap && ov.heatmap.days) || []).slice(-91);
  fillBox(ctx, PX, 358, IW, 136, 14, th.card, th.border);
  drawText(ctx, txt(opts.lang, 'hmTitle'), 36, 371, { size: 11.5, weight: 600, color: th.text });
  drawHmLegend(ctx, 372, opts);
  drawHmGrid(ctx, days, th);
  drawHmStats(ctx, ov, days, opts);
}

function collectUnlockedBadges(ov, opts) {
  const list = ov.achievements || [];
  const month = (ov.periods && ov.periods.month) || {};
  const hasRoi = list.some((b) => b && b.id === 'roi_king');
  const icons = list.filter((b) => b && b.unlocked).map((b) => b.icon || '🏅');
  if (!hasRoi && num(month.actualUsd) >= opts.planUsd) icons.push('🏆');
  const total = list.length + (hasRoi ? 0 : 1);
  return { icons, unlocked: icons.length, total };
}

function drawBadgeRow(ctx, ov, opts) {
  const th = opts.theme;
  const b = collectUnlockedBadges(ov, opts);
  const pw = drawPill(ctx, `🏅 ${b.unlocked}/${b.total}`, 36, 620, { bg: th.amberSoft, color: th.amber, size: 10, h: 20 });
  if (b.icons.length) {
    drawText(ctx, b.icons.join('  '), 36 + pw + 10, 622, { size: 13, color: th.text });
    return;
  }
  drawText(ctx, txt(opts.lang, 'noBadges'), 36 + pw + 10, 624, { size: 10.5, color: th.muted });
}

function drawModelsAndBadges(ctx, ov, opts) {
  const th = opts.theme;
  const models = ov.models || [];
  const top = models.slice(0, 3);
  const maxM = Math.max(...top.map((m) => num(m.total)), 1);
  fillBox(ctx, PX, 506, IW, 144, 14, th.card, th.border);
  drawText(ctx, txt(opts.lang, 'modelsTitle'), 36, 519, { size: 11.5, weight: 600, color: th.text });
  drawText(ctx, `${models.length} ${txt(opts.lang, 'modelsUnit')}`, W - 36, 520, { size: 10, color: th.muted, align: 'right' });
  if (top.length) top.forEach((m, i) => drawModelBarRow(ctx, m, maxM, i, 540 + i * 23, opts));
  else drawText(ctx, txt(opts.lang, 'noModels'), W / 2, 566, { size: 11, color: th.muted, align: 'center' });
  drawDivider(ctx, 36, 612, 388, th.border);
  drawBadgeRow(ctx, ov, opts);
}

function drawSectionStack(ctx, placed) {
  placed.forEach((s) => { ctx.save(); ctx.translate(0, s.y - s.origY); s.draw(); ctx.restore(); });
}

function renderOverviewCard(overview, rawOpts) {
  const ov = overview || {};
  const opts = normOpts(rawOpts);
  const defs = [
    { id: 'roi', origY: 84, h: 116, draw: () => drawRoiCard(ctx, ov, opts) },
    { id: 'kpis', origY: 212, h: 134, draw: () => drawOverviewKpis(ctx, ov, opts) },
    { id: 'heatmap', origY: 360, h: 132, draw: () => drawHeatmapSection(ctx, ov, opts) },
    { id: 'models', origY: 506, h: 144, draw: () => drawModelsAndBadges(ctx, ov, opts) },
  ];
  const { placed, height } = window.TokenSharePrefs.layoutSections(defs, opts.modules, 56, 12);
  const { canvas, ctx } = createCanvas(height);
  drawBg(ctx, height, opts.theme);
  drawOverviewHeader(ctx, ov, opts);
  drawSectionStack(ctx, placed);
  drawFooter(ctx, height, `Generated by Token Usage v${opts.version} · ${opts.repoLabel}`, opts.theme);
  return canvas;
}

/* ==================== Session Diagnostic Card (100% Desensitized) ==================== */

function calcSessionSummary(u) {
  const turns = u.turns || [];
  const tot = u.totals || {};
  const cost = u.cost || {};
  const ctxInfo = u.context || {};
  const history = u.history || [];
  const tIn = num(tot.input) + num(tot.cache);
  const tOut = num(tot.output);
  const tCache = num(tot.cache);
  const totalErrors = turns.reduce((acc, item) => acc + num(item && item.errorCount), 0);
  const peakUsed = Math.max(num(ctxInfo.contextUsed), ...history.map((h) => num(h && h.used)), 0);
  const limit = num(ctxInfo.limit) || 1000000;
  return {
    shortId: String(u.conversationId || 'session').slice(0, 8),
    turns: turns.length, steps: history.length,
    tIn, tOut, tCache, tAll: tIn + tOut,
    actualUsd: num(cost.actualUsd), savedUsd: num(cost.savedUsd),
    totalErrors, peakUsed,
    peakPct: Math.min(100, Math.round((peakUsed / limit) * 100)),
  };
}

function drawDiagHeader(ctx, u, opts) {
  const th = opts.theme;
  drawBrandLogo(ctx, PX, 20, 22);
  const grad = hGrad(ctx, PX + 28, 146, th.pillStart, th.pillEnd);
  const pw = drawPill(ctx, txt(opts.lang, 'brand'), PX + 28, 20, { bg: grad, color: '#ffffff', size: 10.5 });
  drawToolIcon(ctx, u.source || 'antigravity', PX + 28 + pw + 8, 20, 22, th);
  const vw = drawPill(ctx, `v${opts.version}`, W - PX, 20, { bg: th.card, border: th.border, color: th.muted, mono: true, size: 10, alignRight: true });
  drawPill(ctx, txt(opts.lang, 'desensitized'), W - PX - vw - 6, 20, { bg: th.greenSoft, color: th.green, size: 10, alignRight: true });
}

function drawDiagKpis(ctx, m, opts) {
  const th = opts.theme;
  const lang = opts.lang;
  drawKpiBox(ctx, 20, 84, {
    label: txt(lang, 'kpiTurns'), value: String(m.turns), mono: true,
    sub: `${m.steps} ${txt(lang, 'steps')}`,
  }, th);
  drawKpiBox(ctx, 235, 84, {
    label: txt(lang, 'kpiSessTokens'), value: shortNum(m.tAll), mono: true,
    sub: `↑${shortNum(m.tIn)}  ↓${shortNum(m.tOut)}`,
  }, th);
  drawKpiBox(ctx, 20, 156, {
    label: txt(lang, 'kpiCache'), value: `${pctNum(m.tCache, m.tIn)}%`, color: th.green, mono: true,
    sub: `${txt(lang, 'cached')} ${shortNum(m.tCache)}`,
  }, th);
  drawKpiBox(ctx, 235, 156, {
    label: txt(lang, 'kpiCost'), value: opts.fmtMoney(m.actualUsd), color: th.blue, mono: true,
    sub: `${txt(lang, 'saved')} ${opts.fmtMoney(m.savedUsd)}`,
  }, th);
}

function buildCurvePoints(history, box) {
  const maxUsed = Math.max(...history.map((h) => num(h && h.used)), 1);
  const span = Math.max(1, history.length - 1);
  let compacts = 0;
  const pts = history.map((h, i) => {
    const used = num(h && h.used);
    const prev = i > 0 ? num(history[i - 1] && history[i - 1].used) : used;
    const isCompact = i > 0 && prev - used >= 20000 && used / prev <= 0.75;
    if (isCompact) compacts += 1;
    return { x: box.x + (i / span) * box.w, y: box.y + box.h - (used / maxUsed) * (box.h - 8), isCompact };
  });
  return { pts, maxUsed, compacts };
}

function drawCurveGrid(ctx, box, maxUsed, th) {
  ctx.save();
  if (typeof ctx.setLineDash === 'function') ctx.setLineDash([3, 3]);
  ctx.strokeStyle = th.border;
  ctx.lineWidth = 1;
  [0, 0.5, 1].forEach((r) => {
    const gy = box.y + r * box.h + 0.5;
    ctx.beginPath();
    ctx.moveTo(box.x, gy);
    ctx.lineTo(box.x + box.w, gy);
    ctx.stroke();
  });
  ctx.restore();
  drawText(ctx, shortNum(maxUsed), box.x + 2, box.y + 2, { size: 9, mono: true, color: th.muted });
  drawText(ctx, shortNum(maxUsed / 2), box.x + 2, box.y + box.h / 2 + 2, { size: 9, mono: true, color: th.muted });
}

function traceCurvePath(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
}

function drawCurvePlot(ctx, pts, box, th) {
  const grad = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  grad.addColorStop(0, th.curveTop);
  grad.addColorStop(1, th.curveBottom);
  traceCurvePath(ctx, pts);
  ctx.lineTo(pts[pts.length - 1].x, box.y + box.h);
  ctx.lineTo(pts[0].x, box.y + box.h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  traceCurvePath(ctx, pts);
  ctx.strokeStyle = th.blue;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function drawSingleDot(ctx, p, th) {
  ctx.beginPath();
  if (p.isCompact) {
    ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = th.red;
    ctx.fill();
    ctx.strokeStyle = th.card;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return;
  }
  ctx.arc(p.x, p.y, 2.3, 0, Math.PI * 2);
  ctx.fillStyle = th.blue;
  ctx.fill();
}

function drawCurveDots(ctx, pts, th) {
  const showAll = pts.length <= 28;
  pts.forEach((p) => {
    if (showAll || p.isCompact) drawSingleDot(ctx, p, th);
  });
}

function drawCurveCard(ctx, history, opts) {
  const th = opts.theme;
  const lang = opts.lang;
  const box = { x: 36, y: 266, w: 388, h: 92 };
  fillBox(ctx, PX, 228, IW, 160, 14, th.card, th.border);
  drawText(ctx, txt(lang, 'curveTitle'), 36, 241, { size: 11.5, weight: 600, color: th.text });
  if (history.length < 2) {
    drawText(ctx, txt(lang, 'curveEmpty'), W / 2, 306, { size: 11, color: th.muted, align: 'center' });
    return 0;
  }
  const { pts, maxUsed, compacts } = buildCurvePoints(history, box);
  const head = compacts > 0
    ? { text: `${txt(lang, 'peak')} ${shortNum(maxUsed)} · Compact ×${compacts}`, color: th.red }
    : { text: `${txt(lang, 'peak')} ${shortNum(maxUsed)}`, color: th.muted };
  drawText(ctx, head.text, W - 36, 242, { size: 10.5, mono: true, color: head.color, align: 'right' });
  drawCurveGrid(ctx, box, maxUsed, th);
  drawCurvePlot(ctx, pts, box, th);
  drawCurveDots(ctx, pts, th);
  drawText(ctx, txt(lang, 'step1'), 36, 368, { size: 9.5, color: th.muted });
  drawText(ctx, `${history.length} ${txt(lang, 'steps')} (${txt(lang, 'redDot')})`, W / 2, 368, { size: 9.5, color: th.muted, align: 'center' });
  drawText(ctx, txt(lang, 'latest'), W - 36, 368, { size: 9.5, color: th.muted, align: 'right' });
  return compacts;
}

function peakLevel(pct) {
  if (pct >= 85) return 'danger';
  if (pct >= 60) return 'warn';
  return 'info';
}

function tagColors(level, th) {
  const map = {
    danger: { bg: th.redSoft, fg: th.red },
    warn: { bg: th.amberSoft, fg: th.amber },
    ok: { bg: th.greenSoft, fg: th.green },
  };
  return map[level] || { bg: th.blueSoft, fg: th.blue };
}

function drawDiagTags(ctx, m, compacts, opts) {
  const th = opts.theme;
  const tags = [
    { text: `Peak ${m.peakPct}%`, level: peakLevel(m.peakPct) },
    { text: `Compact ×${compacts}`, level: compacts > 0 ? 'danger' : 'ok' },
    { text: `Errors ×${m.totalErrors}`, level: m.totalErrors > 0 ? 'warn' : 'ok' },
  ];
  let x = 36;
  tags.forEach((tag) => {
    const c = tagColors(tag.level, th);
    x += drawPill(ctx, tag.text, x, 412, { bg: c.bg, color: c.fg, size: 10, h: 20, mono: true }) + 8;
  });
}

function drawToolTile(ctx, tool, x, y, th) {
  fillBox(ctx, x, y, 188, 24, 6, th.cardAlt, th.border);
  const errs = num(tool && tool.errors);
  let rightEdge = x + 180;
  if (errs > 0) {
    const ew = drawPill(ctx, `!${errs}`, rightEdge, y + 4, { bg: th.redSoft, color: th.red, size: 9, h: 16, mono: true, alignRight: true });
    rightEdge -= ew + 5;
  }
  const cntStr = `×${num(tool && tool.count)}`;
  ctx.font = fontSpec(10, 600, true);
  const cw = ctx.measureText(cntStr).width;
  drawText(ctx, cntStr, rightEdge, y + 7, { size: 10, weight: 600, mono: true, color: th.muted, align: 'right' });
  ctx.font = fontSpec(10, 500, true);
  const name = fitText(ctx, (tool && tool.name) || 'tool', Math.max(40, rightEdge - cw - x - 14));
  drawText(ctx, name, x + 8, y + 7, { size: 10, weight: 500, mono: true, color: th.text });
}

function drawDiagModels(ctx, models, opts) {
  const th = opts.theme;
  const top = (models || []).slice(0, 3);
  const maxM = Math.max(...top.map((m) => num(m.total)), 1);
  drawText(ctx, txt(opts.lang, 'diagModels'), 36, 452, { size: 11, weight: 600, color: th.text });
  if (!top.length) {
    drawText(ctx, txt(opts.lang, 'noModels'), W / 2, 492, { size: 10.5, color: th.muted, align: 'center' });
    return;
  }
  top.forEach((m, i) => drawModelBarRow(ctx, m, maxM, i, 471 + i * 22, opts));
}

function drawDiagTools(ctx, tools, opts) {
  const th = opts.theme;
  const top = (tools || []).slice(0, 4);
  drawText(ctx, txt(opts.lang, 'diagTools'), 36, 548, { size: 11, weight: 600, color: th.text });
  if (!top.length) {
    drawText(ctx, txt(opts.lang, 'noTools'), W / 2, 582, { size: 10.5, color: th.muted, align: 'center' });
    return;
  }
  top.forEach((tool, i) => {
    drawToolTile(ctx, tool, 36 + (i % 2) * 200, 567 + Math.floor(i / 2) * 30, th);
  });
}

function drawDiagAttributionCard(ctx, u, m, compacts, opts) {
  const th = opts.theme;
  fillBox(ctx, PX, 398, IW, 234, 14, th.card, th.border);
  drawDiagTags(ctx, m, compacts, opts);
  drawDivider(ctx, 36, 442, 388, th.border);
  drawDiagModels(ctx, u.models, opts);
  drawDivider(ctx, 36, 540, 388, th.border);
  drawDiagTools(ctx, u.tools, opts);
}

function renderSessionDiagCard(usage, rawOpts) {
  const u = usage || {};
  const opts = normOpts(rawOpts);
  const m = calcSessionSummary(u);
  const history = u.history || [];
  const compacts = history.length >= 2 ? buildCurvePoints(history, { x: 36, y: 266, w: 388, h: 92 }).compacts : 0;
  const defs = [
    { id: 'kpis', origY: 84, h: 134, draw: () => drawDiagKpis(ctx, m, opts) },
    { id: 'curve', origY: 228, h: 160, draw: () => drawCurveCard(ctx, history, opts) },
    { id: 'attribution', origY: 398, h: 234, draw: () => drawDiagAttributionCard(ctx, u, m, compacts, opts) },
  ];
  const { placed, height } = window.TokenSharePrefs.layoutSections(defs, opts.modules, 56, 12);
  const { canvas, ctx } = createCanvas(height);
  drawBg(ctx, height, opts.theme);
  drawDiagHeader(ctx, u, opts);
  drawSectionStack(ctx, placed);
  drawFooter(ctx, height, `Token Usage v${opts.version} · ${opts.repoLabel}`, opts.theme);
  return canvas;
}

/* ==================== Clipboard & Download ==================== */

function sidecarPost(url, payload) {
  const fetcher = window.sidecar?.fetch || (typeof fetch === 'function' ? fetch : null);
  if (!fetcher) return Promise.resolve(null);
  return fetcher(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    if (!canvas || typeof canvas.toBlob !== 'function') return resolve(null);
    canvas.toBlob((blob) => resolve(blob || null), 'image/png');
  });
}

async function copyCanvasBrowser(canvas) {
  try {
    const clip = typeof navigator !== 'undefined' && navigator.clipboard;
    if (!clip || typeof clip.write !== 'function' || typeof ClipboardItem === 'undefined') return false;
    const blob = await canvasToBlob(canvas);
    if (!blob) return false;
    await clip.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}

async function copyCanvas(canvas) {
  if (!canvas || typeof canvas.toDataURL !== 'function') return false;
  if (await copyCanvasBrowser(canvas)) return true;
  const res = await sidecarPost('/api/clipboard', { type: 'image', dataUrl: canvas.toDataURL('image/png') });
  return Boolean(res && res.ok);
}

async function downloadCanvas(canvas, filename) {
  if (!canvas || typeof canvas.toDataURL !== 'function') return { ok: false };
  const name = filename || 'token-usage-card.png';
  const dataUrl = canvas.toDataURL('image/png');
  const saved = await sidecarPost('/api/export/save-image', { dataUrl, filename: name });
  if (saved && saved.ok) return saved;
  const link = document.createElement('a');
  link.download = name;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return { ok: true, filename: name };
}

window.TokenShareCard = { renderOverviewCard, renderSessionDiagCard, copyCanvas, downloadCanvas };
})();
