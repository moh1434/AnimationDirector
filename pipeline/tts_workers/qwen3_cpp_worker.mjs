// One take with Qwen3-TTS 1.7B through audio.cpp (GGUF, CUDA; no Python). See TTS.md.
//
// Run:  node qwen3_cpp_worker.mjs <job.json>
// The same job file the Python worker used:
//   {"modelDir", "mode": "clone"|"design", "description" | "reference"+"referenceText", "chunks": [text, ...],
//    "pause", "seed", "options": {"temperature","top_p","top_k","repeat_penalty","max_new_tokens"}, "cooldown", "out"}
// modelDir is TTS_QWEN3_DIR: audiocpp_cli.exe and its DLLs, and models/ with the GGUF packages
//   models/Qwen3-TTS-12Hz-1.7B-Base-GGUF/        clone   (a reference WAV + its exact words)
//   models/Qwen3-TTS-12Hz-1.7B-VoiceDesign-GGUF/ design  (a voice from an English description)
// Each package holds one or more .gguf files; bf16 is used when the package has it (TTS_QWEN3_PRECISION, e.g. q8_0, names another), otherwise q8_0.
// A designed voice changes person between generations, so a design take is ONE chunk; clone takes may be several
// chunks joined with `pause` seconds of digital silence (the pipeline cuts exactly at those gaps).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const jobFile = process.argv[2];
if (!jobFile) { console.error("usage: node qwen3_cpp_worker.mjs <job.json>"); process.exit(2); }
const job = JSON.parse(readFileSync(jobFile, "utf8"));
const root = resolve(job.modelDir);
const mode = job.mode ?? "design";
if (mode !== "design" && mode !== "clone") { console.error(`Unknown mode ${JSON.stringify(mode)} (design or clone)`); process.exit(2); }
const exe = join(root, "audiocpp_cli.exe");
const pkg = join(root, "models", mode === "design" ? "Qwen3-TTS-12Hz-1.7B-VoiceDesign-GGUF" : "Qwen3-TTS-12Hz-1.7B-Base-GGUF");
if (!existsSync(exe)) { console.error(`No audiocpp_cli.exe in ${root}`); process.exit(2); }
const ggufs = existsSync(pkg) ? readdirSync(pkg).filter((f) => /\.gguf$/i.test(f)) : [];
const want = (process.env.TTS_QWEN3_PRECISION || "bf16").toLowerCase();
const model = ggufs.find((f) => f.toLowerCase().includes(want)) ?? ggufs.find((f) => /q8_0/i.test(f)) ?? ggufs[0];
if (!model) { console.error(`No Qwen3-TTS ${mode === "design" ? "VoiceDesign" : "Base (clone)"} GGUF in ${pkg}`); process.exit(2); }

const o = job.options ?? {};
const seed = Number.isInteger(job.seed) ? job.seed : 1234;
const flags = (extra) => {
  const a = ["--task", "tts", "--family", "qwen3_tts", "--model", join(pkg, model), "--backend", "cuda", "--language", "English", ...extra];
  if (o.temperature != null) a.push("--temperature", String(o.temperature));
  if (o.top_k != null) a.push("--top-k", String(o.top_k));
  if (o.top_p != null) a.push("--top-p", String(o.top_p));
  const rp = o.repeat_penalty ?? o.repetition_penalty;
  if (rp != null) a.push("--repetition-penalty", String(rp));
  a.push("--max-tokens", String(o.max_new_tokens ?? 4096));
  return a;
};

/** Mono 16-bit PCM samples of a WAV the CLI wrote (24 kHz, 16-bit); returns { rate, pcm: Int16Array }. */
function readWav(file) {
  const b = readFileSync(file);
  let p = 12, fmt = null;
  while (p + 8 <= b.length) {
    const id = b.toString("ascii", p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === "fmt ") fmt = { format: b.readUInt16LE(p + 8), channels: b.readUInt16LE(p + 10), rate: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    if (id === "data") {
      if (!fmt || fmt.format !== 1 || fmt.bits !== 16 || fmt.channels !== 1) throw new Error(`Unexpected audio format in ${file}: ${JSON.stringify(fmt)}`);
      const d = b.subarray(p + 8, p + 8 + Math.min(size, b.length - p - 8));
      return { rate: fmt.rate, pcm: new Int16Array(d.buffer.slice(d.byteOffset, d.byteOffset + (d.length & ~1))) };
    }
    p += 8 + size + (size & 1);
  }
  throw new Error(`No audio data in ${file}`);
}
function writeWav(file, pcm, rate) {
  const h = Buffer.alloc(44), n = pcm.length * 2;
  h.write("RIFF", 0); h.writeUInt32LE(36 + n, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(n, 40);
  writeFileSync(file, Buffer.concat([h, Buffer.from(pcm.buffer, pcm.byteOffset, n)]));
}

const tmp = job.out.replace(/\.wav$/i, "") + ".chunks";
mkdirSync(tmp, { recursive: true });
const pieces = []; let rate = 24000, total = 0;
for (let i = 0; i < job.chunks.length; i++) {
  if (i && Number(job.cooldown) > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.min(Number(job.cooldown), 3) * 1000);
  const t = Date.now(), part = join(tmp, `chunk-${i + 1}.wav`);
  const extra = ["--text", job.chunks[i], "--seed", String(seed + i), "--out", part];
  if (mode === "clone") extra.push("--voice-ref", job.reference, "--reference-text", job.referenceText);
  else extra.push("--instruct", job.description ?? "");
  const r = spawnSync(exe, flags(extra), { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 1 << 26 });
  if (r.status !== 0 || !existsSync(part)) { console.error(`audiocpp_cli failed (exit ${r.status}) on chunk ${i + 1}:\n${String(r.stderr || r.stdout).split(/\r?\n/).filter((l) => !/graph warmup/.test(l)).slice(-15).join("\n")}`); process.exit(1); }
  const w = readWav(part); rate = w.rate;
  if (pieces.length) pieces.push(new Int16Array(Math.round(rate * Number(job.pause ?? 0.35))));
  pieces.push(w.pcm); total += w.pcm.length;
  console.log(`chunk ${i + 1}/${job.chunks.length}: ${(w.pcm.length / rate).toFixed(1)}s audio in ${((Date.now() - t) / 1000).toFixed(1)}s`);
}
const all = new Int16Array(pieces.reduce((n, p) => n + p.length, 0));
let at = 0; for (const p of pieces) { all.set(p, at); at += p.length; }
mkdirSync(dirname(job.out), { recursive: true });
writeWav(job.out, all, rate);
rmSync(tmp, { recursive: true, force: true });
