import test from "node:test";
import assert from "node:assert/strict";
import { fitWordsToSegments } from "./word-fit.mjs";

const seg = (start, end) => ({ start, end });
const w = (word, s, e, k) => ({ w: word, s, e, seg: k });

test("a block whisper placed too early is moved into its segment, keeping its spacing", () => {
  // clip 1 is fine; clip 2 really speaks 18.77-20.63 but whisper put it at 17.93
  const words = [w("The", 17.42, 17.6, 0), w("pocket.", 17.69, 17.9, 0), w("There.", 17.93, 18.3, 1), w("Impossible", 18.56, 19.3, 1), w("to", 19.35, 19.45, 1), w("reach.", 19.5, 19.7, 1)];
  const moved = fitWordsToSegments(words, [seg(17.46, 18.62), seg(18.77, 20.63)]);
  assert.equal(moved, 1);
  assert.ok(Math.abs(words[2].s - 18.83) < 0.01, `first word at ${words[2].s}`);
  assert.ok(Math.abs(words[3].s - 19.46) < 0.01 && Math.abs(words[5].s - 20.4) < 0.01, "spacing kept");
  assert.ok(words[5].e <= 20.63, "inside the clip");
  assert.deepEqual([words[0].s, words[1].s], [17.42, 17.69], "the correct clip is untouched");
});

test("a block that is too long for its clip once moved is squeezed to fit", () => {
  const words = [w("a", 0.0, 0.5, 0), w("b", 1.0, 1.5, 0), w("c", 2.0, 2.5, 0)];
  fitWordsToSegments(words, [seg(1, 3)]);
  assert.ok(words[0].s >= 1 && words[2].e <= 3, JSON.stringify(words));
  assert.ok(words[0].s < words[1].s && words[1].s < words[2].s, "order kept");
});

test("words that already lie in their segments are not changed, and estimated words are left alone", () => {
  const words = [w("x", 0.3, 0.6, 0), w("y", 0.7, 1.0, 0), w("z", 5, 5.4, 1)];
  const copy = JSON.stringify(words);
  assert.equal(fitWordsToSegments(words, [seg(0.25, 1.2), seg(4.9, 5.6)]), 0);
  assert.equal(JSON.stringify(words), copy);
  // an unmatched (estimated) word is never moved on its own
  const est = [w("p", 9, 9.4, 0)];
  assert.equal(fitWordsToSegments(est, [seg(1, 2)], [false]), 0);
  assert.equal(est[0].s, 9);
});
