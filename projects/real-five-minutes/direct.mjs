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
// Directs "Real Five Minutes" (DEV/Scripts/logical-fallacies/episodes/02-real-five-minutes.txt). Run from the repo root:
//   node projects/real-five-minutes/direct.mjs ; pnpm video plan real-five-minutes ; node projects/real-five-minutes/direct.mjs
// Living room: the easel (its back to us) and Berry on the left, Cherry waiting on the right; the window shows the time passing.
// Morning: the two on the front step on the left, the delivery guy on the right.
const GAPS = { 7: 4.0, 9: 1.9, 13: 1.9, 14: 2.4, 15: 3.2, 16: 0.6, 19: 2.3, 26: 2.1, 29: 4.6, 32: 4.4, 33: 1.4, 34: 0.4, 35: 2.2 };
const cast = { berry: { preset: "berry", name: "Berry" }, cherry: { preset: "cherry", name: "Cherry" }, benny: { preset: "benny", name: "Benny" } };
const COAT = { outfit: "cardiganskirt", shirt: "#3ea89a", accent: "#ffffff" };          // Cherry's coat
const PACK = { ...COAT, extras: ["backpack"] };
const BERRY_COAT = { outfit: "cardiganskirt", shirt: "#d9774e", accent: "#ffffff", pants: "#e695ab" };

const Y = 0.9, S = 0.45;
const room = (time) => ({ type: "living_room", time });
const easel = () => prop("easel", 0.2, 0.93, 0.36, { zIndex: 6 });
const painter = (pose = "hold", expr = "happy", extra = {}) => actor("berry", 0.41, Y, S, pose, expr, { facing: "left", holding: "paintbrush", ...look(0.6, -0.1), ...extra });
const PX = 0.67, SEAT = 0.925;
const pouf = (x = PX) => prop("pouf", x, 0.915, 0.15, { zIndex: 3 });
const sitting = (expr, extra = {}) => actor("cherry", PX, SEAT, S, "sit_front", expr, { facing: "left", ...extra });
const CAM = (extra = {}) => ({ zoom: [1.08, 1.12], focus: { x: 0.48, y: 0.87 }, ...extra });

const STEP_Y = 0.83, STEP_TOP = STEP_Y - (44 / 200) * 0.5 * 1080 / 1920;
const step = () => prop("front_step", 0.36, STEP_Y, 0.5, { zIndex: 3 });
const bag = (x) => prop("paper_bag", x, 0.857, 0.075, { zIndex: 6 });

const scenes = [
  // S1: afternoon: the coat, the backpack, the promise
  scene("real-five", 0, room("day"),
    [painter(), actor("cherry", 0.72, Y, S, "hold", "excited", { facing: "left", holding: "paper_bag", look: PACK })],
    [easel()],
    CAM({ moves: [mv(c(3), 1.16, 0.6, 0.87), mv(c(4), 1.1, 0.46, 0.87), mv(c(5), 1.16, 0.6, 0.87), mv(c(6), 1.14, 0.44, 0.87)] }),
    { light: "warm", actions: [
      act(c(2), "berry", "hold", "happy", look(0.6, -0.2)),
      act(c(3), "cherry", "hold", "thinking"),
      act(c(4), "berry", "hold", "proud"),
      act(c(5), "cherry", "hold", "smug"),
      act(c(6), "berry", "hold", "happy", look(-0.7, 0)),
      act(end(6, 0.2), "berry", "hold", "thinking", look(0.6, -0.1)),
      act(end(6, 0.1), "cherry", "hold", "happy"),
    ] }),
  // S2: she sits, very straight, and waits
  scene("waiting", end(6, 0.7), room("day"),
    [painter("hold", "thinking"), sitting("happy", { look: PACK, ...look(0.6, 0) })],
    [easel(), pouf(), prop("paper_bag", 0.88, 0.93, 0.08, { zIndex: 4 })],
    CAM(), { light: "warm" }),

  // S3: sunset. The backpack is off and a sandwich is out
  scene("half", end(6, 2.9), room("dusk"),
    [painter("hold", "thinking"), sitting("neutral", { look: COAT, holding: "sandwich", ...look(0.3, 0.5) }),
     actor("benny", 1.2, Y, S, "hold", "happy", { facing: "left", holding: "cooking_spoon", zIndex: 6, move: [{ at: end(8, 0.2), duration: 1.3, x: 0.88, y: Y - 0.02 }] })],
    [easel(), pouf(), prop("backpack", 0.52, 0.955, 0.1, { color: "#a9713f", zIndex: 6 }), prop("paper_bag", 0.9, 0.965, 0.07, { zIndex: 6 })],
    CAM({ moves: [mv(c(7), 1.14, 0.6, 0.87), mv(c(8), 1.14, 0.44, 0.87), mv(end(8, 0.4), 1.0, 0.5, 0.87)] }),
    { light: "dusk", actions: [
      act(c(7), "cherry", "sit_front", "neutral", look(0.6, 0)),
      act(c(8), "berry", "hold", "thinking"),
      act(end(8, 1.4), "benny", "hold", "surprised", look(0.5, 0.3)),
      act(c(9), "benny", "hold", "confused"),
      act(c(10), "cherry", "sit_front", "neutral", look(-0.5, -0.4)),
      act(c(11), "benny", "hold", "worried"),
      act(c(12), "cherry", "sit_front", "sleepy"),
      act(end(12, 0.3), "benny", "hold", "thinking", look(0.9, 0)),
      act(end(12, 1.0), "benny", "idle", "happy", { holding: "", ...look(0.5, 0.4) }),
      act(end(12, 1.0), "cherry", "sit_front", "thinking", { holding: "cooking_spoon" }),
      act(c(13), "cherry", "sit_front", "disgusted"),
      act(end(13, 0.1), "benny", "facepalm", "worried"),
    ] }),

  // S4: night. She steps back, pleased, and then she sees
  scene("there", end(13, 0.9), room("night"),
    [painter("hold", "proud"), sitting("sleepy", { look: COAT, ...look(0.2, 0.5) })],
    [easel(), pouf(), prop("paper_bag", 0.88, 0.945, 0.08, { zIndex: 6, out: c(16) })],
    CAM({ moves: [mv(c(14), 1.16, 0.4, 0.87), mv(end(14, 0.9), 1.24, 0.66, 0.88, 0), mv(c(15), 1.08, 0.5, 0.87, 0), mv(c(16), 1.18, 0.62, 0.88), mv(c(17), 1.1, 0.5, 0.87)] }),
    { light: "warm", actions: [
      act(c(14, "-0.6"), "berry", "idle", "proud", { holding: "" }),
      act(end(14, 0.1), "berry", "idle", "surprised", look(0.5, -0.7)),
      act(end(14, 0.65), "berry", "idle", "shocked", { facing: "right", ...look(0.6, 0.2) }),
      act(end(14, 1.2), "cherry", "sit_front", "sad", look(0.6, 0)),
      act(c(15), "berry", "idle", "sad"),
      act(c(16), "cherry", "sit_front", "sad", { holding: "paper_bag" }),
      act(c(17), "berry", "explain", "worried"),
      act(c(18), "cherry", "sit_front", "sad", look(0.3, 0.5)),
      act(end(18, 0.1), "berry", "idle", "sad", look(0.3, 0.4)),
    ] }),

  // S5: on the floor together: the leaves, then the same leaves
  scene("the-leaves", end(18, 0.8), room("night"),
    [actor("berry", 0.41, SEAT, S, "sit_front", "sad", { facing: "right", ...look(0.5, 0.2) }), sitting("sad", { look: COAT, ...look(0.4, 0.3) })],
    [easel(), pouf(0.41), pouf(), prop("paper_bag", 0.88, 0.945, 0.08, { zIndex: 6 })],
    CAM({ moves: [mv(c(19), 1.16, 0.58, 0.88), mv(c(22), 1.18, 0.5, 0.88), mv(c(24), 1.2, 0.62, 0.88), mv(end(25, 0.2), 1.12, 0.46, 0.87, 0.9), mv(c(26), 1.18, 0.58, 0.88)] }),
    { light: "warm", actions: [
      act(c(19, "-0.8"), "cherry", "sit_front", "thinking", look(0.8, -0.3)),
      act(c(20), "berry", "sit_front", "sad", look(-0.8, -0.2)),
      act(c(21), "cherry", "sit_front", "confused", look(0.6, 0)),
      act(c(22), "berry", "sit_front", "neutral", look(-0.8, -0.2)),
      act(c(23), "berry", "sit_front", "sad"),
      act(c(24), "cherry", "sit_front", "surprised", look(0.6, 0)),
      act(c(25), "berry", "sit_front", "sad", look(0.4, 0.3)),
      act(end(25, 0.2), "berry", "sit_front", "sad", look(-0.8, -0.2)),
      act(end(25, 0.2), "cherry", "sit_front", "neutral", look(0.8, -0.2)),
      act(c(26), "cherry", "sit_front", "neutral", look(0.6, 0)),
      act(c(27), "berry", "sit_front", "sad", look(0.6, 0)),
      act(c(28), "cherry", "sit_front", "smug", look(0.5, 0)),
      act(end(28, 0.1), "berry", "sit_front", "laughing", look(0.5, 0)),
    ] }),
  // S6: half a sandwich each
  scene("halves", end(28, 0.9), room("night"),
    [actor("berry", 0.41, SEAT, S, "sit_front", "happy", { facing: "left", holding: "sandwich", ...look(0.7, -0.2) }), sitting("happy", { look: COAT, holding: "sandwich", ...look(0.7, -0.2) })],
    [easel(), pouf(0.41), pouf()],
    CAM({ zoom: [1.1, 1.14], focus: { x: 0.48, y: 0.87 } }), { light: "warm" }),

  // S7: the next morning: the painting leaves
  scene("the-morning", end(28, 3.3), "house_exterior",
    [actor("berry", 0.21, 0.85, 0.4, "sit_front", "worried", { facing: "right", look: BERRY_COAT, ...look(0.8, 0) }), actor("cherry", 0.42, 0.85, 0.4, "sit_front", "neutral", { facing: "right", look: COAT, ...look(0.7, 0) })],
    [step(), bag(0.315), prop("delivery_rider_art_waiting", 0.755, 0.975, 0.4, { zIndex: 6, out: end(31, 1.9) }),
     prop("delivery_rider_art", 0.755, 0.975, 0.4, { zIndex: 6, at: end(31, 1.9), move: [{ at: end(31, 1.95), duration: 1.4, x: 1.5, y: 0.975, ease: "power2.in" }] })],
    { zoom: [1.0, 1.02], focus: { x: 0.5, y: 0.87 }, moves: [mv(end(31, 3.2), 1.18, 0.32, 0.85, 0.8)] },
    { light: "day", sfx: [{ at: end(31, 2.0), name: "whoosh" }], actions: [
      act(c(29), "berry", "sit_front", "worried", look(0.8, 0)),
      act(c(30), "cherry", "sit_front", "neutral", look(-0.7, 0)),
      act(c(31), "berry", "sit_front", "sad"),
      act(end(31, 0.4), "cherry", "sit_front", "happy", look(-0.6, 0.2)),
      act(end(31, 1.0), "berry", "sit_front", "sad", look(0.8, 0.1)),
      act(end(31, 1.9), "cherry", "sit_front", "neutral", look(0.7, 0)),
      act(end(31, 3.4), "cherry", "sit_front", "neutral", look(-0.7, 0)),
      act(c(32), "berry", "sit_front", "happy", look(0.4, 0)),
      act(end(32, 0.2), "cherry", "sit_front", "thinking", look(-0.7, 0)),
      act(end(32, 0.6), "berry", "sit_front", "sad", look(0.8, 0.1)),
    ] }),
  // S8: Cherry leans on her: a painting five
  scene("painting-five", c(33, "-0.3"), "house_exterior",
    [actor("berry", 0.3, 0.85, 0.4, "sit_front", "sad", { facing: "right", look: BERRY_COAT, ...look(0.4, 0.2) }), actor("cherry", 0.43, 0.85, 0.4, "sit_front", "happy", { facing: "left", look: COAT, zIndex: 6, ...look(0.5, 0) })],
    [step(), bag(0.19)],
    { zoom: [1.2, 1.24], focus: { x: 0.37, y: 0.85 } },
    { light: "day", actions: [
      act(c(34), "berry", "sit_front", "happy", { facing: "right", ...look(0.6, 0) }),
      act(c(35, "-0.6"), "cherry", "sit_front", "smug"),
      act(c(35), "cherry", "sit_front", "happy"),
      act(end(35, 0.2), "berry", "sit_front", "love"),
      act(end(35, 1.2), "berry", "sit_front", "happy", look(0.3, 0)),
    ] }),
];
save("Real Five Minutes", GAPS, cast, scenes, 3);
