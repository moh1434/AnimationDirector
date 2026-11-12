# Character voice library

One folder per character. Each folder holds one premade voice that any video can clone, so the
character sounds like the same person in every video, with one reference recording per language.

```
voices-library/
  narrator/              ← the narrator (on-screen preset: host)
    reference_en.wav     ← the voice speaking English
    reference_ar.wav     ← the same voice speaking Arabic
    voice.json           ← per language: the file, its exact words and how it was made
```

`voice.json`:

```json
{
  "id": "narrator",
  "preset": "host",
  "description": "What the voice is like (a note for people; it is not sent to the model).",
  "languages": {
    "ar": {
      "file": "reference_ar.wav",
      "text": "The exact words spoken in reference_ar.wav.",
      "voiceId": "user:narrator_en_35aac8",
      "voiceName": "narrator_en",
      "workerMode": "clone",
      "settings": { "temperature": 0.7, "topK": 35, "topP": 0.9, "repeatPenalty": 1.1, "seed": 1579 }
    },
    "en": { "file": "reference_en.wav", "text": "…", "…": "…" }
  }
}
```

- `file` and `text` are what the clone needs: the recording and its **exact** words.
- `voiceId`, `voiceName` and `workerMode` record how the recording was made (your voice tool's ids); they
  are notes and are not sent to the model. `null` = not known.
- `settings` are the Audar settings the recording was made with. They become the defaults when a video
  clones this voice in that language (`temperature`, `topK`, `topP`, `repeatPenalty`; a project's
  `tts.json` `"options"` still win), and `seed` is the seed of take 1 (the next takes add 11 each).
  `null` values are skipped (the engine's defaults are used).

The voice itself comes from the recording, not the seed: a clone of the same recording sounds like the
same person with any seed. The seed only makes a generation repeatable (same recording, text, settings
and seed = the same audio) and changes small details of the delivery.

## Adding a voice or a language

1. Put the recording in the character's folder, named **`reference_<language>.wav`** (`reference_en.wav`,
   `reference_ar.wav`, …).
   - 5–15 s (about 9 s is best), one speaker, no music, no noise, no long silence at the start or end.
   - Spoken the way the character usually talks: the clone copies the tone and delivery too.
2. In **`voice.json`**, add `languages.<language>` with `file` and the **exact** words spoken in it as
   `text` (same words, same order; punctuation as spoken). A wrong transcript makes the clone worse.
   Fill in `settings` if you know them. (Older files with `"referenceText_<language>"` still work.)
3. Over 15 s? Run `pnpm video ref-trim voices-library/<id>`: each reference longer than 15 s is cut at
   its last pause before 15 s (the last words are dropped), `voice.json` gets the words left, and the
   originals go to `voices-library/<id>/full/`. Shorter references are left as they are.

The folder name is the voice's id: lower case, letters, digits and `_` only.

## Using it in a video

In the project's `tts.json` (or `tts-ar.json`):

```json
"voices": {
  "narrator": { "library": "narrator" }
}
```

The video's language picks the reference: an English video uses `reference_en.wav`, an Arabic one
`reference_ar.wav`. Both are cloned with Audar-TTS Turbo. If the language has no reference, another
one is used (English first; Audar speaks across languages), and `voices` warns. Library voices are
cloned only with Audar-TTS Turbo, never Qwen3-TTS. See TTS.md, "Cloning and the character library".

Other videos depend on these voices: don't replace a reference once videos use it.
