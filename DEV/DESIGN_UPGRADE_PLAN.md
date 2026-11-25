# Character design upgrade: less childish, more varied

Goal: the main cast reads as their ages (Berry, Wendy and Benny adults, Cherry a teen), every character has a face of their own, and the acting
feels less like a children's cartoon. Keep the house style: flat fills, thick ink outline, the renderer's
lighting (see `ART_STYLE.md`).

## Done (November 2026)

| Change | Where |
|---|---|
| `look.build`: `kid` (about 2 heads tall, 0.84 × a teen's height), `teen` (about 2.5 heads), `adult` (about 2.7 heads, 1.06 × a teen; the default). Nobody has a neck: the first version's small heads and necks were removed at the user's request. Every preset has a build. | `BUILDS`, `heightOf` in `remotion/story/Character.tsx`; `PRESETS` in `theme.ts` |
| Camera `on` aims at the face height of each build | `faceAim` in `Character.tsx`, used in `Scene.tsx` |
| Head shapes `bean`, `oval`, `square` (soft corners), beside round, egg and wide | `headPath` in `Character.tsx` |
| Eye styles `big`, `halfshut`, `iris` (+ `irisColor`), `flick` | `Eye` in `remotion/story/Face.tsx` |
| Emotes keep their size on smaller heads; the head outline stays about as thick as the body's | `Character.tsx` |
| Berry: adult, round head, big eyes, long skirt and blouse · Benny: adult, soft square head, brown iris eyes · Cherry: teen, oval head, half-shut eyes | `PRESETS` in `remotion/story/theme.ts` |

These choices per character are a first pass: swap them freely in `theme.ts`.

### Check it on the PC

These renders need the PC, so run them yourself or in a local Claude Code session:

```bat
pnpm exec remotion still remotion/index.ts LibraryLooks out/design-check/berry.png --props=DEV/design-check/berry.json
pnpm exec remotion still remotion/index.ts LibraryLooks out/design-check/benny.png --props=DEV/design-check/benny.json
pnpm exec remotion still remotion/index.ts LibraryLooks out/design-check/cherry.png --props=DEV/design-check/cherry.json
pnpm exec remotion still remotion/index.ts LibraryCharacters out/design-check/all.png
```

Then re-render one existing story (for example `stills.bat berry-game-builder`) and check:
close shots (`camera.on`) still frame the face, speech bubbles clear the heads, held props sit in the
hand, sitting poses still meet chairs, and the hair covers the top of every head shape.

## Next, in order of impact

1. **Hands.** The round white hands read as cartoon gloves. For `teen` and `adult`: hands in the skin
   colour by default, a little smaller, with a thumb and a simple mitten of fingers; keep `open`, `point`
   and `fist`. (`Hand` in `Character.tsx`.)
2. **Limbs.** Tapered tubes: thicker at the shoulder and thigh, thinner at the wrist and ankle; slightly
   thicker legs for teens. (`tube`, `arm`, `leg` in `Character.tsx`.)
3. **Face details per character.**
   - `look.nose`: none · dot · hook (a small side curve) · button. Small and placed at the gaze.
   - `look.brows`: thin · thick · arched · flat. Today every character has the same stick brow.
   - `look.mouthSize`: a smaller default mouth for teens and adults.
   - Make blush subtler on older builds (lighter and smaller), and use freckles sparingly.
4. **Skin.** Give new characters real skin tones by default instead of white faces, and decide whether
   Berry and Benny keep white faces as a signature.
5. **Acting.**
   - Listening: while someone else speaks, the listener nods, blinks and raises a brow now and then
     instead of standing still.
   - Gestures on stressed words: start a gesture on the word that carries the line, using the word times.
   - Weight shift in idle: a slow shift from one leg to the other.
   - Lopsided expressions: one raised brow, a half smile, a squint on one side (new `EXPR` entries such as
     `skeptical`, `unimpressed`, `sly`). These carry adult humour better than wide-eyed reactions.
   - The eyes lead a head turn by a few frames.
   - Hold a pose for a beat before a punchline (a storyboard rule, not code).
6. **Three-quarter view.** Characters turned towards each other: shift the face features to one side,
   flatten the far side of the head and the hair. The largest piece of work; plan it after 1–5.
7. **Line weight.** Thinner lines for inside details on the body too (pockets, folds, laces), as the face
   now does.

For each step: change one thing, render the `LibraryLooks` sheets and one story scene by day and by night,
and compare with the previous render before going on.
