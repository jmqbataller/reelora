# Reelora Release Checklist

Use this checklist before publishing a new ChatGPT Skill ZIP.

## 1. Version and documentation

- [ ] Confirm `package.json` contains the intended release version.
- [ ] Confirm `README.md` Download ZIP link points to the same version.
- [ ] Add the release entry to `CHANGELOG.md`.
- [ ] Confirm `SKILL.md` describes the features included in the release.
- [ ] Confirm `.env.example` documents any new runtime settings.

## 2. Local validation

From the repository root, run:

```bash
npm install
npm run check
npm run build
npm run pack:skill
```

Expected ZIP for v0.5.0:

```text
dist-skill/reelora-skill-v0.5.0.zip
```

- [ ] `npm install` completes successfully.
- [ ] `npm run check` reports no TypeScript errors.
- [ ] `npm run build` completes successfully.
- [ ] `npm run pack:skill` creates the versioned ZIP.

## 3. Verify ZIP contents

Open the ZIP and confirm these files exist:

```text
reelora/SKILL.md
reelora/manifest.json
reelora/references/MUSIC_AND_TRANSITIONS.md
```

Also confirm the archive contains the expected Reelora reference documents and runtime helper scripts.

- [ ] ZIP opens without corruption.
- [ ] ZIP has one top-level `reelora/` folder.
- [ ] `manifest.json` shows the correct version.
- [ ] `SKILL.md` contains the current automatic-music and restrained-flash behavior.

## 4. Music and transition validation

- [ ] Generate at least one automatic-music Reel without supplying a song.
- [ ] Confirm the selected/generated music matches the requested editing style and product highlight.
- [ ] Confirm no third-party copyrighted recording or sample is bundled by the original generator.
- [ ] Confirm flash accents are sparse and restrained.
- [ ] Confirm no rapid strobing or repeated full-white frames are produced.
- [ ] Confirm the product/model/fabric remains visually unchanged.

Recommended default environment values:

```env
REELORA_AUTO_MUSIC=1
REELORA_SUBTLE_FLASH=1
REELORA_FLASH_CADENCE=5
REELORA_FLASH_STRENGTH=0.10
```

## 5. GitHub Release

The repository workflow `.github/workflows/release-skill.yml` automatically builds and publishes the ZIP when release-relevant files are pushed to `main`.

For v0.5.0, verify the release contains:

```text
Tag: v0.5.0
Title: Reelora v0.5.0 – Trend-Inspired Music + Subtle Flash Accents
Asset: reelora-skill-v0.5.0.zip
```

- [ ] GitHub Actions `Reelora Skill Release` workflow passes.
- [ ] Release tag is correct.
- [ ] Release notes match `CHANGELOG.md`.
- [ ] ZIP asset is attached and downloadable.
- [ ] README Download ZIP button/link works.

## 6. ChatGPT Skill upload test

- [ ] Download `reelora-skill-v0.5.0.zip` from GitHub Releases.
- [ ] Upload/install the ZIP in the ChatGPT Skill interface available to your account/workspace.
- [ ] Confirm Reelora is recognized as the current version.
- [ ] Run one simple product Reel test with automatic music.
- [ ] Run one fashion Reel test with subtle flash accents.
- [ ] Confirm preservation rules still apply.

## Release complete

A release is ready only when the build, ZIP verification, GitHub Release, and at least one ChatGPT Skill smoke test all pass.
