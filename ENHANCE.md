# Voice enhancement (the user's step)

Before the final video is made, the user cleans the voice with their own tool (noise removal and
similar). The pipeline hands them the whole voice track and uses what they give back. It lives with
the other voice files, in `voices/`:

```
projects/<name>/voices/enhance/
  original.wav    ← written by plan: the video's whole voice track, final
  enhanced.wav    ← the user saves the cleaned voice here (any name; .wav .flac .mp3 .m4a .ogg)
  old/            ← enhanced files from an older voice (kept, never deleted)
  enhance.json    ← which voice was exported
```

Any audio file in `voices/enhance/` other than `original.wav` is taken as the enhanced voice, so
keep only one there.

## How it runs

1. When the voice is final (the user's recording, or `voice-pick` for generated voices), run
   `pnpm video plan <name>`. It writes `voices/enhance/original.wav`: the narration, or every
   dialogue clip assembled into one track with its gaps. Only the voice: no music, no sound effects.
2. **Tell the user** to clean that file and save the result next to it, and **wait** for them. The
   result must have the **same length and the same words**: no trimming, no padding, no speed change,
   or the picture drifts from the words.
3. Run `plan` again. It checks the length (±0.05 s) and uses the enhanced file from then on for
   lip-sync, word timing, the mix and the render. Read the whisper `% matched` line: a big drop means
   words were lost in the clean-up; tell the user.
4. `pnpm video make <name>`. Without an enhanced file `make` stops and says what to do.
   `--draft` renders a quick check with the original; `--skip-enhance` makes the final video without
   enhancement, only when the user says so.

You may direct, `check` and look at stills with the original voice while the user works: the
enhanced file has the same timing, so nothing needs re-directing.

## When the voice changes

New recordings or a new pick change the voice track. The next `plan` moves the old enhanced file to
`voices/enhance/old/<time>/`, exports the new original, and waits again. Tell the user it needs
enhancing again. Never edit, trim or rename the user's enhanced file yourself.

The Arabic version (`<name>-ar`) is its own project with its own `voices/enhance/` folder.
