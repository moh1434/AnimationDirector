// Directs "The Door at the Roots", episode 1 of Lost Things Returned Here (DEV/Scripts/05-lost-things-returned-here-series.txt).
// Run from the repo root after `pnpm video plan lost-things-1`:  node projects/lost-things-1/direct.mjs
//
// One place (the forest beside the old tree), one night. Screen direction: Cherry (.15) and Berry (.32) stand LEFT of the
// tree facing right; Benny stands RIGHT of it facing left; the little door is at the tree's foot between them.
// The cupboard is a hollow in the tree (not a room); the tiny door is a separate prop laid over the hollow.
//
// Beat table:
//  S1 clips 1-4    the tiny door trembles outward; the sign (a lost button) is on it; the friends joke
//  S2 clips 5-7    Berry opens the cupboard: a button on the low shelf (the duck sits beside it, a star hides behind the duck)
//  S3 clips 8-9    the duck rolls forward; the knocking goes on behind it (the star's tip jiggles beside the duck)
//  S4 clips 10-11  a tiny snail creeps to the threshold; Benny walks carefully over/past it
//  S5 clips 12-13  Berry lifts the duck aside (it is in her hand): a small trembling star taps the back of the cupboard
//  S6 clips 14-15  the star tries to rise, falls back into Berry's hands and points upward
//  S7 clips 16-17  in the sky above the tree, a ring of stars with one dark gap
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL("./", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, dir), "utf8").replace(/^﻿/, ""));
const sb = read("storyboard.json");

const FLOOR = 0.88, P = 0.46;
const BG = { type: "forest", color: "#1b2652", color2: "#1f3f35" };
const LIGHT = "night";
const X = { cherry: 0.2, berry: 0.37, benny: 0.86 };
const actor = (who, pose = "idle", expression = "neutral", extra = {}) =>
  ({ who, x: X[who], y: FLOOR, size: P, pose, expression, facing: who === "benny" ? "left" : "right", enter: "none", zIndex: 5, ...extra });
const prop = (name, x, y, size, extra = {}) =>
  ({ name, x, y, size, at: 0, anchor: "bottom", enter: "none", motion: "none", ...extra });

// the tree: its base on y=TREE.y; the cupboard hollow is x 80-120, y 144-200 of the 200-unit art (a unit is size*1080/200 px)
const TREE = { x: 0.58, y: 0.86, size: 0.85 };
const UNIT = (TREE.size * 1080) / 200;
const tree = () => prop("old_tree", TREE.x, TREE.y, TREE.size, { zIndex: 1 });
const door = (name = "tiny_door", extra = {}) => prop(name, TREE.x, TREE.y, TREE.size, { zIndex: 2, ...extra });
// the lower shelf's top is 13 units above the floor of the hollow
const SHELF_Y = TREE.y - (13 * UNIT) / 1920;
const moon = () => prop("moon", 0.86, 0.38, 0.1, { anchor: "center", zIndex: 0 });

const cam = (z0, z1, fx = 0.5, fy = 0.82, extra = {}) => ({ zoom: [z0, z1], focus: { x: fx, y: fy }, ...extra });
const shot = (id, clip, characters, props, camera, extra = {}) =>
  ({ id, start: clip === 1 ? 0 : `clip:${clip}`, layout: "story", speaker: "none", bg: BG, light: LIGHT, characters, props: [moon(), tree(), ...props], camera, ...extra });
const act = (clip, who, pose, expression, extra = {}) => ({ at: `clip:${clip}`, who, pose, expression, ...extra });

sb.directedBy = "claude";
sb.duration = read("build/analysis.json").duration ?? sb.duration;
sb.endHold = 1.6;
sb.sfxDensity = "sparse";
sb.cast = { benny: { preset: "benny", name: "Benny" }, berry: { preset: "berry", name: "Berry" }, cherry: { preset: "cherry", name: "Cherry" } };

// the little things in the cupboard (lower shelf): the button, the duck; the star hides behind the duck
const BUTTON = (extra = {}) => prop("button", TREE.x - 0.028, SHELF_Y + 0.005, 0.075, { zIndex: 3, ...extra });
const DUCK = (extra = {}) => prop("toy_duck", TREE.x + 0.03, SHELF_Y + 0.004, 0.105, { zIndex: 4, ...extra });
const STAR_BEHIND = (extra = {}) => prop("star_pal", TREE.x + 0.035, SHELF_Y + 0.004, 0.07, { zIndex: 3, motion: "shake", ...extra });
const SNAIL_END = { x: TREE.x + 0.05, y: TREE.y + 0.012 };

sb.scenes = [
  shot("the-knock", 1,
    [actor("cherry", "idle", "happy"), actor("berry", "idle", "neutral"), actor("benny", "point", "worried")],
    [door("tiny_door", { motion: "shake" })],
    cam(1.0, 1.03),
    { actions: [act(1, "benny", "point", "worried"), act(2, "berry", "point_down", "thinking"), act(3, "cherry", "hips", "smug"), act(4, "benny", "shrug", "smug")],
      sfx: [{ at: 0.4, name: "tick" }, { at: "clip:2", name: "tick" }] }),
  shot("the-button", 5,
    [actor("cherry", "idle", "happy"), actor("berry", "point_down", "excited"), actor("benny", "idle", "neutral")],
    [door("tiny_door", { out: "clip:5+0.4" }), door("tiny_door_open", { at: "clip:5+0.4", enter: "pop" }), BUTTON(), DUCK(), STAR_BEHIND()],
    cam(1.04, 1.1, 0.52, 0.8),
    { actions: [act(5, "berry", "point_down", "excited"), act(6, "benny", "explain", "smug"), act(7, "cherry", "present", "thinking")] }),
  shot("the-duck", 8,
    [actor("cherry", "idle", "thinking"), actor("berry", "point_down", "thinking"), actor("benny", "point", "confused")],
    [door("tiny_door_open"), BUTTON(),
     DUCK({ move: [{ at: "clip:8+0.2", duration: 1.0, x: TREE.x + 0.005, y: SHELF_Y + 0.014, ease: "sine.inOut" }], motion: "shake" }),
     STAR_BEHIND({ x: TREE.x + 0.005 })],
    cam(1.06, 1.12, 0.54, 0.8),
    { actions: [act(8, "benny", "point", "confused"), act(9, "berry", "point_down", "thinking")], sfx: [{ at: "clip:9", name: "tick" }, { at: "clip:9+0.5", name: "tick" }] }),
  shot("the-snail", 10,
    [actor("cherry", "idle", "worried"), actor("berry", "idle", "worried"),
     actor("benny", "idle", "worried", { move: [{ at: "clip:10+0.7", duration: 1.5, x: 0.76, pose: "walk", ease: "sine.inOut" }] })],
    [door("tiny_door_open"), BUTTON(), DUCK({ x: TREE.x + 0.005, y: SHELF_Y + 0.016 }), STAR_BEHIND({ x: TREE.x + 0.005 }),
     prop("snail", 1.02, SNAIL_END.y, 0.085, { flip: true, zIndex: 4, move: [{ at: "clip:10", duration: 3.6, x: SNAIL_END.x, ease: "sine.inOut" }] })],
    cam(1.04, 1.1, 0.6, 0.82),
    { actions: [act(10, "benny", "bow", "worried"), act(11, "cherry", "explain", "worried"), act(11, "berry", "idle", "worried")] }),
  shot("the-star", 12,
    [actor("cherry", "idle", "surprised"), actor("berry", "hold_up", "surprised", { holding: "toy_duck", zIndex: 6 }), actor("benny", "explain", "confused", { x: 0.76 })],
    [door("tiny_door_open"), BUTTON(), prop("star_pal", TREE.x + 0.005, SHELF_Y + 0.01, 0.085, { zIndex: 3, motion: "shake" }),
     prop("snail", SNAIL_END.x, SNAIL_END.y, 0.085, { flip: true, zIndex: 4 })],
    cam(1.06, 1.12, 0.52, 0.8),
    { actions: [act(12, "berry", "hold_up", "surprised", { holding: "toy_duck" }), act(13, "benny", "explain", "worried")] }),
  shot("the-fall", 14,
    [actor("cherry", "idle", "worried"), actor("berry", "hold", "worried", { x: 0.34 }), actor("benny", "idle", "thinking", { x: 0.76 })],
    [door("tiny_door_open"), BUTTON(), prop("toy_duck", 0.71, 0.89, 0.105, { zIndex: 4 }), prop("snail", SNAIL_END.x, SNAIL_END.y, 0.085, { flip: true, zIndex: 4 }),
     prop("star_pal", TREE.x + 0.005, SHELF_Y + 0.01, 0.085, { zIndex: 3, out: "clip:14+1.9",
       move: [{ at: "clip:14+0.3", duration: 0.7, x: TREE.x + 0.005, y: SHELF_Y - 0.1, ease: "power2.out" }, { at: "clip:14+1.0", duration: 0.55, x: 0.45, y: 0.79, ease: "power2.in" }] }),
     prop("star_pal_up", 0.45, 0.79, 0.11, { zIndex: 6, at: "clip:14+1.9", enter: "pop" })],
    cam(1.06, 1.12, 0.48, 0.8),
    { actions: [act(14, "berry", "hold", "worried"), act(15, "cherry", "point_up", "thinking", { facing: "right", zIndex: 6 })] }),
  shot("the-gap", 16,
    [actor("cherry", "point_up", "thinking", { zIndex: 6 }), actor("berry", "hold", "worried", { x: 0.34, lookAt: { x: 0.2, y: -1 } }), actor("benny", "shrug", "smug", { x: 0.76 })],
    [door("tiny_door_open"), BUTTON(), prop("toy_duck", 0.71, 0.89, 0.105, { zIndex: 4 }), prop("snail", SNAIL_END.x, SNAIL_END.y, 0.085, { flip: true, zIndex: 4 }),
     prop("star_pal_up", 0.45, 0.79, 0.11, { zIndex: 6 }),
     prop("star_ring", 0.58, 0.3, 0.2, { anchor: "center", zIndex: 1, at: "clip:16", enter: "fade" })],
    cam(1.0, 1.04, 0.5, 0.7),
    { actions: [act(16, "berry", "hold", "worried", { lookAt: { x: 0.2, y: -1 } }), act(17, "benny", "shrug", "smug"), act(17, "cherry", "idle", "happy")] }),
];
for (const s of sb.scenes) for (const a of s.actions ?? []) if (a.expression === "curious") a.expression = "thinking";
writeFileSync(new URL("storyboard.json", dir), JSON.stringify(sb, null, 2) + "\n");
console.log("scenes:", sb.scenes.length, "duration:", sb.duration);
