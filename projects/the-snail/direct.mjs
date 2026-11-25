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
// Directs "The Snail" (DEV/Scripts/logical-fallacies/episodes/03-the-snail.txt). Run from the repo root:
//   node projects/the-snail/direct.mjs ; pnpm video plan the-snail ; node projects/the-snail/direct.mjs
// Garage: Wendy left, Cherry right, the game screen in front of them with its back to us. Hallway: the garage door is on the right.
const GAPS = { 2: 1.6, 7: 1.6, 9: 1.5, 11: 2.2, 12: 1.0, 16: 0.4, 17: 1.0, 19: 3.1, 20: 0.6, 25: 8.2, 26: 1.8, 29: 2.1, 33: 1.4, 36: 1.2, 37: 2.4, 38: 3.4 };
const cast = { wendy: { preset: "wendy", name: "Wendy" }, cherry: { preset: "cherry", name: "Cherry" }, benny: { preset: "benny", name: "Benny" } };

const GY = 0.9, GS = 0.48;
const garage = (time = "day") => ({ type: "garage", time });
const sit = (who, x, expr, extra = {}) => actor(who, x, GY, GS, "sit_front", expr, { ...look(0, 0.45), ...extra });
const pouf = (x, color, color2) => prop("pouf", x, 0.89, 0.15, { zIndex: 3, ...(color ? { color, color2 } : {}) });
const seats = () => [pouf(0.3), pouf(0.6, "#e53950", "#f2707f")];
const screen = () => prop("screen_back", 0.45, 1.035, 0.36, { zIndex: 6 });
const G_CAM = (extra = {}) => ({ zoom: [1.08, 1.12], focus: { x: 0.46, y: 0.88 }, ...extra });

const HY = 0.9, HS = 0.46;
const doorway = () => prop("open_doorway", 0.779, 0.834, 0.55, { zIndex: 2 });

const scenes = [
  // S1: pretend I'm not here
  scene("play", 0, garage(),
    [sit("wendy", 0.3, "excited", { facing: "right", holding: "clipboard", ...look(0.6, 0.1) }), sit("cherry", 0.6, "neutral", { facing: "left", holding: "gamepad" })],
    [...seats(), screen()],
    G_CAM({ moves: [mv(end(1, 0.2), 1.14, 0.5, 0.88)] }),
    { light: "warm", actions: [act(end(1, 0.2), "cherry", "sit_front", "determined")] }),
  // S2: she is very much here
  scene("breathing", c(2, "-0.9"), garage(),
    [sit("wendy", 0.44, "excited", { facing: "right", holding: "clipboard", zIndex: 4, ...look(0.6, 0.4) }), sit("cherry", 0.6, "neutral", { facing: "left", holding: "gamepad" })],
    [pouf(0.44), pouf(0.6, "#e53950", "#f2707f"), screen()],
    G_CAM({ zoom: [1.2, 1.22], focus: { x: 0.5, y: 0.88 } }),
    { light: "warm", actions: [act(c(2), "cherry", "sit_front", "disgusted", { facing: "left", ...look(0.6, 0) }), act(c(2, "+0.6"), "wendy", "sit_front", "surprised")] }),
  // S3: "It's good." And Benny with a spoon.
  scene("good", c(3, "-0.1"), garage(),
    [sit("wendy", 0.3, "worried", { facing: "right", holding: "clipboard", ...look(0.6, 0) }), sit("cherry", 0.6, "neutral", { facing: "left", holding: "gamepad" }),
     actor("benny", 1.2, 0.87, GS, "hold", "happy", { facing: "left", holding: "cooking_spoon", zIndex: 6, out: end(8, 1.5), move: [{ at: end(6, 0.2), duration: 1.1, x: 0.87, y: 0.87 }, { at: end(8, 0.5), duration: 1.0, x: 1.25, y: 0.87 }] })],
    [...seats(), screen()],
    G_CAM({ zoom: [1.1, 1.12], moves: [mv(c(4), 1.14, 0.5, 0.88), mv(end(6, 0.2), 1.0, 0.5, 0.88), mv(c(9), 1.14, 0.46, 0.88), mv(end(10, 0.2), 1.2, 0.4, 0.88)] }),
    { light: "warm", actions: [
      act(c(4), "cherry", "sit_front", "neutral"),
      act(c(5), "wendy", "sit_front", "worried", look(0.6, 0)),
      act(c(6), "cherry", "sit_front", "happy", { facing: "left", ...look(0.6, 0) }),
      act(end(6, 0.2), "wendy", "sit_front", "neutral", look(0.2, 0.7)),
      act(c(7), "benny", "hold", "excited"),
      act(c(8), "cherry", "sit_front", "happy", look(-0.6, -0.3)),
      act(c(8, "+0.3"), "benny", "hold", "proud"),
      act(end(8, 0.3), "wendy", "sit_front", "thinking", { facing: "right", ...look(0.7, 0) }),
      act(c(9), "cherry", "sit_front", "surprised", { facing: "left", ...look(0.6, 0) }),
      act(c(10), "cherry", "sit_front", "smug"),
      act(end(10, 0.3), "wendy", "sit_front", "sad", look(0.1, 0.8)),
      act(c(11), "wendy", "sit_front", "worried", { facing: "right", ...look(0.7, 0) }),
      act(c(11, "+0.5"), "cherry", "sit_front", "scared", look(0, 0.5)),
    ] }),
  // S4: the snail and the tower
  scene("homework", c(12, "-0.3"), garage(),
    [sit("wendy", 0.3, "confused", { facing: "right", holding: "clipboard", ...look(0.3, 0.5) }), sit("cherry", 0.6, "neutral", { facing: "left", holding: "gamepad" })],
    [...seats(), screen()],
    G_CAM({ moves: [mv(c(13), 1.16, 0.49, 0.88), mv(c(14), 1.14, 0.42, 0.88), mv(c(15), 1.18, 0.49, 0.88), mv(c(16), 1.14, 0.44, 0.88), mv(c(17), 1.1, 0.5, 0.88), mv(c(18), 1.18, 0.49, 0.88), mv(end(18, 0.3), 1.26, 0.36, 0.88, 0), mv(c(20), 1.12, 0.52, 0.88, 0), mv(c(22), 1.14, 0.44, 0.88), mv(c(23), 1.16, 0.58, 0.88)] }),
    { light: "warm", actions: [
      act(c(13), "cherry", "sit_front", "happy"),
      act(c(14), "wendy", "sit_front", "confused", look(0.7, 0)),
      act(c(15), "cherry", "sit_front", "excited", look(0, 0.4)),
      act(c(16), "wendy", "sit_front", "determined", look(0.2, 0.6)),
      act(c(16, "+0.8"), "cherry", "sit_front", "shocked", { facing: "left", ...look(0.6, 0) }),
      act(end(16, 0.2), "cherry", "sit_front", "sad", look(0.1, 0.6)),
      act(c(17), "wendy", "sit_front", "excited", look(0.7, 0)),
      act(c(18), "cherry", "sit_front", "sad", look(0.3, 0.4)),
      act(end(18, 0.3), "wendy", "sit_front", "shocked", look(0.6, 0)),
      act(end(18, 1.6), "wendy", "sit_front", "sad", look(0.1, 0.8)),
      act(c(19), "wendy", "sit_front", "sad"),
      act(c(20), "cherry", "sit_front", "worried", look(0.6, 0)),
      act(c(21), "cherry", "sit_front", "sad"),
      act(c(22), "wendy", "sit_front", "neutral", look(-0.6, 0.3)),
      act(c(23), "cherry", "sit_front", "worried", look(0.6, 0)),
      act(c(24), "wendy", "sit_front", "neutral", look(-0.8, 0.2)),
    ] }),

  // S5: the closed door
  scene("the-door", end(24, 0.6), "hallway",
    [actor("cherry", 0.42, HY, HS, "idle", "sad", { facing: "right", ...look(0.7, 0) })], [],
    { zoom: [1.06, 1.1], focus: { x: 0.56, y: 0.86 } }, { light: "warm", actions: [act(end(24, 2.0), "cherry", "idle", "sad", look(0.2, 0.6))] }),
  scene("sits", end(24, 2.8), "hallway",
    [actor("cherry", 0.4, 0.915, HS, "sit_front", "sad", { facing: "right", ...look(0.1, 0.5) })], [pouf(0.4, "#e8836b", "#f2a98f")],
    { zoom: [1.14, 1.18], focus: { x: 0.48, y: 0.87 } }, { light: "warm" }),

  // S6: Wendy, alone, walking a snail
  scene("walking-a-snail", end(24, 4.4), garage("night"),
    [sit("wendy", 0.45, "sad", { facing: "right", holding: "gamepad" })],
    [pouf(0.45), prop("clipboard", 0.8, 0.94, 0.1, { zIndex: 4 }), screen()],
    G_CAM({ zoom: [1.16, 1.24], focus: { x: 0.5, y: 0.88 }, tilt: [0, 1.6] }),
    { light: "dusk", actions: [
      act(end(24, 5.6), "wendy", "sit_front", "thinking"),
      act(end(24, 7.0), "wendy", "sit_front", "happy", look(0.4, 0.4)),
      act(c(25), "wendy", "sit_front", "happy", look(-0.5, 0.4)),
      act(end(25, 0.2), "wendy", "sit_front", "love", look(-0.4, 0.4)),
    ] }),

  // S7: she opens the door
  scene("opens", end(25, 0.9), { type: "hallway", time: "dusk" },
    [actor("cherry", 0.4, 0.915, HS, "sit_front", "surprised", { facing: "right", ...look(0.7, -0.3) }), actor("wendy", 0.75, HY - 0.03, HS, "hold", "surprised", { facing: "left", holding: "clipboard", ...look(0.6, 0.4) })],
    [doorway(), pouf(0.4, "#e8836b", "#f2a98f")],
    { zoom: [1.06, 1.1], focus: { x: 0.54, y: 0.86 }, moves: [mv(c(27), 1.14, 0.46, 0.87), mv(c(28), 1.14, 0.62, 0.86), mv(end(28, 0.2), 1.18, 0.44, 0.87), mv(c(30), 1.1, 0.56, 0.86)] },
    { light: "dusk", sfx: [{ at: 0.02, name: "creak" }], actions: [
      act(c(26), "wendy", "hold", "surprised"),
      act(c(27), "cherry", "sit_front", "neutral", look(0.4, 0.2)),
      act(c(28), "wendy", "hold", "smug"),
      act(end(28, 0.2), "cherry", "sit_front", "surprised", look(0.7, -0.4)),
      act(c(29), "cherry", "sit_front", "worried"),
      act(c(30), "wendy", "hold", "happy"),
      act(c(31), "wendy", "hold", "confused"),
      act(c(32), "cherry", "sit_front", "happy", look(0.6, -0.3)),
      act(end(32, 0.1), "wendy", "hold", "happy", look(0.5, 0.4)),
    ] }),

  // S8: on the floor next to her
  scene("next-to-her", end(32, 0.6), { type: "hallway", time: "dusk" },
    [actor("cherry", 0.36, 0.915, HS, "sit_front", "neutral", { facing: "right", ...look(0.5, 0) }), actor("wendy", 0.62, 0.915, HS, "sit_front", "neutral", { facing: "left", holding: "clipboard", ...look(0.4, 0.2) })],
    [doorway(), pouf(0.36, "#e8836b", "#f2a98f"), pouf(0.62), prop("clipboard", 0.78, 0.945, 0.12, { zIndex: 6, at: end(35, 0.4), move: [{ at: end(36, 1.0), duration: 0.9, x: 1.2, y: 0.945, ease: "power2.in" }] })],
    { zoom: [1.12, 1.16], focus: { x: 0.5, y: 0.87 }, moves: [mv(c(34), 1.18, 0.44, 0.87), mv(c(35), 1.18, 0.54, 0.87), mv(end(35, 0.4), 1.12, 0.5, 0.88), mv(end(36, 0.3), 1.14, 0.58, 0.88)] },
    { light: "dusk", actions: [
      act(c(33), "wendy", "sit_front", "sad"),
      act(c(34), "cherry", "sit_front", "sad", look(0.3, 0.4)),
      act(c(35), "wendy", "sit_front", "happy", look(0.6, 0)),
      act(end(35, 0.4), "wendy", "sit_front", "happy", { holding: "gamepad" }),
      act(end(35, 0.4), "cherry", "sit_front", "surprised", look(0.5, 0.5)),
      act(c(36), "cherry", "sit_front", "thinking", look(0.6, 0)),
      act(end(36, 0.3), "wendy", "sit_front", "surprised", look(0.1, 0.7)),
      act(end(36, 1.2), "wendy", "sit_front", "neutral"),
      act(c(37), "wendy", "sit_front", "happy", look(0.6, 0)),
      act(end(37, 0.1), "cherry", "sit_front", "happy"),
    ] }),

  // S9: where the snail goes; and the spoon again
  scene("too-salty", end(37, 0.7), garage("night"),
    [sit("wendy", 0.3, "happy", { facing: "right", zIndex: 4 }), sit("cherry", 0.5, "excited", { facing: "left", holding: "gamepad" }),
     actor("benny", 1.2, 0.87, GS, "hold", "happy", { facing: "left", holding: "cooking_spoon", zIndex: 6, move: [{ at: end(37, 1.6), duration: 1.1, x: 0.8, y: 0.87 }] })],
    [pouf(0.3), pouf(0.5, "#e53950", "#f2707f"), screen()],
    G_CAM({ zoom: [1.0, 1.02], tilt: [1.2, 0], focus: { x: 0.52, y: 0.88 } }),
    { light: "dusk", actions: [
      act(end(37, 2.4), "cherry", "sit_front", "thinking", { holding: "cooking_spoon", ...look(0.2, 0.4) }),
      act(end(37, 2.4), "benny", "idle", "excited", { holding: "" }),
      act(c(38), "cherry", "sit_front", "disgusted"),
      act(c(38, "+0.5"), "benny", "idle", "shocked"),
      act(c(39), "benny", "shrug", "shocked"),
      act(c(39, "+0.6"), "wendy", "sit_front", "laughing", look(0.5, 0)),
      act(c(39, "+0.8"), "cherry", "sit_front", "laughing", look(0.5, 0)),
      act(end(39, 0.8), "benny", "facepalm", "laughing"),
    ] }),
];
save("The Snail", GAPS, cast, scenes, 2.6);
