# Reelora

![Reelora CI](https://github.com/jmqbataller/reelora/actions/workflows/ci.yml/badge.svg)

**Raw footage in. Quality Reel out.**

Reelora is a preservation-first automatic video editor and MCP/ChatGPT skill adapter for product and fashion Reels.

Give it raw videos, an ending/outro video, and a short direction such as `Highlight the top wear`. Reelora builds the shot plan, finds candidate moments, cuts and rearranges footage, reframes it for 9:16, adds clean motion/crossfades, appends the outro, validates the result, and exports an MP4.

## What is implemented in v0.1

- FFmpeg/FFprobe media inspection
- automatic scene-boundary detection
- candidate clip generation and quality heuristics
- automatic clip selection and rearrangement
- highlight-aware shot planning
- upper-body/top-wear reframing
- whole-body context framing
- tighter detail framing
- subtle moving crop for visual motion
- fade-in/fade-out
- short crossfade transitions between shots
- uploaded ending/outro as the final segment
- optional supplied music with audio fade
- no generated voice-over
- 1080 × 1920 H.264 MP4 rendering
- plan validation and final output validation
- local MCP over stdio
- remote MCP over Streamable HTTP
- downloadable `/outputs/<file>.mp4` route for hosted deployments
- local file paths, `file://` inputs, and HTTPS media inputs

## Non-negotiable preservation rules

Reelora never intentionally generates, replaces, redesigns, or outpaints visual content. It uses deterministic video transforms only.

It must preserve the original:

- model identity and face
- skin tone and body proportions
- garment/product
- fabric and fabric texture
- design, print, logo, tags, stitching
- product color
- neckline, sleeves, straps, length, fit, proportions

Default prohibitions:

- no overlay text
- no captions or price text
- no overlay objects/stickers/graphics
- no generated backgrounds or props
- no AI voice-over
- no narration

When visual enhancement conflicts with preservation, **preservation wins**.

## Top-wear rule: exact 70 / 20 / 10

When `highlight = top_wear`, Reelora creates ten equal-duration content slots:

- **7 top-wear / upper-body focus shots = 70%**
- **2 whole-body shots = 20%**
- **1 product-detail shot = 10%**

Total: **100%**.

If the raw footage cannot safely support the requested total duration, Reelora reduces the content duration equally across all ten slots rather than breaking the 70/20/10 ratio.

## Default Reel flow

```text
Raw videos + ending/outro
        ↓
FFprobe inspection
        ↓
Scene detection
        ↓
Candidate clip scoring
        ↓
Best-window selection
        ↓
Shot distribution plan
        ↓
9:16 smart crop / reframe
        ↓
Subtle motion + fades + crossfades
        ↓
Preservation validation
        ↓
Uploaded outro
        ↓
Optional supplied music
        ↓
1080 × 1920 MP4
```

## Requirements

- Node.js 20+
- FFmpeg + FFprobe available on `PATH`

Verify FFmpeg:

```bash
ffmpeg -version
ffprobe -version
```

## Install

```bash
git clone https://github.com/jmqbataller/reelora.git
cd reelora
npm install
npm run build
```

## Local MCP / ChatGPT adapter

Run Reelora over stdio:

```bash
npm run start:stdio
```

The server exposes:

### `reelora_analyze`

Analyzes raw videos and returns candidate clip windows.

### `reelora_edit`

Automatically creates the finished Reel.

Example tool arguments:

```json
{
  "rawVideos": [
    "/absolute/path/raw-1.mp4",
    "/absolute/path/raw-2.mp4"
  ],
  "outroVideo": "/absolute/path/outro.mp4",
  "highlight": "top_wear",
  "targetDuration": 15,
  "outputName": "top-wear-reel.mp4"
}
```

A supplied music file can also be passed with `music`. Reelora does not generate speech or voice-over.

## Remote Streamable HTTP MCP

```bash
npm run start
```

Endpoints:

```text
POST /mcp
GET  /health
GET  /outputs/<generated-file>.mp4
```

Useful environment variables:

```env
PORT=3000
REELORA_DATA_DIR=.reelora
PUBLIC_BASE_URL=https://your-reelora-host.example
```

When `PUBLIC_BASE_URL` is configured, `reelora_edit` returns an `outputUrl` for the generated Reel.

## Docker

The included Dockerfile installs FFmpeg automatically.

```bash
docker build -t reelora .
docker run --rm -p 3000:3000 -v reelora-data:/data reelora
```

## Input handling

The MCP tools currently accept:

- absolute/local media paths available to the Reelora runtime
- `file://` URLs
- HTTPS media URLs

For a ChatGPT environment that mounts uploaded attachments into the tool runtime, pass those mounted video paths to `reelora_edit`.

## Current v0.1 limitations

Reelora is now a working renderer, but the first release intentionally favors preservation and reliability over generative intelligence:

- clip ranking currently uses scene, resolution, frame-rate, duration, and coverage heuristics rather than generative video editing;
- top-wear reframing is preservation-safe upper-body framing and subtle crop movement, not body reconstruction;
- supplied music is supported; original-source audio mixing across crossfades is not enabled yet;
- remote servers need media to be accessible as runtime paths or HTTPS URLs.

These limitations are intentional: Reelora should never invent fabric, alter a face, reconstruct a logo, or change the product just to make an edit look more dramatic.

## Repository structure

```text
reelora/
├── SKILL.md
├── README.md
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
├── src/
│   ├── analyze.ts
│   ├── engine.ts
│   ├── ffmpeg.ts
│   ├── http.ts
│   ├── index.ts
│   ├── mcp.ts
│   ├── media.ts
│   ├── planner.ts
│   ├── render.ts
│   ├── types.ts
│   └── validation.ts
├── docs/
│   ├── EDITING_RULES.md
│   ├── PRESERVATION.md
│   └── SHOT_DISTRIBUTION.md
└── examples/
    └── TOP_WEAR_REEL.md
```

See [`SKILL.md`](./SKILL.md) for the full assistant behavior specification.
