import React from "react";
import { Face, Expression, EXPR, isBlinking } from "./Face";
import { INK, Look } from "./theme";
import { PropArt } from "./Props";
import { rand } from "./anim";

export type Pose =
  | "idle" | "talk" | "explain" | "point" | "point_up" | "point_down" | "wave" | "think" | "shrug"
  | "celebrate" | "hips" | "scared" | "present" | "cross" | "hold" | "hold_up" | "facepalm"
  | "walk" | "run" | "sit" | "bow" | "fist" | "write" | "phone" | "cheer";

// Arm angles in degrees: [upper, bend]. 0 = hanging down, +90 = straight out to that side,
// 180 = straight up. Negative = across the body. Forearm angle = upper + bend.
type ArmSpec = [number, number];
type PoseSpec = { l: ArmSpec; r: ArmSpec; hand?: "point" | "open" | "fist"; handL?: "point" | "open" | "fist"; bodyY?: number; lean?: number };

export const POSES: Record<Pose, PoseSpec> = {
  idle: { l: [10, 6], r: [10, 6] },
  talk: { l: [10, 6], r: [28, 78], hand: "open" },
  explain: { l: [30, 70], r: [30, 70], hand: "open", handL: "open" },
  point: { l: [10, 6], r: [86, 4], hand: "point" },
  point_up: { l: [10, 6], r: [150, 12], hand: "point" },
  point_down: { l: [10, 6], r: [45, -10], hand: "point" },
  wave: { l: [10, 6], r: [128, 34], hand: "open" },
  think: { l: [-14, 98], r: [-10, 212] },
  shrug: { l: [52, 98], r: [52, 98], hand: "open", handL: "open", bodyY: -6 },
  celebrate: { l: [158, 12], r: [158, 12], hand: "fist", handL: "fist", bodyY: -14 },
  cheer: { l: [10, 6], r: [160, 8], hand: "fist", bodyY: -8 },
  hips: { l: [32, -104], r: [32, -104] },
  scared: { l: [22, 158], r: [22, 158], hand: "open", handL: "open", lean: -4 },
  present: { l: [10, 6], r: [64, 36], hand: "open" },
  cross: { l: [-22, -68], r: [-30, -62] },
  hold: { l: [10, 6], r: [22, 72] },
  hold_up: { l: [10, 6], r: [140, 20] },
  facepalm: { l: [10, 6], r: [-6, 196] },
  walk: { l: [12, 8], r: [12, 8] },
  run: { l: [30, 80], r: [30, 80], lean: 8 },
  sit: { l: [20, 60], r: [20, 60] },
  bow: { l: [8, 4], r: [8, 4], lean: 18 },
  fist: { l: [10, 6], r: [40, 120], hand: "fist" },
  write: { l: [10, 6], r: [16, 84] },
  phone: { l: [10, 6], r: [-4, 190] },
};

export type CharacterProps = {
  look: Look;
  expression?: Expression;
  pose?: Pose;
  fromPose?: Pose;
  poseT?: number; // 0..1 blend from fromPose to pose
  mouth?: number; // lip-sync openness 0..1
  talking?: boolean;
  facing?: "left" | "right" | "front";
  t: number; // seconds (scene-local)
  frame: number;
  fps: number;
  seed?: number;
  lookAt?: { x: number; y: number };
  emote?: string;
  emoteT?: number;
  holding?: string; // prop name
  walking?: boolean;
};

const rad = (d: number) => (d * Math.PI) / 180;
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const armPoints = (side: 1 | -1, spec: ArmSpec, sx: number, sy: number, up = 86, fore = 82, wiggle = 0) => {
  const a1 = rad(spec[0]);
  const a2 = rad(spec[0] + spec[1] + wiggle);
  const ex = sx + side * Math.sin(a1) * up;
  const ey = sy + Math.cos(a1) * up;
  const hx = ex + side * Math.sin(a2) * fore;
  const hy = ey + Math.cos(a2) * fore;
  return { ex, ey, hx, hy, a2 };
};

const Hand: React.FC<{ x: number; y: number; a: number; side: 1 | -1; kind?: string }> = ({ x, y, a, side, kind }) => {
  const dx = side * Math.sin(a), dy = Math.cos(a);
  return (
    <g>
      {kind === "point" && (
        <line x1={x} y1={y} x2={x + dx * 30} y2={y + dy * 30} stroke={INK} strokeWidth={15} strokeLinecap="round" />
      )}
      {kind === "point" && (
        <line x1={x} y1={y} x2={x + dx * 30} y2={y + dy * 30} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      )}
      <circle cx={x} cy={y} r={kind === "open" ? 18 : 16} fill="#fff" stroke={INK} strokeWidth={5.5} />
      {kind === "open" && (
        <path d={`M${x - side * 6} ${y - 14} q${-side * 10} -10 ${-side * 4} -18`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      )}
      {kind === "fist" && <path d={`M${x - 8} ${y - 4} h16 M${x - 8} ${y + 4} h16`} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />}
    </g>
  );
};

/* ---------------- torso / outfit ---------------- */
const Torso: React.FC<{ look: Look; top: number; bottom: number }> = ({ look, top, bottom }) => {
  const c = look.shirt ?? "#ffd23f";
  const acc = look.accent ?? "#ff7a2f";
  const o = look.outfit ?? "shirt";
  const sw = 7;
  const body = (b: number, wTop = 54, wBot = 66) =>
    `M${-wTop} ${top + 18} Q${-wTop} ${top} ${-wTop + 22} ${top} L${wTop - 22} ${top} Q${wTop} ${top} ${wTop} ${top + 18} L${wBot} ${b - 12} Q${wBot} ${b} ${wBot - 14} ${b} L${-wBot + 14} ${b} Q${-wBot} ${b} ${-wBot} ${b - 12}Z`;
  switch (o) {
    case "robe":
      return (
        <g>
          <path d={body(-14, 54, 84)} fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M-2 ${top + 6} L-2 -20`} stroke={INK} strokeWidth={4} opacity={0.5} />
          <rect x={-60} y={bottom - 20} width={120} height={16} rx={6} fill={acc} stroke={INK} strokeWidth={5} />
        </g>
      );
    case "dress":
      return (
        <g>
          <path d={body(bottom + 50, 50, 92)} fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M-50 ${bottom - 30} Q0 ${bottom - 18} 50 ${bottom - 30}`} stroke={INK} strokeWidth={4} fill="none" opacity={0.45} />
        </g>
      );
    case "coat":
      return (
        <g>
          <path d={body(bottom + 52, 56, 74)} fill="#fbfbfb" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M-20 ${top + 2} L0 ${top + 60} L20 ${top + 2}Z`} fill={acc} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M-30 ${top + 2} L-6 ${top + 70} L-14 ${bottom + 52} M30 ${top + 2} L6 ${top + 70} L14 ${bottom + 52}`} stroke={INK} strokeWidth={5} fill="none" strokeLinejoin="round" />
          <rect x={26} y={top + 64} width={22} height={16} rx={3} fill="none" stroke={INK} strokeWidth={4} />
        </g>
      );
    case "suit":
      return (
        <g>
          <path d={body(bottom + 10)} fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M-24 ${top + 1} L0 ${top + 74} L24 ${top + 1}Z`} fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M-24 ${top + 1} L-6 ${top + 80} M24 ${top + 1} L6 ${top + 80}`} stroke={INK} strokeWidth={5} />
        </g>
      );
    case "vest":
      return (
        <g>
          <path d={body(bottom)} fill="#fbfbfb" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M-54 ${top + 18} Q-54 ${top} -32 ${top} L-10 ${top} L-6 ${bottom} L-52 ${bottom} Q-64 ${bottom} -64 ${bottom - 12}Z`} fill={c} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
          <path d={`M54 ${top + 18} Q54 ${top} 32 ${top} L10 ${top} L6 ${bottom} L52 ${bottom} Q64 ${bottom} 64 ${bottom - 12}Z`} fill={c} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
          <circle cx={-18} cy={top + 70} r={4} fill={INK} />
          <circle cx={-18} cy={top + 110} r={4} fill={INK} />
        </g>
      );
    case "hoodie":
      return (
        <g>
          <path d={`M-58 ${top + 26} Q-66 ${top - 26} 0 ${top - 22} Q66 ${top - 26} 58 ${top + 26}Z`} fill={c} stroke={INK} strokeWidth={6} />
          <path d={body(bottom)} fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M-34 ${bottom - 52} H34 L40 ${bottom - 14} H-40Z`} fill="none" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          <path d={`M-12 ${top + 6} v34 M12 ${top + 6} v34`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case "armor":
      return (
        <g>
          <path d={body(bottom)} fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M-48 ${top + 50} Q0 ${top + 70} 48 ${top + 50} M-56 ${top + 100} Q0 ${top + 120} 56 ${top + 100}`} stroke={INK} strokeWidth={4.5} fill="none" />
          <rect x={-62} y={bottom - 26} width={124} height={16} rx={5} fill="#6d4c41" stroke={INK} strokeWidth={5} />
        </g>
      );
    case "tunic":
      return (
        <g>
          <path d={body(bottom + 40, 54, 76)} fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <rect x={-62} y={bottom - 10} width={124} height={16} rx={6} fill={acc} stroke={INK} strokeWidth={5} />
          <path d={`M-44 ${top + 4} Q0 ${top + 46} 44 ${top + 4}`} stroke={acc} strokeWidth={12} fill="none" />
        </g>
      );
    default:
      return (
        <g>
          <path d={body(bottom)} fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M-20 ${top + 1} Q0 ${top + 22} 20 ${top + 1}`} stroke={INK} strokeWidth={4.5} fill="none" />
        </g>
      );
  }
};

/* ---------------- hair & hats (head centred at 0,0, r=100) ---------------- */
const HairBack: React.FC<{ look: Look }> = ({ look }) => {
  const hc = look.hairColor ?? INK;
  const sw = 7;
  switch (look.hair) {
    case "long":
      return <path d="M-104 -10 Q-118 120 -70 150 L70 150 Q118 120 104 -10 Q100 -110 0 -112 Q-100 -110 -104 -10Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "wavy":
      return <path d="M-106 -10 Q-122 50 -100 80 Q-80 100 -60 84 L60 84 Q80 100 100 80 Q122 50 106 -10 Q100 -110 0 -112 Q-100 -110 -106 -10Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "ponytail":
      return <path d="M60 -80 Q150 -60 130 40 Q120 80 96 60 Q120 0 80 -40Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "curly": {
      const blobs = [[-92, -30], [-98, 20], [-70, -80], [-30, -108], [20, -110], [64, -88], [96, -40], [100, 14], [-80, 60], [84, 60]];
      return (
        <g fill={hc} stroke={INK} strokeWidth={sw}>
          {blobs.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={40} />)}
        </g>
      );
    }
    default:
      return null;
  }
};

const HairFront: React.FC<{ look: Look }> = ({ look }) => {
  const hc = look.hairColor ?? INK;
  const sw = 7;
  const cap = (fringe = -40) => `M-100 -8 Q-104 -108 0 -110 Q104 -108 100 -8 Q70 ${fringe - 10} 20 ${fringe} Q-50 ${fringe - 6} -100 -8Z`;
  switch (look.hair) {
    case "tuft":
      return <path d="M-6 -99 C-14 -128 18 -142 26 -124 C32 -110 14 -104 10 -116" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />;
    case "spiky":
      return <path d="M-98 -20 L-108 -60 L-74 -66 L-82 -108 L-40 -96 L-28 -136 L6 -104 L30 -138 L44 -98 L84 -112 L76 -70 L108 -60 L98 -20 Q60 -60 0 -62 Q-60 -60 -98 -20Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "side":
      return <path d="M-102 -6 Q-106 -108 0 -112 Q106 -108 102 -10 Q90 -40 60 -56 Q20 -74 -30 -50 Q-70 -40 -102 -6Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "bob":
    case "long":
    case "wavy":
      return <path d={cap(-48)} fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "bun":
      return (
        <g fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <circle cx={0} cy={-120} r={38} />
          <path d={cap(-54)} />
        </g>
      );
    case "ponytail":
      return <path d={cap(-56)} fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "messy":
      return (
        <g fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-94 -6 L-130 -20 L-112 -40 L-140 -62 L-104 -66 L-110 -96 L-76 -76 L-80 -40Z" />
          <path d="M94 -6 L130 -20 L112 -40 L140 -62 L104 -66 L110 -96 L76 -76 L80 -40Z" />
        </g>
      );
    case "bald":
      return (
        <g fill={hc} stroke={INK} strokeWidth={5}>
          <path d="M-100 -10 Q-112 -40 -94 -56 Q-84 -30 -92 4Z" />
          <path d="M100 -10 Q112 -40 94 -56 Q84 -30 92 4Z" />
        </g>
      );
    case "curly":
      return (
        <g fill={hc} stroke={INK} strokeWidth={sw}>
          {[[-50, -96], [0, -108], [50, -96]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={34} />)}
        </g>
      );
    default:
      return null;
  }
};

const Hat: React.FC<{ look: Look; facing: number }> = ({ look, facing }) => {
  const c = look.hatColor ?? "#e53950";
  const acc = look.accent ?? "#ffc83d";
  const sw = 7;
  switch (look.hat) {
    case "cap":
      return (
        <g stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-98 -30 Q-100 -118 0 -118 Q100 -118 98 -30Z" fill={c} />
          <path d={`M${facing * 40} -40 Q${facing * 150} -46 ${facing * 160} -26 Q${facing * 100} -18 ${facing * 40} -26Z`} fill={c} />
        </g>
      );
    case "grad":
      return (
        <g stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-70 -86 L-70 -50 Q0 -30 70 -50 L70 -86Z" fill={c} />
          <path d="M0 -150 L-130 -100 L0 -64 L130 -100Z" fill={c} />
          <path d="M90 -96 L96 -30" stroke={acc} strokeWidth={6} />
        </g>
      );
    case "crown":
      return (
        <g stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-70 -86 L-82 -170 L-40 -126 L0 -186 L40 -126 L82 -170 L70 -86Z" fill="#ffc83d" />
          <circle cx={0} cy={-120} r={11} fill="#e53950" strokeWidth={4} />
          <circle cx={-48} cy={-104} r={8} fill="#4f7bff" strokeWidth={4} />
          <circle cx={48} cy={-104} r={8} fill="#3ddc97" strokeWidth={4} />
        </g>
      );
    case "turban":
      return (
        <g fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <ellipse cx={0} cy={-104} rx={112} ry={60} />
          <path d="M-100 -96 Q0 -150 100 -120" fill="none" strokeWidth={5} />
          <path d="M-104 -74 Q0 -126 104 -92" fill="none" strokeWidth={5} />
          <circle cx={0} cy={-80} r={12} fill={acc} strokeWidth={4} />
        </g>
      );
    case "helmet":
      return (
        <g stroke={INK} strokeWidth={sw} strokeLinejoin="round" fill={c}>
          <path d="M-104 -34 Q-104 -130 0 -132 Q104 -130 104 -34Z" />
          <path d="M-124 -34 H124 Q124 -16 104 -16 H-104 Q-124 -16 -124 -34Z" />
        </g>
      );
    case "hardhat":
      return (
        <g stroke={INK} strokeWidth={sw} strokeLinejoin="round" fill={c}>
          <path d="M-96 -44 Q-96 -136 0 -136 Q96 -136 96 -44Z" />
          <rect x={-128} y={-50} width={256} height={20} rx={10} />
          <path d="M0 -136 V-50" strokeWidth={5} />
        </g>
      );
    case "tophat":
      return (
        <g stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <rect x={-64} y={-230} width={128} height={150} rx={8} fill={c === "#e53950" ? INK : c} />
          <rect x={-64} y={-118} width={128} height={22} fill={acc} />
          <rect x={-112} y={-96} width={224} height={20} rx={10} fill={c === "#e53950" ? INK : c} />
        </g>
      );
    case "beret":
      return <path d="M-96 -64 Q-120 -140 10 -142 Q130 -136 100 -70 Q0 -96 -96 -64Z" fill={c} stroke={INK} strokeWidth={sw} />;
    case "wizard":
      return (
        <g stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-90 -70 L20 -290 L90 -70Z" fill={c} />
          <ellipse cx={0} cy={-70} rx={130} ry={24} fill={c} />
          <path d="M10 -170 l6 14 15 2 -11 10 3 15 -13 -7 -13 7 3 -15 -11 -10 15 -2z" fill="#ffc83d" strokeWidth={3} />
        </g>
      );
    case "chef":
      return (
        <g fill="#fff" stroke={INK} strokeWidth={sw}>
          <rect x={-70} y={-150} width={140} height={70} />
          <circle cx={-50} cy={-170} r={40} />
          <circle cx={0} cy={-190} r={46} />
          <circle cx={50} cy={-170} r={40} />
          <rect x={-66} y={-152} width={132} height={40} stroke="none" />
        </g>
      );
    case "fez":
      return (
        <g stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-60 -84 L-46 -170 L46 -170 L60 -84Z" fill="#c62f4b" />
          <path d="M0 -170 Q30 -160 34 -120" stroke={INK} strokeWidth={5} fill="none" />
        </g>
      );
    default:
      return null;
  }
};

/** Head coverings that wrap the head (drawn behind the face skin). */
const Wrap: React.FC<{ look: Look }> = ({ look }) => {
  const c = look.hatColor ?? "#5e7ce2";
  const acc = look.accent ?? "#d93a4a";
  if (look.hat === "headscarf") {
    return <path d="M-118 0 Q-124 -128 0 -130 Q124 -128 118 0 Q122 110 70 140 L-70 140 Q-122 110 -118 0Z" fill={c} stroke={INK} strokeWidth={7} strokeLinejoin="round" />;
  }
  if (look.hat === "keffiyeh") {
    return (
      <g>
        <path d="M-120 -10 Q-126 -128 0 -128 Q126 -128 120 -10 L140 150 L-140 150Z" fill={c} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {[-90, -50, -10, 30, 70].map((x) => [-60, 0, 60, 120].map((y) => <circle key={`${x}${y}`} cx={x + (y % 120 ? 20 : 0)} cy={y} r={5} fill={acc} />))}
        <ellipse cx={0} cy={-96} rx={108} ry={26} fill="none" stroke={INK} strokeWidth={14} />
      </g>
    );
  }
  if (look.hat === "pharaoh") {
    return (
      <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
        <path d="M-110 -40 Q-110 -134 0 -136 Q110 -134 110 -40 L136 130 L-136 130Z" fill={acc} />
        {[-100, -60, -20, 20, 60, 100].map((x, i) => <path key={i} d={`M${x * 1.05} -100 L${x * 1.28} 128`} stroke={c} strokeWidth={16} />)}
      </g>
    );
  }
  return null;
};

const Facial: React.FC<{ look: Look }> = ({ look }) => {
  const hc = look.hairColor ?? INK;
  const sw = 6;
  switch (look.facial) {
    case "beard":
      return <path d="M-92 10 Q-90 104 0 112 Q90 104 92 10 Q70 56 40 60 Q0 34 -40 60 Q-70 56 -92 10Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "longbeard":
      return <path d="M-92 10 Q-96 140 0 210 Q96 140 92 10 Q70 56 40 62 Q0 36 -40 62 Q-70 56 -92 10Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "goatee":
      return <path d="M-22 70 Q0 120 22 70 Q0 80 -22 70Z" fill={hc} stroke={INK} strokeWidth={sw} />;
    case "mustache":
      return <path d="M0 28 Q-30 18 -52 34 Q-30 46 0 34 Q30 46 52 34 Q30 18 0 28Z" fill={hc} stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round" />;
    default:
      return null;
  }
};

const Accessory: React.FC<{ look: Look; top: number; t: number }> = ({ look, top, t }) => {
  const acc = look.accent ?? "#ff7a2f";
  switch (look.accessory) {
    case "scarf": {
      const sway = Math.sin(t * 2.4) * 6;
      return (
        <g stroke={INK} strokeWidth={6} strokeLinejoin="round">
          <path d={`M30 ${top + 8} Q44 ${top + 60} ${36 + sway} ${top + 92} L${62 + sway} ${top + 88} Q60 ${top + 50} 52 ${top + 6}Z`} fill={acc} />
          <path d={`M-62 ${top - 4} Q0 ${top + 26} 62 ${top - 4} L58 ${top + 18} Q0 ${top + 48} -58 ${top + 18}Z`} fill={acc} />
        </g>
      );
    }
    case "tie":
      return <path d={`M0 ${top + 6} L-10 ${top + 22} L-4 ${top + 90} L0 ${top + 100} L4 ${top + 90} L10 ${top + 22}Z`} fill={acc} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />;
    case "bowtie":
      return <path d={`M0 ${top + 10} L-24 ${top - 2} L-24 ${top + 22}Z M0 ${top + 10} L24 ${top - 2} L24 ${top + 22}Z`} fill={acc} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />;
    case "medal":
      return (
        <g stroke={INK} strokeWidth={4.5}>
          <path d={`M-14 ${top} L0 ${top + 60} L14 ${top}`} fill="none" stroke="#4f7bff" strokeWidth={8} />
          <circle cx={0} cy={top + 72} r={16} fill="#ffc83d" />
        </g>
      );
    default:
      return null;
  }
};

const Glasses: React.FC<{ kind?: string }> = ({ kind }) => {
  if (kind === "glasses")
    return (
      <g fill="none" stroke={INK} strokeWidth={6}>
        <circle cx={-34} cy={-10} r={30} />
        <circle cx={34} cy={-10} r={30} />
        <path d="M-4 -12 Q0 -18 4 -12" />
      </g>
    );
  if (kind === "sunglasses")
    return (
      <g stroke={INK} strokeWidth={6}>
        <path d="M-70 -30 H-4 Q-4 14 -38 14 Q-70 14 -70 -30Z M70 -30 H4 Q4 14 38 14 Q70 14 70 -30Z" fill={INK} />
        <path d="M-4 -24 H4" />
      </g>
    );
  if (kind === "monocle") return <circle cx={34} cy={-10} r={30} fill="none" stroke="#ffc83d" strokeWidth={6} />;
  return null;
};

/* ---------------- emotes above the head ---------------- */
export const Emote: React.FC<{ kind: string; t: number }> = ({ kind, t }) => {
  const bob = Math.sin(t * 5) * 6;
  const p = Math.min(1, Math.max(0, t / 0.35));
  const s = p < 1 ? 0.3 + 0.9 * p - 0.2 * Math.sin(p * Math.PI) : 1;
  const g = (el: React.ReactNode) => <g transform={`translate(0 ${bob}) scale(${s})`}>{el}</g>;
  switch (kind) {
    case "idea":
      return g(<PropArt name="lightbulb" size={150} glow />);
    case "question":
      return g(<text x={0} y={40} textAnchor="middle" fontSize={150} fontWeight={900} fill="#4f7bff" stroke={INK} strokeWidth={6} paintOrder="stroke" fontFamily="Arial Black, Arial">?</text>);
    case "exclaim":
      return g(<text x={0} y={40} textAnchor="middle" fontSize={150} fontWeight={900} fill="#e53950" stroke={INK} strokeWidth={6} paintOrder="stroke" fontFamily="Arial Black, Arial">!</text>);
    case "sweat":
      return g(<path d="M60 -20 q-22 36 0 46 q22 -10 0 -46z" fill="#7cc8ff" stroke={INK} strokeWidth={5} />);
    case "anger":
      return g(
        <g stroke="#e53950" strokeWidth={10} strokeLinecap="round" fill="none" transform="translate(70 -10)">
          <path d="M-20 -6 q14 0 14 -14 M6 -20 q0 14 14 14 M20 6 q-14 0 -14 14 M-6 20 q0 -14 -14 -14" />
        </g>,
      );
    case "love":
      return g(
        <g fill="#ff4d6d" stroke={INK} strokeWidth={5}>
          <path transform="translate(-40 0) scale(2)" d="M0 14 C-22 -2 -16 -20 -6 -18 C-2 -17 0 -13 0 -10 C0 -13 2 -17 6 -18 C16 -20 22 -2 0 14Z" />
          <path transform="translate(40 -30) scale(1.4)" d="M0 14 C-22 -2 -16 -20 -6 -18 C-2 -17 0 -13 0 -10 C0 -13 2 -17 6 -18 C16 -20 22 -2 0 14Z" />
        </g>,
      );
    case "sparkle":
      return g(
        <g fill="#ffd23f" stroke={INK} strokeWidth={4}>
          {[[-70, 0, 1], [60, -30, 0.7], [10, -70, 0.55]].map(([x, y, k], i) => (
            <path key={i} transform={`translate(${x} ${y}) scale(${k})`} d="M0 -40 Q6 -6 40 0 Q6 6 0 40 Q-6 6 -40 0 Q-6 -6 0 -40Z" />
          ))}
        </g>,
      );
    case "zzz":
      return g(<text x={40} y={0} fontSize={70} fontWeight={900} fill="#fff" stroke={INK} strokeWidth={5} paintOrder="stroke" fontFamily="Arial Black, Arial">Zz</text>);
    case "music":
      return g(<PropArt name="music" size={120} />);
    case "dizzy":
      return g(
        <g fill="#ffd23f" stroke={INK} strokeWidth={4}>
          {[0, 1, 2].map((i) => {
            const a = t * 4 + (i * Math.PI * 2) / 3;
            return <path key={i} transform={`translate(${Math.cos(a) * 80} ${Math.sin(a) * 20 + 20}) scale(0.5)`} d="M0 -40 L12 -12 L40 -10 L18 8 L26 38 L0 22 L-26 38 L-18 8 L-40 -10 L-12 -12Z" />;
          })}
        </g>,
      );
    default:
      return null;
  }
};

/* ---------------- the character ---------------- */
export const Character: React.FC<CharacterProps> = (p) => {
  const look = p.look;
  const t = p.t;
  const facing = p.facing === "left" ? -1 : 1;
  const hs = look.height ?? 1;
  const poseName = p.walking ? "walk" : p.pose ?? (p.talking ? "talk" : "idle");
  const to = POSES[poseName] ?? POSES.idle;
  const from = POSES[p.fromPose ?? poseName] ?? to;
  const k = p.poseT ?? 1;
  const mix = (a: ArmSpec, b: ArmSpec): ArmSpec => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const L = mix(from.l, to.l);
  const R = mix(from.r, to.r);
  const m = p.talking ? p.mouth ?? 0 : 0;
  const seed = p.seed ?? 1;

  // body motion
  const breath = Math.sin(t * Math.PI * 0.9 + seed) * 3;
  const bodyY = lerp(from.bodyY ?? 0, to.bodyY ?? 0, k) + (poseName === "celebrate" ? -Math.abs(Math.sin(t * 7)) * 30 : 0);
  const walkPhase = p.walking || poseName === "run" ? t * (poseName === "run" ? 14 : 8) : 0;
  const stepBob = p.walking || poseName === "run" ? -Math.abs(Math.sin(walkPhase)) * 10 : 0;
  const lean = lerp(from.lean ?? 0, to.lean ?? 0, k) + (p.talking ? Math.sin(t * 3.1) * 1.2 + m * 2 : 0);
  const exprTilt = EXPR[p.expression ?? "neutral"]?.tilt ?? 0;
  const headTilt = exprTilt + (p.talking ? Math.sin(t * 4.3 + seed) * 2.5 + m * 3 : Math.sin(t * 1.3 + seed) * 1.2);

  const legTop = -150;
  const top = -322;
  const headY = -436;
  const HEAD = 1.32;
  const sx = 56, sy = top + 22;

  // talking gesture wiggle on the forearm
  const wig = p.talking && (poseName === "talk" || poseName === "explain") ? Math.sin(t * 5.2 + seed) * 10 + m * 14 : 0;
  const waveWig = poseName === "wave" ? Math.sin(t * 12) * 22 : 0;
  const ra = armPoints(1, R, sx, sy, 86, 82, wig + waveWig);
  const la = armPoints(-1, L, -sx, sy, 86, 82, poseName === "explain" ? wig * 0.7 : 0);
  const sleeve = ["robe", "coat", "suit", "hoodie", "armor", "tunic"].includes(look.outfit ?? "");
  const sleeveColor = look.outfit === "coat" ? "#fbfbfb" : look.shirt ?? "#ffd23f";

  const leg = (side: 1 | -1) => {
    const sw = Math.sin(walkPhase + (side === 1 ? 0 : Math.PI)) * 26;
    const fx = side * 32 + sw * facing;
    const fy = -6 - Math.max(0, Math.sin(walkPhase + (side === 1 ? 0 : Math.PI))) * 18;
    return (
      <g key={side}>
        <path d={`M${side * 22} ${legTop} L${fx} ${fy}`} stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <ellipse cx={fx + facing * 10} cy={fy + 2} rx={24} ry={11} fill={INK} />
      </g>
    );
  };

  const arm = (a: ReturnType<typeof armPoints>, side: 1 | -1, hand?: string) => (
    <g>
      {sleeve && (
        <>
          <path d={`M${side * sx} ${sy} L${a.ex} ${a.ey} L${lerp(a.ex, a.hx, 0.55)} ${lerp(a.ey, a.hy, 0.55)}`} stroke={INK} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={`M${side * sx} ${sy} L${a.ex} ${a.ey} L${lerp(a.ex, a.hx, 0.55)} ${lerp(a.ey, a.hy, 0.55)}`} stroke={sleeveColor} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
      <path d={`M${side * sx} ${sy} L${a.ex} ${a.ey} L${a.hx} ${a.hy}`} stroke={INK} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Hand x={a.hx} y={a.hy} a={a.a2} side={side} kind={hand} />
    </g>
  );

  const pupilLook = p.lookAt ?? { x: 0.25, y: 0 };
  const blink = isBlinking(p.frame, p.fps, seed);
  const hasWrap = ["headscarf", "keffiyeh", "pharaoh"].includes(look.hat ?? "");
  const headRx = look.head === "egg" ? 92 : look.head === "wide" ? 108 : 100;
  const headRy = look.head === "egg" ? 108 : look.head === "wide" ? 94 : 100;
  const hold = p.holding;

  return (
    <g transform={`scale(${hs}) translate(0 ${stepBob}) scale(${facing === -1 ? -1 : 1} 1)`}>
      {/* ground shadow */}
      <ellipse cx={0} cy={0} rx={90} ry={12} fill="#000" opacity={0.12} />
      {poseName !== "sit" && [leg(-1), leg(1)]}
      <g transform={`translate(0 ${bodyY + breath * 0.4}) rotate(${lean} 0 ${legTop})`}>
        <g transform={`translate(0 ${breath * 0.3})`}>
          <Torso look={look} top={top} bottom={legTop} />
          <Accessory look={look} top={top} t={t} />
        </g>
        <g transform={`translate(0 ${headY + breath}) rotate(${headTilt}) scale(${HEAD})`}>
          <HairBack look={look} />
          {hasWrap && <Wrap look={look} />}
          <ellipse cx={0} cy={0} rx={hasWrap ? headRx * 0.8 : headRx} ry={hasWrap ? headRy * 0.86 : headRy} fill={look.skin ?? "#fff"} stroke={INK} strokeWidth={7} />
          {look.blush && (
            <g fill="#ff8fa3" opacity={0.55}>
              <ellipse cx={-56} cy={26} rx={16} ry={9} />
              <ellipse cx={56} cy={26} rx={16} ry={9} />
            </g>
          )}
          {look.facial !== "mustache" && <Facial look={look} />}
          <g transform={`scale(${hasWrap ? 0.86 : 1})`}>
            <Face expression={p.expression} mouth={m} blink={blink} look={pupilLook} skin={look.skin ?? "#fff"} />
          </g>
          {look.facial === "mustache" && <Facial look={{ ...look }} />}
          <Glasses kind={look.accessory} />
          {!hasWrap && <HairFront look={look} />}
          <Hat look={look} facing={1} />
          {p.emote && (
            <g transform="translate(110 -170)">
              <g transform={`scale(${facing} 1)`}>
                <Emote kind={p.emote} t={p.emoteT ?? t} />
              </g>
            </g>
          )}
        </g>
        {arm(la, -1, to.handL)}
        {arm(ra, 1, to.hand)}
        {hold && (
          <g transform={`translate(${ra.hx + 8} ${ra.hy - 52}) scale(${facing} 1)`}>
            <PropArt name={hold} size={130} />
          </g>
        )}
      </g>
    </g>
  );
};

export const CHAR_HEIGHT = 560; // local units from feet to top of head (without hats)

export const seedFrom = (s: string) => Math.floor(rand(s) * 1000);
