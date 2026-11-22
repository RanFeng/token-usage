<p align="center">
  <img src="./assets/logo.svg" alt="Token Usage Logo" width="88" height="88" />
</p>

<h1 align="center">Token Usage</h1>

<p align="center">
  <strong>Real-time token, context, cost & health analytics for <a href="https://antigravity.google">Antigravity</a> — 100% local, zero dependencies, privacy-first.</strong>
</p>

<p align="center">
  <strong>English</strong> ·
  <a href="./README.zh-CN.md">简体中文</a> ·
  <a href="./README.ja.md">日本語</a> ·
  <a href="./README.ko.md">한국어</a> ·
  <a href="./README.es.md">Español</a>
</p>

<p align="center">
  <a href="./plugin.json"><img src="https://img.shields.io/badge/version-1.1.0-blue.svg" alt="Version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="MIT License" /></a>
  <a href="./sidecars/token_panel/package.json"><img src="https://img.shields.io/badge/dependencies-zero-brightgreen.svg" alt="Zero Dependencies" /></a>
  <a href="#-privacy--security"><img src="https://img.shields.io/badge/privacy-100%25%20local-emerald.svg" alt="100% Local" /></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg" alt="Cross-Platform" />
</p>

---

## ⚡ Quick Install (Recommended: One Sentence to Your Agent)

You don't need to open a terminal, clone repositories, or copy files manually. **Just paste the sentence below directly into Antigravity Chat**, and let the Agent install and verify everything for you:

> ```text
> Install the Antigravity plugin from https://github.com/RanFeng/token-usage into ~/.gemini/config/plugins/token-usage (run sync.sh if available), verify the installed files, and give me the link to enable and open the Token Usage panel.
> ```

**What the Agent will do automatically:**
1. Clone `https://github.com/RanFeng/token-usage` to a local folder.
2. Sync the plugin bundle (`plugin.json`, `assets/`, `sidecars/`, `skills/`) into `~/.gemini/config/plugins/token-usage`.
3. Verify the installation and provide a direct link to Antigravity's **Customizations / Plugins** page so you can toggle **Token Usage** on with one click.

### 🔄 Updating in One Sentence

When a new version is released, simply tell Antigravity:

> ```text
> Update my token-usage plugin from https://github.com/RanFeng/token-usage to the latest version and sync it to ~/.gemini/config/plugins/token-usage.
> ```

<details>
<summary><strong>🛠️ Prefer Manual Installation (CLI)? Click to expand</strong></summary>

#### Prerequisites
- **Antigravity** installed
- **Node.js 18+** (runs the zero-dependency Sidecar web panel)
- **Python 3.8+** (runs the Chat Skill / CLI stats script)

#### macOS / Linux (Recommended with `sync.sh`)
```bash
git clone https://github.com/RanFeng/token-usage.git
cd token-usage
./sync.sh
```
Or clone directly into the Antigravity plugins directory:
```bash
git clone https://github.com/RanFeng/token-usage.git ~/.gemini/config/plugins/token-usage
```

#### Windows (PowerShell)
```powershell
git clone https://github.com/RanFeng/token-usage.git "$env:USERPROFILE\.gemini\config\plugins\token-usage"
```

#### Enable the Plugin
1. Open **Antigravity** → **Customizations / Plugins**.
2. Enable **Token Usage** (takes effect immediately, no restart needed).
3. Open the **Token Usage** auxiliary side panel (**Aux Pane**) in the sidebar.

</details>

---

## 📖 How to Use

Token Usage works in **three ways** — choose whichever fits your workflow best.

### 1. Live Sidecar Panel (Aux Pane)

Open the **Token Usage** panel in Antigravity's auxiliary sidebar for real-time visual analytics.

#### 📊 Current Tab — Live Session Inspector
- **Context Window Gauge**: Live view of used / remaining / limit tokens, cumulative `input`, `cache_read`, and `output` tokens, estimated API-equivalent cost, and cache savings.
- **Context Growth Curve**: Tracks context expansion turn-by-turn and automatically highlights **Compact** compression points.
- **Realtime Health Diagnostics**: Automatic, dismissible alerts for:
  - Near-Compact context (`≥80%` warning / `≥90%` critical)
  - Consecutive error-burn loops
  - Single-turn token spikes
  - Low prompt-cache hit rates
- **100% Local Lite DLP Secret Detection**: Scans local transcripts for 7 high-confidence credential patterns (`API Keys`, `AWS Keys`, `GitHub Tokens`, `Google Keys`, `JWT`, `Private Keys`, `DB URIs`). Raw secrets are **never stored or displayed** — only masked snippets with a one-click jump to the exact turn.
- **Per-Turn Breakdown & JSON Tree Viewer**:
  - Splits every turn into **Model Thinking time vs. Tool Execution time**, with model and tool attribution.
  - Supports keyword search and quick filters (`All` / `High` / `Errors` / `Media`).
  - Expand any tool call with the built-in searchable, collapsible **JSON Tree Viewer**.
- **Desensitized Session Diagnostic Card (PNG)**: Export or copy a 2× HiDPI diagnostic snapshot (context curve, tokens, cache rate, model/tool stats) — **100% anonymized with zero prompts, file paths, project names, or secrets**.

#### 📈 Overview Tab — 12+ Global & Trend Analytics
- **Subscription ROI Dashboard**: Click the subscription card to configure your plan (`$20 Pro` / `$100 Ultra` / `$200 Ultra` or any custom price, monthly/weekly cycle, and billing reset day). Track your ROI multiplier, end-of-month forecast, and total cache savings.
- **Activity & Coding Persona**: 90-day GitHub-style heatmap, 14-day daily bar chart, 24-hour coding persona & weekday/weekend split, global Top 10 models & tools, context health score, local achievements, and Hall of Fame.
- **Project Attribution**: Automatically infers your Top 10 active workspaces from tool file paths.
- **Local Multi-Tool Radar**: Lightweight, read-only local detection of session counts across **Claude Code**, **Codex**, **Cursor**, and **Gemini CLI**.
- **Retina Overview Report Card (PNG)**: Generate a customizable 2× HiDPI share card (Dark & Light themes, toggleable modules) and copy directly to your clipboard or save to `~/Downloads`.

#### 🕒 History Tab & Toolbar Actions
- **History Tab**: Browse and jump into any past Antigravity conversation.
- **Language Toggle (`EN / 中`)**: Switch the panel UI between English and Chinese in one click.
- **Settings Modal**:
  - Switch currency between `USD ($)` and `CNY (¥)` with an editable exchange rate.
  - Customize per-1M-token pricing for `Pro`, `Flash`, `Claude`, and `GPT/Codex` model families.
  - Check for plugin updates via GitHub Releases.
- **Export Modal**:
  - Export filtered billing ledgers (`This Month` / `Last 30 Days` / `All Time`) as UTF-8 BOM **CSV** or **JSON**.
  - Export the current session as Markdown or a desensitized summary directly to `~/Downloads`.

---

### 2. In-Chat Skill (`/token-usage` or Natural Language)

Once enabled, Antigravity automatically loads the bundled `token-usage` Skill. You can type `/token-usage` or simply ask in plain language:

- *"Summarize token usage for my last 10 sessions"*
- *"Show per-turn token breakdown for the current session"*
- *"Aggregate total token consumption by model"*
- *"Which 5 sessions consumed the most tokens?"*

---

### 3. Standalone CLI Script (`token_stats.py`)

You can also query your local transcripts directly from any terminal (Python 3 standard library only):

```bash
# 1. Summary across recent sessions (--sort: recent | tokens, --limit: default 15)
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py summary --limit 15 --sort recent

# 2. Per-turn breakdown for a single session (pass "latest", an 8-char ID prefix, or full UUID)
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py session latest

# 3. Global & per-model token totals
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py models
```

> **Token Definitions**: `input` = uncached prompt input tokens, `cache_read` = prompt-cache hit tokens, `output` = model-generated tokens (`total = input + output`, excluding cache reads unless specified).

---

## 🔒 Privacy & Security

- **100% Local & Read-Only**: Reads local Antigravity transcripts (`~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`) directly on your machine. Never modifies Antigravity binaries or uploads conversation data.
- **Zero External Dependencies**: Built strictly with Node.js ESM built-ins, vanilla HTML/CSS/Canvas/JS, and the Python standard library.
- **Privacy-Safe Sharing**: Session diagnostic PNGs strip all user prompts, file paths, workspace names, and detected credentials.
- **Network Transparency**: Zero telemetry or analytics. The optional *Check for Updates* action only queries GitHub's public Releases API (cached locally for 7 days).

---

## ❓ FAQ & Troubleshooting

<details>
<summary><strong>The Token Usage side panel doesn't appear after installation</strong></summary>

1. Verify the plugin files exist in `~/.gemini/config/plugins/token-usage/plugin.json`.
2. Open Antigravity → **Customizations / Plugins** and confirm **Token Usage** is enabled.
3. Make sure `node` (Node.js 18+) is available in your system `PATH` so the Sidecar server can start.
</details>

<details>
<summary><strong>Why do estimated costs differ from my subscription or API bill?</strong></summary>

Costs shown in the panel are API-equivalent estimates based on default per-1M-token rates for each model family (`Pro`, `Flash`, `Claude`, `GPT/Codex`). You can customize every model family's unit price, currency (`USD`/`CNY`), and your subscription plan/cycle anytime in the **Settings** modal.
</details>

<details>
<summary><strong>How do I uninstall Token Usage?</strong></summary>

You can ask Antigravity in one sentence (*"Uninstall the token-usage plugin"*), disable/uninstall it from **Customizations / Plugins**, or manually delete `~/.gemini/config/plugins/token-usage`.
</details>

---

## 📚 Architecture & Links

- [Project Architecture Map (`.ai_map.md`)](./.ai_map.md)
- [GitHub Repository](https://github.com/RanFeng/token-usage)
- [Discussions & Roadmap](https://github.com/RanFeng/token-usage/discussions)
