// Directs "Make a game with AI" (the user's script, spoken by Berry alone).
// Run from the repo root after `pnpm video plan make-a-game-with-ai`:  node projects/make-a-game-with-ai/direct.mjs
//
// The curiosity loop: the hook asks "how do you make a game that makes money?" (gamepad in Berry's hand, money bag
// popping up), the four steps each leave something visible on screen (a character born, code written, a bug fixed,
// a game on a phone), and the answer is the last picture: the game earning money, then Berry sending the viewer off.
//
// One setting (living room, day). A desk with a laptop stands on the right from step 1 on. The game character ("hero")
// is created in step 1, hands over to the laptop in step 2, gets tested in step 3. Zoom stays low whenever two actors
// share the frame (nobody cut at the sides).
//
//  S1 Want to create your own game…      Berry holds a gamepad; a money bag pops up beside her
//  S2 Here's how AI can help you do it!  a robot (AI) pops up; Berry presents it
//  S3 Step 1  ChatGPT designs the hero   robot "ChatGPT" over the laptop, the hero pops in and is customised on each word
//  S4 Step 2  Claude + Godot write code  hero walks to the laptop, a code window appears, "Godot", "let AI write the code!"
//  S5 Step 3  play and improve           Berry plays; a bug appears and is fixed; levels; graphics; everything is more fun
//  S6 Step 4  publish and earn           a phone with the game, "Google Play", downloads arrive, the money grows
//  S7 Your journey starts today!         Berry waves with the hero; a rocket flies off
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL("./", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, dir), "utf8").replace(/^﻿/, ""));
const sb = read("storyboard.json");

const FLOOR = 0.88, P = 0.5;
const BG = { type: "living_room", time: "day" };
const berry = (x, pose, expression, extra = {}) => ({ who: "berry", x, y: FLOOR, size: P, pose, expression, facing: "right", enter: "none", zIndex: 5, ...extra });
const hero = (x, pose, expression, extra = {}) => ({ who: "hero", x, y: FLOOR, size: P, pose, expression, facing: "left", zIndex: 5, ...extra });
const prop = (name, x, y, size, extra = {}) => ({ name, x, y, size, ...extra });
const still = { enter: "none", motion: "none" };
const DESK_X = 0.69;
// the laptop floats at the right from step 1 to step 3 (the same place in every shot)
const desk = () => [prop("laptop", DESK_X, 0.7, 0.24, { zIndex: 4, face: "happy", motion: "float", enter: "none" })];
// a step marker under the captions
const step = (n) => ({ text: `Step ${n}`, style: "date", x: 0.5, y: 0.34, at: 0 });
const cam = (z0, z1, fx = 0.5, fy = 0.82, extra = {}) => ({ zoom: [z0, z1], focus: { x: fx, y: fy }, ...extra });
const mv = (at, zoom, fx, dur = 0.5, fy = 0.82) => ({ at, zoom, focus: { x: fx, y: fy }, duration: dur });
const scene = (id, start, characters, props, camera, extra = {}) =>
  ({ id, start, layout: "story", speaker: "berry", bg: BG, light: "warm", characters, props, camera, ...extra });

sb.directedBy = "claude";
sb.duration = read("build/analysis.json").duration ?? sb.duration;
sb.endHold = 1.5;
sb.sfxDensity = "sparse";
sb.cast = { berry: { preset: "berry", name: "Berry" }, hero: { preset: "kid", name: "Hero" } };

sb.scenes = [
  // S1: the hook is on screen from the first frame: a gamepad in her hand, a question on her face
  scene("hook", 0,
    [berry(0.42, "hold", "excited", { holding: "gamepad" })],
    [prop("moneybag", 0.74, 0.62, 0.22, { at: "@money", face: "happy", motion: "bounce" })],
    cam(1.1, 1.26, 0.55, 0.78, { punch: ["@money"] }),
    { actions: [{ at: "@money", who: "berry", pose: "present", expression: "excited", emote: "sparkle" }] }),
  // S2: "AI" arrives
  scene("ai", 3.3,
    [berry(0.3, "hold", "determined")],
    [prop("robot", 0.7, 0.6, 0.26, { at: "@AI", face: "happy", label: "AI", motion: "float" })],
    cam(1.05, 1.18, 0.5, 0.8),
    { actions: [{ at: "@AI", who: "berry", pose: "point", expression: "excited" }, { at: "@help", who: "berry", pose: "present", expression: "proud" }] }),
  // S3: step 1, ChatGPT designs the character
  scene("step-1", 5.66,
    [berry(0.24, "talk", "happy"), hero(0.52, "idle", "neutral", { at: 3.15, enter: "pop" })],
    [...desk(), prop("robot", DESK_X, 0.4, 0.18, { at: "@ChatGPT", face: "happy", label: "ChatGPT", motion: "float" })],
    cam(1.0, 1.12, 0.52, 0.82, { moves: [mv("@Describe", 1.14, 0.45, 0.6)] }),
    {
      texts: [step(1)],
      actions: [
        { at: "@ChatGPT", who: "berry", pose: "point", expression: "excited" },
        { at: "@design", who: "berry", pose: "explain", expression: "happy" },
        { at: "@character", who: "hero", pose: "wave", expression: "excited", emote: "sparkle" },
        { at: "@appearance", who: "hero", pose: "present", look: { hat: "helmet", hatColor: "#5b6b3a", shirtSymbol: "star" } },
        { at: "@personality", who: "hero", expression: "smug", pose: "hips" },
        { at: "@abilities", who: "hero", expression: "determined", pose: "fist", emote: "exclaim" },
      ],
    }),
  // S4: step 2, Claude and Godot write the game
  scene("step-2", 13.01,
    [berry(0.24, "talk", "happy"), hero(0.5, "idle", "happy", { move: [{ at: "@Claude", duration: 0.9, x: 0.54, facing: "right" }] })],
    [...desk(),
      prop("code_window", DESK_X, 0.45, 0.24, { at: "@build", face: "happy", motion: "float", out: "@Godot" }),
      prop("gamepad", DESK_X, 0.45, 0.2, { at: "@Godot", face: "happy", motion: "bounce" })],
    cam(1.0, 1.12, 0.52, 0.82, { moves: [mv("@Yes", 1.14, 0.5, 0.5)] }),
    {
      transition: "slide",
      texts: [step(2), { text: "Godot", style: "label", x: 0.66, y: 0.575, at: "@Godot" }, { text: "Claude", style: "label", x: 0.66, y: 0.575, at: "@Claude", out: "@build" }],
      actions: [
        { at: "@give", who: "berry", pose: "present", expression: "excited" },
        { at: "@Claude", who: "berry", pose: "point", expression: "happy" },
        { at: "@build", who: "berry", pose: "explain", expression: "determined" },
        { at: "@Yes", who: "berry", pose: "cheer", expression: "laughing", emote: "idea" },
        { at: "@Yes", who: "hero", pose: "celebrate", expression: "excited" },
      ],
    }),
  // S5a: "Now play it!"
  scene("play", 20.25,
    [berry(0.26, "cheer", "excited", { holding: "gamepad" }), hero(0.55, "cheer", "excited")],
    [...desk(), prop("level_map", DESK_X, 0.45, 0.24, { at: 0.1, face: "happy", motion: "bounce" })],
    cam(1.0, 1.1, 0.5, 0.82, { punch: [0.1] }),
    { texts: [step(3)], transition: "slide", actions: [{ at: "@it", who: "berry", pose: "fist", expression: "determined" }] }),
  // S5b: test, fix, improve
  scene("improve", 21.41,
    [berry(0.26, "hold", "determined", { holding: "gamepad" }), hero(0.55, "think", "thinking")],
    [...desk(),
      prop("level_map", DESK_X, 0.45, 0.24, { at: 0, ...still }),
      prop("bug", 0.62, 0.34, 0.18, { at: "@fix", out: "@add", face: "worried", motion: "bounce" }),
      prop("check", 0.62, 0.34, 0.16, { at: "@add", out: "@improve", motion: "bounce" }),
      prop("palette", 0.5, 0.44, 0.18, { at: "@improve", out: "@keep", face: "happy", motion: "float" })],
    cam(1.0, 1.1, 0.5, 0.82),
    {
      actions: [
        { at: "@Test", who: "hero", pose: "point", expression: "determined" },
        { at: "@fix", who: "berry", pose: "scared", expression: "worried", emote: "sweat" },
        { at: "@fix", who: "hero", pose: "shrug", expression: "worried" },
        { at: "@add", who: "berry", pose: "cheer", expression: "happy" },
        { at: "@improve", who: "berry", pose: "explain", expression: "excited" },
        { at: "@keep", who: "berry", pose: "celebrate", expression: "laughing", emote: "sparkle" },
        { at: "@keep", who: "hero", pose: "celebrate", expression: "excited" },
      ],
    }),
  // S6: step 4, publish and earn
  scene("publish", 27.82,
    [berry(0.22, "present", "excited"), hero(0.46, "idle", "happy")],
    [prop("phone", 0.77, 0.58, 0.3, { at: "@publish", face: "happy", motion: "float" }),
      prop("arrow_down", 0.66, 0.4, 0.14, { at: "@download", out: "@turn", motion: "bounce" }),
      prop("moneybag", 0.5, 0.5, 0.2, { at: "@turn", face: "happy", motion: "bounce" }),
      prop("coins", 0.84, 0.42, 0.16, { at: "@business", motion: "bounce" })],
    cam(1.0, 1.1, 0.5, 0.82, { punch: ["@business"] }),
    {
      transition: "slide",
      texts: [step(4), { text: "Google Play", style: "label", x: 0.7, y: 0.43, at: "@Google", out: "@let" }],
      actions: [
        { at: "@publish", who: "berry", pose: "point", expression: "excited" },
        { at: "@download", who: "hero", pose: "cheer", expression: "excited" },
        { at: "@turn", who: "berry", pose: "explain", expression: "proud" },
        { at: "@business", who: "berry", pose: "celebrate", expression: "laughing", emote: "sparkle" },
        { at: "@business", who: "hero", pose: "celebrate", expression: "love" },
      ],
    }),
  // S7: the send-off
  scene("journey", 34.68,
    [berry(0.36, "wave", "excited"), hero(0.62, "wave", "excited")],
    [prop("rocket", 0.7, 0.6, 0.2, { at: "@journey", motion: "float", move: [{ at: "@journey", duration: 1.2, x: 0.74, y: -0.2, ease: "power2.in" }] })],
    cam(1.0, 1.1, 0.5, 0.82),
    { transition: "iris", actions: [{ at: "@today", who: "berry", pose: "cheer", expression: "laughing", emote: "love" }] }),
];

writeFileSync(new URL("storyboard.json", dir), JSON.stringify(sb, null, 2));
console.log("directed", sb.scenes.length, "scenes");
