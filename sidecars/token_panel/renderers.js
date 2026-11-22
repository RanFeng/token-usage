/**
 * Pure HTML render helpers for Token Usage sidecar UI.
 */
(() => {
const DIAG_ICON = { danger: '🔴', warn: '🟡', info: '💡' };
const exact = (n) => (n || 0).toLocaleString('en-US');
const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pctStr = (part, total) => (total > 0 ? `${((part / total) * 100).toFixed(1)}%` : '0%');
const fmtUsd = (v) => (v < 0.01 ? '<$0.01' : `$${v.toFixed(2)}`);
const fmtClock = (ms) => (ms ? new Date(ms).toTimeString().slice(0, 8) : '-');
const i18n = () => window.TokenI18n;
const tr = (key, params) => (i18n()?.t ? i18n().t(key, params) : key);
const fmtMoney = (usd) => (i18n()?.fmtMoney ? i18n().fmtMoney(usd) : fmtUsd(usd || 0));

function adjCost(inp, cac, out, model, usd, saved) {
  const fn = i18n()?.calcAdjustedCost;
  if (!fn) return { actualUsd: usd || 0, savedUsd: saved || 0 };
  return fn(inp || 0, cac || 0, out || 0, model || '', usd || 0, saved || 0);
}

function calcSessionCost(d) {
  const cost = d?.cost || { actualUsd: 0, savedUsd: 0 };
  if (!i18n()?.getCustomRates?.()) return { actualUsd: cost.actualUsd || 0, savedUsd: cost.savedUsd || 0 };
  const models = d?.models || [];
  if (models.length) {
    return models.reduce((acc, m) => {
      const c = adjCost(m.input, m.cache, m.output, m.model, m.actualUsd, 0);
      return { actualUsd: acc.actualUsd + c.actualUsd, savedUsd: acc.savedUsd + c.savedUsd };
    }, { actualUsd: 0, savedUsd: 0 });
  }
  const tot = d?.totals || { input: 0, cache: 0, output: 0 };
  return adjCost(tot.input, tot.cache, tot.output, d?.context?.model, cost.actualUsd, cost.savedUsd);
}

function shortNum(n) {
  const v = Math.abs(n || 0);
  const sign = (n || 0) < 0 ? '-' : '';
  if (v < 10000) return `${sign}${exact(v)}`;
  if (v < 1000000) return `${sign}${Number((v / 1000).toFixed(1))}K`;
  return `${sign}${Number((v / 1000000).toFixed(2))}M`;
}

function fmtMinutes(s) {
  const rem = s % 60;
  return `${Math.floor(s / 60)}m${rem ? `${rem}s` : ''}`;
}

function fmtHours(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  return `${h}h${m ? `${m}m` : ''}${rem ? `${rem}s` : ''}`;
}

function fmtDur(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  if (s < 1) return '<1s';
  if (s < 60) return `${s}s`;
  return s >= 3600 ? fmtHours(s) : fmtMinutes(s);
}

function numSpan(n, extra = '', cls = '') {
  const tip = extra ? `${exact(n)} (${extra})` : exact(n);
  return `<span class="num ${cls}" data-tip="${esc(tip)}">${shortNum(n)}</span>`;
}

function ringSvg(pct, color) {
  const r = 25, c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, pct) / 100);
  return `<svg width="62" height="62" viewBox="0 0 62 62" style="transform:rotate(-90deg)">
    <circle cx="31" cy="31" r="${r}" fill="none" stroke="var(--tu-border)" stroke-width="5"/>
    <circle cx="31" cy="31" r="${r}" fill="none" stroke="${color}" stroke-width="5"
      stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/>
  </svg>`;
}

function ctxStatusMeta(pct) {
  if (pct >= 85) return { cls: 'danger', color: 'var(--tu-danger)', text: tr('ctx.status.danger') };
  if (pct >= 60) return { cls: 'warn', color: 'var(--tu-warn)', text: tr('ctx.status.warn') };
  return { cls: '', color: 'var(--tu-accent)', text: tr('ctx.status.normal') };
}

function tokenBreakdownHtml(inp, cac, out) {
  const sIn = inp + cac;
  const inTip = tr('ctx.newCacheTip', { input: exact(inp), cache: exact(cac) });
  return `<span class="c-in">↑${numSpan(sIn, inTip, 'c-in')}</span> <span class="c-out">↓${numSpan(out, tr('ctx.outputTip'), 'c-out')}</span> <span class="c-cache">⚡${pctStr(cac, sIn)}</span>`;
}

function renderWorkspaceRow(ws) {
  if (!ws) return '';
  return `<div class="ctx-row"><span>${esc(tr('ctx.project'))}</span><span><span class="proj-tag">📁 ${esc(ws)}</span></span></div>`;
}

function renderContextCard(d) {
  const ctx = d.context;
  if (!ctx) return '';
  const pct = Math.min(100, ctx.percent || 0);
  const st = ctxStatusMeta(pct);
  const rem = Math.max(0, ctx.limit - ctx.contextUsed);
  const tot = d.totals || { input: 0, cache: 0, output: 0 };
  const totIn = tot.input + tot.cache;
  const cost = calcSessionCost(d);
  return `<div class="card full">
    <div class="pop-top">
      <span class="pop-title">${esc(tr('ctx.title'))}</span>
      <span class="pop-top-acts">
        <span class="badge ${st.cls}">${esc(st.text)}</span>
        <button type="button" class="ov-share-btn sess-share-btn" data-sess-share>${esc(tr('ov.roi.shareImg'))}</button>
      </span>
    </div>
    <div class="pop-hero">
      <div class="ring-wrap">${ringSvg(pct, st.color)}<div class="ring-text"><span class="ring-pct">${ctx.percent}%</span></div></div>
      <div class="hero-rows">
        <div class="ctx-row"><span>${esc(tr('ctx.used'))}</span><span>${numSpan(ctx.contextUsed)}</span></div>
        <div class="ctx-row"><span>${esc(tr('ctx.remaining'))}</span><span>${numSpan(rem)}</span></div>
        <div class="ctx-row"><span>${esc(tr('ctx.limit'))}</span><span>${numSpan(ctx.limit)}</span></div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="ctx-row"><span>${esc(tr('ctx.model'))}</span><span>${esc(ctx.model || tr('ctx.unknown'))}</span></div>
    ${renderWorkspaceRow(d.workspace)}
    <div class="ctx-row"><span>${esc(tr('ctx.total', { n: (d.turns || []).length }))}</span><span>${numSpan(totIn + tot.output, `↑${exact(totIn)} + ↓${exact(tot.output)}`)} (${tokenBreakdownHtml(tot.input, tot.cache, tot.output)})</span></div>
    <div class="ctx-row"><span>${esc(tr('ctx.costSaved'))}</span><span>${esc(fmtMoney(cost.actualUsd))} · <span class="c-cache">${esc(tr('ctx.saved', { val: fmtMoney(cost.savedUsd) }))}</span></span></div>
    <div class="ctx-row"><span>${esc(tr('ctx.latest'))}</span><span>${numSpan(ctx.contextUsed)} (${tokenBreakdownHtml(ctx.input, ctx.cache, ctx.output)})</span></div>
  </div>`;
}

function formatDiagParams(params) {
  const p = { ...(params || {}) };
  if (typeof p.tokens === 'number') p.tokens = shortNum(p.tokens);
  return p;
}

function renderDiagItem(item) {
  const lvl = item.level || 'info';
  const icon = DIAG_ICON[lvl] || '💡';
  const msg = tr(`diag.${item.code}`, formatDiagParams(item.params));
  return `<div class="diag-item ${esc(lvl)}">${icon} ${esc(msg)}</div>`;
}

function renderDiagnosticsBanner(diagnostics, dismissed) {
  if (!diagnostics || !diagnostics.length) return '';
  if (dismissed) {
    return `<div class="card full diag-box collapsed">
      <div class="diag-head">
        <span class="sec-title">🩺 ${esc(tr('diag.title'))}</span>
        <button type="button" class="chip" data-diag-dismiss>${esc(tr('diag.show', { n: diagnostics.length }))}</button>
      </div>
    </div>`;
  }
  const rows = diagnostics.map(renderDiagItem).join('');
  return `<div class="card full diag-box">
    <div class="diag-head">
      <span class="sec-title">🩺 ${esc(tr('diag.title'))}</span>
      <button type="button" class="chip" data-diag-dismiss>${esc(tr('diag.dismiss'))}</button>
    </div>
    <div class="diag-list">${rows}</div>
  </div>`;
}

function renderDlpBanner(dlp) {
  const n = dlp?.totalCount || 0;
  if (n <= 0) return '';
  return `<div class="card full dlp-banner" role="button" tabindex="0" data-open-dlp>
    <div>
      <div class="dlp-banner-title">🔒 ${esc(tr('dlp.banner', { n }))}</div>
      <div class="dlp-banner-sub">${esc(tr('dlp.bannerSub'))}</div>
    </div>
    <span class="c-danger">→</span>
  </div>`;
}

function buildHistoryPoints(history, maxUsed, W, H, P) {
  return history.map((h, i) => {
    const x = P + (i / (history.length - 1)) * (W - P * 2);
    const y = H - P - (h.used / maxUsed) * (H - P * 2);
    const prev = i > 0 ? history[i - 1].used : h.used;
    const isCompact = i > 0 && prev - h.used >= 20000 && h.used / prev <= 0.75;
    return { x, y, ...h, step: i + 1, delta: i > 0 ? h.used - prev : h.used, isCompact };
  });
}

function renderHistoryDot(p) {
  const r = p.isCompact ? 3.8 : 2.3;
  const fill = p.isCompact ? 'var(--tu-danger)' : 'var(--tu-accent)';
  return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="${fill}"/>`;
}

function renderHistoryChart(history) {
  if (!history || history.length < 2) return '';
  const W = 300, H = 88, P = 8;
  const maxUsed = Math.max(...history.map((h) => h.used), 1);
  const pts = buildHistoryPoints(history, maxUsed, W, H, P);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H - P} L${pts[0].x.toFixed(1)},${H - P} Z`;
  const compacts = pts.filter((p) => p.isCompact).length;
  const dots = pts.filter((p) => pts.length <= 30 || p.isCompact).map(renderHistoryDot).join('');
  const cTag = compacts ? ` · <span class="c-danger">${esc(tr('chart.compactCount', { n: compacts }))}</span>` : '';
  return `<div class="card full">
    <div class="pop-top" style="margin-bottom:4px"><span class="pop-title">${esc(tr('chart.title'))}</span><span class="sub" style="margin:0">${esc(tr('chart.peak'))} ${numSpan(maxUsed)}${cTag}</span></div>
    <svg id="history-chart-svg" class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="cursor:crosshair">
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--tu-accent)" stop-opacity="0.28"/><stop offset="100%" stop-color="var(--tu-accent)" stop-opacity="0.02"/></linearGradient></defs>
      <path d="${area}" fill="url(#cg)"/><path d="${line}" fill="none" stroke="var(--tu-accent)" stroke-width="1.8" stroke-linejoin="round"/>${dots}
      <line id="hc-line" x1="0" y1="${P}" x2="0" y2="${H - P}" stroke="var(--tu-muted)" stroke-width="1" stroke-dasharray="3 2" opacity="0"/>
      <circle id="hc-dot" cx="0" cy="0" r="4.2" fill="var(--tu-accent)" stroke="var(--tu-card)" stroke-width="1.8" opacity="0"/>
    </svg>
    <div class="chart-foot"><span>${esc(tr('chart.step1'))}</span><span>${esc(tr('chart.totalSteps', { n: history.length }))}</span><span>${esc(tr('chart.latest'))}</span></div>
  </div>`;
}

function renderModelAttrRow(m) {
  const c = adjCost(m.input, m.cache, m.output, m.model, m.actualUsd, m.savedUsd);
  return `<div class="ctx-row"><span>${esc(m.model)} (${esc(tr('ctx.steps', { n: m.steps }))})</span><span>${numSpan(m.total)} · ${esc(fmtMoney(c.actualUsd))}</span></div>`;
}

function renderToolTag(tool) {
  const dur = tool.totalSec ? ` (${fmtDur(tool.totalSec)})` : '';
  return `<span class="ctx-tag">🛠 ${esc(tool.name)} ×${tool.count}${dur}</span>`;
}

function renderAttributionCard(models, tools) {
  if (!models?.length && !tools?.length) return '';
  const mRows = (models || []).map(renderModelAttrRow).join('');
  const tRows = (tools || []).slice(0, 5).map(renderToolTag).join('');
  return `<div class="card full">
    <div class="pop-top" style="margin-bottom:4px"><span class="pop-title">${esc(tr('attr.title'))}</span></div>
    ${mRows}
    ${tRows ? `<div class="divider"></div><div style="display:flex;flex-wrap:wrap;gap:4px">${tRows}</div>` : ''}
  </div>`;
}

function renderToolButtons(tools, turnNo, itemIdx) {
  return (tools || []).map((tool, ti) => `<button type="button" class="tool-btn" data-tool-turn="${turnNo}" data-tool-item="${itemIdx}" data-tool-idx="${ti}">
    <span class="ctx-tag" style="margin:0">🛠 ${esc(tool.name)}</span>
    <span class="tool-preview">${esc(tool.preview || '')}</span>
    <span class="tool-json-tag">{ JSON }</span>
  </button>`).join('');
}

function renderPlannerBlock(it, turnNo, itemIdx) {
  const sIn = (it.input || 0) + (it.cache || 0);
  const sAll = sIn + (it.output || 0);
  const tokens = sAll > 0 ? `<span>${numSpan(sAll)} (${tokenBreakdownHtml(it.input || 0, it.cache || 0, it.output || 0)})</span>` : '';
  const parts = [
    it.thinking && `<div class="ctx-block-body mono" style="margin-bottom:5px">💭 ${esc(it.thinking)}</div>`,
    renderToolButtons(it.tools, turnNo, itemIdx),
    it.content && `<div class="ctx-block-body">${esc(it.content)}</div>`,
  ].filter(Boolean).join('');
  return `<div class="ctx-block"><div class="ctx-block-head"><span>🤖 ${esc(tr('turns.modelResp'))}</span>${tokens}</div>${parts || `<div class="sub">${esc(tr('turns.noText'))}</div>`}</div>`;
}

function renderItemBlock(it, turnNo = 0, itemIdx = 0) {
  const clk = fmtClock(Date.parse(it.createdAt || '') || 0);
  if (it.type === 'USER_INPUT') {
    return `<div class="ctx-block"><div class="ctx-block-head"><span>👤 ${esc(tr('turns.userPrompt'))}</span><span>${clk}</span></div><div class="ctx-block-body">${esc(it.content || tr('turns.emptyText'))}</div></div>`;
  }
  if (it.type === 'PLANNER_RESPONSE') return renderPlannerBlock(it, turnNo, itemIdx);
  const errTag = it.status === 'ERROR' || it.type === 'ERROR_MESSAGE' ? ' ⚠️' : '';
  return `<div class="ctx-block"><div class="ctx-block-head"><span>📦 ${esc(tr('turns.toolReturn'))} (${esc(it.type)})${errTag}</span><span>${clk}</span></div><div class="ctx-block-body mono">${esc(it.content || tr('turns.emptyText'))}</div></div>`;
}

function turnDeltaPill(turn) {
  if (!turn.deltaUsed) return '';
  const sign = turn.deltaUsed > 0 ? '+' : '';
  const str = `${sign}${shortNum(turn.deltaUsed)}`;
  const exactStr = `${sign}${exact(turn.deltaUsed)}`;
  const tip = tr(turn.isCompact ? 'turns.compactTip' : 'turns.deltaTip', { val: exactStr });
  const cls = turn.isCompact ? 'delta-pill compact' : 'delta-pill';
  const label = turn.isCompact ? `${str} Compact` : str;
  return `<span class="${cls}" data-tip="${esc(tip)}" tabindex="0">${label}</span>`;
}

function turnFlagsHtml(turn) {
  const parts = [];
  if (turn.mediaCount) {
    const tip = tr('turns.mediaTip', { n: turn.mediaCount });
    parts.push(`<span class="turn-flag" data-tip="${esc(tip)}" tabindex="0" aria-label="${esc(tip)}">🖼</span>`);
  }
  if (turn.errorCount) {
    const tip = tr('turns.errorTip', { n: turn.errorCount });
    parts.push(`<span class="turn-flag c-danger" data-tip="${esc(tip)}" tabindex="0" aria-label="${esc(tip)}">⚠️</span>`);
  }
  if (turn.dlpCount > 0) {
    const tip = tr('turns.dlpTip', { n: turn.dlpCount });
    parts.push(`<button type="button" class="dlp-pill" data-open-dlp data-tip="${esc(tip)}" aria-label="${esc(tip)}">🔒${turn.dlpCount}</button>`);
  }
  return parts.join('');
}

function renderTurnCard(turn, isLatest, isOpen, detailHtml) {
  const tIn = turn.input + turn.cache;
  const cls = ['turn', isLatest && 'latest', isOpen && 'open'].filter(Boolean).join(' ');
  const promptTxt = turn.prompt || tr('turns.noText');
  const inTip = tr('ctx.newCacheTip', { input: exact(turn.input), cache: exact(turn.cache) });
  const cacheRate = pctStr(turn.cache, tIn);
  const cacheTip = tr('turns.cacheTip', { rate: cacheRate, cache: exact(turn.cache), total: exact(tIn) });
  return `<div id="turn-${turn.turn}" class="${cls}">
    <div class="turn-top">
      <span class="turn-left">
        <span>${esc(tr('turns.turnLabel', { n: turn.turn }))}</span>
        <span class="turn-meta c-cache" data-tip="${esc(cacheTip)}" tabindex="0">⚡${cacheRate}</span>
        <span class="dur-wrap" data-dur-turn="${turn.turn}"><span class="dur-badge">⏱ ${fmtDur(turn.durationSec)}</span></span>
        ${turnDeltaPill(turn)}${turnFlagsHtml(turn)}
      </span>
      <span>${numSpan(tIn + turn.output)} (<span class="c-in">↑${numSpan(tIn, inTip, 'c-in')}</span> <span class="c-out">↓${numSpan(turn.output, tr('ctx.outputTip'), 'c-out')}</span>)</span>
    </div>
    <div class="prompt-row">
      <div class="prompt" data-toggle-turn="${turn.turn}"><span class="tu-chevron turn-arrow" aria-hidden="true"></span><span class="prompt-text">${esc(promptTxt)}</span></div>
      <button class="icon-btn" data-copy-prompt="${esc((turn.prompt || '').slice(0, 16))}" title="${esc(tr('turns.copyKey'))}">⧉</button>
    </div>
    <div id="turn-detail-${turn.turn}" class="turn-detail">${detailHtml}</div>
  </div>`;
}

function matchSession(s, q) {
  if (!q) return true;
  const hay = `${s.title || ''} ${s.cid || ''} ${s.workspace || ''}`.toLowerCase();
  return hay.includes(q);
}

function renderSessionItem(s, activeCid) {
  const sIn = s.input + s.cache;
  const locale = i18n()?.getLang?.() === 'en' ? 'en-US' : 'zh-CN';
  const dt = new Date(s.updatedMs).toLocaleString(locale, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const c = adjCost(s.input, s.cache, s.output, s.model, s.actualUsd, s.savedUsd);
  const wsTag = s.workspace ? `<span class="proj-tag">📁 ${esc(s.workspace)}</span> ` : '';
  return `<div class="sess-item ${s.cid === activeCid ? 'active' : ''}" data-open-conv="${esc(s.cid)}">
    <div class="turn-top"><span>${esc(s.title || tr('sess.untitled'))}</span><span>${numSpan(s.total)}</span></div>
    <div class="sub">${wsTag}${dt} · ${esc(tr('sess.turnsUnit', { n: s.turns }))} · <span class="c-in">↑${shortNum(sIn)}</span> <span class="c-out">↓${shortNum(s.output)}</span> · <span class="c-cache">⚡${pctStr(s.cache, sIn)}</span> · ${esc(fmtMoney(c.actualUsd))}</div>
  </div>`;
}

function renderSessionsView(sessions, activeCid, sortBy, query) {
  const q = (query || '').trim().toLowerCase();
  const list = (sessions || []).filter((s) => matchSession(s, q));
  const items = list.slice(0, 60).map((s) => renderSessionItem(s, activeCid)).join('');
  return `<div class="filter-row">
    <input class="search-inp" id="sess-search" placeholder="${esc(tr('sess.searchPlaceholder'))}" value="${esc(query || '')}" />
    <button class="chip ${sortBy === 'recent' ? 'active' : ''}" data-sess-sort="recent">${esc(tr('sess.sort.recent'))}</button>
    <button class="chip ${sortBy === 'tokens' ? 'active' : ''}" data-sess-sort="tokens">${esc(tr('sess.sort.tokens'))}</button>
  </div>
  ${items || `<div class="empty">${esc(tr('sess.empty'))}</div>`}`;
}

function countHistoryCompacts(history) {
  return (history || []).reduce((acc, h, i, arr) => {
    if (i === 0) return acc;
    const prev = arr[i - 1].used;
    return acc + (prev - h.used >= 20000 && h.used / prev <= 0.75 ? 1 : 0);
  }, 0);
}

function buildDesensitizedSessionReport(usage, meta) {
  if (!usage || !usage.ready) return '';
  const tot = usage.totals || { input: 0, cache: 0, output: 0 };
  const totIn = tot.input + tot.cache;
  const cost = calcSessionCost(usage);
  const turns = usage.turns || [];
  const errs = turns.reduce((s, x) => s + (x.errorCount || 0), 0);
  const compacts = countHistoryCompacts(usage.history);
  const models = (usage.models || []).map((m) => `${m.model} (${shortNum(m.total)})`).join(', ') || '-';
  const tools = (usage.tools || []).slice(0, 6).map((x) => `${x.name}×${x.count}`).join(', ') || '-';
  const ver = meta?.version || '1.1.0';
  const repo = meta?.repo || 'RanFeng/token-usage';
  return [
    `# Session Diagnostic Summary (${(usage.conversationId || '').slice(0, 8)}) [Desensitized]`,
    `- Turns: ${turns.length} | Total: ${exact(totIn + tot.output)} (↑${exact(totIn)} ↓${exact(tot.output)} ⚡${pctStr(tot.cache, totIn)})`,
    `- Est. Cost: ${fmtMoney(cost.actualUsd)} (Cache Saved: ${fmtMoney(cost.savedUsd)})`,
    `- Context Peak: ${usage.context?.percent || 0}% | Compacts: ${compacts} | Errors: ${errs}`,
    `- Models: ${models}`,
    `- Top Tools: ${tools}`,
    '',
    `_${tr('share.watermark')} v${ver} · ${repo}_`,
  ].join('\n');
}

window.TokenRenderers = {
  exact, esc, pctStr, fmtUsd, fmtMoney, adjCost, calcSessionCost, fmtClock, shortNum, fmtDur, numSpan,
  renderContextCard, renderDiagnosticsBanner, renderDlpBanner,
  renderHistoryChart, renderAttributionCard, renderItemBlock, renderTurnCard,
  renderSessionsView, buildDesensitizedSessionReport,
};
})();

/**
 * Share card customization preferences (modules + color presets & custom hex overrides).
 * Exposed as window.TokenSharePrefs (bundled here so no extra Sidecar route restart is needed).
 */
(() => {
const KEY = 'tu_share_prefs_v1';
const PRESETS = [
  { id: 'midnight', base: 'dark', bg: '#0b1120', card: '#111b2e', accent: '#3b82f6', accentEnd: '#10b981' },
  { id: 'obsidian', base: 'dark', bg: '#0f0d1a', card: '#18142b', accent: '#8b5cf6', accentEnd: '#ec4899' },
  { id: 'forest', base: 'dark', bg: '#071713', card: '#0e241d', accent: '#10b981', accentEnd: '#06b6d4' },
  { id: 'sunset', base: 'dark', bg: '#18110d', card: '#241a14', accent: '#f59e0b', accentEnd: '#ef4444' },
  { id: 'snow', base: 'light', bg: '#f8fafc', card: '#ffffff', accent: '#2563eb', accentEnd: '#059669' },
];
const MODULE_DEFS = {
  overview: [['roi', 'share.mod.roi'], ['kpis', 'share.mod.kpis'], ['heatmap', 'share.mod.heatmap'], ['models', 'share.mod.models']],
  session: [['kpis', 'share.mod.kpis'], ['curve', 'share.mod.curve'], ['attribution', 'share.mod.attribution']],
};
const THEMES = {
  dark: {
    bg: '#0f172a', card: '#1e293b', cardAlt: '#162032', border: '#334155',
    text: '#f8fafc', muted: '#94a3b8', track: '#273449',
    blue: '#3b82f6', blueSoft: 'rgba(59, 130, 246, 0.16)',
    green: '#10b981', greenSoft: 'rgba(16, 185, 129, 0.16)',
    amber: '#f59e0b', amberSoft: 'rgba(245, 158, 11, 0.18)',
    red: '#ef4444', redSoft: 'rgba(239, 68, 68, 0.18)',
    hm: ['#273449', '#064e3b', '#047857', '#10b981', '#34d399'],
    goldStart: '#f59e0b', goldEnd: '#fbbf24',
    pillStart: '#2563eb', pillEnd: '#10b981',
    curveTop: 'rgba(59, 130, 246, 0.32)', curveBottom: 'rgba(59, 130, 246, 0.02)',
  },
  light: {
    bg: '#f8fafc', card: '#ffffff', cardAlt: '#f1f5f9', border: '#e2e8f0',
    text: '#0f172a', muted: '#64748b', track: '#e2e8f0',
    blue: '#2563eb', blueSoft: 'rgba(37, 99, 235, 0.10)',
    green: '#059669', greenSoft: 'rgba(5, 150, 105, 0.12)',
    amber: '#d97706', amberSoft: 'rgba(217, 119, 6, 0.13)',
    red: '#dc2626', redSoft: 'rgba(220, 38, 38, 0.12)',
    hm: ['#e2e8f0', '#a7f3d0', '#34d399', '#10b981', '#047857'],
    goldStart: '#d97706', goldEnd: '#f59e0b',
    pillStart: '#2563eb', pillEnd: '#059669',
    curveTop: 'rgba(37, 99, 235, 0.24)', curveBottom: 'rgba(37, 99, 235, 0.02)',
  },
};
const HEX_RE = /^#[0-9a-f]{6}$/i;
const cleanHex = (v, fb) => (typeof v === 'string' && HEX_RE.test(v.trim()) ? v.trim() : fb);
const hexToRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r}, ${g}, ${b}, ${a})`; };
const isLightHex = (hex) => { const [r, g, b] = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) > 155; };

function defaultPrefs() {
  return {
    preset: 'midnight',
    colors: { bg: '#0b1120', card: '#111b2e', accent: '#3b82f6', accentEnd: '#10b981' },
    modules: { overview: ['roi', 'kpis', 'heatmap', 'models'], session: ['kpis', 'curve', 'attribution'] },
  };
}

function sanitizeList(raw, kind) {
  const valid = new Set(MODULE_DEFS[kind].map(([id]) => id));
  const list = Array.isArray(raw) ? raw.filter((id) => valid.has(id)) : [];
  return list.length ? list : MODULE_DEFS[kind].map(([id]) => id);
}

function loadPrefs() {
  const def = defaultPrefs();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return def;
    const c = raw.colors || {};
    return {
      preset: PRESETS.some((p) => p.id === raw.preset) ? raw.preset : 'custom',
      colors: {
        bg: cleanHex(c.bg, def.colors.bg),
        card: cleanHex(c.card, def.colors.card),
        accent: cleanHex(c.accent, def.colors.accent),
        accentEnd: cleanHex(c.accentEnd, cleanHex(c.accent, def.colors.accentEnd)),
      },
      modules: {
        overview: sanitizeList(raw.modules?.overview, 'overview'),
        session: sanitizeList(raw.modules?.session, 'session'),
      },
    };
  } catch { return def; }
}

function savePrefs(prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
  return prefs;
}

function applyPreset(id) {
  const p = PRESETS.find((x) => x.id === id) || PRESETS[0];
  const cur = loadPrefs();
  cur.preset = p.id;
  cur.colors = { bg: p.bg, card: p.card, accent: p.accent, accentEnd: p.accentEnd };
  return savePrefs(cur);
}

function updateColor(field, val) {
  const cur = loadPrefs();
  const hex = cleanHex(val, cur.colors[field]);
  cur.preset = 'custom';
  cur.colors[field] = hex;
  if (field === 'accent') cur.colors.accentEnd = hex;
  return savePrefs(cur);
}

function toggleModule(kind, modId) {
  const cur = loadPrefs();
  const list = cur.modules[kind] || [];
  const has = list.includes(modId);
  if (has && list.length <= 1) return cur;
  const order = MODULE_DEFS[kind].map(([id]) => id);
  cur.modules[kind] = has ? list.filter((id) => id !== modId) : order.filter((id) => id === modId || list.includes(id));
  return savePrefs(cur);
}

function resetPrefs() {
  return savePrefs(defaultPrefs());
}

function resolveTheme(mode, colors) {
  if (!colors || !HEX_RE.test(colors.bg || '')) return mode === 'light' ? THEMES.light : THEMES.dark;
  const light = isLightHex(colors.bg);
  const base = light ? THEMES.light : THEMES.dark;
  const accent = cleanHex(colors.accent, base.blue);
  const accentEnd = cleanHex(colors.accentEnd, accent);
  return {
    ...base, bg: cleanHex(colors.bg, base.bg), card: cleanHex(colors.card, base.card),
    blue: accent, pillStart: accent, pillEnd: accentEnd,
    curveTop: rgba(accent, light ? 0.24 : 0.34), curveBottom: rgba(accent, 0.02),
    hm: [base.hm[0], rgba(accent, 0.26), rgba(accent, 0.48), rgba(accent, 0.72), accent],
  };
}

function layoutSections(all, enabled, startY, gap) {
  const list = enabled ? all.filter((s) => enabled.includes(s.id)) : all;
  const active = list.length ? list : all;
  let y = startY;
  const placed = active.map((s) => { const item = { ...s, y }; y += s.h + gap; return item; });
  return { placed, height: y - gap + 34 };
}

window.TokenSharePrefs = {
  THEMES, PRESETS, MODULE_DEFS, loadPrefs, applyPreset, updateColor, toggleModule, resetPrefs, resolveTheme, layoutSections,
};
})();

/**
 * Official coding agent brand icons (sourced from @lobehub/icons-static-svg, stored in assets/icons/).
 * Exposed as window.TokenAgentIcons for both DOM and Canvas 2D rendering.
 */
(() => {
const AGENT_SVGS = {
  "antigravity": "<svg height=\"64\" style=\"flex:none;line-height:1\" viewBox=\"0 0 24 24\" width=\"64\" xmlns=\"http://www.w3.org/2000/svg\"><title>Antigravity</title><mask height=\"23\" id=\"lobe-icons-antigravity-0-_R_0_\" maskUnits=\"userSpaceOnUse\" width=\"24\" x=\"0\" y=\"1\"><path d=\"M21.751 22.607c1.34 1.005 3.35.335 1.508-1.508C17.73 15.74 18.904 1 12.037 1 5.17 1 6.342 15.74.815 21.1c-2.01 2.009.167 2.511 1.507 1.506 5.192-3.517 4.857-9.714 9.715-9.714 4.857 0 4.522 6.197 9.714 9.715z\" fill=\"#fff\"></path></mask><g mask=\"url(#lobe-icons-antigravity-0-_R_0_)\"><g filter=\"url(#lobe-icons-antigravity-1-_R_0_)\"><path d=\"M-1.018-3.992c-.408 3.591 2.686 6.89 6.91 7.37 4.225.48 7.98-2.043 8.387-5.633.408-3.59-2.686-6.89-6.91-7.37-4.225-.479-7.98 2.043-8.387 5.633z\" fill=\"#FFE432\"></path></g><g filter=\"url(#lobe-icons-antigravity-2-_R_0_)\"><path d=\"M15.269 7.747c1.058 4.557 5.691 7.374 10.348 6.293 4.657-1.082 7.575-5.653 6.516-10.21-1.058-4.556-5.691-7.374-10.348-6.292-4.657 1.082-7.575 5.653-6.516 10.21z\" fill=\"#FC413D\"></path></g><g filter=\"url(#lobe-icons-antigravity-3-_R_0_)\"><path d=\"M-12.443 10.804c1.338 4.703 7.36 7.11 13.453 5.378 6.092-1.733 9.947-6.95 8.61-11.652C8.282-.173 2.26-2.58-3.833-.848-9.925.884-13.78 6.1-12.443 10.804z\" fill=\"#00B95C\"></path></g><g filter=\"url(#lobe-icons-antigravity-4-_R_0_)\"><path d=\"M-12.443 10.804c1.338 4.703 7.36 7.11 13.453 5.378 6.092-1.733 9.947-6.95 8.61-11.652C8.282-.173 2.26-2.58-3.833-.848-9.925.884-13.78 6.1-12.443 10.804z\" fill=\"#00B95C\"></path></g><g filter=\"url(#lobe-icons-antigravity-5-_R_0_)\"><path d=\"M-7.608 14.703c3.352 3.424 9.126 3.208 12.896-.483 3.77-3.69 4.108-9.459.756-12.883C2.69-2.087-3.083-1.871-6.853 1.82c-3.77 3.69-4.108 9.458-.755 12.883z\" fill=\"#00B95C\"></path></g><g filter=\"url(#lobe-icons-antigravity-6-_R_0_)\"><path d=\"M9.932 27.617c1.04 4.482 5.384 7.303 9.7 6.3 4.316-1.002 6.971-5.448 5.93-9.93-1.04-4.483-5.384-7.304-9.7-6.301-4.316 1.002-6.971 5.448-5.93 9.93z\" fill=\"#3186FF\"></path></g><g filter=\"url(#lobe-icons-antigravity-7-_R_0_)\"><path d=\"M2.572-8.185C.392-3.329 2.778 2.472 7.9 4.771c5.122 2.3 11.042.227 13.222-4.63 2.18-4.855-.205-10.656-5.327-12.955-5.122-2.3-11.042-.227-13.222 4.63z\" fill=\"#FBBC04\"></path></g><g filter=\"url(#lobe-icons-antigravity-8-_R_0_)\"><path d=\"M-3.267 38.686c-5.277-2.072 3.742-19.117 5.984-24.83 2.243-5.712 8.34-8.664 13.616-6.592 5.278 2.071 11.533 13.482 9.29 19.195-2.242 5.713-23.613 14.298-28.89 12.227z\" fill=\"#3186FF\"></path></g><g filter=\"url(#lobe-icons-antigravity-9-_R_0_)\"><path d=\"M28.71 17.471c-1.413 1.649-5.1.808-8.236-1.878-3.135-2.687-4.531-6.201-3.118-7.85 1.412-1.649 5.1-.808 8.235 1.878s4.532 6.2 3.119 7.85z\" fill=\"#749BFF\"></path></g><g filter=\"url(#lobe-icons-antigravity-10-_R_0_)\"><path d=\"M18.163 9.077c5.81 3.93 12.502 4.19 14.946.577 2.443-3.612-.287-9.727-6.098-13.658-5.81-3.931-12.502-4.19-14.946-.577-2.443 3.612.287 9.727 6.098 13.658z\" fill=\"#FC413D\"></path></g><g filter=\"url(#lobe-icons-antigravity-11-_R_0_)\"><path d=\"M-.915 2.684c-1.44 3.473-.97 6.967 1.05 7.804 2.02.837 4.824-1.3 6.264-4.772 1.44-3.473.97-6.967-1.05-7.804-2.02-.837-4.824 1.3-6.264 4.772z\" fill=\"#FFEE48\"></path></g></g><defs><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"17.587\" id=\"lobe-icons-antigravity-1-_R_0_\" width=\"19.838\" x=\"-3.288\" y=\"-11.917\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"1.117\"></feGaussianBlur></filter><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"38.565\" id=\"lobe-icons-antigravity-2-_R_0_\" width=\"38.9\" x=\"4.251\" y=\"-13.493\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"5.4\"></feGaussianBlur></filter><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"36.517\" id=\"lobe-icons-antigravity-3-_R_0_\" width=\"40.955\" x=\"-21.889\" y=\"-10.592\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"4.591\"></feGaussianBlur></filter><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"36.517\" id=\"lobe-icons-antigravity-4-_R_0_\" width=\"40.955\" x=\"-21.889\" y=\"-10.592\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"4.591\"></feGaussianBlur></filter><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"36.595\" id=\"lobe-icons-antigravity-5-_R_0_\" width=\"36.632\" x=\"-19.099\" y=\"-10.278\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"4.591\"></feGaussianBlur></filter><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"34.087\" id=\"lobe-icons-antigravity-6-_R_0_\" width=\"33.533\" x=\".981\" y=\"8.758\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"4.363\"></feGaussianBlur></filter><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"35.276\" id=\"lobe-icons-antigravity-7-_R_0_\" width=\"35.978\" x=\"-6.143\" y=\"-21.659\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"3.954\"></feGaussianBlur></filter><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"46.523\" id=\"lobe-icons-antigravity-8-_R_0_\" width=\"45.114\" x=\"-11.96\" y=\"-.46\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"3.531\"></feGaussianBlur></filter><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"24.054\" id=\"lobe-icons-antigravity-9-_R_0_\" width=\"25.094\" x=\"10.485\" y=\".58\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"3.159\"></feGaussianBlur></filter><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"30.007\" id=\"lobe-icons-antigravity-10-_R_0_\" width=\"33.508\" x=\"5.833\" y=\"-12.467\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"2.669\"></feGaussianBlur></filter><filter color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"26.151\" id=\"lobe-icons-antigravity-11-_R_0_\" width=\"22.194\" x=\"-8.355\" y=\"-8.876\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"></feFlood><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"></feBlend><feGaussianBlur result=\"effect1_foregroundBlur_977_115\" stdDeviation=\"3.303\"></feGaussianBlur></filter></defs></svg>",
  "claude_code": "<svg height=\"64\" style=\"flex:none;line-height:1\" viewBox=\"0 0 24 24\" width=\"64\" xmlns=\"http://www.w3.org/2000/svg\"><title>Claude</title><path d=\"M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z\" fill=\"#D97757\" fill-rule=\"nonzero\"></path></svg>",
  "cursor": "<svg fill=\"currentColor\" fill-rule=\"evenodd\" height=\"64\" style=\"flex:none;line-height:1\" viewBox=\"0 0 24 24\" width=\"64\" xmlns=\"http://www.w3.org/2000/svg\"><title>Cursor</title><path d=\"M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z\"></path></svg>",
  "codex": "<svg fill=\"currentColor\" fill-rule=\"evenodd\" height=\"64\" style=\"flex:none;line-height:1\" viewBox=\"0 0 24 24\" width=\"64\" xmlns=\"http://www.w3.org/2000/svg\"><title>OpenAI</title><path d=\"M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z\"></path></svg>",
  "gemini_cli": "<svg height=\"64\" style=\"flex:none;line-height:1\" viewBox=\"0 0 24 24\" width=\"64\" xmlns=\"http://www.w3.org/2000/svg\"><title>Gemini</title><path d=\"M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z\" fill=\"#3186FF\"></path><path d=\"M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z\" fill=\"url(#lobe-icons-gemini-0-_R_0_)\"></path><path d=\"M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z\" fill=\"url(#lobe-icons-gemini-1-_R_0_)\"></path><path d=\"M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z\" fill=\"url(#lobe-icons-gemini-2-_R_0_)\"></path><defs><linearGradient gradientUnits=\"userSpaceOnUse\" id=\"lobe-icons-gemini-0-_R_0_\" x1=\"7\" x2=\"11\" y1=\"15.5\" y2=\"12\"><stop stop-color=\"#08B962\"></stop><stop offset=\"1\" stop-color=\"#08B962\" stop-opacity=\"0\"></stop></linearGradient><linearGradient gradientUnits=\"userSpaceOnUse\" id=\"lobe-icons-gemini-1-_R_0_\" x1=\"8\" x2=\"11.5\" y1=\"5.5\" y2=\"11\"><stop stop-color=\"#F94543\"></stop><stop offset=\"1\" stop-color=\"#F94543\" stop-opacity=\"0\"></stop></linearGradient><linearGradient gradientUnits=\"userSpaceOnUse\" id=\"lobe-icons-gemini-2-_R_0_\" x1=\"3.5\" x2=\"17.5\" y1=\"13.5\" y2=\"12\"><stop stop-color=\"#FABC12\"></stop><stop offset=\".46\" stop-color=\"#FABC12\" stop-opacity=\"0\"></stop></linearGradient></defs></svg>"
};
const IMG_CACHE = new Map();

function getSvg(id, color) {
  const raw = AGENT_SVGS[id] || AGENT_SVGS.antigravity;
  return color ? raw.replace(/currentColor/g, color) : raw;
}

function getImg(id, isDark, onLoad) {
  const key = `${id || "antigravity"}:${isDark ? "d" : "l"}`;
  if (IMG_CACHE.has(key)) return IMG_CACHE.get(key);
  if (typeof Image === "undefined") return null;
  const color = isDark ? "#f8fafc" : "#0f172a";
  const img = new Image();
  img.onload = () => { if (typeof onLoad === "function") onLoad(); };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(getSvg(id, color));
  IMG_CACHE.set(key, img);
  return img;
}

function preload() {
  if (typeof Image === "undefined") return;
  Object.keys(AGENT_SVGS).forEach((id) => { getImg(id, true); getImg(id, false); });
}

preload();
window.TokenAgentIcons = { getSvg, getImg, preload };
})();
