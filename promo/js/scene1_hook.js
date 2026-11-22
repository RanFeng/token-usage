/* Scene 1: Ignition (0.0s - 6.2s) - Pain HUD -> Light Beam -> Logo Stroke -> Beat Drop Lockup */
const S1_PAINS = [
  { cls: 'c0', tag: '⚠ CONTEXT OVERFLOW', title: '上下文还剩多少？', desc: '200K 窗口黑盒运行，随时濒临极限', delay: 0.12 },
  { cls: 'c1', tag: '⚡ SUDDEN COMPACT', title: '为何突然 Compact？', desc: '长对话记忆突遭截断，上下文骤降', delay: 0.44 },
  { cls: 'c2', tag: '💳 ROI BLIND SPOT', title: '本月订阅回本了吗？', desc: '$20 / $200 月费不知实际价值几何', delay: 0.76 },
  { cls: 'c3', tag: '🔓 SECRET LEAK RISK', title: '密钥是否泄露进对话？', desc: 'API Key 与 Token 隐患潜伏日志中', delay: 1.08 }
];

const S1_PILLS = [
  { cls: '', text: '100% 本地只读', delay: 4.12 },
  { cls: 'p-green', text: '零外部依赖', delay: 4.22 },
  { cls: 'p-amber', text: '隐私优先', delay: 4.32 }
];

const S1_GLITCH_TOKENS = ['??? TOKENS', 'NaN TOKENS', 'ERR_CTX_92%', '??? / 200K', 'COMPACT?!', '??? TOKENS'];
let _s1Refs = null;

function s1BuildPainCard(item) {
  return '<div class="s1-pain-card ' + item.cls + '">' +
    '<div class="s1-pain-tag sa-mono">' + item.tag + '</div>' +
    '<div class="s1-pain-title">' + item.title + '</div>' +
    '<div class="s1-pain-desc">' + item.desc + '</div></div>';
}

function s1BuildWiresSvg() {
  return '<svg class="s1-wires" viewBox="0 0 1728 908" fill="none">' +
    '<path d="M468 130 L640 310 M1260 130 L1088 310 M468 770 L640 598 M1260 770 L1088 598" ' +
    'stroke="rgba(248,113,113,0.28)" stroke-width="1.5" stroke-dasharray="6 6"/></svg>';
}

function s1BuildPhase1Html() {
  const cards = S1_PAINS.map(s1BuildPainCard).join('');
  return '<div class="s1-phase1">' + s1BuildWiresSvg() + cards +
    '<div class="s1-glitch-core"><div class="s1-glitch-eye sa-mono">ANTIGRAVITY TELEMETRY // UNMONITORED</div>' +
    '<div class="s1-glitch-val sa-mono">??? TOKENS</div>' +
    '<div class="s1-glitch-sub sa-mono">CTX WINDOW: UNKNOWN · COST: UNTRACKED</div></div></div>';
}

function s1BuildReticleSvg() {
  return '<svg class="s1-reticle" viewBox="0 0 244 244" fill="none">' +
    '<circle cx="122" cy="122" r="115" stroke="rgba(96,165,250,0.26)" stroke-width="1.5" stroke-dasharray="8 8"/>' +
    '<circle cx="122" cy="122" r="102" stroke="rgba(52,211,153,0.24)" stroke-width="1" stroke-dasharray="28 16"/>' +
    '</svg>';
}

function s1BuildPillsHtml() {
  return S1_PILLS.map(function (p) {
    return '<div class="s1-pill ' + p.cls + '"><span class="s1-pill-dot"></span><span>' + p.text + '</span></div>';
  }).join('');
}

function s1BuildHeroHtml() {
  const logoSvg = window.PromoAssets ? window.PromoAssets.getSvg('logo', 's1') : '';
  return '<div class="s1-hero-stage">' +
    '<div class="s1-shock-ring"></div><div class="s1-shock-ring alt"></div>' +
    '<div class="s1-hero-group">' +
      '<div class="s1-logo-wrap"><div class="s1-logo-halo"></div>' + s1BuildReticleSvg() +
      '<div class="s1-logo-slot">' + logoSvg + '</div></div>' +
      '<div class="s1-title-row"><h1 class="s1-title">TOKEN USAGE</h1><span class="s1-ver-badge sa-mono">v1.1.0</span></div>' +
      '<p class="s1-subtitle">Antigravity 全景 Token 透视引擎</p>' +
      '<p class="s1-eyebrow-sub sa-mono">REAL-TIME CONTEXT · ROI ANALYTICS · LOCAL LITE DLP</p>' +
      '<div class="s1-pills-row">' + s1BuildPillsHtml() + '</div>' +
    '</div></div>';
}

function s1MeasurePath(el, fallback) {
  return typeof el.getTotalLength === 'function' ? el.getTotalLength() : fallback;
}

function s1InitHexAndBars(refs, svg) {
  refs.hex = svg.querySelector('polygon');
  if (refs.hex) {
    refs.hexLen = s1MeasurePath(refs.hex, 192);
    refs.hex.style.strokeDasharray = refs.hexLen.toFixed(1);
    refs.hex.style.strokeDashoffset = refs.hexLen.toFixed(1);
  }
  refs.bars = Array.from(svg.querySelectorAll('rect')).map(function (el) {
    const yVal = Number(el.getAttribute('y'));
    const hVal = Number(el.getAttribute('height'));
    return { el: el, y: Number.isFinite(yVal) ? yVal : 50, h: Number.isFinite(hVal) ? hVal : 24 };
  });
}

function s1InitLogoPaths(refs) {
  const svg = refs.logoSlot.querySelector('svg');
  if (!svg) return;
  refs.trackCircle = svg.querySelector('circle');
  refs.paths = Array.from(svg.querySelectorAll('path')).map(function (el) {
    const len = s1MeasurePath(el, 120);
    el.style.strokeDasharray = len.toFixed(1);
    el.style.strokeDashoffset = len.toFixed(1);
    return { el: el, len: len };
  });
  s1InitHexAndBars(refs, svg);
}

function s1CacheRefs(stage) {
  const refs = {
    stage: stage,
    phase1: stage.querySelector('.s1-phase1'),
    glitchCore: stage.querySelector('.s1-glitch-core'),
    glitchVal: stage.querySelector('.s1-glitch-val'),
    painCards: Array.from(stage.querySelectorAll('.s1-pain-card')),
    beam: stage.querySelector('.s1-beam'),
    heroGroup: stage.querySelector('.s1-hero-group'),
    logoWrap: stage.querySelector('.s1-logo-wrap'),
    logoHalo: stage.querySelector('.s1-logo-halo'),
    reticle: stage.querySelector('.s1-reticle'),
    logoSlot: stage.querySelector('.s1-logo-slot'),
    ringA: stage.querySelector('.s1-shock-ring'),
    ringB: stage.querySelector('.s1-shock-ring.alt'),
    titleRow: stage.querySelector('.s1-title-row'),
    subtitle: stage.querySelector('.s1-subtitle'),
    eyebrow: stage.querySelector('.s1-eyebrow-sub'),
    pills: Array.from(stage.querySelectorAll('.s1-pill')),
    paths: [], bars: [], hex: null, hexLen: 192, trackCircle: null
  };
  s1InitLogoPaths(refs);
  return refs;
}

function s1RenderPainCards(refs, t, wipeAlpha, P) {
  refs.painCards.forEach(function (card, idx) {
    const enter = P.easeOutBack(P.invLerp(S1_PAINS[idx].delay, S1_PAINS[idx].delay + 0.32, t));
    const jitter = t < 1.9 ? Math.sin(t * 42 + idx * 1.9) * 1.4 : 0;
    const scale = P.lerp(0.86, 1, enter);
    card.style.opacity = (enter * wipeAlpha).toFixed(4);
    card.style.transform = 'translate3d(' + jitter.toFixed(1) + 'px,' + ((1 - enter) * 14).toFixed(1) + 'px,0) scale(' + scale.toFixed(4) + ')';
  });
}

function s1RenderPhase1(refs, t, P) {
  const wipe = 1 - P.smoothstep(1.92, 2.34, t);
  if (wipe <= 0.001) {
    refs.phase1.style.display = 'none';
    return;
  }
  refs.phase1.style.display = 'block';
  refs.phase1.style.opacity = wipe.toFixed(4);
  const tick = Math.floor(t * 14) % S1_GLITCH_TOKENS.length;
  const shakeX = Math.sin(t * 53) * 3.5;
  const shakeY = Math.cos(t * 39) * 2.2;
  refs.glitchVal.textContent = S1_GLITCH_TOKENS[tick];
  refs.glitchCore.style.transform = 'translate(calc(-50% + ' + shakeX.toFixed(1) + 'px), calc(-50% + ' + shakeY.toFixed(1) + 'px))';
  s1RenderPainCards(refs, t, wipe, P);
}

function s1RenderBeam(refs, t, P) {
  const p = P.invLerp(1.85, 2.55, t);
  const active = p > 0 && p < 1;
  refs.beam.style.opacity = active ? Math.sin(p * Math.PI).toFixed(4) : '0';
  refs.beam.style.transform = 'translate3d(' + P.lerp(-260, 2020, P.easeInOutQuart(p)).toFixed(1) + 'px,0,0)';
}

function s1RenderBars(refs, t, beat, P) {
  const pulse = t >= 4.0 ? beat * 0.08 : 0;
  refs.bars.forEach(function (bar, i) {
    const start = 3.05 + i * 0.2;
    const grow = P.easeOutBack(P.invLerp(start, start + 0.36, t));
    const factor = P.clamp(grow + pulse * (i === 1 ? 1.2 : 0.7), 0, 1.15);
    const curH = bar.h * factor;
    const curY = bar.y + (bar.h - curH);
    bar.el.setAttribute('y', curY.toFixed(2));
    bar.el.setAttribute('height', Math.max(0, curH).toFixed(2));
    bar.el.style.opacity = P.clamp(grow * 1.4, 0, 1).toFixed(3);
  });
}

function s1RenderLogoDraw(refs, t, beat, P) {
  const trackP = P.smoothstep(2.05, 2.55, t);
  if (refs.trackCircle) refs.trackCircle.style.opacity = trackP.toFixed(3);
  refs.paths.forEach(function (item, idx) {
    const start = 2.15 + idx * 0.24;
    const p = P.easeOutCubic(P.invLerp(start, start + 0.75, t));
    item.el.style.strokeDashoffset = (item.len * (1 - p)).toFixed(2);
  });
  if (refs.hex) {
    const hp = P.easeOutCubic(P.invLerp(2.75, 3.45, t));
    refs.hex.style.strokeDashoffset = (refs.hexLen * (1 - hp)).toFixed(2);
    refs.hex.style.fillOpacity = P.smoothstep(3.15, 3.6, t).toFixed(3);
  }
  s1RenderBars(refs, t, beat, P);
}

function s1ApplyShockRing(el, p, startS, endS, maxOp, P) {
  const vis = Number(p > 0) * Number(p < 1);
  const scale = P.lerp(startS, endS, P.easeOutCubic(p));
  el.style.opacity = (vis * (1 - p) * maxOp).toFixed(4);
  el.style.transform = 'translate(-50%,-50%) translateY(-147px) scale(' + scale.toFixed(3) + ')';
}

function s1RenderShockRings(refs, t, P) {
  s1ApplyShockRing(refs.ringA, P.invLerp(4.0, 4.95, t), 0.8, 5.2, 0.85, P);
  s1ApplyShockRing(refs.ringB, P.invLerp(4.08, 5.1, t), 0.7, 4.6, 0.7, P);
}

function s1RenderPills(refs, t, P) {
  refs.pills.forEach(function (pill, i) {
    const start = S1_PILLS[i].delay;
    const p = P.easeOutBack(P.invLerp(start, start + 0.26, t));
    pill.style.opacity = P.clamp(p * 1.4, 0, 1).toFixed(4);
    pill.style.transform = 'translate3d(0,' + P.lerp(22, 0, p).toFixed(1) + 'px,0) scale(' + P.lerp(0.84, 1, p).toFixed(4) + ')';
  });
}

function s1RenderHeroLockup(refs, t, beat, P) {
  const showLogo = P.smoothstep(1.98, 2.38, t);
  const dock = P.easeInOutQuart(P.invLerp(3.85, 4.24, t));
  const logoY = P.lerp(132, 0, dock);
  const logoScale = P.lerp(1.24, 1.0, dock);
  refs.logoWrap.style.opacity = showLogo.toFixed(4);
  refs.logoWrap.style.transform = 'translate3d(0,' + logoY.toFixed(1) + 'px,0) scale(' + logoScale.toFixed(4) + ')';
  refs.reticle.style.transform = 'rotate(' + (t * 18).toFixed(2) + 'deg)';
  refs.logoHalo.style.opacity = (showLogo * (0.68 + (t >= 4.0 ? beat * 0.32 : 0))).toFixed(4);
  const tp = P.easeOutBack(P.invLerp(4.0, 4.38, t));
  const sp = P.easeOutCubic(P.invLerp(4.06, 4.44, t));
  refs.titleRow.style.opacity = P.clamp(tp * 1.4, 0, 1).toFixed(4);
  refs.titleRow.style.transform = 'translate3d(0,' + P.lerp(26, 0, tp).toFixed(1) + 'px,0) scale(' + P.lerp(0.86, 1, tp).toFixed(4) + ')';
  refs.subtitle.style.opacity = sp.toFixed(4);
  refs.subtitle.style.transform = 'translate3d(0,' + P.lerp(18, 0, sp).toFixed(1) + 'px,0)';
  refs.eyebrow.style.opacity = sp.toFixed(4);
  s1RenderPills(refs, t, P);
}

function s1Mount(root) {
  const stage = document.createElement('div');
  stage.className = 'sa-stage';
  stage.innerHTML = s1BuildPhase1Html() + '<div class="s1-beam"></div>' + s1BuildHeroHtml();
  root.appendChild(stage);
  _s1Refs = s1CacheRefs(stage);
}

function s1Render(ctx) {
  if (!_s1Refs) return;
  const P = window.Promo;
  const t = ctx.localT;
  const exitScale = 1 + ctx.exit * 0.035;
  _s1Refs.stage.style.transform = 'scale(' + exitScale.toFixed(4) + ')';
  s1RenderPhase1(_s1Refs, t, P);
  s1RenderBeam(_s1Refs, t, P);
  s1RenderLogoDraw(_s1Refs, t, ctx.beat, P);
  s1RenderShockRings(_s1Refs, t, P);
  s1RenderHeroLockup(_s1Refs, t, ctx.beat, P);
}

window.Promo.registerScene({
  id: 'hook',
  index: 1,
  tag: '00 / IGNITION',
  start: 0.0,
  end: 6.2,
  mount: s1Mount,
  render: s1Render
});
