# Reelora

![Reelora CI](https://github.com/jmqbataller/reelora/actions/workflows/ci.yml/badge.svg)

**Raw footage in. Quality Reel out.**

Reelora is a preservation-first automatic Reel director, FFmpeg renderer, MCP adapter, and installable ChatGPT Skill for product/fashion videos.

Upload raw clips + a supplied ending/outro and give a short direction such as:

```text
Make these into a quality Reel. Highlight the top wear.
```

Reelora handles clip selection, cutting, rearrangement, product-focused reframing, pacing, transitions, fade in/out, supplied-outro placement, validation, timeline/report exports, and final MP4 rendering without generating or replacing the original model, product, or fabric.

## Download the ChatGPT Skill

**[Download Reelora Skill v0.3.0 ZIP](https://github.com/jmqbataller/reelora/releases/download/v0.3.0/reelora-skill-v0.3.0.zip)**

Latest release page: **https://github.com/jmqbataller/reelora/releases/latest**

The ZIP is built automatically from this repository and contains a top-level `reelora/` skill folder with `SKILL.md`, references, and a non-destructive runtime checker.

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

## v0.3 additions

Reelora v0.3 expands the working v0.2 renderer into a broader, typed architecture without pretending every external vision/desktop integration already exists.

New working/core additions include:

- comprehensive capability catalog with `implemented`, `adapter_ready`, and `planned` status
- expanded vision observation schema for product/face/hands/body/logo/print/fabric/pose/variant/SKU signals
- reference-product/model/SKU architecture
- reference-Reel editing-DNA analysis (pacing/shot structure only; no copying creative assets)
- structured revision commands: lock/unlock/replace/blacklist/favorite/edit-region
- runtime FFmpeg/FFprobe/encoder diagnostics
- timeline JSON export
- timeline CSV export
- basic CMX-style EDL export
- campaign/review/offline/desktop/runtime hooks
- expanded preservation/QA contracts

See [`docs/FEATURES.md`](./docs/FEATURES.md) for the complete feature inventory and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the layer design.

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

## Build the installable Skill ZIP

```bash
npm run pack:skill
```

The generated file is placed under `dist-skill/` and the GitHub Release workflow publishes the same versioned ZIP automatically.

## Project structure

```text
reelora/
├── SKILL.md
├── README.md
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
│   ├── planner.ts
│   ├── quality.ts
│   ├── render.ts
│   ├── revisions.ts
│   ├── style-reference.ts
│   ├── timeline.ts
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