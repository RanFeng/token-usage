<p align="center">
  <img src="./assets/logo.svg" alt="Token Usage Logo" width="88" height="88" />
</p>

<h1 align="center">Token Usage</h1>

<p align="center">
  <strong>面向 <a href="https://antigravity.google">Antigravity</a> 的实时 Token、上下文水位、成本估算与会话健康度分析插件 —— 100% 本地只读、零外部依赖、隐私优先。</strong>
</p>

<p align="center">
  <strong>简体中文</strong> ·
  <a href="./README.en.md">English</a> ·
  <a href="./README.ja.md">日本語</a> ·
  <a href="./README.ko.md">한국어</a> ·
  <a href="./README.es.md">Español</a>
</p>

<p align="center">
  <a href="./plugin.json"><img src="https://img.shields.io/badge/version-1.1.0-blue.svg" alt="Version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="MIT License" /></a>
  <a href="./sidecars/token_panel/package.json"><img src="https://img.shields.io/badge/dependencies-zero-brightgreen.svg" alt="Zero Dependencies" /></a>
  <a href="#-隐私与安全"><img src="https://img.shields.io/badge/privacy-100%25%20local-emerald.svg" alt="100% Local" /></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg" alt="Cross-Platform" />
</p>

---

## ⚡ 快速安装（强烈推荐：让 Agent 一句话搞定）

无需打开终端、无需手动 clone 或复制文件。**直接将下面这句话粘贴发送给 Antigravity 对话框**，让 Agent 自动完成克隆、同步、校验并引导你一键开启：

> ```text
> 请帮我把 https://github.com/RanFeng/token-usage 这个 Antigravity 插件安装到 ~/.gemini/config/plugins/token-usage（优先运行仓库自带的 sync.sh 同步），检查安装文件是否完整，并给我启用和打开 Token Usage 面板的入口。
> ```

**Agent 会自动为你完成以下步骤：**
1. 拉取 `https://github.com/RanFeng/token-usage` 仓库代码。
2. 将核心插件文件（`plugin.json`、`assets/`、`sidecars/`、`skills/`）同步至 `~/.gemini/config/plugins/token-usage`。
3. 校验安装完整性，并直接返回 **Customizations / Plugins** 页面链接，点击即可一键启用 **Token Usage**。

### 🔄 一句话更新到最新版本

后续有新版本发布时，同样只需对 Antigravity 说一句：

> ```text
> 请帮我把 token-usage 插件从 https://github.com/RanFeng/token-usage 更新到最新版本，并重新同步到 ~/.gemini/config/plugins/token-usage。
> ```

<details>
<summary><strong>🛠️ 偏好手动命令行安装？点击展开</strong></summary>

#### 环境要求
- 已安装 **Antigravity**
- **Node.js 18+**（运行零依赖的 Sidecar 侧边栏面板）
- **Python 3.8+**（运行对话 Skill 与命令行统计脚本）

#### macOS / Linux（推荐使用 `sync.sh`）
```bash
git clone https://github.com/RanFeng/token-usage.git
cd token-usage
./sync.sh
```
或直接克隆到 Antigravity 插件目录：
```bash
git clone https://github.com/RanFeng/token-usage.git ~/.gemini/config/plugins/token-usage
```

#### Windows (PowerShell)
```powershell
git clone https://github.com/RanFeng/token-usage.git "$env:USERPROFILE\.gemini\config\plugins\token-usage"
```

#### 启用插件
1. 打开 **Antigravity** → **Customizations / Plugins**（自定义/插件管理）。
2. 开启 **Token Usage**（实时生效，无需重启）。
3. 在右侧辅助栏（**Aux Pane**）打开 **Token Usage** 面板即可使用。

</details>

---

## 📖 详细使用指南

Token Usage 提供**三种使用方式**，可按场景自由搭配。

### 1. 侧边栏实时面板（Sidecar Aux Pane）

在 Antigravity 右侧辅助栏打开 **Token Usage**，即可获得全实时可视化分析体验。

#### 📊 当前会话（Current 面板）
- **上下文水位仪表盘**：实时展示已用 / 剩余 / 上限上下文 Token、累计 `input` / `cache_read` / `output` 消耗、等效 API 费用与缓存省钱金额。
- **上下文增长曲线**：逐轮绘制上下文膨胀趋势，自动标红 **Compact 压缩点**。
- **实时会话健康诊断**：自动检测并可手动关闭以下 4 类异常预警：
  - 临近 Compact 上下文阈值（`≥80%` 警告 / `≥90%` 严重）
  - 连续报错空转循环
  - 单轮 Token 异常激增
  - 提示词缓存命中率偏低
- **100% 本地 Lite DLP 敏感凭证扫描**：纯本地扫描 7 类高置信度凭证（`API Key`、`AWS Key`、`GitHub Token`、`Google Key`、`JWT`、私钥、数据库连接串）。**绝不存储或展示明文**，仅显示打码片段，支持一键跳转对应轮次排查。
- **逐轮明细与 JSON 树状查看器**：
  - 将每一轮拆解为 **模型思考耗时 vs 工具执行耗时**，清晰呈现模型与工具归因。
  - 支持关键词搜索与快捷筛选（全部 / 高消耗 / 含错误 / 含媒体）。
  - 内置可搜索、可折叠、一键复制的 **JSON 树状查看器**，轻松查看工具入参与返回结果。
- **单会话脱敏诊断图（PNG）**：一键生成 2× 高清诊断卡片（含上下文曲线、Token、缓存率与模型/工具统计），**100% 脱敏，绝不包含提问内容、文件路径、项目名或敏感信息**。

#### 📈 趋势总览（Overview 面板 · 12+ 项看板）
- **订阅回本 ROI 仪表盘**：点击订阅卡片即可配置你的套餐（`$20 Pro` / `$100 Ultra` / `$200 Ultra` 或自定义月/周费与重置日），实时计算回本倍数、月末消耗预测与缓存“白嫖”省钱额。
- **活跃与作息画像**：90 天 GitHub 风格活跃热力图、近 14 天每日柱状图、24 小时编码作息人格与工作日/周末对比、全机模型与工具 Top 10、上下文健康度评分、本地成就徽章墙与名人堂。
- **项目成本归因**：根据工具操作路径自动推断活跃工作区 Top 10 及其消耗占比。
- **本地多工具雷达（Multi-Tool Radar）**：轻量只读探测本机 **Claude Code**、**Codex**、**Cursor**、**Gemini CLI** 的历史会话数。
- **2× 视网膜级战报分享图（PNG）**：支持深色/浅色双主题与模块开关自定义，一键复制图片到剪贴板或保存到 `~/Downloads`。

#### 🕒 历史记录与顶部工具栏
- **历史面板（History）**：快速检索并切换查看任意历史会话。
- **双语切换（`EN / 中`）**：一键切换面板中英文界面。
- **设置弹窗**：
  - 切换币种 `USD ($)` / `CNY (¥)` 并自定义汇率。
  - 自定义 `Pro`、`Flash`、`Claude`、`GPT/Codex` 各模型家族的百万 Token 单价。
  - 支持通过 GitHub Releases 一键检查插件更新。
- **导出弹窗**：
  - 按「本月 / 近 30 天 / 全部」一键导出 UTF-8 BOM **CSV** 或 **JSON** 账单明细。
  - 导出当前会话的 Markdown 报告或脱敏诊断摘要，直接保存至 `~/Downloads`。

---

### 2. 对话内 Skill 调用（`/token-usage` 或自然语言）

启用插件后，Antigravity 会自动加载内置的 `token-usage` Skill。你可以输入 `/token-usage`，或者直接在对话框用自然语言提问：

- “统计最近 10 个会话的 Token 消耗汇总”
- “查看当前会话每一轮对话的 Token 明细”
- “按模型统计我所有会话的 Token 总消耗”
- “找出消耗 Token 最多的前 5 个会话”

---

### 3. 独立命令行脚本（`token_stats.py`）

你也可以在任意终端直接运行内置统计脚本（仅依赖 Python 3 标准库）：

```bash
# 1. 查看近期会话汇总（--sort 支持 recent | tokens，--limit 默认 15）
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py summary --limit 15 --sort recent

# 2. 查看单会话逐轮明细（支持传入 latest、8 位 ID 前缀或完整 UUID）
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py session latest

# 3. 查看全机及各模型 Token 总消耗
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py models
```

> **字段说明**：`input` 为未命中缓存的输入 Token，`cache_read` 为提示词缓存命中 Token，`output` 为模型输出 Token（默认 `total = input + output`，除非显式要求合并缓存读取）。

---

## 🔒 隐私与安全

- **100% 本地只读**：直接读取本机 Antigravity 会话日志（`~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`），不修改官方程序、不上传任何对话或代码。
- **零外部依赖**：纯原生 Node.js (ESM) + 原生前端 + Python 标准库实现，无任何第三方 npm/pip 依赖包。
- **分享级隐私保护**：单会话诊断 PNG 自动剥离所有用户输入、文件路径、项目名称及检测到的敏感凭证。
- **网络透明度**：零埋点、零遥测上报；仅在手动或静默检查版本更新时请求 GitHub Releases 公开接口（结果本地缓存 7 天）。

---

## ❓ 常见问题排查

<details>
<summary><strong>安装完成后没有看到 Token Usage 侧边栏面板？</strong></summary>

1. 确认 `~/.gemini/config/plugins/token-usage/plugin.json` 文件存在。
2. 打开 Antigravity → **Customizations / Plugins**，确认 **Token Usage** 处于启用状态。
3. 确认系统 `PATH` 中可以正常调用 `node`（Node.js 18+），以便 Sidecar 本地服务启动。
</details>

<details>
<summary><strong>面板估算的费用为什么和官方账单有差异？</strong></summary>

面板费用基于各模型家族（`Pro`、`Flash`、`Claude`、`GPT/Codex`）的默认百万 Token 单价进行 API 等效估算。你可以随时在右上角 **设置** 弹窗中修改单价、汇率（`USD`/`CNY`）以及你的实际订阅费用与周期。
</details>

<details>
<summary><strong>如何卸载 Token Usage？</strong></summary>

你可以直接对 Antigravity 说一句（*“帮我卸载 token-usage 插件”*），也可以在 **Customizations / Plugins** 中关闭/卸载，或手动删除 `~/.gemini/config/plugins/token-usage` 目录。
</details>

---

## 📚 项目文档与链接

- [项目架构导航（`.ai_map.md`）](./.ai_map.md)
- [GitHub 仓库](https://github.com/RanFeng/token-usage)
- [讨论区与路线图](https://github.com/RanFeng/token-usage/discussions)
