// Directs "The Ribbon That Talked" (DEV/Scripts/04-one-minute-mystery-the-ribbon.txt).
// Run from the repo root after `pnpm video plan the-ribbon`:  node projects/the-ribbon/direct.mjs
//
// One setting (the living room, day). Fixed row, left to right: Benny (.2, facing right), Berry (.46, later .53, facing left,
// the detective between her two suspects), Cherry (.74, facing left, always holding her scissors). The snack bag stays on the rug.
// Zoom stays low so nobody is cut at the sides. Berry holds the gift in front of her belly (below her chin).
//
// FAIR PLAY: the gold ribbon fragment (ribbon_peek) sticks out of Benny's pocket in EVERY shot that shows him, from the very first
// frame, at the same size, with no emote, spotlight, zoom or caption pointing at it before Berry's accusation (clip 17). In S5 it
// leaves the pocket and flies to the gift (ribbon_piece); the ragged zigzag edge of the piece fits the gift's torn end exactly.
//
// Beat table:
//  S1 clips 1-3    Berry holds the gift with the torn gold ribbon; Benny already has the fragment in his pocket
//  S2 clips 4-11   alibis; Cherry holds scissors beside the opened snack bag (a distraction); Benny blames the scissors
//  S3 clips 12-16  Berry steps toward Cherry and holds the ragged torn end beside her scissors: pulled apart, not cut
//  S4 clips 17-18  Berry points at the fragment in Benny's pocket (the answer, said and shown)
//  S5 clips 19-21  the fragment leaves the pocket and slides into the torn end: the zigzag edges match
//  S6 clip 22      Benny looks down at his (now empty) pocket; Berry holds the matched ribbon beside him
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL("./", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, dir), "utf8").replace(/^﻿/, ""));
const sb = read("storyboard.json");

const FLOOR = 0.88, P = 0.46;
const BG = { type: "living_room", time: "day" };
const X = { benny: 0.2, berry: 0.46, cherry: 0.74 };
const BERRY_NEAR = 0.53; // from S3 on Berry stands closer to Cherry
const actor = (who, pose = "idle", expression = "neutral", extra = {}) =>
  ({ who, x: X[who], y: FLOOR, size: P, pose, expression, facing: who === "benny" ? "right" : "left", enter: "none", zIndex: 5, ...extra });
const cherry = (pose = "hold", expression = "neutral", extra = {}) => actor("cherry", pose, expression, { holding: "scissors", zIndex: 7, ...extra });
const prop = (name, x, y, size, extra = {}) =>
  ({ name, x, y, size, at: 0, anchor: "bottom", enter: "none", motion: "none", ...extra });

// --- the clue: the fragment in Benny's pocket. The character is 560 art units tall for P*1080 px; the kangaroo
// pocket's top edge is about 222 units above the feet (measured on a render: it sits 0.013 lower than that sum says).
const U = (P * 1080) / 560;
const POCKET_TOP = FLOOR - (222 * U) / 1920 + 0.013;
const PEEK = { size: 0.2 };
const peek = (extra = {}) =>
  prop("ribbon_peek", X.benny + 0.006, POCKET_TOP - (52 * PEEK.size * 1080) / 200 / 1920, PEEK.size, { anchor: "center", zIndex: 7, rotate: -8, ...extra });

// --- the gift, held in front of Berry's belly (a stand-alone prop in front of her; its top is below her chin)
const GIFT = (x) => ({ x, bottom: 0.86, size: 0.26 });
const gift = (x, extra = {}) => prop("gift_torn", x, GIFT(x).bottom, GIFT(x).size, { zIndex: 6, ...extra });
const bag = () => prop("snack_bag", 0.66, 0.905, 0.15, { zIndex: 6 });

const cam = (z0, z1, fx = 0.5, fy = 0.84, extra = {}) => ({ zoom: [z0, z1], focus: { x: fx, y: fy }, ...extra });
const mv = (clip, zoom, fx, dur = 0.5, fy = 0.84) => ({ at: `clip:${clip}`, zoom, focus: { x: fx, y: fy }, duration: dur });
const act = (clip, who, pose, expression, extra = {}) => ({ at: `clip:${clip}`, who, pose, expression, ...extra });
const shot = (id, clip, characters, props, camera, extra = {}) =>
  ({ id, start: clip === 1 ? 0 : `clip:${clip}`, layout: "story", speaker: "none", bg: BG, light: "day", characters, props, camera, ...extra });

sb.directedBy = "claude";
sb.duration = read("build/analysis.json").duration ?? sb.duration;
sb.endHold = 1.6;
sb.sfxDensity = "sparse";
sb.cast = { benny: { preset: "benny", name: "Benny" }, berry: { preset: "berry", name: "Berry" }, cherry: { preset: "cherry", name: "Cherry" } };

sb.scenes = [
  shot("torn-gift", 1,
    [actor("benny", "idle", "neutral"), actor("berry", "hold", "determined"), cherry("hold", "happy")],
    [gift(X.berry), peek(), bag()],
    cam(1.0, 1.06, 0.5, 0.84, { moves: [mv(2, 1.1, 0.35), mv(3, 1.1, 0.65)] }),
    { actions: [act(2, "benny", "shrug", "happy"), act(3, "cherry", "hips", "smug", { holding: "scissors" }), act(3, "berry", "hold", "worried")] }),
  shot("alibis", 4,
    [actor("benny", "idle", "neutral"), actor("berry", "hold", "determined"), cherry("hold", "neutral")],
    [gift(X.berry), peek(), bag()],
    cam(1.04, 1.1, 0.5, 0.84, { moves: [mv(5, 1.12, 0.62), mv(6, 1.12, 0.36), mv(7, 1.1, 0.5), mv(8, 1.12, 0.62), mv(9, 1.12, 0.4), mv(10, 1.12, 0.62), mv(11, 1.1, 0.4)] }),
    { actions: [
      act(4, "berry", "hold", "determined"), act(5, "cherry", "explain", "neutral", { holding: "scissors" }), act(6, "benny", "present", "smug"),
      act(7, "berry", "hold", "thinking"), act(8, "cherry", "shrug", "neutral", { holding: "scissors" }), act(9, "benny", "point", "smug"),
      act(10, "cherry", "hold", "determined", { holding: "scissors" }), act(11, "benny", "explain", "smug")] }),
  shot("pulled-apart", 12,
    [actor("benny", "idle", "neutral"), actor("berry", "hold", "determined", { x: BERRY_NEAR }), cherry("hold", "neutral", { x: 0.79 })],
    [gift(BERRY_NEAR + 0.01), peek(), bag()],
    cam(1.06, 1.12, 0.56, 0.84, { moves: [mv(13, 1.12, 0.6), mv(14, 1.12, 0.38), mv(15, 1.1, 0.5), mv(16, 1.12, 0.38)] }),
    { actions: [
      act(13, "cherry", "hold", "happy", { holding: "scissors" }), act(14, "benny", "shrug", "smug"),
      act(15, "berry", "hold", "thinking"), act(16, "benny", "explain", "smug")] }),
  shot("the-pocket", 17,
    [actor("benny", "idle", "neutral"), actor("berry", "point", "determined", { x: BERRY_NEAR }), cherry("hold", "surprised", { x: 0.78 })],
    [gift(BERRY_NEAR), peek(), bag()],
    cam(1.04, 1.12, 0.5, 0.84, { moves: [mv(18, 1.14, 0.34, 0.6)] }),
    { actions: [act(18, "benny", "shrug", "worried"), act(18, "cherry", "hold", "surprised", { holding: "scissors" })] }),
  shot("it-fits", 19,
    [actor("benny", "hips", "worried"), actor("berry", "hold", "proud", { x: BERRY_NEAR }), cherry("explain", "surprised", { x: 0.78 })],
    [gift(BERRY_NEAR), peek({ out: "clip:19+0.3" }),
     // pulled out of the pocket (the whole piece is longer than the part that showed), it flies to the torn end and is seated there
     prop("ribbon_piece", X.benny + 0.006, POCKET_TOP + 0.03, GIFT(BERRY_NEAR).size, { zIndex: 7, rotate: -8, at: "clip:19+0.3", out: "clip:19+1.6",
       move: [{ at: "clip:19+0.5", duration: 1.0, x: BERRY_NEAR, y: GIFT(BERRY_NEAR).bottom, ease: "sine.inOut" }] }),
     prop("ribbon_piece", BERRY_NEAR, GIFT(BERRY_NEAR).bottom, GIFT(BERRY_NEAR).size, { zIndex: 7, at: "clip:19+1.5" }),
     bag()],
    cam(1.04, 1.1, 0.42, 0.84, { moves: [mv(20, 1.1, 0.34), mv(21, 1.1, 0.5)] }),
    { actions: [act(19, "cherry", "explain", "surprised", { holding: "scissors" }), act(20, "benny", "shrug", "happy"), act(21, "berry", "hold", "proud")] }),
  shot("wrap-your-evidence", 22,
    [actor("benny", "idle", "worried", { lookAt: { x: 0, y: 1 } }), actor("berry", "hold", "smug", { x: BERRY_NEAR }), cherry("hold", "laughing", { x: 0.78 })],
    [gift(BERRY_NEAR), prop("ribbon_piece", BERRY_NEAR, GIFT(BERRY_NEAR).bottom, GIFT(BERRY_NEAR).size, { zIndex: 7 }), bag()],
    cam(1.06, 1.12, 0.38, 0.84),
    { actions: [act(22, "berry", "hold", "smug"), act(22, "benny", "idle", "sad", { lookAt: { x: 0, y: 1 } })] }),
];
for (const s of sb.scenes) for (const a of s.actions ?? []) if (a.expression === "curious") a.expression = "thinking";
writeFileSync(new URL("storyboard.json", dir), JSON.stringify(sb, null, 2) + "\n");
console.log("scenes:", sb.scenes.length, "duration:", sb.duration);
