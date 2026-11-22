/* SVG 静态资源预加载与 ID 隔离引擎 */
const _AS_SOURCES = {
  logo: '/assets/logo.svg',
  antigravity: '/assets/icons/antigravity.svg',
  claude_code: '/assets/icons/claude_code.svg',
  codex: '/assets/icons/codex.svg',
  cursor: '/assets/icons/cursor.svg',
  gemini_cli: '/assets/icons/gemini_cli.svg'
};

const _AS_CACHE = Object.create(null);

/** 拉取单个 SVG 文本并存入缓存 */
async function _asFetchOne(key, url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to load SVG asset: ' + url + ' (' + res.status + ')');
  }
  const text = await res.text();
  _AS_CACHE[key] = text;
  return text;
}

/** 并行预加载全部品牌矢量图标 */
function _asLoadAll() {
  const entries = Object.entries(_AS_SOURCES);
  const tasks = entries.map(function (pair) {
    return _asFetchOne(pair[0], pair[1]);
  });
  return Promise.all(tasks);
}

/** 规范化 SVG ID 后缀，防止非法字符 */
function _asSafeSuffix(idSuffix) {
  const raw = idSuffix === undefined || idSuffix === null ? '0' : String(idSuffix);
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned || '0';
}

/** 为 SVG 内部 id 与引用全量追加隔离后缀 */
function _asRewriteIds(svgText, suffix) {
  const tag = '-' + _asSafeSuffix(suffix);
  const withIds = svgText.replace(/\bid=(["'])([^"']+)\1/g, 'id="$2' + tag + '"');
  const withUrls = withIds.replace(/url\(\s*(['"]?)#([^)"'\s]+)\1\s*\)/g, 'url(#$2' + tag + ')');
  return withUrls.replace(/\b(xlink:href|href)=(["'])#([^"']+)\2/g, '$1="#$3' + tag + '"');
}

/** 获取指定键与隔离后缀的安全 SVG 字符串 */
function _asGetSvg(key, idSuffix) {
  const raw = _AS_CACHE[key];
  if (!raw) {
    return '';
  }
  return _asRewriteIds(raw, idSuffix);
}

window.PromoAssets = {
  ready: _asLoadAll(),
  getSvg: _asGetSvg
};
