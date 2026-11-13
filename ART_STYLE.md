# Art style: lit cartoon

The house style since November 2026. It replaces the earlier flat style (flat fills on a flat ground,
stick limbs, cuts only). The drawings are still simple shapes with a thick ink outline; what changed
is that they now sit in a **lit space, with depth, shot like a film**.

The style was worked out from four kinds of reference Shorts
(`..\Resoucre_Videos_To_Learn_From\portrait`). They supply ideas, never drawings:

| Reference | What makes it look good | What we took |
|---|---|---|
| RickCli | Stick-limb characters no richer than ours, in lit rooms: light shafts, night glow, gradients, soft focus, a new angle every 2 s | scene lighting, depth blur, shot changes inside a scene |
| HeyHistori | Hand-drawn figures with two-tone cel shading, thick limbs, painted skies, close-ups and over-shoulder framing | cel shade on every form, thick limbs, gradient skies, close shots |
| HussainAbd | Big expressive faces close to the camera, bold labels, a commentator in the foreground | face close-ups on a reaction, cuts to the listener |
| uselessTru | Very simple drawings carried by strong poses, spotlight cutaways on black | anticipation and overshoot in poses, the `spot` light |

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

`day` · `warm` · `cool` · `dusk` · `night` · `spot` (a spotlight on a dark frame, for a punchline or
an aside) · `none` (no lighting layers; `image` backgrounds use this by default).

## Characters

- Arms and legs are **tubes with an outline**, in skin, sleeve or trouser colour, drawn as one
  smooth curve through the elbow or knee. Everyone wears shoes (`look.shoes` sets the colour).
- Short sleeves come from the outfit; bare legs with dresses, dungarees and tunics; trousers
  otherwise (`look.pants`).
- The face shifts slightly with the gaze, so the head reads as a ball.
- Geometry is unchanged: feet at y = 0, about 560 units tall, the same poses and presets.

## Camera

`camera` on a scene (all optional; see STORYBOARD_GUIDE.md):

| Field | Does |
|---|---|
| `zoom: [from, to]`, `pan`, `focus` | the slow move over the whole scene, as before |
| `on: "berry"` | aims at that cast member's face and centres them: a close shot |
| `moves: [{at, zoom, on, focus, duration}]` | changes the shot **inside** the scene: `duration: 0` cuts, the default 0.55 s pushes in |
| `tilt: [from, to]` | a slow roll in degrees, for unease or energy |
| `drift: false` | switches off the hand-held sway that every shot has by default |
| `punch`, `shake` | as before |

How to use it:

- **Fill the frame.** A wide shot shows where we are; then go closer. A person should usually fill
  a third of the frame height or more. Use `zoom` 1.3–1.5 for two people, 1.8–2.0 `on` one face.
- **Cut to the reaction.** When one character says something surprising, cut (`duration: 0`) to the
  other one's face.
- **Change the shot every 2–4 s** in dialogue, with `moves`, and keep the setting. The location,
  the actors' places and the screen direction stay the same across those shots.
- A close shot must keep the face clear of the caption band; `check` reports it.

## Transitions

`cut` is still the default. The others now really move, with the old and the new scene meeting:

| `transition` | Looks like | Use for |
|---|---|---|
| `whip` | both pictures streak sideways with motion blur | a jump in time or place |
| `slide` | the new picture pushes the old one out | the next step of a list or story |
| `zoom` | the old picture grows past the camera and the new one settles in behind it | going "into" a topic |
| `iris` | a circle opens from the middle | a new chapter, an ending |
| `flash` | a white flash | a title card, an impact |
| `fade` | a cross-fade | a calm change, time passing |

All last `MOTION.transition` (0.32 s) and never show an empty frame.

## Motion

- **Anticipation and overshoot**: a gesture first dips a little the other way, passes its target,
  then settles (`sampleTrack`'s `bounce`, set in `Scene.tsx`). Poses change over 0.5 s.
- **Squash and stretch** as a pose lands; a small hop with it.
- **Secondary motion**: hair lags behind the head, buns and curls jiggle, the scarf sways, the light
  breathes, the camera drifts.
- Everything is a pure function of the time, so any frame can be rendered alone, at any frame rate.

## Checking a change to the style

`node scripts/palette.mjs check <preset>` for colours, then render the cast grid
(`LibraryCharacters`), one story scene by day and by night, and one flat-ground scene with props.
Look for: shade on the lower right of every form, no double shadows, faces readable under a fringe,
lit windows and lamps still bright at night.
