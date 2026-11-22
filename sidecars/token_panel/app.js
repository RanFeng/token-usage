/**
 * Token Usage sidecar frontend controller.
 */
(() => {
const {
  esc, exact, fmtClock, fmtDur, fmtMoney, calcSessionCost, pctStr, shortNum,
  renderAttributionCard, renderContextCard, renderDiagnosticsBanner, renderDlpBanner,
  renderHistoryChart, renderItemBlock, renderSessionsView, renderTurnCard,
  buildDesensitizedSessionReport,
} = window.TokenRenderers;

const PLAN_KEY = 'tu_plan_usd';
const apiFetch = (url, opts) => (window.sidecar?.fetch ? window.sidecar.fetch(url, opts) : fetch(url, opts));
const i18n = () => window.TokenI18n;
const tr = (key, params) => (i18n()?.t ? i18n().t(key, params) : key);

function loadPlanUsd() {
  if (i18n()?.getSubscription) return i18n().getSubscription().planUsd;
  try {
    const n = Math.round(Number(localStorage.getItem(PLAN_KEY)));
    return Number.isFinite(n) && n >= 1 && n <= 9999 ? n : 20;
  } catch {
    return 20;
  }
}

const state = {
  tab: 'current', etag: '', usage: null, overview: null, meta: null,
  planUsd: loadPlanUsd(), diagDismissed: false,
  turnFilter: 'all', turnQuery: '', sessSort: 'recent', sessQuery: '',
  expandedTurns: new Set(), turnDetails: new Map(), activeTipEl: null, hoverTipEl: null, activeDurEl: null,
};

function savePlanUsd(val) {
  if (i18n()?.setSubscription) {
    state.planUsd = i18n().setSubscription({ planUsd: val }).planUsd;
    return;
  }
  const n = Math.max(1, Math.min(9999, Math.round(Number(val) || 20)));
  state.planUsd = n;
  try { localStorage.setItem(PLAN_KEY, String(n)); } catch {}
}

function currentConvId() {
  const qs = new URLSearchParams(location.search);
  return (window.sidecar && window.sidecar.conversationId) || qs.get('conversationId') || '';
}

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function tryExecCommandCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return Boolean(ok);
  } catch {
    return false;
  }
}

async function tryNativeClipboard(payload) {
  try {
    const res = await apiFetch('/api/clipboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data && data.ok);
  } catch {
    return false;
  }
}

async function copyTextToClipboard(text) {
  const str = String(text ?? '');
  if (!str) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(str);
      return true;
    }
  } catch {}
  if (tryExecCommandCopy(str)) return true;
  return tryNativeClipboard({ type: 'text', text: str });
}

window.TokenClipboard = { copyText: copyTextToClipboard };

async function copyText(text, okMsg) {
  const ok = await copyTextToClipboard(text);
  showToast(ok ? (okMsg || tr('toast.copied')) : tr('toast.copyFailed'));
}

function positionPop(pop, rect) {
  const left = Math.min(window.innerWidth - pop.offsetWidth - 10, Math.max(10, rect.left));
  const below = rect.bottom + 6 + pop.offsetHeight <= window.innerHeight;
  const top = below ? rect.bottom + 6 : rect.top - pop.offsetHeight - 6;
  pop.style.left = `${left}px`;
  pop.style.top = `${Math.max(8, top)}px`;
}

function showTip(el) {
  const pop = document.getElementById('tip-pop');
  const text = el?.getAttribute('data-tip');
  if (!pop || !text) return;
  pop.textContent = text;
  pop.style.display = 'block';
  positionPop(pop, el.getBoundingClientRect());
}

function hideTip() {
  const pop = document.getElementById('tip-pop');
  if (pop) pop.style.display = 'none';
  state.activeTipEl = null;
  state.hoverTipEl = null;
}

function toggleTip(el) {
  if (state.activeTipEl === el) return hideTip();
  state.activeTipEl = el;
  state.hoverTipEl = null;
  showTip(el);
}

function handleTipEnter(target) {
  const el = target?.closest?.('[data-tip]');
  if (!el || state.activeTipEl || state.hoverTipEl === el) return;
  state.hoverTipEl = el;
  showTip(el);
}

function handleTipLeave(target, related) {
  const el = state.hoverTipEl;
  if (!el || state.activeTipEl || !target?.closest?.('[data-tip]')) return;
  if (related && el.contains(related)) return;
  hideTip();
}

function hideDurPop() {
  document.getElementById('dur-pop')?.classList.remove('show');
  state.activeDurEl = null;
}

function renderDurStep(s, idx) {
  const extra = s.tools?.length > 1 ? ` ×${s.tools.length}` : '';
  const label = s.tools?.length ? `${s.tools[0]}${extra}` : tr('turns.finalReply');
  const sub = s.toolSec > 0
    ? `${tr('turns.modelSec', { val: fmtDur(s.modelSec) })} ${tr('turns.toolSec', { val: fmtDur(s.toolSec) })}`
    : fmtDur(s.durationSec);
  return `<div class="dur-step"><span class="dur-step-name">#${idx + 1} ${esc(label)}</span><span>${esc(sub)}</span></div>`;
}

function toggleDurPop(target, turnNo) {
  const pop = document.getElementById('dur-pop');
  if (state.activeDurEl === target && pop?.classList.contains('show')) return hideDurPop();
  const t = (state.usage?.turns || []).find((x) => x.turn === turnNo);
  if (!t || !pop) return;
  state.activeDurEl = target;
  const rows = (t.steps || []).map(renderDurStep).join('');
  const emptyRow = `<div class="dur-step"><span class="dur-step-name">${esc(tr('turns.durSingle'))}</span><span>&lt;1s</span></div>`;
  pop.innerHTML = `<div class="dur-title"><span>${esc(tr('turns.durTitle', { n: t.turn }))}</span><span>${fmtDur(t.durationSec)}</span></div>
    ${rows || emptyRow}
    <div class="dur-foot"><span>${fmtClock(t.startMs)} → ${fmtClock(t.endMs)}</span><span>${esc(tr('turns.steps', { n: (t.steps || []).length }))}</span></div>`;
  pop.classList.add('show');
  positionPop(pop, target.getBoundingClientRect());
}

function withConvParam(url) {
  const conv = currentConvId();
  return conv ? `${url}&conversationId=${encodeURIComponent(conv)}` : url;
}

async function loadTurnDetail(turnNo) {
  try {
    const res = await apiFetch(withConvParam(`/api/turn?turn=${turnNo}`));
    const data = await res.json();
    if (!data.ok) return;
    state.turnDetails.set(turnNo, data);
    const box = document.getElementById(`turn-detail-${turnNo}`);
    if (box) box.innerHTML = (data.items || []).map((it, idx) => renderItemBlock(it, turnNo, idx)).join('') || `<div class="sub">${esc(tr('turns.noDetail'))}</div>`;
  } catch {}
}

const TURN_PRED = {
  high: (t, avg) => (t.input + t.cache + t.output) >= Math.max(avg, 50000),
  error: (t) => t.errorCount > 0,
  media: (t) => t.mediaCount > 0,
};

function filterTurns(turns) {
  const q = state.turnQuery.trim().toLowerCase();
  const avg = turns.length ? turns.reduce((s, t) => s + t.input + t.cache + t.output, 0) / turns.length : 0;
  const pred = TURN_PRED[state.turnFilter];
  return turns.filter((t) => (!q || (t.prompt || '').toLowerCase().includes(q)) && (!pred || pred(t, avg)));
}

function renderTurnDetailHtml(turnNo, open) {
  if (!open) return '';
  const det = state.turnDetails.get(turnNo);
  if (!det) return `<div class="sub">${esc(tr('turns.loading'))}</div>`;
  return (det.items || []).map((it, idx) => renderItemBlock(it, turnNo, idx)).join('');
}

function renderTurnFilterChips() {
  const defs = [
    ['all', 'turns.filter.all'],
    ['high', 'turns.filter.high'],
    ['error', 'turns.filter.error'],
    ['media', 'turns.filter.media'],
  ];
  return defs.map(([k, key]) => (
    `<button class="chip ${state.turnFilter === k ? 'active' : ''}" data-turn-filter="${k}">${esc(tr(key))}</button>`
  )).join('');
}

function renderCurrentTab() {
  const d = state.usage;
  if (!d || !d.ready) return `<div class="empty">${esc(tr('turns.waiting'))}</div>`;
  const turns = filterTurns(d.turns || []).slice().reverse();
  const cards = turns.map((t, i) => {
    const open = state.expandedTurns.has(t.turn);
    const isLatest = i === 0 && state.turnFilter === 'all' && !state.turnQuery;
    return renderTurnCard(t, isLatest, open, renderTurnDetailHtml(t.turn, open));
  }).join('');
  return `<div class="grid">${renderDlpBanner(d.dlp)}${renderDiagnosticsBanner(d.diagnostics, state.diagDismissed)}${renderContextCard(d)}${renderHistoryChart(d.history)}${renderAttributionCard(d.models, d.tools)}</div>
    <div class="sec-bar"><span class="sec-title">${esc(tr('turns.title', { shown: turns.length, total: (d.turns || []).length }))}</span></div>
    <div class="filter-row"><input class="search-inp" id="turn-search" placeholder="${esc(tr('turns.searchPlaceholder'))}" value="${esc(state.turnQuery)}" />${renderTurnFilterChips()}</div>
    ${cards || `<div class="empty">${esc(tr('turns.empty'))}</div>`}`;
}

function renderActiveTab() {
  const app = document.getElementById('app');
  if (!app) return;
  if (state.tab === 'current') { app.innerHTML = renderCurrentTab(); return; }
  if (state.tab === 'sessions') {
    app.innerHTML = renderSessionsView(state.overview?.sessions, state.usage?.conversationId, state.sessSort, state.sessQuery);
    return;
  }
  app.innerHTML = window.OverviewUI.render(state.overview, state.planUsd);
}

function applyUsagePayload(data) {
  if (data.unchanged) return;
  state.etag = data.etag || '';
  state.usage = data;
  if (state.tab === 'current') renderActiveTab();
}

async function pollUsage() {
  try {
    const res = await apiFetch(withConvParam(`/api/usage?etag=${encodeURIComponent(state.etag)}`));
    applyUsagePayload(await res.json());
  } catch {}
}

async function loadOverview() {
  try {
    const hasSub = Boolean(i18n()?.hasSubscription?.());
    const sub = hasSub ? i18n().getSubscription() : { cycleType: 'monthly', resetDay: 1 };
    const qs = `sort=${encodeURIComponent(state.sessSort)}&cycle=${encodeURIComponent(sub.cycleType)}&resetDay=${sub.resetDay}`;
    const res = await apiFetch(`/api/overview?${qs}`);
    state.overview = await res.json();
    if (state.tab !== 'current') renderActiveTab();
  } catch {}
}

async function loadMeta() {
  try {
    const res = await apiFetch('/api/meta');
    if (!res.ok) return;
    state.meta = await res.json();
    const verEl = document.getElementById('cid');
    if (verEl && state.meta?.version) verEl.textContent = `v${state.meta.version}`;
    const upd = await window.TokenModals?.checkForUpdateQuiet?.(state.meta);
    document.getElementById('update-dot')?.classList.toggle('show', Boolean(upd?.hasUpdate));
  } catch {}
}

function buildShareOpts(cfg) {
  const repo = state.meta?.repo || 'RanFeng/token-usage';
  const c = typeof cfg === 'string' ? { theme: cfg } : (cfg || {});
  return {
    planUsd: state.planUsd,
    theme: c.theme || 'dark',
    colors: c.colors || null,
    modules: c.modules || null,
    lang: i18n()?.getLang?.() || 'zh',
    fmtMoney,
    t: tr,
    repoLabel: `github.com/${repo}`,
    version: state.meta?.version || '1.1.0',
  };
}

function openOverviewShareModal() {
  if (!state.overview || !window.TokenShareCard || !window.TokenModals) return showToast(tr('toast.noData'));
  window.TokenModals.openShareModal({
    title: tr('share.titleOverview'),
    cardKind: 'overview',
    filename: 'token-usage-overview.png',
    renderFn: (cfg) => window.TokenShareCard.renderOverviewCard(state.overview, buildShareOpts(cfg)),
    onToast: showToast,
  });
}

function openSessionShareModal() {
  if (!state.usage?.ready || !window.TokenShareCard || !window.TokenModals) return showToast(tr('toast.noData'));
  const shortId = (state.usage.conversationId || 'session').slice(0, 8);
  window.TokenModals.openShareModal({
    title: tr('share.titleSession'),
    cardKind: 'session',
    filename: `token-session-${shortId}.png`,
    renderFn: (cfg) => window.TokenShareCard.renderSessionDiagCard(state.usage, buildShareOpts(cfg)),
    onToast: showToast,
  });
}

function openSettingsCenter(scrollTo = '') {
  if (!window.TokenModals) return;
  window.TokenModals.openSettingsModal({
    meta: state.meta,
    scrollTo,
    onSettingsChanged: () => { i18n()?.applyStaticDom(); renderActiveTab(); },
    onSubscriptionChanged: (sub) => {
      if (sub?.planUsd) state.planUsd = sub.planUsd;
      renderActiveTab();
      loadOverview();
    },
    onToast: showToast,
  });
}

function jumpToTurn(turnNo) {
  state.tab = 'current';
  state.turnFilter = 'all';
  state.turnQuery = '';
  state.expandedTurns.add(turnNo);
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'current'));
  renderActiveTab();
  loadTurnDetail(turnNo);
  requestAnimationFrame(() => document.getElementById(`turn-${turnNo}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function openDlpCenter() {
  if (!window.TokenModals) return;
  window.TokenModals.openDlpModal({ dlp: state.usage?.dlp, onJumpTurn: jumpToTurn, onToast: showToast });
}

function handleToggleLang() {
  i18n()?.toggleLang();
  i18n()?.applyStaticDom();
  renderActiveTab();
}

function handleTabClick(tabBtn) {
  state.tab = tabBtn.dataset.tab;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b === tabBtn));
  renderActiveTab();
  if (state.tab !== 'current') loadOverview();
}

function handlePopupClick(target, e) {
  const durEl = target.closest('[data-dur-turn]');
  if (durEl) { e.stopPropagation(); hideTip(); toggleDurPop(durEl, Number(durEl.dataset.durTurn)); return true; }
  const tipEl = target.closest('[data-tip]');
  if (tipEl && !tipEl.closest('[data-open-dlp]')) { e.stopPropagation(); hideDurPop(); toggleTip(tipEl); return true; }
  return false;
}

function dismissPopups(target) {
  if (!target.closest('#dur-pop')) hideDurPop();
  hideTip();
}

function handleFeatureClick(target) {
  if (target.closest('[data-sess-share]')) { openSessionShareModal(); return true; }
  if (target.closest('[data-open-dlp]')) { openDlpCenter(); return true; }
  if (target.closest('[data-diag-dismiss]')) { state.diagDismissed = !state.diagDismissed; renderActiveTab(); return true; }
  const setBtn = target.closest('[data-open-settings]');
  if (setBtn) { openSettingsCenter(setBtn.dataset.openSettings || ''); return true; }
  return false;
}

function handleOverviewClick(target) {
  if (target.closest('[data-ov-share]')) { openOverviewShareModal(); return true; }
  return false;
}

function openToolModal(toolBtn) {
  const det = state.turnDetails.get(Number(toolBtn.dataset.toolTurn));
  const tool = det?.items?.[Number(toolBtn.dataset.toolItem)]?.tools?.[Number(toolBtn.dataset.toolIdx)];
  if (tool && window.JsonModal) window.JsonModal.open(`🛠 ${tool.name}`, tool.args, showToast);
}

function toggleTurnExpand(turnNo) {
  const open = !state.expandedTurns.has(turnNo);
  open ? state.expandedTurns.add(turnNo) : state.expandedTurns.delete(turnNo);
  renderActiveTab();
  if (open) loadTurnDetail(turnNo);
}

function handleTurnActionClick(target) {
  const toolBtn = target.closest('[data-tool-turn]');
  if (toolBtn) { openToolModal(toolBtn); return true; }
  const copyBtn = target.closest('[data-copy-prompt]');
  if (copyBtn) { copyText(copyBtn.dataset.copyPrompt, tr('turns.copyKeyToast')); return true; }
  const toggleBtn = target.closest('[data-toggle-turn]');
  if (toggleBtn) { toggleTurnExpand(Number(toggleBtn.dataset.toggleTurn)); return true; }
  return false;
}

function openConversation(cid) {
  if (!cid || !window.sidecar?.ui?.toggleConversation) return;
  window.sidecar.ui.toggleConversation(cid);
  showToast(tr('sess.switching'));
}

function handleListClick(target) {
  const tf = target.closest('[data-turn-filter]');
  if (tf) { state.turnFilter = tf.dataset.turnFilter; renderActiveTab(); return true; }
  const ss = target.closest('[data-sess-sort]');
  if (ss) { state.sessSort = ss.dataset.sessSort; loadOverview(); return true; }
  return false;
}

function handleDocClick(e) {
  const tabBtn = e.target.closest('.tab');
  if (tabBtn) return handleTabClick(tabBtn);
  if (handlePopupClick(e.target, e)) return;
  dismissPopups(e.target);
  const handled = handleFeatureClick(e.target) || handleOverviewClick(e.target)
    || handleTurnActionClick(e.target) || handleListClick(e.target);
  const openConv = !handled && e.target.closest('[data-open-conv]');
  if (openConv) openConversation(openConv.dataset.openConv);
}

function handleInput(e) {
  if (e.target.id === 'turn-search') { state.turnQuery = e.target.value; renderActiveTab(); document.getElementById('turn-search')?.focus(); return; }
  if (e.target.id === 'sess-search') { state.sessQuery = e.target.value; renderActiveTab(); document.getElementById('sess-search')?.focus(); }
}

function placeChartMarker(svg, x, y, isCompact) {
  const line = svg.querySelector('#hc-line');
  const dot = svg.querySelector('#hc-dot');
  if (line) { line.setAttribute('x1', x.toFixed(1)); line.setAttribute('x2', x.toFixed(1)); line.setAttribute('opacity', '0.8'); }
  if (!dot) return;
  dot.setAttribute('cx', x.toFixed(1));
  dot.setAttribute('cy', y.toFixed(1));
  dot.setAttribute('fill', isCompact ? 'var(--tu-danger)' : 'var(--tu-accent)');
  dot.setAttribute('opacity', '1');
}

function placeTipAtCursor(pop, e) {
  const left = Math.min(window.innerWidth - pop.offsetWidth - 10, Math.max(10, e.clientX + 12));
  const above = e.clientY - pop.offsetHeight - 12 >= 8;
  const top = above ? e.clientY - pop.offsetHeight - 12 : e.clientY + 14;
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}

function showChartTip(cur, idx, delta, isCompact, e) {
  const pop = document.getElementById('tip-pop');
  if (!pop) return;
  const deltaTxt = `${delta >= 0 ? '+' : ''}${shortNum(delta)}`;
  const tag = isCompact ? ' <span class="c-danger">Compact</span>' : '';
  pop.innerHTML = `<div style="font-weight:600;margin-bottom:2px">${esc(tr('chart.hoverTitle', { turn: cur.turn, step: idx + 1 }))}${tag}</div><div>${esc(tr('chart.windowLabel'))}<b>${exact(cur.used)}</b> (${deltaTxt})</div>`;
  pop.style.display = 'block';
  placeTipAtCursor(pop, e);
}

function updateChartHover(svg, e) {
  const history = state.usage?.history;
  if (!history || history.length < 2) return;
  const rect = svg.getBoundingClientRect();
  const W = 300, H = 88, P = 8;
  const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(rect.width, 1)));
  const idx = Math.round(relX * (history.length - 1));
  const cur = history[idx];
  const prev = idx > 0 ? history[idx - 1].used : cur.used;
  const maxUsed = Math.max(...history.map((h) => h.used), 1);
  const x = P + (idx / (history.length - 1)) * (W - P * 2);
  const y = H - P - (cur.used / maxUsed) * (H - P * 2);
  const isCompact = idx > 0 && prev - cur.used >= 20000 && cur.used / prev <= 0.75;
  placeChartMarker(svg, x, y, isCompact);
  showChartTip(cur, idx, idx > 0 ? cur.used - prev : cur.used, isCompact, e);
}

function clearChartHover() {
  const svg = document.getElementById('history-chart-svg');
  if (svg) {
    svg.querySelector('#hc-line')?.setAttribute('opacity', '0');
    svg.querySelector('#hc-dot')?.setAttribute('opacity', '0');
  }
  if (!state.activeTipEl) hideTip();
}

function handleMouseMove(e) {
  const svg = e.target.closest('#history-chart-svg');
  if (svg) return updateChartHover(svg, e);
  if (!state.activeTipEl && document.getElementById('hc-dot')?.getAttribute('opacity') === '1') clearChartHover();
}

function moveToolbarFocus(bar, items, e) {
  const rtl = getComputedStyle(bar).direction === 'rtl';
  const map = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, Home: 'start', End: 'end' };
  const act = map[e.key];
  if (act === undefined) return;
  const idx = items.indexOf(document.activeElement);
  if (idx < 0) return;
  e.preventDefault();
  const next = act === 'start' ? 0 : (act === 'end' ? items.length - 1 : (idx + act + items.length) % items.length);
  items[next].focus();
}

function initHeadToolbar() {
  if ('focusGroup' in HTMLElement.prototype) return;
  const bar = document.getElementById('head-toolbar');
  const items = bar ? Array.from(bar.querySelectorAll('button')) : [];
  if (!items.length) return;
  items.forEach((b, i) => { b.tabIndex = i ? -1 : 0; });
  bar.addEventListener('focusin', ({ target }) => {
    if (items.includes(target)) items.forEach((b) => { b.tabIndex = b === target ? 0 : -1; });
  });
  bar.addEventListener('keydown', (e) => moveToolbarFocus(bar, items, e));
}

document.addEventListener('click', handleDocClick);
document.addEventListener('input', handleInput);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseover', (e) => handleTipEnter(e.target));
document.addEventListener('mouseout', (e) => handleTipLeave(e.target, e.relatedTarget));
document.addEventListener('focusin', (e) => handleTipEnter(e.target));
document.addEventListener('focusout', (e) => handleTipLeave(e.target, e.relatedTarget));
document.getElementById('btn-lang')?.addEventListener('click', handleToggleLang);
document.getElementById('btn-settings')?.addEventListener('click', () => openSettingsCenter(''));

initHeadToolbar();
i18n()?.applyStaticDom();
loadMeta();
pollUsage();
setInterval(pollUsage, 2000);
})();
