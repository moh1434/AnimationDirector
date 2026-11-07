import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { catalog } from "./catalog.mjs";
import { compile, sfxCues } from "./compile.mjs";
import { dialogueStale, isSoundLabel, missingClips, pcmWav, prepareDialogue } from "./dialogue.mjs";
import { localizeStoryboard } from "./localize.mjs";
import { validateStoryboard } from "./storyboard-tools.mjs";
import { clipSceneWords, clipTime, stairStep } from "../remotion/story/story-mode.mjs";

const dialogue = [
  { clip: 1, who: "narrator", start: 0, end: 2, text: "Meet Bob." },
  { clip: 2, who: "bob", start: 3, end: 5, text: "Easy money now" },
  { clip: 3, who: "narrator", start: 6, end: 8, text: "He runs." },
];
// word timing is approximate: "Easy" is heard just before its clip starts
const words = [
  { w: "Meet", s: 0.1, e: 1, seg: 0 }, { w: "Bob.", s: 1, e: 2, seg: 0 },
  { w: "Easy", s: 2.9, e: 3.5, seg: 1 }, { w: "money", s: 3.5, e: 4, seg: 1 }, { w: "now", s: 4, e: 5, seg: 1 },
  { w: "He", s: 6.1, e: 7, seg: 2 }, { w: "runs.", s: 7, e: 8, seg: 2 },
];
const analysis = { fps: 60, duration: 8, words };
const cast = { bob: { preset: "thief" }, dog: { kind: "dog" } };
const story = (scenes) => ({ version: 1, duration: 8, cast, dialogue, scenes });

test("clip times follow the recordings, whatever their length", () => {
  assert.equal(clipTime("clip:2", dialogue), 3);
  assert.equal(clipTime("clip:2:end", dialogue), 5);
  assert.equal(clipTime("clip:2+0.4", dialogue), 3.4);
  assert.equal(clipTime("clip:2:end-0.5", dialogue), 4.5);
  assert.equal(clipTime("clip:9", dialogue), null);
  const longer = dialogue.map((c) => ({ ...c, start: c.start * 2, end: c.end * 2 }));
  assert.equal(clipTime("clip:2", longer), 6);
});

test("a scene can start on a clip, and everything inside it can be timed by clip", () => {
  const { storyboard: sb } = compile(story([
    { start: 0, layout: "story" },
    { start: "clip:2", layout: "story", actions: [{ at: "clip:2:end", who: "bob" }], sfx: [{ at: "clip:2+0.5", name: "pop" }], camera: { shake: ["clip:2+1"] } },
  ]), analysis, { format: "shorts" });
  const scene = sb.scenes[1];
  assert.equal(scene.start, 2.95);
  assert.equal(scene.actions[0].at, 2.05);
  assert.equal(scene.sfx[0].at, 0.55);
  assert.equal(scene.camera.shake[0], 1.05);
});

test("a scene owns its clip's words even when word timing falls before the cut", () => {
  const scenes = [{ start: 0 }, { start: "clip:2" }, { start: "clip:3" }];
  assert.deepEqual(clipSceneWords(words, scenes[1], scenes[2], 1, dialogue).map((w) => w.w), ["Easy", "money", "now"]);
  assert.equal(clipSceneWords(words, { start: 3 }, undefined, 1, dialogue), null);
  const sb = story([{ start: 0, layout: "story", characters: [{ who: "bob" }] }, { start: "clip:2", layout: "story", characters: [{ who: "bob" }], actions: [{ at: "@easy", who: "bob" }] }]);
  assert.deepEqual(validateStoryboard(sb, { words, duration: 8 }).errors, []);
});

test("a move can begin on a word and arrive on a word or clip", () => {
  const { storyboard: sb } = compile(story([
    { start: 0, layout: "story" },
    { start: "clip:2", layout: "story", characters: [{ who: "bob", move: [{ at: "@money", until: "clip:2:end", x: 0.5 }] }] },
  ]), analysis, { format: "shorts" });
  const [move] = sb.scenes[1].characters[0].move;
  assert.equal(move.at, 0.5);
  assert.equal(move.duration, 1.55);
  assert.equal(move.until, undefined);
});

test("moves crowded together by a faster take shorten instead of stopping the build", () => {
  const { storyboard: sb, warnings } = compile(story([
    { start: 0, layout: "story" },
    { start: "clip:2", layout: "story", characters: [{ who: "bob", move: [{ at: "@easy", duration: 2, x: 0.3 }, { at: "@now", duration: 0.5, x: 0.6 }] }] },
  ]), analysis, { format: "shorts" });
  const [first, second] = sb.scenes[1].characters[0].move;
  assert.ok(first.at + first.duration <= second.at + 1e-9);
  assert.ok(warnings.some((w) => w.includes("shortened")));
});

test("validation names costumes, poses and clips that cannot be drawn or found", () => {
  const scene = (extra) => [{ start: 0, layout: "story", characters: [{ who: "bob" }, { who: "dog" }], ...extra }];
  const errorsOf = (sb) => validateStoryboard(sb, { words, duration: 8 }).errors.join("\n");
  assert.match(errorsOf(story(scene({ characters: [{ who: "bob", look: { hat: "sombrero" } }] }))), /sombrero/);
  assert.match(errorsOf(story(scene({ actions: [{ at: 1, who: "bob", look: { outfit: "spacesuit" } }] }))), /spacesuit/);
  assert.match(errorsOf(story(scene({ actions: [{ at: "clip:40", who: "bob" }] }))), /does not match a recording/);
  assert.match(errorsOf(story(scene({ characters: [{ who: "bob", pose: "sleep" }] }))), /pose "sleep"/);
  assert.match(errorsOf(story(scene({ characters: [{ who: "dog", move: [{ at: 0, x: 0.5 }] }] }))), /duration/);
  assert.equal(errorsOf(story(scene({ characters: [{ who: "dog", pose: "sleep", emote: "zzz" }, { who: "bob", look: { hat: "beanie", accessory: "mask" } }] }))), "");
});

test("a second language retimes moves and speaks from its own recordings", () => {
  const src = compile(story([{ start: 0, layout: "story", characters: [{ who: "bob", move: [{ at: 1, duration: 1, x: 0.5 }] }] }]), analysis, { format: "shorts" }).storyboard;
  const dst = { fps: 60, duration: 16, words: words.map((w) => ({ ...w, s: w.s * 2, e: w.e * 2 })) };
  const { storyboard } = localizeStoryboard(src, { srcAnalysis: analysis, dstAnalysis: dst, dstSegments: [{}, {}, {}], lang: "ar", source: "bob" });
  const [move] = storyboard.scenes[0].characters[0].move;
  assert.ok(Math.abs(move.at - 2) < 0.15 && Math.abs(move.duration - 2) < 0.3, `moved to ${move.at} + ${move.duration}`);
  assert.equal(storyboard.dialogue, undefined);
});

test("missing recordings are all listed, and changed ones are noticed", () => {
  const dir = mkdtempSync(join(tmpdir(), "story-voices-"));
  mkdirSync(join(dir, "voices"));
  const wav = join(dir, "voices", "a.wav");
  writeFileSync(wav, pcmWav(Buffer.alloc(9600)));
  const manifest = { clips: [{ who: "bob", text: "A", file: "voices/a.wav" }, { who: "bob", text: "B", file: "voices/b.wav" }, { who: "bob", text: "C", file: "voices/c.wav" }] };
  writeFileSync(join(dir, "dialogue.json"), JSON.stringify(manifest));
  assert.deepEqual(missingClips(dir, manifest), ["voices/b.wav", "voices/c.wav"]);
  assert.throws(() => prepareDialogue(dir), /2 recording\(s\).*\n.*b\.wav\n.*c\.wav/);
  assert.match(dialogueStale(dir), /not been assembled/);
  writeFileSync(join(dir, "dialogue.json"), JSON.stringify({ clips: manifest.clips.slice(0, 1) }));
  prepareDialogue(dir);
  assert.equal(dialogueStale(dir), null);
  const later = new Date(Date.now() + 60000);
  utimesSync(wav, later, later);
  assert.match(dialogueStale(dir), /a\.wav changed/);
});

test("a sound the storyboard asks for is not replaced by the shake on the same moment", () => {
  const { storyboard: sb } = compile(story([{ start: 0, layout: "story", camera: { shake: [1] }, sfx: [{ at: 1, name: "crash" }] }]), analysis, { format: "shorts" });
  assert.deepEqual(sfxCues(sb).map((c) => c.name), ["crash"]);
});

test("validation warns about actors out of scale and props covering a face", () => {
  const warned = (scene) => validateStoryboard(story([{ start: 0, layout: "story", ...scene }]), { words, duration: 8 }).warnings.join("\n");
  assert.match(warned({ bg: "house_exterior", characters: [{ who: "bob", size: 0.68 }] }), /out of scale.*camera\.zoom/);
  assert.doesNotMatch(warned({ bg: "house_exterior", characters: [{ who: "bob", size: 0.4 }] }), /out of scale/);
  assert.doesNotMatch(warned({ bg: "living_room", characters: [{ who: "bob", size: 0.5 }] }), /out of scale/);
  assert.match(warned({ bg: "solid", characters: [{ who: "dog", size: 1.05 }] }), /will not fit/);
  assert.match(warned({ bg: "park", characters: [{ who: "bob", x: 0.4, size: 0.4, emote: "dizzy" }], props: [{ name: "broken_pot", x: 0.4, y: 0.87, zIndex: 6 }] }), /cover its emote/);
  assert.doesNotMatch(warned({ bg: "park", characters: [{ who: "bob", x: 0.4, size: 0.4, emote: "dizzy" }], props: [{ name: "broken_pot", x: 0.4, y: 0.87, zIndex: 4 }] }), /cover its emote/);
});

test("a sound clip is heard but not captioned", () => {
  assert.ok(isSoundLabel("[bark]"));
  assert.ok(isSoundLabel(" [dog barks] "));
  assert.ok(!isSoundLabel("Please don't bark"));
});

test("every listed sound effect has a synth, and every setting and prop exists", () => {
  const c = catalog();
  const mix = readFileSync(new URL("../audio/mix.py", import.meta.url), "utf8");
  for (const name of c.sfx) assert.ok(mix.includes(`"${name}"`), `${name} has no sound in audio/mix.py`);
  for (const type of ["living_room", "house_exterior", "park", "schoolyard", "street"]) assert.ok(c.bgTypes.includes(type), type);
  for (const prop of ["police_car", "cupboard", "cupboard_open", "table", "flower_pot", "broken_pot", "open_window", "loot_bag", "tool_bag", "alarm_light"]) assert.ok(c.props.includes(prop), prop);
  assert.equal(c.resolveProp("wardrobe"), "cupboard");
});

test("a stepped move rests on every tread and arrives at the top", () => {
  assert.equal(stairStep(0, 4).progress, 0);
  assert.equal(stairStep(0.25, 4).progress, 0.25);
  assert.equal(stairStep(0.25, 4).hop, 0);
  assert.equal(stairStep(0.75, 4).progress, 0.75);
  assert.equal(stairStep(1, 4).progress, 1);
  assert.equal(stairStep(0.125, 4).hop, 1);
  assert.equal(catalog().resolveProp("steps"), "stairs");
  assert.match(validateStoryboard(story([{ start: 0, layout: "story", characters: [{ who: "bob", move: [{ at: 0, duration: 1, x: 0.5, steps: 1.5 }] }] }]), { words, duration: 8 }).errors.join(), /whole number/);
});

test("street houses never overlap, so lit windows stay on their own walls", () => {
  catalog(); // registers the TypeScript loader
  const { streetHouses } = createRequire(import.meta.url)("../remotion/story/StorySettings.tsx");
  for (const [W, H] of [[1160, 2000], [2000, 1160]]) {
    const u = Math.min(W, H) / 1080, wall = 700 * 0.85 * u;
    const xs = streetHouses(W, u).map((h) => h.x * W).sort((a, b) => a - b);
    xs.slice(1).forEach((x, i) => assert.ok(x - xs[i] >= wall, `houses ${i} and ${i + 1} overlap at width ${W}`));
    assert.ok(xs[0] - wall / 2 <= 0 && xs.at(-1) + wall / 2 >= W, "the row reaches both edges");
  }
});

test("story staging keeps titles out of the captions and leaves placed scenery alone", () => {
  catalog(); // registers the TypeScript loader
  const require = createRequire(import.meta.url);
  const { layoutScene } = require("../remotion/story/Layout.ts");
  const { frameSpec } = require("../remotion/story/frame.ts");
  const W = 1080, H = 1920, sb = story([]);
  const scene = { start: 0, end: 5, layout: "story", bg: { type: "street", time: "night" }, title: "Free at last", characters: [{ who: "bob" }],
    props: [{ name: "police_car", x: 1.5, y: 0.92, size: 0.8, anchor: "bottom", move: [{ at: 0, duration: 1, x: 0.7 }] }] };
  const L = layoutScene(scene, W, H, sb, true);
  const band = frameSpec(W, H, true).captionBand;
  assert.ok(L.title.y - L.title.size / 2 >= band.y1, "title clears the caption band");
  assert.equal(L.props[0].px, 1.5 * W, "a car may start off screen");
  assert.equal(L.props[0].py, 0.92 * H, "furniture stays on its floor");
  const mirrored = layoutScene({ ...scene, mirror: true, characters: [{ who: "bob", x: 0.2, facing: "right", move: [{ at: 0, duration: 1, x: 0.7 }] }] }, W, H, sb, true);
  assert.ok(Math.abs(mirrored.chars[0].move[0].x - 0.3) < 1e-9, "a mirrored shot mirrors the destination");
  assert.equal(mirrored.chars[0].facing, "left");
  assert.ok(L.chars[0].ps / W <= 0.42 + 1e-9, "a default actor is smaller than the buildings");
  const floorLine = -40 + 0.82 * (H + 80);
  assert.ok(Math.abs(L.chars[0].py - floorLine) < 12, "feet sit on the drawn floor");
});
