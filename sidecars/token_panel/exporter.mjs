/**
 * Local file export (~/Downloads) and native OS clipboard bridge for Sidecar webviews.
 * Zero external dependencies; works even inside sandboxed iframes without allow-downloads or clipboard-write.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { buildExportCsv, buildExportData, normalizeRange } from './overview.mjs';

const MAX_PNG_BYTES = 15 * 1024 * 1024;
const PNG_PREFIX = /^data:image\/png;base64,/i;

function todayTag() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function resolveExportDir() {
  const home = homedir();
  const dl = join(home, 'Downloads');
  if (existsSync(dl)) return dl;
  try { mkdirSync(dl, { recursive: true }); return dl; } catch { return home; }
}

function toDisplayPath(fullPath) {
  const home = homedir();
  if (home && fullPath.startsWith(home)) return `~${fullPath.slice(home.length)}`;
  return fullPath;
}

export function sanitizeFilename(raw, fallbackBase, fallbackExt) {
  const clean = basename(String(raw || '').trim()).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  const ext = extname(clean).toLowerCase() || fallbackExt;
  const stem = (ext ? clean.slice(0, -ext.length) : clean) || fallbackBase;
  return { stem: stem.slice(0, 80), ext: ext.startsWith('.') ? ext : `.${ext}` };
}

export function uniqueFilePath(dir, stem, ext) {
  let candidate = join(dir, `${stem}${ext}`);
  if (!existsSync(candidate)) return candidate;
  for (let i = 2; i <= 999; i += 1) {
    candidate = join(dir, `${stem}-${i}${ext}`);
    if (!existsSync(candidate)) return candidate;
  }
  return join(dir, `${stem}-${Date.now()}${ext}`);
}

export function saveLedgerExport(format, range, cycleOpts = {}) {
  const fmt = String(format || 'json').toLowerCase() === 'csv' ? 'csv' : 'json';
  const safeRange = normalizeRange(range || 'all');
  const content = fmt === 'csv'
    ? buildExportCsv(safeRange, cycleOpts)
    : `${JSON.stringify(buildExportData(safeRange, cycleOpts), null, 2)}\n`;
  const dir = resolveExportDir();
  const filePath = uniqueFilePath(dir, `token-usage-${safeRange}-${todayTag()}`, `.${fmt}`);
  writeFileSync(filePath, content, 'utf-8');
  return {
    ok: true,
    filename: basename(filePath),
    path: filePath,
    displayPath: toDisplayPath(filePath),
    bytes: Buffer.byteLength(content, 'utf-8'),
  };
}

function decodePngDataUrl(dataUrl) {
  const raw = String(dataUrl || '').trim();
  if (!PNG_PREFIX.test(raw)) return null;
  const buf = Buffer.from(raw.replace(PNG_PREFIX, ''), 'base64');
  if (!buf.length || buf.length > MAX_PNG_BYTES) return null;
  return buf;
}

export function savePngExport(dataUrl, filename = 'token-usage.png') {
  const buf = decodePngDataUrl(dataUrl);
  if (!buf) return { ok: false, error: 'Invalid or oversized PNG payload' };
  const dir = resolveExportDir();
  const { stem } = sanitizeFilename(filename, 'token-usage', '.png');
  const filePath = uniqueFilePath(dir, stem, '.png');
  writeFileSync(filePath, buf);
  return {
    ok: true,
    filename: basename(filePath),
    path: filePath,
    displayPath: toDisplayPath(filePath),
    bytes: buf.length,
  };
}

function runCmd(cmd, args, input) {
  const res = spawnSync(cmd, args, { input, stdio: ['pipe', 'ignore', 'ignore'], timeout: 8000 });
  return !res.error && res.status === 0;
}

function writeTextMac(text) {
  return runCmd('pbcopy', [], Buffer.from(text, 'utf-8'));
}

function writeTextWin(text) {
  const ps = '[Console]::InputEncoding=[Text.UTF8Encoding]::new($false);Set-Clipboard -Value ([Console]::In.ReadToEnd())';
  return runCmd('powershell', ['-NoProfile', '-Command', ps], Buffer.from(text, 'utf-8'))
    || runCmd('clip', [], Buffer.from(text, 'utf-8'));
}

function writeTextLinux(text) {
  const buf = Buffer.from(text, 'utf-8');
  return runCmd('wl-copy', [], buf)
    || runCmd('xclip', ['-selection', 'clipboard'], buf)
    || runCmd('xsel', ['--clipboard', '--input'], buf);
}

export function writeTextClipboard(text) {
  const str = String(text ?? '');
  if (!str) return { ok: false, error: 'Empty text' };
  const fn = process.platform === 'darwin' ? writeTextMac
    : (process.platform === 'win32' ? writeTextWin : writeTextLinux);
  return fn(str) ? { ok: true } : { ok: false, error: 'Clipboard command failed' };
}

function writeImageMac(tmpFile) {
  const args = [
    '-e', 'on run argv',
    '-e', 'set the clipboard to (read (POSIX file (item 1 of argv)) as «class PNGf»)',
    '-e', 'end run',
    tmpFile,
  ];
  return runCmd('osascript', args);
}

function writeImageWin(tmpFile) {
  const ps = 'param($p) Add-Type -AssemblyName System.Windows.Forms; $img=[System.Drawing.Image]::FromFile($p); [System.Windows.Forms.Clipboard]::SetImage($img); $img.Dispose()';
  return runCmd('powershell', ['-NoProfile', '-STA', '-Command', ps, tmpFile]);
}

function writeImageLinux(tmpFile, buf) {
  return runCmd('wl-copy', ['--type', 'image/png'], buf)
    || runCmd('xclip', ['-selection', 'clipboard', '-t', 'image/png', '-i', tmpFile]);
}

export function writeImageClipboard(dataUrl) {
  const buf = decodePngDataUrl(dataUrl);
  if (!buf) return { ok: false, error: 'Invalid or oversized PNG payload' };
  const tmpFile = join(tmpdir(), `tu-clip-${process.pid}-${Date.now()}.png`);
  try {
    writeFileSync(tmpFile, buf);
    const ok = process.platform === 'darwin' ? writeImageMac(tmpFile)
      : (process.platform === 'win32' ? writeImageWin(tmpFile) : writeImageLinux(tmpFile, buf));
    return ok ? { ok: true } : { ok: false, error: 'Image clipboard command failed' };
  } finally {
    try { rmSync(tmpFile, { force: true }); } catch {}
  }
}

export function handleClipboardRequest(data) {
  const type = String(data?.type || 'text').toLowerCase();
  if (type === 'image') return writeImageClipboard(data?.dataUrl);
  return writeTextClipboard(data?.text);
}
