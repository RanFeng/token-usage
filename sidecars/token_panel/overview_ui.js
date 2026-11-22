/**
 * Pure HTML renderers & report builder for the Trend Overview tab.
 * Classic IIFE exposing window.OverviewUI (reuses window.TokenRenderers & window.TokenI18n).
 */
(() => {
const MEDALS = ['🥇', '🥈', '🥉'];

const r = () => window.TokenRenderers;
const i18n = () => window.TokenI18n;
const tr = (key, params) => (i18n()?.t ? i18n().t(key, params) : key);
const exact = (n) => r().exact(n);
const esc = (s) => r().esc(s);
const pctStr = (p, t) => r().pctStr(p, t);
const shortNum = (n) => r().shortNum(n);
const fmtDur = (s) => r().fmtDur(s);
const numSpan = (n, extra, cls) => r().numSpan(n, extra, cls);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pad2 = (n) => String(num(n)).padStart(2, '0');
const fmtMoney = (v) => (i18n()?.fmtMoney ? i18n().fmtMoney(Math.max(0, num(v))) : r().fmtUsd(Math.max(0, num(v))));
const fmtPlan = (usd) => (i18n()?.fmtPlan ? i18n().fmtPlan(usd) : `$${usd}`);
const safePlan = (planUsd) => Math.max(1, Math.round(num(planUsd) || 20));
const safeBucket = (b) => b || { input: 0, cache: 0, output: 0, total: 0, turns: 0, actualUsd: 0, savedUsd: 0 };

function adjModelCost(m) {
  return r().adjCost(m.input, m.cache, m.output, m.model, m.actualUsd, m.savedUsd);
}

function adjBucketCost(b) {
  if (b.input == null && b.cache == null && b.output == null) {
    return { actualUsd: num(b.actualUsd), savedUsd: num(b.savedUsd) };
  }
  return r().adjCost(b.input, b.cache, b.output, '', b.actualUsd, b.savedUsd);
}

function roiMeta(actual, plan) {
  const ratio = actual / plan;
  const pct = Math.min(100, Math.max(0, ratio * 100));
  if (actual >= plan) {
    const net = fmtMoney(actual - plan);
    return { paid: true, pct: 100, badge: tr('ov.roi.paidBadge', { ratio: ratio.toFixed(1), net }) };
  }
  const gap = fmtMoney(Math.max(0, plan - actual));
  return { paid: false, pct, badge: tr('ov.roi.unpaidBadge', { pct: pct.toFixed(0), gap }) };
}

function cycleRangeShort(month) {
  if (!month.cycleStart || !month.cycleEnd) return '';
  return `${String(month.cycleStart).slice(5).replace('-', '/')}–${String(month.cycleEnd).slice(5).replace('-', '/')}`;
}

function renderUnsetRoiCard(month, actual) {
  return `<div class="card ov-card ov-roi-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.roi.title'))}</span>
      <span class="ov-head-acts">
        <button type="button" class="ov-share-btn" data-ov-share>${esc(tr('ov.roi.shareImg'))}</button>
      </span>
    </div>
    <div class="ov-roi-unset">
      <div class="ov-roi-unset-info">
        <div class="ov-roi-unset-top">
          <span class="label" style="margin:0">${esc(tr('ov.roi.monthEst'))}</span>
          <span class="ov-roi-unset-val">${esc(fmtMoney(actual))}</span>
          <span class="sub" style="margin:0">· ${numSpan(month.total)}</span>
        </div>
        <div class="ov-roi-unset-desc">${esc(tr('ov.roi.unsetDesc'))}</div>
      </div>
      <button type="button" class="ov-sub-cta" data-open-settings="subscription">${esc(tr('ov.roi.setupBtn'))}</button>
    </div>
  </div>`;
}

function renderRoiCard(ov, plan, hasSub) {
  const month = safeBucket(ov.periods?.month);
  const actual = adjBucketCost(month).actualUsd;
  if (!hasSub) return renderUnsetRoiCard(month, actual);
  const meta = roiMeta(actual, plan);
  const elapsed = num(month.daysElapsed);
  const totalDays = num(month.daysInMonth) || 30;
  const isCustom = Boolean(month.isCustomCycle);
  const feeKey = month.cycleType === 'weekly' ? 'ov.roi.weekFee' : 'ov.roi.monthFee';
  const dayKey = isCustom ? 'ov.roi.cycleProgress' : 'ov.roi.dayProgress';
  const tokKey = isCustom ? 'ov.roi.cycleTokens' : 'ov.roi.monthTokens';
  const rangeTag = isCustom && cycleRangeShort(month) ? ` · ${cycleRangeShort(month)}` : '';
  const goldCls = meta.paid ? 'gold' : '';
  return `<div class="card ov-card ov-roi-card ${meta.paid ? 'paid' : ''}">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.roi.title'))}</span>
      <span class="ov-head-acts">
        <button type="button" class="ov-report-btn" data-open-settings="subscription" title="${esc(tr('set.sub'))}">${esc(tr('ov.roi.settings'))}</button>
        <button type="button" class="ov-share-btn" data-ov-share>${esc(tr('ov.roi.shareImg'))}</button>
      </span>
    </div>
    <div class="ov-roi-hero">
      <div><span class="ov-roi-val">${esc(fmtMoney(actual))}</span><span class="ov-roi-denom">${esc(tr(feeKey, { plan: fmtPlan(plan) }))}</span></div>
      <span class="ov-roi-badge ${goldCls}">${esc(meta.badge)}</span>
    </div>
    <div class="ov-roi-track"><div class="ov-roi-fill ${goldCls}" style="width:${meta.pct.toFixed(1)}%"></div></div>
    <div class="ov-roi-foot">
      <span>${esc(tr(dayKey, { elapsed, total: totalDays }) + rangeTag)}</span>
      <span>${esc(tr(tokKey))} ${numSpan(month.total)}</span>
    </div>
  </div>`;
}

function renderForecastBlock(fc, plan, month, hasSub) {
  const eomUsd = num(fc.eomUsd);
  const eomRatio = (eomUsd / plan).toFixed(1);
  const badgeTxt = hasSub ? tr('ov.fc.cycleBadge', { ratio: eomRatio }) : tr('ov.fc.estOnly');
  const range = hasSub ? cycleRangeShort(month) : '';
  const cycleSub = range ? `${tr('ov.fc.approx', { val: fmtMoney(eomUsd) })} · ${range}` : tr('ov.fc.approx', { val: fmtMoney(eomUsd) });
  const rightBox = hasSub
    ? `<div class="ov-mini-val">${numSpan(num(fc.eomTokens))}</div><div class="sub">${esc(cycleSub)}</div>`
    : `<button type="button" class="ov-inline-link" data-open-settings="subscription">${esc(tr('ov.fc.unsetAction'))}</button><div class="sub">${esc(tr('ov.fc.unsetSub'))}</div>`;
  return `<div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.fc.title'))}</span>
      <span class="badge">${esc(badgeTxt)}</span>
    </div>
    <div class="ov-mini-2">
      <div class="ov-mini-box">
        <div class="label">${esc(tr('ov.fc.dailyAvg'))}</div>
        <div class="ov-mini-val">${numSpan(num(fc.dailyAvgTokens))}</div>
        <div class="sub">${esc(tr('ov.fc.perDay', { val: fmtMoney(fc.dailyAvgUsd) }))}</div>
      </div>
      <div class="ov-mini-box">
        <div class="label">${esc(tr('ov.fc.cycleTotal'))}</div>
        ${rightBox}
      </div>
    </div>`;
}

function renderSavingsPerkBox(saved, plan, month, hitRate, hasSub) {
  if (!hasSub) {
    return `<div class="ov-perk-val c-cache">⚡ ${esc(hitRate)}</div><div class="sub">${esc(tr('ov.save.hitRate'))}</div>`;
  }
  const isWeekly = month.cycleType === 'weekly';
  const freeKey = isWeekly ? 'ov.save.freeWeeks' : 'ov.save.freeMonths';
  const subKey = isWeekly ? 'ov.save.weekSub' : 'ov.save.monthSub';
  const freeCount = (saved / plan).toFixed(1);
  return `<div class="ov-perk-val">${esc(tr(freeKey, { n: freeCount }))}</div><div class="sub">${esc(tr(subKey, { plan: fmtPlan(plan) }))}</div>`;
}

function renderSavingsBlock(all, month, plan, hasSub) {
  const savedAll = adjBucketCost(all).savedUsd;
  const savedCycle = adjBucketCost(month).savedUsd;
  const baseSaved = hasSub ? savedCycle : savedAll;
  const coffees = (baseSaved / 5).toFixed(1);
  const allHit = pctStr(num(all.cache), num(all.input) + num(all.cache));
  const cycleHit = pctStr(num(month.cache), num(month.input) + num(month.cache));
  const headKey = hasSub ? 'ov.save.cycleSaved' : 'ov.save.totalSaved';
  const footKey = hasSub ? 'ov.save.cycleFooter' : 'ov.save.monthFooter';
  const footSaved = hasSub ? savedAll : savedCycle;
  const footHit = hasSub ? cycleHit : allHit;
  return `<div class="ov-card-head" style="margin-bottom:6px">
      <span class="sec-title">${esc(tr('ov.save.title'))}</span>
      <span class="c-cache" style="font-size:11.5px">${esc(tr(headKey, { val: fmtMoney(baseSaved) }))}</span>
    </div>
    <div class="ov-mini-2">
      <div class="ov-mini-box">
        <div class="ov-perk-val">${esc(tr('ov.save.coffees', { n: coffees }))}</div>
        <div class="sub">${esc(tr('ov.save.coffeeSub', { price: fmtMoney(5) }))}</div>
      </div>
      <div class="ov-mini-box">${renderSavingsPerkBox(baseSaved, plan, month, allHit, hasSub)}</div>
    </div>
    <div class="sub" style="margin-top:6px">${esc(tr(footKey, { saved: fmtMoney(footSaved) }))} <span class="c-cache">${footHit}</span></div>`;
}

function renderForecastSavingsCard(ov, plan, hasSub) {
  const fc = ov.forecast || {};
  const all = safeBucket(ov.periods?.all);
  const month = safeBucket(ov.periods?.month);
  return `<div class="card ov-card">
    ${renderForecastBlock(fc, plan, month, hasSub)}
    <div class="divider"></div>
    ${renderSavingsBlock(all, month, plan, hasSub)}
  </div>`;
}

function renderPeriodTile(title, raw) {
  const b = safeBucket(raw);
  const bIn = num(b.input) + num(b.cache);
  const c = adjBucketCost(b);
  const tip = `↑${exact(bIn)} ↓${exact(b.output)} · ${tr('ctx.saved', { val: fmtMoney(c.savedUsd) })}`;
  return `<div class="card">
    <div class="ov-period-top">
      <span class="label" style="margin:0">${esc(title)}</span>
      <span class="ov-period-turns">${esc(tr('sess.turnsUnit', { n: exact(num(b.turns)) }))}</span>
    </div>
    <div class="val">${numSpan(num(b.total), tip)}</div>
    <div class="sub">${esc(fmtMoney(c.actualUsd))} · <span class="c-cache">⚡${pctStr(num(b.cache), bIn)}</span></div>
  </div>`;
}

function renderPeriodsGrid(periods) {
  const p = periods || {};
  const monthTitle = p.month?.isCustomCycle ? tr('ov.period.cycle') : tr('ov.period.month');
  return `<div class="grid ov-period-grid">
    ${renderPeriodTile(tr('ov.period.today'), p.today)}
    ${renderPeriodTile(tr('ov.period.week'), p.week)}
    ${renderPeriodTile(monthTitle, p.month)}
    ${renderPeriodTile(tr('ov.period.all'), p.all)}
  </div>`;
}

function heatmapCellSvg(d, i) {
  const col = Math.floor(i / 7);
  const row = i % 7;
  const lvl = Math.max(0, Math.min(4, Math.round(num(d.level))));
  const cls = lvl === 0 ? 'ov-hm-cell ov-hm-l0' : 'ov-hm-cell';
  const tip = `${d.date || ''} · ${exact(num(d.total))} tokens · ${num(d.sessions)}/${num(d.turns)} · ${fmtMoney(d.actualUsd)}`;
  return `<rect class="${cls}" x="${2 + col * 13}" y="${2 + row * 13}" width="10" height="10" rx="2.5" fill="var(--ov-h${lvl})" data-tip="${esc(tip)}"/>`;
}

function heatmapBestText(best) {
  if (!best || num(best.total) <= 0) return tr('ov.hm.none');
  const day = String(best.date || '').slice(5);
  return `${day} · ${shortNum(num(best.total))}`;
}

function renderHeatmapCard(hm) {
  const data = hm || {};
  const days = (data.days || []).slice(-91);
  const cells = days.map(heatmapCellSvg).join('');
  const swatches = [0, 1, 2, 3, 4].map((l) => `<span class="ov-hm-swatch" style="background:var(--ov-h${l})"></span>`).join('');
  const grid = days.length
    ? `<svg class="ov-hm-svg" width="172" height="94" viewBox="0 0 172 94">${cells}</svg>`
    : `<div class="sub">${esc(tr('ov.hm.empty'))}</div>`;
  const stats = `<div class="ov-hm-stats">
    <div class="ov-hm-stat"><span class="ov-hm-k">🔥 ${esc(tr('ov.hm.curStreak'))}</span><span class="ov-hm-v">${esc(tr('ov.hm.daysUnit', { n: num(data.currentStreak) }))}</span></div>
    <div class="ov-hm-stat"><span class="ov-hm-k">🏆 ${esc(tr('ov.hm.maxStreak'))}</span><span class="ov-hm-v">${esc(tr('ov.hm.daysUnit', { n: num(data.longestStreak) }))}</span></div>
    <div class="ov-hm-stat"><span class="ov-hm-k">${esc(tr('ov.hm.bestDay'))}</span><span class="ov-hm-v">${esc(heatmapBestText(data.bestDay))}</span></div>
  </div>`;
  return `<div class="card ov-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.hm.title'))}</span>
      <span class="ov-hm-legend">${esc(tr('ov.hm.less'))}${swatches}${esc(tr('ov.hm.more'))}</span>
    </div>
    <div class="ov-hm-body">${grid}${stats}</div>
  </div>`;
}

function dailyBarSvg(d, i, bw, maxD) {
  const tot = num(d.total);
  const h = tot > 0 ? Math.max(3, (tot / maxD) * 74) : 2;
  const x = (i * bw + 3).toFixed(1);
  const w = Math.max(4, bw - 6).toFixed(1);
  const fill = tot > 0 ? 'var(--tu-accent)' : 'var(--tu-surface)';
  const tip = `${d.date || ''}: ${exact(tot)} tokens (${tr('sess.turnsUnit', { n: num(d.turns) })} · ${fmtMoney(d.actualUsd)} · ${tr('ctx.saved', { val: fmtMoney(d.savedUsd) })})`;
  return `<rect class="chart-dot ov-bar" x="${x}" y="${(84 - h).toFixed(1)}" width="${w}" height="${h.toFixed(1)}" rx="2.5" fill="${fill}" data-tip="${esc(tip)}"/>`;
}

function renderDailyCard(daily) {
  const list = daily || [];
  const maxD = Math.max(...list.map((d) => num(d.total)), 1);
  const bw = 300 / Math.max(list.length, 1);
  const bars = list.map((d, i) => dailyBarSvg(d, i, bw, maxD)).join('');
  const first = String(list[0]?.date || '').slice(5);
  const last = String(list[list.length - 1]?.date || '').slice(5);
  const svg = list.length
    ? `<svg class="ov-bar-svg" viewBox="0 0 300 88">
        <line x1="0" y1="47" x2="300" y2="47" stroke="var(--tu-border)" stroke-width="0.7" stroke-dasharray="3 3"/>
        <line x1="0" y1="84" x2="300" y2="84" stroke="var(--tu-border)" stroke-width="1"/>
        ${bars}
      </svg>`
    : `<div class="sub">${esc(tr('ov.daily.empty'))}</div>`;
  return `<div class="card ov-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.daily.title'))}</span>
      <span class="ov-head-sub">${esc(tr('ov.daily.peak'))} ${numSpan(maxD)}</span>
    </div>
    ${svg}
    <div class="chart-foot"><span>${esc(first)}</span><span>${esc(tr('ov.daily.hint'))}</span><span>${esc(last)}</span></div>
  </div>`;
}

function hourBarFill(b, peakHour) {
  if (num(b.total) <= 0) return 'var(--tu-surface)';
  if (num(b.hour) === peakHour) return 'var(--tu-cache)';
  return 'var(--tu-accent)';
}

function hourBarSvg(b, maxH, peakHour) {
  const tot = num(b.total);
  const hr = num(b.hour);
  const h = tot > 0 ? Math.max(3, (tot / maxH) * 60) : 2;
  const tip = `${pad2(hr)}:00-${pad2(hr)}:59 · ${exact(tot)} tokens · ${tr('turns.steps', { n: num(b.steps) })}`;
  return `<rect class="chart-dot ov-bar" x="${hr * 12 + 2}" y="${(68 - h).toFixed(1)}" width="8" height="${h.toFixed(1)}" rx="2" fill="${hourBarFill(b, peakHour)}" data-tip="${esc(tip)}"/>`;
}

function weekSplitPcts(wdTotal, weTotal) {
  const sum = wdTotal + weTotal;
  if (sum <= 0) return { barWd: 50, barWe: 50, lblWd: 0, lblWe: 0 };
  const pct = Number(((wdTotal / sum) * 100).toFixed(1));
  const rem = Number((100 - pct).toFixed(1));
  return { barWd: pct, barWe: rem, lblWd: pct, lblWe: rem };
}

function renderWeekSplitBlock(ws) {
  const data = ws || {};
  const wd = data.weekday || { total: 0, activeDays: 0, avgPerDay: 0 };
  const we = data.weekend || { total: 0, activeDays: 0, avgPerDay: 0 };
  const sp = weekSplitPcts(num(wd.total), num(we.total));
  return `<div class="ov-split">
    <div class="ov-split-head">
      <span>${esc(tr('ov.split.title'))}</span>
      <span><span class="c-in">${esc(tr('ov.split.wd', { pct: sp.lblWd }))}</span> · <span class="c-out">${esc(tr('ov.split.we', { pct: sp.lblWe }))}</span></span>
    </div>
    <div class="ov-split-bar">
      <div class="ov-split-wd" style="width:${sp.barWd}%"></div>
      <div class="ov-split-we" style="width:${sp.barWe}%"></div>
    </div>
    <div class="ov-split-foot">
      <span>${esc(tr('ov.split.wdAvg'))} ${numSpan(num(wd.avgPerDay))} (${num(wd.activeDays)}d)</span>
      <span>${esc(tr('ov.split.weAvg'))} ${numSpan(num(we.avgPerDay))} (${num(we.activeDays)}d)</span>
    </div>
  </div>`;
}

function localizePersona(p) {
  const id = p?.id || 'idle';
  const k = `persona.${id}`;
  const has = i18n()?.hasKey?.(k);
  return {
    label: has ? tr(k) : (p?.label || tr('persona.idle')),
    desc: has ? tr(`${k}.desc`) : (p?.desc || tr('persona.idle.desc')),
  };
}

function renderHoursCard(hours, weekSplit) {
  const h = hours || {};
  const buckets = h.buckets || [];
  const peak = num(h.peakHour);
  const persona = localizePersona(h.persona);
  const maxH = Math.max(...buckets.map((b) => num(b.total)), 1);
  const bars = buckets.map((b) => hourBarSvg(b, maxH, peak)).join('');
  return `<div class="card ov-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.hours.title'))}</span>
      <span class="ov-persona">${esc(persona.label)}</span>
    </div>
    <div class="ov-persona-desc">${esc(persona.desc)} · ${esc(tr('ov.hours.peak', { hour: pad2(peak) }))}</div>
    <svg class="ov-hour-svg" viewBox="0 0 288 72">
      <line x1="0" y1="68" x2="288" y2="68" stroke="var(--tu-border)" stroke-width="1"/>
      ${bars}
    </svg>
    <div class="chart-foot"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
    <div class="divider"></div>
    ${renderWeekSplitBlock(weekSplit)}
  </div>`;
}

function renderFunStatsBlock(funStats) {
  const fs = funStats || {};
  const books = num(fs.threeBodyBooks);
  const lines = num(fs.codeLines);
  const isEn = i18n()?.getLang?.() === 'en';
  const codeNum = isEn ? shortNum(lines) : (lines / 10000).toFixed(2);
  return `<div class="ov-fun-grid">
    <div class="ov-fun-tile" data-tip="${esc(tr('ov.fun.booksTip'))}">
      <div>${esc(tr('ov.fun.booksPrefix'))}</div>
      <div class="ov-fun-num">${esc(tr('ov.fun.booksVal', { n: books }))}</div>
    </div>
    <div class="ov-fun-tile" data-tip="${esc(tr('ov.fun.codeTip', { lines: exact(lines) }))}">
      <div>${esc(tr('ov.fun.codePrefix'))}</div>
      <div class="ov-fun-num">${esc(tr('ov.fun.codeVal', { n: codeNum }))}</div>
    </div>
  </div>`;
}

function renderHealthCard(health, funStats) {
  const h = health || {};
  const compacts = num(h.totalCompacts);
  return `<div class="card ov-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.health.title'))}</span>
      <span class="ov-head-sub">${esc(tr('ov.health.sessions', { n: exact(num(h.totalSessions)) }))}</span>
    </div>
    <div class="ov-health-grid">
      <div class="ov-mini-box"><div class="label">${esc(tr('ov.health.avgTurns'))}</div><div class="ov-mini-val">${num(h.avgTurns)}</div></div>
      <div class="ov-mini-box"><div class="label">${esc(tr('ov.health.avgPeak'))}</div><div class="ov-mini-val">${numSpan(num(h.avgPeakCtx))}</div></div>
      <div class="ov-mini-box"><div class="label">${esc(tr('ov.health.compacts'))}</div><div class="ov-mini-val ${compacts > 0 ? 'c-danger' : ''}">${exact(compacts)}</div></div>
      <div class="ov-mini-box"><div class="label">${esc(tr('ov.health.totalSess'))}</div><div class="ov-mini-val">${exact(num(h.totalSessions))}</div></div>
    </div>
    <div class="divider"></div>
    ${renderFunStatsBlock(funStats)}
  </div>`;
}

function renderModelRow(m, maxM) {
  const tot = num(m.total);
  const w = Math.max(2, (tot / maxM) * 100).toFixed(1);
  const c = adjModelCost(m);
  return `<div class="bar-row">
    <div class="bar-head ov-bar-head-gap">
      <span class="ov-trunc">${esc(m.model || tr('ctx.unknown'))} <span class="ov-head-sub">(${esc(tr('ctx.steps', { n: exact(num(m.steps)) }))})</span></span>
      <span class="ov-bar-right">${numSpan(tot)} · ${esc(fmtMoney(c.actualUsd))}</span>
    </div>
    <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
  </div>`;
}

function renderModelsCard(models) {
  const list = (models || []).slice(0, 8);
  const maxM = Math.max(...list.map((m) => num(m.total)), 1);
  const rows = list.map((m) => renderModelRow(m, maxM)).join('');
  return `<div class="card ov-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.models.title'))}</span>
      <span class="ov-head-sub">${esc(tr('ov.models.count', { n: (models || []).length }))}</span>
    </div>
    ${rows || `<div class="sub">${esc(tr('ov.models.empty'))}</div>`}
  </div>`;
}

function toolErrBadge(t) {
  const errs = num(t.errors);
  const rate = num(t.errorRate);
  const tip = `${exact(errs)} / ${exact(num(t.count))} (${rate}%)`;
  if (errs <= 0) return `<span class="ov-err-pill ok" data-tip="${esc(tip)}">${esc(tr('ov.tools.zeroErr'))}</span>`;
  const cls = rate >= 10 ? 'danger' : 'warn';
  return `<span class="ov-err-pill ${cls}" data-tip="${esc(tip)}">⚠ ${rate}%</span>`;
}

function renderToolRow(t, maxT) {
  const cnt = num(t.count);
  const w = Math.max(2, (cnt / maxT) * 100).toFixed(1);
  return `<div class="bar-row">
    <div class="bar-head ov-bar-head-gap">
      <span class="ov-trunc">🛠 ${esc(t.name || '-')}</span>
      <span class="ov-bar-right"><span>×${exact(cnt)}</span>${toolErrBadge(t)}</span>
    </div>
    <div class="bar-track"><div class="bar-fill ov-tool-fill" style="width:${w}%"></div></div>
  </div>`;
}

function renderToolsCard(tools) {
  const list = (tools || []).slice(0, 10);
  const maxT = Math.max(...list.map((t) => num(t.count)), 1);
  const rows = list.map((t) => renderToolRow(t, maxT)).join('');
  return `<div class="card ov-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.tools.title'))}</span>
      <span class="ov-head-sub">${esc(tr('ov.tools.sub'))}</span>
    </div>
    ${rows || `<div class="sub">${esc(tr('ov.tools.empty'))}</div>`}
  </div>`;
}

function renderProjectRow(p, maxP) {
  const tot = num(p.total);
  const w = Math.max(2, (tot / maxP) * 100).toFixed(1);
  const name = p.name === '__other__' ? tr('ov.projects.other') : (p.name || tr('ov.projects.other'));
  const c = adjBucketCost(p);
  return `<div class="bar-row">
    <div class="bar-head ov-bar-head-gap">
      <span class="ov-trunc">📁 ${esc(name)}</span>
      <span class="ov-bar-right">${numSpan(tot)} · ${esc(fmtMoney(c.actualUsd))}</span>
    </div>
    <div class="bar-track"><div class="bar-fill proj-fill" style="width:${w}%"></div></div>
    <div class="proj-meta">
      <span>${esc(tr('ov.health.sessions', { n: num(p.sessions) }))} · ${esc(tr('sess.turnsUnit', { n: num(p.turns) }))}</span>
      <span class="c-cache">⚡${num(p.cacheRate).toFixed(1)}%</span>
    </div>
  </div>`;
}

function renderProjectsCard(projects) {
  const list = (projects || []).slice(0, 8);
  const maxP = Math.max(...list.map((p) => num(p.total)), 1);
  const rows = list.map((p) => renderProjectRow(p, maxP)).join('');
  return `<div class="card ov-card proj-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.projects.title'))}</span>
    </div>
    ${rows || `<div class="sub">${esc(tr('ov.projects.empty'))}</div>`}
  </div>`;
}

function renderRadarTile(tool) {
  const cls = tool.detected ? 'radar-item detected' : 'radar-item';
  const cnt = tool.detected ? tr('ov.radar.sessionsUnit', { n: exact(num(tool.count)) }) : '—';
  const ico = window.TokenAgentIcons?.getSvg?.(tool.id) || '';
  return `<div class="${cls}">
    <span class="radar-left"><span class="radar-ico" aria-hidden="true">${ico}</span><span class="radar-name">${esc(tool.name)}</span></span>
    <span class="radar-cnt">${esc(cnt)}</span>
  </div>`;
}

function renderRadarCard(radar) {
  const tools = radar?.tools || [];
  const hasDetected = tools.some((x) => x.detected);
  const desc = hasDetected ? tr('ov.radar.detectedDesc') : tr('ov.radar.emptyDesc');
  const tiles = tools.map(renderRadarTile).join('');
  return `<div class="card ov-card radar-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.radar.title'))}</span>
      <span class="badge">${esc(tr('ov.radar.badge'))}</span>
    </div>
    <div class="radar-desc">${esc(desc)}</div>
    <div class="radar-grid">${tiles}</div>
    <button type="button" class="radar-cta" data-open-settings="roadmap">${esc(tr('ov.radar.cta'))}</button>
  </div>`;
}

const BADGE_PROG = {
  million_club: (b) => `${shortNum(b.cur)} / ${shortNum(b.target)}`,
  ten_million_driver: (b) => `${shortNum(b.cur)} / ${shortNum(b.target)}`,
  cache_master: (b) => `${num(b.cur).toFixed(1)}% / ${num(b.target)}%`,
  night_owl: (b) => (b.unlocked ? tr('ov.ach.statusOn') : tr('ov.ach.statusOff')),
  sharpshooter: (b) => tr('turns.steps', { n: `${num(b.cur)}/${num(b.target)}` }),
  marathoner: (b) => tr('sess.turnsUnit', { n: `${num(b.cur)}/${num(b.target)}` }),
  tool_maniac: (b) => `×${exact(num(b.cur))} / ${exact(num(b.target))}`,
  money_saver: (b) => `${fmtMoney(b.cur)} / ${fmtPlan(b.target)}`,
};

function localizeBadge(b) {
  const k = `ach.${b.id}`;
  const has = b.id && i18n()?.hasKey?.(k);
  const fmt = b.id && Number.isFinite(Number(b.target)) && BADGE_PROG[b.id];
  return {
    ...b,
    name: has ? tr(k) : (b.name || ''),
    desc: has ? tr(`${k}.desc`) : (b.desc || ''),
    progress: fmt ? fmt(b) : (b.progress || ''),
  };
}

function buildBadges(ov, plan) {
  const month = safeBucket(ov.periods?.month);
  const actual = adjBucketCost(month).actualUsd;
  const roiBadge = {
    id: 'roi_king',
    icon: '🏆',
    name: tr('ach.roi_king'),
    desc: tr('ach.roi_king.desc', { plan: fmtPlan(plan) }),
    unlocked: actual >= plan,
    progress: `${fmtMoney(actual)} / ${fmtPlan(plan)}`,
    isGold: true,
  };
  return (ov.achievements || []).map(localizeBadge).concat([roiBadge]);
}

function badgeStateCls(b) {
  if (!b.unlocked) return 'locked';
  return b.isGold ? 'unlocked gold' : 'unlocked';
}

function renderBadgeItem(b) {
  const status = b.unlocked ? tr('ov.ach.statusOn') : tr('ov.ach.statusOff');
  const tip = `${b.icon || '🏅'} ${b.name} [${status}] · ${b.desc} · ${b.progress || ''}`;
  return `<div class="ov-ach ${badgeStateCls(b)}" data-tip="${esc(tip)}">
    <span class="ov-ach-icon">${esc(b.icon || '🏅')}</span>
    <span class="ov-ach-name">${esc(b.name)}</span>
    <span class="ov-ach-prog">${esc(b.progress || status)}</span>
  </div>`;
}

function renderAchievementsCard(ov, plan) {
  const badges = buildBadges(ov, plan);
  const done = badges.filter((b) => b.unlocked).length;
  return `<div class="card ov-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.ach.title'))}</span>
      <span class="badge">${esc(tr('ov.ach.unlocked', { done, total: badges.length }))}</span>
    </div>
    <div class="ov-ach-grid">${badges.map(renderBadgeItem).join('')}</div>
  </div>`;
}

function renderTopSessionItem(s, i) {
  const rank = MEDALS[i] || `#${i + 1}`;
  const c = adjBucketCost(s);
  return `<div class="ov-hof-item" data-open-conv="${esc(s.cid || '')}">
    <div class="ov-hof-top">
      <span class="ov-hof-left"><span class="ov-hof-rank">${rank}</span><span class="ov-trunc">${esc(s.title || s.cid || tr('sess.untitled'))}</span></span>
      <span>${numSpan(num(s.total))}</span>
    </div>
    <div class="ov-hof-meta">
      <span>${esc(tr('sess.turnsUnit', { n: num(s.turns) }))} · ${esc(fmtMoney(c.actualUsd))}</span>
      <span>${esc(tr('ov.hof.jump'))}</span>
    </div>
  </div>`;
}

function renderTopTurnItem(t, i) {
  const rank = MEDALS[i] || `#${i + 1}`;
  return `<div class="ov-hof-item" data-open-conv="${esc(t.cid || '')}">
    <div class="ov-hof-top">
      <span class="ov-hof-left"><span class="ov-hof-rank">${rank}</span><span class="ov-trunc">${esc(t.title || t.cid || tr('sess.untitled'))} · ${esc(tr('turns.turnLabel', { n: num(t.turn) }))}</span></span>
      <span class="dur-badge">⏱ ${fmtDur(num(t.durationSec))}</span>
    </div>
    <div class="ov-hof-prompt">${esc(t.prompt || tr('turns.noText'))}</div>
    <div class="ov-hof-meta">
      <span>${numSpan(num(t.total))}</span>
      <span>${esc(tr('ov.hof.jump'))}</span>
    </div>
  </div>`;
}

function renderHallOfFameCard(hof) {
  const data = hof || {};
  const topSess = (data.topSessions || []).slice(0, 3).map(renderTopSessionItem).join('');
  const topTurn = (data.topTurns || []).slice(0, 3).map(renderTopTurnItem).join('');
  return `<div class="card ov-card">
    <div class="ov-card-head">
      <span class="pop-title">${esc(tr('ov.hof.title'))}</span>
      <span class="ov-head-sub">${esc(tr('ov.hof.sub'))}</span>
    </div>
    <div class="ov-hof-sub">${esc(tr('ov.hof.topSess'))}</div>
    <div class="ov-hof-list">${topSess || `<div class="sub">${esc(tr('ov.hof.empty'))}</div>`}</div>
    <div class="divider"></div>
    <div class="ov-hof-sub">${esc(tr('ov.hof.topTurn'))}</div>
    <div class="ov-hof-list">${topTurn || `<div class="sub">${esc(tr('ov.hof.empty'))}</div>`}</div>
  </div>`;
}

function render(ov, planUsd) {
  if (!ov) return `<div class="empty">${esc(tr('ov.loading'))}</div>`;
  const hasSub = Boolean(i18n()?.hasSubscription?.());
  const plan = safePlan(planUsd);
  return `<div class="ov-root">
    ${renderRoiCard(ov, plan, hasSub)}
    ${renderForecastSavingsCard(ov, plan, hasSub)}
    ${renderPeriodsGrid(ov.periods)}
    ${renderHeatmapCard(ov.heatmap)}
    ${renderDailyCard(ov.daily)}
    ${renderHoursCard(ov.hours, ov.weekSplit)}
    ${renderHealthCard(ov.health, ov.funStats)}
    ${renderProjectsCard(ov.projects)}
    ${renderModelsCard(ov.models)}
    ${renderToolsCard(ov.tools)}
    ${renderRadarCard(ov.radar)}
    ${renderAchievementsCard(ov, plan)}
    ${renderHallOfFameCard(ov.hallOfFame)}
  </div>`;
}

window.OverviewUI = { render };
})();
