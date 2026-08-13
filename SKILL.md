---
name: reelora
description: Automatically edit uploaded raw product or fashion videos into polished vertical Reels while strictly preserving the original model, product, fabric, colors, logos, tags, fit, proportions, and construction. Use when the user wants raw footage cut, rearranged, reframed, cropped, paced, transitioned, polished, and combined with an uploaded ending/outro video without overlay text, overlay objects, or voice-over.
---

# Reelora

## Purpose

Reelora is an automatic Reel editing director. The user should be able to upload raw videos plus an ending/outro video, give a short creative instruction, and let the skill make the editing decisions.

The skill must prefer deterministic/non-generative editing operations. It may cut, trim, reorder, crop, reframe, stabilize, speed-ramp, slow down, fade, transition, adjust exposure/white balance conservatively, and synchronize edits to music. It must not invent or regenerate visual product/model content.

## Expected user input

The user may provide:

- one or more raw video files;
- one ending/outro video;
- optional music/audio;
- a short direction such as `Highlight the top wear`, `Highlight the pants`, `Highlight the fabric`, `Highlight the print`, or `Highlight the fit`.

The user does not need to provide timestamps or manually identify clips.

## Default automatic workflow

When the required media is available:

1. Inspect every raw video.
2. Detect usable candidate sections and natural shot boundaries.
3. Reject or de-prioritize blurry, badly exposed, repetitive, awkward, obstructed, excessively shaky, or product-irrelevant moments.
4. Score candidate sections for product visibility, sharpness, composition, stability, lighting, motion quality, uniqueness, and relevance to the user's requested highlight.
5. Select the strongest moments across all source videos.
6. Trim candidate sections to remove dead time at the beginning/end.
7. Reorder the selected sections into an engaging Reel sequence.
8. Reframe or crop clips to emphasize the requested product region where appropriate.
9. Add tasteful motion/transitions, including fade-in and fade-out where appropriate.
10. Apply conservative exposure, white balance, stabilization, audio leveling, and mild sharpening/noise cleanup when needed.
11. Synchronize cuts/transitions to supplied music beats when music is available.
12. Run a preservation check against the original footage.
13. Add the uploaded ending/outro video as the final segment.
14. Export a polished vertical Reel.

## Default output

Unless the user requests another format:

- 1080 × 1920
- 9:16 vertical
- MP4
- H.264 video
- AAC audio when audio is present

## Non-negotiable preservation rules

Never change or regenerate the identity or appearance of the model. Preserve:

- face and facial features;
- skin tone;
- hairstyle;
- body proportions;
- body shape;
- hands;
- natural pose and movement.

Never change or regenerate the product. Preserve:

- product design;
- garment construction;
- fabric and fabric texture;
- ribbing, weave, shine, thickness, folds, and stretch appearance;
- print and print placement;
- logo;
- size tag;
- color;
- product length;
- proportions;
- neckline;
- sleeves;
- straps;
- pockets;
- stitching;
- fit.

When visual enhancement conflicts with preservation, preservation always wins.

## Forbidden additions

Do not automatically add:

- overlay text;
- captions;
- price text;
- promotional copy;
- stickers;
- emojis;
- icons;
- borders;
- decorative graphics;
- generated props or objects;
- generated backgrounds;
- generated accessories;
- AI voice-over;
- narration.

Only add any of these if the user explicitly overrides the default prohibition.

## Smart product highlighting

Interpret the user's instruction as the primary visual priority for clip scoring and reframing.

### `Highlight the top wear`

Use this target distribution for the final edited Reel:

- **70% top-wear-focused shots**
- **20% whole-body shots**
- **10% supporting detail shots**

Total: **100%**.

Top-wear-focused framing should normally favor:

- shoulders to waist;
- chest to waist;
- half upper body;
- upper torso close-up;
- medium shot where the top remains large and clearly readable.

Whole-body clips should provide styling context and variation without dominating the edit.

Supporting detail shots may emphasize fabric, neckline, sleeve, logo/print, stitching, or movement details.

If a source shot is full body and the top is the requested highlight, Reelora may crop/reframe toward the upper body if the result remains natural and uses only pixels present in the original source.

### Other highlight intents

`Highlight the pants`:
- prioritize waist-to-leg framing and full-length views that clearly show the pants.

`Highlight the fabric`:
- prioritize authentic close/detail shots with visible material texture.

`Highlight the print`:
- prioritize crops where the complete print/design remains visible and undistorted.

`Highlight the fit`:
- prioritize medium and full-body shots that clearly demonstrate how the garment sits and moves on the model.

`Highlight front and back`:
- create a balanced sequence of front, side, and back views from real source footage.

## Cropping and reframing

Cropping is allowed. Generating missing content is not.

Reelora may:

- crop a full-body source into a natural upper-body composition;
- use keyframed pan/reframe to keep the target garment centered;
- track a moving model with a crop window;
- use subtle punch-in or punch-out motion based on the existing pixels.

Reelora must not:

- outpaint missing body/product/background regions;
- create new clothing pixels;
- reconstruct hands, face, fabric, or logos;
- stretch the frame in a way that distorts the model or product;
- crop away important product details when the product is the requested focus.

## Editing style

The finished Reel should feel polished, interesting, and commercially usable without looking over-edited.

Allowed editing techniques include:

- clean cuts;
- match cuts;
- crossfades/dissolves;
- fade-in;
- fade-out;
- tasteful motion transitions;
- whip-style transitions only when supported naturally by source motion;
- speed ramps;
- slow motion when source frame rate permits;
- subtle digital punch-in/punch-out;
- pan/reframe;
- beat-synchronized edits.

Avoid stacking excessive transitions. Product visibility remains more important than transition complexity.

## Fade behavior

- Opening: use a subtle fade-in when it improves the opening.
- Between scenes: use cuts, short dissolves, match cuts, or suitable motion transitions based on source footage.
- Outro transition: lead naturally into the user-uploaded ending/outro video.
- Final frame: use a clean fade-out when appropriate unless the uploaded outro has its own ending treatment that should be preserved.

## Reel story structure

Use this as a default structure, adapting to available footage:

1. Hook — strongest product-focused shot.
2. Hero view — clearly establish the product.
3. Product-focused sequence — majority of the requested highlight shots.
4. Detail — show useful product/fabric/design details.
5. Movement — show fit and motion.
6. Whole-body/context shots — according to the requested distribution.
7. Final hero shot — finish the product story strongly.
8. Uploaded outro — always use the supplied ending video when the user has provided one.

## Candidate clip scoring

Score candidate sections using signals such as:

- requested-highlight relevance;
- product visibility;
- product size in frame;
- sharpness;
- motion quality;
- composition;
- stability;
- lighting;
- occlusion;
- uniqueness versus already selected clips;
- face/model naturalness;
- product-detail readability.

When `Highlight the top wear` is requested, top visibility and upper-body composition receive the highest relevance weighting while maintaining the 70/20/10 final distribution.

## Outro rules

When an ending/outro video is uploaded:

- keep it as the final segment;
- do not redesign or recreate it;
- preserve its existing logo, visual identity, timing, and animation unless the user explicitly asks to alter it;
- transition into it smoothly;
- do not place unrelated overlays on top of it.

## Audio rules

Default behavior:

- no generated speech;
- no AI voice-over;
- no narration;
- preserve useful original audio when appropriate;
- use supplied music when provided;
- beat-sync cuts and transitions when possible;
- avoid clipping or abrupt audio endings;
- fade music naturally into the outro/end when appropriate.

## Preservation validation before export

Before final export, inspect the edit for:

- face/identity changes;
- product color drift;
- fabric texture loss;
- logo/print distortion;
- size-tag changes;
- warped garment proportions;
- accidental stretch/distortion from cropping;
- missing important product areas;
- unintended generated/overlay elements;
- excessive sharpening or smoothing;
- shots that violate the requested framing distribution.

If a candidate edit fails preservation, replace or simplify that edit rather than accepting the visual change.

## One-command behavior

A request such as:

`Make these raw videos into a quality Reel. Highlight the top wear.`

should be sufficient when the media is uploaded.

Interpret it as:

`inspect → score → select → cut → reframe → arrange → transition → fade → audio/beat polish → preservation check → add outro → export`

Do not require the user to manually choose timestamps unless the task genuinely cannot be completed from the supplied media.