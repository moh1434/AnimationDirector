# My_Custom_Setup — notes for Claude

Read [AGENTS.md](AGENTS.md) for package-manager rules, installed Remotion skill
routing, compatibility checks, and project-specific overrides to generic effects.
For padding, whitespace, alignment, or portrait framing issues, use
[LAYOUT_REVIEW.md](LAYOUT_REVIEW.md) before changing scene coordinates.
Project skills in `.claude/skills/`: story-video-direction, layout-composition, music-scoring,
assets, final-pass — use them when directing, laying out, scoring, drawing or checking a video.
A smaller local model should follow [LOCAL_MODEL_GUIDE.md](LOCAL_MODEL_GUIDE.md) instead; for you it is optional.

This folder is a voice-led cartoon video pipeline (Remotion + GSAP + HyperFrames + Tone.js +
pretty_midi + pedalboard). The user supplies a narration `.wav`, the story text and time segments;
the pipeline makes YouTube (16:9) and Shorts (9:16) videos in the style of
`..\Source Videos To Train On` (round-headed cartoon characters, objects with faces, flat colourful
grounds, limited animation). Read `README.md` and `STORYBOARD_GUIDE.md` before working here.

## When the user asks for a video

1. `pnpm video new <name>` (or reuse `projects/<name>`). Put the voice in as `voice.wav`
   and the segments in `script.txt` (`start | end | text`). Never rewrite the user's words; never
   stretch or edit the voice.
2. `pnpm video plan <name>` — validates timings, analyses the voice, writes an automatic
   `storyboard.json`. Read its warnings.
3. **Direct it yourself.** Read `build/brief.md` (narration with word times, cut points, valid names) and
   rewrite `storyboard.json` following the checklist at the end of STORYBOARD_GUIDE.md: one idea per
   scene (3–7 s, scene starts on a word start), varied layouts and ground colours, objects that pop
   on the word that names them (`"at": "@word"`), faces with expressions that comment on the line,
   narrator reactions via `actions`, title cards for punchlines, `number` scenes for figures.
   Do not invent facts, maps, or likenesses of real people; use `image` scenes with the user's files.
   Then `pnpm video validate <name>` and fix every error it lists.
4. `pnpm video check <name>` → read `out/check-shorts.md` and look at `out/check/*.jpg`.
   Fix every error; judge each warning (layout-composition skill). `stills` gives a quick contact sheet.
   Add `--format both` only when the user wants the YouTube layout checked too (stills, not a render).
5. `pnpm video make <name>` → `out/<name>-shorts.mp4` and `.srt`, then read `out/final-pass.md` and
   the frame sheet (final-pass skill). Use `--draft` for quick checks.
   **Render only the Shorts video.** `pnpm video make <name>` makes Shorts (9:16) by default. Never render the YouTube (16:9) version on your own — the user does that with `make-landscape-video.bat` (or asks you explicitly). Videos are 60 fps.

## Running things

* The user is on **Windows**. `node_modules` and `.venv` are Windows installs made by `setup.bat`.
  Never run `pnpm install`/`uv sync` in this folder from a Linux shell (it would replace Windows binaries).
* Pure-JS steps (`plan`'s parsing/directing, `compile`) run anywhere with Node ≥ 20, but the audio
  steps need the Python venv and rendering needs Remotion's browser — run those on Windows
  (`make-video.bat`, or `pnpm video ...` in PowerShell).
* `storyboard.json` is preserved between runs; `--replan` overwrites it.
* The look lives in `remotion/story/` (Character.tsx, Face.tsx, Props.tsx, Backgrounds.tsx,
  Scene.tsx layouts). Remotion Studio → `Library` / `LibraryCharacters` shows every prop and preset.
  New props: add to `PROPS` in Props.tsx (200×200 box, centred, 6px outline) and to
  `pipeline/lexicon.mjs` so the auto-director can find them — or, for one video only, an SVG in
  `projects/<name>/props/` (assets skill).
* Always tell the user clearly when they need to do something (run a file, approve a step).
