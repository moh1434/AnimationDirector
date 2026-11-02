// Renders build/notes.json (from pretty_midi) to build/music.wav with Tone.js synths,
// using Tone.Offline inside a headless Chromium (Web Audio needs a browser).
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { ROOT, findChrome } from "./env.mjs";

const require = createRequire(join(ROOT, "package.json"));

function wavInt16(chans, sr) {
  const n = chans[0].length, ch = chans.length;
  const buf = Buffer.alloc(44 + n * ch * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * ch * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * ch * 2, 28); buf.writeUInt16LE(ch * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * ch * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { buf.writeInt16LE(chans[c][i], o); o += 2; }
  return buf;
}

// Runs in the page. Keep it self-contained.
async function renderInPage(data, sr) {
  const Tone = window.Tone;
  const dur = data.duration + 3;
  const buffer = await Tone.Offline(async () => {
    const master = new Tone.Compressor({ threshold: -18, ratio: 3 }).toDestination();
    const verb = new Tone.Reverb({ decay: 2.4, wet: 0.22 });
    await verb.generate();
    verb.connect(master);
    const mk = (role) => {
      switch (role) {
        case "pluck": return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.004, decay: 0.28, sustain: 0, release: 0.25 }, volume: -10 }).connect(verb);
        case "marimba": return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3.5, modulationIndex: 6, oscillator: { type: "sine" }, envelope: { attack: 0.002, decay: 0.35, sustain: 0, release: 0.3 }, modulationEnvelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.1 }, volume: -12 }).connect(verb);
        case "bell": return new Tone.PolySynth(Tone.FMSynth, { harmonicity: 7.01, modulationIndex: 2.5, envelope: { attack: 0.003, decay: 1.4, sustain: 0, release: 1.2 }, modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0, release: 0.5 }, volume: -16 }).connect(verb);
        case "piano": return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "fattriangle", spread: 12, count: 3 }, envelope: { attack: 0.005, decay: 0.9, sustain: 0.1, release: 0.8 }, volume: -12 }).connect(verb);
        case "pad": {
          const f = new Tone.Filter(1400, "lowpass").connect(verb);
          const ch = new Tone.Chorus(0.8, 3, 0.4).connect(f);
          ch.start();
          return new Tone.PolySynth(Tone.Synth, { oscillator: { type: "fatsawtooth", spread: 24, count: 3 }, envelope: { attack: 0.7, decay: 0.3, sustain: 0.8, release: 1.6 }, volume: -24 }).connect(ch);
        }
        case "bass": return new Tone.MonoSynth({ oscillator: { type: "triangle" }, filter: { Q: 1, type: "lowpass" }, filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.4, baseFrequency: 180, octaves: 2.5 }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.6, release: 0.2 }, volume: -8 }).connect(master);
        case "kick": return new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0 }, volume: -10 }).connect(master);
        case "tom": return new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 3, envelope: { attack: 0.001, decay: 0.5, sustain: 0 }, volume: -8 }).connect(verb);
        case "snare": {
          const f = new Tone.Filter(2200, "bandpass").connect(master);
          return new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.14, sustain: 0 }, volume: -18 }).connect(f);
        }
        case "hat":
        case "shaker":
        case "crash": {
          const f = new Tone.Filter(role === "crash" ? 5000 : 8000, "highpass").connect(master);
          return new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: role === "crash" ? 0.9 : role === "shaker" ? 0.06 : 0.04, sustain: 0 }, volume: role === "crash" ? -26 : -24 }).connect(f);
        }
        default: return new Tone.PolySynth(Tone.Synth).connect(verb);
      }
    };
    for (const tr of data.tracks) {
      const syn = mk(tr.role);
      const noise = syn instanceof Tone.NoiseSynth;
      const mono = syn instanceof Tone.MonoSynth || syn instanceof Tone.MembraneSynth;
      let lastT = -1;
      const notes = tr.notes.slice().sort((a, b) => a[0] - b[0]);
      for (const [t, d, p, v] of notes) {
        if (t > dur - 0.1) continue;
        const vel = v / 127;
        const tt = t <= lastT + 0.002 ? lastT + 0.003 : t;
        if (noise || mono) lastT = tt;
        if (noise) syn.triggerAttackRelease(d, tt, vel);
        else if (mono) {
          syn.triggerAttackRelease(Tone.Frequency(tr.role === "kick" ? 36 : tr.role === "tom" ? p - 12 : p, "midi").toFrequency(), d, tt, vel);
        } else syn.triggerAttackRelease(Tone.Frequency(p, "midi").toFrequency(), d, t, vel);
      }
    }
  }, dur, 2, sr);
  const chans = [buffer.getChannelData(0), buffer.getChannelData(1)];
  window.__chunks = chans.map((c) => {
    const i16 = new Int16Array(c.length);
    for (let i = 0; i < c.length; i++) i16[i] = Math.max(-32767, Math.min(32767, Math.round(c[i] * 32767)));
    return i16;
  });
  return chans[0].length;
}

export async function renderMusic(buildDir, { sr = 44100 } = {}) {
  const chrome = findChrome();
  if (!chrome) throw new Error("No Chrome/Edge/headless shell found for Tone.js");
  const puppeteer = (await import("puppeteer-core")).default;
  const data = JSON.parse(readFileSync(join(buildDir, "notes.json"), "utf8"));
  const toneJs = readFileSync(join(dirname(require.resolve("tone/package.json")), "build", "Tone.js"), "utf8");
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
  try {
    const page = await browser.newPage();
    await page.setContent("<html><body></body></html>");
    await page.addScriptTag({ content: toneJs });
    const n = await page.evaluate(renderInPage, data, sr);
    const chans = [new Int16Array(n), new Int16Array(n)];
    const CH = 44100 * 20;
    for (let c = 0; c < 2; c++) {
      for (let off = 0; off < n; off += CH) {
        const b64 = await page.evaluate((c, off, CH) => {
          const a = window.__chunks[c].subarray(off, off + CH);
          let s = "";
          const u8 = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
          for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
          return btoa(s);
        }, c, off, CH);
        const bytes = Buffer.from(b64, "base64");
        chans[c].set(new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2), off);
      }
    }
    writeFileSync(join(buildDir, "music.wav"), wavInt16(chans, sr));
    return join(buildDir, "music.wav");
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && process.argv[1].endsWith("tone-render.mjs")) {
  renderMusic(process.argv[2]).then((p) => console.log(p)).catch((e) => { console.error(e); process.exit(1); });
}
