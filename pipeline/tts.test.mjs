import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { alignLines, keepsRecordings, makeReference, makeTakes, parseLines, parsePicks, pickTakes, readPcm, readVoicePlan, splitTake, digitalGaps, takeChunks, takeCommand, takeRequests, settingsProblems, ttsSettings, DESIGN_TEXT } from "./tts.mjs";
import { mkdirSync } from "node:fs";
import { pcmWav } from "./dialogue.mjs";

// Synthetic audio only: tones stand in for speech, and "heard" lists stand in for whisper.cpp.
const RATE = 48000;
function tones(spans, duration) {
  const pcm = new Int16Array(Math.round(duration * RATE));
  for (const [a, b] of spans) for (let i = Math.round(a * RATE); i < Math.round(b * RATE); i++) pcm[i] = Math.round(8000 * Math.sin(i / 7));
  return pcm;
}
const wavOf = (pcm) => pcmWav(Buffer.from(pcm.buffer), RATE);
/** Words spread evenly over a span, with whisper's habit of stretching a word's end into the pause. */
const sayWords = (text, a, b) => {
  const w = text.split(/\s+/), step = (b - a) / w.length;
  return w.map((x, i) => ({ w: x, s: a + i * step, e: a + (i + 1) * step + (i === w.length - 1 ? 0.25 : 0) }));
};
/** The job a worker would read: the last argument of the command is its job file. */
const jobOf = (args) => JSON.parse(readFileSync(args.at(-1), "utf8"));
const SETTINGS = { uv: "uv", dirs: { audar: "C:/models/audar-turbo", qwen3: "C:/models/qwen3-tts" }, errors: [], engineErrors: {} };

function project(plan) {
  const dir = mkdtempSync(join(tmpdir(), "tts-test-"));
  writeFileSync(join(dir, "tts.json"), JSON.stringify(plan));
  return dir;
}
const STORY = {
  language: "en", takes: 2,
  voices: { ali: { description: "A warm young man with a clear voice" }, ahmed: { description: "A deep, low-pitched older man, calm" } },
  lines: [
    { who: "ali", text: "Hello Ahmed." },
    { who: "ahmed", text: "Hello Ali, how are you?" },
    { who: "ali", text: "I am fine, thank you!", say: "I am fine... thank you!" },
    { who: "dog", text: "[bark]" },
  ],
};

test("a plan keeps the script's words: only tags and punctuation may change", () => {
  const dir = project({ ...STORY, lines: [{ who: "ali", text: "I am fine.", say: "I am very fine!" }, { who: "ali", text: "Yes.", say: "[laughs] Yes." }, { who: "sam", text: "Hi." }] });
  assert.throws(() => readVoicePlan(dir), (err) => {
    assert.match(err.message, /line 1: "say" must keep the script's exact words/);
    assert.match(err.message, /Qwen3-TTS has no inline tags such as \[laughs\]/);
    assert.match(err.message, /line 3: no voice for "sam"/);
    return true;
  });
  const ok = readVoicePlan(project(STORY));
  assert.equal(ok.lines.length, 4);
});

test("an English description is designed by Qwen3-TTS: the whole take in one generation", () => {
  const dir = project(STORY), plan = readVoicePlan(dir);
  const reqs = takeRequests(plan, dir);
  assert.deepEqual(reqs.map((r) => `${r.who}${r.take}:${r.engine}:${r.seed}`), ["ali1:qwen3:11", "ali2:qwen3:22", "ahmed1:qwen3:11", "ahmed2:qwen3:22"]);
  assert.deepEqual(reqs[0].chunks, ["Hello Ahmed.\nI am fine... thank you!"], "one chunk: a designed voice changes between generations");
  assert.notEqual(reqs[0].key, reqs[1].key);
  const cmd = takeCommand(SETTINGS, dir, reqs[0], join(dir, "out.wav"));
  assert.deepEqual(cmd.args.slice(0, 6), ["run", "--no-sync", "--project", "C:/models/qwen3-tts", "python", "-I"]);
  assert.match(cmd.args[6], /qwen3_worker\.py$/);
  assert.equal(cmd.args[7], cmd.jobFile);
  assert.deepEqual({ mode: cmd.job.mode, description: cmd.job.description, seed: cmd.job.seed }, { mode: "design", description: "A warm young man with a clear voice", seed: 11 });
});

test("Audar clones a reference in chunks of whole lines; tags and languages are checked per engine", () => {
  const dir = project(STORY);
  writeFileSync(join(dir, "ali.wav"), "x");
  // an English clone defaults to Qwen3-TTS (it has no tags), so this voice asks for Audar
  const ali = { reference: "ali.wav", referenceText: "Hello there, my friend.", engine: "audar" };
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...STORY, voices: { ...STORY.voices, ali: { reference: "ali.wav", referenceText: "Hello there, my friend." } } }));
  assert.equal(readVoicePlan(dir).voices.ali.engine, "qwen3", "an English reference is cloned by Qwen3-TTS by default");
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...STORY, language: "ar", voices: { ...STORY.voices, ali: { reference: "ali.wav", referenceText: "Hello there, my friend." }, ahmed: { reference: "ali.wav", referenceText: "Hello there, my friend." } } }));
  assert.equal(readVoicePlan(dir).voices.ali.engine, "audar", "an Arabic video clones with Audar");
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...STORY, lines: [{ who: "ali", text: "Hi.", say: "[excited] Hi." }, { who: "ahmed", text: "Hi." }], voices: { ...STORY.voices, ali: { reference: "ali.wav", referenceText: "Hello there, my friend." } } }));
  assert.throws(() => readVoicePlan(dir), /Qwen3-TTS has no inline tags such as \[excited\]; give the voice "engine": "audar"/);
  const plan = (voice, extra = {}) => { writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...STORY, ...extra, voices: { ...STORY.voices, ali: voice } })); return readVoicePlan(dir); };
  const errorsOf = (voice, extra) => { try { plan(voice, extra); return ""; } catch (e) { return e.message; } };
  const long = "This sentence is here to fill up a chunk with enough words to matter.";
  const lines = [...Array(8)].map((_, i) => ({ who: "ali", text: `${i + 1}. ${long}`, ...(i === 0 && { say: `[excited] ${i + 1}. ${long}` }) })).concat([{ who: "ahmed", text: "Hi." }]);
  const p = plan(ali, { lines });
  assert.equal(p.voices.ali.engine, "audar", "a voice can ask for Audar");
  const r = takeRequests(p, dir).find((x) => x.who === "ali");
  assert.ok(r.chunks.length >= 3 && r.chunks.every((c) => c.length <= 240), JSON.stringify(r.chunks.map((c) => c.length)));
  assert.equal(r.chunks.join(" ").split(/\d\. /).length - 1, 8, "every line is in exactly one chunk, whole");
  const job = takeCommand(SETTINGS, dir, r, join(dir, "o.wav")).job;
  assert.deepEqual([job.mode, job.reference, job.referenceText, job.modelDir], ["clone", join(dir, "ali.wav"), "Hello there, my friend.", "C:/models/audar-turbo"]);
  assert.match(errorsOf(ali, { lines: [{ who: "ali", text: "Yes.", say: "[laughing] Yes." }, { who: "ahmed", text: "Hi." }] }), /\[laughing\] is not a Audar-TTS Turbo tag/);
  assert.match(errorsOf({ reference: "ali.wav" }), /needs "referenceText"/);
  assert.match(errorsOf({ ...ali, style: "happy" }), /"style" was a CosyVoice3 setting/);
  assert.match(errorsOf({ engine: "qwen3", description: "A man" }, { language: "ar", lines: [{ who: "ali", text: "مرحبا" }, { who: "ahmed", text: "أهلا" }] }), /Qwen3-TTS does not speak "ar"/);
  assert.match(errorsOf({ engine: "vox" }), /unknown engine "vox"/);
  // Qwen3-TTS clones English (the default): a clone job with the reference and its words, chunked like Audar's
  assert.equal(errorsOf({ ...ali, engine: "qwen3" }), "");
  const q = takeCommand(SETTINGS, dir, { who: "ali", engine: "qwen3", voice: { ...ali, engine: "qwen3" }, chunks: ["Hi."], options: { seed: 5, temperature: 0.9, repeat_penalty: 1.1 } }, join(dir, "o.wav"));
  assert.deepEqual([q.job.mode, q.job.referenceText, q.job.seed, q.job.options], ["clone", "Hello there, my friend.", 5, { temperature: 0.9, repeat_penalty: 1.1 }]);
  assert.match(q.args.at(-2), /qwen3_worker\.py$/);
  assert.match(errorsOf({ ...ali, engine: "qwen3" }, { language: "ar", lines: [{ who: "ali", text: "مرحبا" }, { who: "ahmed", text: "أهلا" }] }), /Qwen3-TTS does not speak "ar"/);
});

test("an Arabic description: Qwen3-TTS designs an English reference first, then Audar clones it", async () => {
  const dir = project({ language: "ar", takes: 2, voices: { sara: { description: "A bright, friendly young woman" } }, lines: [{ who: "sara", text: "مرحبا يا أحمد." }, { who: "sara", text: "كيف حالك؟" }] });
  const plan = readVoicePlan(dir);
  assert.equal(plan.voices.sara.engine, "audar");
  assert.equal(plan.voices.sara.designWith, "qwen3");
  const runs = [];
  const run = async (_exe, args) => { const job = jobOf(args); runs.push(`${basename(args[6])}:${job.mode}`); writeFileSync(job.out, wavOf(tones([[0.1, 0.9], [1.3, 2.0]], 2.4))); if (job.mode === "clone") assert.equal(job.referenceText, DESIGN_TEXT); };
  const hear = () => [...sayWords("مرحبا يا أحمد.", 0.1, 0.9), ...sayWords("كيف حالك؟", 1.3, 2.0)];
  const r = await makeTakes(dir, { run, hear, settings: SETTINGS, log: () => {} });
  assert.deepEqual(runs, ["qwen3_worker.py:design", "audar_worker.py:clone", "qwen3_worker.py:design", "audar_worker.py:clone"]);
  assert.ok(r.takes.every((t) => t.designedReference && !t.failed));
  assert.deepEqual(r.takes.map((t) => [t.engine, t.design.engine, t.design.settings.seed]), [["audar", "qwen3", 11], ["audar", "qwen3", 22]]);
  assert.equal(r.takes[0].design.description, "A bright, friendly young woman");
  assert.equal(r.takes[0].design.text, DESIGN_TEXT);
  await makeTakes(dir, { run, hear, settings: SETTINGS, log: () => {} });
  assert.equal(runs.length, 4, "nothing is made again");
});

test("whisper's words are matched to lines; missing and extra words are reported", () => {
  const lines = [{ text: "Nice doggy." }, { text: "Please be quiet." }];
  const heard = [{ w: "Nice", s: 0, e: 0.3 }, { w: "doggie.", s: 0.3, e: 0.8 }, { w: "Please,", s: 1, e: 1.2 }, { w: "please", s: 1.2, e: 1.3 }, { w: "be", s: 1.3, e: 1.4 }, { w: "quiet.", s: 1.4, e: 1.9 }];
  const [a, b] = alignLines(lines, heard);
  assert.deepEqual(a.missing, ["doggy"]);
  assert.equal(b.heard, 3);
  assert.equal(b.extra, 1);
});

test("a take is cut in the pauses between lines and each clip is trimmed to its speech", () => {
  const lines = [{ text: "one two three" }, { text: "four five" }, { text: "six" }];
  const pcm = tones([[0.2, 1.0], [1.5, 2.6], [3.0, 3.6]], 4);
  const heard = [...sayWords("one two three", 0.2, 1.0), ...sayWords("four five", 1.5, 2.6), ...sayWords("six", 3.0, 3.6)];
  const { clips, problems } = splitTake(pcm, lines, heard);
  assert.deepEqual(problems, []);
  const near = (x, y) => Math.abs(x - y) < 0.06;
  assert.ok(near(clips[0].start, 0.15) && clips[0].end > 1.0 && clips[0].end < 1.5, JSON.stringify(clips[0]));
  assert.ok(clips[1].start > 1.0 && near(clips[1].start, 1.45) && clips[1].end < 3.0);
  assert.ok(clips[2].start > 2.6 && near(clips[2].end, 3.75));
  // the next line's speech is never inside the previous clip
  assert.ok(clips[0].end <= 1.5 && clips[1].end <= 3.0);
});

test("whisper's late word times do not pull the cut into the next line's own pause", () => {
  // measured on a real take: "…full of gold!" | "Spiders! Run!", whisper about 0.1–0.2 s late
  const lines = [{ text: "Ahmed! Come and look at this!" }, { text: "A treasure box! I think it is full of gold." }, { text: "Spiders! Run!" }];
  const pcm = tones([[0, 0.65], [0.76, 1.3], [1.37, 1.7], [1.76, 2.89], [3.03, 4.4], [4.48, 4.62], [4.68, 5.22], [5.37, 5.86]], 6.1);
  const t = [[0.03, 0.5, "Ahmed!"], [0.5, 0.76, "Come"], [0.76, 0.9, "and"], [0.9, 1.13, "look"], [1.13, 1.24, "at"], [1.24, 1.63, "this!"], [1.63, 1.91, "A"], [1.91, 2.33, "treasure"], [2.33, 2.74, "box!"], [2.74, 2.83, "I"], [2.83, 3.21, "think"], [3.21, 3.34, "it"], [3.34, 3.46, "is"], [3.46, 3.74, "full"], [3.74, 3.97, "of"], [3.97, 4.49, "gold!"], [4.49, 5.4, "Spiders,"], [5.4, 5.74, "run!"]];
  const { clips } = splitTake(pcm, lines, t.map(([s, e, w]) => ({ w, s, e })));
  assert.ok(clips[1].end <= 4.48 && clips[2].start >= 4.4 && clips[2].start < 4.5, JSON.stringify(clips));
  assert.ok(clips[0].end <= 1.76 && clips[1].start >= 1.7);
});

test("takes are made once, reused, and an older take is kept in old/ when the voice changes", async () => {
  const dir = project(STORY);
  let calls = 0;
  const pcm = tones([[0.1, 0.8], [1.2, 2.4]], 2.8);
  const run = async (_exe, args) => { calls++; writeFileSync(jobOf(args).out, wavOf(pcm)); };
  const hear = () => [...sayWords("Hello Ahmed.", 0.1, 0.8), ...sayWords("I am fine, thank you!", 1.2, 2.4)];
  const r = await makeTakes(dir, { only: ["ali"], run, hear, settings: SETTINGS, log: () => {} });
  assert.equal(calls, 2);
  assert.equal(r.takes[0].check.summary, "all 2 line(s) heard");
  assert.ok(readFileSync(r.review, "utf8").includes("ali/take-1.wav"));
  assert.ok(!readdirSync(join(dir, "voice-takes", "en", "ali")).some((f) => f.endsWith(".job.json")), "job files are removed");
  await makeTakes(dir, { only: ["ali"], run, hear, settings: SETTINGS, log: () => {} });
  assert.equal(calls, 2, "unchanged takes are not generated again");
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...STORY, voices: { ...STORY.voices, ali: { description: "A shy boy" } } }));
  await makeTakes(dir, { only: ["ali"], run, hear, settings: SETTINGS, log: () => {} });
  assert.equal(calls, 4);
  assert.equal(readdirSync(join(dir, "voice-takes", "en", "ali", "old")).filter((f) => f.endsWith(".wav")).length, 2);
});

test("a failed generation is reported and the other takes go on", async () => {
  const dir = project(STORY);
  let n = 0;
  const run = async (_exe, args) => { if (n++ === 0) throw new Error("uv exited with code 1:\nCUDA out of memory"); writeFileSync(jobOf(args).out, wavOf(tones([[0.1, 0.8], [1.2, 2.4]], 2.8))); };
  const r = await makeTakes(dir, { only: ["ali"], run, hear: () => [], settings: SETTINGS, log: () => {} });
  assert.match(r.takes[0].failed, /CUDA out of memory/);
  assert.ok(!r.takes[1].failed);
  await assert.rejects(makeTakes(project(STORY), { settings: { ...SETTINGS, errors: ["uv is not found (uv)."] }, run, log: () => {} }), /voice settings in \.env need fixing:\n  - uv is not found/);
});

async function madeStory() {
  const dir = project(STORY);
  const ali = tones([[0.1, 0.8], [1.2, 2.4]], 2.8), ahmed = tones([[0.1, 1.6]], 2);
  const run = async (_exe, args) => { const job = jobOf(args); writeFileSync(job.out, wavOf(job.description.startsWith("A warm") ? ali : ahmed)); };
  const hear = (wav) => (wav.includes("ali") ? [...sayWords("Hello Ahmed.", 0.1, 0.8), ...sayWords("I am fine, thank you!", 1.2, 2.4)] : sayWords("Hello Ali, how are you?", 0.1, 1.6));
  await makeTakes(dir, { run, hear, settings: SETTINGS, log: () => {} });
  return dir;
}

test("picking takes writes one recording per line in script order, and never overwrites the user's files", async () => {
  const dir = await madeStory();
  assert.throws(() => pickTakes(dir, { ali: 1 }), /Pick a take for: ahmed/);
  writeFileSync(join(dir, "dialogue.json"), JSON.stringify({ clips: [{ who: "x", file: "mine.wav", text: "Mine." }] }));
  assert.throws(() => pickTakes(dir, { ali: 2, ahmed: 1 }), /not made by voice-pick/);
  const r = pickTakes(dir, { ali: 2, ahmed: 1 }, { replace: true, hear: () => null });
  assert.equal(r.mode, "dialogue");
  assert.deepEqual(r.sounds, ["voices/04-dog.wav"]);
  const d = JSON.parse(readFileSync(join(dir, "dialogue.json"), "utf8"));
  assert.deepEqual(d.clips.map((c) => `${c.who}:${c.file}`), ["ali:voices/01-ali.wav", "ahmed:voices/02-ahmed.wav", "ali:voices/03-ali.wav", "dog:voices/04-dog.wav"]);
  assert.equal(d.clips[2].text, "I am fine, thank you!", "captions use the script's words, not the spoken form");
  const first = readPcm(join(dir, "voices", "01-ali.wav")).length / RATE, third = readPcm(join(dir, "voices", "03-ali.wav")).length / RATE;
  assert.ok(first > 0.7 && first < 1.0 && third > 1.1 && third < 1.45, `${first} ${third}`);
  // the director adds the cast afterwards; picking again keeps it
  writeFileSync(join(dir, "dialogue.json"), JSON.stringify({ ...d, cast: { ali: { preset: "kid" } } }));
  const again = pickTakes(dir, { ali: 1, ahmed: 2 }, { hear: (f) => ["Hello Ahmed. I", "Hello Ali, how are you?", "I am fine, thank you!"].slice(0, f.length) });
  assert.match(again.problems.join("\n"), /line 1 \(ali\) sounds like "Hello Ahmed. I": it has "i" from line 3/);
  assert.equal(again.problems.length, 1, again.problems.join("\n"));
  assert.ok(again.verified);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, "dialogue.json"), "utf8")).cast, { ali: { preset: "kid" } });
  // a take from an older description cannot be picked
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...STORY, voices: { ...STORY.voices, ahmed: { description: "Someone else" } } }));
  assert.throws(() => pickTakes(dir, { ali: 1, ahmed: 1 }), /older tts\.json/);
});

test("one voice for the whole script keeps the take whole as voice.wav + script.txt", async () => {
  const dir = project({ language: "en", takes: 1, voices: { narrator: { description: "A calm storyteller" } }, lines: [{ who: "narrator", text: "Meet Bob." }, { who: "narrator", text: "He is a thief." }] });
  const pcm = tones([[0.2, 0.9], [1.4, 2.2]], 2.6);
  await makeTakes(dir, { run: async (_e, a) => writeFileSync(jobOf(a).out, wavOf(pcm)), hear: () => [...sayWords("Meet Bob.", 0.2, 0.9), ...sayWords("He is a thief.", 1.4, 2.2)], settings: SETTINGS, log: () => {} });
  const r = pickTakes(dir, { narrator: 1 }, { hear: () => null });
  assert.equal(r.mode, "narration");
  assert.equal(readPcm(join(dir, "voice.wav")).length, pcm.length);
  const rows = readFileSync(join(dir, "script.txt"), "utf8").split("\n").filter((l) => /^\d/.test(l));
  assert.match(rows[0], /^0\.15 \| 1\.\d\d \| Meet Bob\.$/);
  assert.match(rows[1], /\| He is a thief\.$/);
  assert.ok(existsSync(join(dir, "voice-takes", "en", "picked.json")));
});

test("scripts written as 'Who: words' and picks written as who=take", () => {
  assert.deepEqual(parseLines("# cast\nAli: Hello!\nOld Man: Hi: there.\n"), [{ who: "ali", text: "Hello!" }, { who: "old_man", text: "Hi: there." }]);
  assert.deepEqual(parsePicks(["ali=2", "ahmed=1,dog=3"]), { ali: 2, ahmed: 1, dog: 3 });
  assert.throws(() => parsePicks(["ali"]), /who=take/);
});

test("a picked take becomes a reference and a library voice that later videos clone", async () => {
  const dir = await madeStory(), library = mkdtempSync(join(tmpdir(), "voices-library-"));
  const r = makeReference(dir, "ali", 1, { save: "ali", library });
  assert.deepEqual(r.lines, [1, 3]);
  assert.equal(r.referenceText, "Hello Ahmed. I am fine, thank you!", "the script's words, not the spoken form");
  assert.ok(existsSync(join(dir, "refs", "ali.wav")) && existsSync(join(library, "ali", "reference_en.wav")));
  const saved = JSON.parse(readFileSync(join(library, "ali", "voice.json"), "utf8"));
  assert.deepEqual({ ...saved.languages.en, from: undefined, voiceId: undefined, engineSettings: undefined, design: undefined }, { file: "reference_en.wav", text: "Hello Ahmed. I am fine, thank you!", voiceId: undefined, voiceName: "ali_en", workerMode: "design", engine: "qwen3", from: undefined, engineSettings: undefined, design: undefined,
    settings: { temperature: null, topK: null, topP: null, repeatPenalty: null, seed: 11 } }, "the take's seed and settings are kept");
  assert.match(saved.languages.en.voiceId, /^design:[0-9a-f]{8}$/);
  // every generated take records its words, voice, mode and settings next to the audio
  const takeRec = JSON.parse(readFileSync(join(dir, "voice-takes", "en", "ali", "take-1.json"), "utf8"));
  assert.deepEqual([takeRec.voiceName, takeRec.workerMode, takeRec.engine, takeRec.language, takeRec.settings.seed], ["ali", "design", "qwen3", "en", 11]);
  assert.equal(takeRec.text, "Hello Ahmed.\nI am fine... thank you!", "the words sent to the model");
  assert.equal(takeRec.description, STORY.voices.ali.description);
  assert.deepEqual(saved.languages.en.engineSettings.qwen3, takeRec.settings);
  assert.deepEqual(saved.languages.en.design, takeRec.design);
  assert.equal(takeRec.design.text, takeRec.text);
  // and so does the reference cut from it
  const refRec = JSON.parse(readFileSync(join(dir, "refs", "ali.json"), "utf8"));
  assert.deepEqual([refRec.text, refRec.workerMode, refRec.settings.seed], ["Hello Ahmed. I am fine, thank you!", "design", 11]);
  // cloning that reference uses its record: its words, its settings, and its seed for take 1
  writeFileSync(join(dir, "refs", "ali.json"), JSON.stringify({ ...refRec, settings: { temperature: 0.6, topK: 30, topP: 0.85, repeatPenalty: 1.05, seed: 777 } }));
  const again = project({ language: "en", voices: { ali: { reference: "refs/ali.wav" } }, lines: [{ who: "ali", text: "Again." }] });
  mkdirSync(join(again, "refs"));
  for (const f of ["ali.wav", "ali.json"]) copyFileSync(join(dir, "refs", f), join(again, "refs", f));
  const againPlan = readVoicePlan(again);
  assert.equal(againPlan.voices.ali.referenceText, "Hello Ahmed. I am fine, thank you!");
  assert.deepEqual(againPlan.voices.ali.options, { temperature: 0.6, top_k: 30, top_p: 0.85, repeat_penalty: 1.05 });
  assert.deepEqual(takeRequests(againPlan, again).map((r) => r.seed), [777, 788, 799]);
  assert.throws(() => makeReference(dir, "ali", 1, { save: "ali", library }), /already has a en voice/);
  const next = project({ language: "en", voices: { bob: { library: "ali" } }, lines: [{ who: "bob", text: "Hi there." }] });
  const plan = readVoicePlan(next, undefined, { library });
  assert.equal(plan.voices.bob.engine, "qwen3", "an English library voice clones with the engine saved in voice.json (here the take's, Qwen3-TTS)");
  assert.equal(plan.voices.bob.referenceText, "Hello Ahmed. I am fine, thank you!");
  assert.deepEqual(plan.voices.bob.design, takeRec.design, "original design survives a later library clone");
  const ar = project({ language: "ar", voices: { bob: { library: "ali" } }, lines: [{ who: "bob", text: "مرحبا" }] });
  const cross = readVoicePlan(ar, undefined, { library });
  assert.equal(cross.voices.bob.engine, "audar", "Audar speaks Arabic too");
  assert.ok(cross.warnings.some((w) => /cross-lingual/.test(w)));
  // an Arabic reference next to the English one: each language uses its own
  writeFileSync(join(library, "ali", "reference_ar.wav"), readFileSync(join(library, "ali", "reference_en.wav")).subarray(0, 4000));
  const json = JSON.parse(readFileSync(join(library, "ali", "voice.json"), "utf8"));
  writeFileSync(join(library, "ali", "voice.json"), JSON.stringify({ ...json, languages: { ...json.languages, ar: { file: "reference_ar.wav", text: "مرحبا يا أحمد", voiceId: "user:x", voiceName: "ali_ar", workerMode: "clone", settings: { temperature: 0.7, topK: 35, topP: 0.9, repeatPenalty: 1.1, seed: 1579 } } } }));
  const arPlan = readVoicePlan(ar, undefined, { library });
  assert.equal(arPlan.voices.bob.referenceText, "مرحبا يا أحمد");
  assert.deepEqual(arPlan.voices.bob.options, { temperature: 0.7, top_k: 35, top_p: 0.9, repeat_penalty: 1.1 }, "the reference's settings are the defaults");
  assert.deepEqual(takeRequests(arPlan, ar).map((r) => r.seed), [1579, 1590, 1601], "its seed makes take 1");
  // what Audar actually receives for take 1: the library recording, its words, its settings and its seed
  const job = takeCommand(SETTINGS, ar, takeRequests(arPlan, ar)[0], join(ar, "o.wav")).job;
  assert.deepEqual({ mode: job.mode, engine: basename(job.modelDir), text: job.referenceText, seed: job.seed, options: job.options },
    { mode: "clone", engine: "audar-turbo", text: "مرحبا يا أحمد", seed: 1579, options: { temperature: 0.7, top_k: 35, top_p: 0.9, repeat_penalty: 1.1 } });
  assert.match(job.reference, /ali[\\/]reference_ar\.wav$/);
  // the project-wide "options" do not replace a saved voice's settings (and voices says so)
  const wide = project({ language: "ar", options: { temperature: 1, top_k: 50 }, voices: { bob: { library: "ali" } }, lines: [{ who: "bob", text: "مرحبا" }] });
  const widePlan = readVoicePlan(wide, undefined, { library });
  assert.deepEqual(takeRequests(widePlan, wide)[0].options, { temperature: 0.7, top_k: 35, top_p: 0.9, repeat_penalty: 1.1, seed: 1579 });
  assert.ok(widePlan.warnings.some((w) => /project-wide "options" \(temperature, top_k\) do not apply/.test(w)));
  // the voice's own options and seeds do, with a warning
  const own = project({ language: "ar", voices: { bob: { library: "ali", options: { temperature: 1 }, seeds: [5] } }, lines: [{ who: "bob", text: "مرحبا" }] });
  const ownPlan = readVoicePlan(own, undefined, { library });
  assert.equal(ownPlan.voices.bob.options.temperature, 1);
  assert.equal(takeRequests(ownPlan, own)[0].seed, 5);
  assert.ok(ownPlan.warnings.some((w) => /own "options" replace voices-library\/ali\/voice\.json \(ar\): temperature 0\.7 → 1/.test(w)));
  assert.ok(ownPlan.warnings.some((w) => /own "seeds" replace the seed .*1579 → 5/.test(w)));
  // a library recording named by path is refused: it would skip voice.json
  const byPath = project({ language: "ar", voices: { bob: { reference: join(library, "ali", "reference_ar.wav"), referenceText: "x" } }, lines: [{ who: "bob", text: "مرحبا" }] });
  assert.throws(() => readVoicePlan(byPath, undefined, { library }), /use \{"library": "ali"\}/);
  assert.match(arPlan.voices.bob.reference, /reference_ar\.wav$/);
  assert.ok(!arPlan.warnings.some((w) => /cross-lingual/.test(w)));
  assert.match(readVoicePlan(next, undefined, { library }).voices.bob.reference, /reference_en\.wav$/, "English still uses the English one");
  assert.throws(() => readVoicePlan(project({ language: "en", voices: { bob: { library: "nobody" } }, lines: [{ who: "bob", text: "Hi." }] }), undefined, { library }), /no voice "nobody"/);
});

test("voices can be added to a story made of the user's own recordings, keeping every recording", async () => {
  const dir = project({
    language: "en",
    voices: { shopkeeper: { description: "A cheerful, round-faced middle-aged man with a warm, slightly deep voice" } },
    lines: [
      { who: "bob", text: "Easy money!", file: "voices/01-bob.wav" },
      { who: "shopkeeper", text: "Can I help you?" },
      { who: "bob", text: "Just looking.", file: "voices/03-bob.wav" },
    ],
  });
  mkdirSync(join(dir, "voices"));
  writeFileSync(join(dir, "voices", "01-bob.wav"), wavOf(tones([[0, 0.5]], 0.6)));
  writeFileSync(join(dir, "voices", "03-bob.wav"), wavOf(tones([[0, 0.5]], 0.6)));
  const mine = { cast: { bob: { preset: "thief" } }, clips: [{ who: "bob", file: "voices/01-bob.wav", text: "Easy money!", gap: 0.4 }, { who: "bob", file: "voices/03-bob.wav", text: "Just looking." }] };
  writeFileSync(join(dir, "dialogue.json"), JSON.stringify(mine));
  const plan = readVoicePlan(dir);
  assert.ok(keepsRecordings(mine, plan));
  assert.ok(!keepsRecordings({ clips: [...mine.clips, { who: "bob", file: "voices/09.wav", text: "Bye." }] }, plan));
  const pcm = tones([[0.1, 1.2]], 1.5);
  await makeTakes(dir, { run: async (_e, a) => writeFileSync(jobOf(a).out, wavOf(pcm)), hear: () => sayWords("Can I help you?", 0.1, 1.2), settings: SETTINGS, log: () => {} });
  const r = pickTakes(dir, { shopkeeper: 1 }, { hear: () => null });
  const d = JSON.parse(readFileSync(join(dir, "dialogue.json"), "utf8"));
  assert.equal(r.mode, "dialogue");
  assert.deepEqual(d.clips.map((c) => c.file), ["voices/01-bob.wav", "voices/02-shopkeeper.wav", "voices/03-bob.wav"]);
  assert.equal(d.clips[0].gap, 0.4, "the user's own settings stay");
  assert.deepEqual(d.cast, mine.cast);
  assert.ok(existsSync(join(dir, "voice-takes", "en", "dialogue.before.json")), "the hand-made dialogue is kept");
});

test("alternatives add takes made another way, numbered after the main takes, without changing them", () => {
  const before = takeRequests(readVoicePlan(project(STORY)), project(STORY));
  const dir = project(STORY);
  writeFileSync(join(dir, "ali.wav"), wavOf(tones([[0, 1]], 1)));
  const alt = { ...STORY, lines: [...STORY.lines.slice(0, 3), { who: "ali", text: "Yes!" }], voices: { ...STORY.voices, ali: { ...STORY.voices.ali, alternatives: [
    { reference: "ali.wav", referenceText: "Hello.", engine: "audar", say: { 3: "[laughs] I am fine, thank you!", 4: "[excited] Yes!" } },
    { description: "A bright, quick cartoon boy", takes: 2 },
  ] } } };
  writeFileSync(join(dir, "tts.json"), JSON.stringify(alt));
  const plan = readVoicePlan(dir), reqs = takeRequests(plan, dir).filter((r) => r.who === "ali");
  assert.deepEqual(reqs.map((r) => `${r.take}:${r.engine}:${r.seed}`), ["1:qwen3:11", "2:qwen3:22", "3:audar:11", "4:qwen3:11", "5:qwen3:22"]);
  assert.match(reqs[2].text, /\[excited\] Yes!$/, "the alternative's own say is used");
  assert.match(reqs[0].text, /\nYes!$/, "the main takes keep the line as written");
  assert.equal(reqs[3].voice.description, "A bright, quick cartoon boy");
  // a plan without the new line: the main takes' keys are what they were before alternatives existed
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...STORY, voices: { ...STORY.voices, ali: { ...STORY.voices.ali, alternatives: [{ description: "Another voice" }] } } }));
  const again = takeRequests(readVoicePlan(dir), dir).filter((r) => r.who === "ali");
  assert.deepEqual(again.slice(0, 2).map((r) => r.key), before.filter((r) => r.who === "ali").map((r) => r.key));
  assert.throws(() => { writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...STORY, voices: { ...STORY.voices, ali: { ...STORY.voices.ali, alternatives: [{ description: "x", takes: 7 }] } } })); readVoicePlan(dir); }, /9 takes in all/);
});

test("voices never come from outside the project or voices-library/", () => {
  const dir = project(STORY), outside = join(dir, "..", `outside-${Date.now()}.wav`);
  writeFileSync(outside, wavOf(tones([[0, 1]], 1)));
  const bad = { ...STORY, voices: { ...STORY.voices, ali: { reference: outside, referenceText: "Hello." } } };
  writeFileSync(join(dir, "tts.json"), JSON.stringify(bad));
  assert.throws(() => readVoicePlan(dir), /outside the project/, "an absolute path elsewhere is refused");
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...bad, voices: { ...bad.voices, ali: { reference: `../${basename(outside)}`, referenceText: "Hello." } } }));
  assert.throws(() => readVoicePlan(dir), /outside the project/, "a ../ path is refused");
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...STORY, lines: [...STORY.lines, { who: "ali", text: "Bye.", file: outside }] }));
  assert.throws(() => readVoicePlan(dir), /recording .*outside the project/, "a line's recording from elsewhere is refused");
  writeFileSync(join(dir, "ali.wav"), wavOf(tones([[0, 1]], 1)));
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...bad, voices: { ...bad.voices, ali: { reference: "ali.wav", referenceText: "Hello." } } }));
  assert.doesNotThrow(() => readVoicePlan(dir), "a reference inside the project is fine");
});

test("takeChunks never splits a line and keeps a designed take whole", () => {
  const lines = ["One.", "Two two.", "Three three three."].map((text, i) => ({ text, index: i }));
  assert.deepEqual(takeChunks({ description: "x" }, lines), ["One.\nTwo two.\nThree three three."]);
  assert.deepEqual(takeChunks({ reference: "r.wav", referenceText: "r" }, lines), ["One. Two two. Three three three."]);
  // chunkPerLine: every line its own generation (a real pause between lines to cut at); a designed voice ignores it
  assert.deepEqual(takeChunks({ reference: "r.wav", referenceText: "r", chunkPerLine: true }, lines), ["One.", "Two two.", "Three three three."]);
  assert.deepEqual(takeChunks({ description: "x", chunkPerLine: true }, lines), ["One.\nTwo two.\nThree three three."]);
});

test("voice.json problems are named, and nothing silently replaces it", () => {
  const library = mkdtempSync(join(tmpdir(), "voices-library-"));
  const voice = (id, languages) => { mkdirSync(join(library, id), { recursive: true }); writeFileSync(join(library, id, "voice.json"), JSON.stringify({ id, languages })); };
  const wav = (id, f) => writeFileSync(join(library, id, f), wavOf(tones([[0, 1]], 1)));
  const S = (o = {}) => ({ temperature: 0.6, topK: 30, topP: 0.8, repeatPenalty: 1.1, seed: 500, ...o });
  const planFor = (v, extra = {}) => readVoicePlan(project({ language: "en", voices: { bob: v }, lines: [{ who: "bob", text: "Hi there." }], ...extra }), undefined, { library });
  voice("v", { en: { file: "reference_en.wav", text: "Hello.", settings: S() } }); wav("v", "reference_en.wav");
  // an empty seed list is an error, never NaN seeds
  assert.throws(() => planFor({ library: "v", seeds: [] }), /"seeds" must be a list of whole numbers/);
  // the same effective settings give the same take key, whatever the project-wide options say
  const plain = project({ language: "en", voices: { bob: { library: "v" } }, lines: [{ who: "bob", text: "Hi." }] });
  const noisy = project({ language: "en", options: { top_p: 0.5, temperature: 1.2 }, voices: { bob: { library: "v" } }, lines: [{ who: "bob", text: "Hi." }] });
  assert.equal(takeRequests(readVoicePlan(plain, undefined, { library }), plain)[0].key, takeRequests(readVoicePlan(noisy, undefined, { library }), noisy)[0].key);
  // a voice's own option is not reported as "saved settings are used"
  const mixed = planFor({ library: "v", options: { temperature: 0.5 } }, { options: { temperature: 1 } });
  assert.equal(mixed.voices.bob.options.temperature, 0.5);
  assert.ok(!mixed.warnings.some((w) => /project-wide/.test(w)), "the voice's own option wins, so no project-wide warning");
  // alternatives get the project-wide warning too
  const alt = readVoicePlan(project({ language: "en", options: { temperature: 1.3 }, voices: { bob: { description: "A man", alternatives: [{ library: "v" }] } }, lines: [{ who: "bob", text: "Hi." }] }), undefined, { library });
  assert.ok(alt.warnings.some((w) => /bob alternative 1: the project-wide "options" \(temperature\) do not apply/.test(w)));
  // a listed file that is missing is named, never swapped for another language's in silence
  voice("w", { en: { file: "typo_en.wav", text: "Hello.", settings: S() }, ar: { file: "reference_ar.wav", text: "مرحبا", settings: S() } });
  wav("w", "reference_ar.wav"); wav("w", "reference_en.wav");
  assert.throws(() => planFor({ library: "w" }), /languages\.en\.file "typo_en\.wav" is not in voices-library\/w\//);
  voice("x", { en: { file: "../v/reference_en.wav", text: "Hello.", settings: S() } });
  assert.throws(() => planFor({ library: "x" }), /is outside voices-library\/x\//);
  // bad settings name voice.json
  voice("y", { en: { file: "reference_en.wav", text: "Hello.", settings: S({ temperature: "0.6", seed: 12.5, topP: 7 }) } }); wav("y", "reference_en.wav");
  assert.throws(() => planFor({ library: "y" }), /voices-library\/y\/voice\.json \(en\): settings\.temperature must be a number.*settings\.topP 7.*settings\.seed 12\.5/s);
  // a broken voice.json names the file
  mkdirSync(join(library, "z")); writeFileSync(join(library, "z", "voice.json"), "{ nope");
  assert.throws(() => planFor({ library: "z" }), /voices-library\/z\/voice\.json is not valid JSON/);
  // an English library voice clones with Qwen3-TTS by default, with the saved settings (repeatPenalty included)
  assert.equal(planFor({ library: "v" }).voices.bob.engine, "qwen3");
  assert.equal(planFor({ library: "v", engine: "audar" }).voices.bob.engine, "audar", "the voice's own engine wins");
  // voice.json can name the engine per language
  voice("q", { en: { file: "reference_en.wav", text: "Hello.", engine: "audar", settings: S({ seed: 3 }) } }); wav("q", "reference_en.wav");
  assert.equal(planFor({ library: "q" }).voices.bob.engine, "audar", "voice.json's engine for the language");
  voice("profiles", { en: { file: "reference_en.wav", text: "Hello.", settings: S(), engineSettings: { qwen3: { temperature: 0.8, seed: 12 }, audar: { temperature: 0.5, seed: 90 } } } }); wav("profiles", "reference_en.wav");
  for (const [engine, temperature, seed] of [["qwen3", 0.8, 12], ["audar", 0.5, 90]]) {
    const p = planFor({ library: "profiles", engine }, { options: { top_k: 42 } });
    const req = takeRequests(p, library)[0];
    assert.equal(req.options.temperature, temperature);
    assert.equal(req.seed, seed);
    assert.equal(req.options.top_k, 42, "profile replaces legacy settings instead of mixing engines");
  }
  voice("badprofile", { en: { file: "reference_en.wav", text: "Hello.", engineSettings: { qwen3: { seed: -1 } } } }); wav("badprofile", "reference_en.wav");
  assert.throws(() => planFor({ library: "badprofile" }), /engineSettings.qwen3.*settings.seed/);
});

test("voice-ref refuses a take made with older settings, and records the settings that made it", async () => {
  const dir = await madeStory(), library = mkdtempSync(join(tmpdir(), "voices-library-"));
  const tts = JSON.parse(readFileSync(join(dir, "tts.json"), "utf8"));
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...tts, voices: { ...tts.voices, ali: { ...tts.voices.ali, seeds: [99, 98] } } }));
  assert.throws(() => makeReference(dir, "ali", 1, { save: "ali", library }), /made from an older tts\.json or voice\.json/);
  writeFileSync(join(dir, "tts.json"), JSON.stringify(tts));
  makeReference(dir, "ali", 1, { save: "ali", library });
  const take = JSON.parse(readFileSync(join(dir, "voice-takes", "en", "ali", "take-1.json"), "utf8"));
  assert.deepEqual(JSON.parse(readFileSync(join(dir, "refs", "ali.json"), "utf8")).settings, take.settings);
});

test("options written as text on a saved voice is a clear error", () => {
  const library = mkdtempSync(join(tmpdir(), "voices-library-"));
  mkdirSync(join(library, "v"));
  writeFileSync(join(library, "v", "voice.json"), JSON.stringify({ id: "v", languages: { en: { file: "reference_en.wav", text: "Hello.", settings: { temperature: 0.6, topK: 30, topP: null, repeatPenalty: null, seed: 5 } } } }));
  writeFileSync(join(library, "v", "reference_en.wav"), wavOf(tones([[0, 1]], 1)));
  assert.throws(() => readVoicePlan(project({ language: "en", voices: { bob: { library: "v", options: "x" } }, lines: [{ who: "bob", text: "Hi." }] }), undefined, { library }), /"options" must be an object/);
});

test("the default cloner follows the recording's language; engine problems name where the engine came from", () => {
  const lines = [{ who: "bob", text: "Hi there." }];
  // a project recording whose record says it is Arabic: Audar, even in an English video
  const dir = project({ language: "en", voices: { bob: { reference: "refs/ar.wav" } }, lines });
  mkdirSync(join(dir, "refs")); writeFileSync(join(dir, "refs", "ar.wav"), "x");
  writeFileSync(join(dir, "refs", "ar.json"), JSON.stringify({ text: "مرحبا بكم", language: "ar", settings: { seed: 4 } }));
  assert.equal(readVoicePlan(dir).voices.bob.engine, "audar");
  writeFileSync(join(dir, "refs", "ar.json"), JSON.stringify({ text: "Hello there.", language: "en", settings: { seed: 4 } }));
  assert.equal(readVoicePlan(dir).voices.bob.engine, "qwen3");
  // "engine" is not case-sensitive
  writeFileSync(join(dir, "tts.json"), JSON.stringify({ language: "en", voices: { bob: { reference: "refs/ar.wav", engine: "Audar" } }, lines }));
  assert.equal(readVoicePlan(dir).voices.bob.engine, "audar");
  // a wrong engine in voice.json names voice.json
  const library = mkdtempSync(join(tmpdir(), "voices-library-"));
  mkdirSync(join(library, "w")); writeFileSync(join(library, "w", "reference_en.wav"), "x"); writeFileSync(join(library, "w", "reference_ar.wav"), "x");
  writeFileSync(join(library, "w", "voice.json"), JSON.stringify({ id: "w", languages: { en: { file: "reference_en.wav", text: "Hello.", engine: "qwen5" }, ar: { file: "reference_ar.wav", text: "مرحبا", engine: "qwen3" } } }));
  assert.throws(() => readVoicePlan(project({ language: "en", voices: { bob: { library: "w" } }, lines }), undefined, { library }), /unknown engine "qwen5" in voices-library\/w\/voice\.json languages\.en\.engine/);
  assert.throws(() => readVoicePlan(project({ language: "ar", voices: { bob: { library: "w" } }, lines: [{ who: "bob", text: "مرحبا" }] }), undefined, { library }), /does not speak "ar".*voices-library\/w\/voice\.json languages\.ar\.engine asks for it/);
});

test("each kind of take checks the weights it needs before anything runs", () => {
  const d = mkdtempSync(join(tmpdir(), "qwen3-"));
  mkdirSync(join(d, ".venv")); mkdirSync(join(d, "weights"));
  const s = ttsSettings({ root: d, env: { TTS_QWEN3_DIR: d, TTS_AUDAR_DIR: "" } });
  assert.deepEqual(settingsProblems(s, ["qwen3:design"]), []);
  assert.match(settingsProblems(s, ["qwen3:clone"]).join("\n"), /has no weights-base\/ folder \(needed to clone with Qwen3-TTS\)/);
  assert.match(settingsProblems({ ...SETTINGS, modeErrors: {} }, ["qwen3"]).join(""), /^$/);
});

test("a take made one line per generation is cut exactly at the digital silence between its lines", () => {
  // three lines of tone separated by exact zeros (what the worker inserts); a 0.1 s dip inside line 1 is not a gap
  const spans = [[0, 1.0], [1.35, 2.2], [2.55, 3.4]];
  const pcm = tones(spans, 3.4);
  for (let k = Math.round(0.5 * RATE); k < Math.round(0.6 * RATE); k++) pcm[k] = 0;
  const gaps = digitalGaps(pcm);
  assert.equal(gaps.length, 2, JSON.stringify(gaps));
  assert.ok(Math.abs(gaps[0].start - 1.0) < 0.01 && Math.abs(gaps[1].start - 2.2) < 0.01, JSON.stringify(gaps));
  const lines = [{ text: "one two" }, { text: "three" }, { text: "four five" }];
  const r = splitTake(pcm, lines, [], gaps.map((g) => (g.start + g.end) / 2));
  assert.equal(r.clips.length, 3);
  assert.ok(r.clips[0].end <= 1.0 + 0.18 && r.clips[1].start >= 1.0 && r.clips[1].end <= 2.2 + 0.18 && r.clips[2].start >= 2.2, JSON.stringify(r.clips));
});
