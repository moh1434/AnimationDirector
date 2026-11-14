import React, { useId } from "react";
import { Face, EXPR, isBlinking } from "./Face";
import type { Expression } from "./Face";
import { PropArt } from "./Props";
import { Emote } from "./Character";
import type { CharacterProps } from "./Character";
import { INK } from "./theme";
import { CelFilter, GroundShadow, sid } from "./shade";

/**
 * Animal actors. They share the human rig's frame (feet at y = 0, about 560 units tall, facing right)
 * so layouts, entrances and moves treat them like any other actor; only their bodies differ.
 */
export const ANIMAL_POSES = ["idle", "talk", "walk", "run", "sit", "sleep", "jump", "lick", "bark", "scared", "celebrate", "cheer", "fly"];

export type AnimalKind = "dog" | "cat" | "bird";
type AnimalProps = Omit<CharacterProps, "pose" | "fromPose"> & { pose?: string; fromPose?: string; kind?: AnimalKind | "human" };

const line = { stroke: INK, strokeWidth: 8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** A darker tone of a hex colour, for far legs and ears. */
const shade = (hex: string, k = 0.78) => {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const c = (s: number) => Math.round(((n >> s) & 255) * k);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};

/** A rounded leg or tail: an outline stroke with the colour stroke on top. */
const Limb: React.FC<{ d: string; color: string; w: number }> = ({ d, color, w }) => <>
  <path d={d} fill="none" stroke={INK} strokeWidth={w + 16} strokeLinecap="round" strokeLinejoin="round" />
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
</>;

const faceOf = (p: AnimalProps, pose: string) => {
  const sleeping = pose === "sleep";
  const expression: Expression | undefined = sleeping ? "sleepy" : p.expression;
  return {
    expression,
    weights: sleeping ? undefined : p.motion?.slice(10, 10 + Object.keys(EXPR).length),
    blink: !sleeping && isBlinking(p.frame, p.fps, p.seed ?? 0),
    look: p.motion ? { x: p.motion[8], y: p.motion[9] } : p.lookAt,
    mouth: pose === "bark" ? Math.abs(Math.sin(p.t * 9)) : p.talking ? (p.mouth ?? 0) : 0,
  };
};

const Pet: React.FC<AnimalProps & { kind: "dog" | "cat"; pose: string; moving: boolean }> = (p) => {
  const { kind, pose, moving, t } = p;
  const dog = kind === "dog";
  const main = p.look?.skin ?? (dog ? "#c58c58" : "#e8a451");
  const dark = p.look?.hairColor ?? shade(main, dog ? 0.62 : 0.8);
  const far = shade(main);
  const cream = p.look?.shirt ?? "#fff1d6";
  const collar = p.look?.accent ?? "#e53950";
  const happy = ["happy", "excited", "love", "laughing"].includes(p.expression ?? "") || pose === "lick";
  const running = pose === "run";

  const phase = t * (running ? 17 : 10);
  const stride = moving ? (running ? 52 : 32) : 0;
  const swing = (offset: number) => Math.sin(phase + offset) * stride;
  const lift = (offset: number) => (moving ? Math.max(0, Math.cos(phase + offset)) * (running ? 34 : 20) : 0);
  const bob = moving ? -Math.abs(Math.cos(phase)) * (running ? 16 : 7) : Math.sin(t * 2.6) * 2;
  const wag = (happy ? Math.sin(t * 15) * 16 : Math.sin(t * 2) * 4) + (pose === "scared" ? 30 : 0);
  const hop = pose === "celebrate" || pose === "cheer" ? -Math.abs(Math.sin(t * 6)) * 44 : 0;
  const shiver = pose === "scared" ? Math.sin(t * 46) * 4 : 0;
  const bark = pose === "bark" ? Math.abs(Math.sin(t * 9)) : 0;

  const sit = pose === "sit", sleep = pose === "sleep", jump = pose === "jump";
  const bodyRot = jump ? -14 : running ? Math.sin(phase) * 4 : 0;
  const bodyY = sleep ? 112 : pose === "scared" ? 22 : bob;
  // where the head sits on the body in each pose
  const hx = sit ? 62 : sleep ? 172 : pose === "lick" ? 185 : 152;
  const hy = (sit ? -398 : sleep ? -112 : pose === "scared" ? -300 : -336 + bob) - bark * 12;
  const tilt = sleep ? 10 : pose === "lick" ? -6 + Math.sin(t * 12) * 5 : Math.sin(t * 1.3) * 2 - bark * 7;

  const legs = (side: "far" | "near") => {
    if (sleep) return null;
    const near = side === "near", color = near ? main : far;
    const leg = (hipX: number, hipY: number, offset: number, footX?: number, footLen = 118) => {
      const fx = (footX ?? hipX) + swing(offset), fy = hop || jump ? hipY + footLen * 0.62 : -14 - lift(offset);
      return <g key={hipX}>
        <Limb d={`M${hipX} ${hipY} L${fx} ${fy}`} color={color} w={near ? 34 : 30} />
        <ellipse cx={fx + 14} cy={fy + 4} rx={30} ry={14} fill={color} {...line} />
      </g>;
    };
    if (sit) return near ? leg(66, -176, 0, 74) : leg(112, -176, 0, 118);
    return near
      ? <g>{leg(-126, -142 + bodyY, 0)}{leg(74, -142 + bodyY, Math.PI)}</g>
      : <g>{leg(-74, -142 + bodyY, Math.PI)}{leg(122, -142 + bodyY, 0)}</g>;
  };

  const tailFrom = sit ? "M-120 -46" : sleep ? "M-170 -84" : `M-168 ${-232 + bodyY}`;
  const tail = sleep
    ? `${tailFrom} Q-250 -66 -262 -22`
    : sit ? `${tailFrom} Q-212 -34 -236 -92`
    : dog ? `${tailFrom} Q-250 ${-268 + bodyY} -230 ${-348 + bodyY}` : `${tailFrom} Q-280 ${-214 + bodyY} -252 ${-326 + bodyY} Q-240 ${-386 + bodyY} -196 ${-372 + bodyY}`;

  const face = faceOf(p, pose);
  return <g transform={`translate(${shiver} ${hop})`}>
    <g transform={`rotate(${wag} -168 ${-232 + bodyY})`}><Limb d={tail} color={dog ? main : dark} w={dog ? 30 : 26} /></g>
    {legs("far")}
    {sit ? <g>
      <path d="M-128 -18 Q-150 -190 -30 -300 Q50 -350 92 -270 Q124 -170 88 -18Z" fill={main} {...line} />
      <ellipse cx={34} cy={-168} rx={44} ry={86} fill={cream} />
      {!dog && [-96, -60, -24].map((x, i) => <path key={x} d={`M${x} ${-210 - i * 34} q24 16 44 12`} fill="none" stroke={dark} strokeWidth={14} strokeLinecap="round" />)}
    </g> : <g transform={`rotate(${bodyRot} -120 ${-150 + bodyY})`}>
      <rect x={-186} y={-292 + bodyY} width={332} height={172} rx={84} fill={main} {...line} />
      <ellipse cx={-14} cy={-146 + bodyY} rx={108} ry={22} fill={cream} />
      {!dog && [-90, -40, 10].map((x) => <path key={x} d={`M${x} ${-288 + bodyY} q8 34 -2 62`} fill="none" stroke={dark} strokeWidth={14} strokeLinecap="round" />)}
    </g>}
    {legs("near")}
    {sit && <g><ellipse cx={-62} cy={-84} rx={78} ry={70} fill={main} {...line} /><ellipse cx={-18} cy={-14} rx={58} ry={16} fill={main} {...line} /></g>}
    {sleep && <><ellipse cx={72} cy={-16} rx={62} ry={16} fill={main} {...line} /><ellipse cx={-92} cy={-14} rx={52} ry={15} fill={main} {...line} /></>}

    <g transform={`translate(${hx} ${hy}) rotate(${tilt})`}>
      {/* collar belongs to the neck, so it moves with the head */}
      {!sleep && <g transform="translate(-10 90)"><path d="M-74 -8 Q0 30 78 -14" fill="none" stroke={INK} strokeWidth={32} strokeLinecap="round" /><path d="M-74 -8 Q0 30 78 -14" fill="none" stroke={collar} strokeWidth={18} strokeLinecap="round" /><circle cx={4} cy={22} r={15} fill="#ffc83d" {...line} strokeWidth={6} /></g>}
      {!dog && <g {...line}>
        <path d="M-92 -46 L-98 -146 L-22 -94Z" fill={main} /><path d="M92 -46 L98 -146 L22 -94Z" fill={main} />
        <path d="M-80 -66 L-84 -116 L-46 -90Z" fill="#ffc2c7" strokeWidth={0} /><path d="M80 -66 L84 -116 L46 -90Z" fill="#ffc2c7" strokeWidth={0} />
      </g>}
      <ellipse rx={dog ? 106 : 104} ry={dog ? 98 : 92} fill={main} {...line} />
      {dog ? <>
        <ellipse cy={56} rx={60} ry={38} fill={cream} />
        <path d="M-96 -56 Q-152 -40 -130 46 Q-92 62 -78 -8Z" fill={dark} {...line} />
        <path d="M96 -56 Q152 -40 130 46 Q92 62 78 -8Z" fill={dark} {...line} />
      </> : <>
        <ellipse cy={48} rx={52} ry={32} fill={cream} />
        {[-22, 0, 22].map((x) => <path key={x} d={`M${x} -90 V-62`} stroke={dark} strokeWidth={12} strokeLinecap="round" />)}
        <path d="M-58 36 L-138 22 M-58 52 H-140 M58 36 L138 22 M58 52 H140" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      </>}
      <Face {...face} skin={main} eyeSpacing={38} eyeY={-24} mouthY={dog ? 62 : 56} />
      {dog ? <ellipse cy={32} rx={19} ry={13} fill={INK} /> : <path d="M-10 26 H10 L0 37Z" fill="#ff8fa3" stroke={INK} strokeWidth={4} strokeLinejoin="round" />}
      {pose === "lick" && <g transform={`translate(8 70) rotate(${Math.sin(t * 12) * 12})`}>
        <path d={`M-30 0 Q-34 ${70 + Math.sin(t * 12) * 16} 0 ${84 + Math.sin(t * 12) * 16} Q34 ${70 + Math.sin(t * 12) * 16} 30 0Z`} fill="#ff7f96" {...line} />
        <path d="M0 8 V52" stroke="#d85a78" strokeWidth={5} strokeLinecap="round" />
      </g>}
      {p.holding && <g transform="translate(26 112)"><PropArt name={p.holding} size={150} /></g>}
    </g>
  </g>;
};

const Bird: React.FC<AnimalProps & { pose: string; moving: boolean }> = (p) => {
  const { pose, moving, t } = p;
  const main = p.look?.skin ?? "#3b8df0";
  const wing = p.look?.shirt ?? shade(main, 0.74);
  const belly = "#fff1d6";
  const beak = p.look?.accent ?? "#ffc83d";
  const flying = pose === "fly";
  const sleep = pose === "sleep";
  const hop = moving && !flying ? -Math.abs(Math.sin(t * 11)) * 26 : pose === "celebrate" || pose === "cheer" ? -Math.abs(Math.sin(t * 7)) * 40 : 0;
  const lift = flying ? -130 + Math.sin(t * 5) * 16 : hop;
  const flap = flying ? Math.sin(t * 26) * 42 : moving ? Math.sin(t * 14) * 14 : pose === "scared" ? Math.sin(t * 40) * 10 : 0;
  const face = faceOf(p, pose);
  return <g transform={`translate(0 ${lift})`}>
    {!flying && <g fill="none" stroke={beak} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round">
      <path d="M-34 -66 V-10 M-58 -2 L-34 -10 L-10 -2" /><path d="M34 -66 V-10 M10 -2 L34 -10 L58 -2" />
    </g>}
    <path d="M-120 -176 L-218 -152 L-208 -112 L-118 -116Z" fill={wing} {...line} />
    <ellipse cy={-200} rx={138} ry={148} fill={main} {...line} />
    <ellipse cx={12} cy={-142} rx={84} ry={82} fill={belly} />
    <path d="M-14 -340 Q-34 -398 12 -394 Q2 -372 20 -344" fill={main} {...line} />
    <g transform={`translate(10 -254)`}>
      <Face {...face} mouth={0} skin={main} eyeSpacing={38} eyeY={-18} mouthY={30} />
      <g {...line} strokeWidth={6} fill={beak}>
        <path d={`M-30 ${26 + face.mouth * 18} L0 ${60 + face.mouth * 26} L30 ${26 + face.mouth * 18}Z`} />
        <path d="M-34 24 Q0 -2 34 24 L0 44Z" />
      </g>
    </g>
    <g transform={`rotate(${-flap - 8} -88 -216)`}>
      <path d="M-88 -216 Q-192 -218 -152 -106 Q-52 -116 -88 -216Z" fill={wing} {...line} />
    </g>
    {p.holding && <g transform="translate(16 -160)"><PropArt name={p.holding} size={120} /></g>}
  </g>;
};

export const Animal: React.FC<AnimalProps> = (p) => {
  const kind: AnimalKind = p.kind === "cat" || p.kind === "bird" ? p.kind : "dog";
  const moving = !!p.walking;
  const pose = moving ? (p.pose === "run" ? "run" : "walk") : p.pose ?? (p.talking ? "talk" : "idle");
  const dir = p.motion ? Math.max(-1, Math.min(1, p.motion[7])) : p.facing === "left" ? -1 : 1;
  const hs = p.look?.height ?? 1;
  const emoteX = kind === "bird" ? 150 : 250, emoteY = kind === "bird" ? -400 : pose === "sleep" ? -230 : -470;
  const uid = sid(useId());
  // the same light as the human actors: a cel shade on the body and a soft shadow on the ground
  return <g transform={`scale(${hs}) scale(${dir} 1)`}>
    <defs><CelFilter id={`an${uid}`} depth={16} opacity={0.2} /></defs>
    <GroundShadow id={`ag${uid}`} x={12} y={2} rx={kind === "bird" ? 110 : 215} ry={kind === "bird" ? 16 : 22} opacity={pose === "fly" ? 0.14 : 0.32} />
    <g filter={`url(#an${uid})`}>{kind === "bird" ? <Bird {...p} pose={pose} moving={moving} /> : <Pet {...p} kind={kind} pose={pose} moving={moving} />}</g>
    {p.emote && <g transform={`translate(${emoteX} ${emoteY}) scale(${dir < 0 ? -1.3 : 1.3} 1.3)`}><Emote kind={p.emote} t={p.emoteT ?? 0} /></g>}
  </g>;
};
