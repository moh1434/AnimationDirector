// Multi-voice stories: assemble the user's recordings (one file per line) into one voice track.
// Clips are decoded, never stretched or rewritten; originals stay untouched. The timeline this writes
// (build/dialogue-timeline.json) tells the renderer who is speaking, and lets a storyboard say
// "clip:12" instead of a number of seconds, so it keeps working when recordings are replaced.
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { findFfmpeg } from "./env.mjs";

/** Same rate as the rest of the audio pipeline (audio/analyze_voice.py), so voices keep their detail. */
export const DIALOGUE_RATE = 48000;
const TIMELINE = "dialogue-timeline.json";

/** A clip that is a sound rather than speech, e.g. "[bark]": it is heard, but never captioned. */
export const isSoundLabel = (text) => /^\s*\[[^\]]*\]\s*$/.test(String(text ?? ""));

export function sequenceClips(clips, durations) {
  if (!Array.isArray(clips) || !clips.length) throw new Error("dialogue.clips must be a non-empty array");
  let end = 0;
  return clips.map((c, i) => {
    const n = `Clip ${i + 1}`;
    if (typeof c.who !== "string" || !c.who.trim() || typeof c.text !== "string" || !c.text.trim()) throw new Error(`${n} needs "who" and its exact "text" (use "[bark]" for a sound).`);
    const gap = c.gap ?? 0.25, start = c.start ?? end + gap, duration = durations[i];
    if (!Number.isFinite(gap) || gap < 0) throw new Error(`${n}: "gap" must be 0 or more seconds.`);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error(`${n}: the recording is empty.`);
    if (!Number.isFinite(start) || start < end) throw new Error(`${n} starts at ${start}, before the previous clip ends (${end.toFixed(2)} s). Voices cannot overlap yet.`);
    end = start + duration;
    return { clip: i + 1, who: c.who, start, end, text: c.text };
  });
}

export function pcmWav(pcm, rate = DIALOGUE_RATE) {
  const h = Buffer.alloc(44);
  h.write("RIFF"); h.writeUInt32LE(pcm.length + 36, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

export function readDialogue(dir, file = "dialogue.json") {
  const path = join(dir, file);
  let manifest;
  try { manifest = JSON.parse(readFileSync(path, "utf8").replace(/^﻿/, "")); }
  catch (e) { throw new Error(`${file} is not valid JSON: ${e.message}`); }
  if (!Array.isArray(manifest.clips) || !manifest.clips.length) throw new Error(`${file}: "clips" must be a non-empty list.`);
  return manifest;
}

/** Every recording named in the manifest that is not in the project (all at once, not one per run). */
export function missingClips(dir, manifest) {
  return manifest.clips.filter((c) => typeof c.file !== "string" || !existsSync(resolve(dir, c.file))).map((c) => c.file ?? "(no file given)");
}

/** Assemble supplied clips only; never generate or stretch speech. Original files stay untouched. */
export function prepareDialogue(dir, file = "dialogue.json") {
  const manifest = readDialogue(dir, file);
  const missing = missingClips(dir, manifest);
  if (missing.length) throw new Error(`${missing.length} recording(s) named in ${file} are missing from ${dir}:\n  ${missing.join("\n  ")}\nA character with no recording can get a voice made from text: TTS.md, "Adding a voice to a story".`);
  const ff = findFfmpeg();
  if (!ff) throw new Error("Dialogue assembly requires FFmpeg.");
  const base = realpathSync(dir), rate = DIALOGUE_RATE;
  const audio = manifest.clips.map((c, i) => {
    const path = realpathSync(resolve(base, c.file)), rel = relative(base, path);
    if (rel.startsWith("..") || isAbsolute(rel)) throw new Error(`Clip ${i + 1}: audio must be inside the project: ${c.file}`);
    // gainDb is the user's own level choice, for voices recorded louder or quieter than the others
    const level = Number.isFinite(c.gainDb) ? ["-af", `volume=${c.gainDb}dB`] : [];
    const r = spawnSync(ff, ["-v", "error", "-i", path, ...level, "-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1", "-ar", String(rate), "-"], { maxBuffer: 1 << 30 });
    if (r.error || r.status !== 0) throw new Error(`Cannot decode ${c.file}: ${r.error?.message ?? r.stderr?.toString()}`);
    return r.stdout;
  });
  const timeline = sequenceClips(manifest.clips, audio.map((b) => b.length / (rate * 2)));
  const offset = (c) => Math.round(c.start * rate) * 2;
  const data = Buffer.alloc(Math.max(...timeline.map((c, i) => offset(c) + audio[i].length)));
  timeline.forEach((c, i) => audio[i].copy(data, offset(c)));
  const build = join(dir, "build");
  mkdirSync(build, { recursive: true });
  const voice = join(build, "dialogue-voice.wav"), script = join(build, "dialogue-script.json");
  writeFileSync(voice, pcmWav(data, rate));
  writeFileSync(script, JSON.stringify(timeline));
  writeFileSync(join(build, TIMELINE), JSON.stringify(timeline, null, 2));
  return { voice, script, timeline, cast: manifest.cast };
}

/** The assembled timeline, or null when this project has no dialogue.json or it was never planned. */
export function loadTimeline(dir) {
  if (!existsSync(join(dir, "dialogue.json"))) return null;
  const path = join(dir, "build", TIMELINE);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

/** Why the assembled audio no longer matches the recordings, or null when it is up to date. */
export function dialogueStale(dir) {
  const manifestPath = join(dir, "dialogue.json");
  if (!existsSync(manifestPath)) return null;
  const timeline = join(dir, "build", TIMELINE);
  if (!existsSync(timeline)) return "the recordings have not been assembled yet";
  const built = statSync(timeline).mtimeMs;
  if (statSync(manifestPath).mtimeMs > built) return "dialogue.json changed";
  const manifest = readDialogue(dir);
  if (missingClips(dir, manifest).length) return "a recording is missing";
  const changed = manifest.clips.find((c) => statSync(resolve(dir, c.file)).mtimeMs > built);
  return changed ? `${changed.file} changed` : null;
}
