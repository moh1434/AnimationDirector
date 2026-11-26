# Directing videos in AnimationDirector

Start here for a production request. The target is a voice-led, illustrated 9:16 Short. For shot choices and examples from the user's 14 portrait references, read [Portrait direction](REFERENCE_VIDEO_STUDY.md). For the drawing and lighting treatment, use [Art style](ART_STYLE.md). A smaller local model can follow the [step-by-step guide](LOCAL_MODEL_GUIDE.md).

## Choose the input

| What the user supplied or requested | Where to start |
|---|---|
| One recording and its text | Use `voice.wav` and timed `script.txt` in the project. [Setup and input formats](README.md) |
| A story or several recorded speakers | Read [Story mode](STORY_MODE.md). Use the supplied `dialogue.json` and `voices/` for dialogue. |
| Text only, or a new speaking character without a take | Read [TTS](TTS.md) and the guide for each engine used. Check the voice library first. |
| A second narration in Arabic | Follow [Arabic localization](README.md#arabic-or-another-language-version). Translate on-screen labels in `translations.json`. Preserve the supplied narration. |
| An explainer video (Wendy explains a topic) | Read [Explainer mode](EXPLAINER_MODE.md). Projects live in `projects/explainer/`. |
| A new script or episode of the Berry and Benny family series | Read `DEV/Scripts/logical-fallacies/RULES.md`, then `SERIES_LOG.md` in the same folder. Save the finished script in its `episodes/` folder and stop for the user's review. |
| Voicing a saved episode script | Only when the file's first line is `# STATUS: approved`. Read it as it is now (the user may have edited it) and follow [TTS](TTS.md). |

Ask for missing required inputs. Identify the source of any proposed stand-in before using it, use a neutral name, and list it in the delivery. Preserve the user's exact words, recordings, timing, authored storyboard and project edits. Fit the picture to the voice. An ending may hold beyond the last word using `endHold` or `duration`. Only trim named silences when the user requests it. [Silence trimming](SILENCE_TRIMMING.md)

## Prepare and direct

1. **Run heavy jobs one at a time.** TTS, Whisper and renders run sequentially on this laptop. Wait 15 seconds after a generation before starting the next and observe the configured cooldown. Ask before downloading a missing model. [Model safety](MODEL_SAFETY.md)
2. **Use approved voices.** Sources are the user's project recordings, `voices-library/`, candidates in `voices-stock/`, or a voice designed here. External WAVs and the study clips are excluded, including files copied into the project. Qwen3 is the default for English cloning and voice design. Audar clones Arabic and explicitly selected English voices. Clone a saved voice only through `pnpm video voices <name>` with `{"library":"<id>"}` so its saved settings and first seed apply. Keep each generated WAV's sibling JSON with the actual `text`, `voiceId`, `voiceName`, `workerMode` and `settings` containing `temperature`, `topK`, `topP`, `repeatPenalty` and `seed`. This includes test generations. Give the user `voice-takes/<lang>/review.html` and wait for their pick per character. Use `voice-pick --replace` or `voice-ref --overwrite` only with the user's agreement.
3. **Plan from the final recordings.** Run `pnpm video plan <name>` and read `build/brief.md`. Copy its visual worksheet to `build/direction-notes.md`. For dialogue, read `build/dialogue-timeline.json`, retain cast IDs, and use `clip:N` and spoken triggers. Run plan again after recording changes, check the new alignment, and preserve authored scenes. Use `--replan` only when explicitly requested.
4. **Resolve Adobe enhancement once per video.** Read the project's `production-decisions.json`. If the decision is missing, ask and save it. A yes authorizes the Adobe upload for that video. Follow [Enhancement](ENHANCE.md), then plan again. A no uses `--skip-enhance` at export. Reuse the saved choice on resuming or rerendering.
5. **Direct the visible action.** Pick the subject, what changes, and which spoken beat motivates that change. Give every video an illustrated setting suited to the story. Reuse it across connected shots, and draw one in the house style when needed. A close-up, inset, or simple cutaway can isolate a detail. The renderer supplies lighting, shading, grain and drift. Use [Storyboard fields](STORYBOARD_GUIDE.md) and `pnpm video catalog` for supported controls and assets.
6. **Check and deliver.** Run `pnpm video validate <name>`, then `pnpm video check <name> --format shorts`. Inspect the report and stills in the project's `out/`. Check the start, middle and end of motion, speaker changes and the visual payoff. For a requested render use `pnpm video make <name> --format shorts` with the saved enhancement choice. Keep `VIDEO_FPS` from `.env` or the project's FPS override. Render landscape only on explicit request. Review the finished MP4 by eye and ear alongside `out/final-pass.md`. A review-only request authorizes inspection. Make the smallest shared correction when a layout fix is requested. [Layout review](LAYOUT_REVIEW.md) · [Final pass](.claude/skills/final-pass/SKILL.md)

## Working on the pipeline

- Read the [README](README.md) and [storyboard field reference](STORYBOARD_GUIDE.md) before changing the pipeline. Use pnpm for JS/TS (`pnpm exec` for installed tools) and uv for Python (`uv run` for scripts). Keep the Windows dependencies and existing versions. Ask before converting, regenerating or removing a package-lock.json.
- Project skills under `.claude/skills/` cover story direction, layout, assets, colour harmony, music scoring and final review. Use the relevant one. For Remotion APIs use the installed `remotion-best-practices`, supplemented by `remotion-motion-graphics`. Check examples against the installed version. The project's art direction governs style. For exported HTML/GSAP, use the HyperFrames skills.
- Preserve Arabic shaping and reading direction. Use the supplied recording and real alignment for word cues. Treat estimated times as estimates.
