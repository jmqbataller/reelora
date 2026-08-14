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
  --highlight top_wear
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

## Modern transition rules

The goal is not to show off transitions. The goal is to make the product Reel feel professionally paced.

Default priorities:

- 70–90% of changes should feel like clean beat cuts or almost-instant fade bridges;
- use variable shot lengths, not a repeated 1.4-second template cadence;
- use a micro-whip/smooth motion accent only occasionally, roughly every 5–7 transitions at most;
- keep motion transitions around 0.07–0.10 seconds;
- keep short fades/dips around 0.04–0.09 seconds;
- avoid slow dissolves for fashion/ecommerce;
- avoid repeating left/right/up/down patterns;
- do not apply an obvious effect on every cut.

Suggested shot rhythm:

- quick detail: roughly 0.6–1.0 seconds;
- normal product/focus shot: roughly 0.9–1.7 seconds;
- hero/product hold: roughly 1.5–2.6 seconds when source footage supports it.

Transition personalities:

- fashion / fast ecommerce: mostly hard beat cuts, occasional micro-whip or micro-dip;
- premium / clean commercial: mostly clean cuts, rare short motion/fade accent;
- luxury / cinematic: clean cuts with occasional short fade-black/micro-dip;
- minimal: almost entirely cuts with rare short fade.

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
- transition audit is mostly `beat-cut` / clean-cut rather than repeated long dissolves.

If verification fails, do not present the render as finished.

## Preservation priority

Music and transition choices must never override:

1. model identity preservation;
2. product/fabric/color/logo preservation;
3. requested shot distribution;
4. product visibility;
5. safe crop boundaries;
6. supplied outro preservation.
