---
name: layout-composition
description: Use when placing, sizing or spacing anything on screen in this pipeline (padding, gaps, white space, text position and size, safe areas, Shorts vs YouTube framing) or when fixing a layout warning from `pnpm video check`.
---

# Layout & composition for the cartoon pipeline

The picture has to read in one glance on a phone held at arm's length. Every rule here serves that:
one clear subject, text big enough to read, nothing under the platform's buttons, and space that is
planned rather than left over.

All numbers below live in `remotion/story/frame.ts` (`frameSpec`) and are used by
`remotion/story/Layout.ts`. **Change the grid there, never with per-scene pixel nudges.**
`pipeline/check.mjs` mirrors the same numbers to judge rendered frames.
For diagnosing an odd frame step by step, follow `LAYOUT_REVIEW.md` (the user's checklist).

## 1. The grid per format

Both formats are 1080 px on their short side (`U`), so type sizes are comparable.

| | YouTube 1920×1080 | Shorts 1080×1920 |
|---|---|---|
| safe (art) | 5 % each side, bottom open for feet | 5.5 % sides, 6.5 % top, bottom open |
| text-safe | 5 % all round | x 6.5 %–88 %, y 7.5 %–80 % (right column + bottom 20 % are app UI) |
| caption band | 15–85 % wide, 83.5–94 % high (only if captions on) | 6–94 % wide, 48.5–57.5 % high |
| ground (feet) | 97 % | 98.5 % |
| label / body / h2 / h1 / display | 48 / 50 / 74 / 94 / 150 px | 56 / 56 / 80 / 100 / 136 px |
| gaps xs/s/m/l/xl | 10/20/36/56/88 | 12/24/40/64/96 |

Layout also insets the safe areas by 2 % W / 1.5 % H, because the default slow push-in and punch
zooms scale the frame from the centre and carry edge elements outwards.

Rules that follow from the grid:
- **Text never goes outside text-safe**, art never outside safe (characters' feet may touch the bottom).
- **The caption band is reserved.** In Shorts nothing but captions goes in 48.5–57.5 % of the height;
  the story area is above it (the "stage"), the narrator stands below it.
- **Minimum text size:** 48 px in Shorts, 40 px in YouTube (check warns below that). Labels are the
  smallest text in a frame; nothing explanatory is smaller than a label.
- **Spacing comes from the gap tokens**: object → its label = `xs`; between labels/rows = `s`–`m`;
  between objects in a row = `l`; between groups = `xl`. Never a raw pixel number in a scene.

## 2. Composition principles

1. **One focal point per frame.** Decide what the viewer looks at first (the thing being said right
   now). It is the biggest, most saturated, most central element, and it pops in on its word.
   Other elements are smaller or arrive later. More than ~6 things on screen → split the scene
   (compile warns).
2. **Size for a phone.** The main object is at least ~20 % of the short side (`check` warns under
   17 %); a lone hero object 55–70 %. If something is small, first remove the gap that squeezes it,
   then enlarge — enlarging first causes clipping.
3. **Planned white space.** Empty space is good when it is one calm area (sky above a character,
   the side the character looks into). It is bad as a stripe between related things (`empty-band`),
   as a phantom title row when there is no title (Layout only reserves rows that are used), or as
   an empty upper half in Shorts (`bottom-heavy`).
4. **Balance.** The content block of a centred layout sits near the frame centre (`off-centre` info).
   Side layouts (host left, props right) balance mass against mass: a big character against a
   group of props. Characters face into the frame, towards what they talk about.
5. **Nothing touches an edge.** An element that is cut by the frame edge looks like a mistake unless
   it is clearly entering or exiting.
6. **Labels belong to their object**: directly under it, `xs` gap, centred, 1–3 words. A label never
   floats free, never overlaps another object, and a row of labelled objects is spaced by the
   label width, not the icon width (`pack` does this).
7. **Text contrast:** labels are dark text on a white tag with an ink outline; titles and captions are
   white display text with a thick dark outline — readable on any ground. Do not put plain text
   directly on a busy background.
8. **Hierarchy is size, not decoration.** display > h1 > h2 > body/label. One title per frame at most.

## 3. Format-specific framing

**YouTube (16:9)** — wide: put the narrator on one third (`host_talk` x≈23 %) and the subject on the
other two thirds; steps/compare run as one row across the upper 2/3 with the narrator small below.
Captions are off by default; if on, the bottom band is reserved.

**Shorts (9:16)** — stacked: stage (story) on top, captions in the middle band, narrator at the
bottom (size ≈0.66 U). Never shrink the wide layout into the tall frame: `Layout.ts` lays out portrait
separately. Prefer 1–2 objects big over 4 small; 3–4 items become a 2×2 grid. Speech bubbles go in
the stage, not over the narrator's head (which sits behind the captions).

## 4. Workflow

1. Write or edit `storyboard.json` (see the `story-video-direction` skill).
2. `pnpm video check <name>` — renders each scene once settled and at its midpoint, in every
   format, reads the real on-screen box of each element (`data-box` tags, measured in the browser
   with the real fonts) and writes `out/check-<format>.md` + stills in `out/check/`.
3. **Errors must be fixed**: text outside text-safe, text collisions, anything in the caption band.
   **Warnings are judgement calls**: small subject, bottom-heavy, empty band, art near an edge
   during a punch zoom.
4. Look at the stills, not only the report. A passing check does not prove a good frame; a warning
   can be fine if there is a story reason (a later reveal, a character entering).
5. Fix in this order: storyboard content (fewer things, shorter labels, a better layout) →
   shared layout code (`Layout.ts` slots / `pack`) → the grid (`frame.ts`). Re-run check.

Code map: `frame.ts` grid · `measure.ts` real text widths (`textWidth`, `tagWidth`, `fitText`) ·
`Layout.ts` slots per layout, `pack()` for objects + labels, `keepIn()` clamps · `Scene.tsx` draws
and tags `data-box` · `check.mjs` judges · `StoryVideo.tsx` `useLayoutAudit` measures.
