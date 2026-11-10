import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { findFfmpeg } from "./env.mjs";
import { audioSeconds } from "./enhance.mjs";
import { cutPoint, keptText, languageOf, trimReference, trimLibraryVoice } from "./ref-trim.mjs";

test("cutPoint leaves 15 s or less alone and cuts at the last pause before 15 s", () => {
  const pauses = [{ start: 0, end: 0.4 }, { start: 6, end: 6.8 }, { start: 12.2, end: 13.1 }, { start: 14.95, end: 15.6 }, { start: 16.4, end: 16.6 }];
  assert.equal(cutPoint(15, pauses), null);
  assert.equal(cutPoint(14.2, pauses), null);
  assert.equal(cutPoint(16.6, pauses), 12.32); // the 14.95 pause would end past 15 s; the trailing silence is not between words
  assert.equal(cutPoint(16.6, [{ start: 14.8, end: 14.9 }, { start: 15.5, end: 16 }]), 14.85); // a short pause: half of it
  assert.throws(() => cutPoint(17, [{ start: 0, end: 1 }, { start: 16.8, end: 17 }]), /no pause/);
});

test("keptText keeps the beginning of the text that was heard, tags included", () => {
  assert.equal(keptText("Many years had passed, but his memories of that place remained unchanged, as if time had stopped there.",
    " Many years had passed, but his memories of that place remained unchanged."),
  "Many years had passed, but his memories of that place remained unchanged.");
  assert.equal(keptText("Come closer — [whispers] I planned something, [mischievously] and you will love it.", "Come closer, I planned something"),
    "Come closer — [whispers] I planned something.");
  assert.equal(keptText("الرياح تزداد قوة، والأرض تهتز تحت قدميها، لكنها لم تتراجع، فقد كان صديقها ينتظرها.", "الرياح تزداد قوة والأرض تهتز تحت قدميها لكنها لم تتراجع"),
    "الرياح تزداد قوة، والأرض تهتز تحت قدميها، لكنها لم تتراجع.");
  assert.equal(keptText("One two three.", "something else entirely"), null);
  assert.equal(keptText("One two three.", null), null);
});

test("languageOf reads the language from the file name", () => {
  assert.equal(languageOf("voices-library/narrator/reference_ar.wav"), "ar");
  assert.equal(languageOf("en_story_mystery.wav"), "en");
  assert.equal(languageOf("bob.wav"), null);
});

const ff = findFfmpeg();
/** Tones with gaps: 6 s, gap 1 s, 6 s, gap 0.5 s, 4 s = 17.5 s, or a short one. */
function tones(file, parts) {
  const inputs = parts.flatMap(([kind, d]) => ["-f", "lavfi", "-i", kind === "tone" ? `sine=frequency=220:duration=${d}:sample_rate=24000` : `anullsrc=r=24000:cl=mono:d=${d}`]);
  const r = spawnSync(ff, ["-v", "error", "-y", ...inputs, "-filter_complex", `concat=n=${parts.length}:v=0:a=1,aformat=channel_layouts=mono`, "-c:a", "pcm_s16le", file]);
  assert.equal(r.status, 0, r.stderr?.toString());
}

test("trimReference cuts a long recording at its last pause and keeps the original", { skip: !ff }, () => {
  const dir = mkdtempSync(join(tmpdir(), "reftrim-"));
  try {
    const long = join(dir, "reference_en.wav"), short = join(dir, "reference_ar.wav");
    tones(long, [["tone", 6], ["gap", 1], ["tone", 6], ["gap", 0.5], ["tone", 4]]);
    tones(short, [["tone", 5], ["gap", 0.5], ["tone", 5]]);
    writeFileSync(join(dir, "voice.json"), JSON.stringify({ id: "x", referenceText_en: "One two, three four, five six.", referenceText_ar: "واحد اثنان" }));
    const results = trimLibraryVoice(dir, { hear: () => ["one two three four"] });
    const [ar, en] = results;
    assert.equal(ar.trimmed, false);
    assert.ok(en.trimmed);
    assert.ok(Math.abs(en.cut - 13.12) < 0.05, `cut at ${en.cut}`);
    assert.ok(Math.abs(audioSeconds(long) - en.cut) < 0.02);
    assert.ok(Math.abs(audioSeconds(join(dir, "full", "reference_en.wav")) - 17.5) < 0.02);
    assert.ok(!existsSync(join(dir, "full", "reference_ar.wav")));
    const json = JSON.parse(readFileSync(join(dir, "voice.json"), "utf8"));
    assert.equal(json.referenceText_en, "One two, three four.");
    assert.equal(json.referenceText_ar, "واحد اثنان");
    assert.equal(JSON.parse(readFileSync(join(dir, "full", "voice.json"), "utf8")).referenceText_en, "One two, three four, five six.");
    // a second run finds nothing to do, and a short file is never touched
    assert.equal(trimReference(long, { hear: () => [null] }).trimmed, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("trimReference refuses to replace a kept original", { skip: !ff }, () => {
  const dir = mkdtempSync(join(tmpdir(), "reftrim-"));
  try {
    const long = join(dir, "a.wav");
    tones(long, [["tone", 8], ["gap", 1], ["tone", 8]]);
    trimReference(long, { hear: () => [null] });
    tones(long, [["tone", 8], ["gap", 1], ["tone", 8]]);
    assert.throws(() => trimReference(long, { hear: () => [null] }), /already exists/);
    assert.ok(Math.abs(audioSeconds(long) - 17) < 0.05); // left as it was
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
