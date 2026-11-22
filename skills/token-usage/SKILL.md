---
name: token-usage
description: Inspect exact input, cache-read, and output token consumption across Antigravity sessions and per-turn conversations from local transcript logs. Use when the user asks about token usage, token cost, session token totals, or per-turn token breakdowns.
---

# Token Usage

Analyze local Antigravity conversation transcripts (`~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`) using the bundled `scripts/token_stats.py` script.

## Commands

Run `scripts/token_stats.py` via `run_command`:

1. **Summary across sessions** (sorted by recent or total tokens):
   ```bash
   python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py summary --limit 15 --sort recent
   ```
   - `--sort`: `recent` (default) or `tokens`
   - `--limit`: number of sessions to show (default `15`)

2. **Per-turn breakdown for a single session**:
   ```bash
   python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py session <conversation-id-or-prefix>
   ```
   - Pass `latest` or an 8-character ID prefix (or the full UUID) to inspect every `USER_INPUT` turn and its `input_tokens`, `cache_read_tokens`, `output_tokens`, and models used.

3. **Global & per-model totals**:
   ```bash
   python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py models
   ```

## Output Guidelines

- Present results in a clean Markdown table with comma-formatted numbers.
- Briefly note that `input` is uncached prompt input, `cache_read` is prompt-cache hits, and `output` is model output (`total = input + output`, excluding cache reads unless the user asks for `input + cache_read + output`).
