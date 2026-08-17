# Reelora Custom GPT setup

Reelora v0.8 adds an attachment-first Custom GPT workflow plus an optional hosted Action API.

## Why an uploaded MP4 previously produced an edit plan instead of a video

A video attached to a Custom GPT is not automatically executed by code stored in the GPT's Knowledge files. Knowledge is reference material. For a chat-uploaded MP4, the GPT needs **Code Interpreter & Data Analysis** enabled so it can inspect the real attachment with Python/FFmpeg and create a new MP4.

Do not configure Reelora to ask the user for screenshots when a video file is already attached. The correct order is:

1. Use Code Interpreter/Data Analysis on the attached video.
2. Locate the uploaded media in the runtime.
3. Probe it with FFprobe and inspect scene boundaries with FFmpeg.
4. Re-cut/reorder the real source windows.
5. Render the requested duration and verify the final MP4.
6. Return the generated file.
7. Only report a runtime limitation after the executable path was actually attempted and is unavailable.

## Custom GPT configuration

In **Edit GPT -> Configure**:

- Enable **Code Interpreter & Data Analysis**.
- Put the contents of `custom-gpt-instructions.md` in the GPT Instructions field.
- Keep Reelora reference documents in Knowledge if useful, but do not treat Knowledge files as executable programs.

Recommended test:

1. Upload one MP4.
2. Ask: `Reshuffle the scenes. The finished Reel must be 11 to 13 seconds.`
3. Reelora should target roughly the midpoint (12 seconds), analyze the actual attachment, reshuffle real scenes, render, verify the duration is inside 11-13 seconds, and return the MP4.

It should **not** answer with `send screenshots`, `paste the scene sequence`, or a made-up timeline when Code Interpreter is available.

## Optional hosted Action backend

The Reelora HTTP server now exposes:

- `GET /openapi.json` — OpenAPI 3.1 schema for Custom GPT Actions.
- `POST /actions/remix` — starts an asynchronous FFmpeg render job.
- `GET /actions/jobs/{jobId}` — polls the job until it is completed or failed.
- `GET /actions/health` — action runtime health.
- `GET /outputs/...` — finished files when `PUBLIC_BASE_URL` is configured.

Set these environment variables when deploying the server:

```text
PUBLIC_BASE_URL=https://your-reelora-host.example.com
REELORA_API_KEY=use-a-long-random-secret
```

Then import `https://your-reelora-host.example.com/openapi.json` in the GPT Actions editor and configure the same API key there.

### Important attachment rule

The hosted Action endpoint accepts HTTPS media URLs. A video that exists only as a private attachment inside the current ChatGPT conversation may not have a usable public URL for an Action call. In that case, Reelora must use Code Interpreter/Data Analysis on the attachment instead of inventing a URL or asking the user for screenshots.

## Duration ranges

The Action API accepts:

```json
{
  "videoUrl": "https://example.com/video.mp4",
  "remixMode": "recreate",
  "minDuration": 11,
  "maxDuration": 13
}
```

Reelora resolves a range to its midpoint for the first render, measures the finished duration, makes one corrective render when necessary, and fails visibly rather than returning a file outside the requested range.
