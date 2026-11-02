import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "./engine";
import type { Scene, Storyboard, CharRef, PropRef, TextRef, Item, Action } from "./types";
import { Background, BgSpec } from "./Backgrounds";
import { Character, Pose } from "./Character";
import { PropArt } from "./Props";
import type { Expression } from "./Face";
import { isBlinking } from "./Face";
import { lookFor, resolveColor, INK, BG, SHIRTS } from "./theme";
import { prog, rand, Enter, enterStyle, exitStyle, clamp } from "./anim";
import { Pop, TitleText, Tag, Note, Bubble, NameCard, NumberReveal, Arrow, Badge, ImageCard, NewsCard, dirOf, textColorOn } from "./Elements";

type Placed<T> = T & { px: number; py: number; ps: number };

const bgOf = (b: Scene["bg"]): BgSpec => (typeof b === "string" ? { type: ["space", "night", "sky", "desert", "sea", "city", "room", "lab", "classroom", "burst", "grid", "underground", "paper", "dark", "gradient", "stage", "desk"].includes(b) ? b : "solid", color: b } : b ?? { type: "solid", color: "mint" });

/** Slot geometry per layout and orientation (fractions of the frame; sizes in units of min(W,H)). */
export function layoutScene(scene: Scene, W: number, H: number, sb: Storyboard) {
  const portrait = H > W * 1.1;
  const U = Math.min(W, H);
  const layout = scene.layout ?? "host_talk";
  const rtl = dirOf(sb.language) === "rtl";
  const mirror = !!scene.mirror;
  const mx = (x: number) => (mirror ? 1 - x : x);
  const chars: Placed<CharRef>[] = [];
  const props: Placed<PropRef>[] = [];
  const texts: Placed<TextRef & { maxW?: number }>[] = [];
  const items: Placed<Item & { idx: number }>[] = [];
  let stage = { x: 0.5, y: 0.45, s: 0.6 };
  let bubbleAt: { x: number; y: number; w: number } | null = null;
  let symbolAt: { x: number; y: number; s: number } | null = null;
  let arrowsBetween = false;
  let numberAt: { x: number; y: number; s: number } | null = null;
  let imageAt: { x: number; y: number; w: number } | null = null;
  let newsAt: { x: number; y: number; w: number } | null = null;
  let cardAt: { x: number; y: number; align: "start" | "end" | "center" } | null = null;
  let titleAt = { x: 0.5, y: portrait ? 0.1 : 0.12, size: portrait ? 92 : 96 };

  const sideChar = (L: { x: number; y: number; s: number }, P: { x: number; y: number; s: number }) => (portrait ? P : L);
  const charSlots: { x: number; y: number; s: number; facing?: "left" | "right" }[] = [];

  switch (layout) {
    case "hero":
      stage = portrait ? { x: 0.5, y: 0.38, s: 0.85 } : { x: 0.5, y: 0.47, s: 0.72 };
      charSlots.push(portrait ? { x: 0.2, y: 0.985, s: 0.5 } : { x: 0.13, y: 0.98, s: 0.48 });
      break;
    case "duo":
      charSlots.push(portrait ? { x: 0.28, y: 0.93, s: 0.58, facing: "right" } : { x: 0.27, y: 0.97, s: 0.64, facing: "right" });
      charSlots.push(portrait ? { x: 0.73, y: 0.93, s: 0.58, facing: "left" } : { x: 0.73, y: 0.97, s: 0.64, facing: "left" });
      stage = portrait ? { x: 0.5, y: 0.3, s: 0.5 } : { x: 0.5, y: 0.25, s: 0.32 };
      break;
    case "thought":
      charSlots.push(sideChar({ x: 0.27, y: 0.96, s: 0.74 }, { x: 0.5, y: 0.985, s: 0.72 }));
      stage = portrait ? { x: 0.5, y: 0.29, s: 0.5 } : { x: 0.64, y: 0.36, s: 0.42 };
      bubbleAt = portrait ? { x: 0.5, y: 0.29, w: 0.86 } : { x: 0.64, y: 0.36, w: 0.62 };
      break;
    case "title":
      stage = { x: 0.5, y: 0.47, s: 0.5 };
      titleAt = { x: 0.5, y: 0.47, size: portrait ? 132 : 150 };
      charSlots.push(portrait ? { x: 0.5, y: 0.99, s: 0.55 } : { x: 0.14, y: 0.98, s: 0.5 });
      break;
    case "name_card":
      charSlots.push(sideChar({ x: rtl ? 0.7 : 0.3, y: 0.96, s: 0.8 }, { x: 0.5, y: 0.985, s: 0.74 }));
      cardAt = portrait ? { x: 0.5, y: 0.24, align: "center" } : { x: rtl ? 0.32 : 0.68, y: 0.45, align: "start" };
      stage = portrait ? { x: 0.5, y: 0.24, s: 0.4 } : { x: rtl ? 0.32 : 0.68, y: 0.45, s: 0.4 };
      break;
    case "compare":
    case "transform":
      stage = portrait ? { x: 0.5, y: 0.3, s: 0.85 } : { x: 0.5, y: 0.37, s: 0.9 };
      symbolAt = portrait ? { x: 0.5, y: 0.3, s: 0.16 } : { x: 0.5, y: 0.37, s: 0.18 };
      charSlots.push(portrait ? { x: 0.5, y: 0.99, s: 0.6 } : { x: 0.5, y: 1.02, s: 0.42 });
      break;
    case "steps":
      stage = portrait ? { x: 0.5, y: 0.36, s: 0.9 } : { x: 0.5, y: 0.36, s: 0.9 };
      charSlots.push(portrait ? { x: 0.5, y: 0.99, s: 0.5 } : { x: 0.5, y: 1.02, s: 0.42 });
      arrowsBetween = true;
      break;
    case "number":
      numberAt = portrait ? { x: 0.5, y: 0.37, s: 210 } : { x: 0.63, y: 0.6, s: 230 };
      stage = portrait ? { x: 0.5, y: 0.15, s: 0.26 } : { x: 0.63, y: 0.24, s: 0.3 };
      charSlots.push(sideChar({ x: 0.22, y: 0.96, s: 0.76 }, { x: 0.5, y: 0.985, s: 0.68 }));
      break;
    case "image":
      imageAt = portrait ? { x: 0.5, y: 0.3, w: 0.84 } : { x: 0.63, y: 0.46, w: 0.92 };
      charSlots.push(sideChar({ x: 0.2, y: 0.96, s: 0.74 }, { x: 0.5, y: 0.985, s: 0.66 }));
      break;
    case "news":
      newsAt = portrait ? { x: 0.5, y: 0.3, w: 0.86 } : { x: 0.63, y: 0.46, w: 0.85 };
      charSlots.push(sideChar({ x: 0.2, y: 0.96, s: 0.74 }, { x: 0.5, y: 0.985, s: 0.66 }));
      break;
    case "crowd": {
      const n = Math.max(1, scene.characters?.length ?? 1);
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? 0.5 : 0.14 + (0.72 * i) / (n - 1);
        charSlots.push({ x, y: portrait ? 0.84 + (i % 2) * 0.07 : 0.97, s: portrait ? 0.46 : Math.min(0.66, 2.1 / n), facing: x < 0.5 ? "right" : "left" });
      }
      stage = portrait ? { x: 0.5, y: 0.26, s: 0.5 } : { x: 0.5, y: 0.2, s: 0.3 };
      break;
    }
    case "free":
      stage = { x: 0.5, y: 0.45, s: 0.5 };
      break;
    case "host_talk":
    default:
      charSlots.push(portrait ? { x: 0.5, y: 0.985, s: 0.72 } : { x: 0.24, y: 0.97, s: 0.74 });
      stage = portrait ? { x: 0.5, y: 0.29, s: 0.66 } : { x: 0.655, y: 0.46, s: 0.62 };
      titleAt = portrait ? { x: 0.5, y: 0.07, size: 80 } : { x: 0.655, y: 0.12, size: 90 };
  }

  // characters
  (scene.characters ?? []).forEach((c, i) => {
    const slot = charSlots[Math.min(i, charSlots.length - 1)] ?? { x: 0.5, y: 0.96, s: 0.7 };
    const x = mx(c.x ?? slot.x);
    chars.push({
      ...c,
      px: x * W,
      py: (c.y ?? slot.y) * H,
      ps: (c.size ?? slot.s) * U,
      facing: c.facing ?? (mirror && slot.facing ? (slot.facing === "left" ? "right" : "left") : slot.facing) ?? (x < 0.5 ? "right" : "left"),
    });
  });

  // stage props
  const sp = (scene.props ?? []).filter((p) => p.x === undefined || p.y === undefined);
  const n = sp.length;
  const grid: [number, number, number][] =
    n <= 1 ? [[0, 0, 0.8]] :
    n === 2 ? [[-0.29, 0, 0.56], [0.29, 0, 0.56]] :
    n === 3 ? [[-0.36, 0.1, 0.44], [0, -0.14, 0.44], [0.36, 0.1, 0.44]] :
    [[-0.22, -0.2, 0.34], [0.22, -0.2, 0.34], [-0.22, 0.2, 0.34], [0.22, 0.2, 0.34], [0, 0, 0.3], [0, 0.4, 0.3]];
  let si = 0;
  (scene.props ?? []).forEach((p) => {
    if (p.x !== undefined && p.y !== undefined) {
      props.push({ ...p, px: mx(p.x) * W, py: p.y * H, ps: (p.size ?? 0.3) * U });
    } else {
      const g = grid[Math.min(si, grid.length - 1)];
      const sx = rtl && layout !== "hero" ? -g[0] : g[0];
      si++;
      props.push({ ...p, px: mx(stage.x) * W + sx * stage.s * U, py: stage.y * H + g[1] * stage.s * U, ps: (p.size ?? stage.s * g[2]) * U });
    }
  });

  // items (compare / transform / steps)
  const its = scene.items ?? [];
  if (its.length) {
    const m = its.length;
    its.forEach((it, i) => {
      let x: number, y: number, s: number;
      if (layout === "compare" || layout === "transform") {
        const d = portrait ? 0.27 : 0.25;
        const ord = rtl ? (i === 0 ? 1 : -1) : i === 0 ? -1 : 1;
        x = 0.5 + ord * d;
        y = stage.y;
        s = portrait ? 0.38 : 0.36;
      } else if (portrait) {
        const cols = m <= 2 ? 1 : 2;
        const rows = Math.ceil(m / cols);
        const c = i % cols, r = Math.floor(i / cols);
        const lastAlone = cols === 2 && m % 2 === 1 && i === m - 1;
        x = cols === 1 || lastAlone ? 0.5 : (rtl ? 0.74 - c * 0.48 : 0.26 + c * 0.48);
        y = 0.05 + (0.39 * (r + 0.5)) / rows;
        s = Math.min(0.34, 0.5 / rows);
      } else {
        const span = 0.78;
        const pos = m === 1 ? 0.5 : 0.11 + (span * i) / (m - 1);
        x = rtl ? 1 - pos : pos;
        y = stage.y;
        s = Math.min(0.34, 0.86 / m);
      }
      items.push({ ...it, idx: i, px: mx(x) * W, py: y * H, ps: s * U });
    });
  }

  // free texts
  (scene.texts ?? []).forEach((tx) => {
    const isTitle = tx.style === "title" || tx.style === "big";
    texts.push({
      ...tx,
      px: (tx.x ?? (isTitle ? titleAt.x : stage.x)) * W,
      py: (tx.y ?? (isTitle ? titleAt.y : stage.y + stage.s * 0.55)) * H,
      ps: tx.size ?? (tx.style === "big" ? (portrait ? 220 : 260) : isTitle ? titleAt.size : 54),
      maxW: (portrait ? 0.9 : layout === "title" ? 0.85 : 0.6) * W,
    });
  });

  return { portrait, U, W, H, chars, props, texts, items, stage, bubbleAt, symbolAt, arrowsBetween, numberAt, imageAt, newsAt, cardAt, titleAt, rtl, layout };
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
  for (const a of actions) {
    if (a.who !== c.who || a.at > t) continue;
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
  return { pose, prevPose, poseT: prog(t, poseAt, 0.28, "power2.inOut"), expression, emote, emoteAt, facing, lookAt };
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
    case "bounce": return { dx: 0, dy: -Math.abs(Math.sin(t * 4)) * 24, r: 0, s: 1 };
    case "orbit": return { dx: Math.cos(t * 1.2 + seed) * 30, dy: Math.sin(t * 1.2 + seed) * 14, r: 0, s: 1 };
    case "none": return { dx: 0, dy: 0, r: 0, s: 1 };
    case "float":
    default: return { dx: 0, dy: Math.sin(t * 1.8 + seed) * 7, r: Math.sin(t * 1.1 + seed) * 2, s: 1 };
  }
};

export const SceneView: React.FC<{ scene: Scene; sb: Storyboard; mouth: number[]; startFrame: number; index: number; W: number; H: number }> = ({ scene, sb, mouth, startFrame, index, W, H }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.end - scene.start;
  const L = layoutScene(scene, W, H, sb);
  const { U } = L;
  const dir = dirOf(sb.language);
  const bg = bgOf(scene.bg);
  const bgColor = resolveColor(bg.color, BG.mint);
  const textCol = ["space", "night", "dark", "burst", "grid"].includes(bg.type ?? "") ? "#fff" : textColorOn(bgColor);
  const gf = startFrame + frame;
  const mouthNow = (mouth[gf] ?? 0) / 100;
  const speaker = speakerAt(scene, t);
  const actions = (scene.actions ?? []).slice().sort((a, b) => a.at - b.at);

  // camera
  const cam = scene.camera ?? {};
  const z0 = cam.zoom?.[0] ?? 1, z1 = cam.zoom?.[1] ?? 1.04;
  let zoom = z0 + (z1 - z0) * prog(t, 0, Math.max(dur, 0.5), "sine.inOut");
  for (const p of cam.punch ?? []) {
    if (t >= p) zoom += 0.09 * Math.exp(-(t - p) * 5) * prog(t, p, 0.12, "power2.out");
  }
  let shx = 0, shy = 0;
  for (const s of cam.shake ?? []) {
    if (t >= s && t < s + 0.5) {
      const k = 1 - (t - s) / 0.5;
      shx += Math.sin(t * 90) * 16 * k;
      shy += Math.cos(t * 77) * 12 * k;
    }
  }
  const fx = (cam.focus?.x ?? 0.5) * 100, fy = (cam.focus?.y ?? 0.5) * 100;
  const panX = (cam.pan?.[0] ?? 0) * W * prog(t, 0, Math.max(dur, 0.5), "sine.inOut");
  const panY = (cam.pan?.[1] ?? 0) * H * prog(t, 0, Math.max(dur, 0.5), "sine.inOut");

  const charSvg = (c: Placed<CharRef>, i: number) => {
    const st = charState(c, actions, t);
    const s = c.ps / 560;
    const cast = sb.cast[c.who] ?? { preset: c.who };
    let look = lookFor(cast.preset ?? (c.who === "host" ? "host" : c.who), cast.look);
    const dupIdx = L.chars.slice(0, i).filter((o) => o.who === c.who).length;
    if (dupIdx > 0) {
      // several copies of the same cast member (a crowd): vary clothes and hair so they read as different people
      const HAIRS = ["side", "spiky", "bob", "curly", "messy", "tuft"];
      const HC = ["#3a2a20", "#ffb300", "#5a3825", "#9aa0a6", "#2b1d16"];
      look = { ...look, shirt: SHIRTS[(dupIdx * 3 + index) % SHIRTS.length], hair: look.hat ? look.hair : HAIRS[(dupIdx + index) % HAIRS.length], hairColor: look.hairColor === "#cfd4da" ? look.hairColor : HC[dupIdx % HC.length], ...(cast.look ?? {}) };
    }
    const talking = speaker === c.who && mouthNow > 0.02;
    const walkIn = c.walkFrom !== undefined;
    const walkP = walkIn ? prog(t, c.at ?? 0, 1.2, "power1.inOut") : 1;
    const x = walkIn ? (c.walkFrom! * W) + (c.px - c.walkFrom! * W) * walkP : c.px;
    const enter: Enter = c.enter ?? (index === 0 || walkIn ? "none" : "none");
    const e = enterStyle(t, c.at ?? 0, enter, 600);
    const o = exitStyle(t, c.out);
    if (e.opacity <= 0 || o <= 0) return null;
    const vbW = 760, vbH = 820;
    return (
      <div key={`c${i}`} style={{ position: "absolute", left: x - (vbW / 2) * s + e.x, top: c.py - 760 * s + e.y, width: vbW * s, height: vbH * s, zIndex: 5, opacity: e.opacity, transform: `scale(${e.sx * o}, ${e.sy * o})`, transformOrigin: "50% 92%" }}>
        <svg width={vbW * s} height={vbH * s} viewBox={`${-vbW / 2} -760 ${vbW} ${vbH}`} style={{ overflow: "visible" }}>
          <Character
            look={look}
            expression={st.expression ?? (talking ? "happy" : "neutral")}
            pose={walkIn && walkP < 1 ? "walk" : st.pose ?? (speaker === c.who ? "talk" : "idle")}
            fromPose={st.prevPose}
            poseT={st.poseT}
            mouth={talking ? mouthNow : 0}
            talking={talking}
            facing={st.facing ?? c.facing}
            t={t}
            frame={gf}
            fps={fps}
            seed={7 + i * 31 + index}
            lookAt={st.lookAt ?? { x: (st.facing ?? c.facing) === "left" ? -0.35 : 0.35, y: 0 }}
            emote={st.emote}
            emoteT={t - st.emoteAt}
            holding={c.holding}
            walking={walkIn && walkP < 1}
          />
        </svg>
      </div>
    );
  };

  const propEl = (p: Placed<PropRef>, i: number) => {
    const m = motionOf(p, t, i * 1.7);
    const isSpeaker = p.talking || speaker === p.name;
    return (
      <Pop key={`p${i}`} x={p.px + m.dx} y={p.py + m.dy} t={t} at={p.at ?? 0} out={p.out} enter={p.enter ?? "pop"} rotate={(p.rotate ?? 0) + m.r} z={4}>
        <svg width={p.ps * 1.2} height={p.ps * 1.2} viewBox="-120 -120 240 240" style={{ overflow: "visible", display: "block", transform: `scale(${(p.flip ? -1 : 1) * m.s}, ${m.s})` }}>
          <PropArt name={p.name} size={200} face={p.face} mouth={isSpeaker ? mouthNow : 0} t={t} color={p.color} color2={p.color2} blink={isBlinking(gf, fps, 3 + i)} />
        </svg>
        {p.label && (
          <div style={{ position: "absolute", left: "50%", top: "100%", transform: `translate(-50%, ${-p.ps * 0.02}px) scale(${prog(t, (p.at ?? 0) + 0.25, 0.35, "back.out(2)")})` }}>
            <Tag text={p.label} size={Math.max(30, Math.min(56, p.ps * 0.17))} dir={dir} />
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
              <svg width={it.ps} height={it.ps} viewBox="-115 -115 230 230" style={{ overflow: "visible", transform: `translateY(${Math.sin(t * 1.8 + i) * 5}px)` }}>
                <PropArt name={it.prop ?? "question"} size={200} face={it.face} t={t} color={it.color} blink={isBlinking(gf, fps, 11 + i)} />
              </svg>
            )}
            {L.layout === "steps" && (
              <div style={{ position: "absolute", top: -it.ps * 0.08, [L.rtl ? "right" : "left"]: -it.ps * 0.08 }}>
                <Badge text={String(i + 1)} size={Math.max(60, it.ps * 0.3)} bg={["#ff6b8b", "#4f7bff", "#3ddc97", "#ffc83d", "#b05cff", "#ff8a3d"][i % 6]} />
              </div>
            )}
          </div>
          {(it.label || it.text) && (
            <div style={{ position: "absolute", left: "50%", top: "100%", transform: `translate(-50%, ${it.ps * 0.06}px) scale(${prog(t, at + 0.2, 0.35, "back.out(2)")})` }}>
              <Tag text={(it.label || it.text)!} size={Math.max(32, Math.min(58, it.ps * 0.16))} dir={dir} />
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
        out.push(<Arrow key={`ar${i}`} x1={a.px + dx * a.ps * 0.55} y1={a.py} x2={b.px - dx * b.ps * 0.55} y2={b.py} t={t} at={at} width={L.layout === "steps" ? 12 : 20} color={L.layout === "steps" ? "#ffffff" : "#e53950"} curve={-0.12} />);
      }
    }
    if (L.layout === "compare" && L.symbolAt && L.items.length > 1) {
      const sym = scene.symbol ?? "VS";
      const at = (L.items[1].at ?? 0.9) - 0.15;
      out.push(
        <Pop key="sym" x={L.symbolAt.x * W} y={L.symbolAt.y * H} t={t} at={at} enter="spin" z={6}>
          <Badge text={sym} size={L.symbolAt.s * U} bg={sym === "=" ? "#3ddc97" : sym === "≠" ? "#e53950" : "#ffc83d"} color={sym === "VS" ? INK : "#fff"} />
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
    if (L.bubbleAt && kind === "thought") {
      const w = L.bubbleAt.w * (L.portrait ? W : W * 0.5);
      return (
        <Pop key="bub" x={L.bubbleAt.x * W} y={L.bubbleAt.y * H} t={t} at={at} enter="pop" z={7}>
          <Bubble text={b.text} size={L.portrait ? 50 : 46} dir={dir} maxWidth={w} minW={w * 0.7} minH={w * 0.4} kind="thought" tail={L.portrait ? "down-left" : "down-left"}>
            {b.prop ? (
              <svg width={w * 0.38} height={w * 0.38} viewBox="-110 -110 220 220" style={{ overflow: "visible" }}>
                <PropArt name={b.prop} size={200} t={t} />
              </svg>
            ) : undefined}
          </Bubble>
        </Pop>
      );
    }
    const headTop = who ? who.py - who.ps * 0.98 : H * 0.3;
    const right = who ? who.facing !== "left" : true;
    const bx = who ? clamp(who.px + (right ? 1 : -1) * who.ps * 0.45, W * 0.22, W * 0.78) : W / 2;
    // portrait: keep bubbles in the upper half, clear of the caption band
    const by = L.portrait ? Math.min(H * 0.44, Math.max(H * 0.12, headTop - 70)) : Math.max(H * 0.1, headTop - 70);
    return (
      <Pop key="bub" x={bx} y={by} t={t} at={at} enter="pop" z={7} anchor="bottom">
        <Bubble text={b.text} size={L.portrait ? 54 : 52} dir={dir} maxWidth={L.portrait ? W * 0.8 : W * 0.4} kind={kind} tail={right ? "down-left" : "down-right"} />
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
      return <div key={`tx${i}`} style={{ position: "absolute", left: tx.px, top: tx.py, transform: `translate(-50%,-50%) rotate(${tx.rotate ?? 0}deg)`, zIndex: 8, opacity: exitStyle(t, tx.out) }}>{el}</div>;
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
        {el}
      </Pop>
    );
  });

  // layout specific blocks
  const extra: React.ReactNode[] = [];
  if (L.layout === "title" && scene.title) {
    extra.push(
      <div key="title" style={{ position: "absolute", left: L.titleAt.x * W, top: L.titleAt.y * H, transform: "translate(-50%,-50%)", zIndex: 8 }}>
        <TitleText text={scene.title} t={t} at={0.1} size={L.titleAt.size} dir={dir} maxWidth={W * 0.86} color={textCol === "#fff" ? "#fff" : "#fff"} />
        {scene.subtitle && (
          <div style={{ textAlign: "center", marginTop: 20, opacity: prog(t, 0.6, 0.4) }}>
            <Note text={scene.subtitle} size={L.titleAt.size * 0.36} dir={dir} maxWidth={W * 0.8} color={textCol} />
          </div>
        )}
      </div>,
    );
  } else if (L.layout === "name_card" && L.cardAt) {
    extra.push(
      <div key="card" style={{ position: "absolute", left: L.cardAt.x * W, top: L.cardAt.y * H, transform: "translate(-50%,-50%)", zIndex: 8, width: L.portrait ? W * 0.9 : W * 0.5 }}>
        <NameCard name={scene.title ?? ""} subtitle={scene.subtitle} detail={scene.detail} t={t} at={0.25} dir={dir} scale={L.portrait ? 0.95 : 1} align={L.cardAt.align} />
      </div>,
    );
  } else if (scene.title && L.layout !== "news" && (scene.props?.length ?? 0) === 0 && (scene.items?.length ?? 0) === 0 && !scene.bubble && !scene.number && !scene.image) {
    // a heading on its own: show it big in the stage
    extra.push(
      <div key="stitle" style={{ position: "absolute", left: L.stage.x * W, top: L.stage.y * H, transform: "translate(-50%,-50%)", zIndex: 8 }}>
        <TitleText text={scene.title} t={t} at={0.2} size={L.portrait ? 110 : 120} dir={dir} maxWidth={L.portrait ? W * 0.88 : W * 0.55} />
      </div>,
    );
  } else if (scene.title && L.layout !== "news") {
    extra.push(
      <div key="htitle" style={{ position: "absolute", left: L.titleAt.x * W, top: L.titleAt.y * H, transform: "translate(-50%,-50%)", zIndex: 8 }}>
        <TitleText text={scene.title} t={t} at={0.1} size={L.titleAt.size * 0.85} dir={dir} maxWidth={L.portrait ? W * 0.9 : W * 0.6} />
      </div>,
    );
  }
  if (scene.number && L.numberAt) {
    const nb = scene.number;
    extra.push(
      <div key="num" style={{ position: "absolute", left: L.numberAt.x * W, top: L.numberAt.y * H, transform: "translate(-50%,-50%)", zIndex: 8 }}>
        <NumberReveal value={nb.value} from={nb.from} prefix={nb.prefix} suffix={nb.suffix} label={nb.label} decimals={nb.decimals} group={nb.group} t={t} at={nb.at ?? 0.3} size={L.numberAt.s} dir={dir} lang={sb.language} />
      </div>,
    );
  }
  if (scene.image && L.imageAt) {
    const w = L.imageAt.w * (L.portrait ? W : U);
    extra.push(
      <Pop key="img" x={L.imageAt.x * W} y={L.imageAt.y * H} t={t} at={scene.image.at ?? 0.2} enter="drop" z={4}>
        <ImageCard src={scene.image.src} w={w} h={w * 0.62} t={t} caption={scene.image.caption} dir={dir} fit={scene.image.fit} />
      </Pop>,
    );
  }
  if (L.layout === "news" && L.newsAt) {
    const w = L.newsAt.w * (L.portrait ? W : U);
    extra.push(
      <Pop key="news" x={L.newsAt.x * W} y={L.newsAt.y * H} t={t} at={0.25} enter="spin" z={4}>
        <NewsCard headline={scene.title ?? scene.text ?? ""} kicker={scene.subtitle ?? (dir === "rtl" ? "خبر عاجل" : "BREAKING")} w={w} dir={dir} image={scene.image?.src} />
      </Pop>,
    );
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: bgColor }}>
      <AbsoluteFill style={{ transform: `translate(${shx - panX}px, ${shy - panY}px) scale(${zoom})`, transformOrigin: `${fx}% ${fy}%` }}>
        <div style={{ position: "absolute", inset: -40 }}>
          <Background spec={bg} W={W + 80} H={H + 80} t={t} frame={gf} seed={`b${index}`} />
        </div>
        {L.props.map(propEl)}
        {itemEls()}
        {L.chars.map(charSvg)}
        {extra}
        {bubbleEl()}
        {textEls}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
