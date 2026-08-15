# Reelora

![Reelora CI](https://github.com/jmqbataller/reelora/actions/workflows/ci.yml/badge.svg)

**Raw footage in. Quality Reel out.**

Reelora is a preservation-first automatic Reel director, FFmpeg renderer, MCP adapter, and installable ChatGPT Skill for product/fashion videos.

Upload raw clips, or send one or many already-generated AI videos to re-edit/recreate together. A supplied ending/outro remains supported and is optional for AI-video remix mode.

```text
Make these into a quality Reel. Highlight the top wear.
```

Reelora handles clip selection, generated-video remix, landscape-to-9:16 reframing, cutting, rearrangement, product-focused framing, beat-aware pacing, automatic music replacement, sparse premium transitions, real-pixel animation, optional-outro placement, validation, reports, and final MP4 rendering without generating replacement scenes, models, products, or fabric.

## Download the ChatGPT Skill

### Latest: Reelora v0.7.3

**[Download Reelora Skill v0.7.3 ZIP](https://github.com/jmqbataller/reelora/releases/download/v0.7.3/reelora-skill-v0.7.3.zip)**

Latest release page: **https://github.com/jmqbataller/reelora/releases/latest**

The ZIP contains a top-level `reelora/` Skill folder with ordinary-Chat UI metadata, its icon, `SKILL.md`, references, manifest metadata, a runtime checker, and the executable deterministic fallback editor `scripts/reelora_edit.py`.

Release history: [`CHANGELOG.md`](./CHANGELOG.md)

Release verification steps: [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md)

## v0.7.3 — ordinary Chat + Work compatibility

Reelora is now packaged for invocation from an ordinary ChatGPT conversation as well as Work. The installable ZIP includes `agents/openai.yaml`, the Reelora icon, a concise Chat UI description, a `$reelora` default prompt, and `allow_implicit_invocation: true` so clear video-editing requests can trigger it automatically.

In Chat, attach one or more videos and ask naturally, for example: `Recreate these as a premium Reel and use every upload.` You can also invoke it explicitly with `$reelora` or `@Reelora`. Reelora renders in the same conversation whenever the current Chat surface exposes its media runtime; otherwise it reports the limitation truthfully instead of pretending an MP4 was created.

OpenAI currently requires Personal Skills to be installed separately on desktop and web/mobile; installing on one surface does not automatically copy it to the other.

## v0.7.2 — genuine AI-video re-edit and recreate

Generated-video remix now has a material-change contract instead of accepting a resized copy with effects. Reelora detects the source scene cuts, isolates and trims real shot windows, removes redundant material, retimes the sequence, and validates the rendered result.

- `re_edit` creates a shorter chronological recut with changed pacing.
- `recreate` must deliberately reorder existing moments when enough scenes exist.
- single-source output with normalized visual similarity of 94% or higher is rejected as pass-through;
- automatic/default music must be audible, not merely present as a silent audio stream;
- a supplied logo/outro is never promoted into a persistent watermark or full-video overlay.

The regression source that exposed the bug previously retained identical cuts and measured 97.6% similarity. With v0.7.2, the same source produced a six-shot chronological re-edit at 66.2% similarity and a deliberately reordered recreate at 60.4% similarity, both with audible audio.

## v0.7.1 — every uploaded video is used

Multi-video editing now requires source coverage by default. If you upload three videos, Reelora allocates shots across all three, balances their usage, and reports `sourceUsage` plus `allUploadedVideosUsed: true`. It never silently renders from only the first or globally highest-ranked upload. If a source is unreadable or contains no usable clip, the edit stops with a clear error naming that upload.

Use the plural MCP tool for multiple generated videos:

```text
reelora_remix_ai_videos({ generatedVideos: [video1, video2, video3] })
```

The executable fallback accepts the same multi-source workflow through repeated inputs:

```bash
python3 scripts/reelora_edit.py \
  --input generated-one.mp4 \
  --input generated-two.mp4 \
  --input generated-three.mp4 \
  --output all-videos-reel.mp4 \
  --remix-ai-video \
  --remix-mode recreate
```

## v0.7.0 — AI-video remix + automatic landscape-to-Reel reframing

Send Reelora one already-generated video and choose:

- `re_edit` — keep the chronological story order while tightening pacing, music, transitions, and framing;
- `recreate` — rebuild the edit from the strongest existing moments for a different Reel structure.

“Recreate” does not generate new scenes. Both modes use only frames from the uploaded video.

Landscape inputs are detected automatically and exported at 1080x1920, 9:16. If reliable subject/product regions exist, Reelora uses a tracked smart crop. Otherwise it keeps the full landscape frame over a tasteful blurred background made from the same source pixels—no stretching, black-bar requirement, outpainting, or invented sides.

Executable fallback example without a separate outro:

```bash
python3 scripts/reelora_edit.py \
  --input generated-video.mp4 \
  --output generated-video-reel.mp4 \
  --remix-ai-video \
  --remix-mode re_edit \
  --landscape-reframe auto \
  --style premium
```

## v0.6.0 — premium transitions + real-pixel animation

v0.6.0 replaces the old generic smooth-left/right motion selector with an FFmpeg-validated premium effect engine. Effects stay deterministic and preservation-first: they transform only the real uploaded frames and never synthesize a replacement model, garment, product, logo, fabric, or background.

The premium transition library includes:

- liquid splash / radial ripple
- ink bloom
- prism refraction
- particle crystallize
- cinematic light sweep
- glass ripple
- silk fold
- luma bloom

The animation director adds restrained hero-frame breathing, product parallax, macro orbit, editorial depth float, kinetic product arc, and silk camera float. It deliberately avoids stock swing, slide, bounce, and repeated directional-wipe behavior.

### Audio replacement is now verifiable

Unless the user explicitly asks for silence, original/natural sound, or a synchronized mix, the automatic product/fashion workflow should strip/ignore raw clip audio and use one coherent music bed.

- supplied song → use the supplied music file;
- no supplied song → generate a sample-free trend-inspired Reelora original instrumental;
- final render → verify an audio stream exists and require `source_audio_replaced: true` from the executable fallback audit.

The renderer reports metadata such as:

```json
{
  "music_source": "reelora-original",
  "music_mood": "viral-fashion",
  "bpm": 124,
  "source_audio_replaced": true
}
```

### Premium transition direction

Reelora v0.6.0 remains cut-led, but its selected effect moments are now genuinely designed instead of generic.

Default direction:

- mostly clean beat cuts;
- variable shot lengths instead of repeated equal-duration clips;
- quick detail shots around 0.6–1.0s when appropriate;
- normal product/focus shots around 0.9–1.7s;
- longer hero/product holds around 1.5–2.6s when footage supports them;
- selected premium effect moments, usually every 3–5 transitions depending on style;
- effect timing capped to about 0.10–0.34s, with subtle/balanced/bold intensity controls;
- style-aware effect pools and optional explicit family allowlists;
- no long repeated fashion dissolves;
- no swing, bounce, ordinary slide carousel, or identical effect on every cut;
- an outro-safe dip that does not disturb the supplied ending.

For short Reels, flash should normally be zero or one small brightness accent around a stronger beat/drop rather than repeated flashes.

## Trend-inspired automatic music

When the user does not supply music, Reelora can:

1. prefer a locally configured verified commercial-use music library, or
2. generate a sample-free Reelora original instrumental.

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

Music selection can use both editing style and product highlight. Top-wear fashion edits can favor a viral-fashion direction; logo/print streetwear can lean darker; fabric/detail can lean cleaner/softer.

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

## Executable Skill fallback

Requirements:

- Python 3
- FFmpeg
- FFprobe

Example:

```bash
python3 scripts/reelora_edit.py \
  --input raw-1.mp4 \
  --input raw-2.mp4 \
  --outro outro.mp4 \
  --output final.mp4 \
  --style fashion \
  --highlight top_wear \
  --transition-intensity balanced \
  --transition-family liquid-splash \
  --transition-family prism-refraction
```

With a supplied song:

```bash
python3 scripts/reelora_edit.py \
  --input raw-1.mp4 \
  --outro outro.mp4 \
  --music music.mp3 \
  --output final.mp4 \
  --style fashion \
  --highlight top_wear
```

The script prints a JSON audit with music source, BPM, output duration, source-audio replacement status, premium animation labels, and transition family/timing/type data.

## Capability status is explicit

Call the MCP tool:

```text
reelora_features
```

It returns every capability with one of these statuses:

- `implemented` — executable in the current backend/MCP layer
- `adapter_ready` — typed contract exists but needs an observation/provider/desktop/audio adapter to execute fully
- `planned` — product architecture item that still needs dedicated implementation

## Current MCP tools

- `reelora_features` — full capability/status catalog
- `reelora_diagnostics` — FFmpeg/FFprobe and encoder readiness
- `reelora_reference_style_dna` — derive safe pacing/framing DNA from reference-Reel observations
- `reelora_analyze` — inspect raw sources/candidate moments/vision observations
- `reelora_edit` — render the final Reel
- `reelora_remix_ai_video` — re-edit/recreate one generated video and automatically convert landscape input to a 9:16 Reel
- `reelora_remix_ai_videos` — combine all uploaded generated videos with balanced mandatory source coverage and automatic 9:16 conversion
- `reelora_variants` — premium / fast ecommerce / luxury variants
- `reelora_batch_edit` — batch isolated product jobs
- `reelora_revise_plan` — structured targeted edit-plan revisions
- `reelora_save_brand_profile` / `reelora_list_brand_profiles` — reusable preferences

## Vision Director architecture

The deterministic core may consume normalized observations from a local or remote vision layer, including product, face, hand, full-body, logo, print, fabric, pose/angle, variant/SKU, visibility, blur/occlusion, movement quality, distraction/reflection risk, and confidence.

Vision analysis controls selection/crop decisions only. It must never generate replacement product/model pixels.

## Reference Reel style matching

Reelora may derive structural editing DNA such as average shot length, opening shot length, shot distribution, transition frequency, and motion intensity.

It must **not** copy the reference Reel's logos, text, music, brand assets, or other protected creative content.

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

## Install backend locally

Requirements:

- Node.js 20+
- FFmpeg + FFprobe on `PATH`
- Python 3 for Skill ZIP packaging/fallback rendering

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

From the repository root:

```bash
npm install
npm run check
npm run build
npm run pack:skill
```

For v0.7.3 the generated file is:

```text
dist-skill/reelora-skill-v0.7.3.zip
```

If dependencies are already installed and you only need to rebuild the Skill package:

```bash
npm run pack:skill
```

The GitHub Release workflow performs the same build, verifies the ZIP contains `reelora/scripts/reelora_edit.py`, checks the manifest version/executable pointer, and attaches the versioned ZIP to the release.

## Project structure

```text
reelora/
├── SKILL.md
├── README.md
├── CHANGELOG.md
├── RELEASE_CHECKLIST.md
├── docs/
├── skill/
│   ├── README.md
│   ├── references/
│   └── scripts/
│       ├── check_reelora_runtime.py
│       └── reelora_edit.py
├── src/
│   ├── music.ts
│   ├── planner.ts
│   ├── render.ts
│   ├── transitions.ts
│   └── ...
├── scripts/
│   └── build-skill-package.mjs
└── .github/workflows/
    ├── ci.yml
    └── release-skill.yml
```

Reelora's goal is not to make footage look artificially generated. Its goal is to make real product footage look professionally directed, edited, and validated while remaining faithful to the original product and model.
