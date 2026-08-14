# Reelora

![Reelora CI](https://github.com/jmqbataller/reelora/actions/workflows/ci.yml/badge.svg)

**Raw footage in. Quality Reel out.**

Reelora is a preservation-first automatic Reel director, FFmpeg renderer, MCP adapter, and installable ChatGPT Skill for product/fashion videos.

Upload raw clips + a supplied ending/outro and give a short direction such as:

```text
Make these into a quality Reel. Highlight the top wear.
```

Reelora handles clip selection, cutting, rearrangement, product-focused reframing, pacing, trend-inspired automatic music, beat-aware timing, clean transitions, restrained flash accents, fade in/out, supplied-outro placement, validation, timeline/report exports, and final MP4 rendering without generating or replacing the original model, product, or fabric.

## Download the ChatGPT Skill

### Latest: Reelora v0.5.0

**[Download Reelora Skill v0.5.0 ZIP](https://github.com/jmqbataller/reelora/releases/download/v0.5.0/reelora-skill-v0.5.0.zip)**

Latest release page: **https://github.com/jmqbataller/reelora/releases/latest**

The ZIP is built automatically from this repository and contains a top-level `reelora/` skill folder with `SKILL.md`, manifest metadata, references, and non-destructive runtime helper scripts.

Release history: [`CHANGELOG.md`](./CHANGELOG.md)

Release verification steps: [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md)

## v0.5.0 highlights

Reelora v0.5.0 improves automatic soundtrack quality and adds restrained visual accents while keeping preservation rules strict.

### Trend-inspired automatic music

When the user does not supply music, Reelora can:

1. prefer a locally configured verified commercial-use music library, or
2. generate a sample-free Reelora original instrumental as the fallback.

Original directions include:

- viral fashion
- luxury runway
- clean pop
- Y2K pop
- phonk-lite
- UK garage
- Jersey Club
- afrobeat-inspired
- dreamy viral
- dark streetwear
- commercial pop

These are style inspirations only. Reelora does not bundle or claim to reproduce a specific TikTok song, copyrighted recording, melody, or third-party sample.

Music selection can use both the requested editing style and product highlight, so fashion/top-wear, logo/print, fabric/detail, ecommerce, luxury, and other edit intents can receive a more appropriate vibe.

### Restrained flash accents

Selected transitions may receive a short, low-brightness flash lift for a more current Reels/TikTok-inspired editing feel.

The effect is deliberately limited:

- sparse rather than every transition
- small brightness lift instead of full-white frames
- no rapid strobing
- no repeated aggressive flicker
- product readability remains higher priority than the effect

Runtime controls are documented in `.env.example`:

```env
REELORA_AUTO_MUSIC=1
REELORA_MUSIC_LIBRARY=
REELORA_SUBTLE_FLASH=1
REELORA_FLASH_CADENCE=5
REELORA_FLASH_STRENGTH=0.10
```

## Preservation rules

Reelora automatic mode uses deterministic editing only. It must preserve the original model identity/face/body proportions, garment/product, fabric/texture, product color, print/logo/tags, neckline/sleeves/straps/pockets/stitching, length, fit, and construction.

Hard prohibitions:

- no overlay text/captions/price text
- no overlay objects/stickers/graphics
- no generated model/product/fabric/background pixels
- no AI voice-over or synthetic narration

When enhancement conflicts with preservation, preservation wins.

## Top-wear rule

Default `Highlight the top wear` content distribution before the supplied outro:

- **70%** top-wear / upper-body focus
- **20%** whole-body context
- **10%** supporting detail

Total = **100%**.

User-supplied distributions override this default. Example: `80% top wear, 20% whole body` becomes focus 80%, whole body 20%, detail 0%.

## Capability status is explicit

Call the MCP tool:

```text
reelora_features
```

It returns every capability with one of these statuses:

- `implemented` — executable in the current backend/MCP layer
- `adapter_ready` — typed contract exists but needs an observation/provider/desktop/audio adapter to execute fully
- `planned` — product architecture item that still needs dedicated implementation

This prevents clients from claiming a desktop/local-vision capability ran when it did not.

## Current MCP tools

- `reelora_features` — full capability/status catalog
- `reelora_diagnostics` — FFmpeg/FFprobe and encoder readiness
- `reelora_reference_style_dna` — derive safe pacing/framing DNA from reference-Reel observations
- `reelora_analyze` — inspect raw sources/candidate moments/vision observations
- `reelora_edit` — render the final Reel
- `reelora_variants` — premium / fast ecommerce / luxury variants
- `reelora_batch_edit` — batch isolated product jobs
- `reelora_revise_plan` — structured targeted edit-plan revisions
- `reelora_save_brand_profile` / `reelora_list_brand_profiles` — reusable preferences

## Vision Director architecture

The deterministic core may consume normalized observations from a local or remote vision layer, including:

- product, face, hand, full-body, logo, print, and fabric regions
- pose/angle
- variant/SKU label
- product/logo/print visibility
- fabric detail score
- blur/occlusion
- movement quality
- distraction/reflection risk
- confidence

Vision analysis controls selection/crop decisions only. It must never generate replacement product/model pixels.

## Reference Reel style matching

Reelora may derive structural editing DNA such as:

- average shot length
- opening shot length
- shot distribution
- transition frequency
- motion intensity

It must **not** copy the reference Reel's logos, text, music, brand assets, or other protected creative content.

## Revision workflow

Targeted plan revisions are supported at the architecture/MCP level:

- lock/unlock a shot
- replace a shot
- blacklist a source time window
- favorite a source moment
- limit editing to a requested output time region

This is designed so a user can say things like `keep the opening and outro; only change the middle` without discarding the whole plan.

## Exports

Current/contracted exports include:

- 1080x1920 H.264 MP4
- thumbnail from a real frame
- cover crop from a real frame
- edit-plan JSON
- quality-report JSON
- timeline JSON
- timeline CSV
- CMX-style EDL
- FFmpeg command audit
- versioned output filenames

The backend supports optional H.264 hardware encoder selection with CPU `libx264` fallback.

## Install backend locally

Requirements:

- Node.js 20+
- FFmpeg + FFprobe on `PATH`
- Python 3 for ZIP packaging

```bash
git clone https://github.com/jmqbataller/reelora.git
cd reelora
npm install
npm run check
npm run build
```

Run local stdio MCP:

```bash
npm run start:stdio
```

Run Streamable HTTP MCP:

```bash
npm run start
```

Default endpoints:

```text
POST /mcp
GET  /health
GET  /outputs/<generated-file>
```

## Build the installable Skill ZIP locally

From the repository root, run exactly:

```bash
npm install
npm run check
npm run build
npm run pack:skill
```

For v0.5.0 the generated file is:

```text
dist-skill/reelora-skill-v0.5.0.zip
```

If dependencies are already installed and you only need to rebuild the skill package, the shortest command is:

```bash
npm run pack:skill
```

The packaging script reads the version from `package.json`, creates the top-level `reelora/` skill directory, generates `manifest.json`, and packages it as `dist-skill/reelora-skill-v<version>.zip`.

The GitHub Release workflow performs the same build, verifies the ZIP structure, and attaches the versioned ZIP to the matching release.

## Release checklist

Before publishing a release, follow [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md). The main release checks are:

- version, README, changelog, and skill instructions agree
- TypeScript check/build passes
- versioned Skill ZIP is generated
- required ZIP files are present
- automatic music and restrained flash behavior are smoke-tested
- GitHub Release workflow passes
- release asset can be downloaded and installed in ChatGPT Skills

## Project structure

```text
reelora/
├── SKILL.md
├── README.md
├── CHANGELOG.md
├── RELEASE_CHECKLIST.md
├── docs/
│   ├── FEATURES.md
│   ├── ARCHITECTURE.md
│   ├── EDITING_RULES.md
│   ├── PRESERVATION.md
│   └── SHOT_DISTRIBUTION.md
├── src/
│   ├── analyze.ts
│   ├── diagnostics.ts
│   ├── engine.ts
│   ├── feature-catalog.ts
│   ├── features.ts
│   ├── ffmpeg.ts
│   ├── mcp.ts
│   ├── music.ts
│   ├── planner.ts
│   ├── quality.ts
│   ├── render.ts
│   ├── revisions.ts
│   ├── style-reference.ts
│   ├── timeline.ts
│   ├── transitions.ts
│   ├── types.ts
│   ├── validation.ts
│   └── vision.ts
├── scripts/
│   └── build-skill-package.mjs
└── .github/workflows/
    ├── ci.yml
    └── release-skill.yml
```

Reelora's goal is not to make footage look artificially generated. Its goal is to make real product footage look professionally directed, edited, and validated while remaining faithful to the original product and model.
