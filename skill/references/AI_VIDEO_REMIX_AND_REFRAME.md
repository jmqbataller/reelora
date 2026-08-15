# AI Video Remix and Automatic Vertical Reframe

Use this workflow when the user uploads one already-generated video and asks to recreate, remix, improve, shorten, or re-edit it as a Reel.

## Execution choice

Prefer the MCP tool `reelora_remix_ai_video` when available.

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

Probe the final MP4 and confirm 1080x1920 video plus an audio stream when automatic/supplied music is used.
