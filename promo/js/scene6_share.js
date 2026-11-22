/* Scene 6: 2x Retina Share Cards & /token-usage Chat Skill (35.8s - 42.2s) */
(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PROMPT_TEXT = '/token-usage 统计最近 10 个会话';

  const HM_PALETTE = ['#273449', '#064E3B', '#047857', '#10B981', '#34D399'];

  const DARK_KPIS = [
    ['⚡ 累计消耗', '48.6M', '↑42.1M  ↓6.5M', '#F8FAFC'],
    ['💰 缓存节省', '$78.40', '☕ 15.7 杯咖啡', '#10B981'],
    ['🔥 活跃连击', '28 天', '最长 34 天', '#F59E0B'],
    ['🕒 编程作息', '深夜架构师', '峰值 23:00', '#60A5FA']
  ];

  const LIGHT_KPIS = [
    ['💬 对话轮次', '24', '96 步', '#0F172A'],
    ['⚡ 会话消耗', '318.4K', '↑289.8K  ↓28.6K', '#0F172A'],
    ['🎯 缓存命中率', '89.4%', '命中 259.1K', '#059669'],
    ['💳 参考费用', '$1.92', '已省 $4.82', '#2563EB']
  ];

  const LIGHT_TOOLS = [
    ['run_command', '×42'],
    ['read_file', '×38'],
    ['edit_file', '×19'],
    ['rg_search', '×14']
  ];

  const CHAT_ROWS = [
    ['promo-engine', '24', '142.8K', '259.1K', '28.6K', '171.4K'],
    ['lite-dlp-scan', '18', '96.4K', '184.2K', '19.1K', '115.5K'],
    ['roi-billing-ui', '14', '68.2K', '142.0K', '14.4K', '82.6K'],
    ['multi-radar', '11', '52.0K', '98.5K', '11.2K', '63.2K']
  ];

  const CHAT_MODELS = [
    { name: 'Gemini 4 Hydrogen (Input Blue)', val: '1.84M · 57%', pct: 86, color: '#3B82F6' },
    { name: 'Claude Sonnet 4.6 (Cache Green)', val: '960K · 30%', pct: 58, color: '#10B981' },
    { name: 'GPT-5.3 Codex (Output Amber)', val: '420K · 13%', pct: 32, color: '#F59E0B' }
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

  /** 构建场景顶部标题区 */
  function buildHeader() {
    const head = el('header', 'sb-header');
    const row = el('div', 'sb-kicker-row');
    const pill = el('span', 'sb-tag-pill amber');
    pill.appendChild(el('span', 'sb-tag-dot'));
    pill.appendChild(el('span', '', '05 / SHARE & SKILL'));
    row.appendChild(pill);
    row.appendChild(el('span', 'sb-meta-note', '2× RETINA CANVAS PNG · SLASH SKILL'));
    head.appendChild(row);
    head.appendChild(el('h2', 'sb-h1', '2× 视网膜级战报分享 & /token-usage 对话 Skill'));
    head.appendChild(el('p', 'sb-sub', '100% 本地脱敏战报一键出图 · 对话窗 Slash Skill 随时盘点全景消耗'));
    return head;
  }

  /** 构建分享卡顶部品牌栏 */
  function buildShareCardHead(suffix, showLock) {
    const head = el('div', 's6-card-head');
    const left = el('div', 's6-card-brand');
    const logoBox = el('div', 's6-mini-svg');
    logoBox.innerHTML = window.PromoAssets.getSvg('logo', suffix);
    const agBox = el('div', 's6-mini-svg');
    agBox.innerHTML = window.PromoAssets.getSvg('antigravity', suffix + 'ag');
    left.appendChild(logoBox);
    left.appendChild(el('span', 's6-brand-pill', 'Token Usage'));
    left.appendChild(agBox);
    head.appendChild(left);
    const right = el('div', 's6-card-meta-right');
    if (showLock) {
      right.appendChild(el('span', 's6-lock-pill', '🔒 已脱敏'));
    }
    right.appendChild(el('span', 's6-ver-pill sb-mono', 'v1.1.0'));
    head.appendChild(right);
    return head;
  }

  /** 构建 2×2 KPI 方块网格 */
  function buildKpiGrid(items) {
    const grid = el('div', 's6-kpi-grid');
    for (let i = 0; i < items.length; i += 1) {
      const [lbl, val, sub, color] = items[i];
      const box = el('div', 's6-kpi-box');
      box.appendChild(el('span', 's6-kpi-lbl', lbl));
      const valEl = el('span', 's6-kpi-val sb-mono', val);
      valEl.style.color = color;
      box.appendChild(valEl);
      box.appendChild(el('span', 's6-kpi-sub sb-mono', sub));
      grid.appendChild(box);
    }
    return grid;
  }

  /** 构建 Mini 90 天热力矩阵卡片 */
  function buildMiniHeatmap() {
    const box = el('div', 's6-subcard');
    const head = el('div', 's6-roi-head');
    head.appendChild(el('span', '', '🗓 90 天活跃热力图'));
    head.appendChild(el('span', 'sb-mono', '🔥 28d'));
    box.appendChild(head);
    const wrap = el('div', 's6-hm-wrap');
    const grid = el('div', 's6-hm-grid');
    for (let i = 0; i < 91; i += 1) {
      const cell = el('div', 's6-hm-cell');
      const lvl = (i * 7 + Math.floor(i / 5) * 3) % 5;
      cell.style.background = HM_PALETTE[lvl];
      grid.appendChild(cell);
    }
    wrap.appendChild(grid);
    wrap.appendChild(buildHeatmapSideStats());
    box.appendChild(wrap);
    return box;
  }

  /** 构建热力图右侧统计块 */
  function buildHeatmapSideStats() {
    const side = el('div', 's6-hm-side sb-mono');
    const pairs = [['活跃', '76 / 91'], ['峰值', '4.2M'], ['会话', '312']];
    for (let i = 0; i < pairs.length; i += 1) {
      const row = el('div', 's6-hm-stat-row');
      row.appendChild(el('span', '', pairs[i][0]));
      row.appendChild(el('span', '', pairs[i][1]));
      side.appendChild(row);
    }
    return side;
  }

  /** 构建深色主题趋势总览战报卡 */
  function buildOverviewShareCard() {
    const card = el('div', 's6-share-card dark');
    card.appendChild(el('div', 's6-card-topbar'));
    card.appendChild(buildShareCardHead('s6a', false));
    card.appendChild(buildRoiSubcard());
    card.appendChild(buildKpiGrid(DARK_KPIS));
    card.appendChild(buildMiniHeatmap());
    card.appendChild(el('div', 's6-card-foot sb-mono', 'Token Usage v1.1.0 · 趋势总览战报卡'));
    const sheen = buildSheenOverlay();
    card.appendChild(sheen.layer);
    return { card, beam: sheen.beam };
  }

  /** 构建战报卡内 ROI 进度子卡 */
  function buildRoiSubcard() {
    const sub = el('div', 's6-subcard');
    const head = el('div', 's6-roi-head');
    head.appendChild(el('span', '', '💳 订阅回本 ROI'));
    head.appendChild(el('span', 's6-amber-badge sb-mono', '🏆 7.4× ROI'));
    sub.appendChild(head);
    const amt = el('div', 's6-roi-amt');
    amt.appendChild(el('span', 's6-roi-big sb-mono', '$148.60'));
    amt.appendChild(el('span', 's6-kpi-sub sb-mono', '/ $20 · 本月 48.6M'));
    sub.appendChild(amt);
    const track = el('div', 's6-roi-track');
    track.appendChild(el('div', 's6-roi-fill'));
    sub.appendChild(track);
    return sub;
  }

  /** 构建浅色卡内 SVG 上下文曲率与 Compact 红点 */
  function buildMiniCurveSubcard() {
    const sub = el('div', 's6-subcard');
    const head = el('div', 's6-roi-head');
    head.appendChild(el('span', '', '📈 上下文增长曲线'));
    const pk = el('span', 'sb-mono', '峰值 184K · Compact ×1');
    pk.style.color = '#DC2626';
    head.appendChild(pk);
    sub.appendChild(head);
    const svg = svgEl('svg', { class: 's6-curve-svg', viewBox: '0 0 330 82' });
    svg.appendChild(svgEl('path', {
      d: 'M 4 74 L 58 60 L 116 44 L 176 16 L 204 54 L 266 36 L 324 14 L 324 78 L 4 78 Z',
      fill: 'rgba(37, 99, 235, 0.16)'
    }));
    svg.appendChild(svgEl('path', {
      d: 'M 4 74 L 58 60 L 116 44 L 176 16 L 204 54 L 266 36 L 324 14',
      fill: 'none', stroke: '#2563EB', 'stroke-width': 2.5, 'stroke-linejoin': 'round'
    }));
    svg.appendChild(svgEl('circle', { cx: 176, cy: 16, r: 5, fill: '#DC2626', stroke: '#FFFFFF', 'stroke-width': 1.8 }));
    sub.appendChild(svg);
    return sub;
  }

  /** 构建浅色卡内脱敏诊断标签与高频工具 */
  function buildDiagSubcard() {
    const sub = el('div', 's6-subcard');
    const tags = el('div', 's6-diag-tags sb-mono');
    const defs = [
      ['Peak 92%', 'rgba(220,38,38,0.14)', '#DC2626'],
      ['Compact ×1', 'rgba(217,119,6,0.14)', '#D97706'],
      ['DLP 100% Masked', 'rgba(5,150,105,0.14)', '#059669']
    ];
    for (let i = 0; i < defs.length; i += 1) {
      const t = el('span', 's6-diag-tag', defs[i][0]);
      t.style.background = defs[i][1];
      t.style.color = defs[i][2];
      tags.appendChild(t);
    }
    sub.appendChild(tags);
    const tGrid = el('div', 's6-tool-grid sb-mono');
    for (let j = 0; j < LIGHT_TOOLS.length; j += 1) {
      const tile = el('div', 's6-tool-tile');
      tile.appendChild(el('span', '', LIGHT_TOOLS[j][0]));
      tile.appendChild(el('span', '', LIGHT_TOOLS[j][1]));
      tGrid.appendChild(tile);
    }
    sub.appendChild(tGrid);
    return sub;
  }

  /** 构建浅色主题 100% 脱敏单会话诊断卡 */
  function buildSessionShareCard() {
    const card = el('div', 's6-share-card light');
    card.appendChild(el('div', 's6-card-topbar'));
    card.appendChild(buildShareCardHead('s6b', true));
    card.appendChild(buildKpiGrid(LIGHT_KPIS));
    card.appendChild(buildMiniCurveSubcard());
    card.appendChild(buildDiagSubcard());
    card.appendChild(el('div', 's6-card-foot sb-mono', '100% Desensitized · 单会话诊断卡'));
    const sheen = buildSheenOverlay();
    card.appendChild(sheen.layer);
    return { card, beam: sheen.beam };
  }

  /** 构建 45° 镜面流光遮罩层 */
  function buildSheenOverlay() {
    const layer = el('div', 's6-sheen-layer');
    const beam = el('div', 's6-sheen-beam');
    layer.appendChild(beam);
    return { layer, beam };
  }

  /** 构建左侧 3D 扇形分享卡舞台 */
  function buildLeftFanStage() {
    const panel = el('div', 'sb-glass s6-fan-stage');
    const top = el('div', 's6-spec-row');
    top.appendChild(el('div', 'sb-panel-title', '🎨 2× Canvas 分享图矩阵'));
    const badges = el('div', 's6-spec-badges');
    badges.appendChild(el('span', 'sb-chip blue', '2× Retina PNG'));
    badges.appendChild(el('span', 'sb-chip emerald', '🔒 100% 脱敏'));
    badges.appendChild(el('span', 'sb-chip amber', '深浅双主题'));
    top.appendChild(badges);
    panel.appendChild(top);
    const arena = el('div', 's6-cards-arena');
    const cardA = buildOverviewShareCard();
    const cardB = buildSessionShareCard();
    arena.appendChild(cardA.card);
    arena.appendChild(cardB.card);
    panel.appendChild(arena);
    return { panel, cardA, cardB };
  }

  /** 构建 Markdown 会话统计表 */
  function buildMarkdownTable() {
    const table = el('table', 's6-md-table sb-mono');
    const thead = el('thead');
    const hr = el('tr');
    const cols = ['Session', 'Turns', 'Input', 'Cache', 'Output', 'Total'];
    for (let i = 0; i < cols.length; i += 1) {
      hr.appendChild(el('th', i > 0 ? 'num' : '', cols[i]));
    }
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = el('tbody');
    const trNodes = CHAT_ROWS.map((row) => {
      const tr = el('tr');
      for (let j = 0; j < row.length; j += 1) {
        tr.appendChild(el('td', j > 0 ? 'num' : '', row[j]));
      }
      tbody.appendChild(tr);
      return tr;
    });
    table.appendChild(tbody);
    return { table, trNodes };
  }

  /** 构建右侧 Antigravity 聊天窗口与 /token-usage Skill 演示 */
  function buildRightChatWindow() {
    const win = el('div', 'sb-glass s6-chat-window');
    const head = el('div', 'sb-panel-head');
    const titleWrap = el('div', 'sb-panel-title');
    const agIco = el('div', 's6-mini-svg');
    agIco.innerHTML = window.PromoAssets.getSvg('antigravity', 's6chat');
    titleWrap.appendChild(agIco);
    titleWrap.appendChild(el('span', '', 'Antigravity Chat · 对话内 Skill'));
    head.appendChild(titleWrap);
    head.appendChild(el('span', 'sb-chip blue sb-mono', '/token-usage'));
    win.appendChild(head);
    const body = buildChatBody();
    win.appendChild(body.wrap);
    return { win, body };
  }

  /** 构建聊天气泡与 AI 结构化回复体 */
  function buildChatBody() {
    const wrap = el('div', 's6-chat-body');
    const userBubble = el('div', 's6-user-bubble sb-mono');
    const typed = el('span', '', '');
    const cursor = el('span', 's6-cursor');
    userBubble.appendChild(typed);
    userBubble.appendChild(cursor);
    wrap.appendChild(userBubble);
    const ai = el('div', 's6-ai-bubble');
    const cmdBar = el('div', 's6-cmd-bar sb-mono', '⚡ python3 token_stats.py summary --limit 10');
    ai.appendChild(cmdBar);
    const tbl = buildMarkdownTable();
    ai.appendChild(tbl.table);
    const barsWrap = el('div', 's6-model-bars');
    const modelBars = CHAT_MODELS.map((m) => {
      const r = buildModelFillRow(m);
      barsWrap.appendChild(r.row);
      return r;
    });
    ai.appendChild(barsWrap);
    const foot = el('div', 's6-synergy-foot', '✓ 侧边栏图形面板 + 对话内 /token-usage Skill 双剑合璧');
    ai.appendChild(foot);
    wrap.appendChild(ai);
    return { wrap, typed, cursor, ai, cmdBar, rows: tbl.trNodes, modelBars, foot };
  }

  /** 构建单行三色模型消耗条 */
  function buildModelFillRow(m) {
    const row = el('div', 's6-model-row');
    const meta = el('div', 's6-model-meta sb-mono');
    meta.appendChild(el('span', '', m.name));
    meta.appendChild(el('span', '', m.val));
    row.appendChild(meta);
    const track = el('div', 's6-model-track');
    const fill = el('div', 's6-model-fill');
    fill.style.background = m.color;
    track.appendChild(fill);
    row.appendChild(track);
    return { row, fill, pct: m.pct };
  }

  /** 挂载 Scene 6 DOM 并缓存元素引用 */
  function mount(rootEl) {
    const stage = el('div', 'sb-stage');
    const header = buildHeader();
    const grid = el('div', 's6-grid');
    const left = buildLeftFanStage();
    const right = buildRightChatWindow();
    grid.appendChild(left.panel);
    grid.appendChild(right.win);
    stage.appendChild(header);
    stage.appendChild(grid);
    rootEl.appendChild(stage);
    _refs = { header, left, right };
  }

  /** 更新左侧 3D 扇形分享卡与 45° 高光流光 */
  function updateFanCards(left, ctx) {
    const P = window.Promo;
    const enterA = P.easeOutBack(P.invLerp(0.15, 0.9, ctx.localT));
    const enterB = P.easeOutBack(P.invLerp(0.35, 1.1, ctx.localT));
    const sway = Math.sin(ctx.localT * 1.6);
    left.cardA.card.style.opacity = P.clamp(enterA * 1.4, 0, 1).toFixed(3);
    left.cardA.card.style.transform = 'perspective(1200px) rotateY(' + (11 + sway * 2).toFixed(2)
      + 'deg) rotateZ(-3deg) translateY(' + ((1 - enterA) * 32).toFixed(1) + 'px) scale(' + (0.91 + enterA * 0.05).toFixed(4) + ')';
    left.cardB.card.style.opacity = P.clamp(enterB * 1.4, 0, 1).toFixed(3);
    left.cardB.card.style.transform = 'perspective(1200px) rotateY(' + (-10 - sway * 2).toFixed(2)
      + 'deg) rotateZ(2.5deg) translateY(' + ((1 - enterB) * 36).toFixed(1) + 'px) scale(' + (0.94 + enterB * 0.05).toFixed(4) + ')';
    const sheenU = P.invLerp(1.1, 4.4, ctx.localT);
    const sheenX = P.lerp(-160, 480, P.easeInOutQuart(sheenU));
    left.cardA.beam.style.transform = 'translateX(' + sheenX.toFixed(1) + '%) rotate(28deg)';
    left.cardB.beam.style.transform = 'translateX(' + (sheenX - 24).toFixed(1) + '%) rotate(28deg)';
  }

  /** 更新右侧对话打字机、Markdown 表格与三色模型消耗条 */
  function updateChatSkill(body, ctx) {
    const P = window.Promo;
    const typeProg = P.invLerp(0.2, 1.55, ctx.localT);
    const charCount = Math.round(PROMPT_TEXT.length * typeProg);
    body.typed.textContent = PROMPT_TEXT.slice(0, charCount);
    const blink = Math.floor(ctx.localT * 3.6) % 2;
    body.cursor.style.opacity = typeProg < 1 ? '1' : String(blink);
    const aiIn = P.easeOutCubic(P.invLerp(1.55, 2.0, ctx.localT));
    body.ai.style.opacity = aiIn.toFixed(3);
    body.ai.style.transform = 'translateY(' + ((1 - aiIn) * 16).toFixed(1) + 'px)';
    updateChatTableAndBars(body, ctx.localT);
  }

  /** 更新表格逐行展开与模型进度条宽度 */
  function updateChatTableAndBars(body, localT) {
    const P = window.Promo;
    for (let i = 0; i < body.rows.length; i += 1) {
      const rOp = P.easeOutCubic(P.invLerp(1.72 + i * 0.16, 2.02 + i * 0.16, localT));
      body.rows[i].style.opacity = rOp.toFixed(3);
    }
    for (let j = 0; j < body.modelBars.length; j += 1) {
      const bar = body.modelBars[j];
      const fillProg = P.easeOutCubic(P.invLerp(2.15 + j * 0.18, 3.25 + j * 0.18, localT));
      bar.fill.style.width = (bar.pct * fillProg).toFixed(1) + '%';
    }
    body.foot.style.opacity = P.easeOutCubic(P.invLerp(2.5, 3.0, localT)).toFixed(3);
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
    updateFanCards(_refs.left, ctx);
    updateChatSkill(_refs.right.body, ctx);
  }

  window.Promo.registerScene({
    id: 'share',
    index: 6,
    tag: '05 / SHARE & SKILL',
    start: 35.8,
    end: 42.2,
    mount,
    render
  });
})();
