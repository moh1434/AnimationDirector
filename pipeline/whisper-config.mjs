// whisper.cpp settings from the project's .env file (see .env.example), validated with clear errors.
//
//   WHISPER_PATH="../whisper.cpp/"      folder of whisper.cpp, relative to this project (empty = off)
//   WHISPER_EN_MODEL="small.en"         model for English narration  → <path>/models/ggml-small.en.bin
//   WHISPER_AR_MODEL="large-v3-turbo"   model for Arabic / other languages (must be multilingual; empty = off)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { ROOT, IS_WIN } from "./env.mjs";

const WHISPER_KEYS = ["WHISPER_PATH", "WHISPER_EN_MODEL", "WHISPER_AR_MODEL"];
/** Every setting .env may contain (the REMOTION_ ones are optional). */
export const ENV_KEYS = [...WHISPER_KEYS, "REMOTION_BUNDLER", "REMOTION_RENDERER", "TTS_AUDAR_DIR", "TTS_QWEN3_DIR", "TTS_UV", "TTS_COOLDOWN_SECONDS"];
const lev = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const KNOWN_MODELS = ["tiny", "tiny.en", "base", "base.en", "small", "small.en", "medium", "medium.en", "large-v1", "large-v2", "large-v3", "large-v3-turbo"];

/** Parse KEY=VALUE lines (# comments, optional quotes). Returns { vars, errors }. */
export function parseEnv(text) {
  const vars = {}, errors = [];
  text.replace(/^﻿/, "").split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) return errors.push(`.env line ${i + 1}: "${line}" is not KEY=VALUE`);
    let v = m[2].trim();
    if (/^"/.test(v)) { const e = v.indexOf('"', 1); if (e < 0) return errors.push(`.env line ${i + 1}: missing closing "`); v = v.slice(1, e); }
    else if (/^'/.test(v)) { const e = v.indexOf("'", 1); if (e < 0) return errors.push(`.env line ${i + 1}: missing closing '`); v = v.slice(1, e); }
    else v = v.replace(/\s+#.*$/, "").trim();
    vars[m[1]] = v;
  });
  return { vars, errors };
}

const modelsIn = (dir) => {
  try { return readdirSync(dir).filter((f) => /^ggml-.+\.bin$/.test(f) && !/^for-tests/.test(f) && statSync(join(dir, f)).size > 1e6).map((f) => f.replace(/^ggml-|\.bin$/g, "")); } catch { return []; }
};

/**
 * Read and validate the whisper settings.
 * @returns { enabled, path, bin, modelsDir, models: { en, ar } (file paths or null), errors, warnings, envFile }
 */
export function whisperConfig({ root = ROOT, env = process.env } = {}) {
  const envFile = join(root, ".env");
  const errors = [], warnings = [];
  const out = { enabled: false, path: null, bin: null, modelsDir: null, models: { en: null, ar: null }, errors, warnings, envFile };
  if (!existsSync(envFile)) {
    errors.push(`No .env file in ${root}.\n  Copy .env.example to .env (setup.bat does this) and set WHISPER_PATH, WHISPER_EN_MODEL and WHISPER_AR_MODEL.`);
    return out;
  }
  const { vars, errors: syntax } = parseEnv(readFileSync(envFile, "utf8"));
  errors.push(...syntax);
  for (const k of Object.keys(vars)) if (!ENV_KEYS.includes(k)) {
    const near = ENV_KEYS.find((x) => lev(x.toUpperCase(), k.toUpperCase()) <= 3);
    warnings.push(`.env: unknown setting ${k}${near ? ` (did you mean ${near}?)` : ""} — it is ignored.`);
  }
  const get = (k) => (env[k] !== undefined && env[k] !== "" ? env[k] : vars[k]) ?? undefined;
  const renderer = get("REMOTION_RENDERER");
  if (renderer !== undefined && renderer !== "" && !["gpu", "cpu"].includes(String(renderer).trim().toLowerCase())) errors.push(`.env: REMOTION_RENDERER="${renderer}" must be "gpu" or "cpu".`);
  const bundler = get("REMOTION_BUNDLER");
  if (bundler !== undefined && bundler !== "" && !["rspack", "webpack"].includes(String(bundler).trim().toLowerCase())) errors.push(`.env: REMOTION_BUNDLER="${bundler}" must be "rspack" or "webpack".`);
  for (const k of WHISPER_KEYS) if (get(k) === undefined) errors.push(`.env: ${k} is missing. Add it (see .env.example); use ${k}="" to turn it off.`);
  if (errors.length) return out;

  const p = String(get("WHISPER_PATH")).trim();
  if (!p || /^(none|off|false)$/i.test(p)) {
    warnings.push("whisper.cpp is turned off (WHISPER_PATH is empty): word times are estimated from the voice.");
    return out;
  }
  const path = isAbsolute(p) ? p : resolve(root, p);
  out.path = path;
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    errors.push(`WHISPER_PATH="${p}" → ${path} does not exist.\n  Set it to your whisper.cpp folder (relative to this project or absolute), or WHISPER_PATH="" to turn it off.`);
    return out;
  }
  const exe = (n) => (IS_WIN ? `${n}.exe` : n);
  const cands = [
    ["build", "bin", "Release", exe("whisper-cli")], ["build", "bin", exe("whisper-cli")], ["bin", "Release", exe("whisper-cli")],
    ["Release", exe("whisper-cli")], ["bin", exe("whisper-cli")], [exe("whisper-cli")], ["build", "bin", "Release", exe("main")], [exe("main")],
  ].map((x) => join(path, ...x));
  out.bin = cands.find((c) => existsSync(c)) ?? null;
  if (!out.bin) errors.push(`No whisper-cli program in ${path}.\n  Looked for: ${cands.slice(0, 4).map((c) => c.slice(path.length + 1)).join(", ")} …\n  Build whisper.cpp there, or unzip a release (whisper-bin-x64.zip) into that folder.`);
  out.modelsDir = join(path, "models");
  const have = modelsIn(out.modelsDir);
  const resolveModel = (key, lang) => {
    const v = String(get(key)).trim();
    if (!v || /^(none|off|false)$/i.test(v)) {
      warnings.push(`${key} is empty: ${lang} word times are estimated from the voice.`);
      return null;
    }
    const file = /\.bin$/i.test(v) ? (isAbsolute(v) ? v : existsSync(resolve(root, v)) ? resolve(root, v) : join(out.modelsDir, v)) : join(out.modelsDir, `ggml-${v.replace(/^ggml-/, "")}.bin`);
    const name = v.replace(/^.*[\\/]/, "").replace(/^ggml-|\.bin$/gi, "");
    if (lang === "Arabic" && /\.en$/i.test(name)) {
      errors.push(`${key}="${v}" is an English-only model; it cannot hear Arabic. Use a multilingual one such as large-v3-turbo, medium or small.`);
      return null;
    }
    if (!existsSync(file)) {
      const known = KNOWN_MODELS.includes(name) ? "" : `\n  "${name}" is not a whisper model name. Valid names: ${KNOWN_MODELS.join(", ")} (quantized files like large-v3-turbo-q5_0 work too).`;
      errors.push(`${key}="${v}": model file not found:\n    ${file}${known}\n  Models you have: ${have.length ? have.join(", ") : "none"}.\n  Download it:  cd "${out.modelsDir}"  then  ${IS_WIN ? ".\\download-ggml-model.cmd" : "./download-ggml-model.sh"} ${KNOWN_MODELS.includes(name) ? name : "small.en"}`);
      return null;
    }
    if (statSync(file).size < 1e6) errors.push(`${key}: ${file} is too small to be a model (an interrupted download?). Download it again.`);
    return file;
  };
  out.models.en = resolveModel("WHISPER_EN_MODEL", "English");
  out.models.ar = resolveModel("WHISPER_AR_MODEL", "Arabic");
  out.enabled = !!out.bin && !errors.length;
  return out;
}

/** Validate, print warnings once, and throw one clear error when something is wrong. */
let warned = false;
export function requireWhisperConfig(opts) {
  const c = whisperConfig(opts);
  if (c.errors.length) throw new Error(`whisper.cpp settings (.env) need fixing:\n  - ${c.errors.join("\n  - ")}`);
  if (!warned) { c.warnings.forEach((w) => console.log("⚠", w)); warned = true; }
  return c;
}

/** The model for a narration language: English uses WHISPER_EN_MODEL, every other language WHISPER_AR_MODEL. */
export const modelFor = (c, lang) => (lang === "en" ? c.models.en : c.models.ar);

/** What draws and encodes the video: REMOTION_RENDERER in .env, "gpu" unless it says "cpu". */
export function rendererName({ root = ROOT, env = process.env } = {}) {
  let v = env.REMOTION_RENDERER;
  if (!v) { const f = join(root, ".env"); if (existsSync(f)) v = parseEnv(readFileSync(f, "utf8")).vars.REMOTION_RENDERER; }
  return String(v ?? "").trim().toLowerCase() === "cpu" ? "cpu" : "gpu";
}

/** Which bundler Remotion uses: REMOTION_BUNDLER in .env ("rspack" by default, "webpack" to go back). */
export function bundlerName({ root = ROOT, env = process.env } = {}) {
  let v = env.REMOTION_BUNDLER;
  if (!v) { const f = join(root, ".env"); if (existsSync(f)) v = parseEnv(readFileSync(f, "utf8")).vars.REMOTION_BUNDLER; }
  return String(v ?? "").trim().toLowerCase() === "webpack" ? "webpack" : "rspack";
}
