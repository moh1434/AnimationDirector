# Running AI models on this laptop — one at a time

**This laptop cannot run more than one AI model at the same time.** Running TTS generations in
parallel made it crash and restart on its own, and the task was lost. These rules are not optional.

## Rules

1. **Never run AI models in parallel.** One TTS generation at a time: VoxCPM2, CosyVoice3,
   whisper.cpp, or any other model. Never start a second model while one is still running.
2. **Wait 15 seconds between generations.** When a generation finishes, wait 15 seconds, then start
   the next one.
3. **No parallel commands that load a model.** Do not start two `pnpm video voices`, `voice-ref`,
   `plan` (whisper), or similar commands at once — not in two terminals, not as background jobs, not
   from subagents, not with `Promise.all`. Wait for one command to exit before starting the next.
4. **Do not render while a model runs.** A Remotion render (`check`, `make`, `stills`) also loads the
   GPU; never run it at the same time as a TTS or whisper job.
5. **Long jobs:** run one command in the background and wait to be notified when it exits; do not
   start another model job "while waiting".

## What the pipeline does

- `pnpm video voices` makes takes strictly one after another and rests 15 s before each new
  generation (`COOLDOWN_SECONDS` in `pipeline/tts.mjs`). `TTS_COOLDOWN_SECONDS` in `.env` can make
  the pause longer; it never goes below 15.
- Finished takes are kept. If the laptop crashed or a run stopped half way, run the same
  `pnpm video voices <name>` again: it skips the takes that are already done and continues with the
  missing ones.
