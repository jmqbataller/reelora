# Changelog

All notable changes to Reelora are documented here.

## [0.7.0] - 2026-08-15

### Added

- `reelora_remix_ai_video` MCP tool for re-editing or recreating one uploaded AI-generated video as a finished Reel.
- `re_edit` mode that preserves chronological story order while trimming and rebuilding pacing.
- `recreate` mode that reinterprets the sequence from the strongest existing source moments without generating new scenes.
- Automatic orientation metadata and landscape-to-1080x1920 Reels conversion.
- Tracked subject/product smart crop plus a full-frame blurred-fill fallback derived only from the uploaded source pixels.
- Optional outro support for AI-video remix jobs.
- Matching `--remix-ai-video`, `--remix-mode`, and `--landscape-reframe` controls in the executable Skill fallback.
- TypeScript/Python selector coverage and a real FFmpeg landscape remix smoke test path.

### Preservation

- “Recreate” rebuilds the edit structure only; it never generates replacement scenes, frames, products, models, backgrounds, or missing side content.
- Landscape reframing never stretches or squashes the source.
- Blurred fill is made from the same uploaded source frame and remains compatible with strict no-generative mode.

## [0.6.0] - 2026-08-15

### Added

- Eight FFmpeg-validated premium transition families: liquid splash, ink bloom, prism refraction, particle crystallize, light sweep, glass ripple, silk fold, and luma bloom.
- Premium real-pixel animation directions for hero breathing, product parallax, macro orbit, editorial depth, kinetic product arcs, and silk camera movement.
- `premium_fx` transition mode, `subtle|balanced|bold` intensity, transition-family allowlists, animation enable/disable, and animation intensity controls in the TypeScript/MCP contract.
- Matching premium-effect behavior and CLI controls in the executable ChatGPT Skill fallback.
- Transition-family and animation metadata in render audits.
- TypeScript/Python selector tests and an FFmpeg compatibility test for every premium transition primitive.

### Changed

- Removed generic `smoothleft` / `smoothright` selection from the automatic premium transition engine.
- Reworked default effect scheduling so clean beat cuts carry the sequence while designed transition moments appear sparsely.
- Protected the supplied ending with a dedicated outro-safe dip.
- Added square-pixel normalization after animated crop/scale transforms to prevent display-aspect distortion.

### Preservation

- Premium effects transform only real uploaded frames through deterministic FFmpeg filters.
- Reelora does not synthesize literal water, ink, glass, particles, fabric, products, models, backgrounds, or replacement frames.
- Existing product, fabric, color, logo, face, body, crop-safety, and no-overlay rules remain mandatory.

## [0.5.1] - 2026-08-14

### Fixed

- Fixed the standalone ChatGPT Skill package not actually carrying the executable Reelora music/transition renderer. The ZIP now includes `scripts/reelora_edit.py` instead of only instructions plus a runtime checker.
- Fixed default audio replacement behavior so the executable Skill fallback renders source clips without their original audio and maps either user-supplied music or a Reelora-generated trend-inspired instrumental into the final MP4.
- Added mandatory post-render verification for audio stream presence and `source_audio_replaced: true`.
- Reworked fashion/ecommerce transitions away from slow/repeated template-style dissolves toward mostly clean beat cuts with rare micro-whip/micro-dip accents.
- Reworked shot pacing so planned shot durations vary instead of repeating near-identical timing across the Reel.
- Reduced transition effect durations to roughly 0.025–0.10 seconds for modern social edits.
- Changed the Skill fallback flash behavior to one restrained short brightness accent in a short Reel rather than repeated flashes.

### Added

- Executable deterministic Skill fallback: `reelora/scripts/reelora_edit.py`.
- JSON render audit containing output path, duration, BPM, music mood/source, `source_audio_replaced`, and transition timing/type information.
- Release ZIP verification now requires the executable editor and checks that `manifest.json` points to it.

### Transition direction

The v0.5.1 default philosophy is intentionally cut-driven:

- mostly clean beat cuts;
- variable shot lengths;
- occasional micro-motion/whip accent approximately every 5–7 transitions at most;
- optional very short fade-black/micro-dip;
- no long repeated fashion dissolves;
- no obvious effect on every cut.

### Audio behavior

Unless the user explicitly requests silence, original/natural audio, or a synchronized mix, Reelora automatic editing should replace source clip audio with one coherent music bed.

If a music file is supplied, it is used as the final music bed. If no music is supplied, Reelora may generate a sample-free trend-inspired original instrumental.

### Local Skill fallback example

```bash
python3 scripts/reelora_edit.py \
  --input raw-1.mp4 \
  --input raw-2.mp4 \
  --outro outro.mp4 \
  --output final.mp4 \
  --style fashion \
  --highlight top_wear
```

## [0.5.0] - 2026-08-14

### Added

- Trend-inspired original music engine for automatic Reel soundtracks.
- Music directions for viral fashion, luxury runway, clean pop, Y2K pop, phonk-lite, UK garage, Jersey Club, afrobeat-inspired, dreamy viral, dark streetwear, and commercial pop.
- Context-aware music selection using editing style and requested product highlight.
- Multi-section original instrumentals with intro, build, drop, break, and final-lift behavior instead of a single generic loop.
- Sparse, restrained flash accents around selected transitions.
- Environment controls for automatic music and flash behavior:
  - `REELORA_AUTO_MUSIC`
  - `REELORA_MUSIC_LIBRARY`
  - `REELORA_SUBTLE_FLASH`
  - `REELORA_FLASH_CADENCE`
  - `REELORA_FLASH_STRENGTH`
- Updated ChatGPT Skill instructions for automatic trend-inspired music and restrained flash effects.

### Changed

- Automatic music now prefers a verified commercial-use local library when configured, then falls back to Reelora's sample-free trend-inspired original engine.
- Music selection is no longer based only on a generic style BPM target; the requested highlight can influence the selected vibe.
- Transition effects remain preservation-first and use real source pixels only.
- Flash accents use a small brightness lift rather than full-white frames or repeated strobing.

### Safety and preservation

- No third-party TikTok song or copyrighted recording is bundled by the trend-inspired generator.
- Trend directions are style inspirations only and must not reproduce a specific copyrighted melody, recording, or sample.
- Product, model, fabric, logo, print, color, and body/face integrity guards remain unchanged.
- No overlay text, overlay objects, or AI voice-over are added by automatic editing.

### Packaging

Build the installable ChatGPT Skill ZIP locally with:

```bash
npm install
npm run check
npm run pack:skill
```

Expected output:

```text
dist-skill/reelora-skill-v0.5.0.zip
```

## [0.4.0]

- Added automatic premium music replacement, verified music-rights library support, sample-free original beat fallback, beat-aware pacing, and style-aware FFmpeg transitions.

## [0.3.0]

- Expanded the preservation-first architecture with capability status, vision observations, reference Reel editing DNA, revision controls, diagnostics, and timeline exports.
