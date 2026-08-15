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

For one uploaded generated video, prefer the MCP `reelora_remix_ai_video` tool or run the fallback with `--remix-ai-video`. It can preserve source order (`re_edit`) or rebuild the sequence from existing moments (`recreate`). Landscape input is automatically converted to 1080x1920 using tracked smart crop or a real-pixel blurred-fill fallback without stretching.

The Skill must not stop at instructions when an executable path is available, and must never claim a render occurred when neither path ran.

## Automatic audio replacement

By default, product/fashion auto-editing strips/ignores raw clip audio and adds one coherent music bed unless the user explicitly requests silence, original/natural audio, or a synchronized mix.

If no music file is supplied, the bundled editor can generate a sample-free trend-inspired Reelora original instrumental. If the user supplies a song, the editor maps that song into the final MP4 instead.

The final render should be verified so that:

- it contains an audio stream;
- the renderer reports `source_audio_replaced: true`;
- the expected `music_source` is present.

## Transition philosophy

Modern Reelora edits are cut-led with selected premium transition moments.

Use mostly clean beat cuts and variable shot lengths, then add sparse liquid-splash, ink-bloom, prism-refraction, particle-crystallize, light-sweep, glass-ripple, silk-fold, or luma-bloom moments. Real-pixel animation may use product parallax, macro orbit, editorial depth, hero breathe, kinetic arc, or silk camera float. Avoid swing, slide, bounce, long dissolves, repeated wipes, identical timing, and obvious effects on every cut.

All video processing must remain deterministic and use real source pixels only. Never regenerate the model, product, fabric, background, hands, face, logo, or print.
