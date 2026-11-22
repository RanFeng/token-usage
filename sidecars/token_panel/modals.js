/**
 * Unified custom modal system (Settings/About/Roadmap, Lite DLP, Export, Share Preview).
 * Classic browser IIFE exposing window.TokenModals. Zero native browser dialogs.
 */
(() => {
const KEY_VOTES = 'tu_roadmap_votes';
const KEY_UPDATE = 'tu_update_cache';
const UPDATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RATE_TIERS = ['pro', 'flash', 'claude', 'gpt'];
const SUB_PRESETS = [
  { usd: 20, tier: 'Pro' },
  { usd: 100, tier: 'Ultra' },
  { usd: 200, tier: 'Ultra' },
];
const FALLBACK_RATES = {
  pro: { input: 1.25, cache: 0.31, output: 10.0 },
  flash: { input: 0.15, cache: 0.0375, output: 0.6 },
  claude: { input: 3.0, cache: 0.3, output: 15.0 },
  gpt: { input: 2.5, cache: 0.625, output: 10.0 },
};
const ROADMAP_ITEMS = [
  { id: 'multiTool', title: 'set.road.multiTool', desc: 'set.road.multiToolDesc' },
  { id: 'cloudSync', title: 'set.road.cloudSync', desc: 'set.road.cloudSyncDesc' },
  { id: 'teamDlp', title: 'set.road.teamDlp', desc: 'set.road.teamDlpDesc' },
];
const EXPORT_RANGES = [
  ['month', 'exp.rangeMonth'],
  ['30d', 'exp.range30d'],
  ['all', 'exp.rangeAll'],
];

const state = {
  kind: '', opts: null, exportRange: 'month',
  shareTheme: 'dark', shareCanvas: null, bound: false,
};

const i18n = () => (typeof window !== 'undefined' ? window.TokenI18n : null);
const t = (key, params) => (i18n() ? i18n().t(key, params) : key);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const apiFetch = (url, opts) => (window.sidecar?.fetch ? window.sidecar.fetch(url, opts) : fetch(url, opts));
const notify = (msg) => { if (state.opts?.onToast) state.opts.onToast(msg); };

function safeHref(url, fallback) {
  const s = String(url || '').trim();
  return /^https?:\/\//i.test(s) ? s : fallback;
}

function lsJsonGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function lsJsonSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function parseVer(v) {
  return String(v || '').replace(/^v/i, '').split('.').map((p) => parseInt(p, 10) || 0);
}

function isNewerVersion(latest, current) {
  const a = parseVer(latest);
  const b = parseVer(current);
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

function readUpdateCache(repo) {
  const c = lsJsonGet(KEY_UPDATE, null);
  const fresh = c && c.repo === repo && (Date.now() - Number(c.checkedAt || 0)) < UPDATE_TTL_MS;
  return fresh ? c : null;
}

async function fetchGithubRelease(repo) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), 5000);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl?.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const entry = {
      repo, checkedAt: Date.now(),
      latestVersion: String(data.tag_name || '').replace(/^v/i, ''),
      releaseUrl: safeHref(data.html_url, `https://github.com/${repo}/releases`),
    };
    lsJsonSet(KEY_UPDATE, entry);
    return entry;
  } finally {
    clearTimeout(timer);
  }
}

async function checkForUpdateQuiet(meta, force = false) {
  const repo = meta?.repo || '';
  if (!repo) return { hasUpdate: false, latestVersion: '', releaseUrl: '' };
  try {
    const entry = (!force && readUpdateCache(repo)) || await fetchGithubRelease(repo);
    if (!entry || !entry.latestVersion) return { hasUpdate: false, latestVersion: '', releaseUrl: '', error: true };
    const hasUpdate = isNewerVersion(entry.latestVersion, meta?.version || '0.0.0');
    return { hasUpdate, latestVersion: entry.latestVersion, releaseUrl: entry.releaseUrl };
  } catch {
    return { hasUpdate: false, latestVersion: '', releaseUrl: '', error: true };
  }
}

function ensureRoot() {
  let root = document.getElementById('tu-modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'tu-modal-root';
    root.className = 'tu-modal-overlay';
    document.body.appendChild(root);
  }
  if (!state.bound) bindEvents(root);
  return root;
}

function openShell(title, bodyHtml) {
  const root = ensureRoot();
  root.innerHTML = `<div class="tu-modal-dialog" role="dialog" aria-modal="true">
    <div class="tu-modal-head">
      <span class="tu-modal-title">${esc(title)}</span>
      <button type="button" class="icon-btn" data-m-act="close" title="${esc(t('modal.close'))}">✕</button>
    </div>
    <div class="tu-modal-body">${bodyHtml}</div>
  </div>`;
  root.classList.add('show');
}

function closeAll() {
  const root = document.getElementById('tu-modal-root');
  if (root) {
    root.classList.remove('show');
    root.innerHTML = '';
  }
  state.kind = '';
  state.opts = null;
  state.shareCanvas = null;
}

function resolveRates(meta) {
  return i18n()?.getCustomRates() || meta?.defaultRates || FALLBACK_RATES;
}

function renderSeg(act, activeVal, options) {
  const btns = options.map(([val, lbl]) => (
    `<button type="button" class="tu-seg-btn ${activeVal === val ? 'active' : ''}" data-m-act="${act}" data-val="${val}">${esc(lbl)}</button>`
  )).join('');
  return `<div class="tu-seg">${btns}</div>`;
}

function getSubCfg() {
  return i18n()?.getSubscription?.() || { planUsd: 20, cycleType: 'monthly', resetDay: 1 };
}

function renderSubResetOptions(sub) {
  if (sub.cycleType === 'weekly') {
    return [1, 2, 3, 4, 5, 6, 7].map((d) => (
      `<option value="${d}" ${sub.resetDay === d ? 'selected' : ''}>${esc(t(`weekday.${d}`))}</option>`
    )).join('');
  }
  return Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
    `<option value="${d}" ${sub.resetDay === d ? 'selected' : ''}>${esc(t('set.subDayOpt', { n: d }))}</option>`
  )).join('');
}

function renderSubSection() {
  const hasSub = Boolean(i18n()?.hasSubscription?.());
  const sub = getSubCfg();
  const fmtPlan = (u) => (i18n()?.fmtPlan ? i18n().fmtPlan(u) : `$${u}`);
  const range = i18n()?.getCycleRangeText ? i18n().getCycleRangeText(sub) : '';
  const cycleSeg = renderSeg('set-sub-cycle', sub.cycleType, [
    ['monthly', t('set.subMonthly')],
    ['weekly', t('set.subWeekly')],
  ]);
  const presetBtns = SUB_PRESETS.map((p) => (
    `<button type="button" class="tu-sub-chip ${hasSub && sub.planUsd === p.usd ? 'active' : ''}" data-m-act="set-sub-plan" data-val="${p.usd}">${esc(fmtPlan(p.usd))} ${p.tier}</button>`
  )).join('');
  const resetLbl = t(sub.cycleType === 'weekly' ? 'set.subResetWeekday' : 'set.subResetDay');
  const footerBtn = hasSub
    ? `<button type="button" class="tu-btn" data-m-act="clear-sub">${esc(t('set.subClear'))}</button>`
    : `<button type="button" class="tu-btn tu-btn-primary" data-m-act="save-sub">${esc(t('set.subEnable'))}</button>`;
  return `<div class="tu-m-sec" id="tu-sec-subscription">
    <div class="tu-m-sec-head">
      <span class="tu-m-sec-title">${esc(t('set.sub'))}</span>
      <span class="tu-sub-preview" id="tu-sub-preview">${esc(t('set.subCurrentCycle', { range }))}</span>
    </div>
    <div class="tu-m-hint">${esc(t('set.subHint'))}</div>
    <div class="tu-sub-chips">${presetBtns}</div>
    <div class="tu-m-rows">
      <div class="tu-m-row">
        <label class="tu-m-label" for="tu-sub-plan">${esc(t('set.subPlan'))}</label>
        <input type="number" id="tu-sub-plan" class="tu-inp" step="1" min="1" max="9999" value="${sub.planUsd}" />
      </div>
      <div class="tu-m-row"><span class="tu-m-label">${esc(t('set.subCycle'))}</span>${cycleSeg}</div>
      <div class="tu-m-row">
        <label class="tu-m-label" for="tu-sub-reset">${esc(resetLbl)}</label>
        <select id="tu-sub-reset" class="tu-select">${renderSubResetOptions(sub)}</select>
      </div>
    </div>
    <div class="tu-btn-row">${footerBtn}</div>
  </div>`;
}

function renderPrefsSection() {
  const lang = i18n()?.getLang() || 'zh';
  const curr = i18n()?.getCurrency() || 'USD';
  const fx = i18n()?.getFxRate() || 7.2;
  const langSeg = renderSeg('set-lang', lang, [['zh', '中文'], ['en', 'English']]);
  const currSeg = renderSeg('set-curr', curr, [['USD', 'USD $'], ['CNY', 'CNY ¥']]);
  return `<div class="tu-m-sec">
    <div class="tu-m-sec-title">${esc(t('set.prefs'))}</div>
    <div class="tu-m-rows">
      <div class="tu-m-row"><span class="tu-m-label">${esc(t('set.lang'))}</span>${langSeg}</div>
      <div class="tu-m-row"><span class="tu-m-label">${esc(t('set.currency'))}</span>${currSeg}</div>
      <div class="tu-m-row tu-fx-row ${curr === 'CNY' ? '' : 'hidden'}" id="tu-fx-row">
        <label class="tu-m-label" for="tu-fx-inp">${esc(t('set.fxRate'))}</label>
        <input type="number" id="tu-fx-inp" class="tu-inp" step="0.01" min="0.1" max="1000" value="${esc(fx)}" />
      </div>
    </div>
  </div>`;
}

function renderRateInputs(tier, row) {
  const r = row || FALLBACK_RATES[tier];
  return `<span class="tu-pricing-tier">${esc(tier)}</span>
    <input type="number" class="tu-pricing-inp" data-tier="${tier}" data-field="input" step="0.01" min="0" value="${esc(r.input)}" />
    <input type="number" class="tu-pricing-inp" data-tier="${tier}" data-field="cache" step="0.001" min="0" value="${esc(r.cache)}" />
    <input type="number" class="tu-pricing-inp" data-tier="${tier}" data-field="output" step="0.01" min="0" value="${esc(r.output)}" />`;
}

function renderPricingSection(meta) {
  const rates = resolveRates(meta);
  const rows = RATE_TIERS.map((k) => renderRateInputs(k, rates[k])).join('');
  const chevron = '<svg class="tu-collapse-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5"/></svg>';
  return `<details class="tu-m-sec tu-collapse">
    <summary><span>${esc(t('set.pricing'))}</span>${chevron}</summary>
    <div class="tu-collapse-body">
      <div class="tu-m-hint">${esc(t('set.pricingHint'))}</div>
      <div class="tu-pricing-grid">
        <span class="tu-pricing-hdr">${esc(t('set.colModel'))}</span>
        <span class="tu-pricing-hdr">${esc(t('set.colIn'))}</span>
        <span class="tu-pricing-hdr">${esc(t('set.colCache'))}</span>
        <span class="tu-pricing-hdr">${esc(t('set.colOut'))}</span>
        ${rows}
      </div>
      <div class="tu-btn-grid-2">
        <button type="button" class="tu-btn tu-btn-primary tu-btn-sm" data-m-act="save-rates">${esc(t('set.pricingSave'))}</button>
        <button type="button" class="tu-btn tu-btn-sm" data-m-act="reset-rates">${esc(t('set.pricingReset'))}</button>
      </div>
    </div>
  </details>`;
}

function loadVotes() {
  const arr = lsJsonGet(KEY_VOTES, []);
  return new Set(Array.isArray(arr) ? arr : []);
}

function buildRoadmapVoteUrl(item, repoUrl, meta) {
  const custom = meta?.roadmapUrls?.[item.id];
  if (custom && /^https?:\/\//i.test(custom)) return custom;
  const base = repoUrl.replace(/\/+$/, '');
  const title = `[Vote] ${t(item.title)}`;
  const body = `👍 +1 for **${t(item.title)}**\n\n${t(item.desc)}\n\n<!-- Submitted via Token Usage -->`;
  return `${base}/issues/new?labels=roadmap,vote&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

function renderRoadmapItem(item, votes, repoUrl, meta) {
  const voted = votes.has(item.id);
  const href = buildRoadmapVoteUrl(item, repoUrl, meta);
  return `<div class="tu-road-item">
    <div class="tu-road-info">
      <div class="tu-road-name">${esc(t(item.title))}</div>
      <div class="tu-road-desc">${esc(t(item.desc))}</div>
    </div>
    <a class="tu-vote-btn ${voted ? 'voted' : ''}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-m-act="vote" data-id="${item.id}">${esc(t(voted ? 'set.voted' : 'set.vote'))}</a>
  </div>`;
}

function renderRoadmapSection(meta) {
  const votes = loadVotes();
  const repoUrl = safeHref(meta?.repoUrl, 'https://github.com/RanFeng/token-usage');
  const waitlist = safeHref(meta?.waitlistUrl, `${repoUrl}/discussions`);
  const items = ROADMAP_ITEMS.map((it) => renderRoadmapItem(it, votes, repoUrl, meta)).join('');
  return `<div class="tu-m-sec" id="tu-sec-roadmap">
    <div class="tu-m-sec-head">
      <span class="tu-m-sec-title">${esc(t('set.roadmapTitle'))}</span>
      <span class="tu-m-hint">${esc(t('set.roadmapSub'))}</span>
    </div>
    <div class="tu-road-list">${items}</div>
    <a class="tu-btn tu-btn-cta" href="${esc(waitlist)}" target="_blank" rel="noopener noreferrer">${esc(t('set.waitlist'))}</a>
  </div>`;
}

function renderAboutSection(meta) {
  const ver = meta?.version || '1.0.0';
  const name = meta?.displayName || 'Token Usage';
  const repoUrl = safeHref(meta?.repoUrl, 'https://github.com/RanFeng/token-usage');
  const feedbackUrl = `${repoUrl.replace(/\/+$/, '')}/issues`;
  return `<div class="tu-m-sec">
    <div class="tu-m-sec-title">${esc(t('set.about'))}</div>
    <div class="tu-about-top">
      <div class="tu-about-brand">
        <img class="tu-about-logo" src="/logo.svg" alt="" width="34" height="34" />
        <div class="tu-about-meta">
          <div class="tu-about-name">${esc(name)}</div>
          <div class="tu-about-ver">${esc(t('set.version'))} <span class="tu-ver-pill">v${esc(ver)}</span></div>
        </div>
      </div>
      <button type="button" class="tu-btn tu-btn-sm" data-m-act="check-update">${esc(t('set.checkUpdate'))}</button>
    </div>
    <div class="tu-upd-status" id="tu-upd-status"></div>
    <div class="tu-btn-grid-2">
      <a class="tu-btn tu-btn-sm" href="${esc(repoUrl)}" target="_blank" rel="noopener noreferrer">${esc(t('set.star'))}</a>
      <a class="tu-btn tu-btn-sm" href="${esc(feedbackUrl)}" target="_blank" rel="noopener noreferrer">${esc(t('set.feedback'))}</a>
    </div>
  </div>`;
}

function openSettingsModal(opts = {}) {
  state.kind = 'settings';
  state.opts = opts;
  const body = [
    renderSubSection(),
    renderPrefsSection(),
    renderPricingSection(opts.meta),
    renderRoadmapSection(opts.meta),
    renderAboutSection(opts.meta),
  ].join('');
  openShell(t('set.title'), body);
  const targetId = opts.scrollTo === 'roadmap' ? 'tu-sec-roadmap'
    : (opts.scrollTo === 'subscription' ? 'tu-sec-subscription' : '');
  if (targetId) {
    requestAnimationFrame(() => {
      const el = document.getElementById(targetId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el?.classList.add('tu-sec-focus');
    });
  }
}

function renderDlpItem(f) {
  const typeLbl = t(`dlp.type.${f.type}`);
  const srcLbl = t(`dlp.source.${f.source}`);
  return `<div class="tu-dlp-item">
    <div class="tu-dlp-top">
      <span><span class="tu-dlp-badge">${esc(typeLbl)}</span> <span class="tu-dlp-src">${esc(srcLbl)}</span></span>
      <button type="button" class="tu-btn tu-btn-sm" data-m-act="dlp-jump" data-turn="${Number(f.turn) || 1}">${esc(t('dlp.jumpTurn', { n: f.turn }))}</button>
    </div>
    <div class="tu-dlp-mask">${esc(f.masked || '***')}</div>
  </div>`;
}

function openDlpModal(opts = {}) {
  state.kind = 'dlp';
  state.opts = opts;
  const list = opts.dlp?.findings || [];
  const itemsHtml = list.length
    ? `<div class="tu-dlp-list">${list.map(renderDlpItem).join('')}</div>`
    : `<div class="tu-m-hint" style="text-align:center;padding:12px 0">${esc(t('dlp.empty'))}</div>`;
  const body = `<div class="tu-dlp-note">🔒 ${esc(t('dlp.privacyNote'))}</div>${itemsHtml}`;
  openShell(t('dlp.modalTitle'), body);
}

function sharePrefs() {
  return window.TokenSharePrefs;
}

function renderShareControls(cardKind) {
  const sp = sharePrefs();
  if (!sp) return '';
  const prefs = sp.loadPrefs();
  const defs = sp.MODULE_DEFS[cardKind] || sp.MODULE_DEFS.overview;
  const activeMods = prefs.modules[cardKind] || [];
  const modBtns = defs.map(([id, key]) => (
    `<button type="button" class="tu-mod-pill ${activeMods.includes(id) ? 'active' : ''}" data-m-act="share-mod" data-val="${id}">${esc(t(key))}</button>`
  )).join('');
  const swatches = sp.PRESETS.map((p) => (
    `<button type="button" class="tu-swatch ${prefs.preset === p.id ? 'active' : ''}" data-m-act="share-preset" data-val="${p.id}" title="${p.id}" style="background:linear-gradient(135deg,${p.bg} 55%,${p.accent} 55%)"></button>`
  )).join('');
  const pickers = [['bg', 'share.colorBg'], ['card', 'share.colorCard'], ['accent', 'share.colorAccent']].map(([k, lbl]) => (
    `<label class="tu-color-pill"><span>${esc(t(lbl))}</span><input type="color" data-share-color="${k}" value="${esc(prefs.colors[k])}" /></label>`
  )).join('');
  return `<div class="tu-share-custom">
    <div class="tu-share-head">
      <span class="tu-share-lbl">${esc(t('share.modules'))}</span>
      <button type="button" class="tu-share-reset" data-m-act="share-reset">↺ ${esc(t('share.reset'))}</button>
    </div>
    <div class="tu-share-chips">${modBtns}</div>
    <div class="tu-share-sep"></div>
    <div class="tu-share-colors-bar">
      <div class="tu-swatch-group">${swatches}</div>
      <span class="tu-share-vsep" aria-hidden="true"></span>
      <div class="tu-picker-group">${pickers}</div>
    </div>
  </div>`;
}

function mountShareCanvas() {
  const stage = document.getElementById('tu-share-stage');
  if (!stage) return;
  try {
    const kind = state.opts?.cardKind || 'overview';
    const prefs = sharePrefs()?.loadPrefs();
    const cfg = prefs ? { colors: prefs.colors, modules: prefs.modules[kind] } : { theme: state.shareTheme };
    const canvas = state.opts?.renderFn?.(cfg);
    if (!canvas) throw new Error('empty');
    canvas.className = 'tu-share-canvas';
    state.shareCanvas = canvas;
    stage.innerHTML = '';
    stage.appendChild(canvas);
  } catch {
    state.shareCanvas = null;
    stage.innerHTML = `<div class="tu-m-hint">${esc(t('share.renderErr'))}</div>`;
  }
}

function openShareModal(opts = {}) {
  state.kind = 'share';
  state.opts = opts;
  const kind = opts.cardKind || 'overview';
  const body = `${renderShareControls(kind)}
    <div class="tu-share-stage" id="tu-share-stage"></div>
    <div class="tu-share-foot">
      <button type="button" class="tu-btn tu-btn-primary" data-m-act="share-copy">${esc(t('share.copyImg'))}</button>
      <button type="button" class="tu-btn" data-m-act="share-dl">${esc(t('share.dlPng'))}</button>
    </div>`;
  openShell(opts.title || t('share.titleOverview'), body);
  mountShareCanvas();
}

function collectRatesFromDom() {
  const out = {};
  document.querySelectorAll('#tu-modal-root .tu-pricing-inp').forEach((inp) => {
    const tier = inp.dataset.tier;
    if (!out[tier]) out[tier] = {};
    out[tier][inp.dataset.field] = Number(inp.value);
  });
  return out;
}

function syncSubDom(sub) {
  const inp = document.getElementById('tu-sub-plan');
  if (inp) inp.value = String(sub.planUsd);
  document.querySelectorAll('#tu-modal-root [data-m-act="set-sub-plan"]').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.val) === sub.planUsd);
  });
  const preview = document.getElementById('tu-sub-preview');
  if (preview && i18n()?.getCycleRangeText) {
    preview.textContent = t('set.subCurrentCycle', { range: i18n().getCycleRangeText(sub) });
  }
}

function actSetSubPlan(el) {
  const wasSet = Boolean(i18n()?.hasSubscription?.());
  const next = i18n()?.setSubscription?.({ planUsd: Number(el.dataset.val) });
  if (!next) return;
  state.opts?.onSubscriptionChanged?.(next);
  if (!wasSet) { openSettingsModal({ ...state.opts, scrollTo: '' }); return; }
  syncSubDom(next);
}

function actSaveSub() {
  const planInp = document.getElementById('tu-sub-plan');
  const resetSel = document.getElementById('tu-sub-reset');
  const next = i18n()?.setSubscription?.({
    planUsd: planInp ? planInp.value : getSubCfg().planUsd,
    resetDay: resetSel ? resetSel.value : getSubCfg().resetDay,
  });
  if (!next) return;
  state.opts?.onSubscriptionChanged?.(next);
  notify(t('set.subSaved'));
  openSettingsModal({ ...state.opts, scrollTo: '' });
}

function actClearSub() {
  i18n()?.clearSubscription?.();
  state.opts?.onSubscriptionChanged?.(getSubCfg());
  notify(t('set.subCleared'));
  openSettingsModal({ ...state.opts, scrollTo: '' });
}

function actSetSubCycle(el) {
  const cycleType = el.dataset.val === 'weekly' ? 'weekly' : 'monthly';
  const next = i18n()?.setSubscription?.({ cycleType, resetDay: 1 });
  if (!next) return;
  state.opts?.onSubscriptionChanged?.(next);
  openSettingsModal({ ...state.opts, scrollTo: '' });
}

function actSetLang(el) {
  i18n()?.setLang(el.dataset.val);
  i18n()?.applyStaticDom();
  state.opts?.onSettingsChanged?.();
  openSettingsModal({ ...state.opts, scrollTo: '' });
}

function actSetCurr(el) {
  const next = i18n()?.setCurrency(el.dataset.val) || 'USD';
  document.querySelectorAll('#tu-modal-root [data-m-act="set-curr"]').forEach((b) => {
    b.classList.toggle('active', b.dataset.val === next);
  });
  document.getElementById('tu-fx-row')?.classList.toggle('hidden', next !== 'CNY');
  state.opts?.onSettingsChanged?.();
}

function actSaveRates() {
  i18n()?.setCustomRates(collectRatesFromDom());
  state.opts?.onSettingsChanged?.();
  notify(t('set.pricingSaved'));
}

function actResetRates() {
  i18n()?.resetCustomRates();
  state.opts?.onSettingsChanged?.();
  notify(t('set.pricingResetDone'));
  openSettingsModal({ ...state.opts, scrollTo: '' });
}

function actVote(el) {
  const id = el.dataset.id;
  const votes = loadVotes();
  votes.add(id);
  lsJsonSet(KEY_VOTES, [...votes]);
  el.classList.add('voted');
  el.textContent = t('set.voted');
}

function renderUpdateResult(statusEl, res) {
  statusEl.classList.toggle('has-update', Boolean(res.hasUpdate));
  if (res.error) { statusEl.textContent = t('set.checkFailed'); return; }
  if (res.hasUpdate) {
    statusEl.innerHTML = `<a class="tu-upd-link" href="${esc(res.releaseUrl)}" target="_blank" rel="noopener noreferrer">${esc(t('set.newVersion', { ver: res.latestVersion }))} ↗</a>`;
    return;
  }
  statusEl.textContent = t('set.upToDate');
}

async function actCheckUpdate(btn) {
  const statusEl = document.getElementById('tu-upd-status');
  if (!statusEl) return;
  btn.disabled = true;
  statusEl.classList.remove('has-update');
  statusEl.textContent = t('set.checking');
  const res = await checkForUpdateQuiet(state.opts?.meta, true);
  btn.disabled = false;
  renderUpdateResult(statusEl, res);
}

function actDlpJump(el) {
  const fn = state.opts?.onJumpTurn;
  const turnNo = Number(el.dataset.turn);
  closeAll();
  if (fn && turnNo > 0) fn(turnNo);
}

function syncShareControlsDom(prefs) {
  const kind = state.opts?.cardKind || 'overview';
  const mods = prefs.modules[kind] || [];
  document.querySelectorAll('#tu-modal-root [data-m-act="share-mod"]').forEach((b) => b.classList.toggle('active', mods.includes(b.dataset.val)));
  document.querySelectorAll('#tu-modal-root [data-m-act="share-preset"]').forEach((b) => b.classList.toggle('active', b.dataset.val === prefs.preset));
  document.querySelectorAll('#tu-modal-root [data-share-color]').forEach((inp) => {
    const v = prefs.colors[inp.dataset.shareColor];
    if (v) inp.value = v;
  });
}

function actShareMod(el) {
  const kind = state.opts?.cardKind || 'overview';
  const prefs = sharePrefs()?.toggleModule(kind, el.dataset.val);
  if (!prefs) return;
  syncShareControlsDom(prefs);
  mountShareCanvas();
}

function actSharePreset(el) {
  const prefs = sharePrefs()?.applyPreset(el.dataset.val);
  if (!prefs) return;
  syncShareControlsDom(prefs);
  mountShareCanvas();
}

function actShareReset() {
  const prefs = sharePrefs()?.resetPrefs();
  if (!prefs) return;
  syncShareControlsDom(prefs);
  mountShareCanvas();
}

async function actShareCopy() {
  if (!state.shareCanvas || !window.TokenShareCard?.copyCanvas) return notify(t('share.copyFallback'));
  const ok = await window.TokenShareCard.copyCanvas(state.shareCanvas);
  notify(t(ok ? 'share.copied' : 'share.copyFallback'));
}

async function actShareDownload() {
  if (!state.shareCanvas || !window.TokenShareCard?.downloadCanvas) return notify(t('share.renderErr'));
  const res = await window.TokenShareCard.downloadCanvas(state.shareCanvas, state.opts?.filename || 'token-usage.png');
  if (!res || !res.ok) return notify(t('share.dlFailed'));
  notify(res.displayPath ? t('exp.savedTo', { path: res.displayPath }) : t('share.downloaded'));
}

function runAndClose(key) {
  const fn = state.opts?.[key];
  closeAll();
  if (fn) fn();
}

const CLICK_ACTIONS = {
  close: () => closeAll(),
  'set-sub-plan': actSetSubPlan,
  'set-sub-cycle': actSetSubCycle,
  'save-sub': actSaveSub,
  'clear-sub': actClearSub,
  'set-lang': actSetLang,
  'set-curr': actSetCurr,
  'save-rates': actSaveRates,
  'reset-rates': actResetRates,
  vote: actVote,
  'check-update': actCheckUpdate,
  'dlp-jump': actDlpJump,
  'share-mod': actShareMod,
  'share-preset': actSharePreset,
  'share-reset': actShareReset,
  'share-copy': actShareCopy,
  'share-dl': actShareDownload,
};

function handleRootClick(e) {
  if (e.target.id === 'tu-modal-root') return closeAll();
  const btn = e.target.closest('[data-m-act]');
  const handler = btn && CLICK_ACTIONS[btn.dataset.mAct];
  if (handler) handler(btn, e);
}

function handleRootChange(e) {
  const id = e.target.id;
  if (id === 'tu-fx-inp') {
    const saved = i18n()?.setFxRate(e.target.value);
    if (saved != null) e.target.value = String(saved);
    state.opts?.onSettingsChanged?.();
    return;
  }
  if (id === 'tu-sub-plan' || id === 'tu-sub-reset') {
    const patch = id === 'tu-sub-plan' ? { planUsd: e.target.value } : { resetDay: e.target.value };
    const next = i18n()?.setSubscription?.(patch);
    if (!next) return;
    syncSubDom(next);
    state.opts?.onSubscriptionChanged?.(next);
    notify(t('set.subSaved'));
  }
}

function handleRootInput(e) {
  const field = e.target?.dataset?.shareColor;
  if (!field) return;
  const prefs = sharePrefs()?.updateColor(field, e.target.value);
  if (!prefs) return;
  document.querySelectorAll('#tu-modal-root [data-m-act="share-preset"]').forEach((b) => b.classList.remove('active'));
  mountShareCanvas();
}

function bindEvents(root) {
  state.bound = true;
  root.addEventListener('click', handleRootClick);
  root.addEventListener('change', handleRootChange);
  root.addEventListener('input', handleRootInput);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.kind) closeAll();
  });
}

window.TokenModals = {
  openSettingsModal,
  openDlpModal,
  openShareModal,
  checkForUpdateQuiet,
  closeAll,
};
})();
