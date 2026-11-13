# AnimationDirector — cartoon stories and explainers

Make illustrated stories with recurring characters, animal actors, scene-specific costumes,
indoor/outdoor settings, and supplied voices. Or keep using the original single-narrator explainer workflow.

- [Story mode and multi-voice setup](STORY_MODE.md)
- [Storyboard field reference](STORYBOARD_GUIDE.md)
- [Guide for local agents](LOCAL_MODEL_GUIDE.md)
- [Voices from text](TTS.md): only a script, or a new character with no recording? Audar-TTS (clones, English and Arabic) or Qwen3-TTS (designs new English voices) makes a few takes per character on this PC,
  you listen and pick one each, and they become the video's recordings.

Give it **your narration (.wav)**, **the story text with time segments**, and it makes a cartoon
explainer video in the style of the reference videos (round-headed characters with lip-sync,
objects with faces, cel shading and scene lighting, close camera work, pop-in animation, music and
sound effects; the look is described in [ART_STYLE.md](ART_STYLE.md)) — as
**YouTube 16:9** and **Shorts / Reels / TikTok 9:16** at the same time.

## Requirements

* **Windows 10/11** (the .bat buttons; the `pnpm video …` commands also run on macOS/Linux).
* **[Node.js](https://nodejs.org/) 22 LTS or newer**: `winget install OpenJS.NodeJS.LTS`.
* **Chrome or Edge** (for the music render). Remotion downloads its own headless browser during setup.
* Installed by **setup.bat** for you: [pnpm](https://pnpm.io/) (JS packages),
  [uv](https://docs.astral.sh/uv/) (Python + pretty_midi, pedalboard, numpy), Remotion's browser, and `.env`.
* **[FFmpeg](https://ffmpeg.org/)** (`winget install Gyan.FFmpeg`), required for multi-voice clip assembly, HyperFrames
  renders and the full final-pass checks; optional for the basic single-narrator path.
* Recommended: **[whisper.cpp](https://github.com/ggml-org/whisper.cpp)** plus a model, for exact word
  timing (captions, objects that appear on a word). It lives outside this repo; point `.env` at it
  (see [whisper.cpp settings](#whispercpp-settings-env)).

## Quick start: story with multiple voices

1. Run `pnpm video new my-story --story`.
2. Add recordings to `projects/my-story/voices/` and a `dialogue.json` manifest with each
   clip's `who`, `file`, exact `text`, and optional `gap` or `start`.
3. Run `pnpm video plan my-story`. It assembles clips and measures their durations, then runs
   the existing voice analysis. Read `build/brief.md` and `build/dialogue-timeline.json`.
4. Direct `storyboard.json` with matching cast IDs and `layout: "story"`, timed with `clip:N` so new takes need no retiming.
5. Run `pnpm video validate my-story`, `pnpm video check my-story`, inspect the frames, then
   `pnpm video make my-story` (Shorts by default, at `VIDEO_FPS` from `.env`).

No TTS model is needed when you supply the recordings. With only a script, [TTS.md](TTS.md) makes
the voices locally with Audar-TTS or Qwen3-TTS and you pick one take per character. FFmpeg is required for
clip assembly and is already available on this installation. See [STORY_MODE.md](STORY_MODE.md)
for the complete manifest, limitations, wardrobe options and silent Studio demo.
The original `voice.wav` + `script.txt` path below continues to work.

## Quick start: single narration (Windows)

1. Once: double-click **setup.bat** (installs the JS + Python packages and a headless browser, and
   creates your `.env` settings file — see [whisper.cpp settings](#whispercpp-settings-env) below).
2. Double-click **new-video.bat**, type a name, e.g. `earth-age`. A folder opens: `projects\earth-age\`.
3. Put your narration in it as **voice.wav** and write **script.txt**:
   ```text
   0    | 4.2  | Did you know that the Earth is hotter inside than the surface of the Sun?
   4.2  | 9.0  | Scientists think the core is about 6000 degrees. But how do we know that?
   ```
   (seconds or `m:ss.s`; an `.srt` file also works. Arabic and English are both supported.)
4. Double-click **make-video.bat inside the project folder** to make both videos. When it finishes,
   the `out` folder opens: `earth-age-youtube.mp4`, `earth-age-shorts.mp4`, and `earth-age.srt`.
   To make just one format (about half the time), use **make-short-video.bat** (9:16 Shorts) or
   **make-landscape-video.bat** (16:9 YouTube) in the same folder.
   Videos render at **`VIDEO_FPS`** from `.env` (30 by default; a project's `video.json` may set `"fps"`). From the command line, `pnpm video make <name>` makes only the Shorts
   video (the `formats` setting); AI agents never render the YouTube version unless you ask.
   Each project folder also has **stills.bat** (one picture per scene) and **preview-video.bat** (Remotion Studio).
   The root `make-video.bat` still works too: it asks for the project name.

Options (add after the name): `--format youtube|shorts|both` · `--draft` (fast half-size test) · `--gpu` / `--cpu` (override `REMOTION_RENDERER` for one run) ·
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
{ "title": "How old is the Earth?", "language": "auto", "formats": ["shorts"],
  "captions": "auto", "music": "auto", "host": "host", "sfx": true, "watermark": "@mychannel" }
```
* `formats`: what `pnpm video make` renders by default (`["shorts"]`); the .bat buttons choose for you.
* `fps`: leave it out to use `VIDEO_FPS` from `.env` (30 by default); set it only for a project that needs its own rate (60 is smoother, renders take about twice as long).
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

## whisper.cpp settings (.env)

[whisper.cpp](https://github.com/ggml-org/whisper.cpp) gives exact word timing: captions, and objects
that appear on a word, use it. It is not part of this repo (the models are 0.5–1.6 GB); you point the
pipeline at your copy in **`.env`** (created by setup.bat from `.env.example`; never committed):

```env
WHISPER_PATH="../whisper.cpp/"        # your whisper.cpp folder, relative to this folder or absolute
WHISPER_EN_MODEL="small.en"           # model for English narration
WHISPER_AR_MODEL="large-v3-turbo"     # model for Arabic (and other languages); must be multilingual
```

`.env` can also set `REMOTION_RENDERER="gpu"` (the default: Chrome draws on the graphics card and NVENC encodes at
6 Mbit/s; a failed GPU render retries on the CPU) or `"cpu"` (software drawing and x264, smaller files), and
`REMOTION_BUNDLER="rspack"` (the default) or `"webpack"`: the bundler Remotion uses to
build the video code before rendering and for Studio. Rspack builds the same video about 4–5× faster
(cold 21 s → 4.3 s, cached 2.7 s → 0.7 s in a test); switch to webpack if anything ever looks different.

A model name means the file `<WHISPER_PATH>/models/ggml-<name>.bin`; you can also give a path to a `.bin` file.
Both settings may name the same multilingual model (for example `large-v3-turbo` in each) if you want one download
for English and Arabic; a `.en` model only works for English.

| Model | Size | Use |
|---|---|---|
| `base.en` | 148 MB | English, fastest |
| `small.en` | 488 MB | English, good default |
| `medium.en` | 1.5 GB | English, more accurate |
| `small` / `medium` | 488 MB / 1.5 GB | any language |
| `large-v3-turbo` | 1.6 GB | any language, best for Arabic |

Get whisper.cpp: build it ([instructions](https://github.com/ggml-org/whisper.cpp#quick-start)) or
unzip a Windows release (`whisper-bin-x64.zip`) into the folder. Download a model:

```powershell
cd ..\whisper.cpp\models
.\download-ggml-model.cmd small.en
.\download-ggml-model.cmd large-v3-turbo
```

Every `plan` / `make` checks `.env` first and stops with a clear message if the folder, the
`whisper-cli` program or a model file is missing (it lists the models you do have and the download
command). `pnpm video doctor` shows what was found. To work without whisper, set `WHISPER_PATH=""`
(or one model to `""`): word times are then estimated from the voice's energy inside each time segment.

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

Command line (any OS): `pnpm video <new|plan|brief|validate|catalog|audio|render|make|stills|check|qc|studio|hyperframes|doctor> <project> [options]`.

* `pnpm video brief <name>` → `build/brief.md`: the narration with every word's time, good scene
  start times, the cast and every valid name (also written by `plan`). The one file a director needs.
* `pnpm video validate <name>` → checks `storyboard.json` against what the renderer has and lists
  exact fixes ("scene s3, props[0].name: "chatbot" is not a drawing. Did you mean: …"). Rendering
  stops with the same list when the storyboard has errors.
* `pnpm video catalog` → every layout, prop, background, character, pose, expression, emote.
* Using a local AI model? Point it at **LOCAL_MODEL_GUIDE.md**.

## Arabic (or another language) version

Put the second narration next to the English one, in the same project folder:

```
voice-ar.wav     the Arabic narration
script-ar.txt    the Arabic text with time segments — the SAME number of sentences, in the same order
```

Double-click **make-arabic-video.bat** in the project folder (or run `pnpm video localize <name> --lang ar`).
It makes `projects/<name>-ar/`, a normal project with:
- the **same scenes** as the English video, re-timed to the Arabic voice. Each sentence is matched to
  its Arabic sentence, and objects still pop on the matching word;
- right-to-left layout and Arabic captions;
- `translations.json` with every on-screen text (titles, labels, bubbles): English → Arabic. Empty entries
  stay in English and are listed when you run it; fill them and run it again.

The Arabic project can then be checked, edited and made like any other (`make-short-video.bat` inside it).
Running localize again rebuilds its storyboard from the English one, unless you edited the Arabic
storyboard by hand (remove `"adaptedFrom"` to keep your edits; `--replan` forces a rebuild).
Exact Arabic word timing needs a multilingual whisper model in `WHISPER_AR_MODEL` (see whisper.cpp settings);
without one, word times are estimated inside each time segment, so good segments matter more.

## Quality checks

Shared motion uses frame-derived easing rather than CSS transitions. `remotion/story/motion.ts`
sets gesture, expression, dissolve and speech-smoothing durations in seconds. Interrupted gestures
preserve position and velocity; non-cut transitions overlap scenes instead of exposing the backdrop.
Faces blend between expression drawings, and captions/props use restrained emphasis. Existing
narration and word triggers remain the timing source. The pipeline renders at `VIDEO_FPS` (`.env`, 30 by default).

* **`pnpm video check <name>`** — samples settled poses, midpoints, entrance overshoot, gestures,
  punch zooms and the last hold before each transition in each format, measures
  where each element really is, and reports layout problems: text outside the safe area or under the
  Shorts buttons, collisions, anything in the caption band, text too small, subjects too small,
  empty halves, and characters crossing the bottom margin. Character/text collision checks use
  component geometry, so empty space beside an emote is not counted as solid artwork.
  Report: `out/check-youtube.md`, `out/check-shorts.md`, stills in `out/check/`.
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


## Story mode: characters, animals and dialogue

See [STORY_MODE.md](STORY_MODE.md) for multi-voice supplied recordings, animal actors,
custom wardrobe, illustrated locations and eased character movement. Studio includes
`StoryModeDemo`; the example script and recording manifest are in `examples/story-mode/`.
