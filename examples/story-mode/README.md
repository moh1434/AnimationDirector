# Story-mode example

A directed story to copy from: "The World's Unluckiest Thief".

- `source-script.md`: the original script and visual direction.
- `dialogue.template.json`: the 39 lines, their speakers and the recording file names. It has a longer
  pause before the officer's accusation, as the visual direction asks. There is no dog voice because the
  script gives the dog no lines; add a clip such as `{"who": "dog", "text": "[bark]", ...}` if you want one.
- `storyboard.json`: the full direction, 31 scenes. Its timing is all `clip:N` and `@word`, so it fits any
  recordings of these lines.

To use it, run `pnpm video new my-story --story`, copy the template over `dialogue.json`, put the
recordings in `voices/`, copy `storyboard.json` in, and run `plan`, `check` and `make`.
See [STORY_MODE.md](../../STORY_MODE.md).
