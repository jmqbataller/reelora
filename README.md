# Reelora

![Reelora CI](https://github.com/jmqbataller/reelora/actions/workflows/ci.yml/badge.svg)

**Raw footage in. Quality Reel out.**

Reelora is a preservation-first automatic Reel director, FFmpeg renderer, MCP adapter, and installable ChatGPT Skill for product/fashion videos.

Upload raw clips + an ending/outro video and give a short instruction such as:

```text
Make these into a quality Reel. Highlight the top wear.
```

Reelora handles clip selection, cutting, rearrangement, product-focused reframing, pacing, transitions, fade in/out, outro placement, validation, and export without generating or replacing the original model, product, or fabric.

## Download the ChatGPT Skill

**[Download Reelora Skill v0.2.0 ZIP](https://github.com/jmqbataller/reelora/releases/download/v0.2.0/reelora-skill-v0.2.0.zip)**

Latest release page: **https://github.com/jmqbataller/reelora/releases/latest**

The ZIP is built automatically from this repository and contains a top-level `reelora/` skill folder with `SKILL.md`, references, and a non-destructive runtime checker.

In eligible ChatGPT accounts/workspaces, Skills can be uploaded from the Skills area using **Create → Upload from your computer**. Uploaded Skills are scanned by ChatGPT before becoming available.

## Non-negotiable preservation

Reelora automatic mode uses deterministic editing only. It must preserve the original:

- model identity, face, skin tone, body proportions, hands, and natural movement
- garment/product
- fabric, texture, weave, ribbing, folds, shine, and thickness
- product color
- print, logo, tags, stitching
- neckline, sleeves, straps, pockets, length, fit, and construction

Hard prohibitions:

- **no overlay text**
- **no captions/price text**
- **no overlay objects/stickers/graphics**
- **no generated backgrounds/props**
- **no AI voice-over or narration**
- **no generative video replacement/outpainting**

When style conflicts with preservation, preservation wins.

## Top-wear rule

Default for `Highlight the top wear`:

- **70% top-wear / upper-body focus**
- **20% whole body**
- **10% product detail**

Total = **100%**.

If the user says something else, such as `80% top wear, 20% whole body`, Reelora normalizes and validates that requested distribution by timeline duration.

## v0.2 highlights

### Automatic direction

- scene-boundary detection
- candidate clip generation
- best-moment scoring
- hook-first ordering
- duplicate avoidance
- pose/variant diversity metadata
- automatic duration
- retention-focused shot ordering
- batch editing
- A/B style variants
- versioned output files

### Vision Director interface

Reelora can consume structured frame observations from a vision-capable layer:

- product crop region
- face/full-body/hand regions
- product visibility
- blur
- occlusion
- front/side/back/walking/detail pose
- variant identifier
- confidence

Those observations only guide selection/cropping of **existing source pixels**. They never regenerate the model or product.

> The FFmpeg backend itself does not bundle a heavy computer-vision model. For fully semantic garment tracking, provide vision observations from the ChatGPT/vision layer or another trusted detector.

### Product highlight targets

`top_wear`, `pants`, `skirt`, `dress`, `shoes`, `bag`, `fabric`, `print`, `logo`, `neckline`, `sleeves`, `fit`, `front_back`, `general`.

### Editing styles

- premium
- minimal
- fashion
- fast ecommerce
- cinematic
- luxury
- clean commercial

### Platform presets

- Instagram Reels
- TikTok
- YouTube Shorts
- Facebook Reels

### Motion / transitions

- clean cuts
- fade in/out
- short fades
- dissolve
- safe motion transition
- subtle moving crop
- high-FPS slow motion
- product-focused vision crops

### Integrity / quality

- product color lock
- fabric texture guard
- logo/print lock
- face/hand integrity guard
- crop safety validation
- strict no-generative lock
- requested distribution validation
- 1080×1920 validation
- automatic conservative fallback re-edit
- quality/confidence report
- FFmpeg command audit

### Export

- H.264 MP4
- auto thumbnail from a real video frame
- social cover crop from a real video frame
- edit-plan JSON
- quality-report JSON
- optional file-size target
- CPU libx264
- optional NVIDIA NVENC / Intel QSV / AMD AMF

See [`docs/FEATURES.md`](./docs/FEATURES.md) for the expanded feature list.

## MCP tools

Reelora exposes:

- `reelora_features`
- `reelora_analyze`
- `reelora_edit`
- `reelora_variants`
- `reelora_batch_edit`
- `reelora_save_brand_profile`
- `reelora_list_brand_profiles`

## Example edit request

```json
{
  "rawVideos": [
    "/absolute/path/raw-1.mp4",
    "/absolute/path/raw-2.mp4"
  ],
  "outroVideo": "/absolute/path/outro.mp4",
  "highlight": "top_wear",
  "targetDuration": 15,
  "outputName": "top-wear-reel.mp4",
  "options": {
    "style": "premium",
    "platform": "instagram_reels",
    "dynamicSubjectTracking": true,
    "autoThumbnail": true,
    "coverCrop": true,
    "qualityReport": true,
    "noGenerativeMode": true
  }
}
```

Custom distribution example:

```json
{
  "distribution": {
    "focus": 0.8,
    "wholeBody": 0.2,
    "detail": 0
  }
}
```

## Requirements

- Node.js 20+
- FFmpeg + FFprobe on `PATH`

```bash
ffmpeg -version
ffprobe -version
```

## Install backend

```bash
git clone https://github.com/jmqbataller/reelora.git
cd reelora
npm install
npm run check
npm run build
```

### Local stdio MCP

```bash
npm run start:stdio
```

### Streamable HTTP MCP

```bash
npm run start
```

Endpoints:

```text
POST /mcp
GET  /health
GET  /outputs/<generated-file>
```

Environment:

```env
PORT=3000
REELORA_DATA_DIR=.reelora
PUBLIC_BASE_URL=https://your-reelora-host.example
# Optional GPU encoder: libx264 | h264_nvenc | h264_qsv | h264_amf
REELORA_ENCODER=libx264
```

## Docker

```bash
docker build -t reelora .
docker run --rm -p 3000:3000 -v reelora-data:/data reelora
```

## Build the ChatGPT Skill ZIP locally

```bash
npm run pack:skill
```

Output:

```text
dist-skill/reelora-skill-v0.2.0.zip
```

The GitHub Release workflow also builds and uploads this ZIP automatically.

## How the skill and backend work together

```text
User raw videos + ending video
        ↓
Reelora ChatGPT Skill
        ↓
Vision observations when available
        ↓
Reelora MCP / deterministic FFmpeg backend
        ↓
Scene + quality + visibility scoring
        ↓
Best clips / hook / shot distribution
        ↓
Safe crop + reframe + transitions + fades
        ↓
Preservation validation
        ↓
Uploaded outro
        ↓
MP4 + thumbnail + cover + edit plan + quality report
```

If the uploaded ChatGPT Skill does not have access to either the Reelora MCP backend or an FFmpeg-capable execution environment, it must create an edit plan and clearly report that it did **not** render an MP4 rather than pretending the render happened.

See [`SKILL.md`](./SKILL.md) for the complete assistant behavior.
