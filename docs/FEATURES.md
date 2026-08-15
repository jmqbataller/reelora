# Reelora Feature Catalog

Reelora is a preservation-first automatic Reel director for product and fashion videos. This document is the product-level feature inventory for v0.3 and beyond.

Status meanings:

- **Implemented** — working in the current TypeScript/FFmpeg engine or MCP layer.
- **Adapter-ready** — schema/contracts/hooks exist; a vision, desktop, audio-analysis, or platform adapter can supply the required observations or runtime behavior.
- **Planned** — intentionally represented in the architecture but still needs a dedicated implementation.

The machine-readable source of truth is `src/feature-catalog.ts` and is exposed through the `reelora_features` MCP tool.

## Preservation baseline

Reelora never generates/replaces the model, face, product, fabric, logo, print, background, or missing pixels. No overlay text, overlay objects, or AI voice-over are added by default. Preservation always wins over enhancement.

## Vision and product understanding

- Reference product verification
- Reference model lock
- Garment segmentation hooks
- Product coverage score
- Logo/print visibility score
- Fabric detail detector hooks
- Product color delta guard
- Face similarity guard
- Body shape integrity guard
- Hands-on-product detector
- Pose moment detector
- Front/side/back/walking/detail classification
- Movement quality score
- Micro-moment trimming
- Best first-frame detector
- Three-second hook optimizer
- Shot fatigue detector
- Background consistency score
- Distraction detector
- Mirror/reflection guard
- Product obstruction guard
- Safe crop heatmap

## Editing intelligence

- Uploaded AI-generated video re-edit mode with chronological story preservation
- Uploaded AI-generated video recreate mode using the strongest existing source moments
- Optional outro for generated-video remix jobs

- Scene detection and candidate generation
- Best-moment selection
- Duplicate-shot avoidance
- Pose variety
- Variant balancing
- Dynamic product/subject tracking from vision regions
- 70/20/10 top-wear default distribution
- Custom percentage distributions
- Visual rhythm engine
- Motion direction matching hooks
- Pose match cuts
- Garment match cuts
- Smart transition selection
- Premium transition families: liquid splash, ink bloom, prism refraction, particle crystallize, light sweep, glass ripple, silk fold, and luma bloom
- Transition intensity control: subtle, balanced, or bold
- Explicit transition-family allowlists
- Premium real-pixel animation: hero breathe, product parallax, macro orbit, editorial depth, kinetic arc, and silk camera float
- Generic swing/slide/bounce avoidance
- Speed-ramp hooks
- High-FPS slow motion
- Optical-flow safety guard hooks
- Cinematic freeze-frame mode
- Real-frame parallax/pan concept
- Retention-focused opening
- Auto duration
- Intro support hooks
- Multiple supplied outro variants
- Mandatory outro duration preservation

## Product integrity and QA

- No-generative mode lock
- Product color lock
- Fabric texture guard
- Logo/print lock
- Face integrity guard
- Hand integrity guard
- Body-shape integrity guard
- Crop safety zones
- Occlusion filtering
- Blur filtering
- Bad-pose filtering
- Product/SKU lock hooks
- Multi-product detection hooks
- Before/after validation hooks
- Pixel-preservation audit hooks
- Generative-detection audit hooks
- Quality threshold mode
- Auto conservative re-edit fallback
- Auto re-edit-until-pass architecture
- Per-shot confidence
- Rejection reasons
- Overall Reel scorecard

## Color, camera, and source normalization

- Auto orientation
- Automatic landscape detection and 1080x1920 Reels conversion
- Tracked product/subject smart crop for landscape-to-vertical reframing
- Full-frame real-pixel blurred-fill fallback when tracked regions are unavailable
- No stretching, outpainting, or invented side content
- Mixed-resolution support
- VFR/frame-rate normalization
- Stabilization support
- Rolling-shutter guard hooks
- Exposure flicker correction hooks
- White-balance consistency hooks
- HDR/SDR safety hooks
- Color-space detection hooks
- Camera-shake classification hooks

## Platform and export

- Instagram Reels preset
- TikTok preset
- YouTube Shorts preset
- Facebook Reels preset
- Social UI crop safety
- 1080x1920 H.264 MP4
- Optional 60 fps output contract
- Responsive reframe/export hooks for 4:5, 1:1, and 16:9
- File-size targeting
- Auto bitrate optimization hooks
- Compression simulation hooks
- Compression artifact guard hooks
- Texture preservation scoring hooks
- ProRes master export contract
- Thumbnail generation
- Cover crop generation
- Edit plan JSON
- Timeline JSON
- Timeline CSV
- CMX-style EDL timeline
- FFmpeg audit
- Versioned output files

## Audio

- Supplied music support
- No generated voice-over
- Beat-sync contract
- Music energy matching contract
- Music drop detection contract
- Music section selection contract
- Outro beat alignment
- Audio ducking hooks
- Original/natural sound preservation hooks
- Silence-aware cut hooks
- Audio cleanup contract
- Copyright-safe music warning behavior

## Reference Reel / style analysis

Reelora may analyze metadata from a reference Reel to derive editing DNA such as average shot length, opening shot duration, shot distribution, transition frequency, motion intensity, and pacing/style profile.

Reelora must never copy the reference Reel's logos, text, music, brand assets, or generated visual content. It copies structure only.

## Variant, SKU, and campaign workflows

- Variant-aware editing
- Equal variant exposure hooks
- Hero variant priority
- Variant transition-match hooks
- Multi-product detection hooks
- SKU lock hooks
- Batch campaign builder
- Campaign consistency mode hooks
- Auto naming by SKU/variant hooks
- Brand preset versioning
- Season/campaign preset metadata
- Reusable editing DNA profiles

## Revision workflow

- Lock shot
- Unlock shot
- Replace shot
- Blacklist source moment
- Favorite source moment
- Edit only a requested output region
- Alternative clip suggestions contract
- Locked product shot contract
- Approval lock
- Client review mode contract
- Version comparison / A-B variants

## Runtime, privacy, and reliability

- Local FFmpeg processing
- Privacy mode
- Offline core editor contract
- Auto-delete temporary raw cache
- Local-vision adapter hooks
- GPU vision adapter hooks
- Proxy analysis/original master render
- Hardware encoding: NVENC / QSV / AMF with CPU fallback
- Skill/runtime diagnostics
- Corrupt media detection
- Codec compatibility hooks
- Disk-space guard hooks
- Estimated output size hooks
- Crash recovery hooks
- Render cache hooks
- Partial render cache hooks
- Watch-folder mode hooks
- Queue mode hooks

## Desktop/application layer

Planned desktop UX sits on top of the same Reelora engine rather than duplicating editing logic:

- drag-and-drop raw videos + outro
- one-click Windows packaging
- queue dashboard
- source/crop/final preview
- interactive safe crop adjustment
- timeline preview
- revision history/undo
- preset import/export

## Feature discovery

Call `reelora_features`. The response returns every capability with `implemented`, `adapter_ready`, or `planned` status so clients can distinguish current execution from future adapter work.
