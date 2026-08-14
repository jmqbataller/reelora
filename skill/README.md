# Reelora ChatGPT Skill Package

This directory contains the supporting resources bundled with the installable Reelora Skill ZIP.

The generated ZIP contains a top-level `reelora/` folder with:

- `SKILL.md` — the Skill instructions ChatGPT reads;
- `references/` — preservation, editing, shot-distribution, feature, automatic-music, and transition documentation;
- `scripts/check_reelora_runtime.py` — non-destructive FFmpeg/FFprobe capability check;
- `scripts/reelora_edit.py` — executable deterministic FFmpeg fallback editor.

## Rendering paths

A finished MP4 should use one of these paths:

1. Reelora MCP backend exposing `reelora_edit`, or
2. the bundled `scripts/reelora_edit.py` when Python + FFmpeg + FFprobe are available.

The Skill must not stop at instructions when an executable path is available, and must never claim a render occurred when neither path ran.

## Automatic audio replacement

By default, product/fashion auto-editing strips/ignores raw clip audio and adds one coherent music bed unless the user explicitly requests silence, original/natural audio, or a synchronized mix.

If no music file is supplied, the bundled editor can generate a sample-free trend-inspired Reelora original instrumental. If the user supplies a song, the editor maps that song into the final MP4 instead.

The final render should be verified so that:

- it contains an audio stream;
- the renderer reports `source_audio_replaced: true`;
- the expected `music_source` is present.

## Transition philosophy

Modern Reelora edits are cut-driven, not transition-driven.

Use mostly clean beat cuts, variable shot lengths, occasional very short micro-whip/motion or fade-black accents, and at most a restrained flash accent around a strong beat/drop. Avoid long dissolves, repeated wipes, identical timing, and obvious effects on every cut.

All video processing must remain deterministic and use real source pixels only. Never regenerate the model, product, fabric, background, hands, face, logo, or print.
