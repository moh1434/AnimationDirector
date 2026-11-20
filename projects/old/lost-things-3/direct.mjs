// Directs "The Smallest Guide", episode 3 of Lost Things Returned Here (DEV/Scripts/05-lost-things-returned-here-series.txt).
// Run from the repo root after `pnpm video plan lost-things-3`:  node projects/lost-things-3/direct.mjs
//
// Same night, ending at dawn. The pond lies mid-frame; the friends stand on its near bank (floor line .88); the road of
// reflected moonlight rises from the pond's middle toward the ring of stars at the upper right. The two crates stand as the
// tower at the far left until Berry lays them down as a walkway to the flat stone (S5).
//
// Beat table:
//  S1 clips 1-4    the snail points toward the pond, the star beside it; the friends are stumped
//  S2 clips 5-7    Cherry sits to the snail's height; the silver road shows on the water
//  S3 clips 8-10   a sunbeam touches the road's far edge and it fades; reeds block this end
//  S4 clips 11-13  Benny points from the hill; a flat stone shows in a gap of the reeds
//  S5 clips 14-16  Berry lays the crates down as a walkway; the snail crosses, the star follows
//  S6 clips 17-18  the snail leads the star onto the stone; the road curls up
//  S7 clips 19-20  the star climbs the road and fills the gap in the ring
//  S8 clips 21-22  the snail slips through the tiny door at the tree; Cherry holds it open
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL("./", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, dir), "utf8").replace(/^﻿/, ""));
const sb = read("storyboard.json");

const FLOOR = 0.88, P = 0.46;
const NIGHT = (extra = {}) => ({ type: "forest", color: "#1b2652", color2: "#1f3f35", ...extra });
const DAWN = () => NIGHT({ color: "#33437a" });
const actor = (who, x, pose = "idle", expression = "neutral", extra = {}) =>
  ({ who, x, y: FLOOR, size: P, pose, expression, facing: x < 0.5 ? "right" : "left", enter: "none", zIndex: 5, ...extra });
const prop = (name, x, y, size, extra = {}) =>
  ({ name, x, y, size, at: 0, anchor: "bottom", enter: "none", motion: "none", ...extra });

const CRATE = 0.2, CRATE_H = (110 * CRATE * 1080) / 200 / 1920;
const crate = (x, y, extra = {}) => prop("crate", x, y, CRATE, { zIndex: 3, ...extra });
const tower = () => [crate(0.07, FLOOR), crate(0.07, FLOOR - CRATE_H)];
const moon = () => prop("moon", 0.86, 0.4, 0.1, { anchor: "center", zIndex: 0 });
const ring = (name = "star_ring", extra = {}) => prop(name, 0.68, 0.43, 0.2, { anchor: "center", zIndex: 1, ...extra });
const hill = () => prop("hill", 0.1, 0.86, 1.05, { zIndex: 0.5 });
const pond = () => prop("pond", 0.55, 0.88, 0.9, { zIndex: 1 });
const ROAD = { x: 0.62, y: 0.86, size: 0.75 };
const road = (name = "moon_road", extra = {}) => prop(name, ROAD.x, ROAD.y, ROAD.size, { zIndex: 2, ...extra });
const STAR = 0.12, SNAIL = 0.115;
const STONE = { x: 0.7, y: 0.9, size: 0.24 };

const cam = (z0, z1, fx = 0.5, fy = 0.82, extra = {}) => ({ zoom: [z0, z1], focus: { x: fx, y: fy }, ...extra });
const mv = (clip, zoom, fx, dur = 0.5, fy = 0.82) => ({ at: `clip:${clip}`, zoom, focus: { x: fx, y: fy }, duration: dur });
const shot = (id, clip, bg, characters, props, camera, extra = {}) =>
  ({ id, start: clip === 1 ? 0 : `clip:${clip}`, layout: "story", speaker: "none", bg, light: "night", characters, props, camera, ...extra });
const act = (clip, who, pose, expression, extra = {}) => ({ at: `clip:${clip}`, who, pose, expression, ...extra });

sb.directedBy = "claude";
sb.duration = read("build/analysis.json").duration ?? sb.duration;
sb.endHold = 1.6;
sb.sfxDensity = "sparse";
sb.cast = { benny: { preset: "benny", name: "Benny" }, berry: { preset: "berry", name: "Berry" }, cherry: { preset: "cherry", name: "Cherry" } };

sb.scenes = [
  // S1
  shot("snail-and-star", 1, NIGHT(),
    [actor("berry", 0.2, "idle", "worried"), actor("cherry", 0.4, "shrug", "thinking"), actor("benny", 0.82, "explain", "confused")],
    [moon(), ring(), hill(), pond(), ...tower(),
     prop("snail", 0.6, 0.915, SNAIL, { zIndex: 6, move: [{ at: "clip:1", until: "clip:4:end", x: 0.66, ease: "sine.inOut" }] }),
     prop("star_pal_sad", 0.74, 0.915, STAR, { zIndex: 6 })],
    cam(1.0, 1.06, 0.5, 0.82, { moves: [mv(2, 1.05, 0.4), mv(3, 1.05, 0.7), mv(4, 1.05, 0.5)] }),
    { actions: [act(1, "benny", "explain", "confused"), act(2, "cherry", "shrug", "thinking"), act(3, "berry", "point", "curious"), act(4, "benny", "point", "smug")] }),
  // S2: Cherry sits to the snail's height; the silver road shows
  shot("look-along-the-water", 5, NIGHT(),
    [actor("berry", 0.2, "idle", "surprised"), actor("cherry", 0.4, "sit", "happy", { zIndex: 6 }), actor("benny", 0.82, "idle", "worried")],
    [moon(), ring(), hill(), pond(), ...tower(), road("moon_road", { at: "clip:5+0.6", enter: "fade" }),
     prop("snail", 0.6, 0.915, SNAIL, { zIndex: 6 }), prop("star_pal_sad", 0.74, 0.915, STAR, { zIndex: 6 })],
    cam(1.02, 1.05, 0.55, 0.82, { moves: [mv(6, 1.05, 0.35), mv(7, 1.05, 0.7)] }),
    { actions: [act(5, "cherry", "sit", "happy"), act(6, "berry", "point", "surprised"), act(7, "benny", "shrug", "confused")] }),
  // S3: the sunbeam fades the road's far end; reeds block this end
  shot("fading-road", 8, NIGHT({ color: "#2a3a70" }),
    [actor("berry", 0.2, "point", "worried"), actor("cherry", 0.4, "idle", "worried"), actor("benny", 0.82, "idle", "thinking")],
    [moon(), ring(), hill(), pond(), ...tower(),
     road("moon_road", { out: "clip:8+0.9" }), road("moon_road_faded", { at: "clip:8+0.9" }),
     prop("sunbeam", 0.78, 0.5, 0.4, { anchor: "center", zIndex: 4, at: "clip:8", enter: "fade" }),
     prop("reeds", 0.5, 0.92, 0.3, { zIndex: 3 }), prop("reeds", 0.62, 0.92, 0.3, { zIndex: 3 }), prop("reeds", 0.74, 0.92, 0.3, { zIndex: 3 }),
     prop("snail", 0.6, 0.915, SNAIL, { zIndex: 6 }), prop("star_pal_sad", 0.34, 0.915, STAR, { zIndex: 6 })],
    cam(1.02, 1.05, 0.5, 0.82, { moves: [mv(9, 1.05, 0.35), mv(10, 1.05, 0.6)] }),
    { actions: [act(8, "berry", "point", "worried"), act(9, "berry", "cheer", "determined"), act(10, "benny", "explain", "worried")] }),
  // S4: Benny points from the hill toward the gap in the reeds: a flat stone shows
  shot("beside-the-flat-stone", 11, NIGHT({ color: "#2a3a70" }),
    [actor("berry", 0.2, "idle", "happy"), actor("cherry", 0.4, "idle", "surprised"), actor("benny", 0.82, "point", "excited")],
    [moon(), ring(), hill(), pond(), ...tower(),
     road("moon_road_faded"),
     prop("sunbeam", 0.78, 0.5, 0.4, { anchor: "center", zIndex: 4 }),
     prop("reeds", 0.5, 0.92, 0.3, { zIndex: 3 }), prop("reeds", 0.8, 0.92, 0.3, { zIndex: 3 }),
     prop("flat_stone", STONE.x, STONE.y, STONE.size, { zIndex: 2.5, at: "clip:11+0.4", enter: "pop" }),
     prop("snail", 0.6, 0.915, SNAIL, { zIndex: 6 }), prop("star_pal_sad", 0.34, 0.915, STAR, { zIndex: 6 })],
    cam(1.02, 1.05, 0.55, 0.82, { moves: [mv(12, 1.05, 0.4), mv(13, 1.05, 0.7)] }),
    { actions: [act(11, "benny", "point", "excited"), act(12, "berry", "cheer", "happy"), act(13, "benny", "shrug", "smug")] }),
  // S5: Berry lays the crates down as a walkway; the snail crosses, the star follows
  shot("the-walkway", 14, DAWN(),
    [actor("berry", 0.2, "present", "determined"), actor("cherry", 0.34, "point_down", "determined", { zIndex: 6 }), actor("benny", 0.82, "idle", "worried")],
    [moon(), ring(), hill(), pond(), road("moon_road_faded"),
     prop("sunbeam", 0.78, 0.5, 0.4, { anchor: "center", zIndex: 4 }),
     prop("reeds", 0.82, 0.92, 0.3, { zIndex: 3 }),
     prop("flat_stone", STONE.x, STONE.y, STONE.size, { zIndex: 2.5 }),
     crate(0.07, FLOOR, { zIndex: 4, move: [{ at: "clip:14", duration: 1.0, x: 0.5, y: 0.915, ease: "sine.inOut" }] }),
     crate(0.07, FLOOR - CRATE_H, { zIndex: 4, move: [{ at: "clip:14+0.3", duration: 1.0, x: 0.64, y: 0.915, ease: "sine.inOut" }] }),
     prop("snail", 0.34, 0.915, SNAIL, { zIndex: 6, move: [{ at: "clip:15+0.5", duration: 1.6, x: 0.57, y: 0.853, ease: "sine.inOut" }, { at: "clip:16", duration: 1.0, x: 0.7, y: 0.875, ease: "sine.inOut" }] }),
     prop("star_pal_sad", 0.3, 0.915, STAR, { zIndex: 6, move: [{ at: "clip:16", duration: 1.8, x: 0.6, y: 0.853, ease: "sine.inOut" }] })],
    cam(1.02, 1.05, 0.5, 0.82, { moves: [mv(15, 1.05, 0.5), mv(16, 1.05, 0.65)] }),
    { actions: [act(14, "berry", "present", "determined"), act(15, "cherry", "point_down", "determined"), act(16, "benny", "explain", "worried")] }),
  // S6: the snail leads the star onto the stone; the road shows again and curls up into the sky
  shot("the-way-home", 17, DAWN(),
    [actor("berry", 0.2, "idle", "happy"), actor("cherry", 0.4, "point", "happy", { zIndex: 6 }), actor("benny", 0.82, "idle", "happy")],
    [prop("horizon_glow", 0.8, 0.84, 1.5, { zIndex: 0.2 }), moon(), ring(), hill(), pond(),
     road("moon_road"), prop("flat_stone", STONE.x, STONE.y, STONE.size, { zIndex: 2.5 }),
     crate(0.5, 0.915), crate(0.64, 0.915),
     prop("snail", 0.66, 0.875, SNAIL, { zIndex: 6 }),
     prop("star_pal_happy", 0.74, 0.887, STAR, { zIndex: 6 })],
    cam(1.02, 1.05, 0.55, 0.82, { moves: [mv(18, 1.05, 0.7)] }),
    { actions: [act(17, "cherry", "point", "happy"), act(18, "berry", "wave", "happy")] }),
  // S7: the star climbs the road and fills the gap in the ring
  shot("it-made-it", 19, DAWN(),
    [actor("berry", 0.2, "cheer", "happy"), actor("cherry", 0.4, "idle", "happy", { zIndex: 6 }), actor("benny", 0.82, "cheer", "excited")],
    [prop("horizon_glow", 0.8, 0.84, 1.5, { zIndex: 0.2 }), moon(), ring("star_ring", { out: "clip:19+1.6" }), ring("star_ring_full", { at: "clip:19+1.6", enter: "pop" }),
     hill(), pond(), road("moon_road"), prop("flat_stone", STONE.x, STONE.y, STONE.size, { zIndex: 2.5 }),
     crate(0.5, 0.915), crate(0.64, 0.915), prop("snail", 0.66, 0.875, SNAIL, { zIndex: 6 }),
     prop("star_pal_up", 0.74, 0.887, STAR, { zIndex: 6, out: "clip:19+1.6",
       move: [{ at: "clip:19", duration: 1.0, x: 0.69, y: 0.58, ease: "sine.inOut" }, { at: "clip:19+1.0", duration: 0.6, x: 0.729, y: 0.425, ease: "sine.inOut" }] })],
    cam(1.0, 1.06, 0.6, 0.6, { moves: [mv(20, 1.06, 0.5, 0.5, 0.7)] }),
    { actions: [act(19, "benny", "cheer", "excited"), act(20, "berry", "idle", "proud")] }),
  // S8: at the tree the snail slips through the tiny door; Cherry holds it open
  shot("same-time-tomorrow", 21, DAWN(),
    [actor("berry", 0.2, "idle", "happy"), actor("cherry", 0.45, "hold", "happy", { zIndex: 6 }), actor("benny", 0.82, "shrug", "smug")],
    [prop("horizon_glow", 0.8, 0.84, 1.5, { zIndex: 0.2 }), moon(), prop("star_ring_full", 0.32, 0.4, 0.22, { anchor: "center", zIndex: 1 }),
     prop("old_tree", 0.62, 0.86, 0.85, { zIndex: 1 }), prop("tiny_door_open", 0.62, 0.86, 0.85, { zIndex: 2 }),
     prop("snail", 0.5, 0.915, SNAIL, { zIndex: 6, out: "clip:21+2.0", move: [{ at: "clip:21+0.4", duration: 1.5, x: 0.62, y: 0.9, ease: "sine.inOut" }] })],
    cam(1.02, 1.05, 0.5, 0.82, { moves: [mv(22, 1.05, 0.6)] }),
    { actions: [act(21, "cherry", "hold", "happy"), act(22, "benny", "shrug", "smug")] }),
];
for (const s of sb.scenes) for (const a of s.actions ?? []) if (a.expression === "curious") a.expression = "thinking";
writeFileSync(new URL("storyboard.json", dir), JSON.stringify(sb, null, 2) + "\n");
console.log("scenes:", sb.scenes.length, "duration:", sb.duration);
