# Stock voices (candidates)

Ready-made voices that are **not yet any character's voice**. When a character has no voice in
`voices-library/`, these are offered as candidates next to newly designed voices. The user picks one,
and only then is it copied into `voices-library/<character>/` (same file names, same `voice.json`), so
no two characters end up sharing a stock voice by accident.

A video never uses a stock voice directly: `tts.json` points at `voices-library/` only.

```
voices-stock/
  audar-demo/            ← Audar-TTS Turbo's voice gallery (copied from weights/samples)
    demo_male_1/         warm, confident
    demo_male_2/         soft, intimate
    demo_male_3/         bright, curious
    demo_female_1/       vibrant, joyful
    demo_female_2/       velvety, playful
    demo_female_3/       airy, dreamy
      reference_en.wav   ← the voice speaking English (7–10 s)
      reference_ar.wav   ← the same voice speaking Arabic (8–13 s)
      source.wav         ← the gallery's original reference (words not published: listening only)
      voice.json         ← referenceText_en / referenceText_ar, the exact words, tags included
```

## Origin and license

The `audar-demo` voices ship with Audar-TTS-V1-Turbo (`weights/README.md`, "Voice Gallery"). They are
synthetic voices made by mixing several speakers, are not anyone's real voice, and are free to use.
The transcripts are the published captions, which match the audio word for word.

Their `reference_*` recordings are expressive (they contain `[excited]`, `[whispers]`, `[laughs]` …),
and a clone copies that delivery. For a calmer character, keep the tags in `say` sparse, or lower
`temperature` to 0.6–0.7.
