/* Scene 5: Local Multi-Tool Radar & Project Cost Attribution (29.8s - 36.2s) */
(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const RADAR_TOOLS = [
    { key: 'claude_code', name: 'Claude Code', sessions: 142, angle: 45, color: '#D97757', pos: 'top' },
    { key: 'cursor', name: 'Cursor', sessions: 94, angle: 135, color: '#38BDF8', pos: 'bottom' },
    { key: 'codex', name: 'Codex', sessions: 86, angle: 225, color: '#10B981', pos: 'bottom' },
    { key: 'gemini_cli', name: 'Gemini CLI', sessions: 64, angle: 315, color: '#60A5FA', pos: 'top' }
  ];

  const PROJECTS = [
    { rank: '#1', name: 'token-usage', tokens: 18.4, usd: 64.20, saved: 31.80, pct: 100, grad: 'linear-gradient(90deg, #2563EB, #60A5FA)' },
    { rank: '#2', name: 'nexus-api', tokens: 12.1, usd: 42.50, saved: 19.40, pct: 66, grad: 'linear-gradient(90deg, #059669, #34D399)' },
    { rank: '#3', name: 'vision-core', tokens: 8.7, usd: 29.80, saved: 14.10, pct: 47, grad: 'linear-gradient(90deg, #D97706, #FBBF24)' },
    { rank: '#4', name: 'edge-gateway', tokens: 5.2, usd: 17.90, saved: 8.20, pct: 28, grad: 'linear-gradient(90deg, #0891B2, #22D3EE)' },
    { rank: '#5', name: 'agent-evals', tokens: 3.4, usd: 11.60, saved: 4.90, pct: 19, grad: 'linear-gradient(90deg, #4F46E5, #818CF8)' }
  ];

  const EXPORTS = [
    { title: 'CSV (UTF-8 BOM)', sub: 'Excel 零乱码账单', color: '#34D399', at: 1.35 },
    { title: 'JSON 账本', sub: 'Schema v2 明细', color: '#60A5FA', at: 1.75 },
    { title: 'Markdown 报告', sub: '100% 脱敏周报', color: '#FBBF24', at: 2.15 }
  ];

  let _refs = null;

  /** 创建 HTML 节点 */
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

  /** 创建 SVG 节点 */
  function svgEl(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    const entries = Object.entries(attrs || {});
    for (let i = 0; i < entries.length; i += 1) {
      node.setAttribute(entries[i][0], String(entries[i][1]));
    }
    return node;
  }

  /** 构建场景头部标题 */
  function buildHeader() {
    const head = el('header', 'sb-header');
    const row = el('div', 'sb-kicker-row');
    const pill = el('span', 'sb-tag-pill blue');
    pill.appendChild(el('span', 'sb-tag-dot'));
    pill.appendChild(el('span', '', '04 / RADAR & BILLING'));
    row.appendChild(pill);
    row.appendChild(el('span', 'sb-meta-note', 'MULTI-TOOL RADAR · WORKSPACE ATTRIBUTION'));
    head.appendChild(row);
    head.appendChild(el('h2', 'sb-h1', '本地多工具雷达 & 项目成本归因账单'));
    head.appendChild(el('p', 'sb-sub', '只读探测全机 AI 编程会话 · 按项目工作区核算成本并一键导出账单'));
    return head;
  }

  /** 绘制极坐标同心圆与十字轴线 */
  function buildRadarSvgGrid() {
    const svg = svgEl('svg', { class: 's5-radar-grid-svg', viewBox: '0 0 560 560' });
    const radii = [74, 130, 186, 244];
    for (let i = 0; i < radii.length; i += 1) {
      svg.appendChild(svgEl('circle', {
        cx: 280, cy: 280, r: radii[i],
        fill: 'none', stroke: 'rgba(148,163,184,0.22)',
        'stroke-width': i === 3 ? 1.5 : 1,
        'stroke-dasharray': i === 2 ? '5 5' : 'none'
      }));
    }
    for (let deg = 0; deg < 180; deg += 45) {
      const rad = (deg * Math.PI) / 180;
      const dx = Math.cos(rad) * 244;
      const dy = Math.sin(rad) * 244;
      svg.appendChild(svgEl('line', {
        x1: (280 - dx).toFixed(1), y1: (280 - dy).toFixed(1),
        x2: (280 + dx).toFixed(1), y2: (280 + dy).toFixed(1),
        stroke: 'rgba(148,163,184,0.14)', 'stroke-width': 1
      }));
    }
    return svg;
  }

  /** 构建中心 Antigravity 雷达核心 */
  function buildRadarCore() {
    const core = el('div', 's5-center-core');
    const ico = el('div', 's5-center-ico');
    ico.innerHTML = window.PromoAssets.getSvg('antigravity', 's5core');
    core.appendChild(ico);
    core.appendChild(el('span', 's5-center-lbl sb-mono', 'ANTIGRAVITY'));
    return core;
  }

  /** 按极坐标方位角创建外部工具节点 */
  function buildRadarNode(tool) {
    const rad = ((tool.angle - 90) * Math.PI) / 180;
    const x = 280 + 186 * Math.cos(rad);
    const y = 280 + 186 * Math.sin(rad);
    const wrap = el('div', 's5-node');
    wrap.style.left = x.toFixed(1) + 'px';
    wrap.style.top = y.toFixed(1) + 'px';
    const ring = el('div', 's5-node-ring');
    ring.style.borderColor = tool.color;
    const badge = el('div', 's5-node-badge');
    const ico = el('div', 's5-node-ico');
    ico.innerHTML = window.PromoAssets.getSvg(tool.key, 's5_' + tool.key);
    badge.appendChild(ico);
    const bubble = el('div', 's5-node-bubble ' + tool.pos);
    bubble.appendChild(el('span', 's5-node-name', tool.name));
    bubble.appendChild(el('span', 's5-node-cnt sb-mono', tool.sessions + ' sessions'));
    wrap.appendChild(ring);
    wrap.appendChild(badge);
    wrap.appendChild(bubble);
    return { wrap, ring, badge, bubble, tool };
  }

  /** 构建左侧 360° 声纳多工具雷达面板 */
  function buildLeftRadarPanel() {
    const panel = el('div', 'sb-glass s5-radar-panel');
    const head = el('div', 'sb-panel-head');
    head.appendChild(el('div', 'sb-panel-title', '📡 360° 本地多工具声纳雷达'));
    const totalChip = el('span', 'sb-chip emerald sb-mono', '386 EXTERNAL SESSIONS');
    head.appendChild(totalChip);
    panel.appendChild(head);
    const stage = el('div', 's5-radar-stage');
    stage.appendChild(buildRadarSvgGrid());
    const sweep = el('div', 's5-radar-sweep');
    const beam = el('div', 's5-radar-beam');
    stage.appendChild(sweep);
    stage.appendChild(beam);
    const core = buildRadarCore();
    stage.appendChild(core);
    const nodes = RADAR_TOOLS.map((t) => {
      const built = buildRadarNode(t);
      stage.appendChild(built.wrap);
      return built;
    });
    panel.appendChild(stage);
    panel.appendChild(el('div', 's5-radar-foot', '🔒 只读计数探测 · 绝不读取第三方对话内容 · 60s 轻量缓存'));
    return { panel, sweep, beam, core, nodes };
  }

  /** 构建单个项目成本归因条 */
  function buildProjectRow(proj) {
    const row = el('div', 's5-proj-row');
    const top = el('div', 's5-proj-top');
    const nameWrap = el('div', 's5-proj-name');
    nameWrap.appendChild(el('span', 's5-proj-rank sb-mono', proj.rank));
    nameWrap.appendChild(el('span', 'sb-mono', proj.name));
    top.appendChild(nameWrap);
    const stats = el('div', 's5-proj-stats sb-mono');
    const tokSpan = el('span', '', '0.0M');
    const usdSpan = el('span', 's5-proj-usd', '$0.00');
    const savSpan = el('span', 's5-proj-saved', '省 $0.00');
    stats.appendChild(tokSpan);
    stats.appendChild(usdSpan);
    stats.appendChild(savSpan);
    top.appendChild(stats);
    row.appendChild(top);
    const track = el('div', 's5-proj-track');
    const fill = el('div', 's5-proj-fill');
    fill.style.background = proj.grad;
    track.appendChild(fill);
    row.appendChild(track);
    return { row, tokSpan, usdSpan, savSpan, fill, proj };
  }

  /** 构建右侧项目成本排行与账单导出面板 */
  function buildRightPanels() {
    const col = el('div', 's5-right-col');
    const attr = el('div', 'sb-glass s5-attr-panel');
    const attrHead = el('div', 'sb-panel-head');
    attrHead.appendChild(el('div', 'sb-panel-title', '📁 项目成本归因 Top 5'));
    attrHead.appendChild(el('span', 'sb-chip blue sb-mono', 'TOTAL $166.00'));
    attr.appendChild(attrHead);
    const list = el('div', 's5-proj-list');
    const projRows = PROJECTS.map((p) => {
      const built = buildProjectRow(p);
      list.appendChild(built.row);
      return built;
    });
    attr.appendChild(list);
    col.appendChild(attr);
    const exp = buildExportPanel();
    col.appendChild(exp.panel);
    return { col, attr, projRows, exp };
  }

  /** 构建右下角账单导出胶囊卡片 */
  function buildExportPanel() {
    const panel = el('div', 'sb-glass s5-export-panel');
    const head = el('div', 'sb-panel-head');
    head.appendChild(el('div', 'sb-panel-title', '📦 一键账单导出 · LOCAL LEDGER'));
    head.appendChild(el('span', 'sb-chip amber sb-mono', 'ZERO DIALOG'));
    panel.appendChild(head);
    const pillsRow = el('div', 's5-export-pills');
    const expCards = EXPORTS.map((item) => {
      const box = el('div', 's5-exp-pill');
      box.appendChild(el('span', 's5-exp-title sb-mono', item.title));
      box.appendChild(el('span', 's5-exp-sub', item.sub));
      pillsRow.appendChild(box);
      return { box, item };
    });
    panel.appendChild(pillsRow);
    const toast = el('div', 's5-export-toast');
    toast.appendChild(el('span', 's5-toast-main', '✓ 已自动写入 ~/Downloads'));
    toast.appendChild(el('span', 's5-toast-sub sb-mono', 'token-usage-ledger-2026-11.csv'));
    panel.appendChild(toast);
    return { panel, expCards, toast };
  }

  /** 挂载 Scene 5 DOM 并缓存元素引用 */
  function mount(rootEl) {
    const stage = el('div', 'sb-stage');
    const header = buildHeader();
    const grid = el('div', 's5-grid');
    const left = buildLeftRadarPanel();
    const right = buildRightPanels();
    grid.appendChild(left.panel);
    grid.appendChild(right.col);
    stage.appendChild(header);
    stage.appendChild(grid);
    rootEl.appendChild(stage);
    _refs = { header, left, right };
  }

  /** 更新单个雷达节点的扫描唤醒与气泡弹出 */
  function updateRadarNode(node, beamDeg) {
    const P = window.Promo;
    const hit = beamDeg >= node.tool.angle ? 1 : 0;
    const wake = ((beamDeg - node.tool.angle) % 360 + 360) % 360;
    const ping = hit * Math.exp(-wake / 34);
    const scale = 0.9 + hit * (0.1 + ping * 0.22);
    const shadows = ['0 8px 20px rgba(2,6,23,0.6)', '0 0 ' + (18 + ping * 24).toFixed(0) + 'px ' + node.tool.color + '66'];
    node.badge.style.transform = 'scale(' + scale.toFixed(4) + ')';
    node.badge.style.borderColor = ['rgba(148,163,184,0.28)', node.tool.color][hit];
    node.badge.style.boxShadow = shadows[hit];
    node.ring.style.opacity = (ping * 0.85).toFixed(3);
    node.ring.style.transform = 'scale(' + (1 + (1 - ping) * 0.65).toFixed(3) + ')';
    const bOp = 0.18 + hit * P.clamp(0.82 - wake / 2000, 0.68, 0.82);
    node.bubble.style.opacity = bOp.toFixed(3);
    node.bubble.style.transform = 'translateX(-50%) translateY(' + (8 * (1 - hit) - ping * 4).toFixed(1) + 'px)';
  }

  /** 更新雷达旋转扫描扇区与中心脉冲 */
  function updateLeftRadar(left, ctx) {
    const P = window.Promo;
    const u = P.invLerp(0.15, 5.65, ctx.localT);
    const eased = 0.72 * u + 0.28 * P.easeOutCubic(u);
    const beamDeg = P.lerp(-10, 530, eased);
    left.sweep.style.transform = 'rotate(' + beamDeg.toFixed(2) + 'deg)';
    left.beam.style.transform = 'rotate(' + beamDeg.toFixed(2) + 'deg)';
    const coreScale = 1 + ctx.beat * 0.06;
    left.core.style.transform = 'scale(' + coreScale.toFixed(4) + ')';
    for (let i = 0; i < left.nodes.length; i += 1) {
      updateRadarNode(left.nodes[i], beamDeg);
    }
  }

  /** 更新右侧项目成本归因柱状条与滚动数字 */
  function updateProjects(rows, localT) {
    const P = window.Promo;
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      const prog = P.easeOutCubic(P.invLerp(0.3 + i * 0.16, 1.55 + i * 0.16, localT));
      r.fill.style.width = (r.proj.pct * prog).toFixed(1) + '%';
      r.tokSpan.textContent = (r.proj.tokens * prog).toFixed(1) + 'M';
      r.usdSpan.textContent = P.fmtUsd(r.proj.usd * prog);
      r.savSpan.textContent = '省 ' + P.fmtUsd(r.proj.saved * prog);
    }
  }

  /** 更新导出格式胶囊点亮与写入成功提示 */
  function updateExports(exp, ctx) {
    const P = window.Promo;
    for (let i = 0; i < exp.expCards.length; i += 1) {
      const card = exp.expCards[i];
      const lit = P.easeOutBack(P.invLerp(card.item.at, card.item.at + 0.4, ctx.localT));
      card.box.style.borderColor = lit > 0.5 ? card.item.color : 'rgba(148,163,184,0.22)';
      card.box.style.background = lit > 0.5 ? 'rgba(16,32,64,0.92)' : 'rgba(15,23,42,0.8)';
      card.box.style.transform = 'translateY(' + ((1 - lit) * 10).toFixed(1) + 'px) scale(' + (0.96 + lit * 0.04).toFixed(4) + ')';
    }
    const toastProg = P.easeOutCubic(P.invLerp(2.35, 2.85, ctx.localT));
    exp.toast.style.opacity = toastProg.toFixed(3);
    exp.toast.style.transform = 'translateY(' + ((1 - toastProg) * 14).toFixed(1) + 'px)';
  }

  /** 确定性渲染帧状态 */
  function render(ctx) {
    if (!_refs) {
      return;
    }
    const P = window.Promo;
    const headIn = P.easeOutCubic(P.invLerp(0, 0.5, ctx.localT));
    _refs.header.style.opacity = headIn.toFixed(3);
    _refs.header.style.transform = 'translateY(' + ((1 - headIn) * 18).toFixed(1) + 'px)';
    updateLeftRadar(_refs.left, ctx);
    updateProjects(_refs.right.projRows, ctx.localT);
    updateExports(_refs.right.exp, ctx);
  }

  window.Promo.registerScene({
    id: 'radar',
    index: 5,
    tag: '04 / RADAR & BILLING',
    start: 29.8,
    end: 36.2,
    mount,
    render
  });
})();
