# My Custom Setup — story video maker

Give it **your narration (.wav)**, **the story text with time segments**, and it makes a cartoon
explainer video in the style of the reference videos (round-headed characters with lip-sync,
objects with faces, flat colourful grounds, pop-in animation, music and sound effects) — as
**YouTube 16:9** and **Shorts / Reels / TikTok 9:16** at the same time.

## Quick start (Windows)

1. Once: double-click **setup.bat** (installs the JS + Python packages and a headless browser).
2. Double-click **new-video.bat**, type a name, e.g. `earth-age`. A folder opens: `projects\earth-age\`.
3. Put your narration in it as **voice.wav** and write **script.txt**:
   ```text
   0    | 4.2  | Did you know that the Earth is hotter inside than the surface of the Sun?
   4.2  | 9.0  | Scientists think the core is about 6000 degrees. But how do we know that?
   ```
   (seconds or `m:ss.s`; an `.srt` file also works. Arabic and English are both supported.)
4. Double-click **make-video.bat inside the project folder**. When it finishes, the `out` folder opens:
   `earth-age-youtube.mp4`, `earth-age-shorts.mp4`, and `earth-age.srt`.
   To make just one format (about half the time), use **make-short-video.bat** (9:16 Shorts) or
   **make-landscape-video.bat** (16:9 YouTube) in the same folder.
   Each project folder also has **stills.bat** (one picture per scene) and **preview-video.bat** (Remotion Studio).
   The root `make-video.bat` still works too: it asks for the project name.

Options (add after the name): `--format youtube|shorts|both` · `--draft` (fast half-size test) ·
`--replan` (rebuild the storyboard from scratch) · `--mood epic` · `--no-music`.

Other buttons: **stills.bat** (one picture per scene, seconds instead of minutes) ·
**preview-video.bat** (Remotion Studio: scrub through the video) ·
**hyperframes-export.bat** (an editable HyperFrames version; add `--render` to render it there).

## Getting a *great* video: let Claude direct it

`make` first writes `projects\<name>\storyboard.json` with an automatic, keyword-based director.
It is a decent draft, but it does not understand the story. For the best result ask Claude:

> "Direct the storyboard for projects/earth-age, then render it."

Claude reads `STORYBOARD_GUIDE.md`, rewrites the scenes (layouts, characters, expressions, objects
with faces timed to the words, jokes, title cards) and runs the pipeline. You can also edit
storyboard.json yourself — it is kept between runs unless you use `--replan`.

`video.json` in each project holds settings:

```json
{ "title": "How old is the Earth?", "language": "auto", "formats": ["youtube", "shorts"],
  "captions": "auto", "music": "auto", "host": "host", "sfx": true, "watermark": "@mychannel" }
```
* `captions`: `"auto"` = burned-in word captions on Shorts only; `true`/`false`; or `{"youtube": true}`.
* `music`: `"auto"`, a mood (`playful curious epic space upbeat calm`), `"none"`, or a path to your own track.
* `host`: the narrator's look (`host`, `scientist`, `girl`, `sage`, … see the guide), or `"hostLook": {...}`.
* `mix`: `{"music_db": -8, "sfx_db": -14, "duck_db": 12, "lufs": -14}` to rebalance the sound
  (music ≈18 dB under the voice while it talks, ≈11–13 dB in its pauses; see `build/audio_report.json`).

## What each tool does here

| Tool | Job in the pipeline |
|---|---|
| [Remotion](https://github.com/remotion-dev/remotion) | Renders the video: React/SVG scenes → H.264 MP4 (both formats), stills, Studio preview |
| [GSAP](https://github.com/greensock/gsap) | All motion easing (back/bounce/elastic…) as frame-exact functions; drives the HyperFrames clock |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | Alternative renderer + editable HTML export of the same scenes (GSAP timeline) |
| [Tone.js](https://github.com/tonejs/tone.js/) | Synthesizes the music score offline in headless Chromium (plucks, mallets, pads, drums, reverb) |
| [pretty_midi](https://github.com/craffel/pretty-midi) | Composes an original score per video (mood, tempo, chords, motif) → `score.mid` |
| [pedalboard](https://github.com/spotify/pedalboard) | Voice clean-up, reads any audio, sidechain-style ducking, SFX processing, loudness mastering |

Pipeline: `script.txt + voice.wav` → parse & validate segments → voice analysis (cleaned voice,
lip-sync curve, word timing) → storyboard (auto or Claude) → music (pretty_midi → Tone.js) + SFX
(cued from the storyboard) → mix (pedalboard, −14 LUFS) → Remotion render → MP4 + SRT.

Word timing is estimated from the voice's energy unless whisper.cpp is found next to this folder
(`..\whisper.cpp`) with a model: then captions use real word timestamps. For Arabic, put a
multilingual model there (e.g. `ggml-small.bin`); `ggml-base.en.bin` only covers English.

## Folders

```
projects/<name>/        voice.wav, script.txt, video.json, storyboard.json (yours to edit), props/*.svg (optional), out/ (videos)
projects/<name>/build/  generated: cleaned voice, analysis, score.mid, spotting.json, music/sfx stems, mix.wav
remotion/story/         the cartoon library: Character, Face, Props, Backgrounds, Scene layouts, captions
pipeline/               cli.mjs (all commands), parse, director, lexicon, compile, renderers, Tone.js
audio/                  analyze_voice.py, compose_music.py, mix.py (+ the original make_jingle.py)
assets/                 bundled fonts (Baloo Bhaijaan 2, Lalezar — OFL) and paper grain
STORYBOARD_GUIDE.md     every layout, pose, expression, prop and setting
.claude/skills/         how Claude directs, lays out, scores, draws and checks videos here
```

Command line (any OS): `pnpm video <new|plan|audio|render|make|stills|check|qc|studio|hyperframes|doctor> <project> [options]`.

## Quality checks

* **`pnpm video check <name>`** — renders every scene (settled + midpoint) in each format, measures
  where each element really is, and reports layout problems: text outside the safe area or under the
  Shorts buttons, collisions, anything in the caption band, text too small, subjects too small,
  empty halves. Report: `out/check-youtube.md`, `out/check-shorts.md`, stills in `out/check/`.
* **`pnpm video qc <name>`** (also runs at the end of `make`) — checks the finished MP4s: size, fps,
  duration, black or frozen picture, loudness (−14 LUFS) and peak, and makes a one-frame-per-second
  sheet. Report: `out/final-pass.md`.
* `plan`/`make` also warn when on-screen text is up too briefly to read, labels are too long, or a
  scene has too many things in it.

## Your own drawings

Put SVG drawings in `projects/<name>/props/` (e.g. `props/game-engine.svg`) and use them by name in
the storyboard like any library prop: `{ "prop": "game-engine" }`. Draw them in the same flat style
(see `.claude/skills/assets/SKILL.md`).

## Original toolkit commands (still work)

`pnpm studio` (Remotion Studio, includes the Library catalogue) · `pnpm hf:preview` ·
`uv run audio/make_jingle.py`. Remotion is free for individuals and small teams; larger companies
need a [company license](https://www.remotion.dev/license).
