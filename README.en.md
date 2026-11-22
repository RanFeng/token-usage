<p align="center">
  <img src="./assets/logo.svg" alt="Token Usage Logo" width="88" height="88" />
</p>

<h1 align="center">Token Usage</h1>

<p align="center">
  <strong>Stop flying blind on tokens — Real-time context gauge, subscription ROI, health diagnostics & local DLP analytics for <a href="https://antigravity.google">Antigravity</a>.</strong><br />
  <sub>100% Local & Read-Only · Zero Dependencies · Privacy-First · Out-of-the-Box</sub>
</p>

<p align="center">
  <a href="./README.md">简体中文</a> ·
  <strong>English</strong> ·
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

<p align="center">
  <img src="./assets/screenshots/hero-banner.jpg" alt="Token Usage Hero Banner" width="100%" />
</p>

---

## 🎯 Why Developers Love Token Usage

AI coding is fast — until context fills up, tools loop, or you wonder if your plan is paying off:

| Everyday Pain Point | How Token Usage Solves It |
| :--- | :--- |
| 😵 **Sudden context overflow / Compact amnesia** | Live context gauge (used / remaining / limit), growth curve with auto-marked **Compact** points, and proactive `80% / 90%` alerts |
| 💸 **Not sure if your subscription is paying off** | Built-in **Subscription ROI Dashboard** (`$20 Pro / $100 Ultra / $200 Ultra` or custom cycle) with ROI multiplier & cache-savings tracker |
| 🐌 **A turn took 20s — is it the model or a tool?** | Per-turn **Model Thinking vs. Tool Execution** timing split plus an interactive **JSON Tree Viewer** for every tool call |
| 🔐 **Worried about accidental API key leaks in logs** | **100% Local Lite DLP** scans 7 credential types in-memory — raw secrets are never stored or shown, with one-click jump-to-turn |
| 📊 **Need project billing or a shareable recap card** | Automatic **Top 10 Workspace Attribution**, one-click CSV/JSON billing export, and **2× Retina anonymized PNG share cards** |

---

## ⚡ 10-Second Install (Recommended: One Sentence to Your Agent)

No terminal needed. **Just paste this single sentence into Antigravity Chat**, and let the Agent install, sync, verify, and give you the enable link:

> ```text
> Install the Antigravity plugin from https://github.com/RanFeng/token-usage into ~/.gemini/config/plugins/token-usage (run sync.sh if available), verify the installed files, and give me the link to enable and open the Token Usage panel.
> ```

**What the Agent does automatically:**
1. Clones `https://github.com/RanFeng/token-usage`.
2. Syncs the plugin bundle into `~/.gemini/config/plugins/token-usage`.
3. Verifies the install and gives you a direct link to **Customizations / Plugins** to toggle **Token Usage** on (live, no restart).

> **🔄 Update anytime in one sentence**:
> `Update my token-usage plugin from https://github.com/RanFeng/token-usage to the latest version and sync it to ~/.gemini/config/plugins/token-usage.`

<details>
<summary><strong>🛠️ Prefer Manual CLI Installation? Click to expand (macOS / Linux / Windows)</strong></summary>

#### Prerequisites
- **Antigravity** installed
- **Node.js 18+** (Sidecar live web panel)
- **Python 3.8+** (Chat Skill & CLI script)

#### macOS / Linux (Recommended with `sync.sh`)
```bash
git clone https://github.com/RanFeng/token-usage.git
cd token-usage
./sync.sh
```
Or clone directly:
```bash
git clone https://github.com/RanFeng/token-usage.git ~/.gemini/config/plugins/token-usage
```

#### Windows (PowerShell)
```powershell
git clone https://github.com/RanFeng/token-usage.git "$env:USERPROFILE\.gemini\config\plugins\token-usage"
```

#### Enable the Panel
Open **Antigravity** → **Customizations / Plugins** → enable **Token Usage** → open **Token Usage** in the auxiliary sidebar (**Aux Pane**).

</details>

---

## ✨ Visual Feature Tour

### 1. Live Context Telemetry & Per-Turn X-Ray (Current Tab)

<p align="center">
  <img src="./assets/screenshots/live-telemetry.jpg" alt="Live Context Telemetry and Per-Turn Breakdown" width="100%" />
</p>

- **Live Context Gauge**: Real-time used / remaining / limit ratio, cumulative `input`, `cache_read`, and `output` tokens, estimated API cost, and cache savings.
- **Context Growth Curve & Compact Detection**: Tracks turn-by-turn expansion and highlights **Compact** compression points automatically.
- **Dual Timing & JSON Tree Viewer**: Splits **Model Thinking vs. Tool Execution** latency, with keyword search, quick filters (`All / High / Errors / Media`), and a collapsible JSON Tree Viewer.

---

### 2. 12+ Trend Overview & Subscription ROI Dashboard (Overview Tab)

<p align="center">
  <img src="./assets/screenshots/trend-overview.jpg" alt="12+ Trend Overview and Subscription ROI" width="100%" />
</p>

- **Subscription ROI at a Glance**: Configure `$20 Pro / $100 Ultra / $200 Ultra` or any custom monthly/weekly plan & reset day to track ROI multiplier, end-of-month forecast, and cache savings.
- **Global Coding Insights**: 90-day GitHub-style activity heatmap, 14-day daily bar chart, 24-hour coding persona (weekday vs. weekend), Top 10 models & tools, context health score, local achievements, and Hall of Fame.
- **Bilingual, Multi-Currency & Custom Pricing**: One-click `EN / 中` and `USD ($) / CNY (¥)` switching with editable FX rate and per-1M-token rates for `Pro`, `Flash`, `Claude`, and `GPT/Codex`.

---

### 3. Realtime Health Diagnostics & 100% Local Lite DLP

<p align="center">
  <img src="./assets/screenshots/health-dlp.jpg" alt="Realtime Health Diagnostics and 100% Local Lite DLP" width="100%" />
</p>

- **4 Realtime Health Alerts**: Catches **near-Compact (`≥80% / ≥90%`)**, **error-burn loops**, **single-turn token spikes**, and **low cache hit rates** before tokens go to waste.
- **7-Pattern Local Secret Scanner**: Scans locally for `API Keys`, `AWS Keys`, `GitHub Tokens`, `Google Keys`, `JWT`, `Private Keys`, and `DB URIs`. **Raw secrets are never stored or displayed** — only masked snippets with one-click jump-to-turn inspection.

---

### 4. Local Multi-Tool Radar & Project Billing Export

<p align="center">
  <img src="./assets/screenshots/radar-billing.jpg" alt="Local Multi-Tool Radar and Project Billing" width="100%" />
</p>

- **Top 10 Project Attribution**: Infers active workspaces from tool paths to break down tokens, API-equivalent cost, and cache savings per project.
- **One-Click Billing Export**: Export `This Month` / `Last 30 Days` / `All Time` ledgers in UTF-8 BOM **CSV** or **JSON**, plus Markdown & desensitized session reports directly to `~/Downloads`.
- **360° Local Multi-Tool Radar**: Lightweight read-only session counter for **Claude Code**, **Codex**, **Cursor**, and **Gemini CLI** (counts only — never reads third-party conversation text).

---

### 5. 2× Retina Share Cards & `/token-usage` In-Chat Skill

<p align="center">
  <img src="./assets/screenshots/share-skill.jpg" alt="2x Retina Share Cards and In-Chat Skill" width="100%" />
</p>

- **2× HiDPI Canvas Share Cards**: Generate customizable **Overview Report Cards** (Dark/Light themes, toggleable modules) and **100% Anonymized Session Diagnostic Cards** (zero prompts, paths, project names, or secrets), with one-click clipboard copy or download.
- **In-Chat `/token-usage` Skill**: Ask directly in Antigravity chat for clean Markdown usage tables without switching panes.

---

## 📖 Three Ways to Use

| Mode | Best For | How to Use |
| :--- | :--- | :--- |
| **1. Sidecar Live Panel (Aux Pane)** | Real-time context, ROI, heatmaps, DLP & billing export | Enable the plugin and open **Token Usage** in the auxiliary sidebar |
| **2. In-Chat Skill** | Quick summaries right inside chat | Type `/token-usage` or ask *"Summarize my last 10 sessions"* / *"Show per-turn breakdown"* / *"Aggregate tokens by model"* |
| **3. Standalone CLI Script** | Terminal queries & automation (Python 3 stdlib only) | See commands below |

```bash
# 1. Recent session summary (--sort: recent | tokens, --limit: default 15)
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py summary --limit 15 --sort recent

# 2. Per-turn breakdown ("latest", 8-char ID prefix, or full UUID)
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py session latest

# 3. Global & per-model totals
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py models
```

> **Token Definitions**: `input` = uncached prompt tokens, `cache_read` = prompt-cache hits, `output` = model output tokens (`total = input + output` by default).

---

## 🔒 Privacy & Security

- **100% Local & Read-Only**: Reads `~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript.jsonl` directly. Never modifies binaries or uploads conversations.
- **Zero External Dependencies**: Pure Node.js ESM built-ins + vanilla HTML/CSS/Canvas/JS + Python 3 stdlib.
- **Privacy-Safe Sharing**: Session diagnostic PNGs strip all prompts, file paths, workspace names, and credentials.
- **Zero Telemetry**: No analytics or tracking; the optional *Check for Updates* call only queries GitHub's public Releases API (cached locally for 7 days).

---

## ❓ FAQ

<details>
<summary><strong>The Token Usage side panel doesn't appear after installation</strong></summary>

1. Verify `~/.gemini/config/plugins/token-usage/plugin.json` exists.
2. Open Antigravity → **Customizations / Plugins** and confirm **Token Usage** is enabled.
3. Ensure `node` (Node.js 18+) is in your `PATH` so the Sidecar server can start.
</details>

<details>
<summary><strong>Why do estimated costs differ from my subscription or API bill?</strong></summary>

Displayed costs are API-equivalent estimates using default per-1M-token rates. You can customize unit prices, currency (`USD`/`CNY`), FX rate, and your subscription plan/cycle anytime in **Settings**.
</details>

<details>
<summary><strong>How do I uninstall Token Usage?</strong></summary>

Ask Antigravity (*"Uninstall the token-usage plugin"*), disable/uninstall it in **Customizations / Plugins**, or delete `~/.gemini/config/plugins/token-usage`.
</details>

---

## 🌟 Community & Support

If **Token Usage** helps you tame context limits or track your ROI, please give it a **Star ⭐**!

- 💬 **Ideas, Share Your ROI Cards & Roadmap Voting**: [GitHub Discussions](https://github.com/RanFeng/token-usage/discussions)
- 🐛 **Bug Reports & Feature Requests**: [GitHub Issues](https://github.com/RanFeng/token-usage/issues)
- 📖 **Docs**: [Architecture Map (`.ai_map.md`)](./.ai_map.md) · [Changelog](./CHANGELOG.md) · [Contributing](./CONTRIBUTING.md)
- 📄 **License**: [MIT License](./LICENSE)
