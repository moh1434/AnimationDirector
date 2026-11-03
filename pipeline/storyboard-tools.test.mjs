import test from "node:test";
import assert from "node:assert/strict";
import { validateStoryboard } from "./storyboard-tools.mjs";
import { catalog } from "./catalog.mjs";

const words = [{ w: "Hello", s: 0.1, e: 0.5 }, { w: "world.", s: 0.5, e: 1.0 }, { w: "Look", s: 1.4, e: 1.7 }, { w: "here", s: 1.7, e: 2.0 }];
const ok = { version: 1, cast: { host: { preset: "host" } }, scenes: [
  { id: "a", start: 0, layout: "host_talk", bg: "mint", characters: [{ who: "host", pose: "talk", expression: "happy" }], props: [{ name: "earth", at: "@world" }] },
  { id: "b", start: 1.34, layout: "steps", bg: { type: "space" }, characters: [{ who: "host" }], items: [{ prop: "gear" }, { prop: "diamond" }] },
] };

test("the catalog is read from the source files", () => {
  const c = catalog();
  for (const k of ["host_talk", "steps", "duo"]) assert.ok(c.layouts.includes(k));
  assert.ok(c.props.length > 100 && c.poses.includes("point") && c.expressions.includes("happy"));
  assert.ok(c.bgTypes.includes("space") && c.bgColors.includes("mint"));
});
test("a correct storyboard (aliases included) has no errors", () => {
  assert.deepEqual(validateStoryboard(ok, { words, duration: 2.2 }).errors, []);
});
test("unknown names get a precise location and a suggestion", () => {
  const bad = structuredClone(ok);
  bad.scenes[0].props[0].name = "erth";
  bad.scenes[0].characters[0].pose = "pointing";
  bad.scenes[1].layout = "step";
  const { errors } = validateStoryboard(bad, { words, duration: 2.2 });
  assert.ok(errors.some((e) => e.includes("props[0].name") && e.includes("earth")));
  assert.ok(errors.some((e) => e.includes("pose \"pointing\"") && e.includes("point")));
  assert.ok(errors.some((e) => e.includes("layout \"step\"") && e.includes("steps")));
});
test("word references must be spoken inside the scene", () => {
  const bad = structuredClone(ok);
  bad.scenes[0].props[0].at = "@here";
  assert.ok(validateStoryboard(bad, { words, duration: 2.2 }).errors.some((e) => e.includes("\"@here\" is not spoken")));
});
test("layout requirements and time order are enforced", () => {
  const bad = structuredClone(ok);
  bad.scenes[1].items = [{ prop: "gear" }];
  bad.scenes[1].start = 0;
  const { errors } = validateStoryboard(bad, { words, duration: 2.2 });
  assert.ok(errors.some((e) => e.includes("needs 2–5 items")));
  assert.ok(errors.some((e) => e.includes("time order")));
});
test("characters must be in the cast; actions must target a scene character", () => {
  const bad = structuredClone(ok);
  bad.scenes[0].characters.push({ who: "ghost_girl" });
  bad.scenes[0].actions = [{ at: 0.5, who: "kid", pose: "wave" }];
  const { errors } = validateStoryboard(bad, { words, duration: 2.2 });
  assert.ok(errors.some((e) => e.includes("\"ghost_girl\" is not in \"cast\"")));
  assert.ok(errors.some((e) => e.includes("who \"kid\" is not one of this scene's characters")));
});
