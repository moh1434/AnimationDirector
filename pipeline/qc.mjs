// Final pass on a rendered MP4: format, duration, black stretches, frozen stretches,
// loudness and true peak, plus a one-frame-per-second sheet to look at.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { findFfmpeg } from "./env.mjs";

export function qcVideo(file, { width, height, fps = 30, duration, lufs = -14, truePeak = -1, sheet }) {
  const ff = findFfmpeg("ffmpeg"), fp = findFfmpeg("ffprobe");
  const res = { file, checks: [] };
  const add = (name, ok, detail) => res.checks.push({ name, ok, detail });
  if (!ff || !fp) { add("tools", false, "ffmpeg/ffprobe not found"); return res; }
  const pr = spawnSync(fp, ["-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", file], { encoding: "utf8" });
  const j = JSON.parse(pr.stdout || "{}");
  const v = (j.streams ?? []).find((s) => s.codec_type === "video");
  const a = (j.streams ?? []).find((s) => s.codec_type === "audio");
  const dur = parseFloat(j.format?.duration ?? "0");
  const [n, d] = (v?.r_frame_rate ?? "0/1").split("/").map(Number);
  add("format", v && (!width || (v.width === width && v.height === height)) && Math.abs(n / d - fps) < 0.01, `${v?.width}×${v?.height} @ ${(n / d).toFixed(2)} fps`);
  add("audio", !!a, a ? "audio stream present" : "no audio stream");
  if (duration) add("duration", Math.abs(dur - duration) <= Math.max(0.15, duration * 0.02), `${dur.toFixed(2)} s (expected ${duration.toFixed(2)} s)`);
  // black / frozen picture
  const bf = spawnSync(ff, ["-hide_banner", "-nostats", "-i", file, "-vf", "blackdetect=d=0.25:pix_th=0.08,freezedetect=n=0.0008:d=2.5", "-an", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const log = bf.stderr ?? "";
  const blacks = [...log.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
  const freezes = [...log.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_end: ([\d.]+)/g)].map((m) => [+m[1], +m[2]]);
  add("black", bf.status === 0 && blacks.length === 0, bf.status !== 0 ? "check could not run; use a full FFmpeg build with blackdetect/freezedetect" : blacks.length ? `black at ${blacks.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)}s`).join(", ")}` : "no black stretches");
  add("frozen", bf.status === 0 && freezes.length === 0, bf.status !== 0 ? "check could not run; use a full FFmpeg build with blackdetect/freezedetect" : freezes.length ? `frozen picture at ${freezes.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)}s`).join(", ")} (fine only if it is a designed hold)` : "picture keeps moving");
  // loudness
  const lr = spawnSync(ff, ["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const sum = (lr.stderr ?? "").split("Summary:").pop() ?? "";
  const I = parseFloat((sum.match(/I:\s+(-?[\d.]+) LUFS/) ?? [])[1]);
  const TP = parseFloat((sum.match(/Peak:\s+(-?[\d.]+) dBFS/) ?? [])[1]);
  add("loudness", lr.status === 0 && Math.abs(I - lufs) <= 1, Number.isFinite(I) ? `${I} LUFS integrated (target ${lufs})` : "measurement unavailable; use a full FFmpeg build with ebur128");
  add("true-peak", lr.status === 0 && TP <= truePeak + 0.05, Number.isFinite(TP) ? `${TP} dBTP (ceiling ${truePeak})` : "measurement unavailable; use a full FFmpeg build with ebur128");
  if (sheet && dur > 0) {
    const cols = width && height && height > width ? 10 : 6;
    const count = Math.max(1, Math.round(dur));
    const sr = spawnSync(ff, ["-hide_banner", "-loglevel", "error", "-y", "-i", file, "-vf", `fps=${count / dur},scale=${height > width ? 200 : 320}:-2,tile=${cols}x${Math.ceil(count / cols)}:padding=4:color=white`, "-frames:v", "1", "-update", "1", sheet], { encoding: "utf8" });
    if (sr.status === 0) res.sheet = sheet;
    else add("sheet", false, "contact sheet failed; an existing sheet may be stale");
  }
  res.ok = res.checks.every((c) => c.ok);
  return res;
}

export function qcMarkdown(results) {
  const lines = ["# Final pass", ""];
  for (const r of results) {
    lines.push(`## ${r.file.split(/[\\/]/).pop()} — ${r.ok ? "PASS" : "CHECK"}`);
    for (const c of r.checks) lines.push(`- ${c.ok ? "✔" : "✖"} **${c.name}**: ${c.detail}`);
    if (r.sheet) lines.push(`- frame sheet (1 per second): \`${r.sheet.split(/[\\/]/).slice(-2).join("/")}\` — look at every frame`);
    lines.push("");
  }
  lines.push("Machine checks only. Also look at the sheet, at three full-size frames from the busiest moments, and read every word on screen.");
  return lines.join("\n");
}

export const writeQc = (path, results) => writeFileSync(path, qcMarkdown(results), "utf8");
