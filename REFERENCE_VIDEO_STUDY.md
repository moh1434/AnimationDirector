# Portrait reference study — 5 November 2026

Source: `C:/Users/lenovo/Desktop/Ai Influencer/Resoucre_Videos_To_Learn_From/portrait`.
Studied all five files using frames at two-second intervals across their duration, including
the endings, plus FFprobe metadata and FFmpeg loudness measurements. Sheets and metadata are
under `out/reference-study/`. Timestamps below locate sampled evidence, not exact edit boundaries.
This is a visual structure study, not a full-speed playback or listening review: exact easing,
lip sync, word synchronization and sound-effect timing are not established by these samples.
Historical/scientific claims in the references have not been fact-checked; do not reuse them as sources.

## What each video teaches

| File | Duration | Sampled evidence | Useful transfer to our pipeline |
|---|---:|---|---|
| video1 | 100.96 s | 0–12 s: ocean/map context becomes a negotiation tableau. 22–40 s: territory → island → resources/workers. 66–74 s: river and cargo explain a route. 88–100 s: negotiation returns, then sale and territorial result. | Establish context, reveal the relevant detail, then return to the original situation with its state changed. Use a recurring object/location as the story's anchor. |
| video2 | 94.37 s | 0–12 s: proposed barrier changes from red wall imagery to green trees. 32–38 s: soil cross-section shows roots, then their removal. 48–54 s: a height guide makes the dust wall legible. 74–94 s: dimensions, trees, wind and outcome return to the opening premise. | For mechanisms, show what changes physically. Put quantities beside the thing measured. Pay off the opening question visually. |
| video3 | 54.29 s | 2–18 s: one pot remains central while water/heat cues change. 20–34 s: conditions, sun, shade and replenishment are layered onto the same setup. 44–50 s: outside/inside temperature labels summarize the result. | Preserve one diagram over several narration beats. Reuse geometry and change only relevant state. This is the clearest counterexample to changing the layout every few seconds. |
| video4 | 125.69 s | 8–30 s: Italy map, front line, arrows and photographic inserts. 32–60 s: hill/monastery remains an anchor while close-up soldiers react. 62 s: large question. 64–86 s: archival insert. 88–118 s: ruins, consequences, return to map. | Alternate context, enacted scene and reaction. Keep landmarks stable. Reserve big text for a genuine narrative turn. An evidence insert needs a separate asset/source workflow. |
| video5 | 124.48 s | 8–16 s: stacked animal comparisons. 18–26 s: horse/cart situation and reaction. 52–58 s: animals and aircraft share a visual relationship. 60–78 s: bird/bat examples build from subject to role. 80–96 s: night scene develops a consequence. 102–124 s: dog/tank demonstration and narrator reaction. | Let characters perform the sentence. Pose, gaze and consequence communicate more than decorative gestures. Use vertical stacking for comparison when it improves reading order. |

## Changes to the directing workflow

1. **Plan meaning before selecting props.** For each passage write the viewer takeaway, visible
   cause → change → result, focal subject, spoken trigger and missing asset. The generated brief
   now includes this worksheet. Copy it to `build/direction-notes.md` so regeneration cannot erase notes.
2. **Select a treatment per passage.** Character action suits decisions and comedy; a persistent
   diagram suits mechanisms; spatial context suits movement and geography. These are directing
   choices, not new renderer enums. Mix them only when the narration benefits.
3. **Build connected sequences.** Keep the subject, setting, colours and screen direction across
   an explanation. A long sequence can contain several beats without introducing a new background.
   Existing `actions`, `at`, `out`, `items`, custom SVGs and related scenes provide the basic tools.
   Shared layout alone does not guarantee continuity: inspect entrances and camera resets at cuts.
4. **Make the host optional on screen.** A large mechanism can occupy the frame; use `speaker: none`
   when the narrator is off screen. Keep reactions for turns, uncertainty and payoff. Preserve the
   original narration and all its timing.
5. **Give movement a job.** Reveal a cause, show direction, change state, or react to a result.
   Use `camera.zoom: [1, 1]` for an intentional fixed view; verify it in preview. Do not add movement
   merely because a shot lasts several seconds. A persistent setup is not a frozen explanation.
6. **Separate caption and diagram roles.** Captions carry spoken text; labels identify parts,
   actors, dates or quantities. Avoid showing the same sentence twice. The references' tiny
   subtitles and occasional crowded labels should not become our sizing standard. Keep the
   current safe-area checks, Arabic shaping and RTL support.
7. **Review the explanation as well as the geometry.** Inspect opening, before-change, result,
   reaction and exit frames, then play the sequence. Ask whether the subject can be identified
   immediately, the change can be followed, and the result has enough reading time. Use
   `pnpm video validate <name>` and `pnpm video check <name>` before requested Shorts renders.

## Fit with the existing implementation

`pipeline/director.mjs` remains a keyword-based draft: it alternates camera zoom, uses hash-based
choices for some faces/layouts, inserts periodic gestures, and forces host shots at opening/end.
These choices cannot infer the causal structure demonstrated here. The immediate improvement is
therefore in the human/agent directing pass and generated brief, rather than another arbitrary
style preset. Existing authored storyboards and render behavior were not changed by this study.

Already supported: hero/compare/transform/steps, character actions, timed props, image scenes,
custom project SVGs, captions, camera controls and layout checks. Use those before adding APIs.

Potential later renderer work, in order of value:

- Persistent mechanism states (fill/drain, cross-sections, heat/wind arrows) with deterministic
  transitions; useful for video3-like explanations. Not implemented by this change.
- Subject-aware close-ups and continuity across scene boundaries. Current camera controls need
  explicit directing and inspection; do not assume automatic target tracking.
- Verified map regions/routes and a sourced archival-video scene. The current image layout is
  not a full geographic or archival-footage system. Use relevant map/media skills for a concrete
  project, source assets, and retain our flat illustration style instead of copying reference art.

## Measurements and limits

All five references are 720×1280 at 30 fps. Our output uses `VIDEO_FPS` from `.env` (30 by default).
Measurements below are FFmpeg loudnorm **input** values, measured over each complete audio stream.

| File | Integrated LUFS | True peak dBTP | LRA LU |
|---|---:|---:|---:|
| video1 | -14.56 | +0.19 | 2.20 |
| video2 | -20.67 | -3.64 | 2.40 |
| video3 | -16.94 | -0.66 | 3.70 |
| video4 | -15.88 | +0.10 | 7.80 |
| video5 | -15.29 | -0.06 | 2.90 |

The variation does not justify copying a reference mix. Keep our existing -14 LUFS / -1 dBTP
targets and narration priority. These measurements do not isolate music, voice or effects;
no claims about their relative loudness or exact cue timing follow from them.

The references supply storytelling inspiration, not reusable illustrations, maps, characters,
historical facts or soundtracks. Their detailed textures, glow and photographic backgrounds are
optional stylistic choices; preserve this project's established flat cartoon direction.
