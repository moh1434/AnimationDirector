---
name: story-video-direction
description: Use when directing a video in this pipeline — turning the narration, word times and segments into storyboard.json scenes (layouts, timing, objects, faces, reactions, camera, transitions, motion) in the house cartoon style.
---

# Directing a story video

The voice is the spine. Every visual decision is timed to a word the viewer hears, and the picture
explains or comments on that word — never competes with it. The style is the one in
`..\Source Videos To Train On`: round-headed cartoon narrator, objects with faces, flat colour
grounds, limited (pose-to-pose) animation, very little text.

Read `STORYBOARD_GUIDE.md` for the full field reference; this skill is about *choices*.

## 1. Break the narration into shots

- Read the whole script first. Find the beats: hook, setup, each point, the turn, the punchline, the
  call to action.
- One idea per scene, usually 3–7 s. A very short punch (≤1 s) is fine for a title card that echoes
  the voice ("Now play it!"); anything longer than ~7 s needs a change inside it (new object,
  pose change, camera move) or a split.
- **Cut in the pause before a word**, never in the middle of a sound. Scene `start` ≈ next word start
  − 0.06 s (words in `build/analysis.json`; `voiced` holds where the voice actually sounds).
- Variety: no layout twice in a row unless it is a deliberate series; change the ground colour every
  scene or two; `mirror` now and then so the narrator is not always on the left.

## 2. Choose the layout that explains the sentence

| the line is about… | layout |
|---|---|
| the narrator explaining, 1–3 things | `host_talk` |
| one important thing | `hero` (give it a face) |
| a dialogue / asking someone | `duo` + `bubble` |
| imagining, wondering | `thought` |
| a punchline or a turn | `title` (≤4 words, echo the voice) |
| a person | `name_card` |
| A vs B | `compare` · A becomes B → `transform` · a process → `steps` (2–5) |
| a figure | `number` |
| a real place/photo the user supplied | `image` · a headline → `news` |
| "everyone", an audience | `crowd` |

## 3. Timing and motion

- **Appear on the word**: `"at": "@word"`. Things arrive when named, not before; the viewer's eye goes
  to what moves, so the pop *is* the pointer.
- **Stagger related elements** 2–4 frames apart at minimum (0.07–0.13 s); a list follows the voice.
- **Hold**: after something lands, let it sit. A settled frame for ≥0.5 s before the next change
  makes the shot readable; motion everywhere reads as noise.
- **Read time** for any on-screen sentence: words ÷ 3 + 1 s after it has appeared (less if it repeats
  what the voice says). `compile` warns when a title, note or bubble is up for less.
- **Ease**: entrances overshoot a little (`back.out` / squash-and-stretch pops), exits are quick and
  plain. Characters snap between poses (limited animation), then hold; eyes blink, mouths flap.
- **Camera**: a slow push-in is automatic. Use `punch` on the one surprising word in a scene,
  `shake` only for impact. Not every scene needs a camera move.
- **Transitions**: the reference style mostly cuts. Use `whip`/`zoom` to mark a new section, `flash`
  into a title card. A transition always carries the eye somewhere — the screen should never sit
  empty or black between shots.

## 4. Character acting

- The narrator reacts to the line: point when an object pops in, shrug on "but", think on a
  question, celebrate on good news, facepalm on a mistake. 1–3 `actions` per scene.
- Faces on objects comment on the line (a smug sun, a scared bug, an excited gamepad). Use faces on
  some objects, not all — a face is a focal point.
- Emotes (`question`, `idea`, `sparkle`…) are punctuation: one per scene at most.

## 5. Text on screen

Very little. A 1–3 word tag under an object, a title card of ≤4 words, a name card, a number.
The voice says the sentence; the screen shows the keyword. Shorts get burned-in captions (they sit
in the reserved band), YouTube doesn't by default.

## 6. Honesty

Never invent facts, statistics, maps or likenesses of real people; never draw real logos or brands
(a "game engine" is a generic editor window). Use `image` scenes with the user's own files.

## 7. Loop

`pnpm video plan <name>` → rewrite `storyboard.json` → `pnpm video check <name>` (layout, both
formats; see `layout-composition`) → fix → `pnpm video make <name>` → read `out/final-pass.md`
(see `final-pass`). Drawing a missing object: see `assets`. Music and effects: see `music-scoring`.
