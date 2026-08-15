# Reelora Music Director & Modern Transition Engine

## Default automatic behavior

When the user uploads raw videos plus an ending/outro and does not supply a music track, Reelora should create a music-backed edit unless the user explicitly requests silence or original/natural sound.

The default audio workflow is:

1. Remove/ignore the raw clip soundtrack for the main automatic edit.
2. Prefer a verified local music-library track whose manifest explicitly records commercial-use rights.
3. If no verified library track is available, generate a sample-free Reelora Original trend-inspired instrumental from synthesized tones/noise.
4. Use the selected BPM to make shot timing more beat-friendly when safe.
5. Normalize the final music level and add clean audio fade-in/fade-out.
6. Land the supplied outro naturally on the music timeline.
7. Verify the final MP4 contains the expected replacement music stream.

## Executable fallback inside the Skill ZIP

The Skill package includes `scripts/reelora_edit.py` for execution environments that have Python, FFmpeg, and FFprobe but do not have the Reelora MCP backend connected.

Example:

```bash
python3 scripts/reelora_edit.py \
  --input raw-1.mp4 \
  --input raw-2.mp4 \
  --outro outro.mp4 \
  --output final.mp4 \
  --style fashion \
  --highlight top_wear \
  --transition-intensity balanced \
  --transition-family liquid-splash \
  --transition-family prism-refraction
```

With supplied music:

```bash
python3 scripts/reelora_edit.py \
  --input raw-1.mp4 \
  --outro outro.mp4 \
  --music song.mp3 \
  --output final.mp4 \
  --style fashion \
  --highlight top_wear
```

The script renders source clips without their original audio, maps only the chosen/generated music bed into the final MP4, and prints JSON containing `source_audio_replaced`, `music_source`, `music_mood`, BPM, and transition audit data.

## Rights and licensing rule

Do not call a random internet track "no copyright" or "copyright free" without a reliable rights record.

Verified automatic-library tracks must be explicitly marked as one of:

- CC0;
- public domain;
- user-owned;
- separately licensed for commercial use.

Reelora may also use its own procedural original beat fallback. This fallback uses synthesized waveforms/noise and no third-party recordings or samples. Do not make a universal legal guarantee about copyright status in every jurisdiction.

User-supplied songs may be used, but their usage rights remain the user's responsibility unless a separate license record is supplied.

## Local verified music library

Set `REELORA_MUSIC_LIBRARY` to a folder containing `manifest.json` and audio files.

Example:

```json
{
  "tracks": [
    {
      "id": "premium-01",
      "title": "Premium Fashion Beat",
      "file": "premium-01.mp3",
      "bpm": 124,
      "energy": 0.82,
      "mood": "viral-fashion",
      "rights": {
        "kind": "licensed",
        "commercialUse": true,
        "source": "license-receipt-or-provider-reference",
        "note": "Commercial use verified by the library owner."
      }
    }
  ]
}
```

Reelora rejects library entries without an accepted rights type and `commercialUse: true`.

## Style-aware automatic BPM

Typical trend-inspired targets:

- premium: about 122 BPM
- minimal: about 108 BPM
- fashion: about 124–126 BPM
- fast ecommerce: about 132 BPM
- cinematic: about 102 BPM
- luxury: about 112 BPM
- clean commercial: about 118 BPM

The BPM is a pacing target, not permission to cut away important garment/product information.

## Premium transition and real-pixel animation rules

The goal is to create a few memorable designed moments without turning the Reel into a transition template.

Default priorities:

- most changes should remain clean beat cuts or almost-instant fade bridges;
- use variable shot lengths, not a repeated 1.4-second template cadence;
- use one selected premium effect roughly every 3–5 transitions depending on style;
- keep effect duration inside the 0.10–0.34 second safety range;
- support `subtle`, `balanced`, and `bold` intensity;
- avoid slow dissolves for fashion/ecommerce;
- avoid stock swing, slide, bounce, and repeated directional-wipe patterns;
- do not apply an obvious effect on every cut.

Premium effect families:

- `liquid-splash` — a fast radial ripple resembling a splash opening around the subject;
- `ink-bloom` — an organic center bloom;
- `prism-refraction` — an optical blur/refraction bridge;
- `particle-crystallize` — a compact crystalline pixel resolve;
- `light-sweep` — a short cinematic diagonal energy reveal;
- `glass-ripple` — a lens-like circular collapse;
- `silk-fold` — a fabric-inspired fold reveal;
- `luma-bloom` — a short luminance dissolve.

These are deterministic FFmpeg transitions between real uploaded frames. The names describe their visual direction; Reelora does not generate literal water, ink, glass, particles, fabric, or replacement product pixels.

Premium animation families use only conservative crop, scale, and position changes:

- hero-frame breathe;
- product parallax orbit;
- macro orbit drift;
- editorial depth float;
- kinetic product arc;
- silk camera float.

Suggested shot rhythm:

- quick detail: roughly 0.6–1.0 seconds;
- normal product/focus shot: roughly 0.9–1.7 seconds;
- hero/product hold: roughly 1.5–2.6 seconds when source footage supports it.

Style personalities:

- fashion / fast ecommerce: liquid, particle, ink, refraction, and occasional silk;
- premium / clean commercial: liquid, light, refraction, glass, and luma;
- luxury / cinematic: silk, glass, ink, refraction, and luma;
- minimal: refraction, light, and luma only.

Avoid transition spam. The product is always more important than the effect.

## Flash rule

Flash is an accent, not a transition system.

For short Reels, prefer zero or one restrained brightness flash around a strong beat/drop. Keep it very short (about 0.05–0.08 seconds) with a small brightness lift. Never use full-white frames, rapid strobing, repeated flicker, or consecutive flashes.

## Audio replacement rule

The default automatic product/fashion workflow intentionally renders selected raw shots without source audio and adds the chosen music bed afterward.

This is a mandatory behavior unless the user explicitly requests original sound, natural sound, silence, or a synchronized mix.

After rendering, verify:

- final MP4 has an audio stream;
- the executable fallback reports `source_audio_replaced: true`;
- `music_source` is `reelora-original` or `user-supplied` as expected;
- transition audit names premium families, keeps them sparse, and uses an `outro-safe-dip` into the supplied ending.

If verification fails, do not present the render as finished.

## Preservation priority

Music and transition choices must never override:

1. model identity preservation;
2. product/fabric/color/logo preservation;
3. requested shot distribution;
4. product visibility;
5. safe crop boundaries;
6. supplied outro preservation.
