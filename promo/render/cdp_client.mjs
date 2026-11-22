/**
 * Zero-dependency Chrome DevTools Protocol (CDP) client for Node v25+.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TOTAL_FRAMES_DEFAULT = 2880;
const FPS_DEFAULT = 60;

function buildChromeArgs(userDataDir) {
  const angleBackend = process.platform === 'darwin' ? 'metal' : 'swiftshader';
  return [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--use-gl=angle',
    `--use-angle=${angleBackend}`,
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--remote-debugging-port=0',
    '--window-size=1920,1080',
    '--hide-scrollbars',
    '--mute-audio',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ];
}

function parseDevToolsLine(text) {
  const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
  return match ? match[1] : null;
}

function settleDevToolsWait(state, proc, resolve, reject, err, url) {
  if (state.done) return;
  state.done = true;
  clearTimeout(state.timer);
  proc.stderr.removeAllListeners('data');
  err ? reject(err) : resolve(url);
}

function handleStderrChunk(state, chunk, finish) {
  state.buf += chunk.toString('utf8');
  const wsUrl = parseDevToolsLine(state.buf);
  if (wsUrl) finish(null, wsUrl);
}

function waitForDevToolsUrl(proc, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const state = { buf: '', done: false, timer: null };
    const finish = (err, url) => settleDevToolsWait(state, proc, resolve, reject, err, url);
    state.timer = setTimeout(() => finish(new Error('Timed out waiting for Chrome DevTools'), null), timeoutMs);
    proc.stderr.on('data', (chunk) => handleStderrChunk(state, chunk, finish));
    proc.once('error', (err) => finish(err, null));
    proc.once('exit', (code) => finish(new Error(`Chrome exited early (${code}): ${state.buf}`), null));
  });
}

function waitForProcessExit(proc, timeoutMs = 2000) {
  if (proc.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve();
    }, timeoutMs);
    proc.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function cleanupChrome(proc, userDataDir) {
  if (proc && proc.exitCode === null) {
    proc.kill('SIGTERM');
    await waitForProcessExit(proc, 2000);
  }
  await rm(userDataDir, { recursive: true, force: true });
}

function formatCdpError(err) {
  const msg = err.message || JSON.stringify(err);
  return new Error(`CDP error (${err.code}): ${msg}`);
}

function dispatchResponse(pending, msg) {
  const entry = pending.get(msg.id);
  if (!entry) return;
  pending.delete(msg.id);
  clearTimeout(entry.timer);
  msg.error ? entry.reject(formatCdpError(msg.error)) : entry.resolve(msg.result);
}

function dispatchEvent(listeners, msg) {
  const set = listeners.get(msg.method);
  if (!set) return;
  const params = msg.params || {};
  for (const handler of set) handler(params);
}

function handleWsMessage(pending, listeners, raw) {
  const text = typeof raw === 'string' ? raw : raw.toString('utf8');
  const msg = JSON.parse(text);
  if (msg.id) return dispatchResponse(pending, msg);
  if (msg.method) dispatchEvent(listeners, msg);
}

function rejectAllPending(pending, reason) {
  for (const entry of pending.values()) {
    clearTimeout(entry.timer);
    entry.reject(new Error(reason));
  }
  pending.clear();
}

function onCommandTimeout(pending, id, method, reject) {
  pending.delete(id);
  reject(new Error(`CDP timeout calling ${method}`));
}

function openWebSocket(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener('open', () => resolve(ws), { once: true });
    ws.addEventListener('error', () => reject(new Error(`Failed to open CDP socket: ${wsUrl}`)), { once: true });
  });
}

function sendCdpCommand(ws, state, method, params = {}, timeoutMs = 30000) {
  if (ws.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error(`CDP socket closed before ${method}`));
  }
  return new Promise((resolve, reject) => {
    const id = state.nextId++;
    const timer = setTimeout(() => onCommandTimeout(state.pending, id, method, reject), timeoutMs);
    state.pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function addCdpListener(listeners, eventName, handler) {
  const set = listeners.get(eventName) || new Set();
  set.add(handler);
  listeners.set(eventName, set);
  return () => set.delete(handler);
}

async function createCdpSession(wsUrl) {
  const ws = await openWebSocket(wsUrl);
  const state = { nextId: 1, pending: new Map(), listeners: new Map() };
  ws.addEventListener('message', (ev) => handleWsMessage(state.pending, state.listeners, ev.data));
  ws.addEventListener('close', () => rejectAllPending(state.pending, 'CDP WebSocket closed'));
  ws.addEventListener('error', () => rejectAllPending(state.pending, 'CDP WebSocket errored'));
  return {
    send: (method, params, timeoutMs) => sendCdpCommand(ws, state, method, params, timeoutMs),
    on: (eventName, handler) => addCdpListener(state.listeners, eventName, handler),
    close: () => ws.close(),
  };
}

function formatException(params) {
  const details = params.exceptionDetails || {};
  const ex = details.exception || {};
  return `Page JS exception: ${ex.description || details.text || 'Unknown'}`;
}

function formatConsoleArg(arg) {
  if (arg.description) return arg.description;
  return arg.value === undefined ? '' : String(arg.value);
}

function formatConsoleError(params) {
  const args = params.args || [];
  const text = args.map(formatConsoleArg).join(' ').trim();
  return `Page console.error: ${text || 'Unknown console error'}`;
}

function recordPageError(tabState, message) {
  tabState.errors.push(message);
  if (tabState.onError) tabState.onError(new Error(message));
}

function assertNoErrors(tabState) {
  if (tabState.errors.length > 0) {
    throw new Error(tabState.errors[0]);
  }
}

function attachErrorListeners(session, tabState) {
  session.on('Runtime.exceptionThrown', (params) => {
    recordPageError(tabState, formatException(params));
  });
  session.on('Runtime.consoleAPICalled', (params) => {
    if (params.type === 'error') recordPageError(tabState, formatConsoleError(params));
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createTargetJson(httpBase) {
  const res = await fetch(`${httpBase}/json/new?about:blank`, { method: 'PUT' });
  if (!res.ok) throw new Error(`Failed to create CDP target: HTTP ${res.status}`);
  return res.json();
}

async function closeTargetJson(httpBase, targetId) {
  try {
    await fetch(`${httpBase}/json/close/${targetId}`);
  } catch {
    // Ignore close errors when Chrome is already shutting down.
  }
}

async function pollUntilReady(session, tabState, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    assertNoErrors(tabState);
    const res = await session.send('Runtime.evaluate', {
      expression: 'window.__PROMO_READY__ === true',
      returnByValue: true,
    });
    if (res.result && res.result.value === true) return;
    await delay(100);
  }
  throw new Error(`Timed out after ${timeoutMs}ms waiting for window.__PROMO_READY__`);
}

async function navigateAndWaitReady(session, tabState, url, timeoutMs = 20000) {
  const nav = await session.send('Page.navigate', { url });
  if (nav.errorText) throw new Error(`Navigation failed (${url}): ${nav.errorText}`);
  await pollUntilReady(session, tabState, timeoutMs);
  assertNoErrors(tabState);
}

async function renderFramePng(session, tabState, frame, totalFrames, fps) {
  assertNoErrors(tabState);
  const evalRes = await session.send('Runtime.evaluate', {
    expression: `window.renderFrame(${frame}, ${totalFrames}, ${fps})`,
    returnByValue: false,
  });
  if (evalRes.exceptionDetails) throw new Error(formatException(evalRes));
  assertNoErrors(tabState);
  const shot = await session.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    optimizeForSpeed: true,
  });
  assertNoErrors(tabState);
  return Buffer.from(shot.data, 'base64');
}

function buildTabHandle(browser, target, session, tabState) {
  return {
    id: target.id,
    getErrorCount: () => tabState.errors.length,
    getErrors: () => [...tabState.errors],
    navigateAndWaitReady: (url, timeoutMs = 20000) => navigateAndWaitReady(session, tabState, url, timeoutMs),
    renderFrame: (frame, totalFrames = TOTAL_FRAMES_DEFAULT, fps = FPS_DEFAULT) =>
      renderFramePng(session, tabState, frame, totalFrames, fps),
    close: async () => {
      session.close();
      await closeTargetJson(browser.httpBase, target.id);
    },
  };
}

async function openTab(browser, { width = 1920, height = 1080, onError = null } = {}) {
  const target = await createTargetJson(browser.httpBase);
  const session = await createCdpSession(target.webSocketDebuggerUrl);
  const tabState = { errors: [], onError };
  attachErrorListeners(session, tabState);
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  await session.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return buildTabHandle(browser, target, session, tabState);
}

/**
 * Launch headless Chrome with an isolated temporary user-data-dir.
 */
export async function launchChrome({ chromePath = DEFAULT_CHROME_PATH } = {}) {
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), 'promo-chrome-'));
  const proc = spawn(chromePath, buildChromeArgs(userDataDir), { stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const wsUrl = await waitForDevToolsUrl(proc);
    const httpBase = `http://${new URL(wsUrl).host}`;
    const browser = { wsUrl, httpBase, userDataDir };
    return {
      ...browser,
      openTab: (opts) => openTab(browser, opts),
      close: () => cleanupChrome(proc, userDataDir),
    };
  } catch (err) {
    await cleanupChrome(proc, userDataDir);
    throw err;
  }
}
