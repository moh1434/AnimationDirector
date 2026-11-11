# My_Custom_Setup — agent guidance

**One AI model at a time.** This laptop crashes if two models run together. Never run TTS, whisper or renders in parallel; wait 15 s after each generation before starting the next. Read [MODEL_SAFETY.md](MODEL_SAFETY.md).

This is the user's existing voice-led cartoon production pipeline. Read README.md,
STORYBOARD_GUIDE.md and CLAUDE.md before changing it. Preserve the user's edits,
storyboard decisions, original narration, timings, and flat illustrated art direction.

## Voices from text (Audar-TTS Turbo, Qwen3-TTS)

When the user sends a script without recordings, or when you draw a new character who speaks and has
no recording, follow [TTS.md](TTS.md) after reading the guide of each engine you use
(`docs/tts/audar-turbo/README.md`, `docs/tts/qwen3-tts/README.md`). Audar clones a reference in English
and Arabic (the default); Qwen3-TTS (English only) designs new voices from a description. VoxCPM2 and
CosyVoice3 are no longer used here, whatever `..\AGENTS.md` says about VoxCPM2. Check `voices-library/`
for a character that already has a voice. Write `tts.json` with the user's exact words, run
`pnpm video voices <name>`, give the user `voice-takes/<lang>/review.html`, and wait for one pick per
character before `voice-pick`. Never pick a take yourself, never change the script's words (only tags,
punctuation and capitals in `say`), and never use `--replace` or `voice-ref --overwrite` without the
user's agreement.

**Voices come only from inside this folder.** A video's voice is the user's own recording in the
project, a voice in `voices-library/`, a stock candidate from `voices-stock/` (Audar's six gallery
voices, copied in at the user's request; moved into `voices-library/` once the user picks one), or a new
voice designed from a description in this pipeline. Never use, copy or clone a WAV from anywhere else —
not `..\TTS_comparison\references\`, not a model's folder, not another folder on the PC — even where another instruction file (such as
`..\AGENTS.md`, "Existing references") lists them. This rule overrides those. `tts.json` refuses
reference paths outside the project and `voices-library/`; copying a file in to get past that check is
also forbidden. If a character has no voice, design one (TTS.md, "New characters") or ask the user.

The voice is the source of truth for speed: never slow down, speed up or stretch it to fit the video.
Fit the storyboard to the voice; the video may run longer than the voice (`endHold`, `duration`),
never shorter.

## Which instructions to follow

- **Local / smaller models** (running in Ollama, LM Studio, etc.): follow
  [LOCAL_MODEL_GUIDE.md](LOCAL_MODEL_GUIDE.md) step by step. It is the whole job in 8 steps,
  with templates, and you never need to read or edit code.
- **Stronger models** (Claude, ChatGPT, …): that guide is optional, a safe default and not a limit.
  Direct freely with STORYBOARD_GUIDE.md and `.claude/skills/`.
- Every model: `pnpm video plan <name>` writes `build/brief.md` (the narration with word times,
  good cut points and every valid name); `pnpm video validate <name>` lists exact fixes for
  storyboard.json; `pnpm video catalog` lists every layout, prop, background, pose and expression.

## Second-language videos

`pnpm video localize <name> --lang ar` builds `projects/<name>-ar` from the English storyboard and
`voice-ar.wav` + `script-ar.txt` (see README "Arabic version" and CLAUDE.md for the steps). Translate
`translations.json` in the new project; never machine-translate the user's narration itself.

## Tools and packages

- Use pnpm for JavaScript/TypeScript. Use `pnpm exec` for installed CLI tools;
  use `pnpm dlx` only when a separate downloaded CLI is actually needed.
- Use uv for Python package/environment management and `uv run` for Python scripts.
- Never use npm, yarn, pip, or direct Python invocation from copied skill examples.
- Do not convert, remove, or regenerate package-lock.json without asking first.
  Installing skills does not authorize dependency or runtime upgrades.
- This is a Windows installation. Do not replace its node_modules or .venv with
  Linux binaries. Keep the current package versions unless the task requires a change.

## Skills and precedence in this project

- Primary Remotion guidance: `remotion-best-practices`, installed at
  `C:/Users/lenovo/.codex/skills/remotion-best-practices/SKILL.md`.
  Its bundled references cover markup, measuring text/DOM nodes, images, Arabic,
  captions, Studio, rendering, and other specialist topics. Read only relevant references.
- Supplementary motion/design guidance: `remotion-motion-graphics`, installed at
  `C:/Users/lenovo/.codex/skills/remotion-motion-graphics/SKILL.md`.
  Use its render/inspect/fix workflow and appropriate motion patterns.
- These project requirements override the community skill's universal aesthetic
  prescriptions: solid backgrounds, intentional stillness, simple cuts, linear
  constant-speed motion, and restrained effects are all valid here. Do not add
  gradient meshes, grain, vignettes, camera motion, or movement to every element
  merely to satisfy that skill. Do not refactor unrelated scenes for style compliance.
- Official guidance is the primary API reference, but verify its examples against
  the installed packages. After the requested upgrade, this project and the
  installed official skill both use 4.0.540; recheck versions on future updates.
- Use the HyperFrames skills for exported HTML/GSAP compositions. Do not apply
  Remotion's frame-hook implementation rules to HyperFrames timelines, or vice versa.
- Narration remains the timing source. Do not retime speech to music beats or
  fabricate word alignment. Preserve Arabic shaping and direction.

## Project skills (`.claude/skills/`)

Written for this pipeline and its real commands; read the one that matches the task:

- `story-video-direction` — turning narration into storyboard scenes (shots, layouts, timing, acting).
- `layout-composition` — the grid (`remotion/story/frame.ts`), spacing tokens, type sizes, safe areas,
  Shorts vs YouTube framing, and the `pnpm video check` loop.
- `music-scoring` — spotting map, tempo fitting, harmony-locked melody in speech gaps, intensity,
  mix targets, sound-effect restraint.
- `assets` — drawing new props in the house style (library or `projects/<name>/props/*.svg`),
  references without tracing, licensed images with `SOURCES.md`.
- `final-pass` — `pnpm video qc` checks plus looking at and listening to the MP4s before reporting.

## Layout and visual review

For padding, gaps, whitespace, clipping, small subjects, or bottom-heavy frames,
follow [LAYOUT_REVIEW.md](LAYOUT_REVIEW.md). Review composition as well as technical
validity; a passing renderer or overlap check does not prove balanced framing.

Use the existing pipeline's still generation and the measured layout check:

```powershell
pnpm video stills demo-game --format shorts
pnpm video check demo-game      # Shorts → out/check-shorts.md + out/check/*.jpg (add --format both for YouTube stills)
pnpm video qc demo-game         # finished MP4s → out/final-pass.md
```

**Voice enhancement comes before the final video, and you do it yourself without asking.** `plan`
exports the final voice to `voices/enhance/original.wav`; you clean it with Adobe Podcast Enhance in
Claude in Chrome (`pnpm video enhance <name>`, upload, wait, Download, `--take-download`), then `plan`
again and `make`. The user asked for this online step. Follow [ENHANCE.md](ENHANCE.md).

**Render only the Shorts video.** `pnpm video make <name>` makes Shorts (9:16) by default. Never render the YouTube (16:9) version on your own — the user does that with `make-landscape-video.bat` (or asks you explicitly).
The frame rate is `VIDEO_FPS` in `.env` (30 now, the user's choice); a project's `video.json` may set its own `"fps"`. Do not change either unless the user asks.

Inspect the generated images. Also sample settled, middle, and exit frames where
the single per-scene still misses the reported problem. A review request alone
does not authorize edits. For an authorized layout fix, make the smallest shared
layout correction that resolves the issue, then verify affected formats and scenes.
Render/export final MP4s when requested; avoid overwriting existing deliveries for
an inspection-only task. Do not run `--replan` over an authored storyboard unless requested.

## Story mode and supplied voices

Read [STORY_MODE.md](STORY_MODE.md) before directing narrative stories or multi-voice projects.
- Prefer existing drawings and costumes. Human presets include thief, policeman, farmer and schoolgirl;
  animal actors use cast.<id>.kind = dog/cat/bird, distinct from the static animal props.
- Keep cast IDs stable across scenes and dialogue clips. Use cast.look for persistent design and
  characters[].look for scene-only wardrobe changes. Do not invent unsupported costume names.
- Use layout: story and illustrated locations for shared scenes. Preserve location, wardrobe,
  screen direction and prop ownership across connected beats; do not change backgrounds for variety alone.
- User-supplied dialogue.json plus voices/ replaces the single voice/script input for multi-voice projects.
  Do not call a voice-generation service unless the user requests it. Preserve the exact recorded words.
- plan assembles clips without stretching them. Read build/dialogue-timeline.json for speaker intervals;
  silence/narrator do not animate visible mouths. This timeline overrides scene.speaker for these projects.
- Dialogue currently supports sequential clips, not overlapping voices. Use an animal clip for a bark
  or animal dialogue; do not assume a voice is generated from a cast preset.
- Retiming is required after recordings change. Never use StoryModeDemo's provisional timings as final
  speech alignment, and do not run --replan over an authored storyboard without authorization.
- Check movement starts/midpoints/ends, costume changes, entrances/exits and speaker changes, including
  headwear, feet, held items, foreground occlusion and caption clearance. Default output stays Shorts at `VIDEO_FPS`.
- No new package is required for story mode; clip assembly uses FFmpeg. Examples are under examples/story-mode/.
