/**
 * Interactive collapsible JSON viewer modal with syntax highlighting, search, and copy.
 */
(() => {
const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let currentData = null;
let currentQuery = '';
let onCopyNotify = null;

function highlightText(raw) {
  const safe = esc(raw);
  if (!currentQuery) return safe;
  const q = currentQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${q})`, 'gi'), '<mark class="jm-hl">$1</mark>');
}

function renderStringVal(str) {
  const isLong = str.length > 140 || str.includes('\n');
  if (!isLong) return `<span class="jm-str">"${highlightText(str)}"</span>`;
  const preview = str.replace(/\n/g, '↵').slice(0, 80);
  return `<span class="jm-str-wrap">
    <span class="jm-str-toggle" data-jm-str><span class="tu-chevron jm-arrow" aria-hidden="true"></span><span class="jm-meta">${str.length} chars</span></span>
    <span class="jm-str-preview">"${highlightText(preview)}..."</span>
    <pre class="jm-str-full">${highlightText(str)}</pre>
  </span>`;
}

function renderPrimitive(val) {
  if (val === null) return '<span class="jm-null">null</span>';
  if (typeof val === 'boolean') return `<span class="jm-bool">${val}</span>`;
  if (typeof val === 'number') return `<span class="jm-num">${val}</span>`;
  return renderStringVal(String(val));
}

function renderChildNodes(entries, isArr, depth) {
  return entries.map(([k, v]) => {
    const kh = isArr
      ? `<span class="jm-idx">${k}: </span>`
      : `<span class="jm-key">"${highlightText(k)}"</span><span class="jm-punc">: </span>`;
    return renderNode(v, kh, depth + 1);
  }).join('');
}

function containerMeta(val) {
  if (Array.isArray(val)) {
    const entries = val.map((v, i) => [String(i), v]);
    return { isArr: true, entries, openBr: '[', closeBr: ']', summary: `${entries.length} items` };
  }
  const entries = Object.entries(val);
  return { isArr: false, entries, openBr: '{', closeBr: '}', summary: `${entries.length} keys` };
}

function renderContainer(val, keyHtml, depth) {
  const { isArr, entries, openBr, closeBr, summary } = containerMeta(val);
  if (!entries.length) return `<div class="jm-line">${keyHtml}<span class="jm-punc">${openBr}${closeBr}</span></div>`;
  const collapsed = depth >= 2 && !currentQuery;
  const cls = collapsed ? 'collapsed' : '';
  return `<div class="jm-node ${cls}">
    <div class="jm-line jm-branch" data-jm-branch>
      <span class="tu-chevron jm-arrow" aria-hidden="true"></span>${keyHtml}<span class="jm-punc">${openBr}</span>
      <span class="jm-summary">${summary}</span><span class="jm-punc jm-close-inline">${closeBr}</span>
    </div>
    <div class="jm-children">${renderChildNodes(entries, isArr, depth)}</div>
    <div class="jm-line jm-close-line"><span class="jm-punc">${closeBr}</span></div>
  </div>`;
}

function renderNode(val, keyHtml = '', depth = 0) {
  if (val === null || typeof val !== 'object') {
    return `<div class="jm-line">${keyHtml}${renderPrimitive(val)}</div>`;
  }
  return renderContainer(val, keyHtml, depth);
}

function renderTree() {
  const body = document.getElementById('jm-body');
  if (body) body.innerHTML = renderNode(currentData, '', 0);
}

function setAllCollapsed(flag) {
  document.querySelectorAll('#jm-body .jm-node').forEach((n) => {
    n.classList.toggle('collapsed', flag);
  });
}

function open(title, data, notifyFn) {
  currentData = data;
  currentQuery = '';
  onCopyNotify = notifyFn || null;
  const modal = document.getElementById('json-modal');
  if (!modal) return;
  const titleEl = document.getElementById('jm-title');
  const searchEl = document.getElementById('jm-search');
  const defTitle = window.TokenI18n?.t('jm.title') || 'JSON 详情';
  if (titleEl) titleEl.textContent = title || defTitle;
  if (searchEl) searchEl.value = '';
  renderTree();
  modal.classList.add('show');
}

function close() {
  document.getElementById('json-modal')?.classList.remove('show');
}

async function copyCurrentJson() {
  const text = typeof currentData === 'string' ? currentData : JSON.stringify(currentData, null, 2);
  const okMsg = window.TokenI18n?.t('jm.copied') || '已复制格式化 JSON';
  const failMsg = window.TokenI18n?.t('toast.copyFailed') || '复制失败';
  const fn = window.TokenClipboard?.copyText;
  if (fn) {
    const ok = await fn(text);
    onCopyNotify?.(ok ? okMsg : failMsg);
    return;
  }
  navigator.clipboard?.writeText(text).then(() => onCopyNotify?.(okMsg)).catch(() => onCopyNotify?.(failMsg));
}

function handleToolbarClick(target) {
  if (target.id === 'json-modal' || target.closest('#jm-close')) { close(); return true; }
  if (target.closest('#jm-expand')) { setAllCollapsed(false); return true; }
  if (target.closest('#jm-collapse')) { setAllCollapsed(true); return true; }
  return false;
}

function toggleBranchNode(branch) {
  branch.parentElement.classList.toggle('collapsed');
}

function handleTreeClick(target) {
  const branch = target.closest('[data-jm-branch]');
  if (branch) return toggleBranchNode(branch);
  const strToggle = target.closest('[data-jm-str]');
  if (strToggle) strToggle.parentElement.classList.toggle('min');
}

document.addEventListener('click', (e) => {
  if (handleToolbarClick(e.target)) return;
  if (e.target.closest('#jm-copy')) return copyCurrentJson();
  handleTreeClick(e.target);
});

document.addEventListener('input', (e) => {
  if (e.target.id !== 'jm-search') return;
  currentQuery = e.target.value.trim();
  renderTree();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') close();
});

window.JsonModal = { open, close };
})();
