import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { enhanceStep } from "./enhance.mjs";

// lengths come from a table instead of ffprobe: file contents "len:<seconds>"
const seconds = (f) => Number(readFileSync(f, "utf8").split(":")[1]);
const project = () => {
  const dir = mkdtempSync(join(tmpdir(), "enhance-"));
  writeFileSync(join(dir, "voice.wav"), "len:10.00");
  return dir;
};
let clock = 0;
const opts = { seconds, now: () => `2026-11-09T00:00:0${clock++}.000Z` };

test("the final voice is exported and the original is used until the enhanced file arrives", () => {
  const dir = project();
  const r = enhanceStep(dir, join(dir, "voice.wav"), opts);
  assert.equal(r.state, "waiting");
  assert.equal(r.voice, join(dir, "voice.wav"));
  assert.equal(readFileSync(join(dir, "voices", "enhance", "original.wav"), "utf8"), "len:10.00");
  assert.match(r.messages.join("\n"), /Waiting for the enhanced voice/);
});

test("the enhanced file is used when it has the same length, whatever its name", () => {
  const dir = project();
  enhanceStep(dir, join(dir, "voice.wav"), opts);
  writeFileSync(join(dir, "voices", "enhance", "voice_denoised.flac"), "len:10.02");
  const r = enhanceStep(dir, join(dir, "voice.wav"), opts);
  assert.equal(r.state, "enhanced");
  assert.equal(r.voice, join(dir, "voices", "enhance", "voice_denoised.flac"));
  assert.ok(!r.messages.some((m) => /Exported/.test(m)), "an unchanged voice is not exported again");
});

test("an enhanced file of another length, or two files, is refused", () => {
  const dir = project();
  enhanceStep(dir, join(dir, "voice.wav"), opts);
  writeFileSync(join(dir, "voices", "enhance", "enhanced.wav"), "len:9.50");
  let r = enhanceStep(dir, join(dir, "voice.wav"), opts);
  assert.equal(r.state, "error");
  assert.match(r.messages.at(-1), /9\.50 s but the original is 10\.00 s/);
  writeFileSync(join(dir, "voices", "enhance", "enhanced.wav"), "len:10.00");
  writeFileSync(join(dir, "voices", "enhance", "other.mp3"), "len:10.00");
  r = enhanceStep(dir, join(dir, "voice.wav"), opts);
  assert.equal(r.state, "error");
  assert.match(r.messages.at(-1), /2 enhanced files/);
});

test("a new voice moves the old enhanced file aside and exports the new original", () => {
  const dir = project();
  enhanceStep(dir, join(dir, "voice.wav"), opts);
  writeFileSync(join(dir, "voices", "enhance", "enhanced.wav"), "len:10.00");
  writeFileSync(join(dir, "voice.wav"), "len:12.00"); // new recordings
  const r = enhanceStep(dir, join(dir, "voice.wav"), opts);
  assert.equal(r.state, "waiting");
  assert.equal(readFileSync(join(dir, "voices", "enhance", "original.wav"), "utf8"), "len:12.00");
  assert.deepEqual(readdirSync(join(dir, "voices", "enhance")).sort(), ["enhance.json", "old", "original.wav"]);
  const old = readdirSync(join(dir, "voices", "enhance", "old"));
  assert.equal(old.length, 1);
  assert.deepEqual(readdirSync(join(dir, "voices", "enhance", "old", old[0])), ["enhanced.wav"], "the user's work is kept, not deleted");
});
