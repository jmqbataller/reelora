# Reelora Release Checklist

Use this checklist before publishing a new ChatGPT Skill ZIP.

## 1. Version and documentation

- [ ] Confirm `package.json` contains the intended release version.
- [ ] Confirm `README.md` Download ZIP link points to the same version.
- [ ] Add the release entry to `CHANGELOG.md`.
- [ ] Confirm `SKILL.md` describes AI-video remix, automatic landscape-to-9:16 reframing, executable fallback behavior, music replacement, premium transitions, and real-pixel animation.
- [ ] Confirm `.env.example` documents current runtime defaults.

## 2. Local validation

From the repository root, run:

```bash
npm install
npm run check
npm run build
npm test
npm run pack:skill
```

Expected ZIP for v0.7.0:

```text
dist-skill/reelora-skill-v0.7.0.zip
```

- [ ] `npm install` completes successfully.
- [ ] `npm run check` reports no TypeScript errors.
- [ ] `npm run build` completes successfully.
- [ ] `npm test` passes TypeScript/Python selectors and FFmpeg compatibility checks for every premium family.
- [ ] `npm run pack:skill` creates the versioned ZIP.

## 3. Verify ZIP contents

Open the ZIP and confirm these files exist:

```text
reelora/SKILL.md
reelora/manifest.json
reelora/references/MUSIC_AND_TRANSITIONS.md
reelora/references/AI_VIDEO_REMIX_AND_REFRAME.md
reelora/scripts/check_reelora_runtime.py
reelora/scripts/reelora_edit.py
```

- [ ] ZIP opens without corruption.
- [ ] ZIP has one top-level `reelora/` folder.
- [ ] `manifest.json` shows version `0.7.0`.
- [ ] `manifest.json` points `executableFallback.script` to `scripts/reelora_edit.py`.
- [ ] `SKILL.md` requires actual rendering when MCP or local FFmpeg execution is available.

## 4. Executable fallback smoke test

Run a real fallback edit with at least one raw video and one outro:

```bash
python3 skill/scripts/reelora_edit.py \
  --input raw-1.mp4 \
  --outro outro.mp4 \
  --output test-final.mp4 \
  --style fashion \
  --highlight top_wear
```

- [ ] Script completes successfully.
- [ ] JSON output reports `source_audio_replaced: true`.
- [ ] JSON output reports `music_source: reelora-original` when no song was supplied.
- [ ] Final MP4 contains both video and audio streams.
- [ ] Audio sample rate is normal playback-compatible output.
- [ ] No source clip soundtrack remains in the default automatic mix.

Repeat once with `--music supplied-song.mp3`:

- [ ] JSON output reports `music_source: user-supplied`.
- [ ] Supplied music is audible in the final MP4.

Run one landscape AI-video remix without an outro:

```bash
python3 skill/scripts/reelora_edit.py \
  --input generated-landscape.mp4 \
  --output test-ai-remix.mp4 \
  --remix-ai-video \
  --remix-mode re_edit \
  --landscape-reframe auto
```

- [ ] JSON reports `ai_video_remix: true` and `automatic_vertical_reframe: true`.
- [ ] JSON reports the source as landscape and per-shot `vertical_reframe: blur_fill` when no tracked crop is available.
- [ ] Final video is exactly 1080x1920 with no stretching or invented pixels.

## 5. Music and transition validation

- [ ] Automatic music matches the requested style/highlight closely enough for the edit direction.
- [ ] No third-party copyrighted recording/sample is bundled by the Reelora original generator.
- [ ] Cut timing is visibly varied rather than repeating the same duration for every clip.
- [ ] Most fashion/ecommerce changes are clean beat cuts.
- [ ] Premium liquid/bloom/refraction/particle/light/glass/silk/luma effects appear only at selected moments.
- [ ] No generic swing, slide, bounce, or repeated directional wipe pattern remains.
- [ ] Premium animation uses restrained real-pixel crop/scale motion.
- [ ] No long repeated dissolves or obvious effect on every cut.
- [ ] Flash is zero/one or otherwise extremely sparse for a short Reel.
- [ ] No rapid strobing or repeated full-white frames.
- [ ] Product/model/fabric remains visually unchanged.

Recommended default environment values:

```env
REELORA_AUTO_MUSIC=1
REELORA_SUBTLE_FLASH=1
REELORA_FLASH_CADENCE=8
REELORA_FLASH_STRENGTH=0.08
```

## 6. GitHub Release

The repository workflow `.github/workflows/release-skill.yml` automatically builds and publishes the ZIP when release-relevant files are pushed to `main`.

For v0.7.0, verify:

```text
Tag: v0.7.0
Title: Reelora v0.7.0 – AI Video Remix + Auto 9:16 Reframe
Asset: reelora-skill-v0.7.0.zip
```

- [ ] GitHub Actions `Reelora CI` passes.
- [ ] GitHub Actions `Reelora Skill Release` passes.
- [ ] Release tag/title are correct.
- [ ] Release notes match `CHANGELOG.md`.
- [ ] ZIP asset is attached and downloadable.
- [ ] README Download ZIP link works.

## 7. ChatGPT Skill upload test

- [ ] Download `reelora-skill-v0.7.0.zip` from GitHub Releases.
- [ ] Upload/install the ZIP in ChatGPT Skills.
- [ ] Confirm the ZIP contains `scripts/reelora_edit.py`.
- [ ] Run one product/fashion edit without supplying music and verify the song is actually replaced.
- [ ] Run one edit with a supplied song and verify that supplied song is used.
- [ ] Confirm selected transition moments feel premium and non-template while clean cuts still carry most of the Reel.
- [ ] Confirm preservation rules still apply.

## Release complete

A release is ready only when build, executable fallback, audio replacement verification, transition smoke test, ZIP verification, GitHub Release, and at least one ChatGPT Skill test all pass.
