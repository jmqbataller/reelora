# Shot Distribution Rules

Shot distribution is calculated by **timeline duration before the outro**, not merely by clip count.

## Top-wear highlight

When the user says:

```text
Highlight the top wear
```

and does not provide another percentage split, use:

- **70% top-wear / upper-body focus**
- **20% whole-body context**
- **10% supporting detail**

**Total: 100%.**

### 70% — Top-wear focus

Preferred real-source framing:

- shoulders to waist;
- chest to waist;
- half upper body;
- upper torso close-up;
- medium shot where the top is visually dominant.

A full-body source may be reframed into an upper-body shot when the crop uses only original pixels and does not cut important garment details.

### 20% — Whole body

Use for:

- outfit context;
- overall fit;
- model movement;
- visual variation.

Whole-body footage remains supporting context when top wear is the requested hero.

### 10% — Details

Use authentic source footage for details such as:

- fabric texture;
- neckline;
- sleeves;
- logo or print;
- stitching;
- movement/stretch behavior.

## Timing example

For a 20-second product section before the outro:

- 14 seconds focus;
- 4 seconds whole body;
- 2 seconds detail.

The uploaded outro is a separate ending segment unless the user explicitly requests otherwise.

## Custom percentages

If the user says:

```text
80% top wear, 20% whole body
```

interpret this as:

- focus = 80%
- whole body = 20%
- detail = 0%

If values are expressed as weights rather than exact percentages, Reelora normalizes them to 100%.

## Footage shortage behavior

Do **not** break the requested distribution just to hit a requested duration.

When selected source windows are too short:

1. try another safe, high-quality source window;
2. use preservation-safe reframing of real pixels when appropriate;
3. reduce the total content duration if necessary;
4. keep the requested timeline distribution exact/within validation tolerance;
5. never generate replacement footage to fill missing time.

Quality and preservation are more important than forcing a longer Reel.

## Other highlight defaults

Reelora may use other focus/whole-body/detail defaults for other intents such as fabric, print, fit, pants, shoes, or front/back. Explicit user percentages always take precedence over those defaults while strict preservation rules remain non-negotiable.
