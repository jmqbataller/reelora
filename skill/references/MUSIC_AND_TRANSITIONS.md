# Reelora Music Director & Premium Transition Engine

## Default automatic behavior

When the user uploads raw videos plus an ending/outro and does not supply a music track, Reelora should automatically create a premium music-backed edit unless the user explicitly requests silence.

The default audio workflow is:

1. Remove/ignore the raw clip soundtrack for the main automatic edit.
2. Prefer a verified local music-library track whose manifest explicitly records commercial-use rights.
3. If no verified library track is available, generate a sample-free Reelora Original Beat procedurally from synthesized tones/noise.
4. Use the selected BPM to make shot timing more beat-friendly when safe.
5. Normalize the final music level and add clean audio fade-in/fade-out.
6. Land the supplied outro naturally on the music timeline.

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
      "bpm": 116,
      "energy": 0.68,
      "mood": "premium-fashion",
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

Default procedural beat targets:

- premium: 116 BPM
- minimal: 108 BPM
- fashion: 120 BPM
- fast ecommerce: 126 BPM
- cinematic: 96 BPM
- luxury: 104 BPM
- clean commercial: 114 BPM

The BPM is a pacing target, not permission to cut away important garment/product information.

## Premium transition rules

Premium transitions must use deterministic transforms of real source frames only. Do not generate intermediate models, garments, backgrounds, logos, fabric, hands, or faces.

Allowed transition families include:

- smooth left/right/up/down motion transitions;
- clean dissolve;
- clean fade;
- restrained fade-to-black;
- very short clean cut/fade bridges;
- subtle product-safe crop movement around a transition.

Transition choice is style-aware:

- luxury: slower dissolve / fade-black / restrained smooth motion;
- fashion: more directional smooth transitions with controlled variety;
- premium: balanced dissolve, fade, fade-black, and smooth motion;
- fast ecommerce: shorter/faster smooth transitions and cuts;
- cinematic: longer fade-black/dissolve timing;
- minimal: mostly clean fade/dissolve;
- clean commercial: restrained premium motion.

Avoid transition spam. The product is always more important than the effect.

## Audio replacement rule

The automatic product/fashion workflow intentionally renders selected raw shots without source audio and adds the chosen music bed afterward. This avoids inconsistent camera audio and creates one coherent premium soundtrack.

If the user explicitly requests original sound, natural sound, or a mix, follow that instruction only when a reliable synchronized mix can be produced. Never add synthetic speech or AI voice-over.

## Preservation priority

Music and transition choices must never override:

1. model identity preservation;
2. product/fabric/color/logo preservation;
3. requested shot distribution;
4. product visibility;
5. safe crop boundaries;
6. supplied outro preservation.
