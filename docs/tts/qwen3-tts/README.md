# Qwen3-TTS 1.7B (engine `qwen3`, English only)

The **default English cloner** (a reference or a `voices-library/` voice: the user finds it clones English
better than Audar) and the engine for **new voices from a description** (voice design). Its
supported languages are English, Chinese, French, German, Italian, Japanese, Korean, Portuguese,
Russian and Spanish, but this pipeline uses it for **English only** (no Arabic).

## Setup on this PC

- Folder: `TTS_QWEN3_DIR` in `.env` (`C:/Users/lenovo/tts-new-models/qwen3-tts`), holding `.venv` and
  two sets of weights:
  - `weights-base/`: Qwen3-TTS-12Hz-1.7B-**Base**, a zero-shot clone of a reference + its exact words (`mode: clone`).
  - `weights/`: Qwen3-TTS-12Hz-1.7B-**VoiceDesign**, a voice from a description (`mode: design`).
- **Cloning** is the default for English: a `library` voice or a `reference` in an English video. Arabic
  (and a reference in another language) is cloned by Audar. A voice can ask for Audar with `"engine": "audar"`
  (needed for Audar's tags such as `[excited]`), and a `voices-library/` voice.json can set `"engine"` per language.
  A clone take is made a few lines at a time (up to ~400 characters per generation) and joined.
  `repeatPenalty` from voice.json is passed to the model as `repetition_penalty`.
- Runs on the GPU in bfloat16 (about 3.5 s of work per second of speech here). The "SoX could not be
  found" and "flash-attn is not installed" messages it prints are harmless.
- Worker: `pipeline/tts_workers/qwen3_worker.py`, run with
  `uv run --no-sync --project <TTS_QWEN3_DIR> python -I …`.

## Designing a voice

- The description is sent as the model's instruction, separately from the text, so it is never read
  aloud. Write it in English, in three layers: **who** (age, gender, role), **texture** (pitch, timbre),
  **delivery** (mood, pace, situation).
- A designed voice is **a different person in every generation**, so a designed take holds all of a
  character's lines in one generation (up to 4096 codes at 12 Hz, several minutes). Over ~1400
  characters `voices` warns: listen to the last lines.
- No inline tags: put the delivery in the description, and use punctuation for single lines.
- In an Arabic video, a description is designed by Qwen3-TTS as a short English reference (about
  10 s, `voice-takes/<lang>/<who>/design-*.wav`) that Audar then clones to speak Arabic.

## Settings (`options`)

`temperature` (default 0.9), `top_k`, `top_p`, and `seed` (per take: 11, 22, …; each part uses seed + its
number).
