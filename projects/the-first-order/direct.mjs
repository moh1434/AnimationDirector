import { readFileSync, writeFileSync, existsSync } from "node:fs";
const dir = new URL("./", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, dir), "utf8").replace(/^\uFEFF/, ""));
const actor = (who, x, y, size, pose = "idle", expression = "neutral", extra = {}) =>
  ({ who, x, y, size, pose, expression, facing: x < 0.5 ? "right" : "left", enter: "none", zIndex: 5, ...extra });
const prop = (name, x, y, size, extra = {}) => ({ name, x, y, size, at: 0, anchor: "bottom", enter: "none", motion: "none", zIndex: 3, ...extra });
const act = (at, who, pose, expression, extra = {}) => ({ at, who, ...(pose ? { pose } : {}), ...(expression ? { expression } : {}), ...extra });
const c = (n, k = "") => `clip:${n}${k}`;
const end = (n, s = 0) => `clip:${n}:end+${s}`;
const scene = (id, start, bg, characters, props, camera, extra = {}) =>
  ({ id, start, layout: "story", speaker: "none", bg, characters, props, camera, ...extra });
const mv = (at, zoom, fx, fy, duration = 0.55) => ({ at, zoom, focus: { x: fx, y: fy }, duration });
const look = (x, y = 0) => ({ lookAt: { x, y } });
/** Writes the script's silent beats as pauses (seconds before a clip), then the storyboard. */
const save = (title, GAPS, cast, scenes, endHold) => {
  const dlg = read("dialogue.json");
  dlg.cast = cast;
  dlg.clips.forEach((k, i) => { const g = GAPS[i + 1]; if (g !== undefined) k.gap = g; });
  const next = JSON.stringify(dlg, null, 2) + "\n";
  if (next !== readFileSync(new URL("dialogue.json", dir), "utf8").replace(/^\uFEFF/, "")) writeFileSync(new URL("dialogue.json", dir), next);
  const sb = existsSync(new URL("storyboard.json", dir)) ? read("storyboard.json") : { version: 1 };
  const analysis = existsSync(new URL("build/analysis.json", dir)) ? read("build/analysis.json") : {};
  Object.assign(sb, { version: 1, title, language: "en", fps: 30, directedBy: "claude", duration: analysis.duration ?? sb.duration ?? 100, endHold, sfxDensity: "sparse", cast, scenes });
  writeFileSync(new URL("storyboard.json", dir), JSON.stringify(sb, null, 2) + "\n");
  console.log(title, "scenes:", scenes.length, "duration:", sb.duration);
};
// Directs "The First Order" (DEV/Scripts/logical-fallacies/episodes/01-the-first-order.txt). Run from the repo root:
//   node projects/the-first-order/direct.mjs ; pnpm video plan the-first-order ; node projects/the-first-order/direct.mjs
// Kitchen: Berry left, Cherry middle, Benny right (by the stove). Front of the house: the family on the left, the
// delivery guy on the right; he leaves and comes back on the right.
const GAPS = { 7: 2.6, 13: 1.0, 18: 2.1, 19: 0.5, 21: 2.6, 22: 1.9, 25: 4.6, 26: 1.5, 30: 1.2, 32: 2.1, 35: 0.8, 36: 0.5, 37: 4.2, 42: 3.4, 44: 1.2, 45: 2.6 };
const cast = { benny: { preset: "benny", name: "Benny" }, berry: { preset: "berry", name: "Berry" }, cherry: { preset: "cherry", name: "Cherry" }, wendy: { preset: "wendy", name: "Wendy" } };

// the long table hides the legs of whoever stands behind it; things stand on its top
const KITCHEN = { type: "home_kitchen" }, EVENING = { type: "home_kitchen", time: "dusk" };
const KY = 0.885, KS = 0.46, TY = 0.955, TOP = TY - (108 / 200) * 0.5 * 1080 / 1920 + 0.006;
const table = () => prop("kitchen_table", 0.5, TY, 0.5, { zIndex: 6 });
const on = (name, x, size, extra = {}) => prop(name, x, TOP, size, { zIndex: 7, ...extra });
const K_CAM = (extra = {}) => ({ zoom: [1.04, 1.06], focus: { x: 0.5, y: 0.86 }, ...extra });
const kitchen3 = (b, ch, be) => [actor("berry", 0.22, KY, KS, ...b), actor("cherry", 0.5, KY, KS, ...ch), actor("benny", 0.79, KY, KS, ...be)];

const HY = 0.93, HS = 0.36;
const RIDER = (extra = {}) => prop("delivery_rider_waiting", 0.77, 0.915, 0.37, { zIndex: 4, ...extra });

const scenes = [
  // S1: nobody has ordered for six hours
  scene("no-orders", 0, KITCHEN,
    kitchen3(["hold", "happy", { facing: "right" }], ["think", "neutral", { facing: "right", ...look(0.4, 0.6) }], ["idle", "worried", { facing: "left", ...look(0.5, 0.7) }]),
    [table(), on("food_boxes", 0.08, 0.13), on("phone", 0.64, 0.075), on("food_box", 0.27, 0.1, { color: "#ff6b8b" })],
    K_CAM({ moves: [mv(c(2), 1.08, 0.53, 0.86), mv(c(5), 1.08, 0.47, 0.86), mv(c(6), 1.05, 0.5, 0.86)] }),
    { light: "warm", actions: [
      act(c(1), "cherry", "talk", "confused", { facing: "right", ...look(0.6, 0) }),
      act(c(2), "benny", "idle", "neutral", look(0.4, 0)),
      act(c(3), "cherry", "idle", "neutral"),
      act(c(4), "benny", "explain", "proud"),
      act(c(5), "berry", "present", "proud"),
      act(c(6), "benny", "point", "excited", { facing: "left", ...look(0.5, 0) }),
    ] }),

  // S2: the phone buzzes; everyone freezes; Benny promises before thinking
  scene("the-buzz", end(6, 0.45), KITCHEN,
    kitchen3(["idle", "surprised", look(0.8, 0.5)], ["idle", "surprised", { facing: "right", ...look(0.6, 0.7) }], ["scared", "shocked", { facing: "left", ...look(0.5, 0.7) }]),
    [table(), on("food_boxes", 0.08, 0.13), on("phone", 0.64, 0.085, { motion: "shake", out: c(7) }), on("phone", 0.64, 0.085, { at: c(7), out: c(9) }), on("food_box", 0.27, 0.1, { color: "#ff6b8b" })],
    K_CAM({ zoom: [1.05, 1.1], focus: { x: 0.52, y: 0.86 }, moves: [mv(c(8), 1.06, 0.5, 0.86), mv(c(11), 1.08, 0.48, 0.86), mv(c(12), 1.1, 0.52, 0.86)] }),
    { light: "warm", sfx: [{ at: 0.05, name: "ding" }, { at: 0.9, name: "ding" }], actions: [
      act(c(7), "benny", "idle", "shocked"),
      act(c(8), "cherry", "celebrate", "excited"),
      act(c(9), "benny", "hold_up", "excited", { holding: "phone" }),
      act(c(9), "berry", "cheer", "excited"),
      act(c(10), "benny", "hold", "happy"),
      act(c(10), "cherry", "idle", "happy"),
      act(c(11), "berry", "shrug", "confused"),
      act(c(12), "benny", "hold", "determined"),
    ] }),

  // S3: he cooks, she ties, Cherry reads
  scene("the-rush", c(13, "-0.8"), KITCHEN,
    kitchen3(["hold", "thinking", look(0.3, 0.7)], ["hold", "confused", { holding: "phone", facing: "left", ...look(0.3, 0.5) }], ["hold", "determined", { holding: "noodle_pan", facing: "left", ...look(-0.3, 0.6) }]),
    [table(), on("food_boxes", 0.07, 0.13), on("food_box", 0.25, 0.14, { color: "#ff6b8b", out: c(18, "-0.2") }), on("food_box", 0.25, 0.14, { at: c(18, "-0.2") })],
    K_CAM({ zoom: [1.04, 1.06], moves: [mv(c(14), 1.08, 0.52, 0.86), mv(c(15), 1.08, 0.48, 0.86), mv(c(16), 1.05, 0.5, 0.86), mv(end(17, 0.2), 1.1, 0.52, 0.86)] }),
    { light: "warm", actions: [
      act(c(13), "cherry", "hold", "confused", look(0.7, 0)),
      act(c(14), "benny", "hold", "happy", look(0.5, 0)),
      act(c(15), "berry", "present", "determined", look(0.5, 0)),
      act(c(16), "benny", "hold", "confused", { facing: "left", ...look(0.6, 0) }),
      act(c(17), "berry", "hold", "proud", look(0.6, 0)),
      act(c(17, "+0.3"), "cherry", "hold", "worried"),
      act(end(17, 0.3), "benny", "hold", "neutral", look(0.6, 0.4)),
      act(end(17, 1.3), "benny", "hold", "love", look(0.6, 0.2)),
      act(c(18), "benny", "hold", "happy"),
    ] }),

  // S4: the second try at the address; a finger on the knot
  scene("the-knot", c(19, "-0.25"), KITCHEN,
    [actor("berry", 0.28, KY, KS, "hold", "happy", look(0.3, 0.6)), actor("cherry", 0.6, KY, KS, "hold", "worried", { holding: "phone", facing: "left" })],
    [table(), on("food_boxes", 0.07, 0.13), on("food_box", 0.45, 0.11), on("phone", 0.78, 0.075, { at: c(20, "+0.7") })],
    K_CAM({ zoom: [1.12, 1.16], focus: { x: 0.46, y: 0.86 } }),
    { light: "warm", actions: [
      act(c(19), "cherry", "hold", "confused", look(0.6, 0)),
      act(c(20), "berry", "point_down", "happy", look(0.6, 0.2)),
      act(c(20, "+0.7"), "cherry", "point_down", "worried", { facing: "left", holding: "", ...look(0.4, 0.7) }),
      act(end(20, 0.2), "cherry", null, "confused", look(0.2, 0.2)),
    ] }),

  // S5: the delivery guy has read the address. He does not move.
  scene("go", end(20, 0.6), "house_exterior",
    [actor("benny", 0.2, HY, HS, "celebrate", "excited", { facing: "right" })],
    [RIDER({ out: c(21, "+1.1") }), prop("delivery_rider", 0.77, 0.915, 0.37, { zIndex: 4, at: c(21, "+1.1"), move: [{ at: c(21, "+1.15"), duration: 1.5, x: 1.5, y: 0.915, ease: "power2.in" }] })],
    { zoom: [1.08, 1.12], focus: { x: 0.5, y: 0.88 } },
    { light: "day", sfx: [{ at: c(21, "+1.2"), name: "whoosh" }], actions: [
      act(c(21), "benny", "point", "excited", { facing: "right" }),
      act(end(21, 0.3), "benny", "wave", "happy", { facing: "right" }),
    ] }),

  // S6: they watch it leave
  scene("watching", c(22, "-0.3"), "house_exterior",
    [actor("cherry", 0.22, HY, HS, "idle", "worried", { facing: "right" }), actor("berry", 0.44, HY, HS, "idle", "happy", { facing: "right" }), actor("benny", 0.68, HY, HS, "hips", "proud", { facing: "right" })],
    [],
    { zoom: [1.08, 1.1], focus: { x: 0.46, y: 0.89 } },
    { light: "day", actions: [
      act(c(22), "benny", "present", "proud", { facing: "right" }),
      act(c(23), "cherry", "talk", "worried", { facing: "right" }),
      act(c(24), "benny", "hips", "love", { facing: "right" }),
      act(c(24, "+0.2"), "cherry", "facepalm", "sleepy"),
    ] }),

  // S7: the empty street for a moment
  scene("empty-street", end(24, 0.35), { type: "street" }, [], [], { zoom: [1.06, 1.08], focus: { x: 0.5, y: 0.85 } }, { light: "day" }),

  // S8: he rides back in and stops where he was
  scene("back-again", end(24, 2.2), "house_exterior",
    [actor("cherry", 0.15, HY, HS, "cross", "neutral", { facing: "right" }), actor("berry", 0.28, HY, HS, "idle", "happy", { facing: "right" }), actor("benny", 0.42, HY, HS, "hips", "proud", { facing: "right" }),
     actor("wendy", 1.15, 0.955, HS, "idle", "neutral", { facing: "left", zIndex: 6, move: [{ at: end(25, 0.1), duration: 1.5, x: 0.62, y: 0.955 }] })],
    [prop("delivery_rider", 1.5, 0.915, 0.37, { flip: true, zIndex: 4, out: c(25, "-0.5"), move: [{ at: end(24, 2.3), duration: 1.5, x: 0.77, y: 0.915, ease: "power2.out" }] }),
     prop("delivery_rider_waiting", 0.77, 0.915, 0.37, { flip: true, zIndex: 4, at: c(25, "-0.5") })],
    { zoom: [1.0, 1.02], focus: { x: 0.5, y: 0.88 } },
    { light: "day", actions: [
      act(end(24, 3.0), "benny", "idle", "surprised", { facing: "right" }),
      act(end(24, 3.0), "berry", "idle", "confused"),
      act(c(25), "benny", "think", "confused"),
      act(c(26), "wendy", "idle", "smug", { facing: "left" }),
      act(c(27), "benny", "idle", "shocked"),
      act(c(28), "wendy", "hips", "neutral", { facing: "left" }),
      act(c(28, "+0.6"), "berry", "idle", "surprised"),
      act(c(29), "cherry", "cross", "angry"),
      act(c(29), "benny", "idle", "surprised", look(-0.7, 0.1)),
    ] }),

  // S9: what she was testing, and what he was hoping
  scene("testing", c(30, "-0.5"), "house_exterior",
    [actor("berry", 0.15, HY, HS, "idle", "neutral", { facing: "right" }), actor("benny", 0.37, HY, HS, "hold", "surprised", { holding: "food_box", facing: "right" }),
     actor("wendy", 0.62, HY, HS, "idle", "neutral", { facing: "left" }), actor("cherry", 0.83, HY, HS, "idle", "neutral", { facing: "left" })],
    [],
    { zoom: [1.0, 1.03], focus: { x: 0.5, y: 0.89 } },
    { light: "day", actions: [
      act(c(30), "wendy", "explain", "neutral"),
      act(c(31), "wendy", "shrug", "neutral"),
      act(c(31, "+0.3"), "benny", "hold", "happy", look(0.5, 0)),
      act(end(31, 1.3), "benny", "hold", "worried", look(0.2, 0.6)),
      act(c(32), "benny", "hold", "happy", look(0.5, 0)),
      act(c(33), "benny", "hold", "laughing"),
      act(c(33, "+0.8"), "wendy", "idle", "worried"),
      act(end(33, 0.1), "benny", "hold", "sad", look(0.2, 0.6)),
      act(c(34), "wendy", "idle", "sad"),
      act(c(35), "benny", "hold", "sad", look(0.3, 0.3)),
      act(c(35), "berry", "idle", "worried"),
      act(c(36), "wendy", "shrug", "smug"),
      act(end(36, 0.9), "benny", "hold", "laughing", look(0.5, 0)),
      act(end(36, 1.2), "berry", "idle", "laughing"),
      act(end(36, 1.3), "cherry", "idle", "laughing"),
      act(end(36, 1.4), "wendy", "idle", "happy"),
    ] }),

  // S10: dinner: four stars
  scene("four-stars", end(36, 2.9), EVENING,
    [actor("cherry", 0.18, KY, 0.4, "idle", "happy", { facing: "right" }), actor("benny", 0.4, KY, 0.4, "idle", "happy", { facing: "right" }), actor("wendy", 0.64, KY, 0.4, "idle", "happy", { facing: "left" }), actor("berry", 0.86, KY, 0.4, "idle", "happy", { facing: "left" })],
    [table(), on("noodle_box", 0.5, 0.15), on("ribbon_bow", 0.68, 0.085), on("phone", 0.05, 0.075, { motion: "none", out: end(41, 0.6) }), on("phone", 0.05, 0.08, { at: end(41, 0.6), motion: "shake", out: end(41, 2.2) }), on("phone", 0.05, 0.075, { at: end(41, 2.2), out: c(44, "-0.4") })],
    { zoom: [1.0, 1.02], focus: { x: 0.5, y: 0.87 } },
    { light: "dusk", sfx: [{ at: end(41, 0.65), name: "ding" }, { at: end(41, 1.5), name: "ding" }], actions: [
      act(c(37), "cherry", "talk", "excited"),
      act(c(38), "wendy", "idle", "smug"),
      act(c(39), "benny", "explain", "shocked"),
      act(c(40), "wendy", "shrug", "neutral"),
      act(c(41), "berry", "hips", "determined"),
      act(c(41, "+0.5"), "benny", "idle", "laughing"),
      act(end(41, 0.65), "cherry", "idle", "surprised", look(-0.5, 0.6)),
      act(end(41, 0.65), "benny", "idle", "shocked", look(-0.5, 0)),
      act(end(41, 0.65), "berry", "idle", "surprised", look(0.5, 0)),
      act(end(41, 0.65), "wendy", "idle", "surprised", look(0.5, 0)),
      act(end(41, 1.5), "benny", "idle", "thinking", { facing: "right", ...look(0.8, 0) }),
      act(end(41, 1.7), "berry", "idle", "thinking", { facing: "left", ...look(0.8, 0) }),
      act(end(41, 1.9), "cherry", "idle", "thinking", { facing: "right", ...look(0.8, 0) }),
      act(end(41, 2.2), "wendy", "shrug", "neutral", look(0, 0)),
      act(c(42), "benny", "idle", "surprised"),
      act(c(43), "wendy", "shrug", "neutral"),
      act(c(44, "-0.4"), "cherry", "hold", "surprised", { holding: "phone", ...look(0.2, 0.5) }),
      act(c(44), "cherry", "hold", "excited", look(0.6, 0)),
      act(end(44, 0.1), "benny", "celebrate", "excited"),
      act(end(44, 0.1), "berry", "cheer", "excited"),
      act(end(44, 0.2), "wendy", "idle", "happy"),
    ] }),

  // S11: four empty chairs
  scene("order", end(44, 1.0), EVENING,
    [],
    [...[0.13, 0.38, 0.63, 0.87].map((x) => prop("kitchen_chair", x, 0.93, 0.32, { zIndex: 3 })), table(), on("noodle_box", 0.5, 0.15), on("ribbon_bow", 0.68, 0.085)],
    { zoom: [1.04, 1.1], focus: { x: 0.5, y: 0.88 } },
    { light: "dusk", sfx: [{ at: 0.1, name: "whoosh" }] }),
];
save("The First Order", GAPS, cast, scenes, 1.6);
