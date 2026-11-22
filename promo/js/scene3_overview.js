/* Scene 3: Trend Overview (13.8s - 22.2s) - ROI Cockpit, 90-Day Heatmap, 24h Rhythm & Top 3 Models */
const S3_HM_COLORS = ['#1e293b', '#064e3b', '#047857', '#10b981', '#34d399'];

const S3_HOURS = [
  58, 36, 18, 8, 5, 6, 10, 22, 42, 64, 72, 68,
  50, 56, 74, 80, 76, 62, 54, 70, 86, 91, 88, 100
];

const S3_MODELS = [
  { name: 'Gemini 2.5 Pro', targetM: 48.2, pct: 100, cls: 'm0', cost: '$84.20' },
  { name: 'Claude 3.7 Sonnet', targetM: 31.6, pct: 65.6, cls: 'm1', cost: '$49.10' },
  { name: 'GPT-5 / Codex', targetM: 14.8, pct: 30.7, cls: 'm2', cost: '$15.30' }
];

const S3_MINI_METRICS = [
  { k: '近 7 天日均', v: '3.12M', s: '$10.24 / 天' },
  { k: '预计本月累计', v: '$194.20', s: '预计 9.7× 回本' },
  { k: '全局缓存命中', v: '88.6%', s: '已省 $160.40' },
  { k: '免费回本折算', v: '🎫 7.4 个月 Pro', s: '净赚 +$128.60' }
];

let _s3Refs = null;

const S3_HM_LUT = [0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 4];

function s3HeatmapLevel(col, row) {
  const wave = (col * 5 + row * 3 + ((col * row) % 7)) % 11;
  const boost = col >= 9 ? 1 : 0;
  return Math.min(4, S3_HM_LUT[wave] + boost);
}

function s3BuildHeaderHtml() {
  return '<div class="s3-header">' +
    '<div><div class="sa-tag-pill"><span class="sa-tag-dot"></span><span>02 / TREND OVERVIEW</span></div>' +
    '<h2 class="s3-h1">12+ 维全景看板 · 订阅回本 ROI 一目了然</h2></div>' +
    '<div class="s3-h-sub">全机跨会话分析 · 90 天热力矩阵 · 24h 作息画像 · 模型能效竞速</div></div>';
}

function s3BuildMiniGridHtml() {
  return '<div class="s3-mini-grid">' + S3_MINI_METRICS.map(function (m) {
    return '<div class="s3-mini-box"><div class="s3-mini-k">' + m.k + '</div>' +
      '<div class="s3-mini-v sa-num">' + m.v + '</div><div class="s3-mini-s sa-num">' + m.s + '</div></div>';
  }).join('') + '</div>';
}

function s3BuildRoiCardHtml() {
  return '<div class="s3-card sa-glass s3-roi-card" data-card="0">' +
    '<div>' +
      '<div class="s3-card-head"><span class="s3-card-title">💳 订阅回本 ROI 仪表盘</span>' +
      '<div class="s3-curr-toggle"><span class="s3-curr-opt active" data-curr="usd">USD</span>' +
      '<span class="s3-curr-opt" data-curr="cny">CNY</span></div></div>' +
      '<div class="s3-plan-meta sa-mono"><span>当前方案: $20 Pro 月费</span><span>本月第 22 / 30 天</span></div>' +
      '<div class="s3-roi-hero"><div class="s3-roi-money-row">' +
        '<span class="s3-roi-usd sa-num">$0.00</span><span class="s3-roi-cny sa-num">¥0.00</span>' +
      '</div><div class="s3-roi-denom">等效 API 价值 / $20.00 月费</div>' +
      '<div class="s3-roi-badge-wrap"><span class="s3-roi-badge">743% ROI · 🏆 本月已回本 7.4×</span></div></div>' +
      '<div class="s3-roi-bar-wrap"><div class="s3-roi-track"><div class="s3-roi-fill" style="width:0%"></div>' +
        '<div class="s3-roi-breakeven"></div></div>' +
      '<div class="s3-roi-scale sa-mono"><span>$0</span><span>100% 回本线 ($20)</span><span>743% ($148.60)</span></div></div>' +
    '</div>' +
    '<div><div class="s3-coffee-badge"><span>☕ 缓存已白嫖 32 杯咖啡</span><span class="s3-coffee-sub">已省 $160.40</span></div>' +
    s3BuildMiniGridHtml() + '</div></div>';
}

function s3BuildHeatmapCellsHtml() {
  const out = [];
  for (let col = 0; col < 13; col += 1) {
    for (let row = 0; row < 7; row += 1) {
      const lvl = s3HeatmapLevel(col, row);
      const x = 4 + col * 27;
      const y = 4 + row * 27;
      out.push('<rect class="s3-hm-cell" data-col="' + col + '" data-row="' + row + '" data-x="' + x + '" data-y="' + y + '" ' +
        'x="' + x + '" y="' + y + '" width="22" height="22" rx="5" fill="' + S3_HM_COLORS[lvl] + '" opacity="0.1"/>');
    }
  }
  return out.join('');
}

function s3BuildHeatmapCardHtml() {
  const swatches = S3_HM_COLORS.map(function (c) {
    return '<span class="s3-hm-sw" style="background:' + c + '"></span>';
  }).join('');
  return '<div class="s3-card sa-glass" data-card="1">' +
    '<div class="s3-card-head"><span class="s3-card-title">🗓 90 天活跃热力图</span>' +
    '<span class="s3-hm-legend"><span>少</span>' + swatches + '<span>多</span></span></div>' +
    '<div class="s3-hm-body"><svg class="s3-hm-svg" viewBox="0 0 356 194">' + s3BuildHeatmapCellsHtml() + '</svg>' +
    '<div class="s3-hm-kpis">' +
      '<div class="s3-hm-kpi"><span class="s3-hm-kk">🔥 连续活跃</span><span class="s3-hm-kv sa-num" data-hm="streak">0 天</span></div>' +
      '<div class="s3-hm-kpi"><span class="s3-hm-kk">⚡ 单日峰值</span><span class="s3-hm-kv sa-num" data-hm="peak">0.0M</span></div>' +
      '<div class="s3-hm-kpi"><span class="s3-hm-kk">🏆 最长连续</span><span class="s3-hm-kv sa-num">42 天</span></div>' +
    '</div></div></div>';
}

function s3HourBarColor(hr, val) {
  if (hr === 23) return '#f59e0b';
  if ((hr + 4) % 24 < 6) return '#38bdf8';
  return val >= 65 ? '#3b82f6' : 'rgba(96, 165, 250, 0.52)';
}

function s3BuildHoursSvgHtml() {
  const bars = S3_HOURS.map(function (val, hr) {
    const x = 4 + hr * 16;
    const h = Math.max(4, Math.round((val / 100) * 114));
    const y = 122 - h;
    return '<rect class="s3-hbar" data-hr="' + hr + '" data-h="' + h + '" data-y="' + y + '" ' +
      'x="' + x + '" y="122" width="11" height="0" rx="3" fill="' + s3HourBarColor(hr, val) + '"/>';
  }).join('');
  return '<svg class="s3-hour-svg" viewBox="0 0 390 128">' +
    '<line x1="2" y1="122" x2="388" y2="122" stroke="rgba(148,163,184,0.28)" stroke-width="1"/>' + bars + '</svg>';
}

function s3BuildModelsHtml() {
  return S3_MODELS.map(function (m, idx) {
    return '<div><div class="s3-model-head"><span>' + (idx + 1) + '. ' + m.name + '</span>' +
      '<span class="s3-model-val sa-num" data-mval="' + idx + '">0.0M · ' + m.cost + '</span></div>' +
      '<div class="s3-model-track"><div class="s3-model-fill ' + m.cls + '" data-mbar="' + idx + '" style="width:0%"></div></div></div>';
  }).join('');
}

function s3BuildBottomRightCardHtml() {
  return '<div class="s3-card sa-glass" data-card="2"><div class="s3-br-split">' +
    '<div class="s3-sub-panel"><div class="s3-card-head"><span class="s3-card-title">🕒 24h 编程作息</span>' +
    '<span class="s3-persona-badge">🌙 深夜架构师 · Peak 23:00</span></div>' + s3BuildHoursSvgHtml() +
    '<div class="s3-hour-axis sa-mono"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div></div>' +
    '<div class="s3-sub-panel"><div class="s3-card-head"><span class="s3-card-title">🤖 主力模型 Top 3</span>' +
    '<span class="sa-mono" style="font-size:13px;color:#94a3b8">94.6M TOKENS</span></div>' +
    '<div class="s3-models-list">' + s3BuildModelsHtml() + '</div></div>' +
    '</div></div>';
}

function s3CacheRefs(stage) {
  return {
    stage: stage,
    cards: Array.from(stage.querySelectorAll('[data-card]')),
    roiUsd: stage.querySelector('.s3-roi-usd'),
    roiCny: stage.querySelector('.s3-roi-cny'),
    currUsd: stage.querySelector('[data-curr="usd"]'),
    currCny: stage.querySelector('[data-curr="cny"]'),
    roiBadge: stage.querySelector('.s3-roi-badge'),
    roiFill: stage.querySelector('.s3-roi-fill'),
    coffeeBadge: stage.querySelector('.s3-coffee-badge'),
    hmCells: Array.from(stage.querySelectorAll('.s3-hm-cell')),
    hmStreak: stage.querySelector('[data-hm="streak"]'),
    hmPeak: stage.querySelector('[data-hm="peak"]'),
    personaBadge: stage.querySelector('.s3-persona-badge'),
    hBars: Array.from(stage.querySelectorAll('.s3-hbar')),
    mVals: Array.from(stage.querySelectorAll('[data-mval]')),
    mBars: Array.from(stage.querySelectorAll('[data-mbar]'))
  };
}

function s3RenderCardEntrances(refs, localT, P) {
  refs.cards.forEach(function (card, idx) {
    const start = idx * 0.22;
    const p = P.easeOutCubic(P.invLerp(start, start + 0.6, localT));
    const floatY = Math.sin(localT * 1.1 + idx * 1.4) * 3.5;
    const y = P.lerp(28, 0, p) + floatY;
    card.style.opacity = p.toFixed(4);
    card.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(' + P.lerp(0.96, 1, p).toFixed(4) + ')';
  });
}

function s3FmtMoney(val) {
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function s3RenderRoiBadges(refs, localT, usd, P) {
  const roiPct = Math.round((usd / 20) * 100);
  const roiRatio = (usd / 20).toFixed(1);
  refs.roiBadge.textContent = roiPct + '% ROI · 🏆 本月已回本 ' + roiRatio + '×';
  const bp = P.easeOutBack(P.invLerp(1.45, 1.95, localT));
  refs.roiBadge.style.opacity = P.clamp(bp * 1.4, 0, 1).toFixed(4);
  refs.roiBadge.style.transform = 'scale(' + P.lerp(0.75, 1, bp).toFixed(4) + ')';
  const cp = P.easeOutBack(P.invLerp(2.55, 3.05, localT));
  refs.coffeeBadge.style.opacity = P.clamp(cp * 1.4, 0, 1).toFixed(4);
  refs.coffeeBadge.style.transform = 'translate3d(0,' + P.lerp(14, 0, cp).toFixed(1) + 'px,0) scale(' + P.lerp(0.9, 1, cp).toFixed(4) + ')';
}

function s3RenderRoi(refs, localT, P) {
  const valP = P.easeOutCubic(P.invLerp(0.35, 3.3, localT));
  const usd = 148.6 * valP;
  const pct = Math.min(100, (usd / 148.6) * 100);
  refs.roiUsd.textContent = '$' + s3FmtMoney(usd);
  refs.roiCny.textContent = '¥' + s3FmtMoney(1069.92 * valP);
  refs.roiFill.style.width = pct.toFixed(2) + '%';
  const cnyMode = localT >= 4.2;
  refs.currUsd.classList.toggle('active', !cnyMode);
  refs.currCny.classList.toggle('active', cnyMode);
  refs.roiCny.style.transform = 'scale(' + (cnyMode ? 1.07 : 0.96).toFixed(3) + ')';
  refs.roiUsd.style.color = cnyMode ? '#cbd5e1' : '#f8fafc';
  s3RenderRoiBadges(refs, localT, usd, P);
}

function s3RenderHeatmap(refs, localT, P) {
  refs.hmCells.forEach(function (cell) {
    const col = Number(cell.dataset.col);
    const row = Number(cell.dataset.row);
    const bx = Number(cell.dataset.x);
    const by = Number(cell.dataset.y);
    const delay = 0.45 + col * 0.14 + row * 0.05;
    const p = P.easeOutBack(P.invLerp(delay, delay + 0.32, localT));
    const size = 22 * P.lerp(0.3, 1, P.clamp(p, 0, 1.08));
    const offset = (22 - size) / 2;
    cell.setAttribute('x', (bx + offset).toFixed(2));
    cell.setAttribute('y', (by + offset).toFixed(2));
    cell.setAttribute('width', Math.max(2, size).toFixed(2));
    cell.setAttribute('height', Math.max(2, size).toFixed(2));
    cell.setAttribute('opacity', P.lerp(0.1, 1, P.clamp(p * 1.2, 0, 1)).toFixed(3));
  });
  const kp = P.easeOutCubic(P.invLerp(0.7, 3.3, localT));
  refs.hmStreak.textContent = Math.round(28 * kp) + ' 天';
  refs.hmPeak.textContent = (4.2 * kp).toFixed(1) + 'M';
}

function s3RenderHoursAndModels(refs, localT, P) {
  refs.hBars.forEach(function (bar) {
    const hr = Number(bar.dataset.hr);
    const targetH = Number(bar.dataset.h);
    const delay = 0.85 + hr * 0.085;
    const p = P.easeOutBack(P.invLerp(delay, delay + 0.36, localT));
    const curH = Math.max(0, targetH * p);
    bar.setAttribute('height', curH.toFixed(2));
    bar.setAttribute('y', (122 - curH).toFixed(2));
  });
  const pp = P.easeOutBack(P.invLerp(2.8, 3.25, localT));
  refs.personaBadge.style.opacity = P.clamp(pp * 1.3, 0, 1).toFixed(4);
  refs.personaBadge.style.transform = 'scale(' + P.lerp(0.8, 1, pp).toFixed(4) + ')';
  S3_MODELS.forEach(function (m, idx) {
    const p = P.easeOutCubic(P.invLerp(1.25 + idx * 0.25, 3.75 + idx * 0.2, localT));
    refs.mBars[idx].style.width = (m.pct * p).toFixed(2) + '%';
    refs.mVals[idx].textContent = (m.targetM * p).toFixed(1) + 'M · ' + m.cost;
  });
}

function s3Mount(root) {
  const stage = document.createElement('div');
  stage.className = 'sa-stage';
  stage.innerHTML = '<div class="s3-wrap">' + s3BuildHeaderHtml() +
    '<div class="s3-bento">' + s3BuildRoiCardHtml() + s3BuildHeatmapCardHtml() + s3BuildBottomRightCardHtml() +
    '</div></div>';
  root.appendChild(stage);
  _s3Refs = s3CacheRefs(stage);
}

function s3Render(ctx) {
  if (!_s3Refs) return;
  const P = window.Promo;
  const exitScale = 1 - ctx.exit * 0.025;
  _s3Refs.stage.style.transform = 'scale(' + exitScale.toFixed(4) + ')';
  s3RenderCardEntrances(_s3Refs, ctx.localT, P);
  s3RenderRoi(_s3Refs, ctx.localT, P);
  s3RenderHeatmap(_s3Refs, ctx.localT, P);
  s3RenderHoursAndModels(_s3Refs, ctx.localT, P);
}

window.Promo.registerScene({
  id: 'overview',
  index: 3,
  tag: '02 / TREND OVERVIEW',
  start: 13.8,
  end: 22.2,
  mount: s3Mount,
  render: s3Render
});
