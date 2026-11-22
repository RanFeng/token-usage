/* Scene 4: Live Health Diagnostics & 100% Local Lite DLP (21.8s - 30.2s) */
(() => {
  const DIAG_ENGINES = [
    {
      level: 'danger',
      title: '临近 Compact ≥90%',
      badge: 'DANGER · 92.4%',
      desc: '上下文窗口已达 92.4%（184.8K / 200K），即将触发自动压缩，建议适时新开会话',
      pct: 92.4,
      meterText: '92.4% 水位'
    },
    {
      level: 'danger',
      title: '连续报错空转拦截',
      badge: 'Turn #14 · 3 Errors',
      desc: '第 14 轮连续出现 3 次工具报错，实时拦截重复试错导致的无效 Token 空转',
      pct: 86,
      meterText: '拦截 ~48.2K'
    },
    {
      level: 'warn',
      title: '单轮 Token 4.2× 激增预警',
      badge: 'WARN · 4.2× AVG',
      desc: '第 11 轮单轮消耗 118.4K（均值 4.2×），提示检查大文件读取或超长工具返回',
      pct: 78,
      meterText: '118.4K 峰值'
    },
    {
      level: 'warn',
      title: '缓存命中率偏低诊断',
      badge: 'WARN · 18.6% HIT',
      desc: '当前会话前缀缓存命中率低于阈值，建议稳定系统提示词以降低重复输入成本',
      pct: 18.6,
      meterText: '18.6% 命中'
    }
  ];

  const DLP_SAMPLES = [
    {
      turn: 4,
      source: 'Tool Args · API Key',
      prefix: 'curl -H "Authorization: Bearer ',
      raw: 'sk-proj-9K8xDemoKey000x9A',
      masked: 'sk-p***x9A',
      suffix: '" https://api.example.test',
      threshold: 0.22
    },
    {
      turn: 9,
      source: 'User Prompt · AWS Key',
      prefix: 'export AWS_ACCESS_KEY_ID="',
      raw: 'AKIAIOSFODNN7DEMO7Q2',
      masked: 'AKIA***7Q2',
      suffix: '" # demo fixture',
      threshold: 0.52
    },
    {
      turn: 14,
      source: 'Tool Output · GitHub',
      prefix: 'git push https://',
      raw: 'ghp_R8mK2pDemoToken4mK',
      masked: 'ghp_***4mK',
      suffix: '@github.com/demo/repo',
      threshold: 0.78
    }
  ];

  const RULE_CHIPS = ['API Key', 'AWS', 'GitHub', 'Google', 'JWT', '私钥', 'DB URI'];

  let _refs = null;

  /** 创建带类名与文本的 DOM 节点 */
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

  /** 构建场景头部标题区 */
  function buildHeader() {
    const head = el('header', 'sb-header');
    const row = el('div', 'sb-kicker-row');
    const pill = el('span', 'sb-tag-pill');
    pill.appendChild(el('span', 'sb-tag-dot'));
    pill.appendChild(el('span', '', '03 / HEALTH & LITE DLP'));
    row.appendChild(pill);
    row.appendChild(el('span', 'sb-meta-note', '4 DIAGNOSTIC ENGINES · 7 LOCAL REGEX RULES'));
    head.appendChild(row);
    head.appendChild(el('h2', 'sb-h1', '实时会话健康诊断 & 100% 本地 Lite DLP'));
    head.appendChild(el('p', 'sb-sub', '实时拦截高危上下文与空转烧钱 · 本地正则瞬时脱敏绝不上传原值'));
    return head;
  }

  /** 构建单条诊断告警卡 */
  function buildDiagCard(item) {
    const card = el('div', 's4-diag-card ' + item.level);
    card.appendChild(el('div', 's4-diag-rail'));
    const top = el('div', 's4-diag-top');
    const titleWrap = el('div', 's4-diag-title-wrap');
    const dot = el('span', 's4-diag-dot');
    titleWrap.appendChild(dot);
    titleWrap.appendChild(el('span', 's4-diag-title', item.title));
    top.appendChild(titleWrap);
    top.appendChild(el('span', 'sb-chip ' + item.level, item.badge));
    card.appendChild(top);
    card.appendChild(el('div', 's4-diag-desc', item.desc));
    const meter = el('div', 's4-diag-meter-row');
    const track = el('div', 's4-meter-track');
    const fill = el('div', 's4-meter-fill ' + item.level);
    fill.style.width = item.pct + '%';
    track.appendChild(fill);
    meter.appendChild(track);
    meter.appendChild(el('span', 's4-meter-val sb-mono', item.meterText));
    card.appendChild(meter);
    return { card, dot, fill, level: item.level, pct: item.pct };
  }

  /** 构建左侧 4 引擎诊断面板 */
  function buildLeftPanel() {
    const panel = el('div', 'sb-glass s4-panel');
    const head = el('div', 'sb-panel-head');
    head.appendChild(el('div', 'sb-panel-title', '🩺 实时健康诊断引擎'));
    head.appendChild(el('span', 'sb-chip danger', '4 / 4 ALERTS'));
    panel.appendChild(head);
    const list = el('div', 's4-diag-list');
    const cards = DIAG_ENGINES.map((item) => {
      const built = buildDiagCard(item);
      list.appendChild(built.card);
      return built;
    });
    panel.appendChild(list);
    return { panel, cards };
  }

  /** 构建单条 DLP 演示日志行 */
  function buildLogRow(sample) {
    const row = el('div', 's4-log-row');
    const head = el('div', 's4-log-head');
    const meta = el('div', 's4-log-meta');
    meta.appendChild(el('span', 's4-turn-tag sb-mono', 'Turn #' + sample.turn));
    meta.appendChild(el('span', 's4-rule-tag sb-mono', sample.source));
    head.appendChild(meta);
    const jump = el('span', 's4-jump-tag', '一键跳转 Turn #' + sample.turn + ' ↗');
    head.appendChild(jump);
    row.appendChild(head);
    const line = el('div', 's4-code-line sb-mono');
    line.appendChild(el('span', 's4-code-frag', sample.prefix));
    const secret = el('span', 's4-secret-pill exposed', sample.raw);
    line.appendChild(secret);
    line.appendChild(el('span', 's4-code-frag', sample.suffix));
    row.appendChild(line);
    return { row, secret, jump, sample };
  }

  /** 构建激光扫描线 DOM */
  function buildLaser() {
    const wrap = el('div', 's4-laser-wrap');
    wrap.appendChild(el('div', 's4-laser-trail'));
    wrap.appendChild(el('div', 's4-laser-beam'));
    return wrap;
  }

  /** 构建底部护盾认证栏 */
  function buildShieldBar() {
    const bar = el('div', 's4-shield-bar');
    bar.appendChild(el('span', 's4-shield-main', '🔒 7 类敏感凭证本地扫描 · 原值零存储 · 零上传'));
    const chips = el('div', 's4-rule-pills');
    const chipNodes = RULE_CHIPS.map((label) => {
      const c = el('span', 's4-rule-mini sb-mono', label);
      chips.appendChild(c);
      return c;
    });
    bar.appendChild(chips);
    return { bar, chipNodes };
  }

  /** 构建右侧 Lite DLP 扫描舱 */
  function buildRightPanel() {
    const panel = el('div', 'sb-glass s4-panel');
    const head = el('div', 'sb-panel-head');
    head.appendChild(el('div', 'sb-panel-title', '🛡️ Lite DLP 本地正则激光扫描舱'));
    const statusChip = el('span', 'sb-chip danger sb-mono', 'SCANNING · 0/3');
    head.appendChild(statusChip);
    panel.appendChild(head);
    const notice = el('div', 's4-demo-notice');
    notice.appendChild(el('span', '', '⚠ 演示日志仅展示合成脱敏样本（Synthetic Demo Fixture）'));
    notice.appendChild(el('span', 'sb-mono', 'SHA-256 DEDUPE'));
    panel.appendChild(notice);
    const chamber = el('div', 's4-scan-chamber');
    chamber.appendChild(el('div', 's4-scan-grid-bg'));
    const rows = DLP_SAMPLES.map((s) => {
      const built = buildLogRow(s);
      chamber.appendChild(built.row);
      return built;
    });
    const laser = buildLaser();
    chamber.appendChild(laser);
    panel.appendChild(chamber);
    const shield = buildShieldBar();
    panel.appendChild(shield.bar);
    return { panel, statusChip, chamber, rows, laser, shieldBar: shield.bar, ruleChips: shield.chipNodes };
  }

  /** 挂载 Scene 4 DOM 并缓存引用 */
  function mount(rootEl) {
    const stage = el('div', 'sb-stage');
    const header = buildHeader();
    const grid = el('div', 's4-grid');
    const left = buildLeftPanel();
    const right = buildRightPanel();
    grid.appendChild(left.panel);
    grid.appendChild(right.panel);
    stage.appendChild(header);
    stage.appendChild(grid);
    rootEl.appendChild(stage);
    _refs = { header, left, right };
  }

  /** 更新左侧 4 引擎告警卡弹入与脉冲呼吸 */
  function updateDiagCards(cards, ctx) {
    const P = window.Promo;
    for (let i = 0; i < cards.length; i += 1) {
      const item = cards[i];
      const tIn = P.invLerp(0.2 + i * 0.25, 0.72 + i * 0.25, ctx.localT);
      const pop = P.easeOutBack(tIn);
      const breath = 0.5 + 0.5 * Math.sin(ctx.localT * 4.4 - i * 1.1);
      const glow = 0.16 + breath * 0.24 + ctx.beat * 0.18;
      const borderRgb = item.level === 'danger' ? '239,68,68' : '245,158,11';
      item.card.style.opacity = P.clamp(tIn * 1.35, 0, 1).toFixed(3);
      item.card.style.transform = 'translateX(' + ((1 - pop) * -44).toFixed(1) + 'px) scale(' + (0.94 + pop * 0.06).toFixed(4) + ')';
      item.card.style.borderColor = 'rgba(' + borderRgb + ',' + (0.24 + glow).toFixed(3) + ')';
      item.dot.style.transform = 'scale(' + (0.9 + breath * 0.35 + ctx.beat * 0.25).toFixed(3) + ')';
      item.fill.style.width = (item.pct * P.easeOutCubic(tIn)).toFixed(1) + '%';
    }
  }

  const RULE_STYLES = [
    { color: '#94A3B8', border: 'rgba(148,163,184,0.22)', bg: 'rgba(15,23,42,0.72)' },
    { color: '#6EE7B7', border: 'rgba(52,211,153,0.5)', bg: 'rgba(16,185,129,0.16)' }
  ];

  const LOCK_META = [
    { cls: 's4-secret-pill exposed', jumpOp: '0.28', jumpX: '8px', rowBorder: 'rgba(248,113,113,0.34)' },
    { cls: 's4-secret-pill masked', jumpOp: '1', jumpX: '0px', rowBorder: 'rgba(52,211,153,0.44)' }
  ];

  /** 更新单条 DLP 日志行脱敏状态 */
  function updateSingleRow(item, scanRatio, localT) {
    const idx = scanRatio >= item.sample.threshold ? 1 : 0;
    const st = LOCK_META[idx];
    const lockTime = 1.0 + item.sample.threshold * 4.2;
    const flash = idx * Math.max(0, 1 - (localT - lockTime) * 2.4);
    const texts = [item.sample.raw, '🔒 ' + item.sample.masked];
    item.secret.className = st.cls;
    item.secret.textContent = texts[idx];
    item.secret.style.transform = 'scale(' + (1 + flash * 0.08).toFixed(4) + ')';
    item.jump.style.opacity = st.jumpOp;
    item.jump.style.transform = 'translateX(' + st.jumpX + ')';
    item.row.style.borderColor = st.rowBorder;
    return idx;
  }

  /** 更新激光扫描位置、日志行脱敏状态与底部护盾徽章 */
  function updateRightChamber(right, ctx) {
    const P = window.Promo;
    const scanRatio = P.easeInOutQuart(P.invLerp(1.5, 6.35, ctx.localT));
    const chamberH = right.chamber.clientHeight || 470;
    const laserY = P.lerp(-40, chamberH - 12, scanRatio);
    const beamOp = P.invLerp(1.3, 1.6, ctx.localT) * (1 - P.invLerp(6.35, 7.1, ctx.localT) * 0.72);
    right.laser.style.transform = 'translateY(' + laserY.toFixed(1) + 'px)';
    right.laser.style.opacity = beamOp.toFixed(3);
    let maskedCount = 0;
    for (let i = 0; i < right.rows.length; i += 1) {
      maskedCount += updateSingleRow(right.rows[i], scanRatio, ctx.localT);
    }
    const doneIdx = maskedCount === 3 ? 1 : 0;
    right.statusChip.className = ['sb-chip danger sb-mono', 'sb-chip emerald sb-mono'][doneIdx];
    right.statusChip.textContent = ['SCANNING · ' + maskedCount + '/3', '3/3 MASKED · LOCAL SAFE'][doneIdx];
    updateShieldChips(right, scanRatio, ctx.beat);
  }

  /** 更新底部 7 类规则胶囊点亮状态 */
  function updateShieldChips(right, scanRatio, beat) {
    const glow = 0.25 + scanRatio * 0.4 + beat * 0.15;
    right.shieldBar.style.borderColor = 'rgba(52,211,153,' + glow.toFixed(3) + ')';
    for (let i = 0; i < right.ruleChips.length; i += 1) {
      const st = RULE_STYLES[scanRatio >= (i + 1) / (right.ruleChips.length + 1) ? 1 : 0];
      const chip = right.ruleChips[i];
      chip.style.color = st.color;
      chip.style.borderColor = st.border;
      chip.style.background = st.bg;
    }
  }

  /** 确定性渲染帧状态 */
  function render(ctx) {
    if (!_refs) {
      return;
    }
    const P = window.Promo;
    const headProg = P.easeOutCubic(P.invLerp(0, 0.55, ctx.localT));
    _refs.header.style.opacity = headProg.toFixed(3);
    _refs.header.style.transform = 'translateY(' + ((1 - headProg) * 20).toFixed(1) + 'px)';
    const rightIn = P.easeOutCubic(P.invLerp(0.15, 0.75, ctx.localT));
    _refs.right.panel.style.opacity = rightIn.toFixed(3);
    _refs.right.panel.style.transform = 'translateY(' + ((1 - rightIn) * 24).toFixed(1) + 'px)';
    updateDiagCards(_refs.left.cards, ctx);
    updateRightChamber(_refs.right, ctx);
  }

  window.Promo.registerScene({
    id: 'security',
    index: 4,
    tag: '03 / HEALTH & LITE DLP',
    start: 21.8,
    end: 30.2,
    mount,
    render
  });
})();
