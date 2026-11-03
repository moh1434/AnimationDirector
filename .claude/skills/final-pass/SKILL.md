---
name: final-pass
description: Use after rendering a video in this pipeline, before telling the user it is done — machine checks (format, duration, black/frozen picture, loudness, true peak) plus a visual and listening review of the MP4s.
---

# Final pass on a rendered video

A video is not done because the render finished. Check the actual MP4 the user will upload.

## 1. Machine checks (automatic)

`pnpm video make <name>` renders the Shorts video and ends with a final pass; run it alone with
`pnpm video qc <name>`. Do not render the YouTube version unless the user asks — they use
`make-landscape-video.bat` for that.
It writes `out/final-pass.md` and a one-frame-per-second sheet `out/<name>-<format>-sheet.jpg`
(`pipeline/qc.mjs`):

| check | pass when |
|---|---|
| format | 1080×1920 (Shorts) / 1920×1080 (YouTube, only when the user renders it), 60 fps, audio stream present |
| duration | within max(0.15 s, 2 %) of the voice length |
| black | no stretch of black ≥0.25 s (blackdetect) |
| frozen | no identical picture ≥2.5 s (freezedetect) — fine only for a designed hold |
| loudness | −14 LUFS integrated ±1 (YouTube / Shorts normalise to about this) |
| true peak | ≤ −1 dBTP |

Also read `build/audio_report.json`: `music_under_voice_db_speech` should be about 16–19 dB and
`music_under_voice_db_pauses` about 10–13 dB. If the music is louder than that the voice gets
tiring to follow; if quieter the pauses feel dead.

## 2. Look

1. Open the frame sheet(s). Every second should show a clear subject; look for empty frames,
   repeated frames, a scene that never changes, text that is cut off.
2. Look at three full-size frames from the busiest moments (most objects / longest labels) in each
   format. Read every word on screen: spelling, language direction (Arabic is right-to-left), no
   text under the Shorts buttons (right side, bottom 20 %).
3. Watch transitions: no blank frame between shots, no element flashing in the wrong place for a
   frame.
4. Compare with `out/check-<format>.md`: any warning that was accepted should still look intended.

## 3. Listen

- The voice is always the clearest thing. Words are not masked by an effect or a music accent.
- Sound effects are sparse: an accent on the important pops, not on every element (the storyboard's
  `sfxDensity`: `sparse` | `normal` | `full`). Nothing clicks or clips.
- Music starts and ends cleanly; the last chord lands after the last word.

## 4. Report to the user

Say which files were made (`out/<name>-youtube.mp4`, `out/<name>-shorts.mp4`, `out/<name>.srt`),
whether the final pass passed, and any judgement call you made (an accepted warning and why). If a
check failed, fix it or say clearly what remains. Never claim a visual issue is fixed only because a
check passes — say what you looked at.
