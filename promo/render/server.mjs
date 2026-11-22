/**
 * Lightweight zero-dependency static HTTP server for promo rendering.
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROMO_DIR = path.resolve(__dirname, '..');
export const ASSETS_DIR = path.resolve(__dirname, '..', '..', 'assets');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.wav': 'audio/wav',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function decodePathname(rawUrl = '/') {
  try {
    const parsed = new URL(rawUrl, 'http://127.0.0.1');
    const clean = decodeURIComponent(parsed.pathname);
    return clean.includes('\0') ? null : clean;
  } catch {
    return null;
  }
}

function pickRootAndRel(pathname, roots) {
  if (pathname.startsWith('/assets/')) {
    return { rootDir: roots.assetsDir, relPath: pathname.slice('/assets/'.length) };
  }
  const relPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  return { rootDir: roots.promoDir, relPath };
}

function isInsideRoot(rootDir, resolved) {
  const base = path.resolve(rootDir);
  return resolved.startsWith(base + path.sep);
}

function resolveSafeUrl(rawUrl, roots) {
  const pathname = decodePathname(rawUrl);
  if (!pathname) return null;
  const { rootDir, relPath } = pickRootAndRel(pathname, roots);
  if (!relPath) return null;
  const resolved = path.resolve(rootDir, relPath);
  return isInsideRoot(rootDir, resolved) ? resolved : null;
}

async function readSafeFile(filePath) {
  try {
    const info = await stat(filePath);
    return info.isFile() ? await readFile(filePath) : null;
  } catch {
    return null;
  }
}

function sendText(res, status, message) {
  const body = Buffer.from(message, 'utf8');
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendBytes(res, status, contentType, body, length) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function serveFile(method, filePath, res) {
  const data = await readSafeFile(filePath);
  if (!data) return sendText(res, 404, 'Not Found');
  const body = method === 'HEAD' ? Buffer.alloc(0) : data;
  sendBytes(res, 200, getMimeType(filePath), body, data.length);
}

function isAllowedMethod(method) {
  return method === 'GET' || method === 'HEAD';
}

async function handleRequest(req, res, roots) {
  if (!isAllowedMethod(req.method)) return sendText(res, 405, 'Method Not Allowed');
  const target = resolveSafeUrl(req.url, roots);
  if (!target) return sendText(res, 404, 'Not Found');
  await serveFile(req.method, target, res);
}

function listenServer(server, port, host) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server.address()));
  });
}

function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

/**
 * Start static server bound to loopback on an available port.
 */
export async function startStaticServer({
  promoDir = PROMO_DIR,
  assetsDir = ASSETS_DIR,
  host = '127.0.0.1',
  port = 0,
} = {}) {
  const roots = { promoDir, assetsDir };
  const server = http.createServer((req, res) => {
    handleRequest(req, res, roots).catch(() => sendText(res, 500, 'Internal Server Error'));
  });
  const addr = await listenServer(server, port, host);
  return {
    server,
    host,
    port: addr.port,
    baseUrl: `http://${host}:${addr.port}`,
    close: () => closeServer(server),
  };
}
