/**
 * Zero-dependency 60fps parallel CDP video renderer & ffmpeg muxer.
 */
import { spawn } from 'node:child_process';
import { access, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChrome } from './cdp_client.mjs';
import { PROMO_DIR, startStaticServer } from './server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG_PATH = '/opt/homebrew/bin/ffmpeg';
const BUILD_DIR = path.join(PROMO_DIR, 'build');
const KEYFRAMES_DIR = path.join(BUILD_DIR, 'keyframes');
const SOUNDTRACK_PATH = path.join(BUILD_DIR, 'soundtrack.wav');
const FINAL_VIDEO_PATH = path.join(PROMO_DIR, 'token-usage-promo.mp4');
const POSTER_PATH = path.join(PROMO_DIR, 'poster.png');

const TOTAL_FRAMES = 2880;
const FPS = 60;
const WORKER_COUNT = 4;
const KEYFRAME_SECS = [
  '1.2', '4.6', '8.5', '11.2', '16.5', '19.5',
  '24.5', '27.5', '33.0', '38.5', '44.5', '46.8',
];

const FLAG_SETTERS = {
  '--help': (opts) => { opts.help = true; },
  '-h': (opts) => { opts.help = true; },
  '--preview': (opts) => { opts.preview = true; },
};

function printHelp() {
  console.log([
    'Usage: node promo/render/render_video.mjs [options]',
    '',
    'Options:',
    '  --preview            Render 12 keyframes into promo/build/keyframes/',
    '  --poster-sec <sec>   Poster timestamp in seconds (default: 4.6)',
    '  --help, -h           Show this help message and exit',
  ].join('\n'));
}

function parsePosterSec(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`Invalid --poster-sec value: ${raw}`);
  }
  return num;
}

function normalizeTokens(argv) {
  return argv.flatMap((arg) => (arg.startsWith('--poster-sec=') ? arg.split('=', 2) : [arg]));
}

function applyArg(opts, tokens, i) {
  const arg = tokens[i];
  if (FLAG_SETTERS[arg]) {
    FLAG_SETTERS[arg](opts);
    return i + 1;
  }
  if (arg === '--poster-sec') {
    opts.posterSec = parsePosterSec(tokens[i + 1]);
    return i + 2;
  }
  throw new Error(`Unknown CLI option: ${arg}`);
}

function parseCliArgs(argv) {
  const opts = { help: false, preview: false, posterSec: 4.6 };
  const tokens = normalizeTokens(argv);
  let i = 0;
  while (i < tokens.length) {
    i = applyArg(opts, tokens, i);
  }
  return opts;
}

function buildPartRanges() {
  const step = TOTAL_FRAMES / WORKER_COUNT;
  return Array.from({ length: WORKER_COUNT }, (_, idx) => ({
    idx,
    start: idx * step,
    end: (idx + 1) * step,
    outputPath: path.join(BUILD_DIR, `part_${idx}.mp4`),
  }));
}

function computePosterFrame(posterSec) {
  const raw = Math.round(posterSec * FPS);
  return Math.max(0, Math.min(TOTAL_FRAMES - 1, raw));
}

function formatFfmpegFailure(label, code, stderrList) {
  const tail = stderrList.join('').slice(-1500);
  return new Error(`${label} failed with exit code ${code}\n${tail}`);
}

function runFfmpeg(args, label) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    const stderr = [];
    proc.stderr.on('data', (chunk) => stderr.push(chunk.toString('utf8')));
    proc.once('error', reject);
    proc.once('close', (code) => {
      code === 0 ? resolve() : reject(formatFfmpegFailure(label, code, stderr));
    });
  });
}

function spawnPartEncoder(outputPath) {
  const args = [
    '-y', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', String(FPS),
    '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '10',
    '-pix_fmt', 'yuv420p', outputPath,
  ];
  const proc = spawn(FFMPEG_PATH, args, { stdio: ['pipe', 'ignore', 'pipe'] });
  const stderr = [];
  proc.stderr.on('data', (chunk) => stderr.push(chunk.toString('utf8')));
  proc.stdin.on('error', () => {});
  const done = new Promise((resolve, reject) => {
    proc.once('error', reject);
    proc.once('close', (code) => {
      code === 0 ? resolve() : reject(formatFfmpegFailure(`ffmpeg part`, code, stderr));
    });
  });
  return { proc, done };
}

function waitDrain(stream) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      stream.off('drain', onDrain);
      stream.off('error', onError);
      stream.off('close', onClose);
    };
    const onDrain = () => { cleanup(); resolve(); };
    const onError = (err) => { cleanup(); reject(err); };
    const onClose = () => { cleanup(); reject(new Error('ffmpeg stdin closed')); };
    stream.on('drain', onDrain);
    stream.on('error', onError);
    stream.on('close', onClose);
  });
}

function writeStreamChunk(stream, buf) {
  if (stream.destroyed || !stream.writable) {
    return Promise.reject(new Error('ffmpeg stdin closed unexpectedly'));
  }
  return stream.write(buf) ? Promise.resolve() : waitDrain(stream);
}

function logProgress(partIdx, frame, start, end) {
  const done = frame - start + 1;
  const total = end - start;
  if (done % 120 === 0 || frame + 1 === end) {
    console.log(`[worker ${partIdx}] ${done}/${total} frames (frame ${frame})`);
  }
}

function assertNotAborted(abortState) {
  if (abortState.aborted) {
    throw new Error(abortState.reason || 'Render aborted due to sibling worker error');
  }
}

async function encodeFrameLoop(tab, ff, part, posterSpec, abortState) {
  for (let frame = part.start; frame < part.end; frame += 1) {
    assertNotAborted(abortState);
    const png = await tab.renderFrame(frame, TOTAL_FRAMES, FPS);
    if (frame === posterSpec.frame) await writeFile(posterSpec.path, png);
    await writeStreamChunk(ff.proc.stdin, png);
    logProgress(part.idx, frame, part.start, part.end);
  }
}

async function cleanupWorker(tab, ff) {
  if (ff && ff.proc.exitCode === null) ff.proc.kill('SIGKILL');
  if (tab) await tab.close();
}

async function runWorkerSession(browser, url, part, posterSpec, abortState) {
  let tab = null;
  let ff = null;
  try {
    tab = await browser.openTab();
    await tab.navigateAndWaitReady(url);
    ff = spawnPartEncoder(part.outputPath);
    await encodeFrameLoop(tab, ff, part, posterSpec, abortState);
    ff.proc.stdin.end();
    await ff.done;
    return tab.getErrorCount();
  } catch (err) {
    abortState.aborted = true;
    abortState.reason = err.message;
    throw err;
  } finally {
    await cleanupWorker(tab, ff);
  }
}

async function muxPartsAndAudio(parts, concatPath) {
  const listBody = parts.map((p) => `file '${p.outputPath.replace(/'/g, "'\\''")}'`).join('\n');
  await writeFile(concatPath, listBody, 'utf8');
  await runFfmpeg([
    '-y', '-f', 'concat', '-safe', '0', '-i', concatPath, '-i', SOUNDTRACK_PATH,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high',
    '-level:v', '4.2', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', FINAL_VIDEO_PATH,
  ], 'ffmpeg final mux');
}

async function renderKeyframe(tab, secStr, idx) {
  const num = String(idx + 1).padStart(2, '0');
  const frame = Math.round(Number(secStr) * FPS);
  const outPath = path.join(KEYFRAMES_DIR, `kf_${num}_${secStr}s.png`);
  const png = await tab.renderFrame(frame, TOTAL_FRAMES, FPS);
  await writeFile(outPath, png);
  console.log(`[preview] saved ${path.basename(outPath)} (frame ${frame}, ${png.length} bytes)`);
}

async function runPreviewMode(browser, url) {
  await mkdir(KEYFRAMES_DIR, { recursive: true });
  const tab = await browser.openTab();
  try {
    await tab.navigateAndWaitReady(url);
    for (let i = 0; i < KEYFRAME_SECS.length; i += 1) {
      await renderKeyframe(tab, KEYFRAME_SECS[i], i);
    }
    return tab.getErrorCount();
  } finally {
    await tab.close();
  }
}

async function verifySoundtrackExists() {
  try {
    await access(SOUNDTRACK_PATH);
  } catch {
    throw new Error(`Missing soundtrack file: ${SOUNDTRACK_PATH}`);
  }
}

async function cleanupTempFiles(files) {
  await Promise.allSettled(files.map((filePath) => rm(filePath, { force: true })));
}

async function reportFinalOutput(startMs, errorCount) {
  const videoStat = await stat(FINAL_VIDEO_PATH);
  const posterStat = await stat(POSTER_PATH);
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(2);
  console.log(`[done] elapsed=${elapsed}s consoleErrors=${errorCount}`);
  console.log(`[done] video=${FINAL_VIDEO_PATH} (${(videoStat.size / 1048576).toFixed(2)} MB)`);
  console.log(`[done] poster=${POSTER_PATH} (${(posterStat.size / 1024).toFixed(1)} KB)`);
}

async function runFullMode(browser, url, posterSec, startMs) {
  await verifySoundtrackExists();
  await mkdir(BUILD_DIR, { recursive: true });
  const parts = buildPartRanges();
  const concatPath = path.join(BUILD_DIR, 'concat.txt');
  const posterSpec = { frame: computePosterFrame(posterSec), path: POSTER_PATH };
  const abortState = { aborted: false, reason: '' };
  try {
    const counts = await Promise.all(parts.map((p) => runWorkerSession(browser, url, p, posterSpec, abortState)));
    const totalErrors = counts.reduce((sum, n) => sum + n, 0);
    await muxPartsAndAudio(parts, concatPath);
    await reportFinalOutput(startMs, totalErrors);
  } finally {
    await cleanupTempFiles([...parts.map((p) => p.outputPath), concatPath]);
  }
}

async function executeRender(opts) {
  const startMs = Date.now();
  const server = await startStaticServer();
  const browser = await launchChrome();
  try {
    if (opts.preview) {
      const errors = await runPreviewMode(browser, server.baseUrl);
      const elapsed = ((Date.now() - startMs) / 1000).toFixed(2);
      console.log(`[preview] completed 12 keyframes in ${elapsed}s, consoleErrors=${errors}`);
      return;
    }
    await runFullMode(browser, server.baseUrl, opts.posterSec, startMs);
  } finally {
    await browser.close();
    await server.close();
  }
}

async function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }
  await executeRender(opts);
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
