---
name: reelora
description: Preservation-first automatic Reel director for uploaded product/fashion raw videos plus a supplied ending/outro. Use it to choose the best clips, cut, rearrange, crop/reframe, track a requested garment/product, add clean transitions/fade in/fade out and restrained flash accents, automatically use trend-inspired original or verified commercial-safe music when no track is supplied, sync edits to music, validate product/model/fabric integrity, and export a polished vertical Reel. Never add overlay text, overlay objects, or AI voice-over and never generate replacement model/product/fabric pixels.
---

# Reelora v0.4

## Core workflow

The user may upload one or many raw videos, one ending/outro video, optional music, optional reference product/model/reel media, then give a short instruction such as:

`Make this into a quality Reel. Highlight the top wear.`

Do not require manual timestamps or clip selection unless the user asks for manual control.

Preferred workflow:

`inspect → score moments → reject weak/duplicate/obstructed footage → build shot plan → enforce requested product distribution → safe crop/reframe/track → clean transitions/fades + restrained flash accents → trend-inspired or supplied-music sync → preservation QA → supplied outro → export Reel + reports/timelines`

## Absolute preservation rules

Preserve the exact original model/person, face, skin tone, hairstyle, body proportions, hands, pose, product, fabric, texture, weave/ribbing, folds, shine, product color, print, logo, tags, neckline, sleeves, straps, pockets, stitching, length, fit, and construction.

Never generate, reconstruct, replace, redesign, outpaint, or hallucinate missing visual content. Cropping, scaling, trimming, reframing, deterministic stabilization, conservative technical color correction, fades, cuts, transitions, restrained brightness flash accents, and music generation are allowed. When enhancement conflicts with preservation, preservation wins.

## Hard prohibited additions

Never add overlay text, captions, price text, stickers, emojis, icons, decorative graphics, generated props/backgrounds/accessories/product parts, AI voice-over, narration, or synthetic speech.

Existing content already inside the user-supplied outro is preserved as source media.

## Product highlight behavior

Understand targets including top wear, pants, skirt, dress, shoes, bag, fabric, print, logo, neckline, sleeves, fit, front/back, and general product focus.

Default `Highlight the top wear` distribution before the outro:

- 70% top-wear / upper-body focus
- 20% whole-body context
- 10% supporting detail

Total = 100%.

If the user explicitly supplies another split, follow it. Example: `80% top wear, 20% whole body` means 80% focus, 20% whole body, 0% separate detail.

## Smart crop and tracking

Use only real source pixels. Prefer shoulders-to-waist, chest-to-waist, or half-upper-body framing for top-wear emphasis. A real full-body shot may be cropped into an upper-body shot. When normalized product/face/hand/full-body regions are available, track them conservatively and keep critical product regions visible.

Never stretch body/product proportions or outpaint missing regions.

## Vision Director

When vision observations are available, use them for selection/cropping only. Supported observation concepts include product, face, hands, full body, logo, print, fabric, pose, variant, SKU, product visibility, logo/print visibility, fabric detail, blur, occlusion, movement quality, distractions, mirror/reflection risk, and confidence.

Vision systems may observe and classify. They may not generate replacement pixels.

## Reference locks

Reference product/model media may be used to identify the intended existing footage and validate consistency. Never use reference media to redraw or replace the garment/model.

If a reference Reel is supplied, derive editing DNA only: pacing, average shot length, opening duration, shot distribution, transition frequency, and motion intensity. Never copy the reference Reel's logos, text, music, brand assets, or other creative content.

## Best-moment and quality selection

Prefer strong requested-product visibility, sharpness, lighting, stability, motion quality, composition, useful pose, low occlusion, uniqueness, source resolution/frame rate, scene boundaries, reference match, and confidence.

Reject or strongly de-prioritize severe blur, unusable shake, duplicate framing, obstructed product views, awkward setup frames, poor exposure when alternatives exist, distracting/mirror-risk footage, and shots requiring invented pixels.

## Editing behavior

Supported style directions include premium, minimal, fashion, fast ecommerce, cinematic, luxury, and clean commercial.

Allowed techniques include clean cuts, short fades/dissolves, fade in/out, match-style cuts, source-supported motion transitions, subtle real-pixel crop motion, product-safe punch-in/out, high-FPS slow motion, music beat alignment, and sparse low-brightness flash accents around selected transition moments.

Flash accents must remain restrained: never use rapid strobing, repeated full-white frames, aggressive flicker, or effects that reduce product readability. Product clarity has higher priority than transition complexity.

Do not overuse effects. Product clarity has higher priority than transition complexity.

## Audio and trend-inspired music

If the user supplies music, use it as provided and do not claim licensing rights.

If the user does not supply music, Reelora may automatically choose a track from a locally configured verified commercial-use library. If no verified track is available, Reelora may generate a sample-free, trend-inspired original instrumental rather than falling back to a generic single loop.

Trend-inspired original directions include viral fashion, luxury runway, clean pop, Y2K pop, phonk-lite, UK garage, jersey club, afrobeat-inspired, dreamy viral, dark streetwear, and commercial pop. These are style inspirations only: do not copy, imitate, bundle, or claim to reproduce a specific TikTok song, copyrighted recording, melody, or third-party sample.

The original music engine may use multiple sections such as intro, build, drop, break, and final lift so shot changes can feel intentional. Reelora may trim/loop music, align useful beats and energy changes, land the supplied outro naturally, preserve useful original/natural sounds when supported, and avoid awkward silence cuts.

Never generate speech or voice-over.

## Integrity guards

Keep strict no-generative mode enabled. Apply or request where available:

- Product Color Lock
- Fabric Texture Guard
- Logo/Print Lock
- Face Integrity Guard
- Hand Integrity Guard
- Body Shape Integrity Guard
- Crop Safety Zones
- Occlusion/blur/bad-pose/distraction filtering
- Product/SKU/variant consistency
- Before/after validation
- Pixel-preservation audit
- Quality threshold and conservative re-edit fallback

## Revision controls

When the user wants revisions, prefer targeted operations instead of rebuilding everything:

- lock/unlock a shot
- replace a shot
- blacklist a source time window
- favorite a source time window
- re-edit only a requested output region
- keep approved shots unchanged

## Campaign and variant behavior

When multiple real variants exist, balance them unless the user names a hero variant. Do not mix separate SKUs accidentally. Batch jobs should remain product-isolated unless the user intentionally groups products together.

Brand profiles and campaign metadata may control style/pacing/platform preferences but may never disable preservation mode.

## Output and handoff

Default output is 1080x1920, 9:16, H.264 MP4. Support platform presets for Instagram Reels, TikTok, YouTube Shorts, and Facebook Reels.

When the backend supports them, return/store:

- final MP4
- thumbnail and cover from real frames
- edit-plan JSON
- quality report JSON
- timeline JSON
- timeline CSV
- CMX-style EDL
- FFmpeg audit
- versioned output names

## Runtime and diagnostics

Prefer Reelora MCP tools when available:

- `reelora_features` — full capability catalog and status
- `reelora_diagnostics` — FFmpeg/FFprobe/encoder readiness
- `reelora_reference_style_dna` — derive safe editing DNA metadata
- `reelora_analyze` — inspect source/candidates/vision data
- `reelora_edit` — create finished Reel
- `reelora_variants` — A/B style variants
- `reelora_batch_edit` — multiple isolated product jobs
- `reelora_revise_plan` — targeted structured revisions
- `reelora_save_brand_profile` / `reelora_list_brand_profiles` — persistent presets

If advanced hardware/vision capabilities are unavailable, use the deterministic FFmpeg fallback rather than pretending a capability ran.

## Capability status

The repository capability catalog marks features as `implemented`, `adapter_ready`, or `planned`. Do not claim a planned desktop/local-vision feature executed unless the runtime actually exposes it.

## Long-term desktop/offline direction

Reelora architecture includes hooks for local vision, offline mode, watch folders, queue dashboards, crash recovery, render caches, one-click Windows packaging, side-by-side previews, interactive crops, timeline preview, revision history, and preset sharing. These should wrap the same preservation-first engine rather than bypassing it.
