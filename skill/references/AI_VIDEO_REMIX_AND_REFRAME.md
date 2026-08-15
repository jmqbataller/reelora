# AI Video Remix and Automatic Vertical Reframe

Use this workflow when the user uploads one or many already-generated videos and asks to recreate, remix, improve, shorten, or re-edit them as one Reel.

## Execution choice

Prefer `reelora_remix_ai_videos` for multiple uploads and include every path in `generatedVideos`. Use `reelora_remix_ai_video` only for exactly one upload.

For the bundled fallback, preserve story order with:

```bash
python3 scripts/reelora_edit.py \
  --input generated-video.mp4 \
  --output generated-video-reedit.mp4 \
  --remix-ai-video \
  --remix-mode re_edit \
  --landscape-reframe auto \
  --style premium
```

Reinterpret the edit using the strongest existing moments with:

```bash
python3 scripts/reelora_edit.py \
  --input generated-video.mp4 \
  --output generated-video-recreated-reel.mp4 \
  --remix-ai-video \
  --remix-mode recreate \
  --landscape-reframe auto \
  --style cinematic
```

For three uploaded generated videos, repeat `--input` and do not omit any attachment:

```bash
python3 scripts/reelora_edit.py \
  --input generated-one.mp4 \
  --input generated-two.mp4 \
  --input generated-three.mp4 \
  --output all-videos-reel.mp4 \
  --remix-ai-video \
  --remix-mode recreate \
  --landscape-reframe auto \
  --style premium
```

Every upload must contribute at least one shot. `re_edit` keeps upload order and chronological moments inside each video; `recreate` may interleave sources. An unreadable/empty source is a visible failure, not permission to fall back to only the first video.

## Material re-edit contract

A resized, reframed, watermarked, or transition-wrapped copy of the original timeline is not a remix.

- Detect existing scene cuts and isolate source windows between those boundaries.
- Trim setup/tail frames, change shot lengths, omit redundant material, and rebuild the pacing.
- Keep selected windows chronological in `re_edit`.
- In `recreate`, require a non-chronological inversion or cross-source reorder when enough shots exist.
- Automatic single-source remixes normally target about 76% of source duration for `re_edit` and 64% for `recreate`, and must retain no more than 90% of the original timeline.
- Never turn a supplied logo/outro into a persistent watermark or overlay. Keep the supplied outro at the end only.

Add `--outro OUTRO.mp4` only when the user supplies an ending. Add `--music MUSIC_FILE` when the user supplies music.

## Reframe rules

- Output 1080x1920, 9:16, square-pixel H.264 MP4.
- Keep portrait sources native before conservative crop/animation.
- For landscape sources, use tracked smart crop when reliable subject/product regions exist.
- Without tracked regions, use `blur_fill`: a full-frame foreground over a blurred/darkened background made from the same source pixels.
- Never stretch, squeeze, outpaint, hallucinate side content, or generate replacement frames.

## Verification

Require the JSON audit to report:

- `ai_video_remix: true`
- the requested `remix_mode`
- `automatic_vertical_reframe: true`
- each source orientation and size
- per-shot `vertical_reframe`
- `source_audio_replaced: true` unless the user explicitly requested original audio behavior
- `all_uploaded_videos_used: true`
- one `source_usage` entry per upload, each with `shot_count` greater than zero
- `materially_reedited: true`
- `visual_similarity_to_source` below `0.94` for a single-source remix
- `audio_peak_db` above `-55` when automatic or supplied music is expected
- trimmed/re-cut `selected_windows`; recreate ordering must differ from the original chronology when enough scenes exist

Probe the final MP4 and confirm 1080x1920 video plus an audio stream when automatic/supplied music is used.
