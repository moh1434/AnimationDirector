import test from "node:test";
import assert from "node:assert/strict";
import { rendererName } from "./whisper-config.mjs";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseEnv, whisperConfig } from "./whisper-config.mjs";

const exe = process.platform === "win32" ? "whisper-cli.exe" : "whisper-cli";
function setup(envText, models = ["small.en", "large-v3-turbo"]) {
  const base = mkdtempSync(join(tmpdir(), "wcfg-"));
  const root = join(base, "project"), wh = join(base, "whisper.cpp");
  mkdirSync(join(wh, "build", "bin", "Release"), { recursive: true });
  mkdirSync(join(wh, "models"), { recursive: true });
  mkdirSync(root);
  writeFileSync(join(wh, "build", "bin", "Release", exe), "");
  for (const m of models) writeFileSync(join(wh, "models", `ggml-${m}.bin`), Buffer.alloc(1_100_000));
  if (envText !== null) writeFileSync(join(root, ".env"), envText);
  return root;
}
const GOOD = 'WHISPER_PATH="../whisper.cpp/"\nWHISPER_EN_MODEL="small.en"\nWHISPER_AR_MODEL="large-v3-turbo"\n';

test("parses quotes, comments and export", () => {
  const { vars, errors } = parseEnv('# c\nA="x # y"\nexport B=plain # note\nC=\'q\'\n');
  assert.deepEqual(errors, []);
  assert.deepEqual(vars, { A: "x # y", B: "plain", C: "q" });
});
test("a correct .env finds the program and both models", () => {
  const c = whisperConfig({ root: setup(GOOD), env: {} });
  assert.deepEqual(c.errors, []);
  assert.ok(c.enabled && c.bin && c.models.en.endsWith("ggml-small.en.bin") && c.models.ar.endsWith("ggml-large-v3-turbo.bin"));
});
test("a missing .env, a missing key and a missing model are clear errors", () => {
  assert.match(whisperConfig({ root: setup(null), env: {} }).errors[0], /No \.env file/);
  assert.match(whisperConfig({ root: setup('WHISPER_PATH="../whisper.cpp/"\nWHISPER_EN_MODEL="small.en"\n'), env: {} }).errors.join(), /WHISPER_AR_MODEL is missing/);
  const e = whisperConfig({ root: setup(GOOD.replace("small.en", "medium.en")), env: {} }).errors.join("\n");
  assert.match(e, /model file not found/);
  assert.match(e, /Models you have: small\.en, large-v3-turbo|Models you have: large-v3-turbo, small\.en/);
  assert.match(e, /download-ggml-model/);
});
test("an English-only Arabic model and a wrong folder are refused", () => {
  assert.match(whisperConfig({ root: setup(GOOD.replace('AR_MODEL="large-v3-turbo"', 'AR_MODEL="small.en"')), env: {} }).errors.join(), /English-only/);
  assert.match(whisperConfig({ root: setup(GOOD.replace("../whisper.cpp/", "../nowhere/")), env: {} }).errors.join(), /does not exist/);
});
test("empty values turn whisper (or one language) off without errors", () => {
  const off = whisperConfig({ root: setup('WHISPER_PATH=""\nWHISPER_EN_MODEL=""\nWHISPER_AR_MODEL=""\n'), env: {} });
  assert.deepEqual(off.errors, []); assert.equal(off.enabled, false);
  const arOff = whisperConfig({ root: setup(GOOD.replace('"large-v3-turbo"', '""')), env: {} });
  assert.deepEqual(arOff.errors, []); assert.equal(arOff.models.ar, null); assert.ok(arOff.models.en);
});
test("a typo in a key is pointed out", () => {
  const c = whisperConfig({ root: setup(GOOD + 'WHISPER_EN_MODLE="x"\n'), env: {} });
  assert.ok(c.warnings.some((w) => w.includes("WHISPER_EN_MODLE") && w.includes("WHISPER_EN_MODEL")));
});

test("the renderer setting defaults to the GPU and ignores case", () => {
  const root = "C:/no-such-folder";
  assert.equal(rendererName({ root, env: {} }), "gpu");
  assert.equal(rendererName({ root, env: { REMOTION_RENDERER: "CPU" } }), "cpu");
  assert.equal(rendererName({ root, env: { REMOTION_RENDERER: "gpu" } }), "gpu");
});

test("CHUNK_COOLDOWN_SEC sets the rest between voice generations, 15 s when missing or wrong", async () => {
  const { restSeconds, DEFAULT_COOLDOWN_SECONDS } = await import("./whisper-config.mjs");
  const none = "C:/no-such-folder";
  assert.equal(DEFAULT_COOLDOWN_SECONDS, 15);
  assert.equal(restSeconds({ root: none, env: {} }), 15);
  assert.equal(restSeconds({ root: none, env: { CHUNK_COOLDOWN_SEC: "5" } }), 5);
  assert.equal(restSeconds({ root: none, env: { CHUNK_COOLDOWN_SEC: "0" } }), 0, "0 means no rest");
  assert.equal(restSeconds({ root: none, env: { CHUNK_COOLDOWN_SEC: "2.5" } }), 2.5);
  assert.equal(restSeconds({ root: none, env: { CHUNK_COOLDOWN_SEC: "soon" } }), 15);
  assert.equal(restSeconds({ root: none, env: { CHUNK_COOLDOWN_SEC: "-3" } }), 15);
  assert.equal(restSeconds({ root: none, env: { CHUNK_COOLDOWN_SEC: "600" } }), 600);
  assert.equal(restSeconds({ root: none, env: { CHUNK_COOLDOWN_SEC: "601" } }), 15, "more than 10 minutes is a typo");
  assert.equal(restSeconds({ root: setup(GOOD + "CHUNK_COOLDOWN_SEC=5\n"), env: {} }), 5, "read from the .env file");
  assert.equal(restSeconds({ root: setup(GOOD + "CHUNK_COOLDOWN_SEC=5\n"), env: { CHUNK_COOLDOWN_SEC: "8" } }), 8, "a real environment variable wins");
  assert.equal(restSeconds({ root: setup(GOOD + "TTS_COOLDOWN_SECONDS=20\n"), env: {} }), 20, "the old name still works");
  assert.equal(restSeconds({ root: setup(GOOD + "TTS_COOLDOWN_SECONDS=20\nCHUNK_COOLDOWN_SEC=6\n"), env: {} }), 6, "the new name wins");
  assert.equal(whisperConfig({ root: setup(GOOD + "CHUNK_COOLDOWN_SEC=5\n"), env: {} }).warnings.length, 0, "not reported as an unknown setting");
  // a typo is a warning, never an error: it must not stop plan/make or switch off the word check of takes
  const bad = whisperConfig({ root: setup(GOOD + 'CHUNK_COOLDOWN_SEC="soon"\n'), env: {} });
  assert.deepEqual(bad.errors, []);
  assert.match(bad.warnings.join("\n"), /CHUNK_COOLDOWN_SEC="soon" must be a number of seconds from 0 to 600/);
  assert.match(whisperConfig({ root: setup(GOOD + 'TTS_COOLDOWN_SECONDS="soon"\n'), env: {} }).warnings.join("\n"), /TTS_COOLDOWN_SECONDS="soon"/, "the warning names the key that is wrong");
  assert.deepEqual(whisperConfig({ root: setup(GOOD + "CHUNK_COOLDOWN_SEC=\nTTS_COOLDOWN_SECONDS=soon\n"), env: {} }).errors, []);
});
test("VIDEO_FPS sets the frame rate, 30 when missing or wrong", async () => {
  const { videoFps } = await import("./whisper-config.mjs");
  assert.equal(videoFps({ root: "C:/no-such-folder", env: {} }), 30);
  assert.equal(videoFps({ root: "C:/no-such-folder", env: { VIDEO_FPS: "60" } }), 60);
  assert.equal(videoFps({ root: "C:/no-such-folder", env: { VIDEO_FPS: "33" } }), 30);
  assert.equal(videoFps({ root: setup(GOOD + 'VIDEO_FPS="24"\n'), env: {} }), 24);
  assert.ok(whisperConfig({ root: setup(GOOD + 'VIDEO_FPS="33"\n'), env: {} }).errors.some((e) => e.includes("VIDEO_FPS")));
  assert.deepEqual(whisperConfig({ root: setup(GOOD + 'VIDEO_FPS="30"\n'), env: {} }).warnings.filter((w) => w.includes("VIDEO_FPS")), []);
});
