# Status (2 Nov 2026) — complete

Verified on this PC:
- setup.bat (npm + uv + Remotion's headless browser)
- make-video.bat demo-game: whisper word timing, pretty_midi + Tone.js music, pedalboard mix,
  Remotion YouTube + Shorts renders (~100 s for both)
- hyperframes-export.bat demo-game --format shorts --render (HyperFrames render, same frames)

Demo outputs: projects/demo-game/out/ (youtube, shorts, shorts-hyperframes, .srt)

Optional next steps:
- Arabic whisper model for exact Arabic caption timing:
  whisper.cpp\models\download-ggml-model.cmd small
- More props / character presets; smarter auto-director.
