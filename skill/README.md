# Reelora ChatGPT Skill Package

This directory contains the supporting resources bundled with the installable Reelora Skill ZIP.

The generated ZIP contains a top-level `reelora/` folder with:

- `SKILL.md` — the Skill instructions ChatGPT reads;
- `references/` — preservation, editing, shot-distribution, feature, automatic-music, and transition documentation;
- `scripts/check_reelora_runtime.py` — non-destructive FFmpeg/FFprobe capability check;
- `scripts/reelora_edit.py` — executable deterministic FFmpeg fallback editor.

## Rendering paths

Reelora can be invoked in an ordinary ChatGPT conversation or in Work. The packaged `agents/openai.yaml` enables implicit invocation and provides a `$reelora` starter prompt. Do not require a Work-mode switch when the current Chat already exposes an executable media runtime.

A finished MP4 should use one of these paths:

1. Reelora MCP backend exposing `reelora_edit`, or
2. the bundled `scripts/reelora_edit.py` when Python + FFmpeg + FFprobe are available.

For multiple uploaded generated videos, prefer `reelora_remix_ai_videos` and include every upload; use `reelora_remix_ai_video` only for exactly one. The fallback accepts repeated `--input` arguments with `--remix-ai-video`. Every upload must contribute footage and the source-usage audit must confirm this. It preserves chronological order while making real trims and pacing changes in `re_edit`; `recreate` must reorder existing moments when enough scenes exist. A 94%-or-higher visual match to a single source is rejected as pass-through. Landscape input is automatically converted to 1080x1920 using tracked smart crop or a real-pixel blurred-fill fallback without stretching.

The Skill must not stop at instructions when an executable path is available, and must never claim a render occurred when neither path ran.

## Automatic audio replacement

By default, product/fashion auto-editing strips/ignores raw clip audio and adds one coherent music bed unless the user explicitly requests silence, original/natural audio, or a synchronized mix.

If no music file is supplied, the bundled editor can generate a sample-free trend-inspired Reelora original instrumental. If the user supplies a song, the editor maps that song into the final MP4 instead.

The final render should be verified so that:

- it contains an audio stream;
- the renderer reports `source_audio_replaced: true`;
- the expected `music_source` is present.
- measured audio peak is above -55 dBFS when music is expected.

Generated-video remix audits must also report `materially_reedited: true`, the selected source windows, and visual similarity below 0.94 for a single source. Supplied outro/logo media stays at the end and is never converted into a persistent watermark.

## Transition philosophy

Modern Reelora edits are cut-led with selected premium transition moments.

Use mostly clean beat cuts and variable shot lengths, then add sparse liquid-splash, ink-bloom, prism-refraction, particle-crystallize, light-sweep, glass-ripple, silk-fold, or luma-bloom moments. Real-pixel animation may use product parallax, macro orbit, editorial depth, hero breathe, kinetic arc, or silk camera float. Avoid swing, slide, bounce, long dissolves, repeated wipes, identical timing, and obvious effects on every cut.

All video processing must remain deterministic and use real source pixels only. Never regenerate the model, product, fabric, background, hands, face, logo, or print.
