# Character voice library

One folder per character. Each folder holds one premade voice that any video can clone, so the
character sounds like the same person in every video, with one reference recording per language.

```
voices-library/
  benny/                 ← Benny, Berry's friend and the narrator (on-screen preset: benny)
    reference_en.wav     ← the voice speaking English
    reference_ar.wav     ← the same voice speaking Arabic
    voice.json           ← per language: the file, its exact words and how it was made
```

`voice.json`:

```json
{
  "id": "benny",
  "preset": "benny",
  "description": "What the voice is like (a note for people; it is not sent to the model).",
  "languages": {
    "ar": {
      "file": "reference_ar.wav",
      "text": "The exact words spoken in reference_ar.wav.",
      "voiceId": "user:narrator_en_35aac8",
      "voiceName": "narrator_en",
      "workerMode": "clone",
      "engine": "audar",
      "settings": { "temperature": 0.7, "topK": 35, "topP": 0.9, "repeatPenalty": 1.1, "seed": 1579 }
    },
    "en": { "file": "reference_en.wav", "text": "…", "…": "…" }
  }
}
```

- `file` and `text` are what the clone needs: the recording and its **exact** words.
- `voiceId`, `voiceName` and `workerMode` record how the recording was made (your voice tool's ids); they
  are notes and are not sent to the model. `null` = not known.
- `engine` (optional): the model that clones this language, `"qwen3"` or `"audar"`. Left out (`null`),
  English is cloned by Qwen3-TTS and Arabic by Audar. A voice's own `"engine"` in `tts.json` still wins.
- `settings` are the settings the recording was made with (Qwen3-TTS takes `repeatPenalty` too). They become the defaults when a video
  clones this voice in that language (`temperature`, `topK`, `topP`, `repeatPenalty`), and `seed` is the
  seed of take 1 (the next takes add 11 each). An empty (`null`) setting falls back to the project's `"options"`, then to the model's defaults.
  They beat a project's project-wide `"options"`; only `"options"`/`"seeds"` on the voice itself in
  `tts.json` replace them, and `pnpm video voices` warns when that happens.

Use a library voice only as `{ "library": "<id>" }`. Naming its file as a `"reference"` is refused, and a
hand-written generation that skips the pipeline would also skip `voice.json`: always clone library voices
with `pnpm video voices`.

### Separate engine settings and original voice design

Both engines use the same camelCase setting names. A language can keep separate cloning settings:

```json
"engineSettings": {
  "qwen3": { "temperature": 0.8, "topK": 50, "topP": 0.9, "repeatPenalty": 1.05, "seed": 11 },
  "audar": { "temperature": 0.7, "topK": 35, "topP": 0.9, "repeatPenalty": 1.1, "seed": 1579 }
}
```

These are illustrative values, not recommended settings for an existing voice. Put this block inside
`languages.<lang>`. The selected engine's profile replaces the legacy `settings` block; missing or null
values in that profile fall back to project options and model defaults. If that engine has no profile,
the older `settings` block still works. Explicit per-voice options and seeds in `tts.json` still win.
`voice-ref --save` writes the selected engine's profile and preserves any other saved engine profiles.

New generated audio records also keep `description` and `design`. For a designed voice, `design`
contains the original `engine`, exact `description`, full generation `text`, and `settings` (including
the seed). That design record travels through shortened references, saved library voices, and later
clones. For an Arabic voice designed by Qwen3 and cloned by Audar, the design settings remain separate
from Audar's final generation settings. The design description is provenance; cloning still uses the
recording and its transcript, rather than designing the character again.

Unknown historical values remain null. Unspecified sampling values mean the model's defaults were
used; the pipeline does not guess their numerical values. Existing recordings are not regenerated or
overwritten by this schema update.

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
  "narrator": { "library": "benny" }
}
```

The video's language picks the reference: an English video uses `reference_en.wav`, an Arabic one
`reference_ar.wav`. English is cloned with Qwen3-TTS and Arabic with Audar-TTS Turbo, unless the language's
entry sets `"engine"` (`"qwen3"` or `"audar"`). If the language has no reference, another one is used
(English first; Audar speaks across languages), and `voices` warns. See TTS.md, "Cloning and the character library".

Other videos depend on these voices: don't replace a reference once videos use it.
