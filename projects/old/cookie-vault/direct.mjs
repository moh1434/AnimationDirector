// Directs "The Benny-Proof Cookie Vault" (DEV/Scripts/03-bad-decisions-the-cookie-vault.txt).
// Run from the repo root after `pnpm video plan cookie-vault`:  node projects/cookie-vault/direct.mjs
//
// Beat table (one setting, the kitchen; Benny always on the LEFT, Berry on the RIGHT, facing each other):
//  S1 clips 1-6   closed tin + padlock on the table; Benny proudly guards it ("the pocket" for the key)
//  S2 clips 7-10  tin OPEN, cookies visible, the padlock lying OPEN beside it; Benny holds a cookie
//  S3 clips 11-13 the key on a HIGH SHELF; Benny content below it; the stool (unrelated furniture) at the right
//  S4 clips 14-15 same wall: shelf now EMPTY; Benny beside the stool holding the key, a cookie lying on the stool seat
//  S5 clips 16-19 Benny hands Berry the key (it moves to her hand); the tin sits closed between them
//  S6 clips 20-22 Berry holds up the open tin: only crumbs; Benny sheepish
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL("./", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, dir), "utf8").replace(/^﻿/, ""));
const sb = read("storyboard.json");

const FLOOR = 0.88, P = 0.52; // people indoors (0.45-0.52)
const BG = { type: "kitchen" };
const actor = (who, x, pose = "idle", expression = "neutral", extra = {}) =>
  ({ who, x, y: FLOOR, size: P, pose, expression, facing: x < 0.5 ? "right" : "left", enter: "none", ...extra });
const prop = (name, x, y, size, extra = {}) =>
  ({ name, x, y, size, at: 0, anchor: "bottom", enter: "none", motion: "none", ...extra });

// the table: its top is 90 art units above its feet (library `table`), so the tabletop is at:
const TABLE = { x: 0.5, size: 0.38 };
const TABLE_TOP = FLOOR - (90 * TABLE.size * 1080) / 200 / 1920;
const table = () => prop("table", TABLE.x, FLOOR, TABLE.size, { zIndex: 3 });
const onTable = (name, x, size, extra = {}) => prop(name, x, TABLE_TOP + 0.004, size, { zIndex: 4, ...extra });
// the wall shelf: its top face (front edge, art y 72) is SHELF.y; the key rests on it
const SHELF = { x: 0.27, y: 0.4, size: 0.3 };
const shelf = () => prop("shelf", SHELF.x, SHELF.y + (28 * SHELF.size * 1080) / 200 / 1920, SHELF.size, { anchor: "center", zIndex: 3 });
const STOOL = { x: 0.56, size: 0.22 };
const stool = () => prop("stool", STOOL.x, FLOOR, STOOL.size, { zIndex: 4 });
const STOOL_SEAT = FLOOR - (154 * STOOL.size * 1080) / 200 / 1920;

const cam = (z0, z1, focus = { x: 0.5, y: 0.84 }, extra = {}) => ({ zoom: [z0, z1], focus, ...extra });
const shot = (id, clip, characters, props, camera, extra = {}) =>
  ({ id, start: clip === 1 ? 0 : `clip:${clip}`, layout: "story", speaker: "none", bg: BG, light: "warm", characters, props, camera, ...extra });
const act = (clip, who, pose, expression, extra = {}) => ({ at: `clip:${clip}`, who, pose, expression, ...extra });

sb.directedBy = "claude";
sb.duration = read("build/analysis.json").duration ?? sb.duration;
sb.endHold = 1.5;
sb.sfxDensity = "sparse";
sb.cast = { benny: { preset: "benny", name: "Benny" }, berry: { preset: "berry", name: "Berry" } };

sb.scenes = [
  shot("guarded-box", 1,
    [actor("benny", 0.27, "hips", "proud"), actor("berry", 0.73, "idle", "neutral")],
    [table(), onTable("cookie_box", 0.5, 0.24)],
    cam(1.12, 1.18, { x: 0.5, y: 0.84 }, { moves: [{ at: "clip:3", zoom: 1.2, focus: { x: 0.58, y: 0.84 }, duration: 0.5 }, { at: "clip:4", zoom: 1.2, focus: { x: 0.42, y: 0.84 }, duration: 0.5 }, { at: "clip:6", zoom: 1.08, focus: { x: 0.5, y: 0.84 }, duration: 0.6 }] }),
    { actions: [act(2, "benny", "point", "proud"), act(3, "berry", "explain", "curious"), act(4, "benny", "explain", "smug"), act(5, "berry", "shrug", "thinking"), act(6, "benny", "hips", "smug")] }),
  shot("security-testing", 7,
    [actor("benny", 0.27, "hold_up", "proud", { holding: "cookie" }), actor("berry", 0.73, "cross", "smug")],
    [table(), onTable("cookie_box_open", 0.55, 0.24), onTable("padlock_open", 0.43, 0.11)],
    cam(1.12, 1.18, { x: 0.5, y: 0.84 }, { moves: [{ at: "clip:8", zoom: 1.2, focus: { x: 0.42, y: 0.84 }, duration: 0.5 }, { at: "clip:9", zoom: 1.2, focus: { x: 0.58, y: 0.84 }, duration: 0.5 }] }),
    { actions: [act(7, "berry", "cross", "smug"), act(8, "benny", "hold_up", "determined"), act(9, "berry", "shrug", "thinking"), act(10, "benny", "hold_up", "proud")] }),
  shot("high-shelf", 11,
    [actor("benny", 0.27, "hips", "proud"), actor("berry", 0.8, "idle", "neutral")],
    [shelf(), prop("key", SHELF.x, SHELF.y + 0.021, 0.13, { zIndex: 4 }), stool()],
    cam(1.02, 1.08, { x: 0.55, y: 0.74 }, { moves: [{ at: "clip:12", zoom: 1.08, focus: { x: 0.58, y: 0.84 }, duration: 0.5 }, { at: "clip:13", zoom: 1.06, focus: { x: 0.5, y: 0.8 }, duration: 0.5 }] }),
    { actions: [act(11, "benny", "hips", "proud"), { at: "@Impossible", who: "benny", pose: "point_up", expression: "proud" }, act(12, "berry", "point", "thinking"), act(13, "benny", "shrug", "happy")] }),
  shot("evolving", 14,
    [actor("benny", 0.36, "hold", "smug", { holding: "key" }), actor("berry", 0.8, "idle", "smug")],
    [shelf(), stool(), prop("cookie", STOOL.x + 0.03, STOOL_SEAT + 0.008, 0.09, { zIndex: 5 })],
    cam(1.02, 1.08, { x: 0.55, y: 0.82 }, { moves: [{ at: "clip:15", zoom: 1.08, focus: { x: 0.5, y: 0.84 }, duration: 0.5 }] }),
    { actions: [act(14, "berry", "explain", "smug"), act(15, "benny", "hold", "smug", { holding: "key" })] }),
  shot("keeper-of-the-key", 16,
    [actor("benny", 0.27, "hold", "worried", { holding: "key" }), actor("berry", 0.73, "idle", "neutral")],
    [table(), onTable("cookie_box", 0.5, 0.24)],
    cam(1.12, 1.18, { x: 0.5, y: 0.84 }, { moves: [{ at: "clip:17", zoom: 1.2, focus: { x: 0.58, y: 0.84 }, duration: 0.5 }, { at: "clip:19", zoom: 1.12, focus: { x: 0.5, y: 0.84 }, duration: 0.5 }] }),
    { actions: [
      act(16, "benny", "hold_up", "worried"),
      act(17, "benny", "idle", "worried", { holding: "" }), act(17, "berry", "hold", "happy", { holding: "key" }),
      act(18, "benny", "point", "thinking"), act(19, "berry", "hold", "smug")] }),
  shot("only-crumbs", 20,
    [actor("benny", 0.26, "idle", "worried"), actor("berry", 0.73, "hold", "neutral")],
    [prop("cookie_box_crumbs", 0.73, 0.745, 0.17, { anchor: "center", zIndex: 7 })], // held at her waist (no floor shadow), top below her chin, legs showing under it // held in front of Berry at belly height, below her face
    cam(1.12, 1.18, { x: 0.5, y: 0.84 }, { moves: [{ at: "clip:21", zoom: 1.1, focus: { x: 0.4, y: 0.84 }, duration: 0.5 }, { at: "clip:22", zoom: 1.12, focus: { x: 0.6, y: 0.84 }, duration: 0.5 }] }),
    { actions: [act(20, "berry", "hold", "neutral"), act(21, "benny", "shrug", "worried"), act(22, "berry", "hold", "smug"), act(22, "benny", "idle", "sad")] }),
];
// "curious" is not a renderer expression: the thinking face carries it
for (const s of sb.scenes) for (const a of s.actions ?? []) if (a.expression === "curious") a.expression = "thinking";
for (const s of sb.scenes) for (const c of s.characters) c.zIndex = c.zIndex ?? 5;
writeFileSync(new URL("storyboard.json", dir), JSON.stringify(sb, null, 2) + "\n");
console.log("scenes:", sb.scenes.length, "duration:", sb.duration);
