// Directs "The Long Way Home" (DEV/Scripts/logical-fallacies/episodes/01-the-long-way-home.txt).
// Run from the repo root after `pnpm video plan the-long-way-home`:  node projects/the-long-way-home/direct.mjs
// It also writes the script's silent beats as pauses in dialogue.json, so run `plan` once more afterwards.
//
// Drawn in the original house style (thick ink outlines, flat fills).
// Places: the car (front view through the windscreen: Berry, the passenger, on the LEFT; Benny driving on the RIGHT),
// a park cutaway with the swings, the kitchen, then the front step of the house at dusk. Screen direction stays the same
// throughout: Berry left, Benny right.
//
// Beat table (clip numbers are the 28 spoken lines):
//  S1  clips 1-4     car: Berry watches their street go by; Benny's detour "by the swings"
//  S2  gap before 5  park cutaway: the swings, a father lifting a sleeping child (2.4 s)
//  S3  clips 5-9     car (park sliding past the rear window): the memory of Cherry on the swings
//  S4  clips 10-11   car: Berry's smile fades on the dashboard clock (a cut to the clock), "take this next left"
//  S5  clip 12+hold  car turning: "Yeah. Sure." then 3 s on Berry, who turns to say something; Benny watches the road
//  S6  clips 13-21   kitchen: apples into the bowl, two quiet seconds, the front step, the laugh, the milk, her shoes by the door
//  S7  clips 22-23   front step at dusk: the sweater; Benny goes in for his
//  S8  gap + 24-26   he comes back in his sweater and sits; she shifts over (4 s), the house game
//  S9  clip 27       cutaway across the street: the little green house with the crooked porch
//  S10 clip 28+hold  the step: "You picked that one every time." Berry leans on his shoulder; hold
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const dir = new URL("./", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, dir), "utf8").replace(/^﻿/, ""));

/* ---- the script's silent beats, as pauses before a clip (seconds) ---- */
const GAPS = { 5: 2.4, 10: 1.2, 13: 3.6, 14: 2.2, 22: 3.2, 24: 4.4 };
const dlg = read("dialogue.json");
dlg.cast = {
  berry: { preset: "berry", name: "Berry" },
  benny: { preset: "benny", name: "Benny" },
};
dlg.clips.forEach((c, i) => { const g = GAPS[i + 1]; if (g !== undefined) c.gap = g; });
{ // only write when something changed, so `plan` does not see the recordings as stale after a re-run
  const next = JSON.stringify(dlg, null, 2) + "\n";
  if (next !== readFileSync(new URL("dialogue.json", dir), "utf8").replace(/^\uFEFF/, "")) writeFileSync(new URL("dialogue.json", dir), next);
}

/* ---- helpers ---- */
const actor = (who, x, y, size, pose = "idle", expression = "neutral", extra = {}) =>
  ({ who, x, y, size, pose, expression, facing: x < 0.5 ? "right" : "left", enter: "none", zIndex: 5, ...extra });
const prop = (name, x, y, size, extra = {}) => ({ name, x, y, size, at: 0, anchor: "bottom", enter: "none", motion: "none", zIndex: 3, ...extra });
const act = (at, who, pose, expression, extra = {}) => ({ at, who, ...(pose ? { pose } : {}), ...(expression ? { expression } : {}), ...extra });
const c = (n, k = "") => `clip:${n}${k}`;
const scene = (id, start, bg, characters, props, camera, extra = {}) =>
  ({ id, start, layout: "story", speaker: "none", bg, characters, props, camera, ...extra });
const mv = (at, zoom, fx, fy, duration = 0.55) => ({ at, zoom, focus: { x: fx, y: fy }, duration });

// the car: both actors stand behind the dashboard prop, which hides everything below the waist
const CAR_Y = 0.97, CAR_S = 0.5;
const berryCar = (pose, expr, extra) => actor("berry", 0.3, CAR_Y, CAR_S, pose, expr, { facing: "right", ...extra });
const bennyCar = (pose, expr, extra) => actor("benny", 0.7, CAR_Y, CAR_S, pose, expr, { facing: "left", lookAt: { x: -0.1, y: 0 }, ...extra });
const dashboard = (name = "car_dash") => prop(name, 0.5, 1.0, 0.5, { zIndex: 6 });
const CAR_CAM = (extra = {}) => ({ zoom: [1.2, 1.2], focus: { x: 0.5, y: 0.82 }, ...extra });

// Berry's coat in the kitchen, the sweaters on the step
const COAT = { outfit: "cardiganskirt", shirt: "#d9774e", accent: "#ffffff", pants: "#ffc83d" };
const BERRY_SWEATER = { outfit: "hoodieskirt", shirt: "#9cc3e8", pants: "#ffc83d" };
const BENNY_SWEATER = { shirt: "#7fae7a" };

// the house at dusk with a wide stone step in front of its door. The step's top is at STEP_TOP; seated actors sit
// on its edge (feet on the path just in front), Benny stands on it at the door, and the shoes stand on it.
const STEP = { type: "house_exterior", time: "dusk" };
const STEP_Y = 0.83, STEP_W = 0.5, STEP_TOP = STEP_Y - (44 / 200) * STEP_W * 1080 / 1920;
const SEAT_Y = 0.85, STEP_S = 0.4;
const step = () => prop("front_step", 0.5, STEP_Y, STEP_W, { zIndex: 4 });
const shoes = (x, color) => prop("shoes", x, STEP_TOP + 0.004, 0.06, { zIndex: 4.5, ...(color ? { color } : {}) });
const SHOES_ON_STEP = [step(), shoes(0.27), shoes(0.69, "#d8283c"), shoes(0.76, "#b26fd6")]; // the step; Berry's, Cherry's, Wendy's shoes

const sb = existsSync(new URL("storyboard.json", dir)) ? read("storyboard.json") : { version: 1 };
const analysis = existsSync(new URL("build/analysis.json", dir)) ? read("build/analysis.json") : {};
Object.assign(sb, {
  version: 1,
  title: "The Long Way Home",
  language: "en",
  fps: 30,
  directedBy: "claude",
  duration: analysis.duration ?? sb.duration ?? 100,
  endHold: 3.2,
  sfxDensity: "sparse",
  cast: dlg.cast,
});

sb.scenes = [
  // S1: their street slips past; Berry turns to look back at it, Benny keeps his eyes on the road, pleased with his plan
  scene("our-street", 0, "car",
    [berryCar("point", "surprised"), bennyCar("idle", "smug")],
    [dashboard()],
    CAR_CAM({ moves: [mv(c(2), 1.18, 0.62, 0.8), mv(c(3), 1.18, 0.38, 0.8), mv(c(4), 1.16, 0.56, 0.8)] }),
    { light: "day", actions: [
      act(c(1), "berry", "point", "surprised", { facing: "left", lookAt: { x: 0.6, y: 0 } }),
      act(c(2), "benny", "talk", "happy"),
      act(c(2, "+0.4"), "berry", "idle", "neutral", { facing: "right", lookAt: { x: 0.6, y: 0 } }),
      act(c(3), "berry", "shrug", "confused"),
      act(c(4), "benny", "idle", "thinking"),
      act(c(4, ":end"), "berry", "idle", "neutral"),
    ] }),

  // S2: cutaway, what Berry sees for two seconds: the swings, a father lifting his sleeping child from one
  scene("the-swings", c(4, ":end+0.25"), "park",
    // the child sleeps sitting on the right-hand swing's seat; the father leans in and lifts
    [actor("dad", 0.5, 0.9, 0.42, "hold", "happy", { facing: "right" }),
     actor("little", 0.7, 0.875, 0.42, "sit", "sleepy", { facing: "left", zIndex: 4.5 })],
    [prop("swing_set", 0.62, 0.88, 0.42, { zIndex: 4 })],
    { zoom: [1.12, 1.2], focus: { x: 0.52, y: 0.82 } },
    { light: "warm", actions: [act(c(4, ":end+1.3"), "dad", "hold_up", "happy")] }),

  // S3: the park slides away in the rear window; the memory of Cherry on the swings makes them both laugh
  scene("one-more-push", c(5), "car_park",
    [berryCar("explain", "smug"), bennyCar("idle", "laughing")],
    [dashboard()],
    CAR_CAM({ moves: [mv(c(6), 1.18, 0.62, 0.8), mv(c(7), 1.18, 0.4, 0.8), mv(c(8), 1.18, 0.6, 0.8), mv(c(9), 1.2, 0.38, 0.8)] }),
    { light: "day", actions: [
      act(c(5), "berry", "explain", "smug"),
      act(c(6), "benny", "explain", "happy"),
      act(c(7), "berry", "talk", "laughing"),
      act(c(7), "benny", "idle", "laughing"),
      act(c(8), "benny", "talk", "proud"),
      act(c(9), "berry", "idle", "happy"),
      act(c(9, "+1.0"), "berry", "idle", "proud"),
    ] }),

  // S4: Berry is still smiling when she sees the clock (a cut to it); her face changes; Benny offers more detour
  scene("the-clock", c(9, ":end+0.25"), "car",
    [berryCar("idle", "happy"), bennyCar("idle", "happy")],
    [dashboard()],
    CAR_CAM({ moves: [
      mv(c(9, ":end+0.55"), 1.9, 0.5, 0.9, 0),       // cut: the dashboard clock
      mv(c(10, "-0.15"), 1.16, 0.5, 0.8, 0),          // cut back
      mv(c(10, "+0.4"), 1.2, 0.62, 0.8),
      mv(c(11), 1.3, 0.34, 0.78),                     // closer on Berry
    ] }),
    { light: "day", actions: [
      act(c(9, ":end+0.4"), "berry", null, "neutral", { lookAt: { x: 0.2, y: 0.8 } }),
      act(c(10, "-0.2"), "berry", null, "worried", { lookAt: { x: 0.2, y: 0.4 } }),
      act(c(10), "benny", "explain", "excited"),
      act(c(11), "berry", "talk", "determined", { lookAt: { x: 0.6, y: 0 } }),
      act(c(11), "benny", "idle", "neutral"),
    ] }),

  // S5: "Yeah. Sure." He signals and turns the wheel; we stay on Berry, who turns to say something, then doesn't
  scene("the-turn", c(12), "car",
    [berryCar("idle", "worried", { lookAt: { x: 0.6, y: 0 } }), bennyCar("idle", "neutral")],
    [dashboard("car_dash_turn")],
    CAR_CAM({ zoom: [1.16, 1.18], moves: [mv(c(12, ":end+0.2"), 1.36, 0.32, 0.78, 0.8)] }),
    { light: "day", actions: [
      act(c(12), "benny", "idle", "determined", { lookAt: { x: 0, y: 0 } }),
      act(c(12, ":end+0.6"), "berry", "talk", "sad", { lookAt: { x: 0.7, y: 0 } }),
      act(c(12, ":end+2.0"), "berry", "idle", "sad", { lookAt: { x: -0.3, y: 0.3 } }),
    ] }),

  // S6: the kitchen. Benny fills the bowl; Berry still has her coat on and the milk in her hand.
  scene("the-kitchen", c(13, "-0.6"), "kitchen",
    [actor("berry", 0.32, 0.88, 0.48, "idle", "sad", { look: COAT, holding: "milk", facing: "right" }),
     actor("benny", 0.6, 0.88, 0.48, "hold", "neutral", { facing: "right", holding: "apple_red", lookAt: { x: 0.6, y: 0.5 } })],
    // the table stands by the stove; its top is at y 0.804 (table art: top 90 of 200 units up, size 0.38)
    [prop("table", 0.84, 0.9, 0.38, { zIndex: 4 }),
     prop("fruit_bowl_partial", 0.8, 0.804, 0.12, { zIndex: 4.5, out: c(13, ":end+1.2") }),
     prop("fruit_bowl", 0.8, 0.804, 0.12, { zIndex: 4.5, at: c(13, ":end+1.2") }),
     prop("grocery_bag", 0.92, 0.804, 0.12, { zIndex: 4.5 }),
     prop("shoes", 0.1, 0.92, 0.07, { zIndex: 6, at: c(21, ":end+2.0"), enter: "fade" })],
    { zoom: [1.2, 1.2], focus: { x: 0.5, y: 0.87 }, moves: [
      mv(c(14), 1.28, 0.6, 0.82),                 // closer on Benny as he looks up
      mv(c(16), 1.2, 0.48, 0.87),
      mv(c(20), 1.3, 0.6, 0.82, 0),               // cut to Benny: "And I drove right past it."
      mv(c(21), 1.2, 0.48, 0.87, 0),
    ] },
    { light: "warm", actions: [
      act(c(13), "benny", "hold", "neutral"),
      act(c(13, ":end+1.2"), "benny", "idle", "neutral", { holding: "" }),
      act(c(14, "-0.3"), "benny", "idle", "sad", { facing: "left", lookAt: { x: 0.3, y: 0 } }),
      act(c(15), "benny", "talk", "sad"),
      act(c(16), "berry", "talk", "thinking", { lookAt: { x: 0.3, y: -0.4 } }),
      act(c(17), "benny", "idle", "confused"),
      act(c(18), "berry", "explain", "happy", { lookAt: { x: 0.4, y: 0 } }),
      act(c(19), "berry", "talk", "happy"),
      act(c(20), "benny", "facepalm", "worried"),
      act(c(21), "berry", "idle", "smug"),
      act(c(21, ":end+0.2"), "berry", "idle", "laughing"),
      act(c(21, ":end+0.3"), "benny", "idle", "laughing"),
      act(c(21, ":end+1.2"), "benny", "hold", "happy", { holding: "milk", facing: "left" }),
      act(c(21, ":end+1.2"), "berry", "idle", "happy", { holding: "" }),
    ] }),

  // S7: dusk on the front step. The girls' shoes are next to Berry's now. Benny brings her sweater.
  scene("the-sweater", c(22, "-1.4"), STEP,
    [actor("berry", 0.4, SEAT_Y, STEP_S, "sit_front", "neutral", { facing: "right", lookAt: { x: 0, y: 0.1 } }),
     actor("benny", 0.56, STEP_TOP + 0.004, STEP_S, "present", "happy", { facing: "left", holding: "sweater", zIndex: 4.8,
       out: c(23, ":end+1.4"),
       move: [{ at: c(23, ":end+0.3"), duration: 1.0, x: 0.5, y: STEP_TOP + 0.004, ease: "sine.inOut" }] })],
    [...SHOES_ON_STEP],
    { zoom: [1.18, 1.2], focus: { x: 0.5, y: 0.84 } },
    { light: "dusk", actions: [
      act(c(22), "berry", "sit_front", "happy", { lookAt: { x: 0.5, y: -0.6 } }),
      act(c(23, "-0.4"), "berry", "sit_front", "happy", { look: BERRY_SWEATER }),
      act(c(23, "-0.4"), "benny", "idle", "happy", { holding: "" }),
    ] }),

  // S8: he comes back in his sweater; she shifts over; four seconds to settle side by side; the house game
  scene("side-by-side", c(23, ":end+1.5"), STEP,
    // she has already shifted over to make room (an actor who moves would get up and walk)
    [actor("berry", 0.4, SEAT_Y, STEP_S, "sit_front", "happy", { facing: "right", look: BERRY_SWEATER }),
     actor("benny", 0.5, STEP_TOP + 0.004, STEP_S, "idle", "happy", { facing: "left", look: BENNY_SWEATER, zIndex: 4.8,
       move: [{ at: c(23, ":end+1.7"), duration: 1.2, x: 0.58, y: SEAT_Y, ease: "sine.inOut" }] })],
    [...SHOES_ON_STEP],
    { zoom: [1.18, 1.2], focus: { x: 0.5, y: 0.84 }, moves: [mv(c(24), 1.2, 0.49, 0.85)] },
    { light: "dusk", actions: [
      act(c(23, ":end+2.9"), "benny", "sit_front", "happy", { lookAt: { x: 0, y: 0 } }),
      act(c(24), "berry", "sit_front", "thinking", { lookAt: { x: 0.5, y: 0 } }),
      act(c(25), "benny", "sit_front", "happy", { lookAt: { x: -0.5, y: 0 } }),
      act(c(26), "berry", "sit_front", "happy", { lookAt: { x: 0, y: 0.1 } }),
    ] }),

  // S9: across the street: the little green house with the crooked porch
  scene("green-house", c(27), { type: "park", time: "dusk" },
    [],
    [prop("green_house", 0.5, 0.84, 0.42, { zIndex: 2 })],
    { zoom: [1.1, 1.18], focus: { x: 0.5, y: 0.75 } },
    { light: "dusk" }),

  // S10: "You picked that one every time." Her shoulder against his; hold while they look across the street
  scene("every-time", c(28, "-0.1"), STEP,
    // her shoulder against his: Berry is drawn in front, leaning in
    [actor("berry", 0.44, SEAT_Y, STEP_S, "sit_front", "happy", { facing: "right", look: BERRY_SWEATER, lookAt: { x: 0, y: 0 }, zIndex: 5.5 }),
     actor("benny", 0.57, SEAT_Y, STEP_S, "sit_front", "laughing", { facing: "left", look: BENNY_SWEATER, lookAt: { x: 0, y: 0 } })],
    [...SHOES_ON_STEP],
    { zoom: [1.2, 1.24], focus: { x: 0.5, y: 0.85 } },
    { light: "dusk", actions: [
      act(c(28, ":end+0.4"), "benny", "sit_front", "happy"),
      act(c(28, ":end+0.8"), "berry", "sit_front", "proud"),
    ] }),
];

// the extras in the park cutaway
sb.cast.dad = { preset: "benny", name: "Dad", look: { hair: "side", hairColor: "#2b1d16", outfit: "shirt", shirt: "#5aa6e8", pants: "#3b3f5c", cargo: false, sneakers: false, shoes: "#3b2a20" } };
sb.cast.little = { preset: "kid", name: "Little one", look: { hair: "spiky", hairColor: "#5a3825", shirt: "#ffb3c7", build: "kid" } };

// Benny's sweater appears only when he comes back out (S8); in S7 he still wears his hoodie
for (const s of sb.scenes) for (const ch of s.characters) if (ch.look === undefined) delete ch.look;
writeFileSync(new URL("storyboard.json", dir), JSON.stringify(sb, null, 2) + "\n");
console.log("scenes:", sb.scenes.length, "duration:", sb.duration, "gaps:", JSON.stringify(GAPS));
