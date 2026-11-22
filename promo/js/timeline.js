/* 宣传片确定性时间轴引擎、数学缓动工具与场景调度中心 */
const PROMO_DURATION = 48;
const PROMO_FPS = 60;
const PROMO_TOTAL_FRAMES = 2880;
const PROMO_BPM = 120;

const _tlState = {
  scenes: [],
  mounted: false,
  hud: null,
  playStartMs: null
};

/** 限制数值在 [min, max] 区间 */
function _tlClamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/** 线性插值 */
function _tlLerp(a, b, t) {
  return a + (b - a) * t;
}

/** 反向归一化插值并钳位至 [0, 1] */
function _tlInvLerp(a, b, v) {
  if (a === b) {
    return 0;
  }
  return _tlClamp((v - a) / (b - a), 0, 1);
}

/** Hermite 平滑阶跃插值 */
function _tlSmoothstep(edge0, edge1, x) {
  const t = _tlInvLerp(edge0, edge1, x);
  return t * t * (3 - 2 * t);
}

/** 三次缓出 */
function _tlEaseOutCubic(t) {
  const u = 1 - _tlClamp(t, 0, 1);
  return 1 - u * u * u;
}

/** 三次缓入 */
function _tlEaseInCubic(t) {
  const u = _tlClamp(t, 0, 1);
  return u * u * u;
}

/** 四次对称缓入缓出 */
function _tlEaseInOutQuart(t) {
  const u = _tlClamp(t, 0, 1);
  if (u < 0.5) {
    return 8 * u * u * u * u;
  }
  const f = -2 * u + 2;
  return 1 - (f * f * f * f) / 2;
}

/** 指数缓出 */
function _tlEaseOutExpo(t) {
  const u = _tlClamp(t, 0, 1);
  if (u <= 0) {
    return 0;
  }
  if (u >= 1) {
    return 1;
  }
  return 1 - Math.pow(2, -10 * u);
}

/** 过冲回弹缓出 */
function _tlEaseOutBack(t) {
  const u = _tlClamp(t, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const f = u - 1;
  return 1 + c3 * f * f * f + c1 * f * f;
}

/** 120 BPM 拍点脉冲（每拍 0.5s） */
function _tlBeatPulse(t, decay) {
  const rate = decay === undefined ? 6 : decay;
  const beatsPerSec = PROMO_BPM / 60;
  const phase = (Math.max(0, t) * beatsPerSec + 1e-9) % 1;
  return Math.exp(-phase * rate);
}

/** 120 BPM 小节脉冲（每小节 2.0s） */
function _tlBarPulse(t, decay) {
  const rate = decay === undefined ? 3 : decay;
  const barsPerSec = PROMO_BPM / 240;
  const phase = (Math.max(0, t) * barsPerSec + 1e-9) % 1;
  return Math.exp(-phase * rate);
}

/** 格式化千分位整数 */
function _tlFmtInt(n) {
  const num = Math.round(Number(n) || 0);
  return num.toLocaleString('en-US');
}

/** 格式化紧凑数值（K / M） */
function _tlFmtCompact(n) {
  const num = Number(n) || 0;
  const abs = Math.abs(num);
  if (abs >= 1e6) {
    return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (abs >= 1e3) {
    return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return String(Math.round(num));
}

/** 格式化美元金额 */
function _tlFmtUsd(n) {
  const num = Number(n) || 0;
  const sign = num < 0 ? '-' : '';
  const body = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return sign + '$' + body;
}

/** 补齐两位数字 */
function _tlPad2(v) {
  return String(Math.max(0, Math.floor(v))).padStart(2, '0');
}

/** 格式化右上角时间码 00:SS:FF · 60FPS */
function _tlFmtTimecode(frame, fps) {
  const totalSec = Math.floor(frame / fps);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const subFrame = frame % fps;
  return _tlPad2(mins) + ':' + _tlPad2(secs) + ':' + _tlPad2(subFrame) + ' · ' + fps + 'FPS';
}

/** 挂载单个场景节点到舞台容器 */
function _tlMountScene(scene, stageEl) {
  if (scene._el) {
    return;
  }
  const el = document.createElement('section');
  el.className = 'promo-scene';
  el.id = 'scene-' + scene.id;
  el.dataset.sceneId = scene.id;
  stageEl.appendChild(el);
  scene._el = el;
  scene.mount(el);
}

/** 按场景 index 升序排序 */
function _tlCompareScenes(a, b) {
  return Number(a.index) - Number(b.index);
}

/** 注册分镜场景 */
function _tlRegisterScene(spec) {
  const entry = Object.assign({ _el: null, index: 0 }, spec);
  _tlState.scenes.push(entry);
  _tlState.scenes.sort(_tlCompareScenes);
  if (_tlState.mounted) {
    _tlMountScene(entry, _tlState.hud.stage);
  }
}

/** 判断时间 t 是否处于场景有效区间 */
function _tlIsSceneActive(scene, t) {
  if (t < scene.start) {
    return false;
  }
  if (scene.end >= PROMO_DURATION) {
    return t <= scene.end;
  }
  return t < scene.end;
}

/** 构建单个场景的确定性渲染上下文 */
function _tlBuildSceneCtx(scene, t, frame, fps) {
  const localT = t - scene.start;
  const span = Math.max(0.001, scene.end - scene.start);
  const progress = _tlClamp(localT / span, 0, 1);
  const enter = scene.start <= 0 ? 1 : _tlSmoothstep(0, 0.4, localT);
  const fadeOut = scene.end >= PROMO_DURATION ? 0.6 : 0.4;
  const exit = _tlSmoothstep(scene.end - fadeOut, scene.end, t);
  const opacity = enter * (1 - exit);
  return {
    t: t,
    frame: frame,
    fps: fps,
    localT: localT,
    progress: progress,
    enter: enter,
    exit: exit,
    opacity: opacity,
    beat: _tlBeatPulse(t, 6),
    bar: _tlBarPulse(t, 3)
  };
}

/** 驱动单个场景显隐及 render 调用并返回上下文 */
function _tlRenderSingleScene(scene, t, frame, fps) {
  if (!scene._el) {
    return null;
  }
  if (!_tlIsSceneActive(scene, t)) {
    scene._el.style.display = 'none';
    scene._el.style.opacity = '0';
    return null;
  }
  const ctx = _tlBuildSceneCtx(scene, t, frame, fps);
  scene._el.style.display = 'block';
  scene._el.style.opacity = ctx.opacity.toFixed(4);
  scene.render(ctx);
  return { scene: scene, opacity: ctx.opacity };
}

/** 刷新 HUD 场景标签、时间码与底部进度条 */
function _tlUpdateHud(lead, t, frame, fps) {
  const hud = _tlState.hud;
  if (!hud) {
    return;
  }
  const pct = _tlClamp((t / PROMO_DURATION) * 100, 0, 100).toFixed(4) + '%';
  hud.timecode.textContent = _tlFmtTimecode(frame, fps);
  hud.fill.style.width = pct;
  hud.head.style.left = pct;
  hud.dot.style.transform = 'scale(' + (1 + _tlBeatPulse(t, 7) * 0.38).toFixed(3) + ')';
  if (lead) {
    hud.label.textContent = lead.tag;
  }
}

/** 选择当前主激活场景用于 HUD 标牌显示 */
function _tlPickLead(currentLead, candidate) {
  if (!candidate) {
    return currentLead;
  }
  if (!currentLead || candidate.opacity >= currentLead.opacity) {
    return candidate;
  }
  return currentLead;
}

/** 解析安全帧号与目标时间 */
function _tlResolveTime(frame, totalFrames, fps) {
  const safeFps = fps > 0 ? fps : PROMO_FPS;
  const safeTotal = totalFrames > 0 ? totalFrames : PROMO_TOTAL_FRAMES;
  const safeFrame = _tlClamp(Math.round(Number(frame) || 0), 0, safeTotal);
  const t = _tlClamp(safeFrame / safeFps, 0, PROMO_DURATION);
  return { frame: safeFrame, fps: safeFps, t: t };
}

/** 确定性渲染任意一帧 */
function _tlRenderFrame(frame, totalFrames, fps) {
  const pos = _tlResolveTime(frame, totalFrames, fps);
  if (window.PromoBackdrop) {
    window.PromoBackdrop.render(pos.t);
  }
  let lead = null;
  for (let i = 0; i < _tlState.scenes.length; i += 1) {
    const res = _tlRenderSingleScene(_tlState.scenes[i], pos.t, pos.frame, pos.fps);
    lead = _tlPickLead(lead, res);
  }
  const leadScene = lead ? lead.scene : null;
  _tlUpdateHud(leadScene, pos.t, pos.frame, pos.fps);
  return pos.t;
}

/** 缓存 HUD 与舞台 DOM 引用 */
function _tlCacheHud() {
  _tlState.hud = {
    canvas: document.getElementById('bg-canvas'),
    stage: document.getElementById('stage'),
    label: document.getElementById('hud-scene-label'),
    dot: document.getElementById('hud-tag-dot'),
    timecode: document.getElementById('hud-timecode'),
    fill: document.getElementById('hud-progress-fill'),
    head: document.getElementById('hud-progress-head')
  };
}

/** 等待 DOM 完成解析 */
function _tlWaitDomReady() {
  if (document.readyState !== 'loading') {
    return Promise.resolve();
  }
  return new Promise(function (resolve) {
    document.addEventListener('DOMContentLoaded', resolve, { once: true });
  });
}

/** 启动 ?play=1 实时预览循环 */
function _tlPlayTick(nowMs) {
  if (_tlState.playStartMs === null) {
    _tlState.playStartMs = nowMs;
  }
  const elapsedSec = ((nowMs - _tlState.playStartMs) / 1000) % PROMO_DURATION;
  const frame = Math.floor(elapsedSec * PROMO_FPS);
  _tlRenderFrame(frame, PROMO_TOTAL_FRAMES, PROMO_FPS);
  requestAnimationFrame(_tlPlayTick);
}

/** 根据 URL 查询参数执行初始渲染或循环预览 */
function _tlApplyUrlMode() {
  const params = new URLSearchParams(window.location.search);
  const tParam = parseFloat(params.get('t'));
  const fParam = parseInt(params.get('frame'), 10);
  if (Number.isFinite(tParam)) {
    _tlRenderFrame(Math.round(tParam * PROMO_FPS), PROMO_TOTAL_FRAMES, PROMO_FPS);
  } else if (Number.isFinite(fParam)) {
    _tlRenderFrame(fParam, PROMO_TOTAL_FRAMES, PROMO_FPS);
  } else {
    _tlRenderFrame(0, PROMO_TOTAL_FRAMES, PROMO_FPS);
  }
  if (params.get('play') === '1') {
    requestAnimationFrame(_tlPlayTick);
  }
}

/** 异步初始化引擎底座与全部注册场景 */
async function _tlBoot() {
  await _tlWaitDomReady();
  if (document.fonts) {
    await document.fonts.ready;
  }
  if (window.PromoAssets) {
    await window.PromoAssets.ready;
  }
  _tlCacheHud();
  if (window.PromoBackdrop) {
    window.PromoBackdrop.mount(_tlState.hud.canvas);
  }
  for (let i = 0; i < _tlState.scenes.length; i += 1) {
    _tlMountScene(_tlState.scenes[i], _tlState.hud.stage);
  }
  _tlState.mounted = true;
  _tlApplyUrlMode();
  window.__PROMO_READY__ = true;
}

window.Promo = {
  DURATION: PROMO_DURATION,
  FPS: PROMO_FPS,
  TOTAL_FRAMES: PROMO_TOTAL_FRAMES,
  BPM: PROMO_BPM,
  clamp: _tlClamp,
  lerp: _tlLerp,
  invLerp: _tlInvLerp,
  smoothstep: _tlSmoothstep,
  easeOutCubic: _tlEaseOutCubic,
  easeInCubic: _tlEaseInCubic,
  easeInOutQuart: _tlEaseInOutQuart,
  easeOutExpo: _tlEaseOutExpo,
  easeOutBack: _tlEaseOutBack,
  beatPulse: _tlBeatPulse,
  barPulse: _tlBarPulse,
  fmtInt: _tlFmtInt,
  fmtCompact: _tlFmtCompact,
  fmtUsd: _tlFmtUsd,
  registerScene: _tlRegisterScene
};

window.renderFrame = _tlRenderFrame;

_tlBoot();
