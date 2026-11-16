// Directs "The Wrong Way Up", episode 2 of Lost Things Returned Here (DEV/Scripts/05-lost-things-returned-here-series.txt).
// Run from the repo root after `pnpm video plan lost-things-2`:  node projects/lost-things-2/direct.mjs
//
// Same night as episode 1. Three adjoining places, one journey, always downhill toward the pond (screen RIGHT):
//   the clearing with Berry's low crate tower (S1-S2), the top of the hill (S3-S4), the pond's bank (S5-S6).
// The star (small, palm-sized) is a silent prop; its moods are the star_pal drawings. The empty ring of stars hangs in the sky
// of the opening shots.
//
// Beat table:
//  S1 clips 1-4    the star hops off Berry's two-crate tower and heads toward the distant pond
//  S2 clips 5-8    Berry points skyward from the sturdy tower; the star keeps looking downhill (arm toward the pond)
//  S3 clips 9-13   on the hill Benny holds the star up toward the sky while it points back toward the pond
//  S4 clips 14-17  Cherry sits beside the star; the pond lies below them
//  S5 clips 18-20  the star waves at its own reflection in the pond, beside a thin silver streak of moonlight
//  S6 clips 21-23  the star nods, looks toward the paling horizon, and droops
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL("./", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, dir), "utf8").replace(/^﻿/, ""));
const sb = read("storyboard.json");

const FLOOR = 0.88, P = 0.46;
const LIGHT = "night";
const NIGHT = (extra = {}) => ({ type: "forest", color: "#1b2652", color2: "#1f3f35", ...extra });
const actor = (who, x, pose = "idle", expression = "neutral", extra = {}) =>
  ({ who, x, y: FLOOR, size: P, pose, expression, facing: x < 0.5 ? "right" : "left", enter: "none", zIndex: 5, ...extra });
const prop = (name, x, y, size, extra = {}) =>
  ({ name, x, y, size, at: 0, anchor: "bottom", enter: "none", motion: "none", ...extra });

// the crate tower: two crates, each a box 0.2 wide whose art is 110 units (of 200) tall
const CRATE = 0.2, CRATE_H = (110 * CRATE * 1080) / 200 / 1920;
const tower = (x) => [prop("crate", x, FLOOR, CRATE, { zIndex: 3 }), prop("crate", x, FLOOR - CRATE_H, CRATE, { zIndex: 3 })];
const TOWER_TOP = FLOOR - 2 * CRATE_H;
const moon = () => prop("moon", 0.86, 0.38, 0.1, { anchor: "center", zIndex: 0 });
const ring = () => prop("star_ring", 0.3, 0.4, 0.22, { anchor: "center", zIndex: 1 });
const hill = (x = 0.16) => prop("hill", x, 0.86, 1.05, { zIndex: 0.5 });
const pondFar = (x = 0.9, y = 0.8, size = 0.4) => prop("pond", x, y, size, { zIndex: 0.6 });

const cam = (z0, z1, fx = 0.5, fy = 0.82, extra = {}) => ({ zoom: [z0, z1], focus: { x: fx, y: fy }, ...extra });
const mv = (clip, zoom, fx, dur = 0.5, fy = 0.82) => ({ at: `clip:${clip}`, zoom, focus: { x: fx, y: fy }, duration: dur });
const shot = (id, clip, bg, characters, props, camera, extra = {}) =>
  ({ id, start: clip === 1 ? 0 : `clip:${clip}`, layout: "story", speaker: "none", bg, light: LIGHT, characters, props, camera, ...extra });
const act = (clip, who, pose, expression, extra = {}) => ({ at: `clip:${clip}`, who, pose, expression, ...extra });

sb.directedBy = "claude";
sb.duration = read("build/analysis.json").duration ?? sb.duration;
sb.endHold = 1.6;
sb.sfxDensity = "sparse";
sb.cast = { benny: { preset: "benny", name: "Benny" }, berry: { preset: "berry", name: "Berry" }, cherry: { preset: "cherry", name: "Cherry" } };

const STAR = 0.09;
sb.scenes = [
  // S1: the star on the tower hops off and walks toward the pond (right); Berry (left) is exasperated
  shot("running-away", 1, NIGHT(),
    [actor("berry", 0.2, "point", "worried"), actor("cherry", 0.62, "idle", "neutral"), actor("benny", 0.82, "idle", "smug")],
    [moon(), ring(), hill(), pondFar(), ...tower(0.38),
     prop("star_pal", 0.38, TOWER_TOP, STAR, { zIndex: 8,
       move: [{ at: "clip:1+1.2", duration: 0.5, x: 0.5, y: 0.915, ease: "power2.in" }, { at: "clip:2", until: "clip:4:end", x: 0.9, y: 0.915, ease: "sine.inOut" }] })],
    cam(1.0, 1.04),
    { actions: [act(1, "berry", "point", "worried"), act(2, "benny", "explain", "smug"), act(3, "berry", "hips", "determined"), act(4, "cherry", "shrug", "thinking")] }),
  // S2: Berry points up from the tower; the star at the right keeps looking down the hill, arm toward the pond
  shot("this-gets-you-closer", 5, NIGHT(),
    [actor("berry", 0.26, "point_up", "determined"), actor("cherry", 0.6, "idle", "neutral"), actor("benny", 0.8, "idle", "smug", { facing: "left" })],
    [moon(), ring(), hill(), pondFar(), ...tower(0.4), prop("star_pal_side", 0.88, 0.915, STAR, { zIndex: 8 })],
    cam(1.02, 1.05, 0.5, 0.82, { moves: [mv(6, 1.05, 0.7), mv(7, 1.06, 0.4), mv(8, 1.05, 0.6)] }),
    { actions: [act(5, "berry", "point_up", "determined"), act(6, "benny", "explain", "smug"), act(7, "berry", "hips", "thinking"), act(8, "benny", "point", "excited", { facing: "left" })] }),
  // S3: on the hill: Benny holds the star up (it is in his hand and points right, back toward the pond)
  shot("the-hill", 9, { type: "hilltop", color: "#1b2652", color2: "#1f3f35" },
    [actor("berry", 0.22, "cheer", "excited"), actor("benny", 0.52, "hold_up", "proud", { holding: "star_pal_side" }), actor("cherry", 0.8, "point", "thinking", { facing: "right" })],
    [moon(), pondFar(0.9, 0.84, 0.36)],
    cam(1.02, 1.05, 0.5, 0.82, { moves: [mv(10, 1.05, 0.36), mv(11, 1.05, 0.7), mv(12, 1.05, 0.5), mv(13, 1.05, 0.7)] }),
    { actions: [act(9, "benny", "hold_up", "proud", { holding: "star_pal_side" }), act(10, "berry", "cheer", "excited"), act(11, "cherry", "point", "thinking", { facing: "right" }),
      act(12, "benny", "hold_up", "worried", { holding: "star_pal_side" }), act(13, "cherry", "explain", "determined")] }),
  // S4: Cherry sits beside the star; the pond lies below them
  shot("how-did-you-get-down", 14, { type: "hilltop", color: "#1b2652", color2: "#1f3f35" },
    [actor("berry", 0.2, "idle", "worried"), actor("cherry", 0.5, "sit", "happy", { y: 0.91 }), actor("benny", 0.82, "idle", "thinking")],
    [moon(), pondFar(0.8, 0.84, 0.42), prop("star_pal", 0.64, FLOOR, STAR, { zIndex: 6 })],
    cam(1.02, 1.05, 0.5, 0.82, { moves: [mv(15, 1.05, 0.3), mv(16, 1.05, 0.66), mv(17, 1.05, 0.5)] }),
    { actions: [act(14, "cherry", "sit", "happy"), act(15, "berry", "idle", "worried"), act(16, "benny", "shrug", "smug"), act(17, "cherry", "sit", "thinking")] }),
  // S5: on the bank: the star waves at its reflection, beside a thin silver streak of moonlight
  shot("its-own-reflection", 18, NIGHT(),
    [actor("berry", 0.2, "idle", "happy"), actor("cherry", 0.4, "idle", "thinking"), actor("benny", 0.82, "idle", "confused", { facing: "left" })],
    [moon(), prop("pond", 0.55, 0.88, 0.9, { zIndex: 1 }),
     prop("moon_road", 0.68, 0.84, 0.34, { zIndex: 2 }),
     prop("star_reflection", 0.48, 0.77, 0.1, { zIndex: 2 }),
     prop("star_pal_happy", 0.48, 0.87, STAR, { zIndex: 6 })],
    cam(1.02, 1.05, 0.5, 0.82, { moves: [mv(19, 1.05, 0.7), mv(20, 1.05, 0.35)] }),
    { actions: [act(18, "berry", "point_down", "happy"), act(19, "benny", "explain", "confused", { facing: "left" }), act(20, "cherry", "explain", "thinking")] }),
  // S6: the star nods, looks toward the paling horizon (right) and droops
  shot("the-way-back", 21, NIGHT({ color: "#33437a" }),
    [actor("berry", 0.2, "idle", "worried"), actor("cherry", 0.4, "idle", "determined"), actor("benny", 0.82, "idle", "worried", { facing: "left" })],
    [prop("horizon_glow", 0.8, 0.84, 1.5, { zIndex: 0.2 }), moon(), prop("pond", 0.55, 0.88, 0.9, { zIndex: 1 }), prop("star_pal_sad", 0.48, 0.87, STAR, { zIndex: 6, flip: true })],
    cam(1.02, 1.05, 0.5, 0.82, { moves: [mv(22, 1.05, 0.7), mv(23, 1.05, 0.35)] }),
    { actions: [act(21, "berry", "idle", "worried"), act(22, "benny", "shrug", "worried", { facing: "left" }), act(23, "cherry", "point", "determined", { facing: "right" })] }),
];
for (const s of sb.scenes) for (const a of s.actions ?? []) if (a.expression === "curious") a.expression = "thinking";
writeFileSync(new URL("storyboard.json", dir), JSON.stringify(sb, null, 2) + "\n");
console.log("scenes:", sb.scenes.length, "duration:", sb.duration);
