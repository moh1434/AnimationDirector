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
