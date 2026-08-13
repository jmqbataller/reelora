# Reelora ChatGPT Skill Package

This directory contains supporting resources bundled with the installable Reelora skill ZIP.

The generated ZIP contains a top-level `reelora/` folder with:

- `SKILL.md` — the skill instructions ChatGPT reads;
- `references/` — preservation, editing, shot-distribution, feature, automatic-music, and premium-transition documentation;
- `scripts/check_reelora_runtime.py` — a non-destructive runtime capability check.

The skill can guide ChatGPT by itself, but actual MP4 rendering requires either:

1. a Reelora MCP backend exposing tools such as `reelora_edit`, or
2. an execution environment where deterministic FFmpeg video processing is available.

Current automatic audio behavior can replace raw clip sound with a premium music bed. Reelora first prefers a local track with explicit commercial-use rights metadata; otherwise it can generate a sample-free procedural Reelora Original Beat. User-supplied music is accepted, but Reelora does not claim that an unverified supplied/random track is copyright-free.

Premium transitions use deterministic FFmpeg transitions and real source pixels only. They must not regenerate the model, product, fabric, background, hands, face, logo, or print.

The skill must never pretend a render occurred if neither execution path exists.
