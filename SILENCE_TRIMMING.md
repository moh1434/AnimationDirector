# Removing silent moments from voice files

When the user asks to remove a silent moment from a voice file:

- **Silence at the start (second 0):** keep only **0.1 s** of it.
- **Silence anywhere else (in the middle):** keep only **0.4 s** of it.

## Rules

- Never touch the words. Cut only inside the silence.
- Copy every affected file into an `original_before_trim/` subfolder (next to the file) before changing it.
- Always cut from the untouched original, never from an already-trimmed file.
- Keep the same format (sample rate, channels, PCM 16-bit).
- Only trim the silences the user names; list the other pauses you found and leave them.

## How

Find silences:

```
ffmpeg -i file.wav -af silencedetect=n=-35dB:d=0.15 -f null -
```

Start (silence ends at `E`): keep from `E - 0.1`.

```
ffmpeg -ss <E-0.1> -i original_before_trim/file.wav -c copy file.wav
```

Middle (silence from `S` to `E`): keep 0.2 s on each side, remove the rest.

```
ffmpeg -i original_before_trim/file.wav -filter_complex \
 "[0]atrim=0:<S+0.2>,asetpts=PTS-STARTPTS[a];[0]atrim=<E-0.2>,asetpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=0:a=1" \
 -c:a pcm_s16le file.wav
```

Check with `silencedetect` that the remaining pause is 0.1 s (start) or 0.4 s (middle).
