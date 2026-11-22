/* Scene 2: Live Telemetry (5.8s - 14.2s) - 3D Sidecar Replica, Context Gauge, Compact Curve & Turn Cards */
const S2_BULLETS = [
  { ico: '📊', title: '动态水位 & Compact 预警', desc: '实时追踪 200K 上下文余量，精准捕捉 92% 压缩骤降点' },
  { ico: '⚡', title: '三色 Token & 缓存省钱', desc: '汇总 Input / Cache / Output 与节省金额，损耗一目了然' },
  { ico: '🔍', title: '双色耗时 & JSON 树透视', desc: '拆解模型思考 vs 工具执行耗时，一键钻取完整参数结构' }
];

const S2_CURVE_PTS = [
  [18, 98], [76, 88], [134, 80], [192, 69], [250, 61], [308, 51], [366, 43],
  [424, 34], [482, 23], [528, 15], [578, 70], [648, 44], [720, 24]
];

const S2_COLORS = {
  blue: [59, 130, 246],
  amber: [245, 158, 11],
  red: [239, 68, 68]
};

let _s2Refs = null;

function s2BuildCopyHtml() {
  const items = S2_BULLETS.map(function (b) {
    return '<div class="s2-bullet"><span class="s2-b-ico">' + b.ico + '</span>' +
      '<div><div class="s2-b-title">' + b.title + '</div><div class="s2-b-desc">' + b.desc + '</div></div></div>';
  }).join('');
  return '<div class="s2-copy">' +
    '<div class="sa-tag-pill"><span class="sa-tag-dot"></span><span>01 / LIVE TELEMETRY</span></div>' +
    '<h2 class="s2-h1">实时上下文透视</h2>' +
    '<p class="s2-sub">逐轮耗时与工具调用 X 光级拆解</p>' +
    '<div class="s2-accent-bar"></div>' +
    '<div class="s2-bullets">' + items + '</div>' +
    '<div class="s2-path-note sa-mono">READ-ONLY · ~/.gemini/antigravity/.../transcript.jsonl</div></div>';
}

function s2BuildSidecarHeadHtml() {
  const logoSvg = window.PromoAssets ? window.PromoAssets.getSvg('logo', 's2') : '';
  return '<div class="s2-sc-head">' +
    '<div class="s2-sc-brand"><div class="s2-sc-logo">' + logoSvg + '</div><span class="s2-sc-title">Token Usage</span></div>' +
    '<div class="s2-sc-acts"><span class="s2-cid-pill sa-mono">#76c9f888</span>' +
    '<div class="s2-lang-pill"><span class="s2-lang-seg">EN</span><span class="s2-lang-seg active">中</span></div></div></div>' +
    '<div class="s2-sc-tabs"><div class="s2-sc-tab active">当前会话</div><div class="s2-sc-tab">全部会话</div><div class="s2-sc-tab">趋势总览</div></div>';
}

function s2BuildGaugeCardHtml() {
  const circ = (2 * Math.PI * 39).toFixed(2);
  return '<div class="s2-ctx-card">' +
    '<div class="s2-card-top"><span class="s2-card-title">上下文窗口构成</span>' +
    '<span class="s2-status-pill">状态正常</span></div>' +
    '<div class="s2-gauge-row"><div class="s2-ring-box">' +
      '<svg width="98" height="98" viewBox="0 0 98 98" style="transform:rotate(-90deg)">' +
        '<circle cx="49" cy="49" r="39" fill="none" stroke="rgba(148,163,184,0.18)" stroke-width="8"/>' +
        '<circle class="s2-ring-prog" cx="49" cy="49" r="39" fill="none" stroke="#3b82f6" stroke-width="8" ' +
          'stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + circ + '"/>' +
      '</svg>' +
      '<div class="s2-ring-text"><span class="s2-ring-pct sa-num">24.0%</span><span class="s2-ring-lbl sa-mono">CTX</span></div>' +
    '</div>' +
    '<div><div class="s2-bar-meta"><span class="s2-bar-main sa-num">48.0K / 200K</span>' +
      '<span class="s2-bar-sub sa-mono">MODEL · gemini-2.5-pro</span></div>' +
      '<div class="s2-bar-track"><div class="s2-bar-fill" style="width:24%"></div></div></div></div>' +
    '<div class="s2-kpi-3">' +
      '<div class="s2-kpi-tile"><div class="s2-kpi-k">↑ Input</div><div class="s2-kpi-v blue sa-num" data-kpi="in">0.0K</div></div>' +
      '<div class="s2-kpi-tile"><div class="s2-kpi-k">⚡ Cache Hit</div><div class="s2-kpi-v amber sa-num" data-kpi="cache">0.0%</div><div class="s2-kpi-s sa-num" data-kpi="saved">已省 $0.00</div></div>' +
      '<div class="s2-kpi-tile"><div class="s2-kpi-k">↓ Output</div><div class="s2-kpi-v green sa-num" data-kpi="out">0.0K</div></div>' +
    '</div></div>';
}

function s2BuildCurvePath() {
  return S2_CURVE_PTS.map(function (p, i) {
    return (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1];
  }).join(' ');
}

function s2BuildChartCardHtml() {
  const line = s2BuildCurvePath();
  const area = line + ' L720,120 L18,120 Z';
  return '<div class="s2-chart-card">' +
    '<div class="s2-chart-top"><span class="s2-card-title">上下文历史趋势</span>' +
    '<span class="s2-compact-pill">⚡ COMPACT 压缩点</span></div>' +
    '<svg class="s2-curve-svg" viewBox="0 0 740 128">' +
      '<defs><linearGradient id="s2-cg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#3b82f6" stop-opacity="0.34"/>' +
        '<stop offset="100%" stop-color="#3b82f6" stop-opacity="0.02"/>' +
      '</linearGradient><clipPath id="s2-clip"><rect class="s2-clip-rect" x="0" y="0" width="0" height="128"/></clipPath></defs>' +
      '<line x1="18" y1="18" x2="720" y2="18" stroke="rgba(239,68,68,0.34)" stroke-width="1" stroke-dasharray="5 4"/>' +
      '<text x="720" y="13" text-anchor="end" fill="#fca5a5" font-size="10.5" font-family="SF Mono, monospace">90% COMPACT THRESHOLD</text>' +
      '<path d="' + area + '" fill="url(#s2-cg)" clip-path="url(#s2-clip)"/>' +
      '<path class="s2-curve-line" d="' + line + '" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle class="s2-compact-ring" cx="528" cy="15" r="8" fill="none" stroke="#ef4444" stroke-width="2.5" opacity="0"/>' +
      '<circle class="s2-compact-dot" cx="528" cy="15" r="5.5" fill="#ef4444" stroke="#0b142b" stroke-width="2" opacity="0"/>' +
      '<circle class="s2-lead-dot" cx="18" cy="98" r="5" fill="#f8fafc" stroke="#3b82f6" stroke-width="2.5" opacity="0"/>' +
    '</svg></div>';
}

function s2BuildTurnLeftHtml() {
  return '<div class="s2-turn-card" data-turn="0">' +
    '<div class="s2-turn-head"><span>第 12 轮</span>' +
    '<span class="s2-turn-badges"><span class="s2-mini-pill amber">⚡ 91.2%</span><span class="s2-mini-pill">⏱ 4.6s</span></span></div>' +
    '<div class="s2-turn-prompt">解析 transcript.jsonl 并检测 Compact 压缩点...</div>' +
    '<div class="s2-dur-labels"><span style="color:#60a5fa">● 模型思考 3.4s</span><span style="color:#34d399">● 工具执行 1.2s</span></div>' +
    '<div class="s2-dur-track"><div class="s2-dur-model" style="width:74%"></div><div class="s2-dur-tool" style="width:26%"></div></div>' +
    '<div class="s2-dur-foot sa-mono">+18.4K ctx · 3 tool steps</div></div>';
}

function s2BuildTurnRightHtml() {
  return '<div class="s2-turn-card active" data-turn="1">' +
    '<div class="s2-turn-head"><span>第 13 轮 · 🛠 read_file</span>' +
    '<span class="s2-mini-pill">{ JSON }</span></div>' +
    '<div class="s2-json-box sa-mono">' +
      '<div><span class="s2-jp">▾ {</span></div>' +
      '<div class="s2-json-indent">' +
        '<div><span class="s2-jk">"path"</span><span class="s2-jp">: </span><span class="s2-js">"sidecars/token_panel/parser.mjs"</span><span class="s2-jp">,</span></div>' +
        '<div><span class="s2-jk">"startLine"</span><span class="s2-jp">: </span><span class="s2-jn">1</span><span class="s2-jp">, </span><span class="s2-jk">"endLine"</span><span class="s2-jp">: </span><span class="s2-jn">160</span><span class="s2-jp">,</span></div>' +
        '<div><span class="s2-jk">"cacheHit"</span><span class="s2-jp">: </span><span class="s2-jb">true</span></div>' +
      '</div><div><span class="s2-jp">}</span></div>' +
    '</div></div>';
}

function s2BuildSidecarHtml() {
  return '<div class="s2-panel-stage"><div class="s2-sidecar">' +
    s2BuildSidecarHeadHtml() + s2BuildGaugeCardHtml() + s2BuildChartCardHtml() +
    '<div class="s2-turns-row">' + s2BuildTurnLeftHtml() + s2BuildTurnRightHtml() + '</div>' +
    '</div></div>';
}

function s2CacheChartRefs(stage) {
  const line = stage.querySelector('.s2-curve-line');
  const lineLen = line && typeof line.getTotalLength === 'function' ? line.getTotalLength() : 760;
  if (line) {
    line.style.strokeDasharray = lineLen.toFixed(1);
    line.style.strokeDashoffset = lineLen.toFixed(1);
  }
  return {
    clipRect: stage.querySelector('.s2-clip-rect'),
    line: line,
    lineLen: lineLen,
    compactPill: stage.querySelector('.s2-compact-pill'),
    compactRing: stage.querySelector('.s2-compact-ring'),
    compactDot: stage.querySelector('.s2-compact-dot'),
    leadDot: stage.querySelector('.s2-lead-dot')
  };
}

function s2CacheRefs(stage) {
  const chart = s2CacheChartRefs(stage);
  return Object.assign(chart, {
    stage: stage,
    copy: stage.querySelector('.s2-copy'),
    accentBar: stage.querySelector('.s2-accent-bar'),
    bullets: Array.from(stage.querySelectorAll('.s2-bullet')),
    sidecar: stage.querySelector('.s2-sidecar'),
    ringProg: stage.querySelector('.s2-ring-prog'),
    ringPct: stage.querySelector('.s2-ring-pct'),
    barMain: stage.querySelector('.s2-bar-main'),
    barFill: stage.querySelector('.s2-bar-fill'),
    statusPill: stage.querySelector('.s2-status-pill'),
    kpiIn: stage.querySelector('[data-kpi="in"]'),
    kpiCache: stage.querySelector('[data-kpi="cache"]'),
    kpiSaved: stage.querySelector('[data-kpi="saved"]'),
    kpiOut: stage.querySelector('[data-kpi="out"]'),
    turns: Array.from(stage.querySelectorAll('.s2-turn-card'))
  });
}

function s2MixColor(c1, c2, t, P) {
  const r = Math.round(P.lerp(c1[0], c2[0], t));
  const g = Math.round(P.lerp(c1[1], c2[1], t));
  const b = Math.round(P.lerp(c1[2], c2[2], t));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function s2GaugeColor(pct, P) {
  if (pct < 60) {
    return s2MixColor(S2_COLORS.blue, S2_COLORS.amber, P.invLerp(24, 60, pct), P);
  }
  return s2MixColor(S2_COLORS.amber, S2_COLORS.red, P.invLerp(60, 86, pct), P);
}

function s2ComputeGaugePct(localT, P) {
  if (localT < 4.7) {
    return P.lerp(24.0, 92.0, P.easeInOutQuart(P.invLerp(0.25, 4.7, localT)));
  }
  if (localT < 5.3) {
    return P.lerp(92.0, 48.0, P.easeOutCubic(P.invLerp(4.7, 5.3, localT)));
  }
  return P.lerp(48.0, 84.6, P.easeOutCubic(P.invLerp(5.3, 6.7, localT)));
}

function s2StatusText(pct, postCompact) {
  if (pct >= 84) return '接近上限';
  if (postCompact) return '已触发 Compact';
  if (pct >= 60) return '占用偏高';
  return '状态正常';
}

function s2RenderGauge(refs, localT, P) {
  const pct = s2ComputeGaugePct(localT, P);
  const color = s2GaugeColor(pct, P);
  const usedK = (pct * 2).toFixed(1);
  const circ = 2 * Math.PI * 39;
  refs.ringPct.textContent = pct.toFixed(1) + '%';
  refs.barMain.textContent = usedK + 'K / 200K';
  refs.barFill.style.width = pct.toFixed(2) + '%';
  refs.barFill.style.background = color;
  refs.barFill.style.boxShadow = '0 0 18px ' + color;
  refs.ringProg.setAttribute('stroke', color);
  refs.ringProg.setAttribute('stroke-dashoffset', (circ * (1 - pct / 100)).toFixed(2));
  refs.statusPill.textContent = s2StatusText(pct, localT >= 4.7);
  refs.statusPill.style.borderColor = color;
  refs.statusPill.style.color = color;
}

function s2RenderKpis(refs, localT, P) {
  const p = P.easeOutCubic(P.invLerp(0.3, 4.4, localT));
  const inVal = P.lerp(18.4, 142.8, p);
  const cachePct = P.lerp(62.0, 89.4, p);
  const savedVal = P.lerp(0.65, 4.82, p);
  const outVal = P.lerp(3.2, 28.6, p);
  refs.kpiIn.textContent = inVal.toFixed(1) + 'K';
  refs.kpiCache.textContent = cachePct.toFixed(1) + '%';
  refs.kpiSaved.textContent = '已省 $' + savedVal.toFixed(2);
  refs.kpiOut.textContent = outVal.toFixed(1) + 'K';
}

function s2RenderLeadPoint(refs, drawP, drawn) {
  if (!refs.line || typeof refs.line.getPointAtLength !== 'function') return;
  const pt = refs.line.getPointAtLength(drawn);
  refs.clipRect.setAttribute('width', pt.x.toFixed(1));
  refs.leadDot.setAttribute('cx', pt.x.toFixed(1));
  refs.leadDot.setAttribute('cy', pt.y.toFixed(1));
  refs.leadDot.style.opacity = drawP > 0.02 ? '1' : '0';
}

function s2RenderCompactPulse(refs, t, P) {
  const hit = t >= 10.5;
  const pulse = hit ? P.invLerp(10.5, 11.4, t) : 0;
  const ringR = P.lerp(6, 20, pulse % 1);
  refs.compactPill.style.opacity = hit ? '1' : '0.18';
  refs.compactDot.style.opacity = String(Number(hit));
  refs.compactRing.setAttribute('r', ringR.toFixed(1));
  refs.compactRing.style.opacity = (Number(hit) * (1 - pulse) * 0.9).toFixed(3);
}

function s2RenderCurve(refs, t, localT, P) {
  const pPre = P.invLerp(0.3, 4.7, localT) * 0.698;
  const pPost = P.invLerp(4.7, 6.7, localT) * 0.302;
  const drawP = P.clamp(pPre + pPost, 0, 1);
  const drawn = refs.lineLen * drawP;
  refs.line.style.strokeDashoffset = (refs.lineLen - drawn).toFixed(2);
  s2RenderLeadPoint(refs, drawP, drawn);
  s2RenderCompactPulse(refs, t, P);
}

function s2RenderCopyAndTurns(refs, localT, P) {
  const barP = P.easeOutCubic(P.invLerp(0.1, 0.9, localT));
  refs.accentBar.style.width = (140 * barP).toFixed(1) + 'px';
  refs.bullets.forEach(function (el, idx) {
    const p = P.easeOutCubic(P.invLerp(0.28 + idx * 0.24, 0.78 + idx * 0.24, localT));
    el.style.opacity = p.toFixed(4);
    el.style.transform = 'translate3d(' + P.lerp(-24, 0, p).toFixed(1) + 'px,0,0)';
  });
  refs.turns.forEach(function (card, idx) {
    const p = P.easeOutBack(P.invLerp(1.6 + idx * 1.1, 2.25 + idx * 1.1, localT));
    card.style.opacity = P.clamp(p * 1.3, 0, 1).toFixed(4);
    card.style.transform = 'translate3d(0,' + P.lerp(20, 0, p).toFixed(1) + 'px,0) scale(' + P.lerp(0.94, 1, p).toFixed(4) + ')';
  });
}

function s2RenderSidecar3D(refs, localT, P) {
  const enterP = P.easeOutCubic(P.invLerp(0, 0.7, localT));
  const slideX = P.lerp(64, 0, enterP);
  const floatY = Math.sin(localT * 1.15) * 6.5;
  const rotY = -5.5 + Math.sin(localT * 0.72) * 2.2;
  const rotX = 2.0 + Math.cos(localT * 0.58) * 1.4;
  refs.sidecar.style.opacity = enterP.toFixed(4);
  refs.sidecar.style.transform = 'translate3d(' + slideX.toFixed(1) + 'px,' + floatY.toFixed(1) + 'px,0) ' +
    'rotateY(' + rotY.toFixed(2) + 'deg) rotateX(' + rotX.toFixed(2) + 'deg)';
}

function s2Mount(root) {
  const stage = document.createElement('div');
  stage.className = 'sa-stage';
  stage.innerHTML = '<div class="s2-grid">' + s2BuildCopyHtml() + s2BuildSidecarHtml() + '</div>';
  root.appendChild(stage);
  _s2Refs = s2CacheRefs(stage);
}

function s2Render(ctx) {
  if (!_s2Refs) return;
  const P = window.Promo;
  const exitShift = -ctx.exit * 28;
  _s2Refs.stage.style.transform = 'translate3d(' + exitShift.toFixed(1) + 'px,0,0)';
  s2RenderCopyAndTurns(_s2Refs, ctx.localT, P);
  s2RenderSidecar3D(_s2Refs, ctx.localT, P);
  s2RenderGauge(_s2Refs, ctx.localT, P);
  s2RenderKpis(_s2Refs, ctx.localT, P);
  s2RenderCurve(_s2Refs, ctx.t, ctx.localT, P);
}

window.Promo.registerScene({
  id: 'live',
  index: 2,
  tag: '01 / LIVE TELEMETRY',
  start: 5.8,
  end: 14.2,
  mount: s2Mount,
  render: s2Render
});
