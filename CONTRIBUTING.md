# Contributing to Token Usage

Thank you for your interest in contributing to **Token Usage**! We welcome bug reports, feature suggestions, translations, documentation improvements, and pull requests.

## Core Principles

Before making changes, please keep these project principles in mind:

1. **100% Local & Read-Only**: Never upload conversation transcripts, telemetry, or user data to any external server, and never modify Antigravity binaries or transcript files.
2. **Zero External Dependencies**: The Sidecar uses pure Node.js ESM built-ins and vanilla HTML/CSS/JS; the Skill CLI uses only the Python 3 standard library. Do not add third-party `npm` or `pip` dependencies.
3. **Privacy-First**: Any new DLP scanner or share card feature must never store or expose raw secrets, prompts, or local file paths in anonymized outputs.
4. **Keep `.ai_map.md` in Sync**: When adding, deleting, or renaming files or changing core logic, update the corresponding `.ai_map.md`.

## Local Development Setup

```bash
# 1. Clone your fork
git clone https://github.com/<your-username>/token-usage.git
cd token-usage

# 2. Sync the plugin to your local Antigravity plugins directory
./sync.sh

# 3. Verify Node.js and Python syntax
node --check sidecars/token_panel/*.mjs sidecars/token_panel/*.js
python3 -m py_compile skills/token-usage/scripts/token_stats.py
```

After running `./sync.sh`, reload or reopen the **Token Usage** Aux Pane in Antigravity to test your changes live.

## Submitting a Pull Request

1. Create a descriptive feature branch from `main` (e.g. `feat/export-filter` or `fix/compact-detection`).
2. Keep commits focused and clear (Conventional Commits style preferred: `feat:`, `fix:`, `docs:`, `chore:`).
3. Make sure CI checks pass locally before opening a PR.
4. Fill out the Pull Request template with a clear description and screenshots if UI changed.

## Discussions & Support

- Have a question, idea, or roadmap vote? Join [GitHub Discussions](https://github.com/RanFeng/token-usage/discussions).
- Found a bug or want to request a feature? Open an [Issue](https://github.com/RanFeng/token-usage/issues).
