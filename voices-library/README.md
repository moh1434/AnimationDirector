# Character voice library

One folder per character. Each folder holds one premade voice that any video can clone, so the
character sounds like the same person in every video, with one reference recording per language.

```
voices-library/
  narrator/              ← the narrator (on-screen preset: host)
    reference_en.wav     ← the voice speaking English
    reference_ar.wav     ← the same voice speaking Arabic
    voice.json           ← the exact words spoken in each recording
```

`voice.json`:

```json
{
  "id": "narrator",
  "preset": "host",
  "referenceText_en": "The exact words spoken in reference_en.wav.",
  "referenceText_ar": "الكلمات المنطوقة في reference_ar.wav بالضبط.",
  "description": "What the voice is like (a note for people; it is not sent to the model)."
}
```

## Adding a voice or a language

1. Put the recording in the character's folder as **`reference_<language>.wav`** (`reference_en.wav`,
   `reference_ar.wav`, …).
   - 5–15 s (about 9 s is best), one speaker, no music, no noise, no long silence at the start or end.
   - Spoken the way the character usually talks: the clone copies the tone and delivery too.
2. In **`voice.json`**, write the **exact** words spoken in it as `"referenceText_<language>"`
   (same words, same order; punctuation as spoken). A wrong transcript makes the clone worse.
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
one is used (English first; Audar speaks across languages), and `voices` warns. Add
`"engine": "qwen3"` to clone an English video with Qwen3-TTS instead. See TTS.md, "Cloning and the
character library".

Other videos depend on these voices: don't replace a reference once videos use it.
