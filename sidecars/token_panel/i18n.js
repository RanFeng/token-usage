/**
 * Internationalization (zh / en), currency formatting (USD / CNY), and custom model pricing.
 * Classic browser IIFE exposing window.TokenI18n.
 */
(() => {
const KEY_LANG = 'tu_lang';
const KEY_CURR = 'tu_currency';
const KEY_FX = 'tu_fx_rate';
const KEY_RATES = 'tu_custom_rates';
const KEY_SUB = 'tu_subscription';
const KEY_PLAN_LEGACY = 'tu_plan_usd';
const DEFAULT_FX = 7.2;
const RATE_BUCKETS = ['pro', 'flash', 'claude', 'gpt'];
const MODEL_RULES = [
  ['claude', /claude|sonnet|opus|haiku/],
  ['flash', /flash|hydrogen/],
  ['gpt', /gpt|\bo[134](?:$|[-_.])|codex/],
];

const PAIRS = {
  // Header & Tabs
  'app.title': ['Token Usage', 'Token Usage'],
  'tab.current': ['当前会话', 'Current'],
  'tab.sessions': ['全部会话', 'Sessions'],
  'tab.overview': ['趋势总览', 'Overview'],
  'btn.export': ['导出与分享', 'Export & Share'],
  'btn.settings': ['设置与关于', 'Settings & About'],
  'btn.refresh': ['刷新面板', 'Refresh'],
  'btn.lang': ['EN', '中'],
  'btn.langTitle': ['切换至 English', 'Switch to 中文'],
  'toolbar.actions': ['面板操作', 'Panel actions'],

  // Current Session
  'ctx.title': ['上下文窗口构成', 'Context Window'],
  'ctx.status.normal': ['状态正常', 'Healthy'],
  'ctx.status.warn': ['占用偏高', 'High Usage'],
  'ctx.status.danger': ['接近上限', 'Near Limit'],
  'ctx.used': ['已用 Token', 'Used Tokens'],
  'ctx.remaining': ['剩余可用', 'Remaining'],
  'ctx.limit': ['窗口上限', 'Window Limit'],
  'ctx.model': ['当前模型', 'Model'],
  'ctx.project': ['所属项目', 'Project'],
  'ctx.total': ['会话累计 ({n}轮)', 'Session Total ({n} turns)'],
  'ctx.costSaved': ['参考费用 / 缓存省钱', 'Est. Cost / Cache Saved'],
  'ctx.latest': ['最近请求', 'Latest Request'],
  'ctx.unknown': ['未知', 'Unknown'],
  'ctx.saved': ['省 {val}', 'Saved {val}'],
  'ctx.newCacheTip': ['新 {input} + 缓 {cache}', 'New {input} + Cache {cache}'],
  'ctx.outputTip': ['输出', 'Output'],
  'ctx.steps': ['{n}步', '{n} steps'],
  'chart.title': ['上下文历史趋势', 'Context Growth'],
  'chart.peak': ['峰值', 'Peak'],
  'chart.compactCount': ['Compact {n}次', 'Compact ×{n}'],
  'chart.step1': ['第 1 步', 'Step 1'],
  'chart.totalSteps': ['共 {n} 步 (红点=Compact)', '{n} steps (red = Compact)'],
  'chart.latest': ['最新', 'Latest'],
  'chart.hoverTitle': ['第 {turn} 轮 · 第 {step} 步', 'Turn {turn} · Step {step}'],
  'chart.windowLabel': ['窗口：', 'Context: '],
  'attr.title': ['模型与工具归因', 'Models & Tools'],
  'turns.title': ['逐轮对话记录 ({shown}/{total})', 'Turns ({shown}/{total})'],
  'turns.searchPlaceholder': ['筛选提问关键词...', 'Filter prompts...'],
  'turns.filter.all': ['全部', 'All'],
  'turns.filter.high': ['高消耗', 'High'],
  'turns.filter.error': ['有报错', 'Errors'],
  'turns.filter.media': ['含图片', 'Media'],
  'turns.empty': ['无匹配轮次', 'No matching turns'],
  'turns.turnLabel': ['第 {n} 轮', 'Turn {n}'],
  'turns.copyKey': ['复制定位关键词 (⌘F)', 'Copy search snippet (⌘F)'],
  'turns.copyKeyToast': ['已复制关键词，按 ⌘F 可在聊天中定位', 'Snippet copied — press ⌘F in chat to locate'],
  'turns.durTitle': ['第 {n} 轮耗时拆解', 'Turn {n} Latency'],
  'turns.durSingle': ['单步直接响应', 'Single-step response'],
  'turns.modelSec': ['模型{val}', 'Model {val}'],
  'turns.toolSec': ['工具{val}', 'Tool {val}'],
  'turns.steps': ['{n} 步', '{n} steps'],
  'turns.loading': ['正在加载完整上下文...', 'Loading turn context...'],
  'turns.noDetail': ['暂无详细上下文', 'No detailed context'],
  'turns.userPrompt': ['用户提问', 'User Prompt'],
  'turns.modelResp': ['模型响应', 'Model Response'],
  'turns.toolReturn': ['工具返回', 'Tool Output'],
  'turns.noText': ['(无文本)', '(No text)'],
  'turns.emptyText': ['(空)', '(Empty)'],
  'turns.waiting': ['等待当前会话产生对话记录...', 'Waiting for conversation activity...'],
  'turns.finalReply': ['最终回复', 'Final reply'],
  'turns.mediaTip': ['本轮包含 {n} 个图片/媒体附件', 'Includes {n} image/media attachment(s)'],
  'turns.errorTip': ['本轮出现 {n} 次工具或步骤报错', '{n} tool/step error(s) in this turn'],
  'turns.dlpTip': ['检测到 {n} 处疑似敏感凭证（点击查看）', '{n} potential secret(s) detected (click to inspect)'],
  'turns.cacheTip': ['本轮缓存命中率 {rate}（缓存 {cache} / 总输入 {total}）', 'Cache hit rate {rate} ({cache} / {total} input)'],
  'turns.deltaTip': ['本轮上下文窗口净变化 {val} Token（相对上一轮）', 'Context window net change: {val} tokens vs. previous turn'],
  'turns.compactTip': ['本轮触发上下文压缩 (Compact)，窗口净变化 {val} Token', 'Context compacted this turn ({val} tokens)'],

  // Realtime Diagnostics
  'diag.title': ['实时诊断建议', 'Live Diagnostics'],
  'diag.near_compact': ['上下文窗口已达 {percent}%，即将触发 Compact，建议适时新开会话', 'Context reached {percent}% — nearing Compact; consider starting a new session'],
  'diag.error_burn': ['第 {turn} 轮出现 {count} 次报错，疑似工具重试消耗过多 Token', 'Turn {turn} hit {count} errors — tool retries may be burning tokens'],
  'diag.token_spike': ['第 {turn} 轮消耗 {tokens}（均值 {ratio}×），建议检查大文件或长输出', 'Turn {turn} spiked to {tokens} ({ratio}× avg) — check large files or outputs'],
  'diag.low_cache': ['当前缓存命中率仅 {rate}%，前缀频繁变动会增加输入成本', 'Cache hit rate is only {rate}% — frequent prefix edits increase input cost'],
  'diag.dismiss': ['收起', 'Dismiss'],
  'diag.show': ['展开诊断 ({n})', 'Show diagnostics ({n})'],

  // Lite DLP
  'dlp.banner': ['检测到 {n} 处疑似敏感凭证', '{n} potential secret(s) detected'],
  'dlp.bannerSub': ['点击查看脱敏列表', 'Click to inspect masked findings'],
  'dlp.modalTitle': ['敏感凭证本地巡检 (Lite DLP)', 'Local Secret Scanner (Lite DLP)'],
  'dlp.privacyNote': ['纯本地正则扫描，绝不上传或存储明文密钥，下方仅展示脱敏片段。', '100% local regex scan. Raw secrets are never stored or uploaded — only masked previews appear below.'],
  'dlp.jumpTurn': ['定位第 {n} 轮 ↗', 'Jump to Turn {n} ↗'],
  'dlp.empty': ['当前会话未检测到疑似敏感凭证，安全状态良好。', 'No potential secrets detected in this session.'],
  'dlp.type.api_key': ['API Key', 'API Key'],
  'dlp.type.aws_key': ['AWS Access Key', 'AWS Access Key'],
  'dlp.type.github_token': ['GitHub Token', 'GitHub Token'],
  'dlp.type.google_key': ['Google API Key', 'Google API Key'],
  'dlp.type.jwt': ['JWT 令牌', 'JWT Token'],
  'dlp.type.private_key': ['私钥证书', 'Private Key'],
  'dlp.type.db_uri': ['数据库连接串', 'Database URI'],
  'dlp.source.prompt': ['用户提问', 'User Prompt'],
  'dlp.source.tool_args': ['工具参数', 'Tool Args'],
  'dlp.source.tool_output': ['工具输出', 'Tool Output'],
  'dlp.source.content': ['模型回复', 'Model Output'],

  // Sessions Tab
  'sess.searchPlaceholder': ['搜索会话标题、项目或 ID...', 'Search title, project, or ID...'],
  'sess.sort.recent': ['最近', 'Recent'],
  'sess.sort.tokens': ['消耗', 'Tokens'],
  'sess.empty': ['无匹配会话', 'No matching sessions'],
  'sess.switching': ['正在切换会话...', 'Switching session...'],
  'sess.untitled': ['未命名会话', 'Untitled Session'],
  'sess.turnsUnit': ['{n}轮', '{n}t'],

  // Overview Tab
  'ov.loading': ['正在统计全机数据...', 'Analyzing all local sessions...'],
  'ov.roi.title': ['💳 订阅回本 ROI 仪表盘', '💳 Subscription ROI'],
  'ov.roi.settings': ['⚙ 设置', '⚙ Plan'],
  'ov.roi.shareImg': ['🎨 分享图', '🎨 Share'],
  'ov.roi.custom': ['自定义', 'Custom'],
  'ov.roi.customLabel': ['自定义订阅费 (USD)', 'Custom Plan Fee (USD)'],
  'ov.roi.monthFee': ['/ {plan} 月费', '/ {plan} mo'],
  'ov.roi.weekFee': ['/ {plan} 周费', '/ {plan} wk'],
  'ov.roi.paidBadge': ['🏆 已回本 {ratio}× · 净赚 {net}', '🏆 {ratio}× ROI · +{net}'],
  'ov.roi.unpaidBadge': ['回本 {pct}% · 还差 {gap}', '{pct}% ROI · {gap} left'],
  'ov.roi.dayProgress': ['本月第 {elapsed}/{total} 天', 'Day {elapsed}/{total}'],
  'ov.roi.cycleProgress': ['本周期第 {elapsed}/{total} 天', 'Cycle Day {elapsed}/{total}'],
  'ov.roi.monthTokens': ['本月消耗', 'Month tokens'],
  'ov.roi.cycleTokens': ['本周期消耗', 'Cycle tokens'],
  'ov.roi.unsetDesc': ['暂未配置订阅方案，设置费用与周期后自动计算回本倍率与净收益', 'No plan set yet. Configure your fee & billing cycle to track ROI'],
  'ov.roi.setupBtn': ['⚙ 去设置订阅', '⚙ Set Up Plan'],
  'ov.roi.monthEst': ['本月参考消耗', 'Est. Month Spend'],
  'ov.fc.title': ['📈 周期预测 & 缓存白嫖', '📈 Forecast & Cache Savings'],
  'ov.fc.eomBadge': ['预计本周期 {ratio}×', 'Est. Cycle {ratio}×'],
  'ov.fc.cycleBadge': ['预计本周期 {ratio}×', 'Est. Cycle {ratio}×'],
  'ov.fc.estOnly': ['未配置订阅', 'No Plan Set'],
  'ov.fc.dailyAvg': ['近 7 天日均', '7-Day Daily Avg'],
  'ov.fc.perDay': ['{val} / 天', '{val} / day'],
  'ov.fc.eomTotal': ['预计本周期累计', 'Projected Cycle'],
  'ov.fc.cycleTotal': ['预计本周期累计', 'Projected Cycle'],
  'ov.fc.approx': ['约 {val}', '~{val}'],
  'ov.fc.unsetAction': ['设置订阅周期 →', 'Set billing cycle →'],
  'ov.fc.unsetSub': ['按订阅周期推算', 'Follows your billing cycle'],
  'ov.save.title': ['⚡ 缓存“白嫖”折算', '⚡ Cache Savings'],
  'ov.save.totalSaved': ['累计省 {val}', 'Saved {val}'],
  'ov.save.cycleSaved': ['本周期省 {val}', 'Cycle saved {val}'],
  'ov.save.coffees': ['☕ {n} 杯星巴克', '☕ {n} Coffees'],
  'ov.save.coffeeSub': ['按 {price} / 杯折算', 'At {price} / cup'],
  'ov.save.freeMonths': ['🎫 {n} 月免费订阅', '🎫 {n} Free Months'],
  'ov.save.monthSub': ['按 {plan} / 月折算', 'At {plan} / mo'],
  'ov.save.freeWeeks': ['🎫 {n} 周免费订阅', '🎫 {n} Free Weeks'],
  'ov.save.weekSub': ['按 {plan} / 周折算', 'At {plan} / wk'],
  'ov.save.hitRate': ['全局缓存命中率', 'Global Cache Hit'],
  'ov.save.monthFooter': ['本月已省 {saved} · 累计缓存命中', 'Saved {saved} this month · Avg cache'],
  'ov.save.cycleFooter': ['累计已省 {saved} · 本周期缓存命中', 'All-time saved {saved} · Cycle cache'],
  'ov.period.today': ['今日', 'Today'],
  'ov.period.week': ['近 7 天', '7 Days'],
  'ov.period.month': ['本月', 'This Month'],
  'ov.period.cycle': ['本周期', 'This Cycle'],
  'ov.period.all': ['全部累计', 'All Time'],
  'ov.hm.title': ['🗓 90 天活跃热力图', '🗓 90-Day Activity Heatmap'],
  'ov.hm.less': ['少', 'Less'],
  'ov.hm.more': ['多', 'More'],
  'ov.hm.empty': ['暂无近 90 天活跃数据', 'No activity in the last 90 days'],
  'ov.hm.streak': ['🔥 连续 {cur} 天 · 🏆 最长 {max} 天', '🔥 {cur}d streak · 🏆 Best {max}d'],
  'ov.hm.curStreak': ['当前连续', 'Current Streak'],
  'ov.hm.maxStreak': ['最长连续', 'Best Streak'],
  'ov.hm.daysUnit': ['{n} 天', '{n}d'],
  'ov.hm.bestDay': ['单日最高', 'Best day'],
  'ov.hm.none': ['暂无', 'None'],
  'ov.daily.title': ['📊 近 14 天每日消耗', '📊 Last 14 Days'],
  'ov.daily.peak': ['峰值', 'Peak'],
  'ov.daily.empty': ['暂无近 14 天消耗数据', 'No data in the last 14 days'],
  'ov.daily.hint': ['点击柱子查看当日详情', 'Click a bar for daily details'],
  'ov.hours.title': ['🕒 24 小时作息分布', '🕒 24-Hour Rhythm'],
  'ov.hours.peak': ['活跃峰值 {hour}:00', 'Peak at {hour}:00'],
  'ov.split.title': ['工作日 vs 周末', 'Weekday vs Weekend'],
  'ov.split.wd': ['工作日 {pct}%', 'Weekday {pct}%'],
  'ov.split.we': ['周末 {pct}%', 'Weekend {pct}%'],
  'ov.split.wdAvg': ['工作日日均', 'Weekday avg'],
  'ov.split.weAvg': ['周末日均', 'Weekend avg'],
  'ov.health.title': ['🩺 上下文健康度 & 趣味换算', '🩺 Context Health & Fun Stats'],
  'ov.health.sessions': ['{n} 个会话', '{n} sessions'],
  'ov.health.avgTurns': ['平均轮次', 'Avg Turns'],
  'ov.health.avgPeak': ['平均峰值窗口', 'Avg Peak Ctx'],
  'ov.health.compacts': ['累计 Compact', 'Total Compacts'],
  'ov.health.totalSess': ['总会话数', 'Total Sessions'],
  'ov.health.longest': ['🏃 最长会话：{title}', '🏃 Longest: {title}'],
  'ov.fun.booksPrefix': ['📖 约等于读完', '📖 Equivalent to reading'],
  'ov.fun.booksVal': ['{n} 本《三体》', '{n}× Three-Body'],
  'ov.fun.booksTip': ['按每本《三体》约 50 万输入 Token 估算', 'Estimated at ~500K input tokens per novel'],
  'ov.fun.codePrefix': ['💻 约等于写出', '💻 Equivalent to writing'],
  'ov.fun.codeVal': ['{n} 万行代码', '{n} lines of code'],
  'ov.fun.codeTip': ['约 {lines} 行代码（按每行 15 输出 Token 估算）', '~{lines} lines (est. 15 output tokens/line)'],
  'ov.models.title': ['🤖 全机模型分布', '🤖 Models Breakdown'],
  'ov.models.count': ['共 {n} 个', '{n} total'],
  'ov.models.empty': ['暂无模型记录', 'No model usage yet'],
  'ov.tools.title': ['🛠 全机工具 Top 榜', '🛠 Top Tools'],
  'ov.tools.sub': ['含报错率', 'with error rate'],
  'ov.tools.empty': ['暂无工具调用记录', 'No tool calls yet'],
  'ov.tools.zeroErr': ['0%错', '0% err'],
  'ov.projects.title': ['📁 项目消耗归因', '📁 Projects Attribution'],
  'ov.projects.exportCsv': ['导出 CSV', 'Export CSV'],
  'ov.projects.empty': ['暂未识别到具体项目路径', 'No workspace paths detected yet'],
  'ov.projects.other': ['其他 / 未分类', 'Other / Unclassified'],
  'ov.radar.title': ['📡 本地多工具雷达', '📡 Local Multi-Tool Radar'],
  'ov.radar.badge': ['只读探测', 'Read-only'],
  'ov.radar.detectedDesc': ['检测到本机其他 AI 编程工具的本地会话（仅计数，绝不读取内容）：', 'Detected local sessions from other AI coding tools (count only, never reads contents):'],
  'ov.radar.emptyDesc': ['暂未发现其他 AI 编程工具的本地记录；多工具统一账单即将推出。', 'No external AI tool sessions detected yet; unified multi-tool billing is coming soon.'],
  'ov.radar.cta': ['了解 Pro 多工具统一账单 →', 'Explore Pro Multi-Tool Roadmap →'],
  'ov.radar.sessionsUnit': ['{n} 会话', '{n} sessions'],
  'ov.ach.title': ['🏅 本地成就徽章墙', '🏅 Local Achievements'],
  'ov.ach.unlocked': ['{done}/{total} 已解锁', '{done}/{total} unlocked'],
  'ov.ach.statusOn': ['已解锁', 'Unlocked'],
  'ov.ach.statusOff': ['未解锁', 'Locked'],
  'ov.hof.title': ['🏛 名人堂 (Hall of Fame)', '🏛 Hall of Fame'],
  'ov.hof.sub': ['点击跳转对应会话', 'Click to open session'],
  'ov.hof.topSess': ['🔥 最烧 Token 会话 Top 3', '🔥 Top 3 Token-Heavy Sessions'],
  'ov.hof.topTurn': ['⏱ 最耗时单轮 Top 3', '⏱ Top 3 Longest Turns'],
  'ov.hof.empty': ['暂无排行数据', 'No records yet'],
  'ov.hof.jump': ['跳转会话 ↗', 'Open ↗'],

  // Personas
  'persona.night_owl': ['深夜炼丹师', 'Night Owl'],
  'persona.night_owl.desc': ['夜深人静灵感爆发，越夜越高效', 'Peak focus after dark — shipping while the world sleeps'],
  'persona.early_bird': ['早起卷王', 'Early Bird'],
  'persona.early_bird.desc': ['晨光微熹即刻开工，抢占全天先机', 'First to ship at sunrise, ahead of the day'],
  'persona.afternoon_pro': ['午后高产型', 'Daytime Builder'],
  'persona.afternoon_pro.desc': ['白昼稳健输出，黄金时段火力全开', 'Steady output through prime daytime hours'],
  'persona.evening_sprinter': ['晚间冲刺手', 'Evening Sprinter'],
  'persona.evening_sprinter.desc': ['晚间余热不减，高效冲刺收尾大师', 'High-velocity evening sprints to finish strong'],
  'persona.idle': ['蓄势待发', 'Warming Up'],
  'persona.idle.desc': ['暂无足够时段活跃记录', 'Keep coding to unlock your schedule persona'],

  // Achievements
  'ach.million_club': ['百万俱乐部', 'Million Club'],
  'ach.million_club.desc': ['累计消耗达到 1M Tokens', 'Reach 1M cumulative tokens'],
  'ach.ten_million_driver': ['千万老司机', '10M Power User'],
  'ach.ten_million_driver.desc': ['累计消耗达到 10M Tokens', 'Reach 10M cumulative tokens'],
  'ach.cache_master': ['缓存大师', 'Cache Master'],
  'ach.cache_master.desc': ['全局缓存命中率达到 85%', 'Achieve 85%+ overall cache hit rate'],
  'ach.night_owl': ['深夜不眠人', 'Midnight Coder'],
  'ach.night_owl.desc': ['凌晨 02:00-04:59 有活跃记录', 'Stay active between 02:00 and 04:59'],
  'ach.sharpshooter': ['百步穿杨', 'Deep Thinker'],
  'ach.sharpshooter.desc': ['单轮对话执行达到 20 步以上', 'Run 20+ agent steps in a single turn'],
  'ach.marathoner': ['马拉松选手', 'Marathoner'],
  'ach.marathoner.desc': ['单个会话达到 50 轮以上', 'Reach 50+ turns in one session'],
  'ach.tool_maniac': ['工具狂魔', 'Tool Virtuoso'],
  'ach.tool_maniac.desc': ['累计调用工具达到 500 次', 'Invoke tools 500+ times overall'],
  'ach.money_saver': ['省钱达人', 'Smart Saver'],
  'ach.money_saver.desc': ['缓存累计节省费用达到 $50', 'Save $50+ via prompt caching'],
  'ach.roi_king': ['订阅回本王', 'ROI Champion'],
  'ach.roi_king.desc': ['本周期折算消耗达到订阅费 ({plan})', 'Cycle value reaches plan ({plan})'],

  // JSON Modal
  'jm.title': ['JSON 详情', 'JSON Inspector'],
  'jm.searchPlaceholder': ['搜索字段名或值...', 'Search keys or values...'],
  'jm.expand': ['展开', 'Expand'],
  'jm.collapse': ['折叠', 'Collapse'],
  'jm.copy': ['复制', 'Copy'],
  'jm.copied': ['已复制格式化 JSON', 'Formatted JSON copied'],

  // Settings / About / Roadmap Modal
  'set.title': ['设置与关于', 'Settings & About'],
  'set.sub': ['订阅信息', 'Subscription'],
  'set.subHint': ['设置订阅费用与重置周期，精准计算 ROI 回本进度与周期预测。', 'Configure your plan fee and reset cycle for accurate ROI progress and forecasts.'],
  'set.subPlan': ['订阅费用 (USD)', 'Plan Fee (USD)'],
  'set.subCycle': ['计费周期', 'Billing Cycle'],
  'set.subMonthly': ['按月', 'Monthly'],
  'set.subWeekly': ['按周', 'Weekly'],
  'set.subResetDay': ['每月重置日', 'Monthly Reset Day'],
  'set.subResetWeekday': ['每周重置日', 'Weekly Reset Day'],
  'set.subDayOpt': ['每月 {n} 日', 'Day {n}'],
  'set.subCurrentCycle': ['当前周期：{range}', 'Current cycle: {range}'],
  'set.subSaved': ['订阅信息已更新', 'Subscription updated'],
  'set.subEnable': ['保存并启用', 'Save & Enable'],
  'set.subClear': ['清除订阅', 'Clear Plan'],
  'set.subCleared': ['已清除订阅配置', 'Subscription cleared'],
  'weekday.1': ['周一', 'Mon'],
  'weekday.2': ['周二', 'Tue'],
  'weekday.3': ['周三', 'Wed'],
  'weekday.4': ['周四', 'Thu'],
  'weekday.5': ['周五', 'Fri'],
  'weekday.6': ['周六', 'Sat'],
  'weekday.7': ['周日', 'Sun'],
  'set.prefs': ['偏好设置', 'Preferences'],
  'set.lang': ['界面语言', 'Language'],
  'set.currency': ['显示币种', 'Currency'],
  'set.fxRate': ['USD → CNY 汇率', 'USD → CNY Rate'],
  'set.pricing': ['自定义模型单价 (USD / 1M)', 'Custom Pricing (USD / 1M)'],
  'set.pricingHint': ['覆盖默认公开 API 单价（Input / Cache / Output），仅影响本地费用估算。', 'Override default public API rates (Input / Cache / Output) for local cost estimates.'],
  'set.pricingSave': ['保存单价', 'Save Rates'],
  'set.pricingReset': ['恢复默认', 'Reset Defaults'],
  'set.pricingSaved': ['自定义单价已保存', 'Custom rates saved'],
  'set.pricingResetDone': ['已恢复默认单价', 'Restored default rates'],
  'set.colModel': ['模型档位', 'Tier'],
  'set.colIn': ['输入', 'Input'],
  'set.colCache': ['缓存', 'Cache'],
  'set.colOut': ['输出', 'Output'],
  'set.about': ['关于与更新', 'About & Updates'],
  'set.version': ['当前版本', 'Version'],
  'set.checkUpdate': ['检查更新', 'Check Updates'],
  'set.upToDate': ['已是最新版本', 'Up to date'],
  'set.newVersion': ['发现新版本 v{ver}', 'New version v{ver}'],
  'set.checking': ['检查中...', 'Checking...'],
  'set.checkFailed': ['无法连接 GitHub，请稍后重试', 'Unable to reach GitHub'],
  'set.star': ['⭐ GitHub 点赞', '⭐ Star on GitHub'],
  'set.feedback': ['💬 反馈建议', '💬 Feedback'],
  'set.roadmapTitle': ['Pro & Team 路线图', 'Pro & Team Roadmap'],
  'set.roadmapSub': ['点击前往 GitHub 为期待的功能投票 ↗', 'Vote on GitHub for what we build next ↗'],
  'set.vote': ['👍 去投票 ↗', '👍 Vote ↗'],
  'set.voted': ['✓ 已投票 ↗', '✓ Voted ↗'],
  'set.waitlist': ['🚀 前往 GitHub Discussions 参与讨论 ↗', '🚀 Join GitHub Discussions & Waitlist ↗'],
  'set.road.multiTool': ['多工具统一账单', 'Unified Multi-Tool Billing'],
  'set.road.multiToolDesc': ['汇总 Antigravity、Claude Code、Codex、Cursor 与 Gemini CLI 全局消耗', 'Aggregate Antigravity, Claude Code, Codex, Cursor & Gemini CLI spend'],
  'set.road.cloudSync': ['跨设备加密云同步', 'Encrypted Cross-Device Sync'],
  'set.road.cloudSyncDesc': ['只同步脱敏指标，多台电脑实时合并月度 ROI 与热力图', 'Sync anonymized metrics across machines for unified ROI & heatmaps'],
  'set.road.teamDlp': ['团队预算与 DLP 审计', 'Team Budgets & DLP Audit'],
  'set.road.teamDlpDesc': ['项目级成本分摊、超额告警与团队敏感凭证防泄漏策略', 'Per-project chargeback, budget alerts & team secret-leak policies'],

  // Export & Share Modals
  'exp.title': ['导出与分享中心', 'Export & Share'],
  'exp.secSession': ['当前会话', 'Current Session'],
  'exp.copyMd': ['📋 复制完整 Markdown 报告', '📋 Copy Full Markdown Report'],
  'exp.copyDesensitized': ['🔒 复制脱敏诊断摘要', '🔒 Copy Desensitized Summary'],
  'exp.sessionCard': ['🖼 生成脱敏诊断卡片 (PNG)', '🖼 Desensitized Diagnostic Card (PNG)'],
  'exp.secLedger': ['全局账单与趋势', 'Global Ledger & Overview'],
  'exp.rangeMonth': ['本月', 'Month'],
  'exp.rangeCycle': ['本周期', 'Cycle'],
  'exp.range30d': ['近 30 天', '30 Days'],
  'exp.rangeAll': ['全部', 'All'],
  'exp.dlCsv': ['⬇ 下载 CSV 账单', '⬇ Download CSV Ledger'],
  'exp.dlJson': ['⬇ 下载 JSON 数据', '⬇ Download JSON Export'],
  'exp.overviewCard': ['🎨 生成趋势战报分享图 (PNG)', '🎨 Overview Share Card (PNG)'],
  'exp.dlDone': ['已导出 {file}', 'Exported {file}'],
  'exp.savedTo': ['已保存至 {path}', 'Saved to {path}'],
  'exp.dlFailed': ['导出失败，请稍后重试', 'Export failed, please retry'],
  'share.copyImg': ['📋 复制图片', '📋 Copy PNG'],
  'share.dlPng': ['⬇ 下载 PNG', '⬇ Download PNG'],
  'share.themeDark': ['深色', 'Dark'],
  'share.themeLight': ['浅色', 'Light'],
  'share.modules': ['展示模块', 'Modules'],
  'share.colors': ['自定义配色', 'Colors'],
  'share.colorBg': ['背景', 'Bg'],
  'share.colorCard': ['卡片', 'Card'],
  'share.colorAccent': ['强调', 'Accent'],
  'share.reset': ['重置', 'Reset'],
  'share.mod.roi': ['订阅 ROI', 'ROI'],
  'share.mod.kpis': ['核心指标', 'KPIs'],
  'share.mod.heatmap': ['热力图', 'Heatmap'],
  'share.mod.models': ['模型与徽章', 'Models'],
  'share.mod.curve': ['增长曲线', 'Curve'],
  'share.mod.attribution': ['模型与工具', 'Attribution'],
  'share.copied': ['图片已复制到剪贴板', 'Image copied to clipboard'],
  'share.copyFallback': ['当前环境不支持复制图片，请点击下载 PNG', 'Clipboard image unsupported — use Download PNG'],
  'share.downloaded': ['已保存 PNG 分享图', 'PNG share card saved'],
  'share.dlFailed': ['图片保存失败，请稍后重试', 'Failed to save PNG, please retry'],
  'share.watermark': ['由 Token Usage 生成', 'Generated by Token Usage'],
  'share.titleOverview': ['趋势战报分享图', 'Overview Share Card'],
  'share.titleSession': ['单会话脱敏诊断图', 'Session Diagnostic Card'],
  'share.renderErr': ['分享图生成失败', 'Failed to render share card'],
  'modal.close': ['关闭 (Esc)', 'Close (Esc)'],
  'toast.copied': ['已复制', 'Copied'],
  'toast.copyFailed': ['复制失败', 'Copy failed'],
  'toast.noData': ['暂无可用数据', 'No data available'],
};

function buildDict() {
  const zh = {};
  const en = {};
  for (const [k, pair] of Object.entries(PAIRS)) {
    zh[k] = pair[0];
    en[k] = pair[1];
  }
  return { zh, en };
}

const DICT = buildDict();

function lsGet(key) {
  try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; } catch { return null; }
}

function lsSet(key, val) {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, val); } catch {}
}

function lsRemove(key) {
  try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); } catch {}
}

function detectInitialLang() {
  const saved = lsGet(KEY_LANG);
  if (saved === 'zh' || saved === 'en') return saved;
  const nav = typeof navigator !== 'undefined' ? (navigator.language || '') : '';
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

let currentLang = detectInitialLang();

function getLang() {
  return currentLang;
}

function setLang(lang) {
  currentLang = lang === 'en' ? 'en' : 'zh';
  lsSet(KEY_LANG, currentLang);
  return currentLang;
}

function toggleLang() {
  return setLang(currentLang === 'zh' ? 'en' : 'zh');
}

function hasKey(key) {
  return Object.prototype.hasOwnProperty.call(DICT.zh, key)
    && Object.prototype.hasOwnProperty.call(DICT.en, key);
}

function interpolate(tmpl, params) {
  if (!params) return tmpl;
  return tmpl.replace(/\{(\w+)\}/g, (full, k) => (params[k] == null ? full : String(params[k])));
}

function t(key, params) {
  const table = DICT[currentLang] || DICT.en;
  const raw = table[key] ?? DICT.en[key] ?? DICT.zh[key] ?? key;
  return interpolate(raw, params);
}

function getCurrency() {
  return lsGet(KEY_CURR) === 'CNY' ? 'CNY' : 'USD';
}

function setCurrency(curr) {
  const next = curr === 'CNY' ? 'CNY' : 'USD';
  lsSet(KEY_CURR, next);
  return next;
}

function getFxRate() {
  const n = Number(lsGet(KEY_FX));
  return Number.isFinite(n) && n > 0 && n <= 1000 ? n : DEFAULT_FX;
}

function setFxRate(rate) {
  const n = Number(rate);
  const valid = Number.isFinite(n) && n > 0 && n <= 1000 ? Number(n.toFixed(4)) : DEFAULT_FX;
  lsSet(KEY_FX, String(valid));
  return valid;
}

function fmtMoney(usd) {
  const isCny = getCurrency() === 'CNY';
  const sym = isCny ? '¥' : '$';
  const val = Math.max(0, Number(usd) || 0) * (isCny ? getFxRate() : 1);
  if (val > 0 && val < 0.01) return `<${sym}0.01`;
  return `${sym}${val.toFixed(2)}`;
}

function fmtPlan(planUsd) {
  const isCny = getCurrency() === 'CNY';
  const base = Math.max(1, Number(planUsd) || 20);
  return isCny ? `¥${Math.round(base * getFxRate())}` : `$${Math.round(base)}`;
}

function sanitizeRateRow(row) {
  if (!row || typeof row !== 'object') return null;
  const input = Number(row.input);
  const cache = Number(row.cache);
  const output = Number(row.output);
  if (!Number.isFinite(input) || !Number.isFinite(cache) || !Number.isFinite(output)) return null;
  return { input: Math.max(0, input), cache: Math.max(0, cache), output: Math.max(0, output) };
}

function normalizeRates(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  let validCount = 0;
  for (const k of RATE_BUCKETS) {
    const clean = sanitizeRateRow(raw[k]);
    if (clean) { out[k] = clean; validCount += 1; }
  }
  return validCount ? out : null;
}

function getCustomRates() {
  const txt = lsGet(KEY_RATES);
  if (!txt) return null;
  try { return normalizeRates(JSON.parse(txt)); } catch { return null; }
}

function setCustomRates(rates) {
  const clean = normalizeRates(rates);
  if (!clean) return resetCustomRates();
  lsSet(KEY_RATES, JSON.stringify(clean));
  return clean;
}

function resetCustomRates() {
  lsRemove(KEY_RATES);
  return null;
}

function bucketForModel(model) {
  const lower = String(model || '').toLowerCase();
  const hit = MODEL_RULES.find(([, re]) => re.test(lower));
  return hit ? hit[0] : 'pro';
}

function calcAdjustedCost(input, cache, output, model, fallbackUsd = 0, fallbackSaved = 0) {
  const custom = getCustomRates();
  const rate = custom && (custom[bucketForModel(model)] || custom.pro);
  if (!rate) return { actualUsd: Number(fallbackUsd) || 0, savedUsd: Number(fallbackSaved) || 0 };
  const inp = Math.max(0, Number(input) || 0);
  const cac = Math.max(0, Number(cache) || 0);
  const out = Math.max(0, Number(output) || 0);
  const actualUsd = (inp * rate.input + cac * rate.cache + out * rate.output) / 1e6;
  const noCacheUsd = ((inp + cac) * rate.input + out * rate.output) / 1e6;
  return { actualUsd, savedUsd: Math.max(0, noCacheUsd - actualUsd) };
}

const LANG_HTML = { zh: 'zh-CN', en: 'en' };

function defaultDoc() {
  return typeof document !== 'undefined' ? document : null;
}

function applyAttr(root, attr, setter) {
  root.querySelectorAll(`[${attr}]`).forEach((el) => setter(el, t(el.getAttribute(attr))));
}

function applyStaticDom(root) {
  const doc = root || defaultDoc();
  if (!doc) return;
  applyAttr(doc, 'data-i18n', (el, val) => { el.textContent = val; });
  applyAttr(doc, 'data-i18n-title', (el, val) => {
    el.setAttribute('title', val);
    if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', val);
  });
  applyAttr(doc, 'data-i18n-aria', (el, val) => { el.setAttribute('aria-label', val); });
  applyAttr(doc, 'data-i18n-placeholder', (el, val) => { el.setAttribute('placeholder', val); });
  if (doc.documentElement) doc.documentElement.lang = LANG_HTML[currentLang] || 'en';
}

function sanitizeSubscription(raw, fallbackPlan = 20) {
  const cycleType = raw?.cycleType === 'weekly' ? 'weekly' : 'monthly';
  const maxDay = cycleType === 'weekly' ? 7 : 31;
  const p = Math.round(Number(raw?.planUsd));
  const d = Math.round(Number(raw?.resetDay));
  return {
    planUsd: Number.isFinite(p) && p >= 1 && p <= 9999 ? p : fallbackPlan,
    cycleType,
    resetDay: Number.isFinite(d) && d >= 1 && d <= maxDay ? d : 1,
  };
}

function hasSubscription() {
  return Boolean(lsGet(KEY_SUB));
}

function getSubscription() {
  const legacy = Math.round(Number(lsGet(KEY_PLAN_LEGACY)));
  const fallback = Number.isFinite(legacy) && legacy >= 1 && legacy <= 9999 ? legacy : 20;
  const txt = lsGet(KEY_SUB);
  if (!txt) return { planUsd: fallback, cycleType: 'monthly', resetDay: 1 };
  try { return sanitizeSubscription(JSON.parse(txt), fallback); } catch { return { planUsd: fallback, cycleType: 'monthly', resetDay: 1 }; }
}

function setSubscription(patch) {
  const next = sanitizeSubscription({ ...getSubscription(), ...(patch || {}) });
  lsSet(KEY_SUB, JSON.stringify(next));
  lsSet(KEY_PLAN_LEGACY, String(next.planUsd));
  return next;
}

function clearSubscription() {
  lsRemove(KEY_SUB);
  lsRemove(KEY_PLAN_LEGACY);
}

function fmtShortDate(d) {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function clampMonthDay(y, m, day) {
  return new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
}

function getCycleRangeText(sub, now = new Date()) {
  const cfg = sanitizeSubscription(sub || getSubscription());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (cfg.cycleType === 'weekly') {
    const diff = ((today.getDay() || 7) - cfg.resetDay + 7) % 7;
    const s = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diff);
    const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6);
    return `${fmtShortDate(s)} – ${fmtShortDate(e)}`;
  }
  const cur = clampMonthDay(today.getFullYear(), today.getMonth(), cfg.resetDay);
  const s = today >= cur ? cur : clampMonthDay(today.getFullYear(), today.getMonth() - 1, cfg.resetDay);
  const nxt = today >= cur ? clampMonthDay(today.getFullYear(), today.getMonth() + 1, cfg.resetDay) : cur;
  const e = new Date(nxt.getFullYear(), nxt.getMonth(), nxt.getDate() - 1);
  return `${fmtShortDate(s)} – ${fmtShortDate(e)}`;
}

window.TokenI18n = {
  getLang, setLang, toggleLang, t, hasKey,
  getCurrency, setCurrency, getFxRate, setFxRate, fmtMoney, fmtPlan,
  getCustomRates, setCustomRates, resetCustomRates, calcAdjustedCost,
  hasSubscription, getSubscription, setSubscription, clearSubscription, getCycleRangeText,
  applyStaticDom, DICT,
};
})();
