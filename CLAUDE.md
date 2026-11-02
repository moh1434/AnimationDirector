# My_Custom_Setup — notes for Claude

Read [AGENTS.md](AGENTS.md) for package-manager rules, installed Remotion skill
routing, compatibility checks, and project-specific overrides to generic effects.
For padding, whitespace, alignment, or portrait framing issues, use
[LAYOUT_REVIEW.md](LAYOUT_REVIEW.md) before changing scene coordinates.

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
3. **Direct it yourself.** Read the narration and `build/analysis.json` (`words` have times) and
   rewrite `storyboard.json` following the checklist at the end of STORYBOARD_GUIDE.md: one idea per
   scene (3–7 s, scene starts on a word start), varied layouts and ground colours, objects that pop
   on the word that names them (`"at": "@word"`), faces with expressions that comment on the line,
   narrator reactions via `actions`, title cards for punchlines, `number` scenes for figures.
   Do not invent facts, maps, or likenesses of real people; use `image` scenes with the user's files.
4. `pnpm video stills <name>` (and `--format shorts`) → look at `out/contact-*.jpg`.
   Fix overlaps or empty-looking scenes.
5. `pnpm video make <name>` → `out/<name>-youtube.mp4`, `-shorts.mp4`, `.srt`.
   Use `--draft` for quick checks. Inspect a few frames of the final MP4.

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
  `pipeline/lexicon.mjs` so the auto-director can find them.
* Always tell the user clearly when they need to do something (run a file, approve a step).
