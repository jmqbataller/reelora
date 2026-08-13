# Reelora

**Raw footage in. Quality Reel out.**

Reelora is a ChatGPT skill adapter specification for automatically turning uploaded raw product/fashion videos into polished vertical Reels while strictly preserving the original model, product, fabric, logo, color, fit, and construction.

The intended workflow is simple:

1. Upload one or more raw videos.
2. Upload the ending/outro video.
3. Give a short direction such as `Highlight the top wear`.
4. Reelora handles clip analysis, best-shot selection, trimming, cropping/reframing, sequencing, transitions, fade-in/fade-out, pacing, and final outro placement.

## Core principles

- Never regenerate or redesign the model or product.
- Never alter the fabric texture, garment construction, color, print, logo, tags, fit, straps, sleeves, or proportions.
- No overlay text.
- No overlay objects, stickers, icons, decorative graphics, or generated elements.
- No AI voice-over or narration.
- Use real editing techniques only: cuts, trims, crops, reframing, stabilization, speed changes, transitions, fades, audio/music, and conservative color/exposure correction.
- When preservation conflicts with visual enhancement, **preservation always wins**.

## Default output

- Format: MP4 / H.264
- Resolution: 1080 × 1920
- Aspect ratio: 9:16
- Intended platforms: Instagram Reels, TikTok, YouTube Shorts, Facebook Reels

## Top-wear highlight rule

When the user says `Highlight the top wear`, Reelora uses this final-shot distribution:

- **70% top-wear-focused shots**
- **20% whole-body shots**
- **10% supporting detail shots**

Total: **100%**.

See [`SKILL.md`](./SKILL.md) for the full behavior specification.

## Planned architecture

```text
User raw videos + outro
        ↓
Video inspection
        ↓
Candidate shot detection
        ↓
Quality + relevance scoring
        ↓
Best clip selection
        ↓
Smart crop / reframing
        ↓
Reel sequencing
        ↓
Transitions + fade in/out
        ↓
Conservative color/audio polish
        ↓
Preservation validation
        ↓
Outro
        ↓
1080×1920 MP4
```

## Repository structure

```text
reelora/
├── README.md
├── SKILL.md
├── docs/
│   ├── EDITING_RULES.md
│   ├── PRESERVATION.md
│   └── SHOT_DISTRIBUTION.md
└── examples/
    └── TOP_WEAR_REEL.md
```

## Example command

```text
Make these raw videos into a quality Reel. Highlight the top wear. Use the uploaded ending video as the outro. Do not change the model, product, or fabric. No overlay text, no overlay object, and no voice-over.
```

Reelora should not require the user to manually provide timestamps or choose the best clips. The skill is responsible for doing the editing decisions automatically.