# Reelora ChatGPT Skill Package

This directory contains supporting resources bundled with the installable Reelora skill ZIP.

The generated ZIP contains a top-level `reelora/` folder with:

- `SKILL.md` — the skill instructions ChatGPT reads;
- `references/` — preservation, editing, shot-distribution, and feature documentation;
- `scripts/check_reelora_runtime.py` — a non-destructive runtime capability check.

The skill can guide ChatGPT by itself, but actual MP4 rendering requires either:

1. a Reelora MCP backend exposing tools such as `reelora_edit`, or
2. an execution environment where deterministic FFmpeg video processing is available.

The skill must never pretend a render occurred if neither execution path exists.
