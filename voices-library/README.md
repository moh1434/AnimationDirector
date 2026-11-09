# Character voice library

One folder per character. Each folder holds one premade voice that any video can clone, so the
character sounds like the same person in every video.

```
voices-library/
  narrator/            ← the narrator (on-screen preset: host)
    reference.wav      ← you put the voice here
    voice.json         ← the exact words spoken in reference.wav
```

## Adding a voice

1. Put the recording in the character's folder as **`reference.wav`**.
   - 5–15 s (about 9 s is best), one speaker, no music, no noise, no long silence at the start or end.
   - Spoken the way the character usually talks: the clone copies the tone and delivery too.
2. Open **`voice.json`** and write the **exact** words spoken in the WAV in `"referenceText"`
   (same words, same order; punctuation as spoken). A wrong transcript makes the clone worse.
3. Set `"language"` to the language of the recording (`"en"` or `"ar"`).

The folder name is the voice's id: lower case, letters, digits and `_` only.

## Using it in a video

In the project's `tts.json`:

```json
"voices": {
  "narrator": { "library": "narrator" }
}
```

English is cloned with CosyVoice3, and Arabic with VoxCPM2 (ultimate clone). An English reference can
speak Arabic too. Add `"engine": "voxcpm2"` to use VoxCPM2 for English, or `"style"` for a CosyVoice3
delivery (`happy`, `sad`, `angry`, …). See TTS.md, "Cloning and the character library".

Other videos depend on these voices: don't replace a `reference.wav` once videos use it.
