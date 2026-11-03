import React, { useId } from "react";
import { INK } from "./theme";

export type Expression =
  | "neutral" | "happy" | "excited" | "laughing" | "sad" | "angry" | "surprised"
  | "shocked" | "confused" | "thinking" | "worried" | "smug" | "scared" | "sleepy"
  | "determined" | "love" | "dizzy" | "proud" | "disgusted" | "crying";

type Spec = {
  brow: [number, number, number] | null; // [left angle, right angle, lift]  (+angle = inner end raised)
  eyes: "normal" | "happy" | "wide" | "narrow" | "sad" | "closed" | "dizzy" | "heart" | "half";
  mouth: "smile" | "grin" | "open" | "frown" | "o" | "flat" | "wavy" | "smirk" | "teeth" | "small" | "tongue";
  pupil?: number;
  tears?: boolean;
  tilt?: number;
};

export const EXPR: Record<Expression, Spec> = {
  neutral: { brow: [0, 0, 0], eyes: "normal", mouth: "small" },
  happy: { brow: [2, 2, -8], eyes: "normal", mouth: "smile" },
  excited: { brow: [6, 6, -16], eyes: "wide", mouth: "grin", pupil: 1.05 },
  laughing: { brow: [4, 4, -12], eyes: "happy", mouth: "grin" },
  proud: { brow: [-2, -2, -10], eyes: "happy", mouth: "smile", tilt: -4 },
  sad: { brow: [22, 22, 2], eyes: "sad", mouth: "frown" },
  crying: { brow: [24, 24, 0], eyes: "happy", mouth: "open", tears: true },
  angry: { brow: [-26, -26, 8], eyes: "narrow", mouth: "teeth" },
  determined: { brow: [-18, -18, 4], eyes: "narrow", mouth: "flat" },
  surprised: { brow: [6, 6, -18], eyes: "wide", mouth: "o", pupil: 0.8 },
  shocked: { brow: [10, 10, -22], eyes: "wide", mouth: "open", pupil: 0.6 },
  confused: { brow: [14, -14, -6], eyes: "normal", mouth: "wavy", tilt: 7 },
  thinking: { brow: [8, -10, -4], eyes: "half", mouth: "smirk", tilt: -5 },
  worried: { brow: [20, 20, -6], eyes: "normal", mouth: "wavy" },
  smug: { brow: [-6, 10, -2], eyes: "half", mouth: "smirk" },
  scared: { brow: [24, 24, -14], eyes: "wide", mouth: "teeth", pupil: 0.6 },
  sleepy: { brow: [4, 4, 4], eyes: "closed", mouth: "small" },
  love: { brow: [4, 4, -10], eyes: "heart", mouth: "grin" },
  dizzy: { brow: [10, -10, -6], eyes: "dizzy", mouth: "wavy" },
  disgusted: { brow: [-14, 10, 2], eyes: "half", mouth: "wavy" },
};

export type FaceProps = {
  expression?: Expression;
  weights?: number[];
  mouth?: number; // lip-sync openness 0..1 (when talking)
  blink?: boolean;
  look?: { x: number; y: number };
  skin?: string;
  scale?: number; // 1 = sized for a head of radius 100
  stroke?: number;
  eyeSpacing?: number;
  eyeY?: number;
  mouthY?: number;
  frame?: number;
};

const sid = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

const Eye: React.FC<{
  cx: number; cy: number; side: -1 | 1; spec: Spec; blink?: boolean; look: { x: number; y: number };
  skin: string; sw: number; id: string;
}> = ({ cx, cy, side, spec, blink, look, skin, sw, id }) => {
  const kind = blink ? "closed" : spec.eyes;
  const rx = kind === "wide" ? 23 : 20;
  const ry = kind === "wide" ? 29 : 25;
  if (kind === "closed") {
    return <path d={`M${cx - 17} ${cy + 3} Q${cx} ${cy + 11} ${cx + 17} ${cy + 3}`} stroke={INK} strokeWidth={sw} fill="none" strokeLinecap="round" />;
  }
  if (kind === "happy") {
    return <path d={`M${cx - 17} ${cy + 6} Q${cx} ${cy - 16} ${cx + 17} ${cy + 6}`} stroke={INK} strokeWidth={sw} fill="none" strokeLinecap="round" />;
  }
  if (kind === "heart") {
    const s = 1.15;
    return (
      <path
        transform={`translate(${cx} ${cy}) scale(${s})`}
        d="M0 14 C-22 -2 -16 -20 -6 -18 C-2 -17 0 -13 0 -10 C0 -13 2 -17 6 -18 C16 -20 22 -2 0 14Z"
        fill="#ff4d6d" stroke={INK} strokeWidth={sw * 0.7} strokeLinejoin="round"
      />
    );
  }
  if (kind === "dizzy") {
    return <path d={`M${cx} ${cy} m-3 0 a3 3 0 1 1 6 0 a7 7 0 1 1 -14 0 a11 11 0 1 1 22 0 a15 15 0 1 1 -30 0`} stroke={INK} strokeWidth={sw * 0.6} fill="none" />;
  }
  const pr = 9.5 * (spec.pupil ?? 1);
  const px = cx + look.x * (rx - pr - 3);
  const py = cy + look.y * (ry - pr - 4) + 2;
  // eyelids: polygons covering part of the sclera, clipped to it
  let lid: string | null = null;
  if (kind === "narrow") {
    // slanted lid, low at the inner corner (angry)
    const inner = side === -1 ? cx + rx : cx - rx;
    const outer = side === -1 ? cx - rx : cx + rx;
    lid = `M${outer - side * 4} ${cy - ry - 4} L${outer - side * 4} ${cy - ry * 0.35} L${inner + side * 4} ${cy - ry * 0.05} L${inner + side * 4} ${cy - ry - 4}Z`;
  } else if (kind === "sad") {
    const inner = side === -1 ? cx + rx : cx - rx;
    const outer = side === -1 ? cx - rx : cx + rx;
    lid = `M${outer + side * 4} ${cy - ry - 4} L${outer + side * 4} ${cy + ry * 0.05} L${inner - side * 4} ${cy - ry * 0.55} L${inner - side * 4} ${cy - ry - 4}Z`;
  } else if (kind === "half") {
    lid = `M${cx - rx - 4} ${cy - ry - 4} L${cx - rx - 4} ${cy - ry * 0.15} L${cx + rx + 4} ${cy - ry * 0.15} L${cx + rx + 4} ${cy - ry - 4}Z`;
  }
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" />
      <g clipPath={`url(#${id})`}>
        <circle cx={px} cy={py} r={pr} fill={INK} />
        <circle cx={px + pr * 0.35} cy={py - pr * 0.4} r={pr * 0.3} fill="#fff" />
        {lid && <path d={lid} fill={skin} stroke={INK} strokeWidth={sw * 0.7} />}
      </g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={sw} />
    </g>
  );
};

const Mouth: React.FC<{ spec: Spec; m: number; y: number; sw: number }> = ({ spec, m, y, sw }) => {
  const talkingOpen = m > 0.06;
  const kind = spec.mouth;
  const dark = "#5e1222";
  const tongue = "#ff7d8f";
  if (talkingOpen || kind === "open" || kind === "grin" || kind === "o" || kind === "teeth") {
    // open mouth: D-shape for positive moods, oval for neutral/surprise, inverted for sad
    const sad = kind === "frown" || kind === "wavy" || kind === "teeth" && !talkingOpen;
    const base = kind === "grin" ? 0.55 : kind === "open" ? 0.75 : kind === "o" ? 0.5 : kind === "teeth" ? 0.35 : 0;
    const open = Math.max(m, talkingOpen ? 0 : base);
    // talking opens the mouth less than a shocked/open expression does (max 30 vs 48 units)
    const TALK_MAX = 24;
    const h = 6 + open * (talkingOpen ? TALK_MAX : 42);
    const w = kind === "o" ? 20 + open * 6 : kind === "grin" || kind === "smile" ? 50 - open * 6 : 40 - open * 4;
    if (kind === "o" && !talkingOpen) {
      return <ellipse cx={0} cy={y + 4} rx={w * 0.55} ry={h * 0.5} fill={dark} stroke={INK} strokeWidth={sw} />;
    }
    if (kind === "teeth" && !talkingOpen) {
      return (
        <g>
          <rect x={-w * 0.75} y={y - 8} width={w * 1.5} height={18} rx={8} fill="#fff" stroke={INK} strokeWidth={sw} />
          <path d={`M${-w * 0.75} ${y + 1} H${w * 0.75} M${-w * 0.25} ${y - 8} V${y + 10} M${w * 0.25} ${y - 8} V${y + 10}`} stroke={INK} strokeWidth={sw * 0.5} />
        </g>
      );
    }
    let d: string;
    if (sad) {
      d = `M${-w * 0.5} ${y + h * 0.45} Q0 ${y - h * 0.75} ${w * 0.5} ${y + h * 0.45} Q0 ${y + h * 0.25} ${-w * 0.5} ${y + h * 0.45}Z`;
    } else if (kind === "grin" || kind === "smile" || kind === "tongue" || spec.eyes === "happy") {
      d = `M${-w * 0.55} ${y - 6} Q0 ${y + 2} ${w * 0.55} ${y - 6} Q${w * 0.5} ${y + h} 0 ${y + h} Q${-w * 0.5} ${y + h} ${-w * 0.55} ${y - 6}Z`;
    } else {
      d = `M${-w * 0.45} ${y} Q0 ${y - 6} ${w * 0.45} ${y} Q${w * 0.45} ${y + h} 0 ${y + h} Q${-w * 0.45} ${y + h} ${-w * 0.45} ${y}Z`;
    }
    const showTongue = h > 20;
    const showTeeth = (kind === "grin" || kind === "smile") && h > 16;
    return (
      <g>
        <path d={d} fill={dark} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        {showTongue && !sad && <ellipse cx={0} cy={y + h * 0.78} rx={w * 0.26} ry={h * 0.2} fill={tongue} />}
        {showTeeth && <path d={`M${-w * 0.42} ${y - 3} Q0 ${y + 4} ${w * 0.42} ${y - 3} L${w * 0.36} ${y + 5} Q0 ${y + 10} ${-w * 0.36} ${y + 5}Z`} fill="#fff" />}
      </g>
    );
  }
  const p = (d: string) => <path d={d} stroke={INK} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  switch (kind) {
    case "smile": return p(`M-24 ${y - 4} Q0 ${y + 18} 24 ${y - 4}`);
    case "frown": return p(`M-20 ${y + 10} Q0 ${y - 8} 20 ${y + 10}`);
    case "flat": return p(`M-18 ${y + 2} H18`);
    case "wavy": return p(`M-22 ${y + 4} q7 -8 14 0 t14 0 t14 0`);
    case "smirk": return p(`M-16 ${y + 4} Q6 ${y + 8} 20 ${y - 6}`);
    case "tongue":
      return (
        <g>
          {p(`M-22 ${y} Q0 ${y + 14} 22 ${y}`)}
          <path d={`M2 ${y + 6} q10 18 18 2 z`} fill="#ff7d8f" stroke={INK} strokeWidth={sw * 0.7} />
        </g>
      );
    case "small":
    default:
      return p(`M-14 ${y} Q0 ${y + 9} 14 ${y}`);
  }
};

/** A cartoon face centered at (0,0) for a head of radius ≈100 (use `scale` for others). */
const FaceLayer: React.FC<FaceProps> = ({
  expression = "neutral", mouth = 0, blink, look = { x: 0, y: 0 }, skin = "#fff", scale = 1,
  stroke = 5.5, eyeSpacing = 34, eyeY = -10, mouthY = 40,
}) => {
  const spec = EXPR[expression] ?? EXPR.neutral;
  const uid = sid(useId());
  const sw = stroke;
  const browY = eyeY - 38 - (spec.brow?.[2] ?? 0) * 0.6 + (blink ? 3 : 0);
  return (
    <g transform={`scale(${scale})`}>
      {spec.brow && (
        <g stroke={INK} strokeWidth={sw * 1.15} strokeLinecap="round">
          <line x1={-eyeSpacing - 15} y1={browY} x2={-eyeSpacing + 15} y2={browY} transform={`rotate(${-spec.brow[0]} ${-eyeSpacing} ${browY})`} />
          <line x1={eyeSpacing - 15} y1={browY} x2={eyeSpacing + 15} y2={browY} transform={`rotate(${spec.brow[1]} ${eyeSpacing} ${browY})`} />
        </g>
      )}
      <Eye cx={-eyeSpacing} cy={eyeY} side={-1} spec={spec} blink={blink} look={look} skin={skin} sw={sw} id={`el${uid}`} />
      <Eye cx={eyeSpacing} cy={eyeY} side={1} spec={spec} blink={blink} look={look} skin={skin} sw={sw} id={`er${uid}`} />
      <Mouth spec={spec} m={mouth} y={mouthY} sw={sw} />
      {spec.tears && (
        <g fill="#7cc8ff" stroke={INK} strokeWidth={sw * 0.5}>
          <path d={`M${-eyeSpacing - 6} ${eyeY + 22} q-8 16 0 22 q8 -6 0 -22z`} />
          <path d={`M${eyeSpacing + 6} ${eyeY + 22} q-8 16 0 22 q8 -6 0 -22z`} />
        </g>
      )}
    </g>
  );
};

// Crossfade discrete eye/mouth drawings; weighted layers remain continuous on interruptions.
export const Face: React.FC<FaceProps> = (props) => {
  if (!props.weights) return <FaceLayer {...props} />;
  const names = Object.keys(EXPR) as Expression[];
  const weights = props.weights.map((w) => Math.max(0,w));
  const total = weights.reduce((a,b) => a+b,0) || 1;
  return <g>{names.map((expression,i) => weights[i] > 0.001 ? <g key={expression} opacity={weights[i]/total}><FaceLayer {...props} expression={expression} /></g> : null)}</g>;
};

/** Deterministic blink schedule: closed for ~4 frames every few seconds. */
export const isBlinking = (frame: number, fps: number, seed: number) => {
  const period = Math.round(fps * (2.6 + (seed % 7) * 0.35));
  const phase = (frame + seed * 13) % period;
  return phase < Math.max(2, Math.round(fps * 0.12));
};
