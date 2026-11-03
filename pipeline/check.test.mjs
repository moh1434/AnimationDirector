import test from "node:test";
import assert from "node:assert/strict";
import { judge, checkFrames } from "./check.mjs";

const box = (kind, x0, y0, x1, y1) => ({ kind, x0, y0, x1, y1 });
test("portrait audit catches feet crossing the bottom clearance", () => {
  const issues = judge({ W: 1080, H: 1920, boxes: [box("char:host", 300, 800, 700, 1930)] }, { layout: "host_talk" }, true);
  assert.ok(issues.some((i) => i.code === "safe-area" && i.msg.includes("bottom")));
});
test("caption collisions include characters and actual caption geometry", () => {
  const issues = judge({ W: 1080, H: 1920, boxes: [box("char:host", 300, 280, 700, 1000), box("captions", 100, 250, 900, 350)] }, { layout: "host_talk" }, true);
  assert.ok(issues.some((i) => i.code === "collision"));
  assert.ok(issues.some((i) => i.code === "caption-band"));
});
test("motion samples include punch peaks and end-of-hold, with unique valid frames", () => {
  const frames = checkFrames({ fps: 30, duration: 3, scenes: [{ start: 0, end: 3, camera: { punch: [1] }, actions: [{ at: 1.5 }] }] }).map((f) => f.frame);
  for (const f of [33, 36, 53, 80]) assert.ok(frames.includes(f));
  assert.equal(new Set(frames).size, frames.length);
  assert.ok(frames.every((f) => f >= 0 && f < 90));
});
test("a label in empty space between character parts is clear, but a real head overlap fails", () => {
  const character = { ...box("char:host", 100, 500, 900, 1500), parts: [box("head", 400, 700, 700, 1000), box("emote", 100, 500, 250, 650)] };
  const inspect = (label) => judge({ W: 1080, H: 1920, boxes: [character, label] }, { layout: "host_talk" }, true);
  assert.ok(!inspect(box("label", 400, 520, 700, 620)).some((i) => i.code === "collision"));
  assert.ok(inspect(box("label", 400, 750, 700, 850)).some((i) => i.code === "collision"));
});
