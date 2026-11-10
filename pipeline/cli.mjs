#!/usr/bin/env node
// Story video pipeline — voice-led cartoon explainers in the style of the reference videos.
//
//   node pipeline/cli.mjs new <name>                 create projects/<name> with templates
//   node pipeline/cli.mjs make <name> [options]      plan (if needed) + audio + render
//   node pipeline/cli.mjs plan <name> [--replan]     analyse voice, write storyboard.json
//   node pipeline/cli.mjs audio <name>               music (pretty_midi + Tone.js) + SFX + mix (pedalboard)
//   node pipeline/cli.mjs render <name> [options]    render MP4(s) with Remotion
//   node pipeline/cli.mjs stills <name>              one still per scene -> out/stills (quick review)
//   node pipeline/cli.mjs studio <name> [--format shorts]   open Remotion Studio on the project
//   node pipeline/cli.mjs hyperframes <name> [--render]     export an editable HyperFrames project
//   node pipeline/cli.mjs brief <name>               build/brief.md: narration with word times + every valid name
//   node pipeline/cli.mjs validate <name>            check storyboard.json and list exact fixes
//   node pipeline/cli.mjs catalog                    list layouts, props, backgrounds, poses, expressions…
//   node pipeline/cli.mjs localize <name> [--lang ar] the same video in another language → projects/<name>-ar
//   node pipeline/cli.mjs doctor                     check the toolchain
//   node pipeline/cli.mjs voices <name> [--lang ar] [--only bob,ali] [--dry-run]   voice takes from tts.json: Audar / Qwen3-TTS (TTS.md)
//   node pipeline/cli.mjs voice-pick <name> bob=2 narrator=1 [--lang ar] [--replace]  cut the chosen takes into lines
//   node pipeline/cli.mjs voice-ref <name> bob=2 [--lang ar] [--save bob]         a clone reference from a take (+ voices-library/)
//   node pipeline/cli.mjs enhance <name> [--take-download] [--downloads <dir>]     Adobe Enhance via Claude in Chrome (ENHANCE.md)
// options: --format youtube|shorts|square|both   --draft   --replan   --no-music   --mood <m>   --skip-enhance
// plan exports the final voice to voices/enhance/original.wav for the user's noise removal; their
// file saved next to it is used once it is there, and make waits for it (ENHANCE.md).
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, cpSync, copyFileSync, statSync, renameSync, rmSync } from "node:fs";
import { join, resolve, basename, dirname, extname } from "node:path";
import { spawnSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { ROOT, IS_WIN, findPython, findFfmpeg, findChrome, binOf } from "./env.mjs";
import { parseScript, detectLanguage } from "./parse.mjs";
import { direct } from "./director.mjs";
import { dialogueStale, isSoundLabel, loadTimeline, missingClips, prepareDialogue, readDialogue } from "./dialogue.mjs";
import { ENGINES, makeReference, makeTakes, parsePicks, pickTakes, ttsSettings } from "./tts.mjs";
import { catalog } from "./catalog.mjs";
import { enhanceStep, prepareUpload, takeDownload } from "./enhance.mjs";
import { compile, sfxCues } from "./compile.mjs";
import { writeBrief, validateProject } from "./storyboard-tools.mjs";
import { requireWhisperConfig, whisperConfig, modelFor, bundlerName, rendererName } from "./whisper-config.mjs";

const argv = process.argv.slice(2);
const cmd = argv[0];
const flags = {};
const pos = [];
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const nx = argv[i + 1];
    if (nx && !nx.startsWith("--") && ["format", "mood", "fps", "frames", "concurrency", "lang", "only", "save", "downloads"].includes(k)) { flags[k] = nx; i++; }
    else flags[k] = true;
  } else pos.push(a);
}

const log = (...a) => console.log("•", ...a);
const warn = (...a) => console.log("⚠", ...a);
const die = (m) => { console.error("\n✖ " + m + "\n"); process.exit(1); };
const readJson = (p, d) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, "")) : d);
const writeJson = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2), "utf8");

function projectDir(name) {
  if (!name) die("Give a project name, e.g.  make-video.bat my-video");
  const cands = [resolve(name), join(ROOT, "projects", name)];
  const d = cands.find((c) => existsSync(c) && statSync(c).isDirectory());
  if (!d) die(`Project not found: ${name}\nCreate it with:  new-video.bat ${name}`);
  return d;
}

function findVoice(dir) {
  // voice-ar.wav etc. belong to the other-language version (see localize), never to this video
  const files = readdirSync(dir).filter((f) => /\.(wav|mp3|m4a|flac|ogg)$/i.test(f) && !/^(mix|music)/i.test(f) && !/^voice[-_][a-z]{2}\./i.test(f));
  const pref = files.find((f) => /^voice\./i.test(f)) ?? files.find((f) => /\.wav$/i.test(f)) ?? files[0];
  if (!pref) die(`No voice file in ${dir}. Put your narration there as voice.wav`);
  return join(dir, pref);
}
function findScript(dir) {
  for (const f of ["script.txt", "script.srt", "script.json", "segments.txt", "segments.json", "timings.txt"]) if (existsSync(join(dir, f))) return join(dir, f);
  const any = readdirSync(dir).find((f) => /\.(srt)$/i.test(f));
  if (any) return join(dir, any);
  die(`No script.txt in ${dir}. It holds your story with time segments (see projects/_template/script.txt).`);
}

function run(bin, args, opts = {}) {
  const r = spawnSync(bin, args, { encoding: "utf8", cwd: ROOT, maxBuffer: 1 << 28, ...opts });
  if (r.error) die(`Could not run ${bin}: ${r.error.message}`);
  if (r.status !== 0) die(`${basename(bin)} ${args[0] ? basename(String(args[0])) : ""} failed:\n${(r.stderr || r.stdout || "").slice(-3000)}`);
  return r.stdout.trim();
}
const py = (script, args) => run(findPython(), [join(ROOT, "audio", script), ...args]);

function settingsOf(dir) {
  const s = readJson(join(dir, "video.json"), {});
  return { title: basename(dir), language: "auto", formats: ["shorts"], captions: "auto", music: "auto", host: "host", sfx: true, fps: 60, ...s };
}

function formatsOf(settings) {
  const f = flags.format ?? settings.formats;
  if (f === "both" || f === true) return ["youtube", "shorts"];
  return (Array.isArray(f) ? f : String(f).split(",")).map((x) => x.trim()).filter(Boolean);
}

/* per-project buttons (make-video.bat etc.) — copied from the template if missing */
function ensureProjectBats(dir) {
  const t = join(ROOT, "projects", "_template");
  if (!existsSync(t) || resolve(dir) === resolve(t)) return;
  const translated = !!readJson(join(dir, "video.json"), {}).localizedFrom; // a translated version has no "make Arabic" button
  for (const f of readdirSync(t)) if (f.endsWith(".bat") && !existsSync(join(dir, f)) && !(translated && /arabic/i.test(f))) copyFileSync(join(t, f), join(dir, f));
}

/** storyboard.json with this project's recordings attached (they decide who is speaking, and when). */
function readStoryboard(dir) {
  const sb = readJson(join(dir, "storyboard.json")) ?? die("No storyboard.json — run plan first.");
  const stale = dialogueStale(dir);
  if (stale) die(`The recordings need assembling again (${stale}). Run: pnpm video plan ${basename(dir)}`);
  const timeline = loadTimeline(dir);
  if (timeline) sb.dialogue = timeline;
  return sb;
}

function compileOrDie(sb, analysis, format) {
  try { return compile(sb, analysis, { format }); } catch (e) { die(`storyboard.json has problems:\n${e.message}`); }
}

/** Words for captions: a clip such as "[bark]" is heard, not read. */
function spokenWords(dir, analysis) {
  const sounds = new Set((loadTimeline(dir) ?? []).flatMap((c, i) => (isSoundLabel(c.text) ? [i] : [])));
  return analysis.words.filter((w) => !sounds.has(w.seg));
}

/* ---------------- plan ---------------- */
async function plan(dir, { force = false } = {}) {
  if (existsSync(join(dir, "tts.json")) && !existsSync(join(dir, "dialogue.json")) && !readdirSync(dir).some((f) => /^voice\.(wav|mp3|m4a|flac|ogg)$/i.test(f)))
    die(`No voice yet. Make the takes, let the user listen and pick one per character (TTS.md):\n  pnpm video voices ${basename(dir)}\n  pnpm video voice-pick ${basename(dir)} <who>=<take> …`);
  ensureProjectBats(dir);
  // .env must name a valid whisper.cpp folder and models (or turn them off): fail before any work
  try { requireWhisperConfig(); } catch (e) { die(e.message); }
  const settings = settingsOf(dir);
  const build = join(dir, "build");
  mkdirSync(build, { recursive: true });
  let dialogue = null;
  if (existsSync(join(dir, "dialogue.json"))) try { dialogue = prepareDialogue(dir); } catch (e) { die(e.message); }
  // the user's own clean-up step: export the final voice, and use their enhanced copy once it is there
  const enhance = enhanceStep(dir, dialogue?.voice ?? findVoice(dir));
  enhance.messages.forEach((m) => (enhance.state === "error" ? warn(m) : log(m)));
  if (enhance.state === "error") die("Fix the enhanced voice (see above), or remove it to use the original.");
  const voice = enhance.voice;
  const script = dialogue?.script ?? findScript(dir);
  let duration;
  const ffprobe = findFfmpeg("ffprobe");
  if (ffprobe) {
    const r = spawnSync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", voice], { encoding: "utf8" });
    duration = parseFloat(r.stdout) || undefined;
  }
  const { segments, warnings } = parseScript(script, { storyFile: join(dir, "story.txt"), audioDuration: duration });
  warnings.forEach((w) => warn(w));
  const lang = settings.language === "auto" ? detectLanguage(segments.map((s) => s.text).join(" ")) : settings.language;
  writeJson(join(build, "segments.json"), segments);
  log(`${segments.length} segments, language: ${lang}, voice: ${basename(voice)}`);

  const inputsHash = createHash("sha1").update(readFileSync(voice)).update(JSON.stringify(segments)).update(String(settings.fps)).digest("hex").slice(0, 12);
  const prev = readJson(join(build, "analysis.json"), null);
  if (!prev || prev.inputsHash !== inputsHash || force) {
    log("Analysing the voice (clean-up, lip-sync, word timing)…");
    const out = py("analyze_voice.py", [voice, join(build, "segments.json"), build, String(settings.fps)]);
    const a = readJson(join(build, "analysis.json"));
    a.inputsHash = inputsHash;
    await maybeWhisper(dir, settings, a, segments, lang);
    writeJson(join(build, "analysis.json"), a);
    log(`  ${out}`);
  }
  const analysis = readJson(join(build, "analysis.json"));
  const sbPath = join(dir, "storyboard.json");
  const existing = readJson(sbPath, null);
  if (existing && !force && !flags.replan) {
    if (existing.inputsHash && existing.inputsHash !== inputsHash) warn("Voice or script changed since storyboard.json was made. Use --replan to rebuild it (your edits would be replaced).");
    log("Keeping existing storyboard.json (use --replan to rebuild it).");
    briefOf(dir, { analysis, segments, settings: { ...settings, language: lang }, storyboard: existing });
    return { settings, analysis, storyboard: existing, lang, enhance };
  }
  const sb = direct({ segments, words: analysis.words, duration: analysis.duration, settings: { ...settings, language: lang } });
  if(dialogue) {
    sb.dialogue=dialogue.timeline;
    Object.assign(sb.cast, dialogue.cast ?? {});
    // a speaker with no cast entry: "policeman" is its own preset; anything else starts as the host
    for (const { who } of dialogue.timeline) if (!["narrator", "none"].includes(who) && !sb.cast[who]) sb.cast[who] = { preset: catalog().presets.includes(who) ? who : "host", name: who };
  }
  sb.inputsHash = inputsHash;
  sb.captionsByFormat = captionsByFormat(settings);
  writeJson(sbPath, sb);
  writeFileSync(join(dir, "STORYBOARD.md"), storyboardMd(sb), "utf8");
  log(`storyboard.json written: ${sb.scenes.length} scenes (auto-directed — edit it or ask Claude to direct it).`);
  briefOf(dir, { analysis, segments, settings: { ...settings, language: lang }, storyboard: sb });
  return { settings, analysis, storyboard: sb, lang, enhance };
}

function briefOf(dir, ctx) {
  try { const p = writeBrief(dir, ctx); log(`Director brief: ${p}`); } catch (e) { warn(`Could not write build/brief.md (${e.message.split("\n")[0]})`); }
}

/** Stop early, with exact fixes, when storyboard.json names something the renderer does not have. */
function validateOrDie(dir, analysis) {
  const res = validateProject(dir, { analysis, customProps: customProps(dir) });
  if (res.errors.length) die(`storyboard.json has problems:\n${res.report}\n\nFix them (or run: pnpm video validate ${basename(dir)}).`);
  return res;
}

function captionsByFormat(settings) {
  const c = settings.captions;
  if (c === "auto" || c === undefined) return { youtube: false, shorts: true, square: true };
  if (typeof c === "object") return { youtube: false, shorts: true, square: true, ...c };
  return { youtube: !!c, shorts: !!c, square: !!c };
}

function storyboardMd(sb) {
  const rows = sb.scenes.map((s, i) => {
    const what = [s.layout, (s.characters ?? []).map((c) => `${c.who}${c.pose ? ":" + c.pose : ""}${c.expression ? "/" + c.expression : ""}`).join(" "), (s.props ?? []).map((p) => p.name).join(" "), (s.items ?? []).map((p) => p.prop).join("→"), s.number ? `#${s.number.value}${s.number.suffix ?? ""}` : "", s.title ? `“${s.title}”` : ""].filter(Boolean).join(" · ");
    const bg = typeof s.bg === "string" ? s.bg : s.bg?.type;
    return `| ${i + 1} | ${s.start.toFixed(2)}–${s.end.toFixed(2)} | ${(s.text ?? "").replace(/\|/g, "/")} | ${what} | ${bg ?? ""} |`;
  });
  const who = sb.directedBy && sb.directedBy !== "auto" ? `Directed by ${sb.directedBy}` : "Auto-directed (keyword draft — ask Claude to direct it for a better video)";
  return `# ${sb.title}\n\n${who} · ${sb.scenes.length} scenes · ${sb.fps ?? 60} fps. Generated from \`storyboard.json\` (edit that file, not this one); see STORYBOARD_GUIDE.md in the tool folder.\n\n| # | time | narration | visuals | ground |\n|---|---|---|---|---|\n${rows.join("\n")}\n`;
}

/* optional: whisper.cpp word timestamps for exact caption timing */
async function maybeWhisper(dir, settings, analysis, segments, lang) {
  if (settings.whisper === false) return; // a project can opt out in video.json
  const cfg = requireWhisperConfig(); // WHISPER_PATH / WHISPER_EN_MODEL / WHISPER_AR_MODEL from .env
  const bin = cfg.bin;
  const model = modelFor(cfg, lang);
  if (!cfg.enabled || !bin || !model) return;
  const ff = findFfmpeg();
  if (!ff) return;
  const build = join(dir, "build");
  const wav16 = join(build, "voice16k.wav");
  spawnSync(ff, ["-y", "-v", "error", "-i", join(build, "voice.wav"), "-ar", "16000", "-ac", "1", wav16]);
  log(`  whisper.cpp word timing (${basename(model)})…`);
  const r = spawnSync(bin, ["-m", model, "-f", wav16, "-l", lang, "-ml", "1", "-sow", "-oj", "-of", join(build, "whisper"), "-np"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const jf = join(build, "whisper.json");
  if (r.status !== 0 || !existsSync(jf)) { warn("whisper.cpp failed; keeping estimated word times."); return; }
  try {
    const j = JSON.parse(readFileSync(jf, "utf8"));
    const ww = (j.transcription ?? []).map((x) => ({ w: x.text.trim(), s: x.offsets.from / 1000, e: x.offsets.to / 1000 })).filter((x) => x.w);
    const aligned = alignWords(analysis.words, ww);
    if (aligned.matched / Math.max(1, analysis.words.length) > 0.5) {
      analysis.words = aligned.words;
      analysis.word_timing = `whisper (${Math.round((100 * aligned.matched) / analysis.words.length)}% matched)`;
      log(`  ${analysis.word_timing}`);
    } else warn("whisper transcript did not match the script well; keeping estimated word times.");
  } catch (e) { warn("Could not read whisper output: " + e.message); }
}

function alignWords(script, heard) {
  const n = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
  const A = script.map((w) => n(w.w)), B = heard.map((w) => n(w.w));
  const dp = Array.from({ length: A.length + 1 }, () => new Int32Array(B.length + 1));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) dp[i][j] = A[i] && A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const words = script.map((w) => ({ ...w }));
  let i = 0, j = 0, matched = 0;
  const fixed = new Array(A.length).fill(false);
  while (i < A.length && j < B.length) {
    if (A[i] && A[i] === B[j]) {
      const seg = words[i];
      const segStart = script[i].s - 2, segEnd = script[i].e + 2;
      if (heard[j].s >= segStart && heard[j].s <= segEnd) { words[i].s = heard[j].s; words[i].e = Math.max(heard[j].e, heard[j].s + 0.05); fixed[i] = true; matched++; }
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { words, matched };
}

/* ---------------- audio ---------------- */
function autoMood(sb) {
  const all = sb.scenes.flatMap((s) => [...(s.props ?? []).map((p) => p.name), ...(s.items ?? []).map((p) => p.prop)]);
  const bgs = sb.scenes.map((s) => (typeof s.bg === "string" ? s.bg : s.bg?.type));
  const c = (arr, keys) => arr.filter((x) => keys.includes(x)).length;
  if (c(bgs, ["space"]) >= sb.scenes.length * 0.35) return "space";
  if (c(all, ["sword", "sword_crossed", "shield", "crown", "castle", "skull", "pyramid", "ziggurat", "scroll", "tablet"]) >= 2) return "epic";
  if (c(all, ["money", "moneybag", "coin", "coins", "chart", "laptop", "robot", "phone", "gamepad", "trophy"]) >= 2) return "upbeat";
  if (sb.scenes.filter((s) => /[?؟]/.test(s.text ?? "")).length >= 2) return "curious";
  return "playful";
}

async function audio(dir, ctx) {
  const settings = ctx?.settings ?? settingsOf(dir);
  const build = join(dir, "build");
  const sb = readStoryboard(dir);
  const analysis = readJson(join(build, "analysis.json")) ?? die("No analysis — run plan first.");
  const { storyboard } = compileOrDie(sb, analysis, "youtube");
  writeJson(join(build, "sfx.json"), settings.sfx === false ? [] : sfxCues(storyboard));
  const musicSetting = flags["no-music"] ? "none" : flags.mood ?? settings.music;
  let musicOn = musicSetting !== "none" && musicSetting !== false;
  const musicFile = typeof musicSetting === "string" && /\.(wav|mp3|m4a|flac|ogg)$/i.test(musicSetting) ? resolve(dir, musicSetting) : null;
  if (musicOn && musicFile) {
    if (!existsSync(musicFile)) die(`Music file not found: ${musicFile}`);
    copyFileSync(musicFile, join(build, "music" + extname(musicFile)));
    if (extname(musicFile).toLowerCase() !== ".wav") {
      const ff = findFfmpeg();
      if (ff) spawnSync(ff, ["-y", "-v", "error", "-i", musicFile, join(build, "music.wav")]);
    }
    log(`Music: your file ${basename(musicFile)}`);
  } else if (musicOn) {
    const mood = ["playful", "curious", "epic", "space", "upbeat", "calm"].includes(musicSetting) ? musicSetting : autoMood(storyboard);
    const seed = parseInt(createHash("md5").update(storyboard.title ?? "x").digest("hex").slice(0, 6), 16) % 1000;
    // spotting input: scene starts/kinds (what to hit) and the voice's voiced intervals (where the lead may play)
    const spotIn = join(build, "spot-input.json");
    writeFileSync(spotIn, JSON.stringify({
      scenes: storyboard.scenes.map((s) => ({ start: s.start, layout: s.layout ?? "host_talk", transition: s.transition ?? "cut" })),
      voiced: analysis.voiced ?? [],
    }), "utf8");
    log(`Composing music (pretty_midi, mood: ${mood}, scored to the cuts)…`);
    log(`  ${py("compose_music.py", [build, String(storyboard.duration), mood, String(seed), spotIn])}`);
    try {
      log("Rendering the score with Tone.js…");
      const { renderMusic } = await import("./tone-render.mjs");
      if (existsSync(join(build, "music.wav"))) try { (await import("node:fs")).unlinkSync(join(build, "music.wav")); } catch {}
      await renderMusic(build);
    } catch (e) {
      warn(`Tone.js render failed (${e.message.split("\n")[0]}); using the fallback synth.`);
      try { (await import("node:fs")).unlinkSync(join(build, "music.wav")); } catch {}
    }
  }
  log("Mixing (pedalboard: ducking, effects, loudness)…");
  // the mix lasts as long as the video (the voice plus its end hold, or longer), so the music never stops early
  const mixCfg = { music: musicOn, sfx: settings.sfx !== false, ...(settings.mix ?? {}), duration: storyboard.duration };
  const rep = py("mix.py", [build, JSON.stringify(mixCfg)]);
  log(`  ${rep}`);
}

/* ---------------- render ---------------- */
function prepPublic(build) {
  const a = join(build, "assets");
  mkdirSync(join(a, "fonts"), { recursive: true });
  cpSync(join(ROOT, "assets", "fonts"), join(a, "fonts"), { recursive: true });
  copyFileSync(join(ROOT, "assets", "grain.png"), join(a, "grain.png"));
}

function copyUserImages(dir, build, sb) {
  // images referenced by the storyboard are looked up in the project folder and copied into build/
  const refs = new Set();
  for (const s of sb.scenes) {
    if (s.image?.src) refs.add(s.image.src);
    if (typeof s.bg === "object" && s.bg?.image) refs.add(s.bg.image);
    for (const it of s.items ?? []) if (it.image) refs.add(it.image);
  }
  for (const r of refs) {
    if (/^https?:/.test(r)) continue;
    const src = resolve(dir, r);
    if (existsSync(src)) { mkdirSync(join(build, ...r.split(/[\\/]/).slice(0, -1)), { recursive: true }); copyFileSync(src, join(build, r)); }
    else warn(`Image not found: ${r} (put it in the project folder)`);
  }
}

function srt(words, maxChars = 42) {
  const groups = [];
  let cur = [];
  for (const w of words) {
    const len = cur.reduce((a, x) => a + x.w.length + 1, 0);
    if (cur.length && (len + w.w.length > maxChars || w.s - cur[cur.length - 1].e > 0.6)) { groups.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
  const ts = (t) => {
    const ms = Math.round(t * 1000);
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
  };
  return groups.map((g, i) => `${i + 1}\n${ts(g[0].s)} --> ${ts(g[g.length - 1].e + 0.2)}\n${g.map((x) => x.w).join(" ")}\n`).join("\n");
}

/**
 * The project's own drawings: every projects/<name>/props/*.svg becomes a prop named after the file
 * ("props/rocket-car.svg" → "rocket-car"), usable anywhere a library prop name is (props, items).
 * The SVG text is embedded in the render props (no loading), after removing scripts and event handlers.
 */
function customProps(dir) {
  const pdir = join(dir, "props");
  const out = {};
  if (!existsSync(pdir)) return out;
  for (const f of readdirSync(pdir)) {
    if (!/\.svg$/i.test(f)) continue;
    let svg = readFileSync(join(pdir, f), "utf8");
    svg = svg.replace(/<\?xml[^>]*>/g, "").replace(/<!DOCTYPE[^>]*>/gi, "").replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "").replace(/(href\s*=\s*["'])\s*javascript:[^"']*/gi, "$1");
    if (!/<svg[\s>]/i.test(svg)) { warn(`props/${f} is not an SVG drawing — skipped.`); continue; }
    if (!/viewBox/i.test(svg)) warn(`props/${f} has no viewBox; it may not scale correctly (save it with a viewBox, e.g. "0 0 200 200").`);
    const key = f.replace(/\.svg$/i, "").toLowerCase().replace(/[\s-]+/g, "_");
    // make ids unique per prop so gradients/clip paths of two drawings never clash
    svg = svg.replace(/\bid="([^"]+)"/g, `id="${key}__$1"`).replace(/url\(#([^)]+)\)/g, `url(#${key}__$1)`).replace(/(xlink:)?href="#([^"]+)"/g, (m, x, id) => `${x ?? ""}href="#${key}__${id}"`);
    out[key] = svg.trim();
  }
  return out;
}

function renderProps(dir, format) {
  const build = join(dir, "build");
  const sb = readStoryboard(dir);
  const analysis = readJson(join(build, "analysis.json"));
  validateOrDie(dir, analysis);
  const { storyboard, warnings } = compileOrDie(sb, analysis, format);
  warnings.forEach((w) => warn(w));
  // keep the human-readable summary in step with the storyboard that is actually rendered
  try { writeFileSync(join(dir, "STORYBOARD.md"), storyboardMd({ ...storyboard, title: sb.title ?? storyboard.title }), "utf8"); } catch {}
  const custom = customProps(dir);
  if (Object.keys(custom).length) storyboard.customProps = custom;
  const props = { storyboard, words: spokenWords(dir, analysis).map(({ w, s, e }) => ({ w, s, e })), mouth: analysis.mouth, audio: existsSync(join(build, "mix.wav")) ? "mix.wav" : "voice.wav", format };
  writeJson(join(build, `render-${format}.json`), props);
  return { props, storyboard };
}

async function render(dir, ctx) {
  const settings = ctx?.settings ?? settingsOf(dir);
  const build = join(dir, "build");
  const out = join(dir, "out");
  mkdirSync(out, { recursive: true });
  prepPublic(build);
  const { renderVideo } = await import("./remotion-render.mjs");
  const name = basename(dir);
  const draft = !!flags.draft;
  const renamed = {};
  for (const fmt of formatsOf(settings)) {
    const { props, storyboard } = renderProps(dir, fmt);
    copyUserImages(dir, build, storyboard);
    const file = join(out, `${name}-${fmt}${draft ? "-draft" : ""}.mp4`);
    const gpu = flags.cpu ? false : flags.gpu ? true : rendererName() === "gpu";
    log(`Rendering ${fmt}${draft ? " (draft, half size)" : ""} on the ${gpu ? "GPU" : "CPU"} → ${file}`);
    let last = -1;
    const t0 = Date.now();
    // render to a fresh temp name, then swap it in: on Windows the old video cannot be replaced
    // while it is open in a player, and the finished render must not be lost because of that
    const tmp = file.replace(/\.mp4$/, `.rendering-${process.pid}.mp4`);
    await renderVideo({ publicDir: build, inputProps: props, out: tmp, draft, gpu, onGpuFailed: (e) => warn(`GPU render failed, rendering on the CPU instead (${e.message.split("\n")[0]})`), concurrency: flags.concurrency ? Number(flags.concurrency) : undefined, onProgress: (p) => { const k = Math.floor(p * 20); if (k !== last) { last = k; process.stdout.write(`\r  ${"█".repeat(k)}${"░".repeat(20 - k)} ${Math.round(p * 100)}%`); } } });
    process.stdout.write(`\r  done in ${Math.round((Date.now() - t0) / 1000)}s${" ".repeat(30)}\n`);
    const saved = replaceFile(tmp, file);
    if (saved !== file) {
      warn(`${basename(file)} is open in another program (a video player?), so it could not be replaced.`);
      warn(`The new video was saved as ${basename(saved)} — close the player and run again to get the usual name.`);
      renamed[fmt] = saved;
    }
  }
  const analysis = readJson(join(build, "analysis.json"));
  writeFileSync(join(out, `${name}.srt`), srt(spokenWords(dir, analysis)), "utf8");
  log(`Subtitles: ${join(out, name + ".srt")} (${analysis.word_timing ?? "estimated"} timing)`);
  await qc(dir, settings, draft, renamed);
}

/* final pass on the rendered files */
/** Move src over dst; if dst is locked (open in a player on Windows), keep src under a new free name. */
function replaceFile(src, dst) {
  for (let i = 0; i < 4; i++) {
    try { renameSync(src, dst); return dst; } catch (e) {
      if (!["EPERM", "EBUSY", "EACCES"].includes(e.code)) throw e;
      const until = Date.now() + 700; while (Date.now() < until) {} // brief wait, then retry
    }
  }
  let k = 2, alt;
  do { alt = dst.replace(/\.mp4$/, ` (${k++}).mp4`); } while (existsSync(alt));
  renameSync(src, alt);
  return alt;
}

async function qc(dir, settings = settingsOf(dir), draft = !!flags.draft, renamed = {}) {
  const { qcVideo, writeQc } = await import("./qc.mjs");
  const name = basename(dir);
  const sizes = { youtube: [1920, 1080], shorts: [1080, 1920], square: [1080, 1080] };
  const analysis = readJson(join(dir, "build", "analysis.json"), {});
  const results = [];
  for (const fmt of formatsOf(settings)) {
    const file = renamed[fmt] ?? join(dir, "out", `${name}-${fmt}${draft ? "-draft" : ""}.mp4`);
    if (!existsSync(file)) continue;
    const [w, h] = sizes[fmt] ?? [];
    // the expected length is the compiled video (voice + end hold, or the storyboard's longer "duration")
    const expected = readJson(join(dir, "build", `render-${fmt}.json`), null)?.storyboard?.duration ?? analysis.duration;
    const r = qcVideo(file, { width: draft ? w / 2 : w, height: draft ? h / 2 : h, fps: settings.fps ?? 60, duration: expected, lufs: settings.mix?.lufs ?? -14, sheet: join(dir, "out", `${name}-${fmt}-sheet.jpg`) });
    results.push(r);
    log(`Final pass ${fmt}: ${r.checks.map((c) => `${c.ok ? "✔" : "✖"} ${c.name}`).join("  ")}`);
  }
  if (results.length) { writeQc(join(dir, "out", "final-pass.md"), results); log(`Final pass report: ${join(dir, "out", "final-pass.md")}`); }
}

/* layout check: measure every element of every scene in the real render */
async function check(dir) {
  const settings = settingsOf(dir);
  const build = join(dir, "build");
  prepPublic(build);
  const { renderStills } = await import("./remotion-render.mjs");
  const { runCheck } = await import("./check.mjs");
  let total = 0;
  for (const fmt of formatsOf(settings)) {
    const { props, storyboard } = renderProps(dir, fmt);
    copyUserImages(dir, build, storyboard);
    log(`Checking the ${fmt} layout (${storyboard.scenes.length} scenes)…`);
    const r = await runCheck({ dir, build, props, format: fmt, renderStills });
    total += r.errors;
    log(`  ${r.errors} errors, ${r.warns} warnings → ${r.file}`);
  }
  return total;
}

async function stills(dir) {
  const settings = settingsOf(dir);
  const build = join(dir, "build");
  prepPublic(build);
  const { renderStills } = await import("./remotion-render.mjs");
  const fmt = formatsOf(settings)[0];
  const { props, storyboard } = renderProps(dir, fmt);
  copyUserImages(dir, build, storyboard);
  const fps = storyboard.fps;
  const frames = flags.frames ? String(flags.frames).split(",").map(Number) : storyboard.scenes.map((s) => Math.round((s.start + Math.min(s.end - s.start - 0.1, Math.max(1.4, (s.end - s.start) * 0.7))) * fps));
  const odir = join(dir, "out", "stills");
  mkdirSync(odir, { recursive: true });
  const outs = await renderStills({ publicDir: build, inputProps: props, frames, outPattern: join(odir, `${fmt}-{f}.jpg`), scale: 0.5 });
  const ff = findFfmpeg();
  if (ff && outs.length) {
    const cols = fmt === "shorts" ? 6 : 4;
    const list = join(odir, "list.txt");
    writeFileSync(list, outs.map((o) => `file '${o.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"));
    spawnSync(ff, ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-vf", `scale=${fmt === "shorts" ? 270 : 480}:-1,tile=${cols}x${Math.ceil(outs.length / cols)}:padding=6:color=white`, "-frames:v", "1", join(dir, "out", `contact-${fmt}.jpg`)]);
    log(`Contact sheet: ${join(dir, "out", `contact-${fmt}.jpg`)}`);
  }
  log(`${outs.length} stills in ${odir}`);
}

function studio(dir) {
  const settings = settingsOf(dir);
  const build = join(dir, "build");
  prepPublic(build);
  const fmt = formatsOf(settings)[0];
  renderProps(dir, fmt);
  log(`Opening Remotion Studio (${fmt}). Edit storyboard.json, then run studio again to reload.`);
  const p = spawn(process.execPath, [binOf("@remotion/cli", "remotion"), "studio", join("remotion", "index.ts"), `--public-dir=${build}`, `--props=${join(build, `render-${fmt}.json`)}`, ...(bundlerName() === "rspack" ? ["--rspack"] : [])], { cwd: ROOT, stdio: "inherit" });
  p.on("exit", (c) => process.exit(c ?? 0));
}

function newProject(name) {
  if (!name) die("Usage: new <name>");
  const d = join(ROOT, "projects", name);
  if (existsSync(d)) die(`projects/${name} already exists`);
  cpSync(join(ROOT, "projects", "_template"), d, { recursive: true });
  log(`Created ${d}`);
  if (flags.tts) {
    rmSync(join(d, "script.txt"), { force: true }); // tts.json holds the script; voice-pick writes the recordings
    writeJson(join(d, "tts.json"), {
      language: "en", takes: 3,
      voices: { narrator: { description: "A deep, warm, middle-aged male storyteller with a calm, cinematic narration style" }, hero: { description: "An energetic young girl with a bright, high, cheerful voice, quick and curious" } },
      lines: [{ who: "narrator", text: "The exact words of the script, one entry per line." }, { who: "hero", text: "Each speaker change is a new line.", say: "[laughing] Each speaker change is a new line." }],
    });
    log("Now: fill in tts.json from the script (see TTS.md), then run:");
    log(`  pnpm video voices ${name}     (takes to listen to)`);
    log(`  pnpm video voice-pick ${name} narrator=1 hero=2     (the takes the user chose)`);
    return;
  }
  if (flags.story) {
    mkdirSync(join(d, "voices"), { recursive: true });
    rmSync(join(d, "script.txt"), { force: true }); // dialogue.json replaces it
    writeJson(join(d, "dialogue.json"), { cast: { hero: { preset: "kid", name: "Hero" }, pet: { kind: "dog" } }, clips: [{ who: "narrator", file: "voices/01.wav", text: "The exact words of the first recording." }, { who: "hero", file: "voices/02.wav", text: "One recording per line, in order." }] });
    log("Now: put one recording per line in voices/, list them in dialogue.json (see STORY_MODE.md),");
    log(`then run: pnpm video plan ${name}`);
    return;
  }
  log("Now: put your narration in it as voice.wav, write script.txt (story + time segments),");
  log("then double-click make-video.bat inside that folder.");
}

/* ---------------- second language (localize) ---------------- */
// The user puts voice-ar.wav + script-ar.txt (same sentences, same order) next to the English
// files. This makes projects/<name>-ar: the same scenes re-timed to the Arabic voice, with on-screen
// text from its translations.json. It is a normal project afterwards (check, make, stills…).
async function localize(srcDir, lang) {
  const settings = settingsOf(srcDir);
  if (settings.localizedFrom) die(`${basename(srcDir)} is already a translated version (of ${settings.localizedFrom}). Run this on the original project.`);
  const find = (re) => readdirSync(srcDir).find((f) => re.test(f));
  const sub = join(srcDir, lang);
  const voiceSrc = find(new RegExp(`^voice[-_]${lang}\\.(wav|mp3|m4a|flac|ogg)$`, "i")) ? join(srcDir, find(new RegExp(`^voice[-_]${lang}\\.(wav|mp3|m4a|flac|ogg)$`, "i")))
    : existsSync(sub) && readdirSync(sub).find((f) => /^voice\.(wav|mp3|m4a|flac|ogg)$/i.test(f)) ? join(sub, readdirSync(sub).find((f) => /^voice\./i.test(f))) : null;
  const scriptSrc = find(new RegExp(`^script[-_]${lang}\\.(txt|srt|json)$`, "i")) ? join(srcDir, find(new RegExp(`^script[-_]${lang}\\.(txt|srt|json)$`, "i")))
    : existsSync(join(sub, "script.txt")) ? join(sub, "script.txt") : null;
  // a multi-voice story: dialogue-ar.json lists one recording per line, like dialogue.json
  const dialogueFile = `dialogue-${lang}.json`;
  const multiVoice = existsSync(join(srcDir, dialogueFile));
  if (!multiVoice && existsSync(join(srcDir, "dialogue.json")) && (!voiceSrc || !scriptSrc)) die(`For the ${lang} version of a multi-voice story, put ${dialogueFile} next to dialogue.json: the same lines in the same order, each with its own ${lang} recording (for example voices-${lang}/01.wav).`);
  if (!multiVoice && (!voiceSrc || !scriptSrc)) die(`For the ${lang} version, put these next to voice.wav and script.txt in ${srcDir}:\n  voice-${lang}.wav    the ${lang} narration\n  script-${lang}.txt   the ${lang} text with time segments — the SAME number of sentences, in the same order`);
  // 1. the source video must be planned (its storyboard is the model)
  const srcCtx = await plan(srcDir);
  // 2. the target project
  const name = `${basename(srcDir)}-${lang}`;
  const dst = join(ROOT, "projects", name);
  mkdirSync(dst, { recursive: true });
  if (multiVoice) {
    const manifest = readDialogue(srcDir, dialogueFile);
    const missing = missingClips(srcDir, manifest);
    if (missing.length) die(`${missing.length} recording(s) named in ${dialogueFile} are missing:\n  ${missing.join("\n  ")}`);
    const source = readDialogue(srcDir);
    if (source.clips.length !== manifest.clips.length) die(`${dialogueFile} has ${manifest.clips.length} clips but dialogue.json has ${source.clips.length}. They must match line for line.`);
    for (const c of manifest.clips) {
      mkdirSync(dirname(resolve(dst, c.file)), { recursive: true });
      copyFileSync(resolve(srcDir, c.file), resolve(dst, c.file));
    }
    writeJson(join(dst, "dialogue.json"), { ...manifest, cast: manifest.cast ?? source.cast });
  } else {
    const voiceDst = join(dst, "voice" + extname(voiceSrc).toLowerCase());
    if (!existsSync(voiceDst) || statSync(voiceDst).size !== statSync(voiceSrc).size || statSync(voiceDst).mtimeMs < statSync(voiceSrc).mtimeMs) copyFileSync(voiceSrc, voiceDst);
    copyFileSync(scriptSrc, join(dst, "script" + extname(scriptSrc).toLowerCase()));
  }
  if (existsSync(join(srcDir, "props"))) cpSync(join(srcDir, "props"), join(dst, "props"), { recursive: true });
  const vj = readJson(join(dst, "video.json"), null);
  const own = readJson(join(srcDir, "video.json"), {});
  writeJson(join(dst, "video.json"), { ...own, ...(vj ?? {}), language: lang, localizedFrom: basename(srcDir), title: vj?.title ?? own.title ?? name });
  ensureProjectBats(dst);
  const existing = readJson(join(dst, "storyboard.json"), null);
  const keepDirected = existing && !existing.adaptedFrom && existing.directedBy !== "auto" && !flags.replan;
  const dstCtx = await plan(dst, { force: false });
  if (keepDirected) { warn(`projects/${name}/storyboard.json was directed by hand, so it was kept. Use --replan to rebuild it from ${basename(srcDir)}.`); return dst; }
  // 3. carry the scenes over
  const { localizeStoryboard, screenStrings } = await import("./localize.mjs");
  const srcSb = readJson(join(srcDir, "storyboard.json"));
  const { storyboard: compiled } = compile(srcSb, srcCtx.analysis, { format: formatsOf(settings)[0] ?? "shorts" });
  const trPath = join(dst, "translations.json");
  const translations = readJson(trPath, {});
  for (const s of screenStrings(srcSb)) if (!(s in translations)) translations[s] = "";
  writeJson(trPath, translations);
  const segments = readJson(join(dst, "build", "segments.json"));
  let res;
  try { res = localizeStoryboard(compiled, { srcAnalysis: srcCtx.analysis, dstAnalysis: dstCtx.analysis, dstSegments: segments, translations, lang, source: basename(srcDir) }); }
  catch (e) { die(e.message); }
  res.storyboard.captionsByFormat = srcSb.captionsByFormat ?? res.storyboard.captionsByFormat;
  writeJson(join(dst, "storyboard.json"), res.storyboard);
  res.warnings.forEach((w) => warn(w));
  briefOf(dst, { analysis: dstCtx.analysis, segments, settings: { ...settingsOf(dst), language: lang }, storyboard: res.storyboard });
  log(`projects/${name}/storyboard.json: ${res.storyboard.scenes.length} scenes carried over from ${basename(srcDir)} and re-timed to the ${lang} voice.`);
  if (res.missing.length) {
    warn(`${res.missing.length} on-screen text(s) still in the source language. Fill them in projects/${name}/translations.json, then run this again:`);
    res.missing.slice(0, 12).forEach((m) => console.log(`    "${m}"`));
    if (res.missing.length > 12) console.log(`    … and ${res.missing.length - 12} more`);
  } else log("All on-screen text is translated.");
  return dst;
}

function doctor() {
  const ok = (b, m, fix) => console.log(`${b ? "✔" : "✖"} ${m}${!b && fix ? `\n    → ${fix}` : ""}`);
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  ok(nodeMajor >= 20, `Node ${process.versions.node}`, "Install Node 22 LTS: winget install OpenJS.NodeJS.LTS");
  ok(existsSync(join(ROOT, "node_modules", "remotion")), "JS packages (remotion, gsap, tone, hyperframes…)", "Run setup.bat");
  const pyBin = findPython();
  const r = spawnSync(pyBin, ["-c", "import numpy, pedalboard, pretty_midi; print(pedalboard.__version__)"], { encoding: "utf8" });
  ok(r.status === 0, `Python audio packages via ${pyBin}`, "Run setup.bat (uv sync)");
  ok(!!findFfmpeg("ffprobe"), "ffprobe (for voice duration)", "winget install Gyan.FFmpeg (optional, Remotion's copy is used when present)");
  ok(!!findChrome(), `Chromium for Tone.js: ${findChrome() ?? "none"}`, "Chrome or Edge is needed for the Tone.js music render (fallback synth is used otherwise)");
  const w = whisperConfig();
  if (w.errors.length) ok(false, "whisper.cpp settings (.env)", w.errors.join("\n    → "));
  else if (!w.path) ok(true, "whisper.cpp: turned off in .env (word times are estimated)");
  else {
    ok(!!w.bin, `whisper.cpp program: ${w.bin}`);
    ok(true, `English model: ${w.models.en ?? "off (estimated timing)"}`);
    ok(true, `Arabic model: ${w.models.ar ?? "off (estimated timing)"}`);
  }
  w.warnings.forEach((m) => console.log("⚠ " + m));
  const t = ttsSettings();
  if (!Object.values(t.dirs).some(Boolean)) ok(true, "Voices from text: not set up (optional, see TTS.md)");
  else for (const [e, E] of Object.entries(ENGINES)) {
    if (!t.dirs[e]) { ok(true, `${E.name} voices: not set up (optional)`); continue; }
    const bad = [...t.errors, ...t.engineErrors[e]];
    ok(!bad.length, `${E.name} voices: ${t.dirs[e]}`, bad.join("\n    → "));
  }
}

/* ---------------- main ---------------- */
const t0 = Date.now();
try {
  switch (cmd) {
    case "voices": {
      const d = projectDir(pos[0]);
      const lang = typeof flags.lang === "string" ? flags.lang.toLowerCase() : undefined;
      const only = typeof flags.only === "string" ? flags.only.split(",").map((x) => x.trim()) : undefined;
      let r;
      try { r = await makeTakes(d, { lang, only, dryRun: !!flags["dry-run"] }); } catch (e) { die(e.message); }
      if (flags["dry-run"]) { r.takes.forEach((t) => log(`${t.who} take ${t.take} (${t.engine}, seed ${t.seed}) → ${t.file}`)); break; }
      for (const t of r.takes) log(t.failed ? `✗ ${t.who} take ${t.take}: ${t.failed.split("\n")[0]}` : `${t.who} take ${t.take}: ${t.duration.toFixed(1)} s, ${t.check.summary}`);
      log(`Listen: ${r.review}`);
      log(`Then pick one take per character: pnpm video voice-pick ${basename(d)}${lang ? ` --lang ${lang}` : ""} ${[...new Set(r.takes.map((t) => t.who))].map((w) => `${w}=1`).join(" ")}`);
      if (r.takes.some((t) => t.failed)) process.exitCode = 1;
      break;
    }
    case "voice-pick": {
      const d = projectDir(pos[0]);
      const lang = typeof flags.lang === "string" ? flags.lang.toLowerCase() : undefined;
      let r;
      try { r = pickTakes(d, parsePicks(pos.slice(1)), { lang, replace: !!flags.replace, forceDialogue: !!flags.dialogue }); } catch (e) { die(e.message); }
      r.problems.forEach((p) => warn(p));
      log(r.mode === "narration" ? `Wrote ${r.voice} and ${r.script} (one voice, so the take stays whole).` : `Wrote ${r.dialogue}: ${r.clips} clips, one recording per line.`);
      if (r.sounds?.length) warn(`These sounds still need a recording (or a "file" on their line): ${r.sounds.join(", ")}`);
      log(lang ? `Next: pnpm video localize ${basename(d)} --lang ${lang}` : `Next: pnpm video plan ${basename(d)}`);
      break;
    }
    case "voice-ref": {
      const d = projectDir(pos[0]);
      const lang = typeof flags.lang === "string" ? flags.lang.toLowerCase() : undefined;
      const picks = Object.entries(parsePicks(pos.slice(1)));
      if (!picks.length) die("Name the take: pnpm video voice-ref <name> ali=2 [--save ali]");
      if (flags.save && picks.length > 1) die("--save names one character: make one reference at a time.");
      for (const [who, take] of picks) {
        let r;
        try { r = makeReference(d, who, take, { lang, save: typeof flags.save === "string" ? flags.save : undefined, overwrite: !!flags.overwrite }); } catch (e) { die(e.message); }
        log(`${r.reference}: ${r.seconds.toFixed(1)} s, line(s) ${r.lines.join(", ")} of ${who} take ${take}${r.clean ? "" : " (warning: no clean line without tags or misheard words; listen to it)"}`);
        log(`  words: ${r.referenceText}`);
        if (r.saved) log(`  saved as ${r.saved}: later videos use { "library": "${flags.save}" } for this voice`);
        else log(`  use it: "${who}": { "reference": "${r.reference}", "referenceText": ${JSON.stringify(r.referenceText)} }`);
      }
      break;
    }
    case "dialogue": { const d = projectDir(pos[0]); const r=prepareDialogue(d); log(`Assembled ${r.timeline.length} clips into ${r.voice}`); break; }
    case "new": newProject(pos[0]); break;
    case "plan": { const d = projectDir(pos[0]); await plan(d, { force: !!flags.replan }); break; }
    case "audio": { const d = projectDir(pos[0]); await audio(d); break; }
    case "render": { const d = projectDir(pos[0]); if (!existsSync(join(d, "build", "mix.wav"))) await audio(d); await render(d); break; }
    case "stills": { const d = projectDir(pos[0]); await stills(d); break; }
    case "studio": { const d = projectDir(pos[0]); studio(d); break; }
    case "hyperframes": { const d = projectDir(pos[0]); const { exportHyperframes } = await import("./hyperframes.mjs"); await exportHyperframes(d, { render: !!flags.render, format: formatsOf(settingsOf(d))[0], props: renderProps(d, formatsOf(settingsOf(d))[0]).props }); break; }
    case "doctor": doctor(); break;
    case "localize":
    case "arabic": {
      const d = projectDir(pos[0]);
      const dst = await localize(d, String(flags.lang ?? (cmd === "arabic" ? "ar" : "ar")).toLowerCase());
      if (flags.make) { const ctx = await plan(dst); await audio(dst, ctx); await render(dst, ctx); }
      else log(`Next: check it (pnpm video check ${basename(dst)}) and make it (make-short-video.bat in projects/${basename(dst)}).`);
      break;
    }
    case "catalog": {
      const { catalog, catalogText } = await import("./catalog.mjs");
      console.log(flags.json ? JSON.stringify({ ...catalog(), resolveProp: undefined }, null, 1) : catalogText());
      break;
    }
    case "brief": { const d = projectDir(pos[0]); await plan(d); break; }
    case "validate": {
      const d = projectDir(pos[0]);
      const analysis = readJson(join(d, "build", "analysis.json"), null);
      if (!analysis) warn("No build/analysis.json yet (run plan first): word references (\"@word\") are not checked.");
      const res = validateProject(d, { analysis: analysis ?? {}, customProps: customProps(d) });
      console.log(res.report);
      if (res.errors.length) process.exit(1);
      break;
    }
    case "check": { const d = projectDir(pos[0]); await plan(d); await check(d); break; }
    case "enhance": {
      // Adobe Podcast Enhance through Claude in Chrome (ENHANCE.md): the file to upload, then the download back
      const d = projectDir(pos[0]);
      try {
        if (flags["take-download"]) {
          const r = takeDownload(d, { downloads: typeof flags.downloads === "string" ? flags.downloads : undefined });
          log(`Moved ${r.from}\n    → ${r.to} (${r.seconds?.toFixed(3)} s; the original is ${r.original?.toFixed(3)} s)`);
          if (!r.fits) die(`The enhanced file is not the same length as the original. Tell the user; do not use it.`);
          log(`Next: pnpm video plan ${basename(d)}   (it switches the video to the enhanced voice)`);
        } else {
          const r = prepareUpload(d);
          log(`Upload this file to https://podcast.adobe.com/en/enhance (Claude in Chrome, file_upload):\n  ${r.upload}`);
          log(`When the download has finished: pnpm video enhance ${basename(d)} --take-download`);
        }
      } catch (e) { die(e.message); }
      break;
    }
    case "qc": { const d = projectDir(pos[0]); await qc(d); break; }
    case "make": {
      const d = projectDir(pos[0]);
      const ctx = await plan(d, { force: !!flags.replan });
      // the final video waits for the user's enhanced voice (ENHANCE.md); drafts and --skip-enhance do not
      if (ctx.enhance?.state === "waiting" && !flags.draft && !flags["skip-enhance"])
        die(`The voice is waiting for your enhancement:\n  1. Clean ${join(d, "voices", "enhance", "original.wav")} (remove noise; keep the same length and words).\n  2. Save the result next to it, for example ${join(d, "voices", "enhance", "enhanced.wav")}\n  3. Run make again.\n(--draft renders a quick check with the original voice; --skip-enhance makes the final video without enhancement.)`);
      await audio(d, ctx);
      await render(d, ctx);
      log(`Finished in ${Math.round((Date.now() - t0) / 1000)}s. Videos are in ${join(d, "out")}`);
      break;
    }
    default:
      console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 15).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  }
} catch (e) {
  die(e.stack ?? String(e));
}
