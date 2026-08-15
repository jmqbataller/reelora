# Editing Rules

## Automatic director mode

Reelora should make the editing decisions for the user after raw videos and an ending/outro are uploaded.

When one or many already-generated videos are uploaded, Reelora may re-edit them chronologically or recreate the edit structure from the strongest existing moments. It must not generate replacement scenes.

A generated-video remix must materially change the edit. Detect scene boundaries, isolate and trim source windows, remove redundant moments, vary durations, and rebuild pacing. `re_edit` stays chronological; `recreate` must introduce a non-chronological inversion or cross-source reorder when enough moments exist. Reject single-source output at 94% or higher normalized visual similarity and reject automatic edits that retain more than 90% of the source timeline.

All uploaded videos are mandatory by default. Allocate at least one shot to every source, balance shot counts across sources, and expose per-upload usage in the render audit. If a source cannot be analyzed, fail clearly rather than silently editing only the first or strongest upload.

It should automatically:

- inspect all footage;
- identify the strongest usable moments;
- remove weak, repetitive, blurry, awkward, or irrelevant sections;
- cut clips tightly;
- rearrange them for an engaging progression;
- crop/reframe toward the requested product focus;
- add sparse premium liquid/bloom/refraction/particle/light/glass/fabric/luma transitions;
- use restrained real-pixel parallax/orbit/depth animation;
- use fade-in and fade-out where appropriate;
- synchronize cuts to supplied music beats when possible;
- place the uploaded outro last;
- export a polished vertical Reel.

Never use a supplied logo or outro as a persistent watermark/overlay. Preserve it only in the final outro segment unless separate branding was explicitly requested.

Landscape sources must be detected automatically and converted to 1080x1920. Prefer a tracked product/subject smart crop; when no safe tracked crop exists, preserve the full frame over a blurred background made from the same uploaded pixels. Never stretch or outpaint.

## Style target

The edit should feel premium, social-ready, and interesting without becoming over-edited.

Preferred techniques:

- clean cuts;
- short dissolves/crossfades;
- match cuts;
- motion-matched transitions;
- subtle punch-ins/punch-outs;
- keyframed reframing;
- speed ramps;
- slow motion when supported by source footage;
- fade-in and fade-out;
- beat-synchronized pacing.

Avoid generic swing, slide, bounce, repeated directional wipes, or excessive effects that distract from the product.

## Forbidden by default

- overlay text;
- captions;
- price labels;
- stickers;
- decorative objects;
- artificial graphics;
- generated props;
- AI voice-over;
- narration.

## Outro behavior

The user-uploaded ending/outro video is always the final segment unless the user explicitly says otherwise. Preserve its existing look and animation. Transition into it smoothly and do not place unrelated overlays on top of it.
