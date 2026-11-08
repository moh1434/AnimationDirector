import test from "node:test";
import assert from "node:assert/strict";
import { compile, videoDuration } from "./compile.mjs";
import { validateStoryboard } from "./storyboard-tools.mjs";

// The voice is the source of truth: the video is never shorter than it, and may run longer.
const analysis = { fps: 60, duration: 30, words: [{ w: "Hi", s: 0.1, e: 0.4 }] };

test("the video lasts the whole voice, or longer when the storyboard asks", () => {
  assert.equal(videoDuration({}, analysis), 30);
  assert.equal(videoDuration({ duration: 20 }, analysis), 30, "a storyboard cannot make the video shorter than the voice");
  assert.equal(videoDuration({ duration: 33.5 }, analysis), 33.5);
  assert.equal(videoDuration({ endHold: 1.5 }, analysis), 31.5);
  const sb = { version: 1, duration: 30, endHold: 2, scenes: [{ start: 0, layout: "title", title: "Hi" }] };
  const out = compile(sb, analysis, { format: "shorts" }).storyboard;
  assert.equal(out.duration, 32);
  assert.equal(out.scenes[0].end, 32, "the last scene holds to the end");
});

test("a scene may start after the last word when the video runs on", () => {
  const scenes = [{ start: 0, layout: "title", title: "Hi" }, { start: 30.5, layout: "title", title: "The end" }];
  const errs = (sb) => validateStoryboard(sb, { words: analysis.words, duration: videoDuration(sb, analysis) }).errors.join("\n");
  assert.match(errs({ version: 1, scenes }), /after the video ends/);
  assert.equal(errs({ version: 1, endHold: 2, scenes }), "");
});
