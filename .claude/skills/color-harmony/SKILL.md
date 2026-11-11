---
name: color-harmony
description: Use when choosing or changing colours in this pipeline — a character's hair, clothes and accents, a new prop, a ground or a title colour — or when the user says colours look wrong, loud, dull or do not go together.
---

# Colours that work together

Colours are chosen by three numbers, not by taste: **lightness** (L, 0 dark – 1 light), **strength**
(chroma C, 0 grey – about 0.25 neon) and **hue** (h, an angle). They come from OKLCH, a colour space
where equal numbers look equal to the eye. HSL and hex do not: a yellow and a blue with the same HSL
"lightness" look nothing alike. Run the helper to see the numbers:

```powershell
node scripts/palette.mjs show "#5b4be0" "#ffc83d"     # L, C, h of any colours
node scripts/palette.mjs schemes "#7a2a55"            # colours that go with one
node scripts/palette.mjs check berry                   # test a character preset
node scripts/palette.mjs check berry hairColor=#6f63b8 hairTips=#f4a6bd    # try changes without editing
node scripts/palette.mjs cast                         # every preset's hair colour
```

**Strength and lightness decide whether a palette pleases; hue only decides its mood.** Two characters
with the same hues can be lovely or tiring depending on how strong and how light each area is.
A palette where every colour is at full strength has nowhere for the eye to rest.

## The rules (`check` tests all of them)

1. **Big areas are quiet, small areas are strong.** Hair and the main garment are the big areas:
   keep them at chroma 0.06–0.14. Full strength (0.16–0.20) is for small things: a bow, buttons,
   shoes, a star, a scarf. At most **one** big area may be strong, and then the other must be quiet.
2. **Hair is never neon.** It is the biggest shape on a character. Keep it at chroma 0.15 or less:
   deep (L 0.40–0.55) or soft (L 0.65–0.80), not electric.
3. **Average strength 0.08–0.14.** Weighted by area. Over 0.16 everything shouts.
4. **Two hue families in the big areas, three at most.** White, ink, greys and anything under
   chroma 0.04 are neutral and free. Small accents do not count.
5. **A lightness ladder.** Neighbouring areas differ in lightness by 0.12 or more (hair and face by
   0.22), so the figure still reads in black and white. Hue contrast alone is not enough.
6. **No big fill darker than L 0.40** (ink lines vanish in it); the ink outline is the darkest thing.
7. **Stands off the grounds.** A big fill should differ from the grounds in `BG_CYCLE` (theme.ts) by
   0.10 or more. If one ground is too close, do not put that character on it.
8. **Main characters have their own hair colour.** Run `cast`; stay 0.09 away from the others.

## Building a palette

1. **Start from one colour that is the character** — usually the hair. Choose its mood by lightness
   and strength first (deep and warm, soft and light, …), then its hue.
2. **Get the second big colour from `schemes`.** Pick one relationship:
   - *analogous* (hue ±30°): calm and warm, e.g. brown hair, yellow dress;
   - *complementary* (180°) or *split* (150°/210°): lively, e.g. red-brown hair, teal dress;
   - *triadic* (120°): playful, needs one of the three to be very quiet.
   Then lower its chroma or change its lightness until rules 1 and 5 hold.
3. **One accent**, small and strong, repeated two or three times (clip, buttons, shoes). Take it from
   the opposite side of the hue wheel from the biggest area, or reuse the house coral `#ff6b5e` or
   yellow `#ffc83d`.
4. **Tints of the same hue** for tips, shine and shadow (`schemes` prints them): same hue, lighter
   and a little weaker. Never a new hue for a highlight.
5. **Warm or cool, not both.** Decide the temperature of the character; the accent may be the
   opposite. A warm character (browns, reds, yellows) feels friendly; a cool one (blues, teals) calm.
6. `check`, then **look at it**: render the options side by side and let the user choose (below).
   Numbers remove bad palettes; they do not choose between good ones. Never pick for the user.

## Showing options

`LibraryLooks` draws one preset in several colourings on one picture:

```powershell
pnpm exec remotion still remotion/index.ts LibraryLooks out/characters/options.png --props=looks.json --frame=20
```

`looks.json`: `{"page":"looks","name":"berry","pose":"wave","expression":"happy","looks":[{"label":"1 · Cocoa","look":{"hairColor":"#7a4a32","hairTips":"#f0a868"},"background":"#fff1d6"}]}`.
Number the options, keep the current one first as "Now", and use one neutral ground (cream `#fff1d6`)
so only the character changes. Then show the winner on three or four grounds from `BG_CYCLE`.

## Props, grounds and text

- **Props:** 2–4 colours, the big shape one colour at chroma 0.10–0.17, one white highlight
  (assets skill). A prop next to a character should not repeat the character's hair colour.
- **Grounds** are the quietest thing on screen: light (L 0.85–0.95) and weak (chroma under 0.10).
  The pastel names in `BG` already are. Change ground when the meaning changes, and choose one whose
  hue is away from the main character's big areas.
- **Text and titles:** white or ink with the ink outline; a highlight colour only for the spoken word.

## Where the colours live

`remotion/story/theme.ts`: `PRESETS` (per character: `hairColor`, `hairTips`, `shirt`, `pants`,
`accent`, `hatColor`, `shoes`, `skin`, `hands`), `BG`, `BG_CYCLE`, `SHIRTS`. A storyboard can also
override them per cast member (`cast.<id>.look`).

Background reading (ideas only, nothing copied): Björn Ottosson's OKLab, and meodai's
`skill.color-expert` on GitHub, whose point that chroma and lightness matter more than hue is the
basis of rule 1.
