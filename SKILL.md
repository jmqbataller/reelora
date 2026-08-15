---
name: reelora
description: Chat- and Work-compatible preservation-first Reel director for uploaded raw product/fashion clips or one or many already-generated AI videos, with an optional supplied ending/outro. Use automatically in ordinary ChatGPT conversations or explicitly with $reelora/@Reelora when the user asks to edit, re-edit, recreate, remix, shorten, or convert uploaded videos into a Reel. Cut and rearrange existing frames, auto-convert landscape footage to 9:16, replace inconsistent audio, add sparse premium transitions and real-pixel animation, validate integrity, and export a polished vertical Reel whenever an executable media runtime is available. Never add overlay text/objects/voice-over or generate replacement scenes, models, products, fabric, backgrounds, or missing pixels.
---

# Reelora v0.7.3

## ChatGPT Chat and Work compatibility

Use Reelora in an ordinary ChatGPT conversation as well as in Work. Do not require the user to switch to Work merely because the request involves video.

- Trigger automatically from clear video-editing requests, or explicitly from `$reelora` / `@Reelora`.
- Accept attached videos directly in the current conversation and pass every uploaded source to the editor.
- If the current Chat surface exposes executable Python + FFmpeg/FFprobe or Reelora MCP tools, render and return the finished MP4 in that same conversation.
- If the current Chat surface cannot execute media tools, still inspect the uploads and provide a truthful edit plan/command, but state that rendering did not run. Never claim Chat produced a video when no executable path was available.
- Treat Work as an optional higher-capability surface for long or local-file jobs, not as a requirement for invoking Reelora.

## Core workflow

The user may upload one or many raw videos, or one or many already-generated AI videos to re-edit/recreate together. An ending/outro, music, and reference media are optional for AI-video remix mode.

`Make this into a quality Reel. Highlight the top wear.`

`Re-edit this generated video as a premium Reel. Keep the story order.`

`Recreate the edit from this landscape AI video and convert it to Reels ratio.`

Do not require manual timestamps or clip selection unless the user asks for manual control.

Preferred workflow:

`inspect → identify raw or generated-video source → score/segment existing moments → preserve or reinterpret source order → safe 9:16 reframe → clean beat cuts + sparse premium transitions + restrained real-pixel animation → replace source audio with trend-inspired or supplied music → preservation QA → optional supplied outro → verify rendered audio/video → export Reel + reports/timelines`

## Mandatory execution rule

When the user asks Reelora to actually edit uploaded videos, instructions alone are not completion. Reelora must use an executable rendering path when one is available.

Execution priority:

1. Prefer `reelora_remix_ai_videos` for multiple uploaded generated videos, `reelora_remix_ai_video` for exactly one, and `reelora_edit` for raw clips. Pass every uploaded source path—never only the first attachment.
2. Otherwise, if FFmpeg/FFprobe and Python are available, run the bundled `scripts/reelora_edit.py` deterministic fallback.
3. Only if neither executable path exists may Reelora return an edit plan instead of a finished MP4. Never pretend that music replacement, transitions, or rendering occurred when they did not.

For the bundled fallback, the normal shape is:

```bash
python3 scripts/reelora_edit.py \
  --input RAW_1.mp4 \
  --input RAW_2.mp4 \
  --outro OUTRO.mp4 \
  --output FINAL.mp4 \
  --style fashion \
  --highlight top_wear
```

When the user supplied a music file, add `--music MUSIC_FILE`. When no music is supplied, the script creates Reelora original trend-inspired instrumental audio and maps that audio into the final MP4.

## Generated-video remix and landscape-to-Reel behavior

When the user uploads already-generated video(s) and asks to recreate, remix, improve, or re-edit them, execute `reelora_remix_ai_videos` for multiple uploads, `reelora_remix_ai_video` for one, or run the fallback with repeated `--input` arguments plus `--remix-ai-video`.

- Every uploaded video is mandatory by default. Each source must contribute at least one selected shot; balance shot counts so the difference between sources is at most one when practical.
- In `re_edit`, keep upload order and chronological order within each source. In `recreate`, sources may be interleaved while still using them all.
- If any upload is unreadable or yields no usable clips, stop with a clear error naming that upload. Never silently produce a Reel from only the first or highest-ranked video.

- `re_edit` preserves chronological story order while trimming and rebuilding pacing.
- `recreate` may reorder the strongest existing moments to reinterpret the edit.
- A remix must be materially different from the uploaded edit. Detect scene boundaries, isolate shots, trim setup/tail frames, change pacing, and omit redundant material. `re_edit` remains chronological; `recreate` must produce a non-chronological inversion or cross-source reorder when enough shots exist.
- For automatic single-source remixes, normally target about 76% of source duration in `re_edit` and 64% in `recreate`; never retain more than 90% of the source timeline unless the user explicitly requests near-full preservation.
- Neither mode generates new scenes or replacement frames; “recreate” means recreate the edit structure only.
- Detect source orientation automatically. Always output 1080x1920 9:16 for Reel platforms.
- For landscape input, use tracked `smart_crop` when safe regions exist. Otherwise use `blur_fill`, derived from the same source pixels, so the full frame remains visible without stretching.
- Do not outpaint, stretch, squash, or invent the cropped sides.
- A supplied outro remains optional in generated-video remix mode and must be preserved when present.

Read `references/AI_VIDEO_REMIX_AND_REFRAME.md` for the executable fallback commands and audit requirements.

## Absolute preservation rules

Preserve the exact original model/person, face, skin tone, hairstyle, body proportions, hands, pose, product, fabric, texture, weave/ribbing, folds, shine, product color, print, logo, tags, neckline, sleeves, straps, pockets, stitching, length, fit, and construction.

Never generate, reconstruct, replace, redesign, outpaint, or hallucinate missing visual content. Cropping, scaling, trimming, reframing, deterministic stabilization, conservative technical color correction, fades, cuts, transitions, restrained brightness flash accents, and music generation are allowed. When enhancement conflicts with preservation, preservation wins.

## Hard prohibited additions

Never add overlay text, captions, price text, stickers, emojis, icons, decorative graphics, generated props/backgrounds/accessories/product parts, AI voice-over, narration, or synthetic speech.

Existing content already inside an optional user-supplied outro is preserved as source media.

Never turn a supplied logo or outro into a persistent corner watermark, bug, or full-video overlay. A supplied outro appears only as the final outro unless the user explicitly requests separate branding.

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

## Premium transition, animation, and pacing rules

The default social/fashion edit must not look like a slideshow or a transition template.

Use these priorities:

- mostly clean cuts aligned to useful beats;
- variable shot lengths instead of repeating the same duration for every shot;
- fast detail cuts may be about 0.6–1.0 seconds;
- normal product/focus shots may be about 0.9–1.7 seconds;
- hero/product-hold shots may be about 1.5–2.6 seconds when the footage supports it;
- use selected liquid-splash, ink-bloom, prism-refraction, particle-crystallize, light-sweep, glass-ripple, silk-fold, or luma-bloom moments;
- keep premium effects sparse, usually one every 3–5 transitions depending on style;
- use `subtle`, `balanced`, or `bold` timing while enforcing the 0.10–0.34 second safety cap;
- avoid generic swing, slide, bounce, repeated directional wipes, long dissolves, and identical transition patterns;
- do not put a visible effect on every cut.

Use real-pixel animation only: hero-frame breathe, product parallax orbit, macro orbit drift, editorial depth float, kinetic product arc, or silk camera float. These are conservative crop/scale moves; never synthesize water, particles, fabric, product parts, or replacement frames.

Fashion and fast-ecommerce may use liquid, particle, ink, or refraction moments. Luxury/cinematic may favor silk, glass, ink, and luma effects. Minimal/clean-commercial should favor refraction, light, and luma. Use the outro-safe dip whenever a supplied ending exists.

Flash accents are optional accents only. Prefer a single restrained flash around a strong beat/drop in a short Reel. Never use rapid strobing, repeated full-white frames, aggressive flicker, or flash effects that reduce product readability.

## Audio and trend-inspired music

Unless the user explicitly requests silence, original/natural sound, or a synchronized mix, the automatic product/fashion workflow MUST replace/ignore source clip audio and create one coherent music bed.

If the user supplies music, use that music file and do not claim licensing rights.

If the user does not supply music, Reelora should first use a configured verified commercial-use library when available. If no verified track is available, use the sample-free Reelora original trend-inspired instrumental fallback.

Trend-inspired original directions include viral fashion, luxury runway, clean pop, Y2K pop, phonk-lite, UK garage, jersey club, afrobeat-inspired, dreamy viral, dark streetwear, and commercial pop. These are style inspirations only: do not copy, imitate, bundle, or claim to reproduce a specific TikTok song, copyrighted recording, melody, or third-party sample.

For top-wear fashion edits, favor a viral-fashion direction around 120–126 BPM unless the footage or user direction indicates another style. Logo/print streetwear edits may lean darker; fabric/detail edits may lean cleaner/softer.

The original music engine may use intro, build, drop, break, and final-lift behavior. Never generate speech or voice-over.

## Mandatory render verification

After producing a finished MP4, verify it rather than assuming the requested edit happened.

At minimum:

1. Probe the final MP4 with FFprobe and confirm it contains both a video stream and an audio stream when music was requested/defaulted.
2. When using `scripts/reelora_edit.py`, check its JSON result and require `source_audio_replaced: true` for the default automatic workflow.
3. Confirm the reported `music_source` is `reelora-original` or `user-supplied` as appropriate.
4. Check that the audit names the expected premium families, keeps effects sparse, and avoids a uniform repeated pattern.
5. If any of these checks fail, treat the render as failed and re-render/fix the pipeline rather than presenting it as complete.
6. For multiple uploads, require `allUploadedVideosUsed: true` (MCP) or `all_uploaded_videos_used: true` (fallback) and verify every source has `shotCount`/`shot_count` greater than zero in `sourceUsage`/`source_usage`.
7. For generated-video remix, require `materiallyReedited: true` / `materially_reedited: true`. For a single source, reject normalized visual similarity of 0.94 or higher because it indicates pass-through or cosmetic-only output.
8. Require audible requested/default music: an audio stream alone is insufficient. Reject a measured peak below -55 dBFS.
9. Confirm the selected windows were actually trimmed and re-cut. `recreate` must not keep all single-source windows in chronological order when enough scenes exist.

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
- `reelora_remix_ai_video` — re-edit/recreate one generated video and auto-reframe landscape footage to 9:16
- `reelora_remix_ai_videos` — re-edit/recreate all uploaded generated videos together with mandatory balanced source coverage
- `reelora_variants` — A/B style variants
- `reelora_batch_edit` — multiple isolated product jobs
- `reelora_revise_plan` — targeted structured revisions
- `reelora_save_brand_profile` / `reelora_list_brand_profiles` — persistent presets

If MCP is unavailable, run `scripts/check_reelora_runtime.py`. If it reports local FFmpeg rendering ready, use `scripts/reelora_edit.py`; do not stop at an edit plan when the local executable path is available.

## Capability status

The repository capability catalog marks features as `implemented`, `adapter_ready`, or `planned`. Do not claim a planned desktop/local-vision feature executed unless the runtime actually exposes it.

## Long-term desktop/offline direction

Reelora architecture includes hooks for local vision, offline mode, watch folders, queue dashboards, crash recovery, render caches, one-click Windows packaging, side-by-side previews, interactive crops, timeline preview, revision history, and preset sharing. These should wrap the same preservation-first engine rather than bypassing it.
