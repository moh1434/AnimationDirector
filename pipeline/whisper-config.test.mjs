import test from "node:test";
import assert from "node:assert/strict";
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
