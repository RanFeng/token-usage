#!/usr/bin/env python3
"""Aggregate token usage from local Antigravity transcript.jsonl files."""

import argparse
import glob
import json
import os
from collections import defaultdict
from datetime import datetime

BRAIN_DIR = os.path.expanduser("~/.gemini/antigravity/brain")
TRANSCRIPT_GLOB = os.path.join(BRAIN_DIR, "*", ".system_generated", "logs", "transcript.jsonl")


def iter_jsonl(path):
    """Yield parsed JSON objects from a transcript file, skipping malformed lines."""
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def extract_title(record, current_title):
    """Return the first non-empty user prompt snippet as the session title."""
    if current_title or record.get("type") != "USER_INPUT":
        return current_title
    text = (record.get("content") or "").replace("\n", " ").strip()
    return text[:48] + ("..." if len(text) > 48 else "")


def summarize_file(path):
    """Compute token totals and metadata for a single transcript file."""
    cid = path.split(os.sep)[-4]
    inp = cache = out = turns = 0
    title = ""
    for rec in iter_jsonl(path):
        title = extract_title(rec, title)
        turns += 1 if rec.get("type") == "USER_INPUT" else 0
        inp += rec.get("input_tokens") or 0
        cache += rec.get("cache_read_tokens") or 0
        out += rec.get("output_tokens") or 0
    mtime = os.path.getmtime(path)
    return {
        "cid": cid, "title": title or "(empty)", "turns": turns,
        "input": inp, "cache": cache, "output": out,
        "total": inp + out, "mtime": mtime,
    }


def cmd_summary(limit, sort_by):
    """Print a table of sessions ordered by recency or total tokens."""
    rows = [summarize_file(p) for p in glob.glob(TRANSCRIPT_GLOB)]
    key_fn = (lambda r: r["total"]) if sort_by == "tokens" else (lambda r: r["mtime"])
    rows.sort(key=key_fn, reverse=True)
    print(f"Total sessions: {len(rows)} | Showing top {min(limit, len(rows))} (sort={sort_by})\n")
    print(f"{'ID':<10} {'Updated':<16} {'Turns':>5} {'Input':>10} {'Cache':>11} {'Output':>9} {'Total(In+Out)':>13}  Title")
    print("-" * 105)
    for r in rows[:limit]:
        dt = datetime.fromtimestamp(r["mtime"]).strftime("%Y-%m-%d %H:%M")
        print(f"{r['cid'][:8]:<10} {dt:<16} {r['turns']:>5} {r['input']:>10,} {r['cache']:>11,} {r['output']:>9,} {r['total']:>13,}  {r['title']}")


def resolve_transcript(target):
    """Resolve 'latest', an ID prefix, or a full ID to a transcript path."""
    files = sorted(glob.glob(TRANSCRIPT_GLOB), key=os.path.getmtime, reverse=True)
    if not files:
        return None
    if target == "latest":
        return files[0]
    matches = [f for f in files if f.split(os.sep)[-4].startswith(target)]
    return matches[0] if matches else None


def flush_turn(turn_idx, prompt, stats):
    """Print a single turn's token summary."""
    total = stats["input"] + stats["output"]
    print(f"Turn {turn_idx:<3} | in={stats['input']:>8,} | cache={stats['cache']:>9,} | out={stats['output']:>7,} | total={total:>8,} | {prompt}")


def cmd_session(target):
    """Print per-turn token breakdown for one conversation."""
    path = resolve_transcript(target)
    if not path:
        print(f"No transcript found matching: {target}")
        return
    cid = path.split(os.sep)[-4]
    print(f"Session: {cid}\n")
    turn, prompt = 0, ""
    stats = {"input": 0, "cache": 0, "output": 0}
    totals = {"input": 0, "cache": 0, "output": 0}
    for rec in iter_jsonl(path):
        if rec.get("type") == "USER_INPUT":
            if turn > 0:
                flush_turn(turn, prompt, stats)
            turn += 1
            prompt = (rec.get("content") or "").replace("\n", " ").strip()[:55]
            stats = {"input": 0, "cache": 0, "output": 0}
            continue
        for k, field in [("input", "input_tokens"), ("cache", "cache_read_tokens"), ("output", "output_tokens")]:
            val = rec.get(field) or 0
            stats[k] += val
            totals[k] += val
    if turn > 0:
        flush_turn(turn, prompt, stats)
    print("-" * 95)
    print(f"Total    | in={totals['input']:>8,} | cache={totals['cache']:>9,} | out={totals['output']:>7,} | total={totals['input'] + totals['output']:>8,}")


def cmd_models():
    """Aggregate token usage across all sessions grouped by model."""
    by_model = defaultdict(lambda: {"steps": 0, "input": 0, "cache": 0, "output": 0})
    for path in glob.glob(TRANSCRIPT_GLOB):
        for rec in iter_jsonl(path):
            model = rec.get("model")
            if not model:
                continue
            bucket = by_model[model]
            bucket["steps"] += 1
            bucket["input"] += rec.get("input_tokens") or 0
            bucket["cache"] += rec.get("cache_read_tokens") or 0
            bucket["output"] += rec.get("output_tokens") or 0
    print(f"{'Model':<42} {'Steps':>7} {'Input':>12} {'Cache':>13} {'Output':>11} {'Total(In+Out)':>14}")
    print("-" * 105)
    for model, s in sorted(by_model.items(), key=lambda kv: kv[1]["input"] + kv[1]["output"], reverse=True):
        print(f"{model:<42} {s['steps']:>7,} {s['input']:>12,} {s['cache']:>13,} {s['output']:>11,} {s['input'] + s['output']:>14,}")


def main():
    """Parse CLI arguments and dispatch subcommands."""
    parser = argparse.ArgumentParser(description="Antigravity Token Usage")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_sum = sub.add_parser("summary")
    p_sum.add_argument("--limit", type=int, default=15)
    p_sum.add_argument("--sort", choices=["recent", "tokens"], default="recent")
    p_ses = sub.add_parser("session")
    p_ses.add_argument("target", nargs="?", default="latest")
    sub.add_parser("models")
    args = parser.parse_args()
    if args.cmd == "summary":
        cmd_summary(args.limit, args.sort)
    elif args.cmd == "session":
        cmd_session(args.target)
    else:
        cmd_models()


if __name__ == "__main__":
    main()
