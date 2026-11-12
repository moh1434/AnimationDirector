// Shorten a voice reference that is longer than 15 seconds.
//
// Audar-TTS hears only the first 15 s of a reference, so a longer one is cut off in the middle of a
// word while its transcript still has every word, and a transcript that does not match the audio
// makes the clone worse. This finds the last quiet moment (a pause between words) before 15 s,
// cuts the recording there — dropping the last words — and fades out the last 60 ms. Recordings of
// 15 s or less are never touched.
//
// The original is kept as full/<name>.wav next to the file. With the transcript, the words that
// are left are worked out from whisper and returned (and, for a voices-library folder, written to
// voice.json, whose old text is kept in full/voice.json).
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, renameSync, copyFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { spawnSync } from "node:child_process";
import { findFfmpeg } from "./env.mjs";
import { audioSeconds } from "./enhance.mjs";
import { norm, hearMany } from "./tts.mjs";

/** References longer than this are shortened (Audar uses only the first 15 s). */
export const MAX_REFERENCE_SECONDS = 15;
/** Silence kept after the last word before the cut (seconds). */
export const TAIL = 0.12;
const FADE = 0.06;
/** A cut must leave at least this much of the recording (seconds). */
const MIN_KEEP = 4;

/** Quiet moments of a recording ({ start, end } in seconds) from FFmpeg's silencedetect. */
export function findPauses(file, { noise = -38, minPause = 0.12 } = {}) {
  const ff = findFfmpeg();
  if (!ff) throw new Error("FFmpeg is needed to find the pauses in " + file);
  const r = spawnSync(ff, ["-hide_banner", "-nostats", "-i", file, "-af", `silencedetect=noise=${noise}dB:d=${minPause}`, "-f", "null", "-"], { encoding: "utf8" });
  const pauses = [];
  let start = null;
  for (const line of (r.stderr ?? "").split(/\r?\n/)) {
    const s = line.match(/silence_start: (-?[\d.]+)/), e = line.match(/silence_end: ([\d.]+)/);
    if (s) start = Math.max(0, parseFloat(s[1]));
    if (e && start != null) { pauses.push({ start, end: parseFloat(e[1]) }); start = null; }
  }
  if (start != null) pauses.push({ start, end: Infinity });
  return pauses;
}

/**
 * Where to cut a recording of `seconds` with these pauses, or null when it is not longer than `max`.
 * The cut is TAIL after the start of the last pause between words that leaves the recording at
 * `max` or shorter. Throws when there is no such pause.
 */
export function cutPoint(seconds, pauses, { max = MAX_REFERENCE_SECONDS, tail = TAIL } = {}) {
  if (!(seconds > max)) return null;
  const between = pauses.filter((p) => p.start > 0.05 && p.end < seconds - 0.05);
  const fits = between.filter((p) => p.start + tail <= max && p.start >= MIN_KEEP);
  if (!fits.length) throw new Error(`no pause between words before ${max} s (found ${between.length} pauses); cut it by hand`);
  const last = fits.at(-1);
  return Math.round((last.start + Math.min(tail, (last.end - last.start) / 2)) * 1000) / 1000;
}

const isTag = (t) => /^\[[^\]]*\]$/.test(t);
const wordsOf = (text) => text.split(/\s+/).filter(Boolean);

/**
 * The beginning of `text` that matches the words whisper heard in the shortened recording, ending
 * with a full stop. Tags such as [excited] are kept where they are. Returns null when it cannot tell.
 */
export function keptText(text, heard) {
  const tokens = wordsOf(text);
  const counted = tokens.map((t, i) => ({ t, i })).filter(({ t }) => !isTag(t) && norm(t));
  const said = wordsOf(heard ?? "").map(norm).filter(Boolean);
  if (!said.length || !counted.length) return null;
  const n = Math.min(said.length, counted.length), last = said.at(-1);
  // whisper may split or join a word or two: look near the heard count for the last heard word.
  let k = null;
  for (const d of [0, -1, 1, -2, 2]) {
    const j = n + d;
    if (j >= 1 && j <= counted.length && norm(counted[j - 1].t) === last) { k = j; break; }
  }
  if (k == null) return null;
  const end = counted[k - 1].i;
  const kept = tokens.slice(0, end + 1);
  kept[kept.length - 1] = kept.at(-1).replace(/[,،;؛:—–-]+$/u, "");
  if (!/[.!?؟…]$/u.test(kept.at(-1))) kept[kept.length - 1] += ".";
  return kept.join(" ");
}

const LANG = /(?:^|[_-])(en|ar)(?:[_.-]|$)/i;
/** The language of a reference from its name (reference_ar.wav, ar_story.wav), or null. */
export const languageOf = (file) => basename(file).match(LANG)?.[1]?.toLowerCase() ?? null;

/**
 * Shorten one recording if it is longer than `max`. Returns { file, seconds, trimmed, cut, kept,
 * full, heard, text } — trimmed false (and nothing changed) when it is short enough.
 */
export function trimReference(file, { text, language = languageOf(file) ?? "en", max = MAX_REFERENCE_SECONDS, hear = hearMany } = {}) {
  const seconds = audioSeconds(file);
  if (seconds == null) throw new Error(`cannot read the length of ${file}`);
  if (!(seconds > max)) return { file, seconds, trimmed: false };
  const cut = cutPoint(seconds, findPauses(file), { max });
  const full = join(dirname(file), "full", basename(file));
  mkdirSync(dirname(full), { recursive: true });
  if (existsSync(full)) throw new Error(`${full} already exists; move it away first so no original is lost`);
  renameSync(file, full);
  const r = spawnSync(findFfmpeg(), ["-hide_banner", "-loglevel", "error", "-y", "-i", full,
    "-af", `atrim=0:${cut},afade=t=out:st=${(cut - FADE).toFixed(3)}:d=${FADE}`, "-c:a", "pcm_s16le", file], { encoding: "utf8" });
  if (r.status !== 0) { renameSync(full, file); throw new Error(`FFmpeg could not cut ${file}: ${r.stderr}`); }
  const heard = hear([file], language)?.[0] ?? null;
  return { file, seconds, trimmed: true, cut, full, heard, text, kept: text ? keptText(text, heard) : null };
}

/**
 * Shorten every reference_<lang>.wav of a voices-library folder that is longer than `max`, and
 * write the words left to voice.json (languages.<lang>.text). The old voice.json is kept in full/.
 */
export function trimLibraryVoice(folder, { max = MAX_REFERENCE_SECONDS, hear = hearMany, cooldown = () => {} } = {}) {
  const jsonFile = join(folder, "voice.json");
  const json = existsSync(jsonFile) ? JSON.parse(readFileSync(jsonFile, "utf8")) : {};
  const results = [];
  let changed = false;
  // languages.<lang>.file/.text (or the older reference_<lang>.wav + "referenceText_<lang>")
  const entries = json.languages
    ? Object.entries(json.languages).map(([lang, e]) => ({ lang, file: e?.file ?? `reference_${lang}.wav`, get: () => e?.text, set: (t) => { e.text = t; } }))
    : readdirSync(folder).filter((f) => /^reference_[a-z]{2}\.wav$/i.test(f)).sort().map((f) => { const lang = f.slice(10, 12).toLowerCase(), key = `referenceText_${lang}`; return { lang, file: f, get: () => json[key], set: (t) => { json[key] = t; } }; });
  for (const e of entries) {
    if (!existsSync(join(folder, e.file))) continue;
    if (results.some((r) => r.trimmed)) cooldown();
    const r = trimReference(join(folder, e.file), { text: e.get() ?? undefined, language: e.lang, max, hear });
    results.push(r);
    if (r.trimmed && r.kept) {
      if (!changed && existsSync(jsonFile)) copyFileSync(jsonFile, join(folder, "full", "voice.json"));
      e.set(r.kept); changed = true;
    }
  }
  if (changed) writeFileSync(jsonFile, JSON.stringify(json, null, 2) + "\n");
  return results;
}
