# My_Custom_Setup — agent guidance

This is the user's existing voice-led cartoon production pipeline. Read README.md,
STORYBOARD_GUIDE.md and CLAUDE.md before changing it. Preserve the user's edits,
storyboard decisions, original narration, timings, and flat illustrated art direction.

## Which instructions to follow

- **Local / smaller models** (running in Ollama, LM Studio, etc.): follow
  [LOCAL_MODEL_GUIDE.md](LOCAL_MODEL_GUIDE.md) step by step. It is the whole job in 8 steps,
  with templates, and you never need to read or edit code.
- **Stronger models** (Claude, ChatGPT, …): that guide is optional, a safe default and not a limit.
  Direct freely with STORYBOARD_GUIDE.md and `.claude/skills/`.
- Every model: `pnpm video plan <name>` writes `build/brief.md` (the narration with word times,
  good cut points and every valid name); `pnpm video validate <name>` lists exact fixes for
  storyboard.json; `pnpm video catalog` lists every layout, prop, background, pose and expression.

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

**Render only the Shorts video.** `pnpm video make <name>` makes Shorts (9:16) by default. Never render the YouTube (16:9) version on your own — the user does that with `make-landscape-video.bat` (or asks you explicitly). Videos are 60 fps.
The pipeline default is 60 fps (`video.json` → `"fps"`); do not lower it unless the user asks.

Inspect the generated images. Also sample settled, middle, and exit frames where
the single per-scene still misses the reported problem. A review request alone
does not authorize edits. For an authorized layout fix, make the smallest shared
layout correction that resolves the issue, then verify affected formats and scenes.
Render/export final MP4s when requested; avoid overwriting existing deliveries for
an inspection-only task. Do not run `--replan` over an authored storyboard unless requested.
