// Voices from text with local models (Audar-TTS Turbo, Qwen3-TTS). See TTS.md.
//
// Each character speaks ALL of their lines in one take, so the character stays one person. The user
// listens to a few takes per character and picks one; that take is then cut back into its lines
// (whisper.cpp word times + the quiet gaps between lines) and written as normal recordings:
// dialogue.json + voices/, or voice.wav + script.txt when a single voice speaks everything. Speech is
// cut at pauses only, never stretched or re-timed: the voice's own pace is the pace of the video.
//
// Engines (each runs in its own Python environment, through a worker in pipeline/tts_workers/):
//   audar  Audar-TTS-V1-Turbo: clones a reference recording (+ its exact words), English and Arabic.
//          A clone take is made in chunks of a few lines (one generation is at most ~36 s) and joined.
//   qwen3  Qwen3-TTS 1.7B, English only: designs a new voice from a description (VoiceDesign weights;
//          the whole take in one generation, because a designed voice changes between generations),
//          or clones a reference (Base weights).
// A new character in an Arabic video (description, no reference) gets an English reference designed by
// Qwen3-TTS first, which Audar then clones. A picked take can be cut into a reference (voice-ref) and kept
// in voices-library/ so the character sounds the same in every video.
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync, statSync, copyFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname, basename, relative } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { ROOT, findFfmpeg } from "./env.mjs";
import { parseEnv, requireWhisperConfig, modelFor } from "./whisper-config.mjs";
import { DIALOGUE_RATE, isSoundLabel, pcmWav } from "./dialogue.mjs";

const RATE = DIALOGUE_RATE;
/** Audar's inline expression tags (its model card). Use one or two per line at most. */
export const AUDAR_TAGS = ["laughs", "curious", "excited", "sighs", "exhales", "mischievously", "whispers", "sarcastic"];
export const ENGINES = {
  audar: { name: "Audar-TTS Turbo", env: "TTS_AUDAR_DIR", worker: "audar_worker.py", weights: ["weights"], options: ["seed", "temperature", "top_k", "top_p", "repeat_penalty"], defaults: {}, tags: AUDAR_TAGS, languages: ["en", "ar"], design: false, chunkChars: 240 },
  qwen3: { name: "Qwen3-TTS", env: "TTS_QWEN3_DIR", worker: "qwen3_worker.py", weights: ["weights", "weights-base"], options: ["seed", "temperature", "top_k", "top_p"], defaults: {}, tags: [], languages: ["en"], design: true, chunkChars: 400 },
};
/** The English sentence a designed reference speaks when Audar must clone a voice made from a description (about 10 s). */
export const DESIGN_TEXT = "Hello there, it is good to meet you. I have a story to tell today, so sit back, get comfortable, and listen closely, because every word of it matters.";
export const WORKERS = join(ROOT, "pipeline", "tts_workers");
/**
 * Seconds to rest between two generations. This laptop crashes when it runs more than one model at a
 * time or runs them back to back, so takes are made strictly one after another with a pause between
 * them (MODEL_SAFETY.md). TTS_COOLDOWN_SECONDS in .env can raise it; it never goes below 15.
 */
export const COOLDOWN_SECONDS = Math.max(15, Number(process.env.TTS_COOLDOWN_SECONDS) || 15);
const ALL_OPTIONS = [...new Set(Object.values(ENGINES).flatMap((e) => e.options))];
const DEFAULT_SEEDS = [11, 22, 33, 44, 55, 66, 77, 88];
/** Above this a designed take (one generation) may drift or fail to stop: warn and check it. */
export const LONG_TAKE_CHARS = 1400;
/** Character voices kept between videos: voices-library/<id>/reference_<lang>.wav + voice.json ("referenceText_<lang>"). */
export const LIBRARY = join(ROOT, "voices-library");

const readJson = (p) => JSON.parse(readFileSync(p, "utf8").replace(/^﻿/, ""));
const writeJson = (p, v) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 2) + "\n", "utf8"); };
const sha = (v) => createHash("sha256").update(v).digest("hex");
const ID = /^[a-z][a-z0-9_]*$/;
/** True when `p` is `folder` or inside it (no "..", no other drive). */
const isInside = (folder, p) => { const r = relative(resolve(folder), resolve(p)); return r === "" || (!r.startsWith("..") && !/^[a-z]:/i.test(r) && !r.startsWith("/") && !r.startsWith("\\")); };
/**
 * Voices never come from outside this pipeline: a reference or recording must be in the project
 * folder or in voices-library/. Returns an error message, or null when the path is allowed.
 */
export function outsideVoice(dir, p, library = LIBRARY) {
  const abs = resolve(dir, p);
  return isInside(dir, abs) || isInside(library, abs) ? null : `${p} is outside the project. Voices must come from this project or from voices-library/ — never from other folders (such as TTS_comparison)`;
}

/* ---------------- settings (.env) ---------------- */

/** Each engine's folder (TTS_AUDAR_DIR, TTS_QWEN3_DIR in .env) with its .venv and weights, and uv to run it. */
export function ttsSettings({ root = ROOT, env = process.env } = {}) {
  const f = join(root, ".env");
  const vars = existsSync(f) ? parseEnv(readFileSync(f, "utf8")).vars : {};
  const get = (k) => String(env[k] ?? vars[k] ?? "").trim();
  const errors = [], dirs = {}, engineErrors = {};
  const uv = get("TTS_UV") || "uv";
  if (spawnSync(uv, ["--version"], { encoding: "utf8", windowsHide: true }).status !== 0) errors.push(`uv is not found (${uv}). Install it, or set TTS_UV in .env to uv.exe.`);
  for (const [name, e] of Object.entries(ENGINES)) {
    const d = (dirs[name] = get(e.env)), problems = (engineErrors[name] = []);
    if (!d) { problems.push(`${e.env} is not set in .env (the ${e.name} folder). See .env.example.`); continue; }
    if (!existsSync(d)) { problems.push(`${e.env}: no folder at ${d}`); continue; }
    if (!existsSync(join(d, ".venv"))) problems.push(`${e.env}: ${d} has no .venv (its Python environment)`);
    for (const w of e.weights) if (!existsSync(join(d, w))) problems.push(`${e.env}: ${d} has no ${w}/ folder`);
  }
  return { uv, dirs, errors, engineErrors };
}

/** What is wrong with the settings for these engines (an empty list when they can run). */
export const settingsProblems = (settings, engines) => [...settings.errors, ...[...new Set(engines)].flatMap((e) => settings.engineErrors?.[e] ?? [])];

/* ---------------- the character voice library ---------------- */

/**
 * The languages a saved voice has a reference for: reference_<lang>.wav with "referenceText_<lang>"
 * in voice.json (an older voice may have one reference.wav with "referenceText" and "language").
 */
export function libraryLanguages(id, library = LIBRARY) {
  const folder = join(library, id), f = join(folder, "voice.json");
  if (!ID.test(id) || !existsSync(f)) return null;
  const json = readJson(f), refs = {};
  for (const file of readdirSync(folder)) {
    const m = file.match(/^reference_([a-z]{2,3})\.wav$/i);
    if (m) refs[m[1].toLowerCase()] = { reference: join(folder, file), referenceText: json[`referenceText_${m[1].toLowerCase()}`] };
  }
  if (existsSync(join(folder, "reference.wav"))) refs[json.language ?? "en"] ??= { reference: join(folder, "reference.wav"), referenceText: json.referenceText };
  return { json, refs };
}

/**
 * A saved character voice for one language, or null. The reference in that language is used; when
 * there is none, another language's (Audar speaks across languages), English first.
 */
export function libraryVoice(id, library = LIBRARY, language = "en") {
  const found = libraryLanguages(id, library);
  if (!found) return null;
  const { json, refs } = found;
  const lang = refs[language] ? language : refs.en ? "en" : Object.keys(refs)[0];
  if (!lang) return null;
  return { ...json, ...refs[lang], referenceLanguage: lang, crossLingual: lang !== language, file: basename(refs[lang].reference) };
}

/* ---------------- the voice plan (tts.json) ---------------- */

/** "Who: words" lines; # starts a comment. */
export function parseLines(text) {
  return text.replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l, i) => {
    const m = l.match(/^([^:：]{1,40})[:：]\s*(.+)$/);
    if (!m) throw new Error(`Script line ${i + 1} needs "Who: words": ${l}`);
    return { who: m[1].trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, ""), text: m[2].trim() };
  });
}

/** Words as whisper and the checks compare them: no tags, punctuation, case or Arabic letter variants. */
export const norm = (w) => w.toLowerCase().replace(/[ـ]/g, "").replace(/[^\p{L}\p{N}]/gu, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
export const wordsOf = (s) => String(s).replace(/\[[^\]]*\]/g, " ").replace(/<\/?[a-z_]+>/gi, " ").split(/\s+/).map(norm).filter(Boolean);
const tagsOf = (s) => [...String(s).matchAll(/\[([^\]]*)\]/g)].map((m) => m[1]);
const wrapsOf = (s) => [...String(s).matchAll(/<\/?([a-z_]+)>/gi)].map((m) => m[1]);
/** The engine of a resolved voice setup (readVoicePlan sets it): Qwen3-TTS designs, Audar clones. */
export const engineOf = (voice) => voice?.engine ?? (voice?.description && !voice?.reference ? "qwen3" : "audar");

export const planFile = (lang) => (lang ? `tts-${lang}.json` : "tts.json");

/**
 * Read and check tts.json (or tts-<lang>.json for a second language, which may leave out "voices"
 * to reuse the first language's). Every problem is listed at once.
 */
export function readVoicePlan(dir, lang, options = {}) {
  const file = planFile(lang), path = join(dir, file);
  if (!existsSync(path)) throw new Error(`No ${file} in ${dir}. Write it from the user's script (see TTS.md, "tts.json").`);
  let plan;
  try { plan = readJson(path); } catch (e) { throw new Error(`${file} is not valid JSON: ${e.message}`); }
  const errors = [], warnings = [];
  let lines = plan.lines;
  if (!lines && plan.script) {
    try { lines = parseLines(readFileSync(resolve(dir, plan.script), "utf8")); } catch (e) { errors.push(`${plan.script}: ${e.message}`); lines = []; }
  }
  if (!Array.isArray(lines) || !lines.length) errors.push(`${file}: "lines" must list the script, one entry per spoken line ({"who": "bob", "text": "..."}).`);
  let voices = plan.voices;
  if (!voices && lang && existsSync(join(dir, "tts.json"))) voices = readJson(join(dir, "tts.json")).voices;
  voices = { ...(voices ?? {}) };
  const language = plan.language ?? lang ?? "en";
  const used = new Set((lines ?? []).filter((l) => l?.text && !isSoundLabel(l.text) && !l.file).map((l) => l.who));
  /** Check one voice setup (the main one or an alternative); returns it resolved, or null. */
  const checkVoice = (who, v0, label) => {
    let v = v0;
    if (!v || typeof v !== "object" || Array.isArray(v)) { errors.push(`${label}: must be an object such as {"description": "..."}`); return null; }
    if (v.library !== undefined) {
      // a character voice saved by voice-ref --save: cloned, so the character is the same person in every video
      const lib = libraryVoice(String(v.library), options.library, language);
      if (!lib) { errors.push(`${label}: no voice "${v.library}" in voices-library/ (it needs reference_<language>.wav and voice.json; save one with: pnpm video voice-ref <project> ${who}=<take> --save ${v.library})`); return null; }
      if (v.reference || v.description) errors.push(`${label}: a "library" voice brings its own reference; leave out "reference" and "description"`);
      if (!String(lib.referenceText ?? "").trim()) errors.push(`${label}: voices-library/${v.library}/voice.json needs "referenceText_${lib.referenceLanguage}", the exact words spoken in ${lib.file}`);
      if (lib.crossLingual) warnings.push(`${who}: voices-library/${v.library} has no ${language} reference; its ${lib.referenceLanguage} one speaks ${language} (cross-lingual). Add reference_${language}.wav for a closer voice.`);
      v = { ...v, engine: v.engine ?? "audar", reference: lib.reference, referenceText: lib.referenceText, note: lib.description };
    }
    // the default engine: Audar clones (English and Arabic); a description is designed by Qwen3-TTS
    // (English), or, in another language, designed by Qwen3-TTS as an English reference that Audar clones
    if (!v.engine) v = { ...v, engine: v.description && !v.reference && language !== "en" ? "audar" : engineOf(v) };
    if (v.engine === "audar" && v.description && !v.reference) v = { ...v, designWith: "qwen3" };
    const engine = engineOf(v), E = ENGINES[engine];
    if (!E) { errors.push(`${label}: unknown engine "${engine}" (use ${Object.keys(ENGINES).join(" or ")})`); return null; }
    checkSetup(label, v, engine, E);
    return v;
  };
  const checkSetup = (who, v, engine, E) => {
    if (!E.languages.includes(language)) errors.push(`${who}: ${E.name} does not speak "${language}" (only ${E.languages.join(", ")}); use "engine": "audar" for this language`);
    if (v.reference) {
      const outside = outsideVoice(dir, v.reference, options.library);
      if (outside) errors.push(`${who}: reference ${outside}`);
      else if (!existsSync(resolve(dir, v.reference))) errors.push(`${who}: reference ${v.reference} is not in the project`);
      if (!v.referenceText?.trim()) errors.push(`${who}: a reference needs "referenceText", the exact words spoken in it`);
      if (v.description) errors.push(`${who}: give a description OR a reference, not both`);
    } else if (!v.description?.trim()) errors.push(`${who}: needs a "description" of the voice (identity, texture, delivery; see TTS.md) or a "reference"/"library" to clone`);
    if (v.style !== undefined) errors.push(`${who}: "style" was a CosyVoice3 setting and is gone; put the delivery in the description (Qwen3-TTS) or use Audar tags such as [excited] in "say"`);
    if (v.seeds && (!Array.isArray(v.seeds) || !v.seeds.every(Number.isInteger))) errors.push(`${who}: "seeds" must be whole numbers`);
    for (const k of Object.keys(v.options ?? {})) if (!E.options.includes(k)) errors.push(`${who}: unknown ${engine} option "${k}" (allowed: ${E.options.join(", ")})`);
    if (v.takes !== undefined && (!Number.isInteger(v.takes) || v.takes < 1 || v.takes > 8)) errors.push(`${who}: "takes" must be 1 to 8`);
  };
  for (const [who, v0] of Object.entries(voices)) {
    if (!used.has(who)) { warnings.push(`voice "${who}" speaks no line`); continue; }
    const v = checkVoice(who, v0, who);
    if (!v) continue;
    voices[who] = v;
    if (v.alternatives === undefined) continue;
    // more takes of the same character made another way (another engine, description or reference),
    // numbered after the main takes so the takes already made stay valid
    if (!Array.isArray(v.alternatives)) { errors.push(`${who}: "alternatives" must be a list of voice setups`); continue; }
    v.alternatives = v.alternatives.map((a0, k) => {
      const label = `${who} alternative ${k + 1}`;
      if (a0?.alternatives) errors.push(`${label}: an alternative cannot have its own "alternatives"`);
      const a = checkVoice(who, a0, label);
      for (const [n, say] of Object.entries(a?.say ?? {})) {
        const l = (lines ?? [])[Number(n) - 1];
        if (!l || l.who !== who) errors.push(`${label}: "say" line ${n} is not one of ${who}'s lines`);
        else if (wordsOf(say).join(" ") !== wordsOf(l.text).join(" ")) errors.push(`${label}: "say" line ${n} must keep the script's exact words.\n      text: ${l.text}\n      say:  ${say}`);
      }
      return a ?? {};
    });
  }
  (lines ?? []).forEach((l, i) => {
    const n = `line ${i + 1}`;
    if (typeof l?.who !== "string" || !ID.test(l.who)) errors.push(`${n}: "who" must be a lower-case id such as "bob" or "narrator"`);
    if (typeof l?.text !== "string" || !l.text.trim()) errors.push(`${n}: "text" must be the exact words of the script`);
    if (!l?.text) return;
    if (isSoundLabel(l.text)) { if (l.say) errors.push(`${n}: "${l.text}" is a sound, not speech; give it a recording with "file" instead of "say"`); return; }
    if (l.file) { // the user's own recording of this line
      const outside = outsideVoice(dir, l.file, options.library);
      if (outside) errors.push(`${n}: recording ${outside}`);
      return;
    }
    if (!voices[l.who]) { errors.push(`${n}: no voice for "${l.who}" in "voices"`); return; }
    if (l.say !== undefined && wordsOf(l.say).join(" ") !== wordsOf(l.text).join(" ")) errors.push(`${n}: "say" must keep the script's exact words; only add tags such as [sigh], change punctuation or change capitals.\n      text: ${l.text}\n      say:  ${l.say}`);
    // the main setup and each alternative speak the line, each with its own engine's rules
    const main = voices[l.who];
    [main, ...(Array.isArray(main.alternatives) ? main.alternatives : [])].forEach((v, k) => {
      const engine = engineOf(v), E = ENGINES[engine];
      if (!E) return;
      const own = k > 0 ? v.say?.[i + 1] : undefined, said = own ?? l.say, spoken = said ?? l.text;
      const m = k > 0 ? `${n} (${l.who} alternative ${k})` : n, fix = k > 0 ? `add "say": {"${i + 1}": "..."} to that alternative` : `add "say"`;
      if (said !== undefined && /[()]/.test(said)) errors.push(`${m}: no parentheses in "say": words in parentheses may be read aloud`);
      for (const t of tagsOf(spoken)) if (!E.tags.includes(t)) errors.push(E.tags.length ? `${m}: [${t}] is not a ${E.name} tag. Use one of: ${E.tags.map((x) => `[${x}]`).join(" ")}` : `${m}: ${E.name} has no inline tags such as [${t}]; put the delivery in the voice's description, or ${fix} without it`);
      for (const t of wrapsOf(spoken)) errors.push(`${m}: <${t}> is not understood by ${E.name}`);
      if (tagsOf(said ?? "").length > 2) warnings.push(`${m}: more than two tags in one line; the model card advises using them sparingly`);
    });
  });
  for (const [who, v] of Object.entries(voices)) {
    const total = (v.takes ?? plan.takes ?? 3) + (Array.isArray(v.alternatives) ? v.alternatives.reduce((s, a) => s + (a.takes ?? 1), 0) : 0);
    if (total > 8) errors.push(`${who}: ${total} takes in all; 8 is the most (main takes plus alternatives)`);
  }
  for (const k of Object.keys(plan.options ?? {})) if (!ALL_OPTIONS.includes(k)) errors.push(`options: unknown option "${k}" (allowed: ${ALL_OPTIONS.join(", ")})`);
  const takes = plan.takes ?? 3;
  if (!Number.isInteger(takes) || takes < 1 || takes > 8) errors.push(`"takes" must be 1 to 8`);
  if (errors.length) throw new Error(`${file} has problems:\n  - ${errors.join("\n  - ")}`);
  return { file, lang: lang ?? null, language, lines, voices, takes, options: plan.options ?? {}, cast: plan.cast, warnings };
}

/** The lines one character speaks in their take, in script order, with their script index. */
export function linesOf(plan, who) {
  return plan.lines.map((l, i) => ({ ...l, index: i })).filter((l) => l.who === who && !isSoundLabel(l.text) && !l.file);
}

/**
 * What one take sends to the model, as the chunks it is generated in. A designed take (Qwen3-TTS from a
 * description) is one generation, because a designed voice changes between generations. A clone is
 * made a few whole lines at a time (one Audar generation is at most ~36 s) and the chunks are joined.
 */
export function takeChunks(voice, lines) {
  const said = lines.map((l) => (l.say ?? l.text).trim());
  const engine = engineOf(voice), E = ENGINES[engine];
  if (engine === "qwen3" && !voice.reference) return [said.join("\n")];
  const chunks = [];
  for (const t of said) {
    const last = chunks.at(-1);
    if (last !== undefined && last.length + 1 + t.length <= E.chunkChars) chunks[chunks.length - 1] = `${last} ${t}`;
    else chunks.push(t);
  }
  return chunks;
}

/** All of one take's words (for the log, the key and the review page). */
export const takeText = (voice, lines) => takeChunks(voice, lines).join("\n");

/** Every take to make, with a key that changes when anything that shapes its sound changes. */
/**
 * The setups a character's takes are made with, in take order: the main voice (its `takes`, default
 * the plan's), then each alternative (1 take unless it says otherwise). Take numbers run on.
 */
export function voiceSetups(plan, who) {
  const main = plan.voices[who];
  if (!main) return [];
  let first = 1;
  return [{ voice: main, count: main.takes ?? plan.takes ?? 3 }, ...(main.alternatives ?? []).map((a) => ({ voice: a, count: a.takes ?? 1 }))]
    .map((s) => { const r = { ...s, first }; first += s.count; return r; });
}

/** The voice setup a take number was made with. */
export function setupOfTake(plan, who, take) {
  const s = voiceSetups(plan, who).find((x) => take >= x.first && take < x.first + x.count);
  return s?.voice ?? plan.voices[who];
}

export function takeRequests(plan, dir, { only } = {}) {
  return Object.entries(plan.voices).filter(([who]) => (!only || only.includes(who)) && linesOf(plan, who).length).flatMap(([who]) => voiceSetups(plan, who).flatMap(({ voice: v, count, first }) => {
    const lines = linesOf(plan, who).map((l) => (v.say?.[l.index + 1] !== undefined ? { ...l, say: v.say[l.index + 1] } : l));
    const chunks = takeChunks(v, lines), text = chunks.join("\n");
    const seeds = v.seeds ?? DEFAULT_SEEDS;
    const ref = v.reference ? sha(readFileSync(resolve(dir, v.reference))) : null;
    const engine = engineOf(v), E = ENGINES[engine];
    const mode = v.reference ? "clone" : v.designWith ? "design+clone" : "design";
    const shared = Object.fromEntries(Object.entries(plan.options ?? {}).filter(([k]) => E.options.includes(k)));
    return Array.from({ length: count }, (_, k) => {
      const seed = seeds[k] ?? seeds.at(-1) + 11 * (k - seeds.length + 1);
      const options = { ...E.defaults, ...shared, ...v.options, seed };
      // a voice designed for Audar to clone: one English reference per description and seed
      const design = v.designWith ? { engine: v.designWith, description: v.description, text: DESIGN_TEXT, seed, key: sha(JSON.stringify({ d: v.description, t: DESIGN_TEXT, seed })).slice(0, 12) } : null;
      const key = sha(JSON.stringify({ engine, mode, chunks, options, ref, refText: v.referenceText ?? null, description: v.description ?? null, language: plan.language })).slice(0, 16);
      return { who, take: first + k, seed, text, chunks, lines, voice: v, engine, mode, design, language: plan.language, options, key };
    });
  }));
}

/**
 * The command for one generation: the engine's worker (pipeline/tts_workers/) in the engine's own
 * Python environment, reading a job file. `reference` overrides the voice's (a designed reference).
 */
export function takeCommand(settings, dir, req, out, { reference, referenceText, cooldown = COOLDOWN_SECONDS } = {}) {
  const engine = req.engine ?? engineOf(req.voice), E = ENGINES[engine], v = req.voice;
  const ref = reference ?? (v.reference ? resolve(dir, v.reference) : null);
  const { seed, ...options } = req.options ?? {};
  const job = { modelDir: settings.dirs?.[engine], language: req.language ?? "en", chunks: req.chunks ?? [req.text], pause: 0.35, seed, options, cooldown, out };
  if (ref) Object.assign(job, { mode: "clone", reference: ref, referenceText: referenceText ?? v.referenceText });
  else Object.assign(job, { mode: "design", description: v.description });
  if (engine === "audar" && job.mode !== "clone") throw new Error(`${req.who}: Audar only clones; it needs a reference (a designed one is made first)`);
  const jobFile = out.replace(/\.wav$/i, "") + ".job.json";
  return { exe: settings.uv ?? "uv", args: ["run", "--no-sync", "--project", job.modelDir, "python", "-I", join(WORKERS, E.worker), jobFile], job, jobFile };
}

/* ---------------- running things ---------------- */

export function runProcess(bin, args, timeoutMs) {
  return new Promise((ok, fail) => {
    const p = spawn(bin, args, { shell: false, windowsHide: true });
    let log = "";
    const add = (b) => { log = (log + b.toString()).slice(-8000); };
    p.stdout.on("data", add); p.stderr.on("data", add);
    const timer = setTimeout(() => { p.kill(); fail(new Error(`${basename(bin)} took longer than ${Math.round(timeoutMs / 1000)} s and was stopped`)); }, timeoutMs);
    p.on("error", (e) => { clearTimeout(timer); fail(e); });
    p.on("close", (code) => { clearTimeout(timer); code === 0 ? ok(log) : fail(new Error(`${basename(bin)} exited with code ${code}:\n${log.slice(-2000)}`)); });
  });
}

/** Mono 16-bit PCM at the pipeline's rate: read directly when it already is, otherwise via FFmpeg. */
export function readPcm(file) {
  const b = readFileSync(file);
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WAVE") {
    let p = 12, fmt = null;
    while (p + 8 <= b.length) {
      const id = b.toString("ascii", p, p + 4), size = b.readUInt32LE(p + 4);
      if (id === "fmt ") fmt = { format: b.readUInt16LE(p + 8), channels: b.readUInt16LE(p + 10), rate: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
      if (id === "data" && fmt?.format === 1 && fmt.channels === 1 && fmt.rate === RATE && fmt.bits === 16) {
        const d = b.subarray(p + 8, p + 8 + size);
        return new Int16Array(d.buffer.slice(d.byteOffset, d.byteOffset + (d.length & ~1)));
      }
      p += 8 + size + (size & 1);
    }
  }
  const ff = findFfmpeg();
  if (!ff) throw new Error("FFmpeg is needed to read " + file);
  const r = spawnSync(ff, ["-v", "error", "-i", file, "-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1", "-ar", String(RATE), "-"], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`Cannot decode ${file}: ${r.stderr?.toString()}`);
  return new Int16Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + (r.stdout.length & ~1)));
}

/** Word times from whisper.cpp, as the plan step gets them. */
export function transcribe(wav, language) {
  let cfg;
  try { cfg = requireWhisperConfig(); } catch (e) { console.log("⚠ " + e.message.split("\n")[0]); return null; }
  const model = modelFor(cfg, language);
  if (!cfg.enabled || !cfg.bin || !model) return null;
  const ff = findFfmpeg();
  const tmp = wav.replace(/\.wav$/i, "") + ".whisper";
  spawnSync(ff, ["-y", "-v", "error", "-i", wav, "-ar", "16000", "-ac", "1", tmp + ".16k.wav"]);
  const r = spawnSync(cfg.bin, ["-m", model, "-f", tmp + ".16k.wav", "-l", language, "-ml", "1", "-sow", "-oj", "-of", tmp, "-np"], { encoding: "utf8", maxBuffer: 1 << 26 });
  try {
    if (r.status !== 0 || !existsSync(tmp + ".json")) return null;
    const j = JSON.parse(readFileSync(tmp + ".json", "utf8"));
    return (j.transcription ?? []).map((x) => ({ w: x.text.trim(), s: x.offsets.from / 1000, e: x.offsets.to / 1000 })).filter((x) => norm(x.w));
  } finally { rmSync(tmp + ".16k.wav", { force: true }); rmSync(tmp + ".json", { force: true }); }
}

/** The words of several short files in one whisper.cpp run (the model loads once). null when off. */
export function hearMany(files, language) {
  let cfg;
  try { cfg = requireWhisperConfig(); } catch { return null; }
  const model = modelFor(cfg, language), ff = findFfmpeg();
  if (!cfg.enabled || !cfg.bin || !model || !files.length) return null;
  const small = files.map((f) => { const s = f.replace(/\.wav$/i, ".16k.wav"); spawnSync(ff, ["-y", "-v", "error", "-i", f, "-ar", "16000", "-ac", "1", s]); return s; });
  const r = spawnSync(cfg.bin, ["-m", model, "-l", language, "-oj", "-np", ...small.flatMap((s) => ["-f", s])], { encoding: "utf8", maxBuffer: 1 << 26 });
  try {
    if (r.status !== 0) return null;
    return small.map((s) => { const j = existsSync(s + ".json") ? JSON.parse(readFileSync(s + ".json", "utf8")) : null; return j ? j.transcription.map((x) => x.text).join(" ").trim() : null; });
  } finally { for (const s of small) { rmSync(s, { force: true }); rmSync(s + ".json", { force: true }); } }
}

/* ---------------- checking and cutting a take ---------------- */

/**
 * Match the words heard in a take to the script's lines (longest common subsequence). For each line:
 * the first and last heard word, how many script words were heard, and extra words heard inside it.
 */
export function alignLines(lines, heard) {
  const exp = lines.flatMap((l, li) => wordsOf(l.text).map((w) => ({ w, li })));
  const H = heard.map((h) => norm(h.w));
  const n = exp.length, m = H.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = exp[i].w === H[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = lines.map((l) => ({ words: wordsOf(l.text).length, heard: 0, missing: [], extra: 0, first: null, last: null, hits: [] }));
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (exp[i].w === H[j]) { const o = out[exp[i].li]; o.heard++; o.hits.push(j); o.first ??= heard[j]; o.last = heard[j]; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out[exp[i].li].missing.push(exp[i].w); i++; }
    else j++;
  }
  for (; i < n; i++) out[exp[i].li].missing.push(exp[i].w);
  for (const o of out) { if (o.hits.length > 1) o.extra = o.hits.at(-1) - o.hits[0] + 1 - o.hits.length; delete o.hits; }
  return out;
}

const FRAME = 0.01;
/** Loudness of every 10 ms frame, in dB. */
export function frameDb(pcm) {
  const step = Math.round(RATE * FRAME), out = new Float32Array(Math.ceil(pcm.length / step));
  for (let f = 0; f < out.length; f++) {
    let sum = 0, k = 0;
    for (let i = f * step; i < Math.min(pcm.length, (f + 1) * step); i++, k++) sum += pcm[i] * pcm[i];
    out[f] = 10 * Math.log10(sum / Math.max(1, k) / (32768 * 32768) + 1e-12);
  }
  return out;
}
const speechLevel = (db) => { const s = [...db].sort((a, b) => a - b); return s[Math.floor(s.length * 0.9)] ?? -20; };

/**
 * The pause most likely to be the one between two lines: long, and close to where whisper says the
 * next line starts. Whisper's word times are often a few tenths late, so the longest pause in the
 * window alone can be one inside the next line ("gold! | Spiders, | run!").
 */
function lineGap(db, from, to, quiet, expected) {
  let best = null, run = null;
  const a = Math.max(0, Math.floor(from / FRAME)), b = Math.min(db.length, Math.ceil(to / FRAME));
  for (let f = a; f <= b; f++) {
    if (f < b && db[f] < quiet) run ??= f;
    else if (run !== null) {
      const start = run * FRAME, end = f * FRAME, score = end - start - 0.4 * Math.abs((start + end) / 2 - expected);
      if (end - start >= 0.04 && (!best || score > best.score)) best = { start, end, score };
      run = null;
    }
  }
  return best;
}

/**
 * Where each line of a take starts and ends. A cut goes in the middle of the longest quiet stretch
 * between one line's last word and the next line's first, then each line is trimmed to its speech.
 */
export function splitTake(pcm, lines, heard) {
  const duration = pcm.length / RATE, db = frameDb(pcm), level = speechLevel(db);
  const quiet = level - 30, voiced = level - 35;
  const check = alignLines(lines, heard);
  const problems = [];
  // known times per line, filled in from the neighbours when whisper heard none of its words
  const anchors = check.map((c) => c.first && { s: c.first.s, e: c.last.e, ls: c.last.s, fe: c.first.e });
  const cuts = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    let from, to, fallback, expected;
    if (a && b) { from = Math.min(a.ls, b.s); to = Math.max(b.fe, a.e); fallback = (a.e + b.s) / 2; expected = b.s; }
    else {
      const prev = anchors.slice(0, i + 1).reverse().find(Boolean), next = anchors.slice(i + 1).find(Boolean);
      const lo = prev?.e ?? 0, hi = next?.s ?? duration;
      const before = lines.slice(prev ? anchors.lastIndexOf(prev) + 1 : 0, i + 1), after = lines.slice(i + 1, next ? anchors.indexOf(next) : lines.length);
      const len = (ls) => ls.reduce((n, l) => n + l.text.length, 0);
      fallback = lo + ((hi - lo) * len(before)) / Math.max(1, len(before) + len(after));
      from = fallback - 0.6; to = fallback + 0.6; expected = fallback;
    }
    const lo = cuts.at(-1) ?? 0;
    const gap = lineGap(db, Math.max(lo, from), Math.min(duration, to), quiet, expected);
    if (!gap) problems.push({ lines: [i, i + 1], text: `no pause found between its lines ${i + 1} and ${i + 2}; cut where the words change` });
    cuts.push(Math.max(lo, gap ? (gap.start + gap.end) / 2 : fallback));
  }
  const bounds = [0, ...cuts, duration];
  const clips = lines.map((l, i) => {
    let s = Math.floor(bounds[i] / FRAME), e = Math.min(db.length, Math.ceil(bounds[i + 1] / FRAME));
    while (s < e && db[s] < voiced) s++;
    while (e > s && db[e - 1] < voiced) e--;
    return { start: Math.max(bounds[i], s * FRAME - 0.05), end: Math.min(bounds[i + 1], e * FRAME + 0.15) };
  });
  return { clips, check, problems };
}

/** One line of a take as its own clip, with 8 ms fades so the cuts never click. */
export function clipPcm(pcm, { start, end }) {
  const a = Math.round(start * RATE), b = Math.round(end * RATE), out = Int16Array.from(pcm.subarray(a, b));
  const f = Math.min(Math.round(0.008 * RATE), out.length >> 1);
  for (let i = 0; i < f; i++) { out[i] = Math.round(out[i] * (i / f)); out[out.length - 1 - i] = Math.round(out[out.length - 1 - i] * (i / f)); }
  return Buffer.from(out.buffer);
}

/** What the review shows about a take: lines with words not heard, or extra words. */
export function takeCheck(lines, heard) {
  if (!heard) return { checked: false, summary: "not checked (whisper.cpp is off in .env)", problems: [] };
  const problems = alignLines(lines, heard).flatMap((c, i) => {
    const p = [];
    if (!c.heard) p.push(`line ${i + 1} not heard: "${lines[i].text}"`);
    else if (c.missing.length) p.push(`line ${i + 1} missing: ${c.missing.join(" ")}`);
    if (c.extra > 0) p.push(`line ${i + 1}: ${c.extra} extra word(s) heard`);
    return p;
  });
  return { checked: true, summary: problems.length ? `${problems.length} line(s) to listen to` : `all ${lines.length} line(s) heard`, problems };
}

/* ---------------- takes ---------------- */

export const takesDir = (dir, plan) => join(dir, "voice-takes", plan.lang ?? plan.language);

/**
 * Make every take that is missing or out of date (a changed description, text or seed). An older
 * take that is replaced is moved into old/ rather than deleted, in case the user liked it.
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function makeTakes(dir, { lang, only, dryRun = false, run = runProcess, hear = transcribe, settings = ttsSettings(), log = console.log, library, cooldown = run === runProcess ? COOLDOWN_SECONDS : 0 } = {}) {
  const plan = readVoicePlan(dir, lang, { library });
  plan.warnings.forEach((w) => log("⚠ " + w));
  const reqs = takeRequests(plan, dir, { only });
  if (!reqs.length) throw new Error(only ? `No voice named ${only.join(", ")} in ${plan.file}` : `No line in ${plan.file} needs a voice`);
  for (const r of reqs.filter((x) => x.mode === "design" && x.take === 1)) {
    if (r.text.length > LONG_TAKE_CHARS) log(`⚠ ${r.who}'s designed take is ${r.text.length} characters (about ${Math.round(r.text.length / 15)} s) in one generation. Long takes can drift near the end: listen to the last lines.`);
  }
  const base = takesDir(dir, plan);
  if (dryRun) return { plan, takes: reqs.map(({ who, take, seed, key, engine }) => ({ who, take, seed, key, engine, file: join(base, who, `take-${take}.wav`) })) };
  const bad = settingsProblems(settings, reqs.map((r) => r.engine));
  if (bad.length) throw new Error(`The voice settings in .env need fixing:\n  - ${bad.join("\n  - ")}`);
  const takes = [];
  let generated = false; // one generation at a time: never start a take while another model runs
  for (const r of reqs) {
    const folder = join(base, r.who), wav = join(folder, `take-${r.take}.wav`), info = join(folder, `take-${r.take}.json`);
    mkdirSync(folder, { recursive: true });
    const old = existsSync(info) ? readJson(info) : null;
    let entry = old?.key === r.key && existsSync(wav) ? old : null;
    if (!entry) {
      if (existsSync(wav)) {
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        mkdirSync(join(folder, "old"), { recursive: true });
        renameSync(wav, join(folder, "old", `${stamp}-take-${r.take}.wav`));
        if (existsSync(info)) renameSync(info, join(folder, "old", `${stamp}-take-${r.take}.json`));
      }
      const rest = async () => { if (generated && cooldown > 0) { log(`  resting ${cooldown} s before the next generation…`); await sleep(cooldown * 1000); } generated = true; };
      /** One worker run; returns an error message, or null when the audio was written. */
      const generate = async (req, out, extra = {}) => {
        rmSync(out, { force: true });
        const cmd = takeCommand(settings, dir, req, out, { cooldown: Math.max(cooldown, 0), ...extra });
        writeJson(cmd.jobFile, cmd.job);
        const chars = (req.chunks ?? [req.text]).join(" ").length;
        try { await run(cmd.exe, cmd.args, Math.max(600, chars * 2 + (req.chunks?.length ?? 1) * (cooldown + 60)) * 1000); }
        catch (e) { return e.message; }
        finally { rmSync(cmd.jobFile, { force: true }); }
        return existsSync(out) && statSync(out).size > 1000 ? null : "no audio was written";
      };
      const t0 = Date.now();
      let designed = null;
      if (r.design) {
        // a voice from a description for Audar: Qwen3-TTS designs an English reference first, kept per description + seed
        designed = join(folder, `design-${r.design.key}.wav`);
        if (!existsSync(designed)) {
          await rest();
          log(`Designing ${r.who}'s voice for take ${r.take} (qwen3, seed ${r.seed})…`);
          const fail = await generate({ who: r.who, engine: r.design.engine, voice: { description: r.design.description }, chunks: [r.design.text], language: "en", options: { seed: r.design.seed } }, designed);
          if (fail) { takes.push({ who: r.who, take: r.take, seed: r.seed, failed: `designing the voice: ${fail}` }); log(`  failed: ${fail.split("\n")[0]}`); continue; }
        }
      }
      await rest();
      log(`Generating ${r.who}, take ${r.take} (${r.engine}, seed ${r.seed}, ${r.lines.length} line${r.lines.length > 1 ? "s" : ""} in ${r.chunks.length} part${r.chunks.length > 1 ? "s" : ""})…`);
      const pending = wav.replace(/\.wav$/, ".pending.wav");
      const fail = await generate(r, pending, designed ? { reference: designed, referenceText: r.design.text } : {});
      if (fail) { takes.push({ who: r.who, take: r.take, seed: r.seed, failed: fail }); log(`  failed: ${fail.split("\n")[0]}`); continue; }
      renameSync(pending, wav);
      entry = { who: r.who, take: r.take, engine: r.engine, mode: r.mode, seed: r.seed, key: r.key, text: r.text, lines: r.lines.map((l) => ({ index: l.index, text: l.text })), ...(designed && { designedReference: basename(designed) }), seconds: Math.round((Date.now() - t0) / 100) / 10 };
    }
    const audio = sha(readFileSync(wav));
    if (entry.audio !== audio || entry.heard == null) {
      entry.audio = audio;
      entry.duration = readPcm(wav).length / RATE;
      log(`  checking the words of ${r.who} take ${r.take}…`);
      entry.heard = hear(wav, plan.language);
      entry.check = takeCheck(r.lines, entry.heard);
      writeJson(info, entry);
    }
    takes.push({ ...entry, file: wav });
  }
  const review = writeReview(dir, plan, base);
  return { plan, takes, review };
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** One line for the review page: which engine and which voice made a take. */
function howMade(v) {
  const engine = engineOf(v);
  return v.library ? `${engine} clone of the library voice “${esc(v.library)}”${v.note ? ` (${esc(v.note)})` : ""}` : v.reference ? `${engine} clone of ${esc(v.reference)}` : v.designWith ? `${engine} clone of a voice ${esc(v.designWith)} designed from: ${esc(v.description)}` : `${engine}: ${esc(v.description)}`;
}

/** review.html: every character's takes side by side, with what the word check found. */
export function writeReview(dir, plan, base = takesDir(dir, plan)) {
  const sections = Object.entries(plan.voices).filter(([who]) => linesOf(plan, who).length).map(([who, v]) => {
    const takes = [];
    for (let k = 1; k <= 8; k++) { const f = join(base, who, `take-${k}.json`); if (existsSync(f) && existsSync(join(base, who, `take-${k}.wav`))) takes.push(readJson(f)); }
    const rows = takes.map((t) => {
      const words = linesOf(plan, who).reduce((n, l) => n + wordsOf(l.text).length, 0);
      const pace = t.duration ? ` · ${(words / t.duration).toFixed(1)} words/s` : "";
      const issues = t.check?.problems?.length ? `<ul>${t.check.problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : "";
      return `<div class="take"><b>Take ${t.take}</b> <span>seed ${t.seed} · ${t.duration?.toFixed(1) ?? "?"} s${pace} · ${esc(t.check?.summary ?? "")}</span><audio controls preload="none" src="${esc(`${who}/take-${t.take}.wav`)}"></audio>${issues}</div>`;
    }).join("");
    const setups = voiceSetups(plan, who);
    const how = setups.length < 2 ? howMade(v) : setups.map((s) => `Take${s.count > 1 ? `s ${s.first}–${s.first + s.count - 1}` : ` ${s.first}`}: ${howMade(s.voice)}`).join("<br>");
    const lines = linesOf(plan, who).map((l) => `<li value="${l.index + 1}" dir="auto">${esc(l.say ?? l.text)}</li>`).join("");
    return `<section><h2>${esc(who)}</h2><p class="d">${how}</p>${rows || "<p>No takes yet.</p>"}<details><summary>${linesOf(plan, who).length} line(s)</summary><ol>${lines}</ol></details></section>`;
  }).join("");
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Voice takes</title>
<style>body{font:16px/1.45 system-ui,sans-serif;max-width:860px;margin:0 auto;padding:16px;background:#fbfaf7;color:#222}section{background:#fff;border:1px solid #ddd;border-radius:10px;padding:12px 16px;margin:16px 0}h2{margin:.2em 0;text-transform:capitalize}.d{color:#555;font-style:italic}.take{border-top:1px solid #eee;padding:10px 0}.take span{color:#666;font-size:14px}audio{display:block;width:100%;margin-top:6px}ul{color:#a33;font-size:14px;margin:.3em 0}li[dir]{margin:.2em 0}</style>
<h1>Voice takes${plan.lang ? ` (${esc(plan.lang)})` : ""}</h1><p>Each take speaks all of a character's lines, so the voice stays the same person. Listen, then tell the director one take number per character.</p>${sections}`;
  const file = join(base, "review.html");
  mkdirSync(base, { recursive: true });
  writeFileSync(file, html, "utf8");
  return file;
}

/* ---------------- picking ---------------- */

const recordFile = (base) => join(base, "picked.json");
const own = (dir, base, rel) => {
  const p = join(dir, rel);
  if (!existsSync(p)) return true;
  const rec = existsSync(recordFile(base)) ? readJson(recordFile(base)) : null;
  return rec?.files?.[rel] === sha(readFileSync(p));
};

/**
 * Cut the chosen takes into lines and write them as the project's recordings. Files this step did
 * not write (the user's own recordings or edits) are never overwritten without `replace`.
 */
export function pickTakes(dir, picks, { lang, replace = false, forceDialogue = false, hear = hearMany, library } = {}) {
  const plan = readVoicePlan(dir, lang, { library });
  const base = takesDir(dir, plan), suffix = plan.lang ? `-${plan.lang}` : "";
  const speakers = [...new Set(plan.lines.filter((l) => !isSoundLabel(l.text) && !l.file).map((l) => l.who))];
  const missing = speakers.filter((w) => !picks[w]);
  if (missing.length) throw new Error(`Pick a take for: ${missing.join(", ")} (for example ${missing.map((w) => `${w}=1`).join(" ")})`);
  for (const w of Object.keys(picks)) if (!speakers.includes(w)) throw new Error(`"${w}" has no lines to voice in ${plan.file}`);
  const current = Object.fromEntries(takeRequests(plan, dir).map((r) => [`${r.who}/${r.take}`, r.key]));
  const cut = {}, problems = [], unsure = [];
  for (const who of speakers) {
    const n = picks[who], info = join(base, who, `take-${n}.json`), wav = join(base, who, `take-${n}.wav`);
    if (!existsSync(info) || !existsSync(wav)) throw new Error(`${who} has no take ${n}. Run: pnpm video voices ${basename(dir)}${plan.lang ? ` --lang ${plan.lang}` : ""}`);
    const t = readJson(info);
    if (current[`${who}/${n}`] !== t.key) throw new Error(`${who} take ${n} was made from an older ${plan.file} (the text, description or seed changed). Run voices again and listen before picking.`);
    if (!t.heard) throw new Error(`Cutting a take into lines needs whisper.cpp word times. Turn it on in .env (WHISPER_PATH and a model for "${plan.language}"), then run voices again.`);
    const pcm = readPcm(wav), lines = linesOf(plan, who);
    const s = splitTake(pcm, lines, t.heard);
    s.problems.forEach((p) => unsure.push({ lines: p.lines.map((k) => lines[k].index), text: `${who}: ${p.text}` }));
    lines.forEach((l, k) => { cut[l.index] = { pcm, span: s.clips[k], who, take: n }; });
  }
  const written = {};
  const write = (rel, data) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), data);
    written[rel] = sha(Buffer.isBuffer(data) ? data : Buffer.from(data));
  };
  const single = speakers.length === 1 && plan.lines.every((l) => !isSoundLabel(l.text) && !l.file) && !forceDialogue;
  const pending = [];
  // everything is checked before anything is written, so a refusal leaves the project as it was
  const stage = (rel, data, trusted = false) => { if (!replace && !trusted && !own(dir, base, rel)) throw new Error(`${rel} exists and was not written by voice-pick (it may be the user's own recording or edit). Nothing was changed. Use --replace to overwrite it.`); pending.push([rel, data]); };
  let result;
  if (single) {
    // one voice speaks everything: keep the take whole, so its natural pauses stay as they are
    const who = speakers[0], take = cut[0];
    const rows = plan.lines.map((l, i) => `${cut[i].span.start.toFixed(2)} | ${cut[i].span.end.toFixed(2)} | ${l.text}`);
    stage(`voice${suffix}.wav`, pcmWav(Buffer.from(take.pcm.buffer, take.pcm.byteOffset, take.pcm.byteLength), RATE));
    stage(`script${suffix}.txt`, `# Cut from ${who} take ${take.take} by voice-pick (see TTS.md). start | end | words\n${rows.join("\n")}\n`);
    result = { mode: "narration", voice: `voice${suffix}.wav`, script: `script${suffix}.txt` };
  } else {
    const file = `dialogue${suffix}.json`, folder = `voices${suffix}`;
    let previous = null, extends_ = false;
    if (existsSync(join(dir, file))) {
      previous = readJson(join(dir, file));
      // a hand-made dialogue (the user's recordings) may get new voices added, when tts.json keeps
      // every one of its recordings as a "file" line, in the same order: nothing of theirs is lost
      extends_ = !previous.voicesFrom && keepsRecordings(previous, plan);
      if (!previous.voicesFrom && !extends_ && !replace) throw new Error(`${file} exists and was not made by voice-pick (it may list the user's own recordings). Nothing was changed. To add voices to it, list each of its clips in ${plan.file} in order with its "file" (TTS.md, "Adding a voice to a story"), or use --replace to overwrite it.`);
      if (extends_) pending.push([`voice-takes/${plan.lang ?? plan.language}/${file.replace(/\.json$/, "")}.before.json`, readFileSync(join(dir, file))]);
    }
    const width = String(plan.lines.length).length < 2 ? 2 : String(plan.lines.length).length;
    const match = matchClips(previous?.clips ?? [], plan.lines);
    const clips = plan.lines.map((l, i) => {
      const old = match[i] ?? {};
      const keep = Object.fromEntries(["gap", "gainDb", "start"].filter((k) => old[k] !== undefined).map((k) => [k, old[k]]));
      if (l.file) return { who: l.who, file: l.file, text: l.text, ...keep };
      if (isSoundLabel(l.text)) return { who: l.who, file: `${folder}/${String(i + 1).padStart(width, "0")}-${l.who}.wav`, text: l.text, ...keep };
      const rel = `${folder}/${String(i + 1).padStart(width, "0")}-${l.who}.wav`;
      stage(rel, pcmWav(clipPcm(cut[i].pcm, cut[i].span), RATE));
      // a character's lines that followed each other in the take keep their natural pause
      const prev = plan.lines[i - 1];
      if (keep.gap === undefined && prev && prev.who === l.who && cut[i - 1]) keep.gap = Math.round(Math.min(0.8, Math.max(0.15, cut[i].span.start - cut[i - 1].span.end)) * 100) / 100;
      return { who: l.who, file: rel, text: l.text, ...keep };
    });
    const manifest = { voicesFrom: `${plan.file} (${speakers.map((w) => `${w} take ${picks[w]}`).join(", ")})`, cast: previous?.cast ?? plan.cast ?? {}, clips };
    stage(file, JSON.stringify(manifest, null, 2) + "\n", !!previous?.voicesFrom || extends_); // its cast may have been edited since
    const sounds = clips.filter((c) => isSoundLabel(c.text) && !existsSync(join(dir, c.file))).map((c) => c.file);
    result = { mode: "dialogue", dialogue: file, clips: clips.length, sounds };
  }
  // Listen to every cut line on its own. A cut in the wrong pause moves a word into the neighbouring
  // line of the same take ("…full of gold! Spiders!"). Other differences are whisper mishearing a short
  // clip out of context (common in Arabic), and the take's own check already reported real ones.
  const order = Object.keys(cut).map(Number).sort((a, b) => a - b);
  const tmp = join(base, "check");
  mkdirSync(tmp, { recursive: true });
  const files = order.map((i) => { const f = join(tmp, `${String(i + 1).padStart(3, "0")}.wav`); writeFileSync(f, pcmWav(clipPcm(cut[i].pcm, cut[i].span), RATE)); return f; });
  let heardLines;
  try { heardLines = hear(files, plan.language); } finally { rmSync(tmp, { recursive: true, force: true }); }
  const failed = new Set();
  const neighbours = Object.fromEntries(speakers.flatMap((who) => { const ls = linesOf(plan, who); return ls.map((l, k) => [l.index, [ls[k - 1], ls[k + 1]]]); }));
  order.forEach((i, k) => {
    if (typeof heardLines?.[k] !== "string") return;
    const own = new Set(wordsOf(plan.lines[i].text)), got = wordsOf(heardLines[k]);
    const [prev, next] = neighbours[i];
    const head = got.slice(0, 2).find((w) => !own.has(w) && prev && wordsOf(prev.text).slice(-2).includes(w));
    const tail = got.slice(-2).find((w) => !own.has(w) && next && wordsOf(next.text).slice(0, 2).includes(w));
    if (head || tail) {
      failed.add(i);
      problems.push(`line ${i + 1} (${plan.lines[i].who}) sounds like "${heardLines[k]}": it has "${head ?? tail}" from line ${(head ? prev : next).index + 1}, so a cut is in the wrong place. Listen to both lines.`);
    }
  });
  const verified = !!heardLines;
  // a cut without a clear pause only matters when one of its lines did not come out right
  for (const u of unsure) if (!verified || u.lines.some((i) => failed.has(i))) problems.push(u.text);
  for (const [rel, data] of pending) write(rel, data);
  const rec = existsSync(recordFile(base)) ? readJson(recordFile(base)) : { files: {} };
  writeJson(recordFile(base), { picks, at: new Date().toISOString(), files: { ...rec.files, ...written } });
  return { ...result, problems, picks, verified };
}

/** Does the plan keep every clip of this dialogue as a "file" line with the same words, in order? */
export function keepsRecordings(dialogue, plan) {
  const files = plan.lines.filter((l) => l.file);
  let k = 0;
  for (const c of dialogue.clips ?? []) {
    while (k < files.length && files[k].file !== c.file) k++;
    if (k >= files.length || files[k].text !== c.text || files[k].who !== c.who) return false;
    k++;
  }
  return true;
}

/** The earlier clip of each line (same who and words, in order), so its gap, gainDb and start are kept. */
function matchClips(old, lines) {
  let k = 0;
  return lines.map((l) => {
    for (let j = k; j < old.length; j++) if (old[j].who === l.who && old[j].text === l.text && (!l.file || old[j].file === l.file)) { k = j + 1; return old[j]; }
    return null;
  });
}

/* ---------------- references and the character library ---------------- */

/**
 * Cut a clean reference (about 5–12 s of whole lines) from one take, for cloning: refs/<who>.wav and
 * refs/<who>.json with the exact words. With `save`, it also goes into voices-library/<save>/, so
 * later videos can use { "library": "<save>" } and the character keeps the same voice.
 * Lines whose words were heard right and that have no tags are preferred.
 */
export function makeReference(dir, who, take, { lang, save, library = LIBRARY, overwrite = false } = {}) {
  const plan = readVoicePlan(dir, lang, { library });
  const base = takesDir(dir, plan), info = join(base, who, `take-${take}.json`), wav = join(base, who, `take-${take}.wav`);
  if (!existsSync(info) || !existsSync(wav)) throw new Error(`${who} has no take ${take}`);
  const t = readJson(info);
  if (!t.heard) throw new Error("Cutting a reference needs whisper.cpp word times (turn it on in .env and run voices again).");
  const lines = linesOf(plan, who), pcm = readPcm(wav), { clips, check } = splitTake(pcm, lines, t.heard);
  const good = lines.map((l, k) => !check[k].missing.length && !check[k].extra && !tagsOf(l.say ?? l.text).length && !wrapsOf(l.say ?? "").length);
  let best = null;
  for (let a = 0; a < lines.length; a++) for (let b = a; b < lines.length; b++) {
    const len = clips[b].end - clips[a].start;
    if (len > 14) break;
    const clean = good.slice(a, b + 1).every(Boolean);
    // about 9 s is best (5–15 s works); a too-short reference is worse than one with a tag in it
    const score = -Math.abs(len - 9) + (clean ? 10 : 0) - (len < 5 ? (5 - len) * 10 : 0);
    if (!best || score > best.score) best = { a, b, len, clean, score };
  }
  const span = { start: clips[best.a].start, end: clips[best.b].end };
  const text = lines.slice(best.a, best.b + 1).map((l) => l.text.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim()).join(" ");
  const audio = pcmWav(clipPcm(pcm, span), RATE);
  const v = setupOfTake(plan, who, take);
  const meta ={ who, referenceText: text, language: plan.language, seconds: +(span.end - span.start).toFixed(2), from: `${engineOf(v)} ${who} take ${take}${v.description ? "" : " (a clone)"}`, description: v.description ?? v.note ?? null };
  const rel = `refs/${who}.wav`;
  mkdirSync(join(dir, "refs"), { recursive: true });
  writeFileSync(join(dir, rel), audio);
  writeJson(join(dir, `refs/${who}.json`), { reference: rel, ...meta });
  let saved = null;
  if (save) {
    if (!ID.test(save)) throw new Error(`--save needs a lower-case id such as "ali" (got "${save}")`);
    // one reference per language: reference_<lang>.wav + "referenceText_<lang>"; other languages stay
    const folder = join(library, save), lang = plan.language, wavName = `reference_${lang}.wav`, f = join(folder, "voice.json");
    if (libraryLanguages(save, library)?.refs[lang] && !overwrite) throw new Error(`voices-library/${save} already has a ${lang} voice. It is the voice other videos use for "${save}"; pick another name, or add --overwrite only if the user agrees to replace it.`);
    mkdirSync(folder, { recursive: true });
    copyFileSync(join(dir, rel), join(folder, wavName));
    const old = existsSync(f) ? readJson(f) : {};
    writeJson(f, { id: save, ...old, [`referenceText_${lang}`]: text, description: old.description ?? meta.description, [`from_${lang}`]: `${meta.from}, project ${basename(dir)}, ${new Date().toISOString()}` });
    saved = relative(ROOT, folder).replace(/\\/g, "/");
  }
  return { reference: rel, referenceText: text, seconds: meta.seconds, clean: best.clean, lines: lines.slice(best.a, best.b + 1).map((l) => l.index + 1), saved };
}

/** "bob=2 narrator=1" → { bob: 2, narrator: 1 } */
export function parsePicks(args) {
  const picks = {};
  for (const a of args.flatMap((x) => String(x).split(","))) {
    const m = a.trim().match(/^([a-z][a-z0-9_]*)\s*=\s*(\d+)$/);
    if (!m) throw new Error(`Write picks as who=take, for example bob=2 narrator=1 (got "${a}")`);
    picks[m[1]] = Number(m[2]);
  }
  return picks;
}
