# Reelora v0.2 Feature Set

Reelora v0.2 is a preservation-first automatic Reel director. The feature set is designed around one rule: editing may change timing, framing, sequencing, transitions, and encoding, but it must not regenerate the model, product, or fabric.

## Automatic direction

- raw-video inspection
- scene detection
- candidate clip generation
- best-moment scoring
- automatic hook selection
- automatic cut and rearrangement
- auto duration
- retention-focused ordering
- duplicate-shot avoidance
- pose variety
- front/side/back balancing
- variant balancing
- single-model consistency metadata

## Vision Director

When frame observations are supplied by a vision-capable layer, Reelora supports:

- product-region coordinates
- face/full-body/hand regions
- product visibility score
- blur score
- occlusion score
- pose labels
- variant labels
- confidence score
- preservation-safe crop targets
- product-following crop motion

Vision data controls selection/cropping only. It never generates replacement pixels.

## Product targets

- top wear
- pants
- skirt
- dress
- shoes
- bag
- fabric
- print
- logo
- neckline
- sleeves
- fit
- front/back
- general product focus

## Shot distribution

Default `top_wear` rule:

- 70% focus / upper body
- 20% whole body
- 10% detail

Custom distributions are normalized to 100% and validated by timeline duration.

## Editing styles

- premium
- minimal
- fashion
- fast ecommerce
- cinematic
- luxury
- clean commercial

## Platform presets

- Instagram Reels
- TikTok
- YouTube Shorts
- Facebook Reels

## Motion and transitions

- clean cuts
- fade in/out
- short fades
- dissolve
- motion transition when safe
- subtle moving crop
- product-safe punch-in behavior
- high-FPS slow motion
- smart transition selection

## Audio

- supplied music
- clean audio fades
- music trimming/looping to duration
- beat-sync metadata support
- music-energy/outro alignment flags
- no AI voice-over
- no synthetic narration
- fail-safe handling for original audio when cross-source sync is uncertain

## Integrity guards

- strict no-generative mode
- product color lock
- fabric texture guard
- logo/print lock
- face integrity guard
- hand integrity guard
- crop safety zones
- real-frame-only crop validation
- output dimension validation
- requested shot-distribution validation
- automatic conservative re-edit after failed advanced render

## Source handling

- portrait/landscape inputs
- mixed resolutions
- 720p/1080p/4K inputs
- mixed source frame rates
- file paths
- `file://` URLs
- HTTPS inputs
- Windows-safe file URL handling
- optional proxy-analysis architecture

## Export

- 1080x1920 H.264 MP4
- CPU libx264
- optional NVIDIA NVENC
- optional Intel Quick Sync
- optional AMD AMF
- target file-size mode
- versioned filenames
- auto thumbnail from a real video frame
- cover crop from a real video frame
- edit-plan JSON
- quality-report JSON
- FFmpeg command audit

## Workflows

- single automatic edit
- A/B style variants
- batch product editing
- saved brand profiles
- persistent profile reuse
- downloadable hosted output routes
- stdio MCP
- Streamable HTTP MCP

## Preservation prohibitions

Reelora does not add overlay text, captions, price tags, stickers, decorative objects, generated backgrounds, generated product parts, or AI voice-over. Existing content inside the user-supplied outro is preserved as source media.
