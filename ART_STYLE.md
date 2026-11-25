# Art style: lit cartoon

The house style since November 2026. It replaces the earlier flat style (flat fills on a flat ground,
stick limbs, cuts only). The drawings are still simple shapes with a thick ink outline; what changed
is that they now sit in a **lit space, with depth, shot like a film**.

For shot choices and timestamped examples from HeyHistori, HussainAbd, RickCli and uselessTru, see [Portrait direction](REFERENCE_VIDEO_STUDY.md). Draw original silhouettes with flat fills and thick ink outlines. Use an illustrated setting to establish depth and keep the area behind the main action quiet.

## One light for everything

The light comes from the **upper left**. The renderer adds it; drawings stay flat fills.

- **Cel shade** (`remotion/story/shade.tsx`): every form gets a cool violet shadow band along its
  lower-right edge: heads, hair, torsos, hats, every prop (`PropArt`), and the scenery of the story
  settings. A fringe or hat also throws a shadow onto the face, and the head onto the chest.
- **Ground shadows** are soft ovals under characters and under props that stand on the floor
  (`"anchor": "bottom"`), leaning away from the light.
- **Scene light** (`remotion/story/light.tsx`): a sun bloom and two faint light shafts over the
  background, a slightly darker floor, then over the whole picture a warm-to-cool colour grade, a
  vignette and paper grain.
- **Depth**: skies and grass are gradients; when the camera is close on the actors the background
  goes softly out of focus.

So **do not draw gradients, shadows or highlights into a new prop or character part**: draw flat
fills with the ink outline, and the renderer shades it like everything else. One white shine stroke
is still fine (hair, glass).

### Light moods

A scene gets its mood from its background: `day` outdoors, `warm` indoors (living room, kitchen,
classroom, office…), `cool` for sea/lab/airport, `dusk` and `night` from `"time"`, `night` for
space and dark grounds. Override per scene with `"light"`:

`day` · `warm` · `cool` · `dusk` · `night` · `spot` (the set goes dark around a pool of light in the middle while the actors stay bright, for a
punchline or an aside) · `none` (no lighting layers; `image` backgrounds use this by default).

## Characters

- Arms and legs are **tubes with an outline**, in skin, sleeve or trouser colour, drawn as one
  smooth curve through the elbow or knee. Everyone wears shoes (`look.shoes` sets the colour).
- Short sleeves come from the outfit; bare legs with dresses, dungarees and tunics; trousers
  otherwise (`look.pants`).
- The face shifts slightly with the gaze, so the head reads as a ball.
- Feet at y = 0, about 560 units tall, the same poses for everyone.
- **Builds** (`look.build`) set the proportions and the height: `kid` is about 2 heads tall (head scale
  1.32) and 0.84 × a teen's height; `teen` about 2.5 heads (head 1.14); `adult` about 2.7 heads (head
  1.04) and 1.06 × a teen, with longer arms and legs. A look with no build is an adult.
  **Nobody has a neck**, now or in a new character: the big head sits on the collar and the body is narrow.
  Age shows in height, limbs and clothes, not in a neck or a small head. Cherry is a teen; Berry, Wendy
  and Benny are adults; the other young presets are teens.
  The numbers live in `BUILDS` in `Character.tsx`; `heightOf` gives the drawn height and the camera's
  `on` aims at each build's face (`faceAim`).
- **Skirts**: Berry's is long in every outfit (`look.skirt: "midi"`, mid-calf; works with `blouseskirt`,
  `cardiganskirt` and `hoodieskirt`). Use it for other grown-up women; bib dresses and short flared skirts
  are for the young. Wendy (18) keeps the knee-length skirt of her design.
- **Head shapes** (`look.head`): round, egg, wide, bean, oval, square. Hair is drawn for a round head,
  so a new shape must stay inside the hair's outline at the top (the soft square is rounder at the top
  than at the jaw for this reason).
- **Face position on a long head**: a head clearly longer than wide (`oval`, `egg`) must carry its eyes, brows, mouth and blush
  lower, or the chin looks empty (the user has corrected this twice). `faceYOf` in `Character.tsx` does it for every
  long head, so never draw or move those features by hand. A new head shape goes in `HEAD_SIZE`, which also decides this.
  After designing such a character, look at it happy and shocked: no empty chin, and the open mouth stays above the chin line.
- **Eye styles** (`look.eyes`, `Face.tsx`): `big`, `halfshut`, `iris`, `flick`. The expression still
  picks the lid shape (narrow, sad, half, wide); the style decides how the eye is drawn. Give each main
  character a different style so their faces are told apart at a glance.
- Lines inside the face are thinner than the outline: on smaller heads the face lines scale down with the
  head while the head's outline keeps about the body's thickness.

## Camera

`camera` on a scene (all optional; see STORYBOARD_GUIDE.md):

| Field | Does |
|---|---|
| `zoom: [from, to]`, `pan`, `focus` | the slow move over the whole scene, as before |
| `on: "berry"` | aims at that cast member's face and centres them: a close shot. The character must be in the scene. With both `on` and `focus`, `focus` wins |
| `moves: [{at, zoom, on, focus, duration}]` | changes the shot **inside** the scene: `duration: 0` cuts, the default 0.55 s pushes in. `on: ""` stops centring and keeps the current aim |
| `tilt: [from, to]` | a slow roll, −4 to 4 degrees, for unease or energy. The picture is enlarged to cover the corners (about 6 % per degree), so a tilted shot is also a closer shot |
| `drift: false` | switches off the hand-held sway that every shot has by default (the slow push-in from `zoom` still runs; use `zoom: [1, 1]` for a locked frame) |
| `punch`, `shake` | as before |

How to use it:

- **Fill the frame.** A wide shot shows where we are; then go closer. A person should usually fill
  a third of the frame height or more. Use `zoom` 1.1–1.2 for two people, 1.2–1.4 `on` one character. In Shorts (9:16) the frame is narrow: with two or more people in a row keep `zoom` at 1.0–1.2 so nobody is cut at the sides (the user's rule); 1.4 at most `on` a character standing alone. Never crop a character to get a close-up.
- **Cut to the reaction.** When one character says something surprising, cut (`duration: 0`) to the
  other one's face.
- **Reframe on a change of attention.** Use `moves` for a reveal or a listener’s reaction. Hold a shared shot while both people’s actions matter. The location,
  the actors' places and the screen direction stay the same across those shots.
- `zoom` is 1 to 3: below 1 the picture would not fill the frame, and `validate` refuses it.
- A close shot must keep the face clear of the caption band; `check` looks at the frame after every
  camera move and reports it.

## Transitions

`cut` is still the default. The others now really move, with the old and the new scene meeting:

| `transition` | Looks like | Use for |
|---|---|---|
| `whip` | both pictures streak sideways with a sideways-only motion blur | a jump in time or place |
| `slide` | the new picture pushes the old one out | the next step of a list or story |
| `zoom` | the old picture grows past the camera and the new one settles in behind it | going "into" a topic |
| `iris` | a circle opens from the middle | a new chapter, an ending |
| `flash` | a white flash | a title card, an impact |
| `fade` | a cross-fade | a calm change, time passing |

All last `MOTION.transition` (0.32 s) and never show an empty frame.

## Motion

- **Anticipation and overshoot**: a gesture first dips a little the other way, passes its target,
  then settles (`sampleTrack`'s `bounce`, set in `Scene.tsx`). Poses change over 0.5 s. A gesture that
  is interrupted carries on from where it is, at the speed it has.
- **Squash and stretch** as a pose lands; a small hop with it.
- **Secondary motion**: hair lags behind the head, buns and curls jiggle, the scarf sways, the light
  breathes, the camera drifts.
- Everything is a pure function of the time, so any frame can be rendered alone, at any frame rate.

## Checking a change to the style

`node scripts/palette.mjs check <preset>` for colours, then render the cast grid
(`LibraryCharacters`), one story scene by day and by night, and one flat-ground scene with props.
Look for: shade on the lower right of every form, no double shadows, faces readable under a fringe,
lit windows and lamps still bright at night.
