import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { alignLines, keepsRecordings, makeReference, makeTakes, parseLines, parsePicks, pickTakes, readPcm, readVoicePlan, splitTake, takeChunks, takeCommand, takeRequests, DESIGN_TEXT } from "./tts.mjs";
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
  const ali = { reference: "ali.wav", referenceText: "Hello there, my friend." };
  const plan = (voice, extra = {}) => { writeFileSync(join(dir, "tts.json"), JSON.stringify({ ...STORY, ...extra, voices: { ...STORY.voices, ali: voice } })); return readVoicePlan(dir); };
  const errorsOf = (voice, extra) => { try { plan(voice, extra); return ""; } catch (e) { return e.message; } };
  const long = "This sentence is here to fill up a chunk with enough words to matter.";
  const lines = [...Array(8)].map((_, i) => ({ who: "ali", text: `${i + 1}. ${long}`, ...(i === 0 && { say: `[excited] ${i + 1}. ${long}` }) })).concat([{ who: "ahmed", text: "Hi." }]);
  const p = plan(ali, { lines });
  assert.equal(p.voices.ali.engine, "audar", "a reference is cloned by Audar by default");
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
  // Qwen3-TTS can clone too (its Base weights)
  const q = takeCommand(SETTINGS, dir, takeRequests(plan({ ...ali, engine: "qwen3" }, { lines: STORY.lines.slice(0, 2) }), dir)[0], join(dir, "o.wav")).job;
  assert.equal(q.mode, "clone");
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
  assert.equal(JSON.parse(readFileSync(join(library, "ali", "voice.json"), "utf8")).referenceText_en, "Hello Ahmed. I am fine, thank you!");
  assert.throws(() => makeReference(dir, "ali", 1, { save: "ali", library }), /already has a en voice/);
  const next = project({ language: "en", voices: { bob: { library: "ali" } }, lines: [{ who: "bob", text: "Hi there." }] });
  const plan = readVoicePlan(next, undefined, { library });
  assert.equal(plan.voices.bob.engine, "audar", "library voices clone with Audar");
  assert.equal(plan.voices.bob.referenceText, "Hello Ahmed. I am fine, thank you!");
  const ar = project({ language: "ar", voices: { bob: { library: "ali" } }, lines: [{ who: "bob", text: "مرحبا" }] });
  const cross = readVoicePlan(ar, undefined, { library });
  assert.equal(cross.voices.bob.engine, "audar", "Audar speaks Arabic too");
  assert.ok(cross.warnings.some((w) => /cross-lingual/.test(w)));
  // an Arabic reference next to the English one: each language uses its own
  writeFileSync(join(library, "ali", "reference_ar.wav"), readFileSync(join(library, "ali", "reference_en.wav")).subarray(0, 4000));
  const json = JSON.parse(readFileSync(join(library, "ali", "voice.json"), "utf8"));
  writeFileSync(join(library, "ali", "voice.json"), JSON.stringify({ ...json, referenceText_ar: "مرحبا يا أحمد" }));
  const arPlan = readVoicePlan(ar, undefined, { library });
  assert.equal(arPlan.voices.bob.referenceText, "مرحبا يا أحمد");
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
    { reference: "ali.wav", referenceText: "Hello.", say: { 3: "[laughs] I am fine, thank you!", 4: "[excited] Yes!" } },
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
});
