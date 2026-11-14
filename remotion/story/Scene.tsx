import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "./engine";
import type { Scene, Storyboard, CharRef, PropRef, TextRef, Item, Action, Move } from "./types";
import { Background, BgSpec } from "./Backgrounds";
import { dialogueSpeaker, isAnimal, stairStep } from "./story-mode.mjs";
import { Animal } from "./Animal";
import { Character, Pose, POSES } from "./Character";
import { PropArt } from "./Props";
import type { Expression } from "./Face";
import { EXPR, isBlinking } from "./Face";
import { lookFor, resolveColor, INK, BG, SHIRTS, isDark } from "./theme";
import { prog, rand, Enter, enterStyle, exitStyle, clamp } from "./anim";
import { layoutScene, Placed } from "./Layout";
import { tagHeight, rcx, rcy, rh } from "./frame";
import { Pop, TitleText, Tag, Note, Bubble, NameCard, NumberReveal, Arrow, Badge, ImageCard, NewsCard, dirOf, textColorOn } from "./Elements";


import { MOTION, sampleTrack, speechEnvelope } from "./motion";
import { mouthShapeAt } from "./viseme";
import { LightBehind, Grade, moodFor } from "./light";

const bgOf = (b: Scene["bg"]): BgSpec => (typeof b === "string" ? { type: ["living_room", "house_exterior", "park", "farm", "schoolyard", "street", "village", "ruins", "hilltop", "office", "airport", "forest", "garden", "kitchen", "workshop", "space", "night", "sky", "desert", "sea", "city", "room", "lab", "classroom", "burst", "grid", "underground", "paper", "dark", "gradient", "stage", "desk"].includes(b) ? b : "solid", color: b } : b ?? { type: "solid", color: "mint" });

/** Where something is at time t after its moves, and what it is doing. */
function travel(from: { x: number; y: number }, moves: Move[] | undefined, t: number, W: number, H: number) {
  let { x, y } = from;
  let rotate = 0, lift = 0, facing: "left" | "right" | undefined, moving = false, airborne = false, pose: Move["pose"];
  for (const m of [...(moves ?? [])].sort((a, b) => a.at - b.at)) {
    if (t < m.at) break;
    const raw = prog(t, m.at, Math.max(0.01, m.duration), m.steps ? "linear" : m.ease ?? "sine.inOut");
    const { progress: p, hop } = m.steps ? stairStep(raw, m.steps) : { progress: raw, hop: 4 * raw * (1 - raw) };
    const toX = m.x * W, toY = (m.y ?? y / H) * H;
    if (m.facing !== "keep") facing = m.facing ?? (Math.abs(toX - x) < 1 ? facing : toX > x ? "right" : "left");
    const running = t < m.at + m.duration;
    if (running) { moving = true; pose = m.pose; airborne = !m.pose && (!!m.arc || m.rotate !== undefined); } // a jump or a fall is not a walk
    lift = running ? -(m.arc ?? 0) * H * hop : 0;
    x += (toX - x) * p; y += (toY - y) * p;
    rotate += ((m.rotate ?? rotate) - rotate) * p;
  }
  return { x, y: y + lift, rotate, facing, moving, airborne, pose };
}

/** State of a character at time t after applying actions. */
function charState(c: CharRef, actions: Action[], t: number) {
  let pose: Pose | undefined = c.pose;
  let prevPose: Pose | undefined = c.pose;
  let poseAt = -10;
  let expression = c.expression;
  let emote = c.emote;
  let emoteAt = c.emoteAt ?? c.at ?? 0;
  let facing = c.facing;
  let lookAt = c.lookAt;
  let holding = c.holding;
  let look = c.look;
  for (const a of actions) {
    if (a.who !== c.who || a.at > t) continue;
    if (a.holding !== undefined) holding = a.holding || undefined;
    if (a.look) look = { ...look, ...a.look };
    if (a.pose && a.pose !== pose) {
      prevPose = pose;
      pose = a.pose;
      poseAt = a.at;
    }
    if (a.expression) expression = a.expression;
    if (a.emote !== undefined) {
      emote = a.emote || undefined;
      emoteAt = a.at;
    }
    if (a.facing) facing = a.facing;
    if (a.lookAt) lookAt = a.lookAt;
  }
  const names = Object.keys(EXPR) as Expression[];
  const vector = (pose: Pose, expression: Expression, facing: string, look: {x:number;y:number}) => {
    const p = POSES[pose] ?? POSES.idle;
    return [...p.l, ...p.r, p.bodyY ?? 0, p.lean ?? 0, pose === "celebrate" ? 1 : 0, facing === "left" ? -1 : 1, look.x, look.y, ...names.map((n) => n === expression ? 1 : 0), pose === "talk" || pose === "explain" ? 1 : 0, pose === "explain" ? 1 : 0, pose === "wave" ? 1 : 0];
  };
  let state = { pose: c.pose ?? "idle" as Pose, expression: c.expression ?? "happy" as Expression, facing: c.facing ?? "right", look: c.lookAt ?? {x:0.25,y:0} };
  const initial = vector(state.pose, state.expression, state.facing, state.look);
  const events = actions.filter((a) => a.who === c.who && (a.pose || a.expression || a.facing || a.lookAt)).map((a) => {
    state = { pose:a.pose ?? state.pose, expression:a.expression ?? state.expression, facing:a.facing ?? state.facing, look:a.lookAt ?? state.look };
    return {at:a.at,value:vector(state.pose,state.expression,state.facing,state.look)};
  });
  // arms, body height and lean wind up before a gesture and overshoot it; facing, gaze and the face do not
  const motion = sampleTrack(initial, events, t, MOTION.gesture, [0.16, 0.2, 0.16, 0.2, 0.35, 0.3]);
  const face = sampleTrack(initial.slice(10,10+names.length), events.map((e) => ({at:e.at,value:e.value.slice(10,10+names.length)})), t, MOTION.expression);
  motion.splice(10,names.length,...face);
  return { pose, prevPose, poseT: prog(t, poseAt, MOTION.gesture, "sine.inOut"), expression, emote, emoteAt, facing, lookAt, motion, holding, look };

}

const speakerAt = (scene: Scene, t: number) => {
  let sp = scene.speaker;
  for (const a of scene.actions ?? []) if (a.speaker && a.at <= t) sp = a.who;
  return sp;
};

const motionOf = (p: PropRef, t: number, seed: number) => {
  switch (p.motion) {
    case "spin": return { dx: 0, dy: 0, r: t * 40, s: 1 };
    case "pulse": return { dx: 0, dy: 0, r: 0, s: 1 + Math.sin(t * 5) * 0.04 };
    case "shake": return { dx: Math.sin(t * 50) * 4, dy: 0, r: Math.sin(t * 40) * 3, s: 1 };
    case "bounce": return { dx: 0, dy: -(1 - Math.cos(t * 4)) * 8, r: 0, s: 1 };
    case "orbit": return { dx: Math.cos(t * 1.2 + seed) * 30, dy: Math.sin(t * 1.2 + seed) * 14, r: 0, s: 1 };
    case "none": return { dx: 0, dy: 0, r: 0, s: 1 };
    case "float":
    default: return { dx: 0, dy: Math.sin(t * 1.8 + seed) * 7, r: Math.sin(t * 1.1 + seed) * 2, s: 1 };
  }
};

export const SceneView: React.FC<{ scene: Scene; sb: Storyboard; mouth: number[]; words?: { w: string; s: number; e: number }[]; startFrame: number; index: number; W: number; H: number; captionsOn?: boolean }> = ({ scene, sb, mouth, words, startFrame, index, W, H, captionsOn }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.end - scene.start;
  const L = layoutScene(scene, W, H, sb, captionsOn ?? H > W);
  const { U, frame: F } = L;
  const dir = dirOf(sb.language);
  const bg = bgOf(scene.bg);
  const bgColor = resolveColor(bg.color, BG.mint);
  const textCol = ["space", "night", "dark", "burst", "grid"].includes(bg.type ?? "") ? "#fff" : textColorOn(bgColor);
  const gf = startFrame + frame;
  const mouthNow = speechEnvelope(mouth, gf, fps);
  const shapeNow = mouthShapeAt(words, gf / fps);
  const speaker = dialogueSpeaker(sb,gf/fps) ?? speakerAt(scene, t);
  const actions = (scene.actions ?? []).slice().sort((a, b) => a.at - b.at);

  // camera
  const cam = scene.camera ?? {};
  const z0 = cam.zoom?.[0] ?? 1, z1 = cam.zoom?.[1] ?? 1.02;
  let zoom = z0 + (z1 - z0) * prog(t, 0, Math.max(dur, 0.5), "sine.inOut");
  for (const p of cam.punch ?? []) {
    if (t >= p) zoom += 0.035 * prog(t, p, 0.20, "sine.inOut") * (1 - prog(t, p + 0.20, 0.35, "sine.inOut"));
  }
  let shx = 0, shy = 0;
  for (const s of cam.shake ?? []) {
    if (t >= s && t < s + 0.5) {
      const k = 1 - (t - s) / 0.5;
      shx += Math.sin(t * 90) * 16 * k;
      shy += Math.cos(t * 77) * 12 * k;
    }
  }
  // zoom toward the content, not the frame centre, so the push-in doesn't carry objects off the edge
  // "on" aims the camera at a character's face; a shot on a character is also centred on them.
  const faceOf = (who?: string) => {
    const c = who ? L.chars.find((x) => x.who === who) : undefined;
    if (!c) return undefined;
    const at = travel({ x: c.px, y: c.py }, c.move, t, W, H); // where the actor is now, not where they started
    return { x: at.x / W, y: (at.y - c.ps * 0.72) / H };
  };
  let aim = cam.focus ?? faceOf(cam.on) ?? { x: 0.5 + (rcx(L.stage) / W - 0.5) * 0.6, y: 0.5 + (rcy(L.stage) / H - 0.5) * 0.6 };
  let centre = cam.on && !cam.focus ? 1 : 0; // 0 = the aim stays where it is on screen, 1 = it travels to the middle
  // moves: cuts and pushes inside the scene ("at" a word, to a zoom, onto a character)
  for (const mv of cam.moves ?? []) {
    if (t < mv.at) break;
    const p = mv.duration === 0 ? 1 : prog(t, mv.at, mv.duration ?? 0.55, "power2.inOut");
    const to = mv.focus ?? faceOf(mv.on) ?? aim;
    aim = { x: aim.x + (to.x - aim.x) * p, y: aim.y + (to.y - aim.y) * p };
    centre += ((mv.on && !mv.focus ? 1 : mv.focus || mv.on === "" ? 0 : centre) - centre) * p;
    zoom += ((mv.zoom ?? zoom) - zoom) * p;
  }
  const fx = aim.x * 100, fy = aim.y * 100;
  const panX = (cam.pan?.[0] ?? 0) * W * prog(t, 0, Math.max(dur, 0.5), "sine.inOut");
  const panY = (cam.pan?.[1] ?? 0) * H * prog(t, 0, Math.max(dur, 0.5), "sine.inOut");
  // bring the aim toward the middle of the frame as the camera closes in, without showing past the picture's edge
  const lim = (v: number, lo: number, hi: number) => Math.max(Math.min(lo, hi), Math.min(Math.max(lo, hi), v));
  const pull = centre * clamp((zoom - 1) / 0.25);
  const cx = lim((0.5 - aim.x) * W * pull, -(W - aim.x * W) * (zoom - 1), aim.x * W * (zoom - 1));
  const cy = lim((0.46 - aim.y) * H * pull, -(H - aim.y * H) * (zoom - 1), aim.y * H * (zoom - 1));
  // a hand-held drift and a slow tilt keep a held shot alive
  const drift = cam.drift === false ? 0 : 1;
  const dX = (Math.sin(t * 0.83 + index) * 3.2 + Math.sin(t * 1.9 + index * 2) * 1.1) * (U / 1080) * drift;
  const dY = (Math.sin(t * 0.67 + index * 1.3) * 2.6) * (U / 1080) * drift;
  const tiltAsked = cam.tilt ? cam.tilt[0] + (cam.tilt[1] - cam.tilt[0]) * prog(t, 0, Math.max(dur, 0.5), "sine.inOut") : 0;
  const tilt = Math.max(-4, Math.min(4, tiltAsked)) + Math.sin(t * 0.5 + index) * 0.12 * drift;
  // a rolled frame needs a bigger picture: enough for the far corner, wherever the camera is aimed
  const cover = 1 + Math.abs(Math.sin((tilt * Math.PI) / 180)) * (Math.max(W, H) / Math.min(W, H)) * 1.9 + (drift ? 0.01 : 0);
  zoom = Math.max(1, zoom); // below 1 the picture would not fill the frame
  // a dark flat ground (a black title card, a navy ground) is lit like night: no sun bloom or light shafts on it
  const flatGround = !bg.type || ["solid", "gradient", "burst", "grid", "paper"].includes(bg.type);
  const mood = moodFor(flatGround && isDark(bgColor) ? "night" : bg.type, bg.time, scene.light);
  // the background goes softly out of focus when the camera is close on the actors
  const dof = Math.min(3, Math.max(0, zoom - 1.22) * 7) * (U / 1080);

  const charSvg = (c: Placed<CharRef>, i: number) => {
    const st = charState(c, actions, t);
    const s = c.ps / 560;
    const cast = sb.cast[c.who] ?? { preset: c.who };
    const animal = isAnimal(cast);
    let look = animal ? { ...cast.look } : lookFor(cast.preset ?? (c.who === "host" ? "host" : c.who), cast.look);
    const dupIdx = L.chars.slice(0, i).filter((o) => o.who === c.who).length;
    if (dupIdx > 0) {
      // several copies of the same cast member (a crowd): vary clothes and hair so they read as different people
      const HAIRS = ["side", "spiky", "bob", "curly", "messy", "tuft"];
      const HC = ["#3a2a20", "#ffb300", "#5a3825", "#9aa0a6", "#2b1d16"];
      look = { ...look, shirt: SHIRTS[(dupIdx * 3 + index) % SHIRTS.length], hair: look.hat ? look.hair : HAIRS[(dupIdx + index) % HAIRS.length], hairColor: look.hairColor === "#cfd4da" ? look.hairColor : HC[dupIdx % HC.length], ...(cast.look ?? {}) };
    }
    look = { ...look, ...st.look };
    const Actor = (animal ? Animal : Character) as React.FC<any>;
    const talking = speaker === c.who;
    const walkIn = c.walkFrom !== undefined;
    const walkP = walkIn ? prog(t, c.at ?? 0, 1.2, "power1.inOut") : 1;
    const route = travel({ x: walkIn ? (c.walkFrom! * W) + (c.px - c.walkFrom! * W) * walkP : c.px, y: c.py }, c.move, t, W, H);
    const { x, y } = route;
    const isMoving = (walkIn && walkP < 1) || (route.moving && !route.airborne);
    const pose = isMoving ? route.pose ?? "walk" : st.pose ?? (speaker === c.who ? "talk" : "idle");
    const facing = route.facing ?? st.facing ?? c.facing;
    // a move turns the actor; arms take the travelling pose unless they are carrying something
    const motion = [...st.motion];
    if (route.facing) motion[7] = route.facing === "left" ? -1 : 1;
    if (isMoving && !walkIn && !st.holding) { const arms = POSES[pose]; [motion[0], motion[1], motion[2], motion[3]] = [...arms.l, ...arms.r]; }
    const enter: Enter = c.enter ?? (index === 0 || walkIn ? "none" : "none");
    const e = enterStyle(t, c.at ?? 0, enter, 600);
    const o = exitStyle(t, c.out);
    if (e.opacity <= 0 || o <= 0) return null;
    const vbW = 760, vbH = 820;
    return (
      <div key={`c${i}`} style={{ position: "absolute", left: x - (vbW / 2) * s + e.x, top: y - 760 * s + e.y, width: vbW * s, height: vbH * s, zIndex: c.zIndex ?? 5, opacity: e.opacity, transform: `rotate(${route.rotate}deg) scale(${e.sx * o}, ${e.sy * o})`, transformOrigin: "50% 92%" }}>
        <svg data-box={`char:${c.who}`} width={vbW * s} height={vbH * s} viewBox={`${-vbW / 2} -760 ${vbW} ${vbH}`} style={{ overflow: "visible" }}>
          <Actor
            {...({kind:cast.kind})}
            look={look}
            motion={motion}
            expression={st.expression ?? (talking ? "happy" : "neutral")}
            pose={pose}
            fromPose={st.prevPose}
            poseT={st.poseT}
            mouth={talking ? mouthNow : 0}
            mouthShape={talking ? shapeNow : undefined}
            talking={talking}
            facing={facing}
            t={t}
            frame={gf}
            fps={fps}
            seed={7 + i * 31 + index}
            lookAt={st.lookAt ?? { x: facing === "left" ? -0.35 : 0.35, y: 0 }}
            emote={st.emote}
            emoteT={t - st.emoteAt}
            holding={st.holding}
            walking={isMoving}
          />
        </svg>
      </div>
    );
  };

  const propEl = (p: Placed<PropRef>, i: number) => {
    const m = motionOf(p, t, i * 1.7);
    const isSpeaker = p.talking || speaker === p.name;
    const route = travel({ x: p.px, y: p.py }, p.move, t, W, H);
    // drawings stand on the bottom of a 200-unit art box inside a 240-unit canvas
    const floorGap = p.anchor === "bottom" ? p.ps * 0.1 : 0;
    return (
      <Pop key={`p${i}`} x={route.x + m.dx} y={route.y + m.dy + floorGap} t={t} at={p.at ?? 0} out={p.out} enter={p.enter ?? "pop"} rotate={(p.rotate ?? 0) + m.r + route.rotate} z={p.zIndex ?? 4} anchor={p.anchor}>
        {p.anchor === "bottom" && <div style={{ position: "absolute", left: "8%", width: "92%", top: "84%", height: "12%", background: "radial-gradient(closest-side, rgba(27,20,54,0.32), rgba(27,20,54,0.14) 60%, rgba(27,20,54,0))" }} />}
        <svg data-box={`prop:${p.name}`} width={p.ps * 1.2} height={p.ps * 1.2} viewBox="-120 -120 240 240" style={{ overflow: "visible", display: "block", transform: `scale(${(p.flip ? -1 : 1) * m.s}, ${m.s})` }}>
          <PropArt name={p.name} size={200} face={p.face} mouth={isSpeaker ? mouthNow : 0} t={t} color={p.color} color2={p.color2} blink={isBlinking(gf, fps, 3 + i)} />
        </svg>
        {p.label && (
          <div data-box="label" style={{ position: "absolute", left: "50%", top: p.ps * 1.1 + F.gap.xs, transform: `translateX(-50%) scale(${prog(t, (p.at ?? 0) + 0.25, 0.35, "sine.out")})`, transformOrigin: "50% 0%" }}>
            <Tag text={p.label} size={L.labelSize} dir={dir} />
          </div>
        )}
      </Pop>
    );
  };

  const itemEls = () => {
    if (!L.items.length) return null;
    const out: React.ReactNode[] = [];
    L.items.forEach((it, i) => {
      const at = it.at ?? 0.3 + i * 0.6;
      out.push(
        <Pop key={`it${i}`} x={it.px} y={it.py} t={t} at={at} enter="pop" z={4}>
          <div style={{ position: "relative", width: it.ps, height: it.ps }}>
            {it.image ? (
              <ImageCard src={it.image} w={it.ps * 0.9} h={it.ps * 0.9} t={t} dir={dir} />
            ) : (
              <svg data-box={`item:${it.prop ?? "question"}`} width={it.ps} height={it.ps} viewBox="-104 -104 208 208" style={{ overflow: "visible", transform: `translateY(${Math.sin(t * 1.8 + i) * 5}px)` }}>
                <PropArt name={it.prop ?? "question"} size={200} face={it.face} t={t} color={it.color} blink={isBlinking(gf, fps, 11 + i)} />
              </svg>
            )}
            {L.layout === "steps" && (
              <div style={{ position: "absolute", top: -Math.max(F.type.label * 1.2, it.ps * 0.26) * 0.3, [L.rtl ? "right" : "left"]: -Math.max(F.type.label * 1.2, it.ps * 0.26) * 0.3 }}>
                <Badge text={String(i + 1)} size={Math.max(F.type.label * 1.2, it.ps * 0.26)} bg={["#ff6b8b", "#4f7bff", "#3ddc97", "#ffc83d", "#b05cff", "#ff8a3d"][i % 6]} />
              </div>
            )}
          </div>
          {(it.label || it.text) && (
            <div data-box="label" style={{ position: "absolute", left: "50%", top: it.ps + F.gap.xs, transform: `translateX(-50%) scale(${prog(t, at + 0.2, 0.35, "sine.out")})`, transformOrigin: "50% 0%" }}>
              <Tag text={(it.label || it.text)!} size={L.labelSize} dir={dir} />
            </div>
          )}
        </Pop>,
      );
    });
    // arrows / symbols between items
    if ((L.layout === "transform" || L.layout === "steps") && L.items.length > 1) {
      for (let i = 0; i < L.items.length - 1; i++) {
        const a = L.items[i], b = L.items[i + 1];
        if (L.portrait && L.layout === "steps") continue;
        const dx = Math.sign(b.px - a.px) || 1;
        const at = (b.at ?? 0.3 + (i + 1) * 0.6) - 0.25;
        if (Math.abs(b.py - a.py) > a.ps * 0.5) continue; // only between items on the same row
        out.push(<Arrow key={`ar${i}`} x1={a.px + dx * (a.ps * 0.5 + F.gap.s)} y1={a.py} x2={b.px - dx * (b.ps * 0.5 + F.gap.s)} y2={b.py} t={t} at={at} width={L.layout === "steps" ? 12 : 20} color={L.layout === "steps" ? "#ffffff" : "#e53950"} curve={-0.12} />);
      }
    }
    if (L.layout === "compare" && L.symbol && L.items.length > 1) {
      const sym = scene.symbol ?? "VS";
      const at = (L.items[1].at ?? 0.9) - 0.15;
      out.push(
        <Pop key="sym" x={L.symbol.x} y={L.symbol.y} t={t} at={at} enter="spin" z={6}>
          <Badge text={sym} size={L.symbol.s} bg={sym === "=" ? "#3ddc97" : sym === "≠" ? "#e53950" : "#ffc83d"} color={sym === "VS" ? INK : "#fff"} />
        </Pop>,
      );
    }
    return out;
  };

  // bubble
  const bubbleEl = () => {
    const b = scene.bubble;
    if (!b) return null;
    const kind = b.kind ?? (L.layout === "thought" ? "thought" : "speech");
    const who = L.chars.find((c) => c.who === (b.who ?? speaker)) ?? L.chars[0];
    const at = b.at ?? 0.3;
    if (L.thought && kind === "thought") {
      const w = L.thought.w;
      return (
        <Pop key="bub" x={L.thought.x} y={L.thought.y} t={t} at={at} enter="pop" z={7}>
          <div data-box="bubble"><Bubble text={b.text} size={F.type.body} dir={dir} maxWidth={w} minW={w * 0.7} minH={w * 0.4} kind="thought" tail={L.portrait ? "down-left" : "down-left"}>
            {b.prop ? (
              <svg width={w * 0.38} height={w * 0.38} viewBox="-110 -110 220 220" style={{ overflow: "visible" }}>
                <PropArt name={b.prop} size={200} t={t} />
              </svg>
            ) : undefined}
          </Bubble></div>
        </Pop>
      );
    }
    const headTop = who ? who.py - who.ps * 0.98 : H * 0.3;
    const right = who ? who.facing !== "left" : true;
    const bubW = L.portrait ? W * 0.78 : W * 0.4;
    const ts = F.textSafe;
    const bx = who ? clamp(who.px + (right ? 1 : -1) * who.ps * 0.45, ts.x0 + bubW / 2, ts.x1 - bubW / 2) : W / 2;
    // the bubble's bottom sits above the head; in portrait it must also clear the caption band
    const limit = F.captionBand ? F.captionBand.y0 - F.gap.l : H;
    // Portrait stage is below the captions; its lower edge anchors the bubble above the heads.
    const by = L.portrait ? L.stage.y1 : Math.max(ts.y0 + F.type.body * 3, Math.min(limit, headTop - F.gap.l));
    return (
      <Pop key="bub" x={bx} y={by} t={t} at={at} enter="pop" z={7} anchor="bottom">
        <div data-box="bubble"><Bubble text={b.text} size={L.portrait ? F.type.h3 : F.type.body} dir={dir} maxWidth={bubW} kind={kind} tail={right ? "down-left" : "down-right"} /></div>
      </Pop>
    );
  };

  // texts
  const textEls = L.texts.map((tx, i) => {
    const at = tx.at ?? 0.2;
    const st = tx.style ?? "label";
    let el: React.ReactNode;
    if (st === "title" || st === "big") {
      el = <TitleText text={tx.text} t={t} at={at} size={tx.ps} dir={dir} maxWidth={tx.maxW ?? W * 0.8} color={tx.color ? resolveColor(tx.color) : st === "big" ? "#fff" : "#fff"} />;
      return <div data-box="text" key={`tx${i}`} style={{ position: "absolute", left: tx.px, top: tx.py, transform: `translate(-50%,-50%) rotate(${tx.rotate ?? 0}deg)`, zIndex: 8, opacity: exitStyle(t, tx.out) }}>{el}</div>;
    }
    if (st === "note" || st === "quote") {
      el = <Note text={tx.text} size={tx.ps} dir={dir} maxWidth={tx.maxW ?? W * 0.6} color={tx.color ? resolveColor(tx.color) : textCol} />;
    } else if (st === "date") {
      el = <Tag text={tx.text} size={tx.ps} dir={dir} bg="#ffd23f" />;
    } else {
      el = <Tag text={tx.text} size={tx.ps} dir={dir} bg={tx.color ? resolveColor(tx.color) : "#fff"} rotate={tx.rotate ?? (rand(i + index) - 0.5) * 6} />;
    }
    return (
      <Pop key={`tx${i}`} x={tx.px} y={tx.py} t={t} at={at} out={tx.out} enter={tx.enter ?? "pop"} z={8}>
        <div data-box="text">{el}</div>
      </Pop>
    );
  });

  // layout specific blocks
  const extra: React.ReactNode[] = [];
  if (L.title && scene.title) {
    extra.push(
      <div key="title" style={{ position: "absolute", left: L.title.x, top: L.title.y, width: L.layout === "story" ? L.title.maxW : undefined, transform: "translate(-50%,-50%)", zIndex: 8 }}>
        <div data-box="title"><TitleText text={scene.title} t={t} at={0.1} size={L.title.size} dir={dir} maxWidth={L.title.maxW} /></div>
        {L.layout === "title" && scene.subtitle && (
          <div style={{ textAlign: "center", marginTop: F.gap.m, opacity: prog(t, 0.6, 0.4) }}>
            <Note text={scene.subtitle} size={F.type.h3} dir={dir} maxWidth={L.title.maxW} color={textCol} />
          </div>
        )}
      </div>,
    );
  }
  if (L.card) {
    extra.push(
      <div key="card" data-box="card" style={{ position: "absolute", left: L.card.x, top: L.card.y, transform: "translate(-50%,-50%)", zIndex: 8, width: L.card.w }}>
        <NameCard name={scene.title ?? ""} subtitle={scene.subtitle} detail={scene.detail} t={t} at={0.25} dir={dir} scale={L.portrait ? 0.95 : 1} align={L.card.align} />
      </div>,
    );
  }
  if (scene.number && L.number) {
    const nb = scene.number;
    extra.push(
      <div key="num" data-box="number" style={{ position: "absolute", left: L.number.x, top: L.number.y, transform: "translate(-50%,-50%)", zIndex: 8 }}>
        <NumberReveal value={nb.value} from={nb.from} prefix={nb.prefix} suffix={nb.suffix} label={nb.label} decimals={nb.decimals} group={nb.group} t={t} at={nb.at ?? 0.3} size={L.number.size} dir={dir} lang={sb.language} />
      </div>,
    );
  }
  if (scene.image && L.image) {
    const w = L.image.w / 1.08;
    extra.push(
      <Pop key="img" x={L.image.x} y={L.image.y} t={t} at={scene.image.at ?? 0.2} enter="drop" z={4}>
        <div data-box="image"><ImageCard src={scene.image.src} w={w} h={w * 0.62} t={t} caption={scene.image.caption} dir={dir} fit={scene.image.fit} /></div>
      </Pop>,
    );
  }
  if (L.news) {
    extra.push(
      <Pop key="news" x={L.news.x} y={L.news.y} t={t} at={0.25} enter="spin" z={4}>
        <div data-box="news"><NewsCard headline={scene.title ?? scene.text ?? ""} kicker={scene.subtitle ?? (dir === "rtl" ? "خبر عاجل" : "BREAKING")} w={L.news.w} dir={dir} image={scene.image?.src} /></div>
      </Pop>,
    );
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: bgColor }}>
      <AbsoluteFill style={{ transform: `translate(${shx - panX + cx + dX}px, ${shy - panY + cy + dY}px) rotate(${tilt}deg) scale(${zoom * cover})`, transformOrigin: `${fx}% ${fy}%` }}>
        <div style={{ position: "absolute", inset: -40, filter: dof > 0.3 ? `blur(${dof.toFixed(2)}px)` : undefined }}>
          <Background spec={bg} W={W + 80} H={H + 80} t={t} frame={gf} seed={`b${index}`} />
          <LightBehind mood={mood} W={W + 80} H={H + 80} t={t} />
        </div>
        {L.props.map(propEl)}
        {itemEls()}
        {L.chars.map(charSvg)}
        {extra}
        {bubbleEl()}
        {textEls}
      </AbsoluteFill>
      <Grade mood={mood} W={W} H={H} />
    </AbsoluteFill>
  );
};
