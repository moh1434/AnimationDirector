# Make a portrait cartoon with a local model

Use this guide for a video in the existing Windows project. The [project instructions](AGENTS.md) apply throughout. Run one TTS, Whisper or render job at a time and observe the cooldown. Keep the user's words, recordings, project settings and existing storyboard edits.

## 1. Choose the inputs

- **One narrator.** Use the project's `voice.wav` and timed `script.txt`. Ask for any required missing input.
- **Several recorded voices.** Read [Story mode](STORY_MODE.md). Use `dialogue.json` and the recordings in `voices/`. Keep the same speaker IDs in the storyboard.
- **Only a script or a new speaking part.** Follow [TTS](TTS.md) and the selected engine guide. Check `voices-library/` first. Give the user `voice-takes/<lang>/review.html` and wait for one take number per character before `voice-pick`. Keep the existing recordings for any other characters. Use only the project-approved voice sources.

## 2. Get the timing

Run `pnpm video plan <name>`. Read `projects/<name>/build/brief.md` for the narration, word times, suggested cuts and valid names. For dialogue, also read `build/dialogue-timeline.json`. Re-run plan when recordings change. Keep an authored storyboard and its direction notes when planning again.

Look for the saved Adobe choice in the project's `production-decisions.json`. Ask once if it is missing. For yes, complete [enhancement](ENHANCE.md), run plan again and read the updated timings. For no, save the answer and use the original voice with `--skip-enhance` when rendering.

## 3. Decide what the viewer sees

Read [Portrait direction](REFERENCE_VIDEO_STUDY.md). Copy the worksheet from the brief to `build/direction-notes.md`. For each passage write what is visible at first, which word or action changes it, and the picture the viewer should remember. Keep one illustrated setting while the action continues.

| If the line needs… | Try… |
|---|---|
| Two people doing something together | `story` with an illustrated location. Let the listener's face show the result. |
| A close look at a single thing | `hero` or `free`. Keep the object clear of the caption band. |
| A change of state | Keep the frame steady. Use the same coordinates and size for the before and after drawings. |
| A comparison or sequence | `compare`, `transform` or `steps` with items that the narration actually relates. |
| A presenter or a thought | `host_talk`, `duo` or `thought`. Use a gesture when it tells the viewer where to look. |
| A name or quantity which matters | A short label by the subject, or `number` for a figure that deserves the whole frame. |

## 4. Write the scenes

Edit `storyboard.json` using names from the brief or `pnpm video catalog`. Work within the storyboard and project assets. For narrative scenes use the scale and layer guidance in [Story mode](STORY_MODE.md). Copy field shapes from the [storyboard guide](STORYBOARD_GUIDE.md).

For example, if a supplied line is “The water rose,” these fields make its change visible. They belong inside a scene whose start, end and text come from the actual project.

```json
{
  "layout": "free",
  "bg": {"type": "farm"},
  "speaker": "none",
  "characters": [],
  "camera": {"zoom": [1, 1], "drift": false},
  "props": [
    {"name": "water_low", "at": 0, "x": 0.5, "y": 0.54, "size": 0.5, "motion": "none", "enter": "none", "out": "@rose"},
    {"name": "water_full", "x": 0.5, "y": 0.54, "size": 0.5, "motion": "none", "enter": "none", "at": "@rose"}
  ]
}
```

Use a word actually spoken in the scene for each `@word`. For a single narrator, start the first scene at zero and take later cuts from the brief. For dialogue, use `clip:N`, `clip:N:end` and `@word` as appropriate. The measured timeline determines whose mouth moves. Time the picture to cover the whole voice. Use `endHold` if the ending needs more time.

## 5. Validate and look

1. Run `pnpm video validate <name>`. Fix each error it identifies and run it again.
2. Run `pnpm video check <name> --format shorts`. Read `out/check-shorts.md` inside the project. Open the stills in `out/check/`. Look at the opening, the moment before the change, the result, and the exit. Check faces, hands, labels, caption clearance and continuity with the previous shot.
3. Fix authorized layout issues and check again. If the task is inspection only, report what you found. If you cannot inspect an image or listen to playback, say which checks you could verify. [Layout review](LAYOUT_REVIEW.md)

## 6. Deliver the requested Short

Use `pnpm video make <name> --format shorts --skip-enhance` for a saved no, or `pnpm video make <name> --format shorts` after the approved enhancement. Watch and listen to the finished MP4. Read `out/final-pass.md`, and report the actual output paths, any unresolved warning and any stand-in used. [Final pass](.claude/skills/final-pass/SKILL.md)

For a supplied Arabic version, follow [localization](README.md#arabic-or-another-language-version) or the multi-voice instructions in [Story mode](STORY_MODE.md#two-languages). Translate the on-screen text, check right-to-left layout, and verify the Arabic recording against the new picture.
