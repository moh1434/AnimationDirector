// The user's own voice clean-up step (noise removal etc.), done outside this pipeline.
//
// Once the video's whole voice track is final (the user's recording, or the clips from voice-pick
// assembled into one file), plan copies it to
//     voices/enhance/original.wav
// The user cleans it with their own tool and saves the result next to it, the same length and the
// same words: any other audio file in that folder (for example enhanced.wav) is the enhanced voice.
// From then on the video uses the enhanced file instead of the original. When the voice changes
// (new recordings, a new pick), the old enhanced file no longer fits: it is moved to
// voices/enhance/old/ and the new original is exported, so the user enhances again.
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync, renameSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { findFfmpeg } from "./env.mjs";

export const ENHANCE_DIR = join("voices", "enhance");
export const ORIGINAL = "original.wav";
/** The enhanced voice may differ from the original by this much (seconds); more means a cut or a pad. */
export const LENGTH_TOLERANCE = 0.05;
const AUDIO = /\.(wav|flac|mp3|m4a|ogg)$/i;

const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };

/** Length of an audio file in seconds (ffprobe), or null. */
export function audioSeconds(file) {
  const ffprobe = findFfmpeg("ffprobe");
  if (!ffprobe) return null;
  const r = spawnSync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  const s = parseFloat(r.stdout);
  return Number.isFinite(s) ? s : null;
}

/**
 * Export the final voice for the user's enhancement and pick the voice the video should use.
 * Returns { voice, state, messages }: state is "enhanced" (use the user's file), "waiting" (no
 * enhanced file yet; the original is used) or "error" (an enhanced file that does not fit).
 */
export function enhanceStep(dir, voice, { seconds = audioSeconds, now = () => new Date().toISOString() } = {}) {
  const base = join(dir, ENHANCE_DIR), info = join(base, "enhance.json"), original = join(base, ORIGINAL);
  mkdirSync(base, { recursive: true });
  const rel = (p) => relative(dir, p).replace(/\\/g, "/");
  const messages = [];
  const current = sha(voice), state = readJson(info) ?? {};
  const enhancedFiles = () => readdirSync(base).filter((f) => AUDIO.test(f) && f.toLowerCase() !== ORIGINAL && statSync(join(base, f)).isFile());
  if (state.original !== current || !existsSync(original)) {
    // a new voice: what was enhanced before belongs to the old one
    const stale = state.original ? enhancedFiles() : [];
    if (stale.length) {
      const old = join(base, "old", now().replace(/[:.]/g, "-"));
      mkdirSync(old, { recursive: true });
      for (const f of stale) renameSync(join(base, f), join(old, f));
      messages.push(`The voice changed, so the enhanced file no longer fits; it was moved to ${rel(old)}/.`);
    }
    copyFileSync(voice, original);
    writeFileSync(info, JSON.stringify({ original: current, seconds: seconds(original), exportedAt: now() }, null, 2) + "\n");
    messages.push(`Exported the final voice for enhancement: ${rel(original)}`);
  }
  const found = enhancedFiles();
  if (!found.length) {
    messages.push(`Waiting for the enhanced voice: save it next to ${rel(original)} (for example ${rel(join(base, "enhanced.wav"))}; same length and words). Until then the original is used.`);
    return { voice, state: "waiting", messages };
  }
  if (found.length > 1) return { voice, state: "error", messages: [...messages, `${rel(base)}/ holds ${found.length} enhanced files (${found.join(", ")}); keep only one next to ${ORIGINAL}.`] };
  const enhanced = join(base, found[0]);
  const want = seconds(original), got = seconds(enhanced);
  if (want != null && got != null && Math.abs(want - got) > LENGTH_TOLERANCE)
    return { voice, state: "error", messages: [...messages, `${rel(enhanced)} is ${got.toFixed(2)} s but the original is ${want.toFixed(2)} s. It must be the same length (no trimming or padding), or the picture will drift from the words.`] };
  messages.push(`Using the enhanced voice: ${rel(enhanced)}`);
  return { voice: enhanced, state: "enhanced", messages };
}

/* ---------------- Adobe Podcast Enhance, done by the AI in Claude in Chrome (ENHANCE.md) ---------------- */

/** Claude in Chrome uploads at most 10 MB per call; a bigger voice goes up as lossless FLAC. */
export const UPLOAD_LIMIT = 9.5 * 1024 * 1024;
export const defaultDownloads = () => join(process.env.USERPROFILE || process.env.HOME || ".", "Downloads");

/**
 * The file to upload to Adobe Enhance (original.wav, or a FLAC copy in build/ when it is too big for
 * one upload), and the moment the upload starts, so the download that comes back can be found.
 */
export function prepareUpload(dir, { now = () => new Date().toISOString(), ffmpeg = findFfmpeg } = {}) {
  const base = join(dir, ENHANCE_DIR), info = join(base, "enhance.json"), original = join(base, ORIGINAL);
  if (!existsSync(original)) throw new Error(`No voices/enhance/${ORIGINAL} yet. Run plan first: it exports the final voice.`);
  let upload = original;
  if (statSync(original).size > UPLOAD_LIMIT) {
    const ff = ffmpeg();
    if (!ff) throw new Error("The voice is over 9.5 MB and FFmpeg is missing to make a FLAC copy for the upload.");
    mkdirSync(join(dir, "build"), { recursive: true });
    upload = join(dir, "build", "voice-for-enhance.flac");
    const r = spawnSync(ff, ["-v", "error", "-y", "-i", original, "-c:a", "flac", "-compression_level", "8", upload]);
    if (r.status !== 0) throw new Error(`FFmpeg could not make the FLAC copy: ${r.stderr}`);
    if (statSync(upload).size > UPLOAD_LIMIT) throw new Error(`The voice is too long for one upload (${(statSync(upload).size / 1048576).toFixed(1)} MB as FLAC, the limit is 9.5 MB). Ask the user to upload ${original} themselves.`);
  }
  const state = readJson(info) ?? {};
  writeFileSync(info, JSON.stringify({ ...state, uploadStartedAt: now() }, null, 2) + "\n");
  return { upload, state: enhanceState(dir) };
}

/** "waiting" (no enhanced file next to the original), "enhanced" or "none" (nothing exported yet). */
export function enhanceState(dir) {
  const base = join(dir, ENHANCE_DIR);
  if (!existsSync(join(base, ORIGINAL))) return "none";
  return readdirSync(base).some((f) => AUDIO.test(f) && f.toLowerCase() !== ORIGINAL && statSync(join(base, f)).isFile()) ? "enhanced" : "waiting";
}

/**
 * Move the enhanced file Chrome downloaded into voices/enhance/ (as enhanced.<ext>): the newest audio
 * file in the Downloads folder saved after the upload started. Its length is checked by the next plan.
 */
export function takeDownload(dir, { downloads = defaultDownloads(), seconds = audioSeconds } = {}) {
  const base = join(dir, ENHANCE_DIR), state = readJson(join(base, "enhance.json")) ?? {};
  if (!state.uploadStartedAt) throw new Error("No upload was started (run: pnpm video enhance <name> first).");
  if (!existsSync(downloads)) throw new Error(`No Downloads folder at ${downloads} (give it with --downloads <folder>).`);
  const since = Date.parse(state.uploadStartedAt);
  const files = readdirSync(downloads)
    .filter((f) => AUDIO.test(f) && !/\.(crdownload|part|tmp)$/i.test(f))
    .map((f) => ({ f, t: statSync(join(downloads, f)).mtimeMs }))
    .filter((x) => x.t >= since - 2000)
    .sort((a, b) => b.t - a.t);
  if (!files.length) throw new Error(`No audio file was downloaded to ${downloads} after the upload started (${state.uploadStartedAt}). Is the download finished?`);
  if (enhanceState(dir) === "enhanced") throw new Error(`voices/enhance/ already holds an enhanced file; it is the user's or an earlier one. Nothing was moved.`);
  const src = join(downloads, files[0].f), ext = files[0].f.match(AUDIO)[0].toLowerCase(), dst = join(base, `enhanced${ext}`);
  renameSync(src, dst);
  const want = seconds(join(base, ORIGINAL)), got = seconds(dst);
  return { from: src, to: dst, seconds: got, original: want, fits: want == null || got == null || Math.abs(want - got) <= LENGTH_TOLERANCE };
}
