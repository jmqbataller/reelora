# Example — Top Wear Reel

## User input

Upload:

- raw video 1
- raw video 2
- raw video 3
- ending/outro video
- optional music

Then say:

```text
Make these raw videos into a quality Reel. Highlight the top wear.
```

## Reelora interpretation

Automatically:

1. Inspect all raw videos.
2. Find the strongest top-wear moments.
3. Reject blurry, awkward, repetitive, obstructed, or weak sections.
4. Cut the best source moments into usable clips.
5. Build the main product sequence using approximately:
   - 70% top-wear-focused footage
   - 20% whole-body footage
   - 10% supporting detail footage
6. Crop/reframe full-body source footage into natural upper-body shots when that improves top visibility.
7. Use only original source pixels; never generate missing clothing/body/background.
8. Add clean cuts, interesting motion transitions, fade-in/fade-out, and subtle speed/pacing changes where appropriate.
9. Beat-sync the edit if music is provided.
10. Preserve the exact model, face, skin tone, body shape, product, fabric, texture, print, logo, tag, color, construction, length, and fit.
11. Add no overlay text, no overlay objects, and no voice-over.
12. Transition smoothly into the supplied ending/outro video.
13. Export as a 1080×1920, 9:16 MP4 unless another format is requested.

## Example visual sequence

```text
0:00–0:01.5  Strong upper-body hook
0:01.5–0:03  Top-wear medium shot
0:03–0:04    Whole-body context
0:04–0:06    Upper-body movement shot
0:06–0:07    Fabric / neckline detail
0:07–0:09    Upper-body angle change
0:09–0:10    Whole-body movement
0:10–0:12    Strong top-wear hero shot
0:12–end     Uploaded outro
```

Exact timing should adapt to the available footage and requested Reel length. The shot distribution is a target based on duration, with preservation and quality taking priority over forcing unsafe or repetitive clips.