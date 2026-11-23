import React, { useId } from "react";
import { Face, Expression, EXPR, blinkAmount, type MouthShape } from "./Face";
import { INK, Look } from "./theme";
import { PropArt } from "./Props";
import { rand } from "./anim";
import { CelFilter, ShadowFilter, GroundShadow, SHADE, sid } from "./shade";

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
  sit: { l: [20, 60], r: [20, 60], bodyY: 22 }, // the body drops a little, towards chair height (a floor-length robe must stay above the ground)
  bow: { l: [8, 4], r: [8, 4], lean: 18 },
  fist: { l: [10, 6], r: [40, 120], hand: "fist" },
  write: { l: [10, 6], r: [16, 84] },
  phone: { l: [10, 6], r: [-4, 190] },
};

export type CharacterProps = {
  /** Arms (4), body Y, lean, jump, facing, gaze (2), expression weights, gesture weights. */
  motion?: number[];
  look: Look;
  expression?: Expression;
  pose?: Pose;
  fromPose?: Pose;
  poseT?: number; // 0..1 blend from fromPose to pose
  mouth?: number; // lip-sync openness 0..1
  mouthShape?: MouthShape; // lip shape of the sound being spoken (viseme.ts)
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

/** Overlapping circles drawn as one curly shape with a single outline. Each blob is [x, y, r]. */
const cloud = (blobs: number[][], fill: string) => (
  <g>
    {blobs.map(([x, y, r], i) => <circle key={`o${i}`} cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={14} />)}
    {blobs.map(([x, y, r], i) => <circle key={`f${i}`} cx={x} cy={y} r={r} fill={fill} />)}
  </g>
);
/** A little spiral line that marks a curl. */
const spiral = (x: number, y: number, s = 1, r = 0) => (
  <path transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} d="M-2 16 C-20 14 -20 -12 -2 -14 C12 -15 16 2 6 7 C-2 10 -7 3 -2 -2" fill="none" stroke={INK} strokeWidth={4.5 / s} strokeLinecap="round" />
);
const rad = (d: number) => (d * Math.PI) / 180;
/** A lighter version of a #rrggbb colour (k = how much white), for the shine on hair. */
const tint = (hex: string, k: number) => {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const c = (i: number) => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - k) + 255 * k).toString(16).padStart(2, "0");
  return `#${c(0)}${c(2)}${c(4)}`;
};
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

const Hand: React.FC<{ x: number; y: number; a: number; side: 1 | -1; kind?: string; fill?: string }> = ({ x, y, a, side, kind, fill = "#fff" }) => (
  // Drawn in the forearm's frame: +y points away from the elbow, so fingers follow the arm.
  <g transform={`translate(${x} ${y}) rotate(${(-side * a * 180) / Math.PI})`} fill={fill} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" strokeLinecap="round">
    {kind === "point" && <path d="M-7.5 4 V31 Q-7.5 39 0 39 Q7.5 39 7.5 31 V4Z" />}
    {kind === "open" && [-1, 0, 1].map((i) => <ellipse key={i} cx={i * 11.5} cy={16 - Math.abs(i) * 3} rx={6.8} ry={11.5} transform={`rotate(${-i * 18} ${i * 11.5} 14)`} />)}
    <ellipse cx={side * 14.5} cy={1} rx={7.5} ry={9.5} transform={`rotate(${-side * 24} ${side * 14.5} 1)`} />
    <circle r={17} />
    {kind === "fist" && <path d="M-7 5 V13 M0 7 V15 M7 5 V13" fill="none" strokeWidth={3.5} opacity={0.55} />}
  </g>
);

/* ---------------- torso / outfit ---------------- */
const Torso: React.FC<{ look: Look; top: number; bottom: number }> = ({ look, top, bottom }) => {
  const c = look.shirt ?? "#ffd23f";
  const acc = look.accent ?? "#ff7a2f";
  const o = look.outfit ?? "shirt";
  const sw = 7;
  const body = (b: number, wTop = 54, wBot = 66) =>
    `M${-wTop} ${top + 18} Q${-wTop} ${top} ${-wTop + 22} ${top} L${wTop - 22} ${top} Q${wTop} ${top} ${wTop} ${top + 18} L${wBot} ${b - 12} Q${wBot} ${b} ${wBot - 14} ${b} L${-wBot + 14} ${b} Q${-wBot} ${b} ${-wBot} ${b - 12}Z`;
  switch (o) {
    case "striped":
      return <g stroke={INK} strokeWidth={sw} strokeLinejoin="round"><path d={body(bottom)} fill={c}/>{[.25,.5,.75].map(k=><path key={k} d={`M-49 ${top+(bottom-top)*k} H49`} strokeWidth={12}/>)}</g>;
    case "overalls":
      return <g stroke={INK} strokeWidth={sw} strokeLinejoin="round"><path d={body(bottom)} fill={c}/><path d={`M-49 ${top} V${top+65} H-61 L-65 ${bottom} H65 L61 ${top+65} H49 V${top} H27 V${top+65} H-27 V${top}Z`} fill={look.pants??"#3b8df0"}/><rect x={-22} y={top+85} width={44} height={38} rx={6} fill="none"/></g>;
    case "police_uniform":
      return <g stroke={INK} strokeWidth={sw} strokeLinejoin="round">
        <path d={body(bottom)} fill={c}/>
        <path d={`M-32 ${top+3} L0 ${top+29} L32 ${top+3} M0 ${top+29} V${bottom-22}`} fill="none" strokeWidth={4}/>
        <path d={`M20 ${top+39} H43 V${top+56} Q32 ${top+75} 20 ${top+56}Z`} fill={acc} strokeWidth={3}/>
        <path d={`M-42 ${top+42} H-13 V${top+68} H-42Z`} fill="none" strokeWidth={3}/>
        <path d={`M-60 ${bottom-24} H60 V${bottom-9} H-60Z`} fill={INK}/>
        <rect x={-12} y={bottom-26} width={24} height={20} rx={3} fill={acc} strokeWidth={3}/>
      </g>;
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
    case "cardiganskirt": { // an open cardigan to the hips (shirt colour) with flap pockets, a white collared shirt (accent), an A-line skirt to the knee (pants)
      const sk = look.pants ?? "#5b4472";
      const waist = top + 112, hem = bottom + 64, cHem = bottom + 10;
      const panel = (side: number) =>
        `M${side * 54} ${top + 18} Q${side * 54} ${top} ${side * 32} ${top} L${side * 14} ${top} L${side * 22} ${top + 70} L${side * 18} ${cHem} L${side * 58} ${cHem} Q${side * 70} ${cHem} ${side * 70} ${cHem - 12} L${side * 66} ${bottom - 12}Z`;
      return (
        <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
          <path d={`M-56 ${waist} L-84 ${hem - 10} Q-86 ${hem} -72 ${hem} L72 ${hem} Q86 ${hem} 84 ${hem - 10} L56 ${waist}Z`} fill={sk} strokeWidth={sw} />
          <path d={body(waist + 6, 54, 60)} fill={acc} strokeWidth={sw} />
          {[-1, 1].map((side) => (
            <g key={side}>
              <path d={panel(side)} fill={c} strokeWidth={sw} />
              <path d={`M${side * 30} ${cHem - 50} H${side * 60} V${cHem - 26} Q${side * 60} ${cHem - 16} ${side * 50} ${cHem - 16} H${side * 40} Q${side * 30} ${cHem - 16} ${side * 30} ${cHem - 26}Z`} fill={c} strokeWidth={4.5} />
              <path d={`M${side * 28} ${cHem - 52} H${side * 62} V${cHem - 40} Q${side * 45} ${cHem - 34} ${side * 28} ${cHem - 40}Z`} fill={c} strokeWidth={4.5} />
            </g>
          ))}
          {/* the shirt's pointed collar over the neckline */}
          <path d={`M0 ${top + 4} L-30 ${top - 2} L-20 ${top + 26}Z M0 ${top + 4} L30 ${top - 2} L20 ${top + 26}Z`} fill={acc} strokeWidth={4.5} />
        </g>
      );
    }
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
    case "ziphoodie":
      return (
        // Folded hood over a white tee, with either drawstrings or a front zipper.
        <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
          <path d={body(bottom)} fill={c} strokeWidth={sw} />
          <path d={`M-62 ${bottom - 24} Q0 ${bottom - 18} 62 ${bottom - 24}`} fill="none" strokeWidth={4.5} opacity={0.45} />
          {o === "ziphoodie" ? (
            <path d={`M-16 ${bottom - 72} H-32 L-45 ${bottom - 37} Q-43 ${bottom - 30} -35 ${bottom - 30} H-16 M16 ${bottom - 72} H32 L45 ${bottom - 37} Q43 ${bottom - 30} 35 ${bottom - 30} H16`} fill="none" strokeWidth={4.5} />
          ) : (
            <path d={`M-36 ${bottom - 72} H36 L44 ${bottom - 30} H-44Z`} fill={c} strokeWidth={4.5} />
          )}
          <path d={`M-18 ${top + 4} L0 ${top + 34} L18 ${top + 4}Z`} fill="#ffffff" strokeWidth={4.5} />
          <path d={`M-54 ${top + 8} Q-64 ${top - 22} 0 ${top - 18} Q64 ${top - 22} 54 ${top + 8} Q40 ${top + 30} 20 ${top + 4} L0 ${top + 40} L-20 ${top + 4} Q-40 ${top + 30} -54 ${top + 8}Z`} fill={c} strokeWidth={6} />
          {o === "ziphoodie" ? (
            <g>
              <path d={`M0 ${top + 40} V${bottom - 22}`} fill="none" strokeWidth={11} />
              <path d={`M0 ${top + 40} V${bottom - 22}`} fill="none" stroke={look.accent ?? "#f6e7c8"} strokeWidth={4} />
              <rect x={-8} y={top + 36} width={16} height={24} rx={4} fill={look.accent ?? "#f6e7c8"} strokeWidth={4} />
            </g>
          ) : [-1, 1].map((s) => {
            const d = `M${s * 13} ${top + 22} Q${s * 17} ${top + 46} ${s * 14} ${top + 66}`;
            return (
              <g key={s}>
                <path d={d} fill="none" strokeWidth={4} />
                <rect x={s * 14 - 5} y={top + 64} width={10} height={14} rx={3} fill="#ffffff" strokeWidth={3.5} />
              </g>
            );
          })}
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
    case "belted": // short safari tunic with a belt and a square buckle
      return (
        <g>
          <path d={body(bottom + 26, 54, 72)} fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <rect x={-66} y={bottom - 44} width={132} height={20} rx={4} fill="#8a5a35" stroke={INK} strokeWidth={5} />
          <rect x={-15} y={bottom - 48} width={30} height={28} rx={4} fill="none" stroke={INK} strokeWidth={6} />
          <path d={`M-30 ${bottom + 2} v20 M30 ${bottom + 2} v20`} stroke={INK} strokeWidth={4} opacity={0.35} strokeLinecap="round" />
        </g>
      );
    case "frilldress": { // dress with a white scalloped hem
      const hemY = bottom + 30;
      const n = 8;
      const w = 94;
      const scallops = Array.from({ length: n }, (_, i) => {
        const x0 = -w + (2 * w * i) / n, x1 = -w + (2 * w * (i + 1)) / n;
        return `Q${(x0 + x1) / 2} ${hemY + 46} ${x1} ${hemY + 22}`;
      }).join(" ");
      return (
        <g>
          <path d={`M${-w + 4} ${hemY - 6} L${-w} ${hemY + 22} ${scallops} L${w - 4} ${hemY - 6}Z`} fill="#ffffff" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
          <path d={body(hemY + 6, 50, 90)} fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        </g>
      );
    }
    case "chefcoat": { // a white double-breasted jacket: two rows of buttons, a stand collar and a knotted neckerchief (accent)
      const hem = bottom + 16;
      return (
        <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
          <path d={body(hem, 56, 66)} fill="#ffffff" strokeWidth={sw} />
          <path d={`M-8 ${top + 34} Q-20 ${top + 80} -16 ${hem}`} fill="none" strokeWidth={4.5} opacity={0.6} />
          {[0, 1, 2, 3].flatMap((i) => [-38, 14].map((x) => <circle key={`${i}${x}`} cx={x} cy={top + 58 + i * 27} r={6.5} fill="#cfd4dc" strokeWidth={3.5} />))}
          <path d={`M-32 ${top + 2} Q0 ${top + 20} 32 ${top + 2} L30 ${top + 18} Q0 ${top + 36} -30 ${top + 18}Z`} fill="#ffffff" strokeWidth={4.5} />
          <g fill={acc} strokeWidth={4.5}>
            <path d={`M-4 ${top + 26} L-28 ${top + 44} L-8 ${top + 50}Z M4 ${top + 26} L28 ${top + 44} L8 ${top + 50}Z`} />
            <circle cx={0} cy={top + 27} r={8.5} />
          </g>
        </g>
      );
    }
    case "hoodieskirt": { // a roomy hoodie (shirt colour) with white drawstrings over a white tee hem, and a short pleated skirt (pants colour) with a light stripe
      const sk = look.pants ?? "#2b2430";
      const waist = top + 112, hem = bottom + 36;
      return (
        <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
          <path d={`M-58 ${waist} L-90 ${hem - 10} Q-92 ${hem} -78 ${hem} L78 ${hem} Q92 ${hem} 90 ${hem - 10} L58 ${waist}Z`} fill={sk} strokeWidth={sw} />
          <path d={`M-48 ${waist + 8} L-60 ${hem - 4} M-24 ${waist + 8} L-30 ${hem - 2} M0 ${waist + 8} V${hem - 2} M24 ${waist + 8} L30 ${hem - 2} M48 ${waist + 8} L60 ${hem - 4}`} fill="none" stroke="#ffffff" strokeWidth={3.5} opacity={0.18} />
          <path d={`M-84 ${hem - 15} Q0 ${hem - 9} 84 ${hem - 15}`} fill="none" stroke="#e6e2ea" strokeWidth={6} />
          <path d={`M-58 ${waist - 14} H58 V${waist + 4} H-58Z`} fill="#ffffff" strokeWidth={5} />
          <path d={body(waist - 10, 56, 64)} fill={c} strokeWidth={sw} />
          <path d={`M-62 ${waist - 30} Q0 ${waist - 24} 62 ${waist - 30}`} fill="none" strokeWidth={4} opacity={0.35} />
          <path d={`M-32 ${waist - 70} H32 L38 ${waist - 36} H-38Z`} fill="none" strokeWidth={4} opacity={0.6} />
          <path d={`M-52 ${top + 6} Q-62 ${top - 22} 0 ${top - 18} Q62 ${top - 22} 52 ${top + 6} Q0 ${top + 40} -52 ${top + 6}Z`} fill={c} strokeWidth={6} />
          <path d={`M-22 ${top + 4} Q0 ${top + 18} 22 ${top + 4}`} fill="none" strokeWidth={4.5} />
          {[-1, 1].map((s) => {
            const d = `M${s * 13} ${top + 16} Q${s * 16} ${top + 44} ${s * 12} ${top + 74}`;
            return (
              <g key={s} fill="none">
                <path d={d} strokeWidth={10} />
                <path d={d} stroke="#ffffff" strokeWidth={4.5} />
              </g>
            );
          })}
        </g>
      );
    }
    case "sailor": { // school uniform: white blouse, sailor collar with a white stripe, a ribbon, a pleated skirt (collar and skirt take the shirt colour)
      const waist = top + 98, hem = bottom + 40;
      return (
        <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
          <path d={body(waist + 12, 54, 58)} fill="#ffffff" strokeWidth={sw} />
          <path d={`M-58 ${waist} L-90 ${hem - 10} Q-92 ${hem} -78 ${hem} L78 ${hem} Q92 ${hem} 90 ${hem - 10} L58 ${waist}Z`} fill={c} strokeWidth={sw} />
          <path d={`M-50 ${waist + 12} L-62 ${hem - 4} M-24 ${waist + 12} L-30 ${hem - 2} M0 ${waist + 12} V${hem - 2} M24 ${waist + 12} L30 ${hem - 2} M50 ${waist + 12} L62 ${hem - 4}`} fill="none" strokeWidth={4} opacity={0.35} />
          <path d={`M-58 ${waist} H58 V${waist + 12} H-58Z`} fill={c} strokeWidth={5} />
          <path d={`M-52 ${top + 4} Q-56 ${top + 30} -40 ${top + 44} L-6 ${top + 78} L0 ${top + 66} L6 ${top + 78} L40 ${top + 44} Q56 ${top + 30} 52 ${top + 4} Q0 ${top + 30} -52 ${top + 4}Z`} fill={c} strokeWidth={5.5} />
          <path d={`M-44 ${top + 24} Q-42 ${top + 34} -34 ${top + 40} L-8 ${top + 66} M44 ${top + 24} Q42 ${top + 34} 34 ${top + 40} L8 ${top + 66}`} fill="none" stroke="#ffffff" strokeWidth={4} />
          <g fill={acc} strokeWidth={4.5}>
            <path d={`M0 ${top + 76} L-26 ${top + 64} L-24 ${top + 92}Z M0 ${top + 76} L26 ${top + 64} L24 ${top + 92}Z`} />
            <path d={`M-6 ${top + 80} L-12 ${top + 112} L0 ${top + 104} L12 ${top + 112} L6 ${top + 80}Z`} />
            <circle cx={0} cy={top + 77} r={8} />
          </g>
        </g>
      );
    }
    case "dungarees": { // tee (shirt colour) under short dungarees (pants colour): straps, buttons, a heart pocket
      const dc = look.pants ?? "#7cc4ad";
      const waist = top + 92, hem = bottom + 38, bib = top + 44;
      return (
        <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
          <path d={body(waist + 12, 54, 56)} fill={c} strokeWidth={sw} />
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${s * 42} ${top + 3} L${s * 30} ${bib + 8}`} strokeWidth={24} fill="none" />
              <path d={`M${s * 42} ${top + 3} L${s * 30} ${bib + 8}`} stroke={dc} strokeWidth={13} fill="none" />
            </g>
          ))}
          <path d={`M-58 ${waist} L-72 ${hem - 8} Q-73 ${hem} -64 ${hem} L-12 ${hem} L0 ${hem - 24} L12 ${hem} L64 ${hem} Q73 ${hem} 72 ${hem - 8} L58 ${waist}Z`} fill={dc} strokeWidth={sw} />
          <path d={`M-40 ${bib + 10} Q-40 ${bib} -30 ${bib} L30 ${bib} Q40 ${bib} 40 ${bib + 10} L40 ${waist + 4} L-40 ${waist + 4}Z`} fill={dc} strokeWidth={sw} />
          <path d={`M-58 ${waist + 4} H-40 M40 ${waist + 4} H58`} strokeWidth={5} fill="none" />
          <path d={`M-69 ${hem - 14} H-9 M9 ${hem - 14} H69`} strokeWidth={4} fill="none" opacity={0.45} />
          <circle cx={-28} cy={bib + 12} r={7} fill="#ffffff" strokeWidth={3.5} />
          <circle cx={28} cy={bib + 12} r={7} fill="#ffffff" strokeWidth={3.5} />
          <path d={`M-22 ${bib + 26} H22 V${bib + 50} Q22 ${bib + 62} 0 ${bib + 64} Q-22 ${bib + 62} -22 ${bib + 50}Z`} fill={dc} strokeWidth={4.5} />
          <path transform={`translate(0 ${bib + 46}) scale(.19)`} d="M0 45 C-90 -10 -35 -70 0 -30 C35 -70 90 -10 0 45Z" fill={acc} strokeWidth={16} />
        </g>
      );
    }
    case "pinafore": { // white tee with a round collar under a bib dress: straps, two buttons, a star, a flared skirt
      const waist = top + 94, hem = bottom + 40, bib = top + 46;
      return (
        <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
          <path d={body(waist + 12, 54, 56)} fill="#ffffff" strokeWidth={sw} />
          <path d={`M-3 ${top + 12} Q-30 ${top + 6} -36 ${top + 24} Q-22 ${top + 42} -3 ${top + 26}Z M3 ${top + 12} Q30 ${top + 6} 36 ${top + 24} Q22 ${top + 42} 3 ${top + 26}Z`} fill="#ffffff" strokeWidth={4.5} />
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${s * 42} ${top + 3} L${s * 30} ${bib + 8}`} strokeWidth={24} fill="none" />
              <path d={`M${s * 42} ${top + 3} L${s * 30} ${bib + 8}`} stroke={c} strokeWidth={13} fill="none" />
            </g>
          ))}
          <path d={`M-56 ${waist} L-92 ${hem - 12} Q-94 ${hem} -80 ${hem} L80 ${hem} Q94 ${hem} 92 ${hem - 12} L56 ${waist}Z`} fill={c} strokeWidth={sw} />
          <path d={`M-40 ${bib + 10} Q-40 ${bib} -30 ${bib} L30 ${bib} Q40 ${bib} 40 ${bib + 10} L40 ${waist + 4} L-40 ${waist + 4}Z`} fill={c} strokeWidth={sw} />
          <path d={`M-58 ${waist + 4} H58`} strokeWidth={5} fill="none" />
          <path d={`M-74 ${hem - 22} Q0 ${hem - 12} 74 ${hem - 22}`} stroke="#ffffff" strokeWidth={7} fill="none" opacity={0.9} />
          <circle cx={-28} cy={bib + 13} r={7} fill={acc} strokeWidth={3.5} />
          <circle cx={28} cy={bib + 13} r={7} fill={acc} strokeWidth={3.5} />
          <path transform={`translate(0 ${bib + 30}) scale(.27)`} d="M0 -55 L17 -17 L59 -17 L25 9 L38 50 L0 25 L-38 50 L-25 9 L-59 -17 L-17 -17Z" fill="#ffffff" strokeWidth={12} />
        </g>
      );
    }
    case "sweatervest": // white collared shirt under a V-neck sweater vest with argyle diamonds
      return (
        <g>
          <path d={body(bottom)} fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M-28 ${top + 1} L0 ${top + 58} L28 ${top + 1}Z`} fill="#ffffff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M-30 ${top - 1} L-4 ${top + 18} L-26 ${top + 30}Z M30 ${top - 1} L4 ${top + 18} L26 ${top + 30}Z`} fill="#ffffff" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          <g fill={acc} stroke={INK} strokeWidth={3}>
            {[[-26, top + 98], [26, top + 98], [0, top + 132]].map(([x, y], i) => (
              <path key={i} d={`M${x} ${y - 22} L${x + 13} ${y} L${x} ${y + 22} L${x - 13} ${y}Z`} />
            ))}
          </g>
          <path d={`M-62 ${bottom - 16} Q0 ${bottom - 10} 62 ${bottom - 16}`} stroke={INK} strokeWidth={4} fill="none" opacity={0.5} />
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

/** Extras drawn behind the body (a backpack) or over it (straps, a necklace). */
const ExtrasBack: React.FC<{ look: Look; top: number }> = ({ look, top }) =>
  look.extras?.includes("backpack") ? (
    <g stroke={INK} strokeWidth={6} strokeLinejoin="round">
      <rect x={-96} y={top + 22} width={150} height={150} rx={30} fill="#9a6337" />
      <path d={`M-96 ${top + 70} Q-120 ${top + 110} -100 ${top + 150}`} fill="#8a5530" />
    </g>
  ) : null;

const ExtrasFront: React.FC<{ look: Look; top: number }> = ({ look, top }) => (
  <g>
    {look.extras?.includes("backpack") && (
      <g fill="none" strokeLinecap="round">
        {[-1, 1].map((s) => (
          <g key={s}>
            <path d={`M${s * 40} ${top + 4} Q${s * 46} ${top + 60} ${s * 38} ${top + 118}`} stroke={INK} strokeWidth={20} />
            <path d={`M${s * 40} ${top + 4} Q${s * 46} ${top + 60} ${s * 38} ${top + 118}`} stroke="#9a6337" strokeWidth={10} />
          </g>
        ))}
      </g>
    )}
    {look.extras?.includes("flower_necklace") && (
      <g>
        <path d={`M-30 ${top + 2} Q0 ${top + 70} 30 ${top + 2}`} stroke={INK} strokeWidth={3.5} fill="none" />
        <g transform={`translate(0 ${top + 52})`} stroke={INK} strokeWidth={3.5}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.sin((a * Math.PI) / 180) * 13} cy={-Math.cos((a * Math.PI) / 180) * 13} r={10} fill="#ffffff" />
          ))}
          <circle r={8} fill="#ffd23f" />
        </g>
      </g>
    )}
  </g>
);

/* ---------------- hair & hats (head centred at 0,0, r=100) ---------------- */
/**
 * Hair that hangs down the back. It is drawn before the body, so shoulders, arms and hands are in
 * front of it and never look tangled in it. Only "long" uses it: straight hair to the middle of the
 * back, a little wider than the shoulders, with a softly scalloped end.
 */
const HairBehind: React.FC<{ look: Look }> = ({ look }) => (
  <path d="M-106 -10 Q-116 56 -98 118 Q-92 150 -86 170 Q-62 186 -42 170 Q-20 186 0 172 Q20 186 42 170 Q62 186 86 170 Q92 150 98 118 Q116 56 106 -10 Q100 -110 0 -112 Q-100 -110 -106 -10Z" fill={look.hairColor ?? INK} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
);
const HairBack: React.FC<{ look: Look; t?: number }> = ({ look, t = 0 }) => {
  const hc = look.hairColor ?? INK;
  const sw = 7;
  const clipId = "hb" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  switch (look.hair) {
    case "bobponytail": { // a bob to the shoulders, ends flicking out on one side, and a high ponytail on the other side that sways
      const tail = "M46 -104 Q100 -190 158 -132 Q198 -84 172 -24 Q152 20 176 58 Q196 92 160 110 Q138 118 128 98 Q150 92 148 72 Q124 34 136 -6 Q150 -50 116 -76 Q92 -92 60 -84Z";
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-110 -6 Q-126 52 -118 100 Q-112 124 -86 120 Q-70 116 -64 104 L64 104 Q80 124 108 128 Q132 128 126 108 Q116 96 118 70 Q124 30 110 -6 Q100 -112 0 -114 Q-100 -112 -110 -6Z" fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M-100 60 Q-108 88 -100 108 M96 64 Q102 92 116 110" fill="none" stroke={INK} strokeWidth={4} opacity={0.3} />
          <g transform={`rotate(${Math.sin(t * 2.1) * 3} 52 -98)`}>
            <path d={tail} fill={hc} stroke={INK} strokeWidth={sw} />
            <path d="M134 -116 Q170 -76 152 -26 M150 34 Q160 62 152 88" fill="none" stroke={INK} strokeWidth={4} opacity={0.3} />
            <path d="M100 -150 Q132 -146 154 -118" fill="none" stroke={tint(hc, 0.4)} strokeWidth={8} />
          </g>
        </g>
      );
    }
    case "curlypuff": { // a cloud of curls around the head, with one curl flicking out at the lower left
      const flick = "M-100 78 Q-132 82 -130 102 Q-126 118 -110 110";
      return (
        <g>
          <g fill="none" strokeLinecap="round">
            <path d={flick} stroke={INK} strokeWidth={26} />
            <path d={flick} stroke={hc} strokeWidth={13} />
          </g>
          {cloud([[-50, -94, 40], [2, -106, 36], [-92, -44, 40], [-108, 8, 38], [-98, 54, 34], [60, -96, 36], [100, -8, 32], [100, 38, 28]], hc)}
          {spiral(-118, 10, 1.1, -20)}
        </g>
      );
    }
    case "starbuns": { // two big round buns that jiggle, and a fluffy bob whose ends flick outwards
      const shine = tint(hc, 0.4);
      const back = "M0 -114 Q-102 -114 -110 -20 Q-128 34 -118 74 Q-150 82 -162 112 Q-124 130 -98 106 Q-86 126 -62 108 Q-56 90 -36 88 L36 88 Q56 90 62 108 Q86 126 98 106 Q124 130 162 112 Q150 82 118 74 Q128 34 110 -20 Q102 -114 0 -114Z";
      const bun = (s: 1 | -1) => {
        const j = Math.sin(t * 2.3 + (s > 0 ? 0 : 1.7));
        return (
          <g key={s} transform={`translate(${s * 90} ${-102 + j * 1.5}) rotate(${j * 3}) scale(${s} 1)`}>
            <circle r={47} fill={hc} stroke={INK} strokeWidth={sw} />
            <path d="M-18 10 Q-26 -20 2 -23 Q25 -21 21 2 Q17 17 1 13 Q-9 9 -5 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.4} />
            <path d="M10 -35 Q28 -30 34 -12" fill="none" stroke={shine} strokeWidth={7} strokeLinecap="round" />
          </g>
        );
      };
      return (
        <g>
          {bun(-1)}
          {bun(1)}
          <path d={back} fill={hc} />
          {look.hairTips && (
            <g>
              <defs><clipPath id={clipId}><path d="M-200 92 Q-150 82 -112 100 L-60 100 L-60 150 L-200 150Z M200 92 Q150 82 112 100 L60 100 L60 150 L200 150Z" /></clipPath></defs>
              <path d={back} fill={look.hairTips} clipPath={`url(#${clipId})`} />
            </g>
          )}
          <path d={back} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        </g>
      );
    }
    case "long": // drawn by HairBehind, behind the shoulders, so the arms and hands stay clear of it
      return null;
    case "highponytail": { // one high, wavy ponytail to the side that sways from its root
      const tail = "M-36 -104 Q-92 -196 -152 -138 Q-200 -84 -168 -22 Q-146 22 -170 62 Q-190 100 -150 122 Q-124 132 -112 108 Q-136 108 -138 86 Q-112 42 -128 -4 Q-146 -52 -112 -78 Q-88 -94 -58 -84Z";
      return (
        <g transform={`rotate(${Math.sin(t * 2.1) * 3} -46 -98)`} strokeLinejoin="round" strokeLinecap="round">
          <path d={tail} fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M-130 -116 Q-168 -76 -150 -26 M-148 34 Q-158 62 -150 88" fill="none" stroke={INK} strokeWidth={4} opacity={0.3} />
          <path d="M-96 -150 Q-128 -146 -150 -118" fill="none" stroke={tint(hc, 0.4)} strokeWidth={8} />
        </g>
      );
    }
    case "sidebob":
    case "schoolbob": // a neat straight bob to the jaw, ends turned in
      return <path d="M-108 -10 Q-124 48 -114 90 Q-98 112 -74 100 L-58 90 L58 90 L74 100 Q98 112 114 90 Q124 48 108 -10 Q100 -112 0 -114 Q-100 -112 -108 -10Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "shaggy": { // a messy mop of big curved locks, all swept the same way, with a crown lock that sways
      const sway = Math.sin(t * 2.4) * 2.5;
      return (
        <g fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <path transform={`rotate(${sway} 0 -110)`} d="M-10 -112 Q0 -160 46 -166 Q28 -146 36 -120Z" />
          <path d="M-104 24 Q-122 -4 -116 -34 Q-134 -52 -130 -78 Q-112 -66 -100 -74 Q-108 -108 -86 -128 Q-78 -108 -60 -106 Q-52 -140 -14 -150 Q-20 -128 -4 -118 Q26 -146 70 -136 Q46 -124 50 -106 Q92 -110 120 -84 Q94 -80 96 -62 Q118 -50 124 -26 Q106 -28 100 -16 Q100 -72 0 -78 Q-104 -72 -104 24Z" />
        </g>
      );
    }
    case "wavy":
      return <path d="M-106 -10 Q-122 50 -100 80 Q-80 100 -60 84 L60 84 Q80 100 100 80 Q122 50 106 -10 Q100 -110 0 -112 Q-100 -110 -106 -10Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "ponytail":
      return <path d="M60 -80 Q150 -60 130 40 Q120 80 96 60 Q120 0 80 -40Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "flowing": { // long wavy hair to the waist: two curtains that fall over the shoulders and curl out at the tips
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M0 -114 Q-100 -112 -106 -20 Q-128 28 -114 70 Q-100 106 -124 138 Q-144 168 -130 196 Q-124 210 -150 206 Q-128 240 -92 214 Q-64 190 -72 152 Q-80 118 -58 96 L-40 88 L40 88 L58 96 Q80 118 72 150 Q64 186 90 208 Q124 232 144 198 Q120 204 126 188 Q140 162 122 134 Q100 104 114 70 Q128 28 106 -20 Q100 -112 0 -114Z" fill={hc} stroke={INK} strokeWidth={sw} />
          {/* a few strands, so the long shape reads as hair */}
          <path d="M-104 84 Q-92 118 -108 150 Q-118 174 -108 198 M-84 112 Q-92 146 -84 178 M104 86 Q92 118 106 148 Q116 170 108 190 M86 114 Q92 146 86 174" fill="none" stroke={INK} strokeWidth={4} opacity={0.3} />
        </g>
      );
    }
    case "sideponytail": { // two big ponytails high on the head, curling down to the shoulders (symmetrical)
      const tail = "M-50 -92 Q-110 -150 -158 -100 Q-198 -40 -166 34 Q-148 86 -104 112 Q-138 50 -130 -10 Q-126 -46 -84 -58Z"; // inner edge: one smooth curve
      return (
        <g fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <path d={tail} />
          <path d={tail} transform="scale(-1 1)" />
        </g>
      );
    }
    case "curlytop": { // curls on top and at the temples, ears free
      const blobs = [[-90, -36], [-74, -80], [-34, -108], [14, -114], [58, -98], [90, -58], [98, -16]];
      return (
        <g fill={hc} stroke={INK} strokeWidth={sw}>
          {blobs.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={34} />)}
        </g>
      );
    }
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

const HairFront: React.FC<{ look: Look; t?: number; bounce?: number }> = ({ look, t = 0, bounce = 0 }) => {
  const hc = look.hairColor ?? INK;
  const sw = 7;
  const cap = (fringe = -40) => `M-100 -8 Q-104 -108 0 -110 Q104 -108 100 -8 Q70 ${fringe - 10} 20 ${fringe} Q-50 ${fringe - 6} -100 -8Z`;
  switch (look.hair) {
    case "bobponytail": { // a fringe swept from a side part across the forehead to a pointed lock, a lock by each cheek, a big bow on the ponytail
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-106 30 Q-112 -112 0 -114 Q110 -112 106 10 Q104 42 96 64 Q86 32 86 -8 Q84 -40 70 -56 Q56 -70 40 -64 Q12 -54 -18 -48 L-34 -22 Q-40 -46 -60 -42 Q-80 -32 -88 -8 Q-90 30 -96 62 Q-104 48 -106 30Z" fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M44 -104 Q20 -74 -26 -38" fill="none" stroke={INK} strokeWidth={4} opacity={0.3} />
          <path d="M-74 -78 Q-50 -98 -16 -102 M34 -102 Q54 -98 70 -86" fill="none" stroke={tint(hc, 0.4)} strokeWidth={8} />
          <g stroke={INK} strokeWidth={6} fill={look.hatColor ?? "#f7d354"} transform="translate(56 -110) rotate(28) scale(.8)">
            <path d="M0 0 L-58 -34 Q-74 0 -58 34Z" />
            <path d="M0 0 L58 -34 Q74 0 58 34Z" />
            <rect x={-14} y={-16} width={28} height={32} rx={9} />
          </g>
        </g>
      );
    }
    case "curlypuff": { // curly fringe, a big curly puff high on one side that wobbles, and a bow at its base
      const j = Math.sin(t * 2.2) * 2.5 + bounce * Math.sin(t * 9) * 2;
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-100 8 Q-108 -112 0 -114 Q108 -112 102 -6 Q100 -40 82 -60 Q64 -52 48 -74 Q28 -54 0 -70 Q-24 -50 -52 -62 Q-68 -42 -88 -44 Q-100 -22 -100 8Z" fill={hc} stroke={INK} strokeWidth={sw} />
          {spiral(-52, -86, 1, 10)}
          {spiral(4, -93, 0.75, 200)}
          <g transform={`translate(90 -110) rotate(${j}) scale(.9)`}>
            {cloud([[0, 0, 46], [-36, -18, 30], [-14, -48, 30], [26, -46, 32], [52, -14, 32], [46, 28, 30], [8, 40, 28], [-30, 22, 26]], hc)}
            {spiral(-14, -24, 1.25, 0)}
            {spiral(34, -18, 1.1, 150)}
            {spiral(14, 26, 1, 60)}
          </g>
          <g stroke={INK} strokeWidth={5.5} fill={look.hatColor ?? "#ff6b5e"} transform="translate(50 -82) rotate(24) scale(.5)">
            <path d="M0 0 L-58 -34 Q-74 0 -58 34Z" />
            <path d="M0 0 L58 -34 Q74 0 58 34Z" />
            <rect x={-14} y={-16} width={28} height={32} rx={9} />
          </g>
        </g>
      );
    }
    case "highponytail": { // a fringe of pointed strands, a lock by each ear, and a big bow where the ponytail starts
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-104 12 Q-110 -112 0 -114 Q110 -112 104 4 Q102 28 92 44 Q84 14 82 -18 Q72 -44 52 -52 L42 -28 Q22 -56 -4 -58 L-12 -32 Q-34 -56 -58 -50 L-68 -24 Q-84 -40 -92 -16 Q-90 16 -96 42 Q-104 30 -104 12Z" fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M-70 -72 Q-40 -98 6 -98" fill="none" stroke={tint(hc, 0.4)} strokeWidth={8} />
          {look.hairClip === "cherry" ? (
            // a pair of cherries on one stem with a leaf, where the ponytail starts
            <g stroke={INK} strokeWidth={5} transform="translate(-50 -104) rotate(-12)">
              <path d="M-16 6 Q-10 -22 4 -32 M16 8 Q12 -18 4 -32" fill="none" strokeWidth={4.5} />
              <path d="M4 -32 Q16 -50 36 -44 Q26 -26 4 -32Z" fill="#6a9a3a" strokeWidth={4} />
              <circle cx={-18} cy={18} r={17} fill={look.hatColor ?? "#e0263c"} />
              <circle cx={18} cy={20} r={17} fill={look.hatColor ?? "#e0263c"} />
              <path d="M-26 12 Q-24 6 -18 5 M10 14 Q12 8 18 7" fill="none" stroke="#ffffff" strokeWidth={4} opacity={0.85} />
            </g>
          ) : (
            <g stroke={INK} strokeWidth={6} fill={look.hatColor ?? "#ffd93b"} transform="translate(-52 -106) rotate(-24) scale(.82)">
              <path d="M0 0 L-58 -34 Q-74 0 -58 34Z" />
              <path d="M0 0 L58 -34 Q74 0 58 34Z" />
              <rect x={-14} y={-16} width={28} height={32} rx={9} />
            </g>
          )}
        </g>
      );
    }
    case "sidebob":
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-110 82 Q-122 4 -108 -42 Q-92 -115 0 -114 Q88 -114 105 -54 Q121 -12 112 82 Q91 99 73 96 Q90 57 86 13 L83 -54 Q29 -58 -59 -72 Q-90 -45 -94 -8 Q-99 43 -74 96 Q-95 98 -110 82Z" fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M-43 -91 Q-5 -100 39 -87" fill="none" stroke={tint(hc, 0.25)} strokeWidth={7} />
          <rect x={59} y={-74} width={32} height={14} rx={7} transform="rotate(-28 75 -67)" fill={look.hatColor ?? "#a4d7b7"} stroke={INK} strokeWidth={5} />
        </g>
      );
    case "schoolbob": { // a straight fringe cut just above the eyes, a long lock in front of each ear, a small clip
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-106 18 Q-112 -112 0 -114 Q112 -112 106 18 Q100 46 94 62 Q84 32 84 -6 L84 -42 Q42 -50 0 -50 Q-42 -50 -84 -42 L-84 -6 Q-84 32 -94 62 Q-100 46 -106 18Z" fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M-34 -50 L-30 -40 M22 -50 L26 -40" fill="none" stroke={INK} strokeWidth={4} opacity={0.4} />
          <path d="M-74 -72 Q-44 -96 -4 -98" fill="none" stroke={tint(hc, 0.32)} strokeWidth={8} />
          <path d="M56 -70 L84 -60" fill="none" stroke={INK} strokeWidth={13} />
          <path d="M56 -70 L84 -60" fill="none" stroke={look.hatColor ?? look.accent ?? "#e0445a"} strokeWidth={6} />
        </g>
      );
    }
    case "starbuns": { // swept fringe in three chunky locks, side locks, a springy curl on the parting, a star clip
      const shine = tint(hc, 0.4);
      const curl = "M2 -102 C-10 -150 36 -172 48 -143 C55 -124 33 -115 28 -131";
      const spring = Math.sin(t * 2.6) * 6 + bounce * Math.sin(t * 9) * 7;
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <g transform={`rotate(${spring} 2 -102)`} fill="none">
            <path d={curl} stroke={INK} strokeWidth={19} />
            <path d={curl} stroke={hc} strokeWidth={8} />
          </g>
          <path d="M-96 62 Q-118 40 -106 -10 Q-108 -112 0 -114 Q108 -112 106 -10 Q118 40 96 62 Q82 32 84 -4 Q80 -40 58 -58 Q52 -74 40 -82 Q32 -42 -10 -44 Q-14 -54 -22 -62 Q-26 -40 -54 -38 Q-56 -48 -62 -56 Q-66 -32 -82 -26 Q-86 -14 -84 -4 Q-82 32 -96 62Z" fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M-78 -66 Q-52 -96 -8 -98" fill="none" stroke={shine} strokeWidth={8} />
          <path d="M8 -97 L16 -96" fill="none" stroke={shine} strokeWidth={8} />
          <path transform="translate(76 -62) rotate(14) scale(.42)" d="M0 -55 L17 -17 L59 -17 L25 9 L38 50 L0 25 L-38 50 L-25 9 L-59 -17 L-17 -17Z" fill={look.hatColor ?? "#ffd23f"} stroke={INK} strokeWidth={11} />
        </g>
      );
    }
    case "shaggy": { // one big fringe swept across the forehead, its long lock ending beside the eye, ears free
      const shine = tint(hc, 0.35);
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-102 16 Q-112 -112 0 -116 Q106 -112 102 -10 Q98 -40 82 -54 Q78 -36 70 -30 Q66 -50 52 -62 Q42 -44 26 -40 Q26 -58 14 -66 Q0 -46 -22 -40 Q-18 -56 -26 -66 Q-46 -50 -66 -44 Q-74 -30 -86 -14 Q-88 -36 -94 -42 Q-100 -22 -102 16Z" fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M40 -96 Q0 -82 -40 -64 M72 -92 Q44 -80 14 -72 M-24 -102 Q-58 -86 -76 -50" fill="none" stroke={INK} strokeWidth={4} opacity={0.3} />
          <path d="M-60 -92 Q-20 -108 30 -102" fill="none" stroke={shine} strokeWidth={8} />
        </g>
      );
    }
    case "quiff": // cropped temples and a lifted, two-lock forelock; open forehead
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-101 8 L-102 -40 Q-100 -84 -72 -101 Q-84 -124 -76 -143 Q-50 -125 -22 -127 Q-30 -146 -20 -157 Q8 -135 38 -132 Q80 -128 94 -92 Q106 -65 101 8 L86 -4 L82 -53 Q64 -72 48 -83 Q18 -65 -12 -72 Q-44 -79 -76 -55 L-85 -5Z" fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M-62 -104 Q-22 -91 18 -104 Q36 -110 48 -112" fill="none" stroke={INK} strokeWidth={4} />
          <path d="M-54 -121 Q-22 -110 6 -117" fill="none" stroke={tint(hc, 0.35)} strokeWidth={7} />
        </g>
      );
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
    case "flowing": { // a long fringe swept across the forehead to one cheek, and a lock in front of the other ear
      const shine = tint(hc, 0.4);
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-106 26 Q-112 -112 0 -114 Q108 -112 104 -8 Q106 22 94 42 Q84 16 84 -18 Q80 -40 66 -50 Q36 -60 6 -48 Q-36 -36 -66 -8 Q-84 10 -92 40 Q-104 38 -106 26Z" fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M40 -56 Q0 -50 -34 -28 M-52 -34 Q-74 -14 -84 10" fill="none" stroke={INK} strokeWidth={4} opacity={0.3} />
          <path d="M-84 -52 Q-58 -84 -14 -92" fill="none" stroke={shine} strokeWidth={8} />
        </g>
      );
    }
    case "sideponytail": // fringe
      return <path d={cap(-46)} fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
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
    case "curlytop":
      return (
        <g fill={hc} stroke={INK} strokeWidth={sw}>
          {[[-66, -78], [-26, -96], [16, -100], [56, -86], [-84, -48]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={28} />)}
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
    case "beanie": return <g stroke={INK} strokeWidth={7}><path d="M-96 -65 Q-103 -155 0 -155 Q103 -155 96 -65Z" fill={c}/><rect x={-101} y={-82} width={202} height={29} rx={12} fill={c}/></g>;
    case "straw": return <g stroke={INK} strokeWidth={7}><path d="M-76 -78 L-50 -150 H50 L76 -78Z" fill={c}/><path d="M-66 -103 H66" strokeWidth={14} stroke="#805638"/><ellipse cy={-76} rx={136} ry={22} fill={c}/></g>;
    case "police_cap":
      return <g stroke={INK} strokeWidth={sw} strokeLinejoin="round">
        <path d="M-93 -47 L-110 -92 Q0 -141 110 -92 L93 -47Z" fill={c}/>
        <path d="M-94 -49 H94 V-27 H-94Z" fill={INK}/>
        <path d="M-73 -25 Q0 14 73 -25Z" fill={c}/>
        <path d="M-18 -94 H18 V-72 Q0 -48 -18 -72Z" fill={acc} strokeWidth={4}/>
      </g>;
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
    case "turban": // a wound cloth dome with crossing folds, a jewel, and the loose end hanging at one side
      return (
        <g fill={c} stroke={INK} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
          <path d="M94 -80 Q132 -44 116 10 Q98 -6 90 -52Z" />
          <path d="M-110 -54 Q-128 -154 0 -162 Q128 -154 110 -54 Q60 -78 0 -78 Q-60 -78 -110 -54Z" />
          <path d="M-104 -84 Q-30 -150 86 -126 M-108 -62 Q-10 -124 102 -92 M-60 -144 Q6 -120 58 -142" fill="none" strokeWidth={5} opacity={0.75} />
          <circle cx={0} cy={-92} r={12} fill={acc} strokeWidth={4} />
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
    case "chef": // a toque: a puffed top on a pleated band that follows the head
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          {cloud([[-52, -166, 40], [0, -186, 48], [52, -166, 40], [0, -156, 46]], "#ffffff")}
          <path d="M-74 -82 L-78 -152 H78 L74 -82 Q0 -66 -74 -82Z" fill="#ffffff" stroke={INK} strokeWidth={sw} />
          <path d="M-42 -148 V-88 M0 -150 V-80 M42 -148 V-88" fill="none" stroke={INK} strokeWidth={4} opacity={0.3} />
        </g>
      );
    case "safari": // wide-brimmed explorer hat with a band and a little leaf
      return (
        <g stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <ellipse cx={0} cy={-74} rx={156} ry={34} fill={c} />
          <path d="M-86 -82 Q-90 -176 0 -178 Q90 -176 86 -82 Q0 -66 -86 -82Z" fill={c} />
          <path d="M-88 -106 Q0 -90 88 -106 L86 -84 Q0 -68 -88 -84Z" fill="#8a5a35" strokeWidth={5} />
          <path d="M38 -170 Q60 -224 112 -214 Q100 -166 38 -170Z" fill="#8fd14f" strokeWidth={5} />
          <path d="M44 -172 Q70 -190 96 -206" fill="none" strokeWidth={3.5} />
        </g>
      );
    case "bow": // a hair bow on top of the head
      return (
        <g stroke={INK} strokeWidth={6} strokeLinejoin="round" fill={c} transform="translate(0 -116)">
          <path d="M0 0 L-58 -34 Q-74 0 -58 34Z" />
          <path d="M0 0 L58 -34 Q74 0 58 34Z" />
          <rect x={-14} y={-16} width={28} height={32} rx={9} />
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

/**
 * Head coverings that wrap the head. Wrap is the cloth behind the face; WrapFront is the part that
 * lies over the forehead (keffiyeh, pharaoh), drawn like a fringe so the face keeps its full size.
 * A headscarf frames a slightly smaller face and has no front part.
 */
const Wrap: React.FC<{ look: Look }> = ({ look }) => {
  const c = look.hatColor ?? "#5e7ce2";
  const acc = look.accent ?? "#d93a4a";
  const id = "wr" + sid(useId());
  switch (look.hat) {
    case "headscarf":
      return <path d="M-118 0 Q-124 -128 0 -130 Q124 -128 118 0 Q122 110 70 140 L-70 140 Q-122 110 -118 0Z" fill={c} stroke={INK} strokeWidth={7} strokeLinejoin="round" />;
    case "keffiyeh": // a cloth that falls from the crown to the shoulders in soft folds
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-112 -30 Q-118 -126 0 -128 Q118 -126 112 -30 Q124 40 136 98 Q116 122 94 104 Q86 128 62 112 L56 92 L-56 92 L-62 112 Q-86 128 -94 104 Q-116 122 -136 98 Q-124 40 -112 -30Z" fill={c} stroke={INK} strokeWidth={7} />
          <path d="M-106 4 Q-114 54 -118 98 M106 4 Q114 54 118 98 M-86 72 Q-88 94 -82 110 M86 72 Q88 94 82 110" fill="none" stroke={INK} strokeWidth={4} opacity={0.28} />
          <path d="M-128 92 Q-114 108 -98 96 M128 92 Q114 108 98 96" fill="none" stroke={acc} strokeWidth={5} strokeDasharray="5 8" />
        </g>
      );
    case "pharaoh": { // a striped headcloth: wide wings beside the face and two lappets down to the chest
      const hood = "M-104 -40 Q-112 -132 0 -134 Q112 -132 104 -40 L148 58 Q126 70 110 62 L114 166 Q90 180 62 168 L58 92 L-58 92 L-62 168 Q-90 180 -114 166 L-110 62 Q-126 70 -148 58Z";
      return (
        <g strokeLinejoin="round">
          <defs><clipPath id={id}><path d={hood} /></clipPath></defs>
          <path d={hood} fill={acc} />
          <g clipPath={`url(#${id})`} stroke={c} strokeWidth={13}>
            {[-112, -84, -56, -28, 0, 28, 56, 84, 112, 140, 168].map((y) => <path key={y} d={`M-160 ${y} H160`} />)}
          </g>
          <path d={hood} fill="none" stroke={INK} strokeWidth={7} />
        </g>
      );
    }
    default:
      return null;
  }
};

const WrapFront: React.FC<{ look: Look }> = ({ look }) => {
  const c = look.hatColor ?? "#5e7ce2";
  const acc = look.accent ?? "#d93a4a";
  const id = "wf" + sid(useId());
  const cap = "M-106 -18 Q-110 -126 0 -128 Q110 -126 106 -18 Q60 -64 0 -66 Q-60 -64 -106 -18Z";
  switch (look.hat) {
    case "keffiyeh": // the cloth over the forehead, a patterned edge, and the black cord that holds it
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d={cap} fill={c} stroke={INK} strokeWidth={7} />
          <path d="M-98 -36 Q-58 -74 0 -76 Q58 -74 98 -36" fill="none" stroke={acc} strokeWidth={5} strokeDasharray="5 8" />
          <path d="M-106 -64 Q0 -114 106 -64" fill="none" stroke={INK} strokeWidth={17} />
          <path d="M-98 -68 Q0 -114 98 -68" fill="none" stroke="#5a5668" strokeWidth={3} />
        </g>
      );
    case "pharaoh": // the striped brow of the headcloth, a gold band and a little cobra
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <defs><clipPath id={id}><path d={cap} /></clipPath></defs>
          <path d={cap} fill={acc} />
          <g clipPath={`url(#${id})`} stroke={c} strokeWidth={13}>
            {[-112, -84].map((y) => <path key={y} d={`M-160 ${y} H160`} />)}
          </g>
          <path d={cap} fill="none" stroke={INK} strokeWidth={7} />
          <path d="M-104 -22 Q-60 -62 0 -64 Q60 -62 104 -22" fill="none" stroke={INK} strokeWidth={17} />
          <path d="M-104 -22 Q-60 -62 0 -64 Q60 -62 104 -22" fill="none" stroke={acc} strokeWidth={8} />
          <path d="M-9 -60 Q-17 -94 0 -104 Q17 -94 9 -60Z" fill={acc} stroke={INK} strokeWidth={4.5} />
          <circle cx={0} cy={-86} r={4} fill={INK} />
        </g>
      );
    default:
      return null;
  }
};

const Facial: React.FC<{ look: Look }> = ({ look }) => {
  const hc = look.hairColor ?? INK;
  const sw = 6;
  switch (look.facial) {
    case "beard":
      return <path d="M-92 10 Q-90 104 0 112 Q90 104 92 10 Q70 56 40 60 Q0 34 -40 60 Q-70 56 -92 10Z" fill={hc} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
    case "longbeard": // full at the jaw, then narrowing to a wavy point on the chest, so the arms and robe stay visible
      return (
        <g strokeLinejoin="round" strokeLinecap="round">
          <path d="M-90 12 Q-94 78 -60 112 Q-38 132 -30 158 Q-22 190 2 198 Q12 176 30 156 Q40 130 60 112 Q94 78 90 12 Q70 54 40 60 Q0 36 -40 60 Q-70 54 -90 12Z" fill={hc} stroke={INK} strokeWidth={sw} />
          <path d="M-44 84 Q-30 112 -22 142 M0 76 Q4 120 -2 166 M44 84 Q32 110 24 138" fill="none" stroke={INK} strokeWidth={4} opacity={0.25} />
        </g>
      );
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
    case "neckerchief": // knotted triangle scarf
      return (
        <g stroke={INK} strokeWidth={5.5} strokeLinejoin="round" fill={acc}>
          <path d={`M-58 ${top - 4} Q0 ${top + 22} 58 ${top - 4} L54 ${top + 16} Q0 ${top + 42} -54 ${top + 16}Z`} />
          <path d={`M-30 ${top + 22} L4 ${top + 86} L34 ${top + 22}Z`} />
          <path d={`M4 ${top + 26} L-18 ${top + 72} L-2 ${top + 70}Z M8 ${top + 26} L30 ${top + 70} L14 ${top + 72}Z`} />
          <circle cx={4} cy={top + 26} r={11} />
        </g>
      );
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

/* ---------------- builds and head shapes ---------------- */
/**
 * Body proportions and height. An older build has a smaller head, a neck, broader shoulders, longer arms
 * and longer legs, and stands taller: scale is the height next to a teen (kids are shorter, adults a little
 * taller). The drawing coordinates are always CHAR_HEIGHT tall; scale is applied on top, like look.height.
 * A look with no build is an adult.
 * head: head scale (radius 100 × head) · headY: head centre · top: shoulders · legTop: hips ·
 * sx: shoulder half-width · up/fore: arm lengths · wide: torso width · neck: a visible neck.
 */
export const BUILDS = {
  kid: { scale: 0.84, head: 1.32, headY: -436, top: -322, legTop: -150, sx: 56, up: 86, fore: 82, wide: 1, neck: false },
  teen: { scale: 1, head: 0.92, headY: -468, top: -360, legTop: -200, sx: 61, up: 94, fore: 88, wide: 1.1, neck: true },
  adult: { scale: 1.06, head: 0.87, headY: -473, top: -372, legTop: -216, sx: 66, up: 98, fore: 92, wide: 1.24, neck: true },
} as const;
export type Build = keyof typeof BUILDS;
/** How tall the character stands, relative to its staged size: look.height × the build's scale. */
export const heightOf = (look?: Look) => (look?.height ?? 1) * (BUILDS[look?.build ?? "adult"] ?? BUILDS.adult).scale;
/** Where the face is, as a fraction of the staged size above the feet (the camera's `on` aims here). */
export const faceAim = (look?: Look) => (({ kid: 0.72, teen: 0.78, adult: 0.8 })[look?.build ?? "adult"] ?? 0.8) * heightOf(look);

/** The outline of the head for a head shape, centred at (0,0) with half-width rx and half-height ry. */
const headPath = (shape: string | undefined, rx: number, ry: number) => {
  if (shape === "square") {
    // soft square: rounder at the top (so the hair still covers it), tighter at the jaw
    const rt = Math.min(rx, ry) * 0.86, rb = Math.min(rx, ry) * 0.66;
    return `M${-rx + rt} ${-ry} H${rx - rt} A${rt} ${rt} 0 0 1 ${rx} ${-ry + rt} V${ry - rb} A${rb} ${rb} 0 0 1 ${rx - rb} ${ry} H${-rx + rb} A${rb} ${rb} 0 0 1 ${-rx} ${ry - rb} V${-ry + rt} A${rt} ${rt} 0 0 1 ${-rx + rt} ${-ry}Z`;
  }
  if (shape === "bean") {
    // a bean: a narrower forehead and front, fuller at the back of the jaw (the face looks towards +x)
    return `M0 ${-ry} C${rx * 0.5} ${-ry} ${rx * 0.86} ${-ry * 0.7} ${rx * 0.88} ${-ry * 0.12} C${rx * 0.9} ${ry * 0.5} ${rx * 0.58} ${ry} ${-rx * 0.04} ${ry} C${-rx * 0.78} ${ry} ${-rx * 1.1} ${ry * 0.56} ${-rx * 1.04} ${-ry * 0.02} C${-rx * 0.98} ${-ry * 0.68} ${-rx * 0.54} ${-ry} 0 ${-ry}Z`;
  }
  // oval: the extra length goes into the forehead (under the hair), so the chin stays close under the mouth
  const cy = shape === "oval" ? -ry * 0.07 : 0;
  return `M${-rx} ${cy} A${rx} ${ry} 0 1 0 ${rx} ${cy} A${rx} ${ry} 0 1 0 ${-rx} ${cy}Z`;
};

/* ---------------- the character ---------------- */
export const Character: React.FC<CharacterProps> = (p) => {
  const look = p.look;
  const t = p.t;
  const facing = p.motion ? (p.motion[7] < 0 ? -1 : 1) : p.facing === "left" ? -1 : 1;
  const hs = heightOf(look);
  const poseName = p.walking ? (p.pose === "run" ? "run" : "walk") : p.pose ?? (p.talking ? "talk" : "idle");
  const to = POSES[poseName] ?? POSES.idle;
  const from = POSES[p.fromPose ?? poseName] ?? to;
  const k = p.poseT ?? 1;
  const mix = (a: ArmSpec, b: ArmSpec): ArmSpec => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  // arms swing against the legs while travelling
  const armSwing = p.walking ? Math.sin(t * (poseName === "run" ? 14 : 8)) * (poseName === "run" ? 22 : 12) : 0;
  const L: ArmSpec = p.motion ? [p.motion[0] + armSwing, p.motion[1]] : mix(from.l, to.l);
  const R: ArmSpec = p.motion ? [p.motion[2] - armSwing, p.motion[3]] : mix(from.r, to.r);
  const m = p.talking ? p.mouth ?? 0 : 0;
  const seed = p.seed ?? 1;

  // body motion
  const breath = Math.sin(t * Math.PI * 0.9 + seed) * 3;
  // a small hop while a gesture changes, so a new pose lands with a bounce
  const hop = Math.sin(Math.max(0, Math.min(1, k)) * Math.PI);
  const bodyY = (p.motion?.[4] ?? lerp(from.bodyY ?? 0, to.bodyY ?? 0, k)) - hop * 6;
  const jumpWeight = p.motion?.[6] ?? lerp(p.fromPose === "celebrate" ? 1 : 0, poseName === "celebrate" ? 1 : 0, k);
  const jumpY = -(1 - Math.cos(t * 7)) * 12 * Math.max(0, jumpWeight);
  const walkPhase = p.walking || poseName === "run" ? t * (poseName === "run" ? 14 : 8) : 0;
  const stepBob = p.walking || poseName === "run" ? -(1 - Math.cos(walkPhase * 2)) * 4 : 0;
  const lean = (p.motion?.[5] ?? lerp(from.lean ?? 0, to.lean ?? 0, k)) + m * (Math.sin(t * 3.1) * 0.6 + 1) + Math.sin(t * 0.9 + seed * 1.3) * 0.7; // + a slow idle sway
  const exprTilt = p.motion ? Object.values(EXPR).reduce((sum, spec, i) => sum + (spec.tilt ?? 0) * p.motion![10+i], 0) : EXPR[p.expression ?? "neutral"]?.tilt ?? 0;
  const headTilt = exprTilt + (Math.sin(t * 1.3 + seed) * 0.7 + m * Math.sin(t * 3 + seed) * 1.5);

  const B = BUILDS[look.build ?? "adult"] ?? BUILDS.adult;
  const legTop = B.legTop;
  const top = B.top;
  const headY = B.headY;
  const HEAD = B.head;
  const sx = B.sx, sy = top + 22;

  // talking gesture wiggle on the forearm
  const motionIndex = 10 + Object.keys(EXPR).length;
  const wig = (p.motion?.[motionIndex] ?? (poseName === "talk" || poseName === "explain" ? 1 : 0)) * m * (Math.sin(t * 3.2 + seed) * 6 + 8);
  const waveWig = (p.motion?.[motionIndex+2] ?? (poseName === "wave" ? 1 : 0)) * Math.sin(t * 7) * 14;
  const ra = armPoints(1, R, sx, sy, B.up, B.fore, wig + waveWig);
  const la = armPoints(-1, L, -sx, sy, B.up, B.fore, (p.motion?.[motionIndex+1] ?? (poseName === "explain" ? 1 : 0)) * wig * 0.7);
  const sleeve = ["robe", "coat", "chefcoat", "suit", "hoodie", "ziphoodie", "hoodieskirt", "armor", "tunic", "cardiganskirt"].includes(look.outfit ?? "");
  const longSleeve = look.outfit === "ziphoodie" || look.outfit === "hoodieskirt" || look.outfit === "cardiganskirt";
  const sleeveColor = look.outfit === "coat" ? "#fbfbfb" : look.outfit === "chefcoat" ? "#ffffff" : look.shirt ?? "#ffd23f";
  // short sleeve at the shoulder (its colour), for outfits with a tee underneath
  const puffSleeve = look.outfit === "pinafore" ? "#ffffff" : look.outfit === "dungarees" ? look.shirt ?? "#ffd23f" : null;

  // Limbs are drawn as a coloured tube inside an ink tube, so they have thickness and an outline.
  // `part` (0..1) draws only the first part of the path: a sleeve on an arm.
  const tube = (d: string, colour: string, width: number, key?: string, part?: number) => {
    const dash = part !== undefined ? { pathLength: 1, strokeDasharray: `${part} 1` } : {};
    return (
      <g key={key} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} stroke={INK} strokeWidth={width + 11} {...dash} />
        <path d={d} stroke={colour} strokeWidth={width} {...dash} />
      </g>
    );
  };
  const skin = look.skin ?? "#fff";
  const bareLegs = ["dress", "frilldress", "pinafore", "tunic", "belted", "dungarees", "robe", "sailor", "hoodieskirt", "cardiganskirt"].includes(look.outfit ?? "");
  const legColour = bareLegs ? look.tights ?? skin : look.pants && look.pants !== INK ? look.pants : "#3b3f5c";
  const shoeColour = look.shoes ?? "#2c2a36";
  const ankle = look.hightops ? 38 : 24; // high-tops reach over the ankle, sneakers stop below it
  const shoe = (fx: number, fy: number, dir: number) => look.hightops || look.sneakers ? (
    // canvas sneaker (high-top or low): laces, a chunky white sole and a white toe cap
    <g stroke={INK} strokeLinejoin="round" strokeLinecap="round">
      <path d={`M${fx - dir * 17} ${fy + 4} L${fx - dir * 17} ${fy - ankle + 8} Q${fx - dir * 16} ${fy - ankle} ${fx - dir * 6} ${fy - ankle} L${fx + dir * 10} ${fy - ankle} Q${fx + dir * 16} ${fy - ankle + 2} ${fx + dir * 16} ${fy - ankle + 12} L${fx + dir * 18} ${fy - 13} Q${fx + dir * 40} ${fy - 12} ${fx + dir * 44} ${fy + 2}Z`} fill={shoeColour} strokeWidth={5.5} />
      <path d={`M${fx + dir * 18} ${fy - 13} Q${fx + dir * 40} ${fy - 12} ${fx + dir * 44} ${fy + 2} L${fx + dir * 22} ${fy + 2} Q${fx + dir * 20} ${fy - 6} ${fx + dir * 18} ${fy - 13}Z`} fill="#ffffff" strokeWidth={4.5} />
      <path d={`M${fx - dir * 21} ${fy + 2} H${fx + dir * 46} Q${fx + dir * 50} ${fy + 14} ${fx + dir * 40} ${fy + 15} H${fx - dir * 16} Q${fx - dir * 24} ${fy + 14} ${fx - dir * 21} ${fy + 2}Z`} fill="#ffffff" strokeWidth={5.5} />
      <path d={look.hightops ? `M${fx - dir * 4} ${fy - 30} L${fx + dir * 10} ${fy - 24} M${fx - dir * 2} ${fy - 20} L${fx + dir * 13} ${fy - 15}` : `M${fx - dir * 2} ${fy - 20} L${fx + dir * 12} ${fy - 14} M${fx + dir * 6} ${fy - 22} L${fx + dir * 17} ${fy - 13}`} fill="none" stroke="#ffffff" strokeWidth={4} />
    </g>
  ) : (
    <g>
      <path d={`M${fx - dir * 15} ${fy - 9} Q${fx - dir * 19} ${fy + 11} ${fx - dir * 6} ${fy + 11} H${fx + dir * 30} Q${fx + dir * 43} ${fy + 10} ${fx + dir * 40} ${fy - 1} Q${fx + dir * 34} ${fy - 13} ${fx + dir * 14} ${fy - 13} Q${fx} ${fy - 16} ${fx - dir * 15} ${fy - 9}Z`} fill={shoeColour} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <path d={`M${fx - dir * 11} ${fy + 5} H${fx + dir * 35}`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.75} />
    </g>
  );
  const leg = (side: 1 | -1) => {
    const swing = Math.sin(walkPhase + (side === 1 ? 0 : Math.PI));
    const lift = Math.max(0, swing) * 18;
    const fx = side * 30 + swing * 26; // the legs are inside the mirrored group, so "forward" is always +x here
    const fy = -12 - lift;
    // Follow the hip through the torso's breathing/lean transforms while feet stay planted.
    // Jumping is a separate whole-character transform below, so both feet leave the ground.
    const hipX = side * 22 * Math.cos(rad(lean)) - breath * 0.3 * Math.sin(rad(lean));
    const hipY = legTop + side * 22 * Math.sin(rad(lean)) + breath * 0.3 * Math.cos(rad(lean)) + bodyY + breath * 0.4 - 6;
    // the knee bends forward when the foot lifts
    const kx = (hipX + fx) / 2 + (lift * 1.5 + 2), ky = (hipY + fy) / 2;
    const q = (u: number) => [(1 - u) * (1 - u) * hipX + 2 * (1 - u) * u * kx + u * u * fx, (1 - u) * (1 - u) * hipY + 2 * (1 - u) * u * ky + u * u * fy];
    return (
      <g key={side}>
        {tube(`M${hipX} ${hipY} Q${kx} ${ky} ${fx} ${fy}`, legColour, 15)}
        {look.cargo && !bareLegs && (() => {
          // cargo trousers: a patch pocket with a flap on the outside of the thigh, and a rolled-up cuff above the shoe
          const [px, py] = q(0.42), [cx0, cy0] = q(0.8), [cx1, cy1] = q(0.9);
          const ox = px + side * 9;
          return (
            <g key="cargo">
              <rect x={ox - 8} y={py - 12} width={16} height={26} rx={3} fill={legColour} stroke={INK} strokeWidth={4} />
              <path d={`M${ox - 8} ${py - 4} H${ox + 8}`} stroke={INK} strokeWidth={3.5} />
              {tube(`M${cx0} ${cy0} L${cx1} ${cy1}`, tint(legColour, 0.12), 20, "cuff")}
            </g>
          );
        })()}
        {look.socks && bareLegs && (() => {
          // knee socks: the lower half of the leg, from just under the knee to the shoe
          const [ax, ay] = q(0.56), [bx, by] = q(0.8);
          return tube(`M${ax} ${ay} Q${bx} ${by} ${fx} ${fy}`, look.socks, 15, "sock");
        })()}
        {shoe(fx, fy + 3, 1)}
      </g>
    );
  };

  const shortSleeve = puffSleeve ?? (["shirt", "striped", "overalls", "sweatervest", "vest", "police_uniform", "dress", "frilldress", "belted", "sailor"].includes(look.outfit ?? "shirt") ? (look.outfit === "vest" ? "#fbfbfb" : look.outfit === "sailor" ? "#ffffff" : look.shirt ?? "#ffd23f") : null);
  const arm = (a: ReturnType<typeof armPoints>, side: 1 | -1, hand?: string) => {
    // one smooth curve through the elbow (a soft "rubber hose" arm)
    const x0 = side * sx, y0 = sy;
    const cx = a.ex + (a.ex - (x0 + a.hx) / 2) * 0.8, cy = a.ey + (a.ey - (y0 + a.hy) / 2) * 0.8;
    const d = `M${x0} ${y0} Q${cx} ${cy} ${a.hx} ${a.hy}`;
    return (
      <g>
        {tube(d, look.hands ?? skin, 13)}
        {sleeve ? tube(d, sleeveColor, 22, "s", longSleeve ? 0.88 : 0.72) : shortSleeve ? tube(d, shortSleeve, 24, "s", puffSleeve ? 0.2 : 0.26) : null}
        {side === 1 && !p.holding && look.extras?.includes("notebook") && (
          <g transform={`translate(${a.hx} ${a.hy}) rotate(${a.a2 - 24})`} stroke={INK} strokeLinecap="round">
            <rect x={-31} y={-48} width={37} height={56} rx={6} fill={look.shoes ?? "#735183"} strokeWidth={6} />
            <path d="M-21 -33 H-5 M-21 -24 H-5" fill="none" strokeWidth={3} />
          </g>
        )}
        <Hand x={a.hx} y={a.hy} a={a.a2} side={side} kind={hand} fill={look.hands ?? skin} />
      </g>
    );
  };

  const gaze = p.motion ? {x:p.motion[8],y:p.motion[9]} : p.lookAt ?? { x: 0.25, y: 0 };
  // eye darts: the gaze shifts a little every couple of seconds instead of staying frozen
  const dartClock = (t + seed * 0.37) / 1.9, dartN = Math.floor(dartClock);
  const dartAt = (n: number) => ({ x: (rand(seed, n) - 0.5) * 0.26, y: (rand(seed, n + 500) - 0.5) * 0.14 });
  const dartP = Math.min(1, ((dartClock - dartN) * 1.9) / 0.1), d0 = dartAt(dartN - 1), d1 = dartAt(dartN);
  const pupilLook = { x: Math.max(-1, Math.min(1, gaze.x + lerp(d0.x, d1.x, dartP))), y: Math.max(-1, Math.min(1, gaze.y + lerp(d0.y, d1.y, dartP))) };
  const closed = blinkAmount(p.frame, p.fps, seed); // 0 open .. 1 shut, so lids close and open over a few frames
  const blink = closed > 0.75;
  const hasWrap = ["headscarf", "keffiyeh", "pharaoh"].includes(look.hat ?? ""); // hair is hidden under these
  const fullWrap = look.hat === "headscarf"; // the cloth frames the whole face, which is drawn a little smaller
  const headRx = ({ egg: 92, wide: 108, bean: 98, oval: 87, square: 95 } as Record<string, number>)[look.head ?? ""] ?? 100;
  const headRy = ({ egg: 108, wide: 94, bean: 104, oval: 110, square: 102 } as Record<string, number>)[look.head ?? ""] ?? 100;
  // older builds have smaller heads; keep the head's outline about as thick as the body's
  const headStroke = 7 * Math.max(1, 1.1 / HEAD);
  const emoteScale = 1.32 / HEAD; // emotes keep their size on a smaller head
  const hold = p.holding;
  const hatLook = look.hair === "highponytail" && look.hat === "bow" ? { ...look, hat: undefined } : look;
  const uid = sid(useId());
  const celHead = `ch${uid}`, celBody = `cb${uid}`, celHair = `cr${uid}`, castId = `cs${uid}`;
  // squash and stretch while a gesture changes: a tiny dip, then a stretch as the pose lands
  const kk = Math.max(0, Math.min(1, k));
  const squash = kk < 1 ? Math.sin(kk * Math.PI * 2) * Math.sin(kk * Math.PI) * 0.024 : 0;

  return (
    <g transform={`scale(${hs}) scale(${p.motion ? Math.max(-1, Math.min(1, p.motion[7])) : facing} 1)`}>
      <defs>
        <CelFilter id={celHead} depth={17} opacity={0.17} />
        <CelFilter id={celBody} depth={13} opacity={0.2} />
        <CelFilter id={celHair} depth={12} opacity={0.26} />
        <ShadowFilter id={castId} opacity={0.2} />
        <clipPath id={`cf${uid}`}><path d={headPath(look.head, (fullWrap ? headRx * 0.8 : headRx) - 3, (fullWrap ? headRy * 0.86 : headRy) - 3)} /></clipPath>
      </defs>
      {/* soft ground shadow, leaning away from the light */}
      <GroundShadow id={`gs${uid}`} x={14} y={2} rx={118 * (1 + jumpY / 80)} ry={20 * (1 + jumpY / 80)} />
      <g transform={`translate(0 ${stepBob + jumpY}) scale(${1 + squash} ${1 - squash})`}>
      {poseName !== "sit" ? [leg(-1), leg(1)] : [-1, 1].map((side) => {
        // seated: thighs forward, shins down
        // Seen from the side: two parallel legs, thighs forward from under the hem, shins down to the floor.
        // The far leg (drawn first) sits a little behind the near one, so both read as legs.
        const far = side === -1;
        // The chef's coat and shoulders face the camera: use a matching frontal seat,
        // with separate knees, rather than hiding both hips under one side of the coat.
        const frontSeat = look.hat === "chef";
        const hx = frontSeat ? side * 27 : side * 13 - 2;
        const hy = legTop + bodyY - (frontSeat ? 8 : -12 + (far ? 5 : 0));
        const kx = frontSeat ? side * 51 : hx + (far ? 72 : 88);
        const ky = hy + (frontSeat ? 48 : 4);
        const fx = frontSeat ? side * 54 : kx + 4;
        return (
          <g key={side}>
            {tube(frontSeat ? `M${hx} ${hy} Q${kx} ${hy + 18} ${kx} ${ky} L${fx} -14` : `M${hx} ${hy} L${kx} ${ky} L${fx} -14`, legColour, 15)}
            {look.cargo && !bareLegs && (() => {
              // the cargo pocket on the thigh and the rolled cuff on the shin, as when standing
              const px = lerp(hx, kx, 0.55), py = lerp(hy, ky, 0.55);
              return (
                <g key="cargo">
                  <rect x={px - 13} y={py - 8} width={26} height={16} rx={3} fill={legColour} stroke={INK} strokeWidth={4} />
                  <path d={`M${px - 13} ${py - 2} H${px + 13}`} stroke={INK} strokeWidth={3.5} />
                  {tube(`M${lerp(kx, fx, 0.74)} ${lerp(ky, -14, 0.74)} L${lerp(kx, fx, 0.86)} ${lerp(ky, -14, 0.86)}`, tint(legColour, 0.12), 20, "cuff")}
                </g>
              );
            })()}
            {look.socks && bareLegs && tube(`M${lerp(kx, fx, 0.25)} ${lerp(ky, -14, 0.25)} L${fx} -14`, look.socks, 15, "sock")}
            {shoe(fx, -9, frontSeat ? side : 1)}
          </g>
        );
      })}
      <g transform={`translate(0 ${bodyY + breath * 0.4}) rotate(${lean} 0 ${legTop})`}>
        {look.hair === "long" && !hasWrap && (
          <g transform={`translate(0 ${headY + breath * 0.35}) rotate(${headTilt}) scale(${HEAD})`}>
            <g transform={`rotate(${-headTilt * 0.35 + Math.sin(t * 1.7 + seed) * 0.9} 0 -40)`} filter={`url(#${celHair})`}>
              <HairBehind look={look} />
            </g>
          </g>
        )}
        {/* the neck, from under the collar to under the chin (older builds) */}
        {B.neck && tube(`M0 ${top + 14} L0 ${headY + breath * 0.35 + HEAD * 70}`, skin, 26, "neck")}
        <g transform={`translate(0 ${breath * 0.3})`} filter={`url(#${celBody})`}>
          <ExtrasBack look={look} top={top} />
          <g transform={`scale(${B.wide} 1)`}><Torso look={look} top={top} bottom={legTop} /></g>
          {/* the head's shadow on the chest */}
          <ellipse cx={5} cy={top + 13} rx={44} ry={15} fill={SHADE} opacity={0.2} />
          {look.shirtSymbol && <g transform={`translate(0 ${top+68}) scale(.35)`} fill={look.accent??"#ffc83d"} stroke={INK} strokeWidth={6}>{look.shirtSymbol === "heart" ? <path d="M0 45 C-90 -10 -35 -70 0 -30 C35 -70 90 -10 0 45Z"/> : <path d="M0 -55 L17 -17 L59 -17 L25 9 L38 50 L0 25 L-38 50 L-25 9 L-59 -17 L-17 -17Z"/>}</g>}
          <ExtrasFront look={look} top={top} />
          <Accessory look={look} top={top} t={t} />
        </g>
        <g transform={`translate(0 ${headY + breath * 0.35}) rotate(${headTilt}) scale(${HEAD})`}>
          {/* the hair behind the head lags a little behind the head's tilt */}
          {!hasWrap && (
            <g transform={`rotate(${-headTilt * 0.35 + Math.sin(t * 1.7 + seed) * 0.9} 0 -40)`} filter={`url(#${celHair})`}>
              <HairBack look={look} t={t} />
            </g>
          )}
          {hasWrap && <g filter={`url(#${celHair})`}><Wrap look={look} /></g>}
          <g filter={`url(#${celHead})`}>
            <path d={headPath(look.head, fullWrap ? headRx * 0.8 : headRx, fullWrap ? headRy * 0.86 : headRy)} fill={look.skin ?? "#fff"} stroke={INK} strokeWidth={headStroke} strokeLinejoin="round" />
          </g>
          {/* the fringe and the hat throw a shadow onto the face */}
          {!fullWrap && (
            <g clipPath={`url(#cf${uid})`}>
              <g transform="translate(5 11)" filter={`url(#${castId})`}>
                {hasWrap ? <WrapFront look={look} /> : <HairFront look={look} t={t} bounce={m} />}
                <Hat look={hatLook} facing={1} />
              </g>
            </g>
          )}
          {look.blush && (
            <g fill="#ff8fa3" opacity={0.55}>
              <ellipse cx={-56} cy={26} rx={16} ry={9} />
              <ellipse cx={56} cy={26} rx={16} ry={9} />
            </g>
          )}
          {look.freckles && (
            <g fill="#d9826b">
              {[-1, 1].map((s) => [[-66, 17], [-55, 23], [-45, 16]].map(([x, y], i) => <circle key={`${s}${i}`} cx={s * x} cy={y} r={3.2} />))}
            </g>
          )}
          {look.facial !== "mustache" && <Facial look={look} />}
          {look.accessory === "mask" && <g fill="#323640" stroke={INK} strokeWidth={5}><path d="M-92 -42 Q0 -63 92 -42 V13 Q0 -7 -92 13Z"/><ellipse cx={-36} cy={-23} rx={24} ry={21} fill={look.skin??"#fff"}/><ellipse cx={36} cy={-23} rx={24} ry={21} fill={look.skin??"#fff"}/></g>}
          <g transform={`translate(${pupilLook.x * 5} ${pupilLook.y * 3}) scale(${fullWrap ? 0.86 : 1})`}>
            <Face weights={p.motion?.slice(10,10+Object.keys(EXPR).length)} expression={p.expression} mouth={m} blink={blink} eyeOpen={1 - closed} mouthShape={p.mouthShape} look={pupilLook} skin={look.skin ?? "#fff"} lashes={look.lashes} eyeStyle={look.eyes} irisColor={look.irisColor} />
          </g>
          {look.facial === "mustache" && <Facial look={{ ...look }} />}
          <Glasses kind={look.accessory} />
          {!hasWrap && <g filter={`url(#${celHair})`}><HairFront look={look} t={t} bounce={m} /></g>}
          {hasWrap && !fullWrap && <g filter={`url(#${celHair})`}><WrapFront look={look} /></g>}
          {/* a low fringe would hide the eyebrows, so they are drawn again over it */}
          {((!hasWrap && ["starbuns", "curlypuff", "flowing", "highponytail", "schoolbob", "shaggy"].includes(look.hair ?? "")) || (hasWrap && !fullWrap)) && <Face part="brows" weights={p.motion?.slice(10,10+Object.keys(EXPR).length)} expression={p.expression} blink={blink} />}
          <g filter={`url(#${celHair})`}><Hat look={hatLook} facing={1} /></g>
          {p.emote && (
            <g transform={`translate(${100 + 55 * emoteScale} -70)`}>
              <g transform={`scale(${facing * emoteScale} ${emoteScale})`}>
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
    </g>
  );
};

export const CHAR_HEIGHT = 560; // local units from feet to top of head (without hats)

export const seedFrom = (s: string) => Math.floor(rand(s) * 1000);
