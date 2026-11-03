---
name: music-scoring
description: Use when changing the music or sound effects of a video in this pipeline — the composed score (pretty_midi → Tone.js), spotting hits to the picture, tempo, melody, intensity, ducking under the voice, and how many sound effects to use.
---

# Scoring the picture

Music and effects exist to make the narration easier and more fun to follow. They are never the
subject. The narration is the timing source: never retime or stretch the voice to fit the music —
the music adapts to the voice and the cuts.

Files: `audio/compose_music.py` (score), `pipeline/tone-render.mjs` (renders it in Chrome with
Tone.js), `audio/mix.py` (ducking, effects, loudness), `pipeline/compile.mjs` → `sfxCues` (which
effects, when). The CLI writes `build/spot-input.json` (scene starts, layouts, transitions, and the
voice's `voiced` intervals) and the composer writes `build/spotting.json` (what it hit and how).

## 1. Spotting map — decide what the music answers

Go through the scenes and give each structural moment exactly one treatment:

| treatment | what the music does | used for |
|---|---|---|
| direct hit | an accent (kick + crash + a short chord stab) exactly on the cut | `whip` / `zoom` / `flash` / `iris` transitions |
| anticipation | the band rests on the beat before, a short fill leads in, the accent lands on the cut | a `title` card (the punchline) |
| aftermath | a held chord after the moment, letting it ring | a `number` reveal |
| no hit | the music simply carries on | most plain cuts |

Restraint is the point: if every cut is hit, none of them is. A 30 s video wants 3–6 hits.

## 2. Tempo map — make the hits land on beats

The composer searches tempos within ±8 % of the mood's tempo, and a downbeat phase, so the hits fall
on beats and the big ones (title cards, the ending) on a bar line. Each hit is then snapped to the
grid; one that would be more than ~110 ms off the picture is left unhit (it would feel late). The
ending chord lands on a beat just after the last word. Check `spotting.json`: `off_ms` should be
small for every hit that is not `none`.

## 3. Harmony and melody

- A short motif (2 bars) repeated with variation, over a 4-chord loop per mood.
- **Harmony lock**: melody notes on strong beats are chord tones of the current chord; weak beats may
  pass through the scale. This keeps a simple synth score from sounding random.
- **The lead only plays in the voice's pauses** (before the first word, in gaps, after the last word).
  Under speech the music is rhythm and harmony only, so it never fights the words for the ear.

## 4. Intensity curve

Energy comes from the scenes: title 1.0, number 0.85, crowd 0.8, hero 0.75, steps/compare 0.7,
host_talk 0.55, thought 0.45, plus a lift over the last 30 % of the video. Energy drives drum
density (half-time below 0.5, extra hats above 0.85), the chord pattern (quarters vs eighths),
register and velocity. Turnaround fills go in the bar leading into a big hit.

Moods: playful, curious, epic, space, upbeat, calm (`"music"` in `video.json`, or `--mood`;
a path to the user's own track replaces the composed score).

## 5. Mix targets

`audio/mix.py` defaults (override in `video.json` → `"mix": {...}`):
- music in the voice's pauses ≈ 8 dB under the voice RMS (`music_db: -8`) and ducked a further
  12 dB while it talks (`duck_db: 12`, attack 25 ms, release ~220 ms) → measured ≈18 dB under in
  speech, ≈11–13 dB in short pauses (`build/audio_report.json`).
- master: −14 LUFS integrated, true peak ≤ −1 dBTP (look-ahead limiter).

## 6. Sound effects

Effects are derived from what appears (`sfxCues`), each with a priority: the user's own `sfx`,
shakes and a number landing always play; transitions, titles and emotes next; object pops only where
there is room around them; small ticks last. Spacing per priority comes from the storyboard's
`sfxDensity` (`sparse` | `normal` default | `full`). Roughly one effect for every few on-screen
actions is right; a pop on every element turns into clatter. Effects never sit on top of a stressed
word of the voice — move the `at` or drop it.
