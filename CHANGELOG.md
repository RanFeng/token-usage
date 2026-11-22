# Changelog

All notable changes to **Token Usage** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-22

### Added
- **Live Sidecar Panel (Aux Pane)**: Real-time context window gauge, cumulative `input` / `cache_read` / `output` tokens, API-equivalent cost & cache savings, context growth curve with automatic **Compact** markers, per-turn timing breakdown (model thinking vs. tool execution), keyword search, filters, and interactive JSON Tree Viewer.
- **12+ Trend Overview Analytics**: Subscription ROI dashboard (custom plan, monthly/weekly billing cycle & reset day), end-of-month forecast, 90-day activity heatmap, 14-day bar chart, 24-hour coding persona, Top 10 models & tools, context health score, local achievements, Hall of Fame, Project Attribution (Top 10 workspaces), and Local Multi-Tool Radar (Claude Code / Codex / Cursor / Gemini CLI).
- **Realtime Health Diagnostics**: Automatic alerts for near-Compact context (`≥80%` / `≥90%`), error-burn loops, single-turn token spikes, and low cache hit rates.
- **100% Local Lite DLP Secret Detection**: Scans local transcripts for 7 credential types (`API Keys`, `AWS Keys`, `GitHub Tokens`, `Google Keys`, `JWT`, `Private Keys`, `DB URIs`) with masked-only display and one-click jump-to-turn inspection.
- **2× Retina Canvas PNG Share Cards**: Customizable Overview Report Card (Dark/Light themes) and 100% anonymized Session Diagnostic Card, with native clipboard copy and `~/Downloads` export.
- **Bilingual, Multi-Currency & Custom Pricing**: One-click `EN / 中` toggle, `USD ($)` / `CNY (¥)` with editable FX rate, and custom per-1M-token pricing per model family.
- **Billing Export**: UTF-8 BOM CSV & JSON billing exports (`This Month` / `Last 30 Days` / `All Time`) plus Markdown & desensitized session exports.
- **In-Chat Skill & Standalone CLI**: Bundled `skills/token-usage` Skill and zero-dependency Python 3 `token_stats.py` (`summary`, `session`, `models`).
- **Multi-Language Documentation**: Full README guides in English, Simplified Chinese, Japanese, Korean, and Spanish with one-sentence Antigravity Agent installation.
- **Open-Source Infrastructure**: MIT License, GitHub Issue/PR templates, CI validation workflow, and automated GitHub Releases packaging workflow.
