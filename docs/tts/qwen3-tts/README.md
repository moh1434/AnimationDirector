# Qwen3-TTS 1.7B (engine `qwen3`, English only)

The **default English cloner** (a reference or a `voices-library/` voice: the user finds it clones English
better than Audar) and the engine for **new voices from a description** (voice design). Its
supported languages are English, Chinese, French, German, Italian, Japanese, Korean, Portuguese,
Russian and Spanish, but this pipeline uses it for **English only** (no Arabic).

## Setup on this PC

- Runs through **audio.cpp** (https://github.com/0xShug0/audio.cpp, release v0.9.5, CUDA 13.3 build; GGUF models, no Python).
  Folder: `TTS_QWEN3_DIR` in `.env` (`C:/Users/lenovo/tts-new-models/qwen3-tts`), holding `audiocpp_cli.exe` (and its DLLs)
  and `models/` with two packages:
  - `models/Qwen3-TTS-12Hz-1.7B-Base-GGUF/`: Qwen3-TTS 1.7B **Base**, a zero-shot clone of a reference + its exact words (`mode: clone`).
  - `models/Qwen3-TTS-12Hz-1.7B-VoiceDesign-GGUF/`: **VoiceDesign**, a voice from a description (`mode: design`).
  Each package has a BF16 GGUF (used by default) and a Q8_0 one (used when no BF16 file exists). Set the environment variable
  `TTS_QWEN3_PRECISION=q8_0` to use Q8 instead. More packages: `python tools/model_manager_v2.py install <id> --models-root models` in that folder.
  The previous Python install is kept beside it as `qwen3-tts-old-python/` (delete it once you are happy).
- **Cloning** is the default for English: a `library` voice or a `reference` in an English video. Arabic
  (and a reference in another language) is cloned by Audar. A voice can ask for Audar with `"engine": "audar"`
  (needed for Audar's tags such as `[excited]`), and a `voices-library/` voice.json can set `"engine"` per language.
  A clone take is made a few lines at a time (up to ~400 characters per generation) and joined.
  `repeatPenalty` from voice.json is passed to the model as `--repetition-penalty`.
- Runs on the GPU (CUDA), about 1.4 s of work per second of speech including loading the model (a 2 s line: about 5 s).
  Every chunk is one `audiocpp_cli` run, so the model is loaded again for each line of a `chunkPerLine` take.
- Worker: `pipeline/tts_workers/qwen3_cpp_worker.mjs`, run with `node` (no `uv`): it reads the same job file as before,
  calls `audiocpp_cli.exe --task tts --family qwen3_tts` with the voice reference + its words (clone) or the description
  (`--instruct`, design), and joins the chunks with 0.35 s of digital silence.
- The same seed does not give the same audio as the old Python engine; saved voices (recordings) are unaffected.

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
