/* Obsidian Telemetry Cockpit 确定性 Canvas 2D 背景引擎 */
const _BD_W = 1920;
const _BD_H = 1080;
const _BD_SHOCK_TIMES = [4.0, 6.0, 14.0, 22.0, 30.0, 36.0, 42.0];
const _BD_RIBBONS = [
  { baseY: 320, amp: 56, freq: 0.0024, speed: 0.95, color: '59, 130, 246', spriteIdx: 0, phase: 0.2 },
  { baseY: 545, amp: 68, freq: 0.0020, speed: 1.15, color: '16, 185, 129', spriteIdx: 1, phase: 2.1 },
  { baseY: 750, amp: 48, freq: 0.0027, speed: 0.85, color: '245, 158, 11', spriteIdx: 2, phase: 4.3 }
];

const _bdState = {
  canvas: null,
  ctx: null,
  sprites: [],
  particles: [],
  baseGrad: null,
  vigGrad: null
};

/** 预渲染 256x256 径向辉光离屏精灵，消除逐帧模糊开销与色带 */
function _bdMakeGlowSprite(rgb) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const gCtx = c.getContext('2d');
  const grad = gCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(' + rgb + ', 0.92)');
  grad.addColorStop(0.28, 'rgba(' + rgb + ', 0.42)');
  grad.addColorStop(0.65, 'rgba(' + rgb + ', 0.09)');
  grad.addColorStop(1, 'rgba(' + rgb + ', 0)');
  gCtx.fillStyle = grad;
  gCtx.fillRect(0, 0, 256, 256);
  return c;
}

/** 使用黄金分割序列确定性生成景深微粒表 */
function _bdBuildParticles(count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const h1 = ((i + 1) * 0.61803398875) % 1;
    const h2 = (Math.sin((i + 1) * 12.9898) * 43758.5453) % 1;
    const u2 = h2 < 0 ? h2 + 1 : h2;
    const depth = 0.22 + (i % 9) * 0.095;
    list.push({
      x: h1 * _BD_W,
      y: u2 * _BD_H,
      depth: depth,
      speedY: 10 + depth * 28,
      speedX: (h1 - 0.5) * 18,
      spriteIdx: i % 3,
      phase: i * 0.73
    });
  }
  return list;
}

/** 挂载背景 Canvas 并初始化缓存纹理 */
function _bdMount(canvasEl) {
  if (!canvasEl) {
    return;
  }
  const ctx = canvasEl.getContext('2d', { alpha: false });
  _bdState.canvas = canvasEl;
  _bdState.ctx = ctx;
  _bdState.sprites = [
    _bdMakeGlowSprite('59, 130, 246'),
    _bdMakeGlowSprite('16, 185, 129'),
    _bdMakeGlowSprite('245, 158, 11'),
    _bdMakeGlowSprite('239, 68, 68')
  ];
  _bdState.particles = _bdBuildParticles(68);
  const baseGrad = ctx.createLinearGradient(0, 0, 0, _BD_H);
  baseGrad.addColorStop(0, '#04070F');
  baseGrad.addColorStop(0.48, '#081022');
  baseGrad.addColorStop(1, '#040813');
  _bdState.baseGrad = baseGrad;
  const vig = ctx.createRadialGradient(960, 520, 420, 960, 540, 1220);
  vig.addColorStop(0, 'rgba(4, 7, 15, 0)');
  vig.addColorStop(1, 'rgba(2, 4, 10, 0.72)');
  _bdState.vigGrad = vig;
}

/** 在指定中心点绘制缩放后的辉光精灵 */
function _bdStampGlow(ctx, spriteIdx, cx, cy, radius, alpha) {
  const sprite = _bdState.sprites[spriteIdx];
  if (!sprite || alpha <= 0.002) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(sprite, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

/** 计算 Compact 与安防时段警戒红晕权重 */
function _bdGetAlertWeight(t) {
  const P = window.Promo;
  const compactPeak = P.smoothstep(9.5, 10.5, t) * (1 - P.smoothstep(10.6, 12.2, t));
  const secBand = P.smoothstep(21.8, 23.0, t) * (1 - P.smoothstep(29.0, 30.2, t));
  return Math.max(compactPeak * 0.8, secBand * 0.55);
}

/** 绘制三色体积光晕与 Beat Drop 呼吸膨胀 */
function _bdDrawGlows(ctx, t, beat) {
  const P = window.Promo;
  const dropBoost = P.smoothstep(3.8, 4.05, t) * (1 - P.smoothstep(4.05, 5.2, t));
  const pulse = 1 + beat * 0.08 + dropBoost * 0.28;
  const bx = 520 + Math.sin(t * 0.19) * 140;
  const by = 340 + Math.cos(t * 0.23) * 90;
  const ex = 1380 + Math.cos(t * 0.16) * 130;
  const ey = 420 + Math.sin(t * 0.21) * 100;
  const ax = 980 + Math.sin(t * 0.13 + 1.5) * 190;
  const ay = 780 + Math.cos(t * 0.18) * 70;
  _bdStampGlow(ctx, 0, bx, by, 540 * pulse, 0.22 + beat * 0.06);
  _bdStampGlow(ctx, 1, ex, ey, 510 * pulse, 0.18 + beat * 0.05);
  _bdStampGlow(ctx, 2, ax, ay, 460 * pulse, 0.14 + dropBoost * 0.12);
  const alertW = _bdGetAlertWeight(t);
  _bdStampGlow(ctx, 3, 1240, 520, 480, alertW * 0.2);
}

/** 绘制 3D 透视地板经线（向灭点汇聚） */
function _bdDrawMeridians(ctx, vpX, vpY) {
  const count = 18;
  const spread = 2400;
  ctx.lineWidth = 1;
  for (let i = 0; i <= count; i += 1) {
    const ratio = i / count - 0.5;
    const endX = vpX + ratio * spread * 2.2;
    const isCenter = Math.abs(ratio) < 0.04;
    ctx.strokeStyle = isCenter ? 'rgba(52, 211, 153, 0.24)' : 'rgba(59, 130, 246, 0.14)';
    ctx.beginPath();
    ctx.moveTo(vpX + ratio * 160, vpY);
    ctx.lineTo(endX, _BD_H + 20);
    ctx.stroke();
  }
}

/** 绘制沿 Z 轴向镜头推进的透视纬线 */
function _bdDrawDepthLines(ctx, vpX, vpY, t) {
  const rows = 14;
  const step = 1 / rows;
  const scroll = (t * 0.26) % step;
  const spanY = _BD_H - vpY;
  for (let i = 0; i < rows; i += 1) {
    const z = i * step + (step - scroll);
    const proj = (z * z);
    const y = vpY + proj * spanY;
    const alpha = Math.min(0.28, proj * 0.34);
    const halfW = 140 + proj * 1450;
    ctx.strokeStyle = 'rgba(96, 165, 250, ' + alpha.toFixed(3) + ')';
    ctx.lineWidth = 0.8 + proj * 1.1;
    ctx.beginPath();
    ctx.moveTo(vpX - halfW, y);
    ctx.lineTo(vpX + halfW, y);
    ctx.stroke();
  }
}

/** 绘制 3D 透视遥测地面网格 */
function _bdDrawPerspectiveGrid(ctx, t) {
  const vpX = _BD_W * 0.5 + Math.sin(t * 0.22) * 34;
  const vpY = 470 + Math.cos(t * 0.18) * 14;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, vpY, _BD_W, _BD_H - vpY);
  ctx.clip();
  _bdDrawMeridians(ctx, vpX, vpY);
  _bdDrawDepthLines(ctx, vpX, vpY, t);
  ctx.restore();
  const hGrad = ctx.createLinearGradient(0, vpY, _BD_W, vpY);
  hGrad.addColorStop(0, 'rgba(59, 130, 246, 0)');
  hGrad.addColorStop(0.5, 'rgba(96, 165, 250, 0.28)');
  hGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.strokeStyle = hGrad;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, vpY);
  ctx.lineTo(_BD_W, vpY);
  ctx.stroke();
}

/** 绘制背景中心微弱遥测轨道刻度环 */
function _bdDrawOrbitalRing(ctx, t, beat) {
  const cx = 960;
  const cy = 515;
  const r = 470 + beat * 8;
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.065)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([4, 18]);
  ctx.lineDashOffset = -t * 28;
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.14)';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** 计算数据流光带在 x 位置的纵坐标 */
function _bdRibbonY(cfg, x, t) {
  const w1 = Math.sin(x * cfg.freq + t * cfg.speed + cfg.phase) * cfg.amp;
  const w2 = Math.cos(x * cfg.freq * 1.7 - t * 0.65 + cfg.phase) * (cfg.amp * 0.35);
  return cfg.baseY + w1 + w2;
}

/** 绘制单条三色数据流光带及光子脉冲点 */
function _bdDrawSingleRibbon(ctx, cfg, t) {
  ctx.beginPath();
  for (let x = 0; x <= _BD_W; x += 48) {
    const y = _bdRibbonY(cfg, x, t);
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = 'rgba(' + cfg.color + ', 0.09)';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(' + cfg.color + ', 0.26)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  const px = ((t * (260 + cfg.speed * 80) + cfg.phase * 420) % (_BD_W + 240)) - 120;
  const py = _bdRibbonY(cfg, px, t);
  _bdStampGlow(ctx, cfg.spriteIdx, px, py, 32, 0.55);
}

/** 绘制三条三色数据流光带 */
function _bdDrawRibbons(ctx, t) {
  for (let i = 0; i < _BD_RIBBONS.length; i += 1) {
    _bdDrawSingleRibbon(ctx, _BD_RIBBONS[i], t);
  }
}

/** 绘制景深微粒 */
function _bdDrawParticles(ctx, t, beat) {
  for (let i = 0; i < _bdState.particles.length; i += 1) {
    const p = _bdState.particles[i];
    const px = ((p.x + t * p.speedX) % _BD_W + _BD_W) % _BD_W;
    const py = ((p.y - t * p.speedY) % _BD_H + _BD_H) % _BD_H;
    const twinkle = 0.45 + 0.55 * Math.sin(t * 2.2 + p.phase);
    const alpha = (0.16 + p.depth * 0.36) * twinkle;
    if (p.depth > 0.72) {
      _bdStampGlow(ctx, p.spriteIdx, px, py, 10 + p.depth * 14 + beat * 4, alpha * 0.75);
    } else {
      ctx.fillStyle = 'rgba(226, 232, 240, ' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(px, py, 0.9 + p.depth * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** 绘制单个扩展冲击波圆环 */
function _bdDrawShockRing(ctx, radius, rgb, alpha, lineWidth) {
  if (alpha <= 0.004 || radius <= 1) {
    return;
  }
  ctx.strokeStyle = 'rgba(' + rgb + ', ' + alpha.toFixed(3) + ')';
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(960, 540, radius, 0, Math.PI * 2);
  ctx.stroke();
}

const _BD_SHOCK_CFG = {
  major: { span: 1.25, maxR: 1180, alpha: 0.52, width: 3.5 },
  cut: { span: 0.85, maxR: 920, alpha: 0.28, width: 2 }
};

/** 获取冲击波配置表项 */
function _bdGetShockCfg(isMajor) {
  if (isMajor) {
    return _BD_SHOCK_CFG.major;
  }
  return _BD_SHOCK_CFG.cut;
}

/** 渲染单个时间戳的转场或 Beat Drop 冲击波 */
function _bdDrawShockEvent(ctx, t, evtTime, isMajor) {
  const cfg = _bdGetShockCfg(isMajor);
  const dt = t - evtTime;
  if (dt < 0 || dt > cfg.span) {
    return;
  }
  const p = window.Promo.easeOutCubic(dt / cfg.span);
  const fade = Math.pow(1 - dt / cfg.span, 1.5);
  _bdDrawShockRing(ctx, p * cfg.maxR, '59, 130, 246', fade * cfg.alpha, cfg.width);
  if (isMajor) {
    _bdDrawShockRing(ctx, p * cfg.maxR * 0.78, '16, 185, 129', fade * 0.42, 2.5);
    _bdDrawShockRing(ctx, p * cfg.maxR * 0.58, '245, 158, 11', fade * 0.34, 2);
  }
}

/** 渲染 4.0s Beat Drop 与全部切幕冲击波 */
function _bdDrawShockwaves(ctx, t) {
  for (let i = 0; i < _BD_SHOCK_TIMES.length; i += 1) {
    const evtTime = _BD_SHOCK_TIMES[i];
    _bdDrawShockEvent(ctx, t, evtTime, evtTime === 4.0);
  }
}

/** 主渲染入口：纯由时间 t 确定性绘制整帧背景 */
function _bdRender(t) {
  const ctx = _bdState.ctx;
  if (!ctx) {
    return;
  }
  const beat = window.Promo.beatPulse(t, 6);
  ctx.fillStyle = _bdState.baseGrad;
  ctx.fillRect(0, 0, _BD_W, _BD_H);
  _bdDrawGlows(ctx, t, beat);
  _bdDrawOrbitalRing(ctx, t, beat);
  _bdDrawPerspectiveGrid(ctx, t);
  _bdDrawRibbons(ctx, t);
  _bdDrawParticles(ctx, t, beat);
  _bdDrawShockwaves(ctx, t);
  ctx.fillStyle = _bdState.vigGrad;
  ctx.fillRect(0, 0, _BD_W, _BD_H);
}

window.PromoBackdrop = {
  mount: _bdMount,
  render: _bdRender
};
