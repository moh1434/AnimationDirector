# Audar-TTS-V1-Turbo (engine `audar`)

The pipeline's default voice engine: **zero-shot cloning** in **English and Arabic** (MSA and dialects,
code-switching between them). It never invents a voice: it always speaks in the voice of a reference
recording. Model card: `C:\Users\lenovo\tts-new-models\audar-turbo\weights\README.md`.

## Setup on this PC

- Folder: `TTS_AUDAR_DIR` in `.env` (`C:/Users/lenovo/tts-new-models/audar-turbo`), holding `.venv` and
  `weights/Audar-TTS-V1-Turbo-Q8_0.gguf` (1.64B parameters, Q8, about 1.75 GB).
- The language model runs on the CPU (llama-cpp-python here is built without GPU support); the codec
  (NeuCodec, 24 kHz) runs on the GPU. About 2.3 s of work per second of speech.
- Worker: `pipeline/tts_workers/audar_worker.py`, run with
  `uv run --no-sync --project <TTS_AUDAR_DIR> python -I …`. It loads the model once per take, makes the
  take's parts one after another with a 15 s rest between them, and joins them with 0.35 s of silence.
- The NeuCodec weights come from the Hugging Face cache (`eugenehp/neucodec`, already downloaded).

## The reference

- 5–15 s of one clean speaker (only the first 15 s are used), with its **exact transcript**
  (`referenceText`). A wrong transcript makes the clone worse.
- The clone copies the reference's tone and delivery: an excited reference gives excited speech.
- An English reference can speak Arabic and the other way round; a reference in the video's own
  language is closer (`voices-library/<id>/reference_<lang>.wav`).

## Length

One generation makes at most 1800 codes (36 s). The pipeline puts whole lines together into parts of at
most 240 characters (about 15 s), so a long line or story is never cut off. Keep single lines under ~200
characters. The model card advises chunking long inputs at sentence boundaries.

## Expression tags

`[laughs]` `[curious]` `[excited]` `[sighs]` `[exhales]` `[mischievously]` `[whispers]` `[sarcastic]`,
inline in `say`, in English and Arabic. Use them sparingly: one, at most two per line. Stacked or
multi-word tags are fragile; other tags are refused by `voices`.

## Settings (`options`)

| Option | Default | Effect |
|---|---|---|
| `temperature` | 0.8 | 0.6–0.7 steadier and more neutral; 1.0 most expressive (the model card's demos) |
| `top_k` | 40 | |
| `top_p` | 0.9 | |
| `repeat_penalty` | 1.1 | keep it low: higher values suppress laughter |
| `seed` | per take (11, 22, …) | each part of a take uses seed + its number; same seed + same text = same audio |

## License

AudarAI Community License v1.0: free for research and limited commercial use by smaller
organizations; larger or enterprise use needs an AudarAI Enterprise License. Clone only voices the user
has the right to use.
