# Explainer mode

One narrator, Wendy by default, explains a topic on screen: "the entire history of China", "quantum physics", and so on. Everything else in the pipeline is the same as for the family series: voices, plan, storyboard, check, music, render, Arabic.

**Status:** the structure is ready, and no explainer video has been made yet. The engine is still an exact copy of the story engine, so it renders the same way. The explainer session decides what to change.

## Where things are

| What | Where | Whose |
| --- | --- | --- |
| The explainer video, its scenes, layout, captions and text cards | `remotion/explainer/` (`ExplainerVideo.tsx`, `Scene.tsx`, `Layout.ts`, `Captions.tsx`, `Elements.tsx`, `frame.ts`, `measure.ts`, `demo.ts`) | Explainer mode only. Change freely |
| Characters, faces, props, rooms, backgrounds, light, shading, motion, theme | `remotion/story/` | **Shared** with the family series. A change here changes both |
| Projects | `projects/explainer/<name>/` | Explainer mode |
| The family series | `projects/family/`, `DEV/Scripts/logical-fallacies/` | Not for explainer work |
| Mode switch | `pipeline/modes.mjs`; `video.json` `"mode": "explainer"` | Shared |

Shared rules still apply to anything in `remotion/story/`: nobody has a neck, faces on long heads sit lower, turns blink instead of squeezing ([ART_STYLE.md](ART_STYLE.md)). Add new props and drawings to `remotion/story/` so both modes can use them. When an explainer needs a different version of a shared file, copy that one file into `remotion/explainer/` and import the copy there.

`remotion/explainer/` imports `story-mode.mjs`, `types.ts` and `Props.tsx` from the story folder, so `validate` and `catalog` work in both modes.

## Make one

```powershell
pnpm video new china-history --explainer --tts
```

This makes `projects/explainer/china-history/`, with `video.json` set to `"mode": "explainer"` and `"host": "wendy"`, and a `tts.json` that uses Wendy's saved voice (`voices-library/wendy`). Without `--tts` you get `script.txt` for your own recording. `new-explainer.bat <name>` does the same by double-click.

Then, as in [TTS.md](TTS.md) and [AGENTS.md](AGENTS.md):

1. Fill in `tts.json` with the script's exact words, then run `pnpm video voices china-history` and `pnpm video voice-pick china-history wendy=1`. One voice gives `voice.wav` and `script.txt`.
2. `pnpm video plan china-history`, then direct `storyboard.json`. Wendy is the cast member `host`.
3. `pnpm video validate china-history`, `pnpm video check china-history --format shorts`, `pnpm video make china-history --format shorts`.

A project name can be given without its folder (`china-history`). The pipeline looks in `projects/`, `projects/family/` and `projects/explainer/`.

## Not done yet (for the explainer session)

- What makes an explainer look different from a story: chapter titles, maps, timelines, diagrams, Wendy's place on screen, and a writing guide for explainer scripts.
- HyperFrames export follows the story engine only.
- Studio: compositions `ExplainerVideo` and `ExplainerVideoShorts`. The Library pages show the shared drawings.

Work on a branch or worktree of its own: the family series session edits the same repository.
