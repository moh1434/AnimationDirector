// Turns the user's script + timings into clean, validated segments.
import { readFileSync, existsSync } from "node:fs";

const TIME = String.raw`(?:\d{1,2}:)?(?:\d{1,2}:)?\d{1,5}(?:[.,]\d+)?`;
const isTime = (s) => new RegExp(`^\\s*${TIME}\\s*$`).test(s ?? "");

export function parseTime(s) {
  s = String(s).trim().replace(",", ".");
  const parts = s.split(":").map(Number);
  if (parts.some((p) => Number.isNaN(p))) throw new Error(`Bad time "${s}"`);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export const detectLanguage = (text) => {
  const ar = (text.match(/[؀-ۿ]/g) ?? []).length;
  const lat = (text.match(/[A-Za-z]/g) ?? []).length;
  return ar > lat ? "ar" : "en";
};

function parseSrt(txt) {
  const blocks = txt.replace(/\r/g, "").split(/\n\s*\n/);
  const out = [];
  for (const b of blocks) {
    const lines = b.split("\n").filter(Boolean);
    const i = lines.findIndex((l) => l.includes("-->"));
    if (i < 0) continue;
    const [a, z] = lines[i].split("-->").map((x) => x.trim().split(/\s+/)[0]);
    out.push({ start: parseTime(a), end: parseTime(z), text: lines.slice(i + 1).join(" ").replace(/<[^>]+>/g, "").trim() });
  }
  return out;
}

function parseLines(txt) {
  const segs = [];
  const story = [];
  const re = new RegExp(String.raw`^\s*\[?\s*(${TIME})\s*(?:-->|–|—|-|to)\s*(${TIME})\s*\]?\s*[:|\-–]?\s*(.*)$`);
  const reStart = new RegExp(String.raw`^\s*\[\s*(${TIME})\s*\]\s*(.*)$`);
  for (const raw of txt.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) {
      story.push("");
      continue;
    }
    const bars = line.split("|").map((x) => x.trim());
    if (bars.length >= 2 && isTime(bars[0])) {
      if (bars.length >= 3 && isTime(bars[1])) segs.push({ start: parseTime(bars[0]), end: parseTime(bars[1]), text: bars.slice(2).join(" | ") });
      else if (isTime(bars[1])) segs.push({ start: parseTime(bars[0]), end: parseTime(bars[1]), text: "" });
      else segs.push({ start: parseTime(bars[0]), end: null, text: bars.slice(1).join(" | ") });
      continue;
    }
    let m = line.match(re);
    if (m) {
      segs.push({ start: parseTime(m[1]), end: parseTime(m[2]), text: m[3].trim() });
      continue;
    }
    m = line.match(reStart);
    if (m) {
      segs.push({ start: parseTime(m[1]), end: null, text: m[2].trim() });
      continue;
    }
    story.push(line);
  }
  // paragraphs of plain text (used when timing lines carry no text)
  const paragraphs = story.join("\n").split(/\n\s*\n/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
  return { segs, paragraphs };
}

/**
 * Accepts: JSON ([{start,end,text}] or {segments:[...]}), SRT, or text lines such as
 *   0 | 4.5 | Text          0:00-0:04.5 Text          [00:04.5] Text (start only)
 *   0 | 4.5                 (timing only; text comes from the story paragraphs in the same file or story.txt)
 */
export function parseScript(file, { storyFile, audioDuration } = {}) {
  const txt = readFileSync(file, "utf8").replace(/^﻿/, "");
  let segs;
  const warnings = [];
  const trimmed = txt.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const j = JSON.parse(trimmed);
    segs = (Array.isArray(j) ? j : j.segments).map((s) => ({ ...s, start: typeof s.start === "string" ? parseTime(s.start) : s.start, end: s.end == null ? null : typeof s.end === "string" ? parseTime(s.end) : s.end, text: s.text ?? "" }));
  } else if (/-->/.test(txt) && /^\d+\s*$/m.test(txt)) {
    segs = parseSrt(txt);
  } else {
    const { segs: s, paragraphs } = parseLines(txt);
    segs = s;
    let paras = paragraphs;
    if (storyFile && existsSync(storyFile) && segs.some((x) => !x.text)) {
      paras = readFileSync(storyFile, "utf8").replace(/\r/g, "").split(/\n\s*\n/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
    }
    if (segs.length && segs.every((x) => !x.text)) {
      if (paras.length === segs.length) segs.forEach((x, i) => (x.text = paras[i]));
      else if (paras.length) {
        // distribute sentences of the story over the timed segments by duration
        const sentences = paras.join(" ").split(/(?<=[.!?؟])\s+/).filter(Boolean);
        warnings.push(`Story has ${paras.length} paragraphs but there are ${segs.length} timing lines; sentences were spread over the segments by length. Check storyboard.json.`);
        const total = segs.reduce((a, s, i) => a + ((s.end ?? segs[i + 1]?.start ?? s.start + 3) - s.start), 0);
        let k = 0, acc = 0;
        segs.forEach((s, i) => {
          const d = (s.end ?? segs[i + 1]?.start ?? s.start + 3) - s.start;
          acc += d;
          const want = Math.round((acc / total) * sentences.length);
          s.text = sentences.slice(k, Math.max(k + 1, want)).join(" ");
          k = Math.max(k + 1, want);
        });
      }
    }
    if (!segs.length && paras.length) throw new Error("No timings found. Add lines like `0 | 4.5 | text` (see projects/_template/script.txt).");
  }
  if (!segs.length) throw new Error(`No segments found in ${file}`);

  segs.sort((a, b) => a.start - b.start);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (s.end == null) s.end = segs[i + 1]?.start ?? audioDuration ?? s.start + 4;
    if (s.end <= s.start) throw new Error(`Segment ${i + 1} ends (${s.end}s) before it starts (${s.start}s).`);
    if (i > 0 && s.start < segs[i - 1].end - 0.05) {
      warnings.push(`Segment ${i} and ${i + 1} overlap (${segs[i - 1].end}s > ${s.start}s); the earlier one was shortened.`);
      segs[i - 1].end = s.start;
    }
    s.text = (s.text ?? "").replace(/\s+/g, " ").trim();
  }
  if (audioDuration) {
    const last = segs[segs.length - 1];
    if (last.end > audioDuration + 0.25) {
      warnings.push(`Last segment ends at ${last.end}s but the voice is ${audioDuration.toFixed(2)}s long; clipped to the voice.`);
      last.end = audioDuration;
    }
    segs = segs.filter((s) => s.start < audioDuration - 0.05);
    if (segs[0].start > 0.4) warnings.push(`The first segment starts at ${segs[0].start}s; the opening will hold the first picture.`);
  }
  return { segments: segs.map((s) => ({ start: +s.start.toFixed(3), end: +s.end.toFixed(3), text: s.text, ...(s.title ? { title: s.title } : {}) })), warnings };
}
