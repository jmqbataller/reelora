# Changelog

All notable changes to Reelora are documented here.

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
