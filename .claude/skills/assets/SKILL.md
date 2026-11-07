---
name: assets
description: Use when a video needs an object, icon or picture the prop library doesn't have — drawing new props in the house style (library or per-project SVG), using the user's own images, or finding openly licensed pictures with their sources recorded.
---

# Making assets for a video

First look in the library (Remotion Studio → `Library`, or `PROPS` in `remotion/story/Props.tsx`;
names and aliases are also matched from the narration by `pipeline/lexicon.mjs`). If nothing fits,
draw one. Drawing beats searching: everything in the video then shares one look.

**Night settings:** lit windows and lamps are drawn again above the darkening layer, so anything that hides them
in the daytime picture will not hide them at night. Never let buildings overlap; render a night still to check.

## 1. Look before you draw — never trace

When the object is unfamiliar, search the web for how flat icons and 2D cartoon illustrations show
it (e.g. "flat icon bug thick outline", "cartoon palette vector"). Note the *idea*: which silhouette
makes it recognisable, which 1–2 details carry the meaning (a beetle = round shell split down the
middle + six legs; a palette = thumb hole + paint blobs). Then close the references and draw your own
from simple shapes. Never copy paths, trace an image, or reproduce a logo, brand, mascot or known
character — draw a generic version (a "game engine" is an editor window, not a product logo).

## 2. House style (what makes a prop belong)

- 200×200 box centred on (0,0); the silhouette fills about 160–185 of it.
- Ink outline `#1d1b20`, 6 px, round joins and caps, on every closed shape (use `{...st}`).
- Flat fills from the palette (red `#e53950`, yellow `#ffc83d`, green `#3ddc97`, blue `#3b8df0`,
  purple `#6a35d6`, grey `#b0bec5`, skin/wood tones); no gradients, no shadows, no textures.
  At most one white highlight stroke for volume.
- 2–4 colours per object; the big shape is one saturated colour.
- Recognisable as a silhouette at 150 px (a phone shows props at roughly that size). Remove every
  detail that disappears at that size.
- Leave a calm, plain area where a face can go and set `face: {x, y, s}` to it — any prop can be
  given an expression.
- Optional idle motion through `t` (a blinking cursor, wiggling legs) — small and slow.

## 3. Two ways to add a prop

**Library prop (reusable in every video)** — add an entry to `PROPS` in `Props.tsx`:
```tsx
bug: {
  draw: (t) => (<g {...st}> ... </g>),
  face: { x: 0, y: -48, s: 0.32 },
  aliases: ["beetle", "insect", "glitch"],
},
```
then add narration words (English + Arabic, normalised) to `PROP_WORDS` in `pipeline/lexicon.mjs`
so the auto-director finds it, and list it in `STORYBOARD_GUIDE.md`. Check it in Studio → Library.

**Project prop (just this video)** — save an SVG as `projects/<name>/props/<prop-name>.svg`
(with a `viewBox`, ideally `0 0 200 200`, same style rules). Use it by file name anywhere a prop name
goes: `{ "name": "game-engine" }` or `{ "prop": "game-engine" }`. The pipeline embeds it (scripts
and event handlers are stripped, ids made unique) and fits it into the 200 box; `face` works too.

## 4. Pictures (photos, maps, screenshots)

Prefer the user's own files: put them in the project folder and use an `image` scene or an item
`image`. If a real photo is truly needed, use only openly licensed sources (Wikimedia Commons, NASA,
public-domain archives, CC0/CC BY), never photos of identifiable public figures, and record each file
in `projects/<name>/SOURCES.md` (file, source URL, author, licence, changes made). Credit CC BY
images in the video description. When in doubt, draw it instead.

## 5. Check

Render a still (`pnpm video stills <name>`) and look at the new asset at Shorts size next to the
existing props: same line weight, same colour family, readable at a glance.

## Story actors and settings

Read STORY_MODE.md before adding story artwork. Reuse Character.tsx human looks and Animal.tsx
dog/cat/bird actors where appropriate; static animal props do not have actor motion or speaker routing.
New clothing belongs in the human look system; persistent identity belongs in cast.look and a
scene-only costume in characters[].look. Keep new hats within the rig's bounds. Do not replace
existing farm/office backgrounds when adding a new setting. Register reusable additions in the
catalogue and document their names; render with actors present to check floor contact and occlusion.
