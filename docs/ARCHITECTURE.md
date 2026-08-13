# Reelora Architecture

Reelora is split into preservation-safe layers so advanced AI/vision capabilities can be added without allowing a generative video model to silently rewrite the product.

## 1. Input layer

Accepts raw videos, a required supplied outro, optional supplied music, optional reference media, brand/campaign metadata, and normalized vision observations.

## 2. Analysis layer

Core deterministic analysis uses FFprobe/FFmpeg for media metadata, scene boundaries, source coverage, frame rate, and candidate windows.

Optional vision adapters may supply normalized regions and scores for product, face, hands, full body, logo, print, fabric, pose, variant, SKU, visibility, blur, occlusion, movement quality, distractions, and confidence.

The core engine consumes these observations but does not require one specific cloud or local vision provider.

## 3. Planning layer

The planner controls:

- requested highlight target
- shot percentage distribution
- hook/retention ordering
- duplicate avoidance
- pose and variant balance
- target duration
- safe crop targets
- transition/playback decisions
- locked/reviewed shots

For `top_wear`, the default remains 70% focus, 20% whole body, and 10% detail unless the user explicitly supplies another 100% distribution.

## 4. Revision layer

Structured revision operations can lock/unlock shots, replace a shot, blacklist a source window, favorite a source window, or limit changes to an output region.

## 5. Render layer

Rendering is deterministic FFmpeg-based trimming, scaling, cropping, transition, fade, frame-rate normalization, audio handling, and encoding. Hardware H.264 encoders are optional; CPU H.264 is the compatibility fallback.

## 6. QA layer

QA checks distribution, dimensions, no-generative mode, preservation locks, confidence, warnings, and optional adapter-provided integrity evidence. Unsafe advanced settings may fall back to a more conservative cut-based render.

## 7. Export layer

Outputs may include:

- MP4 Reel
- thumbnail
- cover image
- edit-plan JSON
- quality report JSON
- timeline JSON
- timeline CSV
- CMX-style EDL
- FFmpeg audit

## 8. Profile and campaign layer

Brand profiles persist editing preferences. Campaign/SKU/variant metadata can be layered on top without changing the renderer's preservation rules.

## 9. Runtime and desktop adapters

The same engine is intended to support local MCP, remote MCP, batch jobs, future watch-folder/queue workflows, and a future desktop/Windows shell. Desktop UI should call the same engine instead of reimplementing editing logic.

## Preservation boundary

Vision systems may observe and classify. They may not generate replacement model/product/fabric pixels. If an enhancement requires invented pixels, the automatic preservation-first pipeline must skip that enhancement.