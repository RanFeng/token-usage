/**
 * Token Usage sidecar backend entrypoint.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SidecarApp, Response } from 'sidecar_sdk';
import { buildUsagePayload, readTurnDetail } from './parser.mjs';
import { buildExportCsv, buildExportData, buildOverviewPayload, normalizeRange } from './overview.mjs';
import { handleClipboardRequest, saveLedgerExport, savePngExport } from './exporter.mjs';
import { DEFAULT_RATES } from './pricing.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_JSON_PATH = join(__dirname, '..', '..', 'plugin.json');
const LOGO_SVG_PATH = join(__dirname, '..', '..', 'assets', 'logo.svg');
const DEFAULT_REPO = 'RanFeng/token-usage';
const DEFAULT_WAITLIST = `https://github.com/${DEFAULT_REPO}/discussions`;

const app = new SidecarApp();

const noStore = (file, contentType) => () => new Response(readFileSync(join(__dirname, file), 'utf-8'), {
  contentType,
  headers: { 'Cache-Control': 'no-store' },
});

function readPluginJson() {
  try { return JSON.parse(readFileSync(PLUGIN_JSON_PATH, 'utf-8')); } catch { return {}; }
}

function extractRepoSlug(pkg) {
  const raw = String(pkg.repo || pkg.repository || '').trim();
  const match = raw.match(/github\.com\/([^/\s]+\/[^/\s#?]+)/i);
  if (match) return match[1].replace(/\.git$/i, '');
  return /^[^/\s]+\/[^/\s]+$/.test(raw) ? raw : DEFAULT_REPO;
}

function buildMetaPayload() {
  const pkg = readPluginJson();
  const repo = extractRepoSlug(pkg);
  const pkgRepoUrl = typeof pkg.repository === 'string' ? pkg.repository : '';
  return {
    name: pkg.name || 'token-usage',
    displayName: pkg.displayName || 'Token Usage',
    version: pkg.version || '1.1.0',
    schemaVersion: 2,
    source: 'antigravity',
    repo,
    repoUrl: pkg.repoUrl || pkgRepoUrl || `https://github.com/${repo}`,
    waitlistUrl: pkg.waitlistUrl || DEFAULT_WAITLIST,
    roadmapUrls: pkg.roadmapUrls || {},
    defaultRates: DEFAULT_RATES,
  };
}

function extractCycleOpts(data) {
  return { cycleType: data.cycle || 'monthly', resetDay: data.resetDay || 1 };
}

function handleExport(data) {
  const safeRange = normalizeRange(data.range || 'all');
  const cycleOpts = extractCycleOpts(data);
  const fmt = String(data.format || 'json').toLowerCase();
  if (fmt !== 'csv') return buildExportData(safeRange, cycleOpts);
  return new Response(buildExportCsv(safeRange, cycleOpts), {
    contentType: 'text/csv; charset=utf-8',
    headers: {
      'Content-Disposition': `attachment; filename="token-usage-${safeRange}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

app.page('/', noStore('index.html', 'text/html; charset=utf-8'));
app.api('/logo.svg', () => new Response(readFileSync(LOGO_SVG_PATH, 'utf-8'), {
  contentType: 'image/svg+xml; charset=utf-8',
  headers: { 'Cache-Control': 'no-store' },
}), 'GET');
app.api('/i18n.js', noStore('i18n.js', 'application/javascript; charset=utf-8'), 'GET');
app.api('/share_card.js', noStore('share_card.js', 'application/javascript; charset=utf-8'), 'GET');
app.api('/modals.js', noStore('modals.js', 'application/javascript; charset=utf-8'), 'GET');
app.api('/modals.css', noStore('modals.css', 'text/css; charset=utf-8'), 'GET');
app.api('/app.js', noStore('app.js', 'application/javascript; charset=utf-8'), 'GET');
app.api('/renderers.js', noStore('renderers.js', 'application/javascript; charset=utf-8'), 'GET');
app.api('/jsonview.js', noStore('jsonview.js', 'application/javascript; charset=utf-8'), 'GET');
app.api('/overview.css', noStore('overview.css', 'text/css; charset=utf-8'), 'GET');
app.api('/overview_ui.js', noStore('overview_ui.js', 'application/javascript; charset=utf-8'), 'GET');

app.api('/api/meta', buildMetaPayload, 'GET');

app.api('/api/usage', (data) => {
  const convId = data.conversationId || app.config.conversationId || '';
  return buildUsagePayload(convId, data.etag || '');
}, 'GET');

app.api('/api/turn', (data) => {
  const convId = data.conversationId || app.config.conversationId || '';
  return readTurnDetail(convId, Number(data.turn || 0));
}, 'GET');

app.api('/api/overview', (data) => buildOverviewPayload(data.sort || 'recent', extractCycleOpts(data)), 'GET');
app.api('/api/export', handleExport, 'GET');
app.api('/api/export/save', (data) => saveLedgerExport(data.format, data.range, extractCycleOpts(data)), 'POST');
app.api('/api/export/save-image', (data) => savePngExport(data.dataUrl, data.filename), 'POST');
app.api('/api/clipboard', (data) => handleClipboardRequest(data), 'POST');

app.run();
