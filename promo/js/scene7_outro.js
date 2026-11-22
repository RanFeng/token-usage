/* Scene 7: Grand Finale Convergence & Launch Outro (41.8s - 48.0s) */
(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const STREAMS = [
    { d: 'M 20 150 C 360 150, 620 270, 960 352', color: '#3B82F6', speed: 1.0, len: 230 },
    { d: 'M 20 530 C 360 510, 640 385, 960 352', color: '#10B981', speed: 1.15, len: 250 },
    { d: 'M 20 890 C 390 800, 660 460, 960 352', color: '#F59E0B', speed: 0.92, len: 210 },
    { d: 'M 1900 150 C 1560 150, 1300 270, 960 352', color: '#60A5FA', speed: 1.05, len: 230 },
    { d: 'M 1900 530 C 1560 510, 1280 385, 960 352', color: '#34D399', speed: 1.18, len: 250 },
    { d: 'M 1900 890 C 1530 800, 1260 460, 960 352', color: '#FBBF24', speed: 0.96, len: 210 }
  ];

  const RING_SPECS = [
    { r: 112, color: '#3B82F6', dash: '140 50 48 50', width: 2.4, speed: 24 },
    { r: 96, color: '#10B981', dash: '110 42 36 42', width: 2.2, speed: -18 },
    { r: 80, color: '#F59E0B', dash: '90 36 28 36', width: 2.0, speed: 30 }
  ];

  const TRUST_BADGES = [
    { label: '⚡ 实时透视', border: 'rgba(59, 130, 246, 0.5)' },
    { label: '💳 ROI 看板', border: 'rgba(245, 158, 11, 0.5)' },
    { label: '🔒 本地 DLP', border: 'rgba(16, 185, 129, 0.5)' },
    { label: '🧩 零依赖开源', border: 'rgba(34, 211, 238, 0.5)' }
  ];

  let _refs = null;

  /** 创建 HTML 元素 */
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) {
      node.className = cls;
    }
    if (text !== undefined) {
      node.textContent = text;
    }
    return node;
  }

  /** 创建 SVG 元素 */
  function svgEl(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    const entries = Object.entries(attrs || {});
    for (let i = 0; i < entries.length; i += 1) {
      node.setAttribute(entries[i][0], String(entries[i][1]));
    }
    return node;
  }

  /** 添加渐变色标列表 */
  function appendStops(grad, stops) {
    for (let i = 0; i < stops.length; i += 1) {
      grad.appendChild(svgEl('stop', { offset: stops[i][0], 'stop-color': stops[i][1] }));
    }
    return grad;
  }

  /** 构建能量光流边缘与中心星环径向渐隐遮罩 */
  function buildStreamDefs() {
    const defs = svgEl('defs', {});
    const edgeGrad = appendStops(svgEl('linearGradient', {
      id: 's7-edge-fade', x1: 0, y1: 0, x2: 1920, y2: 0, gradientUnits: 'userSpaceOnUse'
    }), [['0%', '#000000'], ['9%', '#FFFFFF'], ['91%', '#FFFFFF'], ['100%', '#000000']]);
    const holeGrad = appendStops(svgEl('radialGradient', {
      id: 's7-hole-fade', cx: 960, cy: 352, r: 270, gradientUnits: 'userSpaceOnUse'
    }), [['0%', '#000000'], ['49%', '#000000'], ['100%', '#FFFFFF']]);
    const mask = svgEl('mask', {
      id: 's7-stream-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1920, height: 1080
    });
    mask.appendChild(svgEl('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: 'url(#s7-edge-fade)' }));
    mask.appendChild(svgEl('circle', { cx: 960, cy: 352, r: 270, fill: 'url(#s7-hole-fade)' }));
    defs.appendChild(edgeGrad);
    defs.appendChild(holeGrad);
    defs.appendChild(mask);
    return defs;
  }

  /** 构建三色能量汇聚光流背景 SVG */
  function buildEnergyStreams() {
    const svg = svgEl('svg', { class: 's7-streams-svg', viewBox: '0 0 1920 1080' });
    svg.appendChild(buildStreamDefs());
    const group = svgEl('g', { mask: 'url(#s7-stream-mask)' });
    const pulses = STREAMS.map((spec) => {
      group.appendChild(svgEl('path', {
        d: spec.d, fill: 'none', stroke: spec.color, 'stroke-opacity': 0.14, 'stroke-width': 1.6
      }));
      const aura = svgEl('path', {
        d: spec.d, fill: 'none', stroke: spec.color, 'stroke-width': 6.5,
        'stroke-linecap': 'round', 'stroke-dasharray': spec.len + ' 1300'
      });
      const core = svgEl('path', {
        d: spec.d, fill: 'none', stroke: spec.color, 'stroke-width': 2.3,
        'stroke-linecap': 'round', 'stroke-dasharray': spec.len + ' 1300'
      });
      group.appendChild(aura);
      group.appendChild(core);
      return { aura, core, spec };
    });
    svg.appendChild(group);
    return { svg, pulses };
  }

  /** 构建三层旋转霓虹星环 SVG */
  function buildStarRings() {
    const svg = svgEl('svg', { class: 's7-ring-svg', viewBox: '0 0 244 244' });
    const groups = RING_SPECS.map((spec) => {
      const g = svgEl('g', { transform: 'rotate(0 122 122)' });
      g.appendChild(svgEl('circle', {
        cx: 122, cy: 122, r: spec.r, fill: 'none',
        stroke: spec.color, 'stroke-width': spec.width,
        'stroke-dasharray': spec.dash, 'stroke-linecap': 'round',
        'stroke-opacity': 0.82
      }));
      g.appendChild(svgEl('circle', { cx: 122, cy: 122 - spec.r, r: 4.2, fill: '#F8FAFC' }));
      g.appendChild(svgEl('circle', { cx: 122, cy: 122 + spec.r, r: 3.2, fill: spec.color }));
      svg.appendChild(g);
      return { g, speed: spec.speed };
    });
    return { svg, groups };
  }

  /** 构建中央官方 Logo 与三层星环容器 */
  function buildLogoOrb() {
    const orb = el('div', 's7-orb');
    const glow = el('div', 's7-orb-glow');
    const rings = buildStarRings();
    const core = el('div', 's7-logo-core');
    core.innerHTML = window.PromoAssets.getSvg('logo', 's7');
    orb.appendChild(glow);
    orb.appendChild(rings.svg);
    orb.appendChild(core);
    return { orb, glow, core, ringGroups: rings.groups };
  }

  /** 构建 4 枚信任徽章横排 */
  function buildTrustBadges() {
    const row = el('div', 's7-badges-row');
    const items = TRUST_BADGES.map((b) => {
      const pill = el('div', 's7-trust-badge', b.label);
      pill.style.borderColor = b.border;
      row.appendChild(pill);
      return pill;
    });
    return { row, items };
  }

  /** 构建底部高光 CTA 与仓库地址胶囊 */
  function buildCtaBlock() {
    const cta = el('div', 's7-cta-pill');
    cta.appendChild(el('span', '', '立即启用 token-usage 插件'));
    const sheen = el('div', 's7-cta-sheen');
    cta.appendChild(sheen);
    const repo = el('div', 's7-repo-pill sb-mono', 'github.com/RanFeng/token-usage');
    return { cta, sheen, repo };
  }

  /** 挂载 Scene 7 DOM 并缓存元素引用 */
  function mount(rootEl) {
    const stage = el('div', 'sb-stage');
    const wrap = el('div', 's7-wrap');
    const streams = buildEnergyStreams();
    const hero = el('div', 's7-hero');
    const orb = buildLogoOrb();
    const headline = el('h1', 's7-headline', '掌控你的每一个 Token');
    const subtitle = el('div', 's7-subtitle-row');
    subtitle.appendChild(el('span', '', 'Token Usage'));
    subtitle.appendChild(el('span', 'sb-chip blue sb-mono', 'v1.1.0'));
    subtitle.appendChild(el('span', '', 'for Antigravity'));
    const badges = buildTrustBadges();
    const ctaBlock = buildCtaBlock();
    hero.appendChild(orb.orb);
    hero.appendChild(headline);
    hero.appendChild(subtitle);
    hero.appendChild(badges.row);
    hero.appendChild(ctaBlock.cta);
    hero.appendChild(ctaBlock.repo);
    const curtain = el('div', 's7-curtain');
    wrap.appendChild(streams.svg);
    wrap.appendChild(hero);
    stage.appendChild(wrap);
    stage.appendChild(curtain);
    rootEl.appendChild(stage);
    _refs = { streams: streams.pulses, hero, orb, headline, subtitle, badges: badges.items, ctaBlock, curtain };
  }

  /** 更新中央汇聚能量流光束偏移与柔和辉光 */
  function updateStreams(pulses, ctx) {
    const P = window.Promo;
    const enter = P.easeOutCubic(P.invLerp(0, 1.4, ctx.localT));
    const coreOp = (0.32 + enter * 0.5).toFixed(3);
    const auraOp = (0.1 + enter * 0.14).toFixed(3);
    for (let i = 0; i < pulses.length; i += 1) {
      const item = pulses[i];
      const offset = (1280 - ((ctx.localT * 460 * item.spec.speed) % 1540)).toFixed(1);
      item.core.setAttribute('stroke-dashoffset', offset);
      item.aura.setAttribute('stroke-dashoffset', offset);
      item.core.setAttribute('stroke-opacity', coreOp);
      item.aura.setAttribute('stroke-opacity', auraOp);
    }
  }

  /** 更新 Logo 脉冲缩放与三层霓虹星环旋转 */
  function updateOrbAndRings(orb, ctx) {
    const P = window.Promo;
    const enter = P.easeOutBack(P.invLerp(0.15, 0.95, ctx.localT));
    const beatScale = 1 + ctx.beat * 0.065;
    orb.core.style.transform = 'scale(' + (enter * beatScale).toFixed(4) + ')';
    orb.glow.style.opacity = (0.55 + ctx.beat * 0.35).toFixed(3);
    orb.glow.style.transform = 'scale(' + (0.94 + ctx.beat * 0.14).toFixed(4) + ')';
    for (let i = 0; i < orb.ringGroups.length; i += 1) {
      const rg = orb.ringGroups[i];
      const deg = ctx.localT * rg.speed + i * 35;
      rg.g.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ' 122 122)');
    }
  }

  /** 更新主标题、4 枚信任徽章与 CTA 流光 */
  function updateTypoAndBadges(refs, ctx) {
    const P = window.Promo;
    const titleP = P.easeOutCubic(P.invLerp(0.35, 1.05, ctx.localT));
    refs.headline.style.opacity = titleP.toFixed(3);
    refs.headline.style.transform = 'translateY(' + ((1 - titleP) * 26).toFixed(1) + 'px)';
    const subP = P.easeOutCubic(P.invLerp(0.55, 1.2, ctx.localT));
    refs.subtitle.style.opacity = subP.toFixed(3);
    refs.subtitle.style.transform = 'translateY(' + ((1 - subP) * 18).toFixed(1) + 'px)';
    for (let i = 0; i < refs.badges.length; i += 1) {
      const bp = P.easeOutBack(P.invLerp(0.75 + i * 0.12, 1.25 + i * 0.12, ctx.localT));
      refs.badges[i].style.opacity = P.clamp(bp * 1.4, 0, 1).toFixed(3);
      refs.badges[i].style.transform = 'translateY(' + ((1 - bp) * 20).toFixed(1) + 'px)';
    }
    const ctaP = P.easeOutBack(P.invLerp(1.15, 1.75, ctx.localT));
    refs.ctaBlock.cta.style.opacity = P.clamp(ctaP * 1.4, 0, 1).toFixed(3);
    refs.ctaBlock.cta.style.transform = 'scale(' + (0.88 + ctaP * 0.12).toFixed(4) + ')';
    refs.ctaBlock.repo.style.opacity = P.easeOutCubic(P.invLerp(1.35, 1.9, ctx.localT)).toFixed(3);
    const sheenX = P.lerp(-140, 420, (ctx.localT % 2.4) / 2.4);
    refs.ctaBlock.sheen.style.transform = 'translateX(' + sheenX.toFixed(1) + '%) rotate(24deg)';
  }

  /** 确定性渲染帧状态（含 47.2s-48.0s 戏剧性落幕暗化） */
  function render(ctx) {
    if (!_refs) {
      return;
    }
    const P = window.Promo;
    updateStreams(_refs.streams, ctx);
    updateOrbAndRings(_refs.orb, ctx);
    updateTypoAndBadges(_refs, ctx);
    const curtainT = P.easeInCubic(P.invLerp(47.2, 48.0, ctx.t));
    _refs.curtain.style.opacity = curtainT.toFixed(4);
    _refs.hero.style.transform = 'scale(' + (1 - curtainT * 0.05).toFixed(4) + ')';
  }

  window.Promo.registerScene({
    id: 'outro',
    index: 7,
    tag: '06 / LAUNCH',
    start: 41.8,
    end: 48.0,
    mount,
    render
  });
})();
