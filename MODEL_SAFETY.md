# Running AI models on this laptop — one at a time

**This laptop cannot run more than one AI model at the same time.** Running TTS generations in
parallel made it crash and restart on its own, and the task was lost. These rules are not optional.

## Rules

1. **Never run AI models in parallel.** One TTS generation at a time: Audar-TTS, Qwen3-TTS,
   whisper.cpp, or any other model. Never start a second model while one is still running.
2. **Rest between generations** (15 seconds unless `.env` sets `CHUNK_COOLDOWN_SEC`). When a generation finishes, wait that long, then start
   the next one.
3. **No parallel commands that load a model.** Do not start two `pnpm video voices`, `voice-ref`,
   `plan` (whisper), or similar commands at once — not in two terminals, not as background jobs, not
   from subagents, not with `Promise.all`. Wait for one command to exit before starting the next.
4. **Do not render while a model runs.** A Remotion render (`check`, `make`, `stills`) also loads the
   GPU; never run it at the same time as a TTS or whisper job.
5. **Long jobs:** run one command in the background and wait to be notified when it exits; do not
   start another model job "while waiting".

## What the pipeline does

- `pnpm video voices` makes takes strictly one after another and rests before each new
  generation: `CHUNK_COOLDOWN_SEC` in `.env` seconds (15 when it is not set; 0 to 600; 0 = no rest; the old name
  `TTS_COOLDOWN_SECONDS` still works). It is read in `restSeconds` (`pipeline/whisper-config.mjs`). The
  15 s default was chosen because this laptop crashed when generations ran back to back; if you
  lower it and the laptop restarts, raise it again.
- Finished takes are kept. If the laptop crashed or a run stopped half way, run the same
  `pnpm video voices <name>` again: it skips the takes that are already done and continues with the
  missing ones.
