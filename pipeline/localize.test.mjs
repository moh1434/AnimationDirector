import test from "node:test";
import assert from "node:assert/strict";
import { timeMap, localizeStoryboard, screenStrings } from "./localize.mjs";

const en = { duration: 6, words: [
  { w: "Make", s: 0.1, e: 0.4, seg: 0 }, { w: "money", s: 0.5, e: 1.0, seg: 0 }, { w: "now.", s: 1.1, e: 1.5, seg: 0 },
  { w: "Use", s: 3.0, e: 3.3, seg: 1 }, { w: "AI", s: 3.4, e: 3.8, seg: 1 }, { w: "today.", s: 3.9, e: 4.5, seg: 1 },
] };
const ar = { duration: 7, fps: 60, words: [
  { w: "اربح", s: 0.2, e: 0.6, seg: 0 }, { w: "المال", s: 0.7, e: 1.3, seg: 0 }, { w: "الآن.", s: 1.4, e: 2.0, seg: 0 },
  { w: "استخدم", s: 3.6, e: 4.1, seg: 1 }, { w: "الذكاء", s: 4.2, e: 4.8, seg: 1 }, { w: "اليوم.", s: 4.9, e: 5.6, seg: 1 },
] };
const src = { version: 1, title: "Money", fps: 60, duration: 6, cast: { host: { preset: "host" } }, scenes: [
  { id: "a", start: 0, end: 2.94, layout: "host_talk", characters: [{ who: "host" }], props: [{ name: "moneybag", at: 0.45, label: "money" }] },
  { id: "b", start: 2.94, end: 6, layout: "title", title: "Use AI", actions: [{ at: 0.41, who: "host", pose: "point" }] },
] };
const segs = [{ start: 0, end: 2.5, text: "اربح المال الآن." }, { start: 3.4, end: 6.5, text: "استخدم الذكاء اليوم." }];

test("the time map is anchored on each sentence and never runs backwards", () => {
  const m = timeMap(en.words, en.duration, ar.words, ar.duration, 2);
  assert.ok(Math.abs(m(0.1) - 0.2) < 1e-9 && Math.abs(m(3.0) - 3.6) < 1e-9 && Math.abs(m(6) - 7) < 1e-9);
  for (let t = 0; t < 6; t += 0.1) assert.ok(m(t + 0.1) >= m(t));
});
test("scenes start before the matching sentence and word-tied times follow their word", () => {
  const { storyboard: sb, missing } = localizeStoryboard(src, { srcAnalysis: en, dstAnalysis: ar, dstSegments: segs, translations: { money: "المال" }, lang: "ar", source: "money" });
  assert.equal(sb.language, "ar");
  assert.ok(Math.abs(sb.scenes[1].start - (3.6 - 0.06)) < 0.03);           // before "استخدم"
  assert.ok(Math.abs(sb.scenes[0].start + sb.scenes[0].props[0].at - (0.7 - 0.05)) < 0.03); // on "المال"
  assert.ok(Math.abs(sb.scenes[1].start + sb.scenes[1].actions[0].at - (4.2 - 0.05)) < 0.03); // on "الذكاء"
  assert.equal(sb.scenes[0].props[0].label, "المال");
  assert.deepEqual(missing.sort(), ["Money", "Use AI"].sort());              // untranslated stay listed
  assert.ok(sb.scenes[1].text.includes("استخدم"));
});
test("different sentence counts are refused with a clear message", () => {
  assert.throws(() => localizeStoryboard(src, { srcAnalysis: en, dstAnalysis: ar, dstSegments: segs.slice(0, 1) }), /same number of segments/);
});
test("every on-screen string is collected once", () => {
  assert.deepEqual(screenStrings(src).sort(), ["Money", "Use AI", "money"].sort());
});
