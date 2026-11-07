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

1. For multi-voice stories follow STORY_MODE.md: supply dialogue.json and voices/, then plan.
   For single narration, `pnpm video new <name>` (or reuse `projects/<name>`). Put the voice in as `voice.wav`
   and the segments in `script.txt` (`start | end | text`). Never rewrite the user's words; never
   stretch or edit the voice.
2. `pnpm video plan <name>` — validates timings, analyses the voice, writes an automatic
   `storyboard.json`. Read its warnings.
3. **Direct it yourself.** Read `build/brief.md` (narration with word times, cut points, valid names) and
   Complete the visual story worksheet in the brief, using REFERENCE_VIDEO_STUDY.md: plan the
   visible cause, change and result; preserve a setting across connected beats and let mechanisms
   carry the picture without a visible host when appropriate. Save notes in `build/direction-notes.md`.
   Then rewrite `storyboard.json` following the checklist at the end of STORYBOARD_GUIDE.md: one idea per
   scene (usually 3–7 s, scene starts on a word start), meaningful layout and ground changes, objects that pop
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

## When the user sends two languages (English + Arabic)

1. Make and direct the English project as usual (`voice.wav`, `script.txt`).
2. Put the Arabic files in the same folder as `voice-ar.wav` and `script-ar.txt` (same sentences, same order).
3. `pnpm video localize <name> --lang ar` → `projects/<name>-ar/` with the scenes re-timed to the Arabic voice.
4. Translate every entry in `projects/<name>-ar/translations.json` (short, natural Arabic; keep brand names
   such as ChatGPT or Godot in Latin letters), then run step 3 again.
5. `pnpm video validate <name>-ar`, `pnpm video check <name>-ar`, look at the stills (mid-sentence scene
   cuts are approximate; adjust the Arabic storyboard if needed), then `pnpm video make <name>-ar` (Shorts).

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
* `.env` (from `.env.example`) holds this computer's whisper.cpp settings: `WHISPER_PATH`,
  `WHISPER_EN_MODEL`, `WHISPER_AR_MODEL`. If `plan` stops with a `.env` error, tell the user exactly what
  to fix; never download a model (0.5–1.6 GB) without asking first.
* Always tell the user clearly when they need to do something (run a file, approve a step).

## Story mode and supplied voices

Read [STORY_MODE.md](STORY_MODE.md) before directing narrative stories or multi-voice projects.
- Prefer existing drawings and costumes. Human presets include thief, policeman, farmer and schoolgirl;
  animal actors use cast.<id>.kind = dog/cat/bird, distinct from the static animal props.
- Keep cast IDs stable across scenes and dialogue clips. Use cast.look for persistent design,
  characters[].look for one scene and actions[].look for a change on a word. Unknown costume names are errors.
- Use layout: story and illustrated locations for shared scenes, with `"time": "night"` where the story
  needs it (living_room, house_exterior, park, schoolyard, street). Preserve location, wardrobe,
  screen direction and prop ownership across connected beats; do not change backgrounds for variety alone.
- User-supplied dialogue.json plus voices/ replaces the single voice/script input for multi-voice projects.
  Do not call a voice-generation service unless the user requests it. Preserve the exact recorded words.
- plan assembles clips without stretching them. Read build/dialogue-timeline.json for speaker intervals;
  silence/narrator do not animate visible mouths. This timeline overrides scene.speaker for these projects.
- Dialogue currently supports sequential clips, not overlapping voices. Use an animal clip for a bark
  or animal dialogue; do not assume a voice is generated from a cast preset.
- Time multi-voice storyboards with "clip:N", "clip:N:end" and "@word", and moves with "until", so they
  survive new recordings; run plan after recordings change. Never use StoryModeDemo's timings as final
  speech alignment, and do not run --replan over an authored storyboard without authorization.
- Check movement starts/midpoints/ends, costume changes, entrances/exits and speaker changes, including
  headwear, feet, held items, foreground occlusion and caption clearance. Default output stays 60 FPS Shorts.
- No new package is required for story mode; clip assembly uses FFmpeg. Examples are under examples/story-mode/.
