import React from "react";
import { LifeBackground, LIFE_BACKGROUNDS } from "./LifeBackgrounds";
import { EverydayBackground, EVERYDAY_BACKGROUNDS } from "./EverydayBackgrounds";
import { BG, INK, resolveColor } from "./theme";
import { rand } from "./anim";
import { Img, staticFile } from "./engine";

export type BgSpec = {
  type?: string; // solid|sky|space|night|desert|sea|city|room|lab|classroom|burst|grid|underground|paper|dark|image|gradient|stage|desk
  color?: string;
  color2?: string;
  image?: string;
};

const Stars: React.FC<{ W: number; H: number; n: number; t: number; seed?: string }> = ({ W, H, n, t, seed = "s" }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const x = rand(seed, i * 3) * W;
      const y = rand(seed, i * 3 + 1) * H;
      const r = 1.2 + rand(seed, i * 3 + 2) * 2.6;
      const tw = 0.55 + 0.45 * Math.sin(t * (1 + (i % 5)) + i);
      return <circle key={i} cx={x} cy={y} r={r * (H / 1080)} fill="#fff" opacity={tw} />;
    })}
  </g>
);

const Hills: React.FC<{ W: number; H: number; c1: string; c2: string }> = ({ W, H, c1, c2 }) => (
  <g>
    <path d={`M0 ${H * 0.72} Q${W * 0.22} ${H * 0.58} ${W * 0.45} ${H * 0.7} T${W} ${H * 0.66} V${H} H0Z`} fill={c2} />
    <path d={`M0 ${H * 0.82} Q${W * 0.3} ${H * 0.7} ${W * 0.62} ${H * 0.8} T${W} ${H * 0.78} V${H} H0Z`} fill={c1} />
  </g>
);

const Cloud: React.FC<{ x: number; y: number; s: number; o?: number }> = ({ x, y, s, o = 0.95 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <ellipse cx={0} cy={0} rx={90} ry={40} fill="#fff" />
    <ellipse cx={-50} cy={8} rx={60} ry={30} fill="#fff" />
    <ellipse cx={55} cy={10} rx={60} ry={28} fill="#fff" />
    <ellipse cx={10} cy={-26} rx={50} ry={36} fill="#fff" />
  </g>
);

export const Background: React.FC<{ spec: BgSpec; W: number; H: number; t: number; frame: number; seed?: string }> = ({ spec, W, H, t, seed = "bg" }) => {
  const type = spec.type ?? "solid";
  const c = resolveColor(spec.color, BG.mint);
  const u = H / 1080; // unit scale
  let content: React.ReactNode;
  switch (type) {
    case "office": case "airport":
      content = <LifeBackground type={type} W={W} H={H} color={spec.color} color2={spec.color2} />;
      break;
    case "forest": case "garden": case "kitchen": case "workshop":
      content = <EverydayBackground type={type} W={W} H={H} color={spec.color} color2={spec.color2} />;
      break;
    case "space": {
      const a = resolveColor(spec.color, "#2a1f5c");
      const b = resolveColor(spec.color2, "#0d0b1f");
      content = (
        <>
          <defs>
            <radialGradient id={`sp${seed}`} cx="50%" cy="45%" r="75%">
              <stop offset="0%" stopColor={a} />
              <stop offset="100%" stopColor={b} />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#sp${seed})`} />
          <ellipse cx={W * 0.25} cy={H * 0.3} rx={W * 0.3} ry={H * 0.22} fill="#b14bd8" opacity={0.12} />
          <ellipse cx={W * 0.78} cy={H * 0.72} rx={W * 0.32} ry={H * 0.2} fill="#3fa9f5" opacity={0.1} />
          <Stars W={W} H={H} n={Math.round(140 * (W * H) / (1920 * 1080))} t={t} seed={seed} />
        </>
      );
      break;
    }
    case "night": {
      content = (
        <>
          <rect width={W} height={H} fill={resolveColor(spec.color, "#1b2550")} />
          <Stars W={W} H={H * 0.7} n={80} t={t} seed={seed} />
          <circle cx={W * 0.82} cy={H * 0.2} r={70 * u} fill="#f6f1cf" />
          <Hills W={W} H={H} c1="#1f3a3a" c2="#284848" />
        </>
      );
      break;
    }
    case "sky": {
      const sky = resolveColor(spec.color, "#9fdcff");
      content = (
        <>
          <defs>
            <linearGradient id={`sk${seed}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sky} />
              <stop offset="100%" stopColor="#e9f8ff" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#sk${seed})`} />
          <Cloud x={((t * 12 * u + W * 0.15) % (W * 1.2)) - W * 0.1} y={H * 0.16} s={1.3 * u} />
          <Cloud x={((t * 7 * u + W * 0.7) % (W * 1.2)) - W * 0.1} y={H * 0.28} s={0.9 * u} />
          <Hills W={W} H={H} c1={resolveColor(spec.color2, "#7ed957")} c2="#a5e887" />
        </>
      );
      break;
    }
    case "desert": {
      content = (
        <>
          <defs>
            <linearGradient id={`ds${seed}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={resolveColor(spec.color, "#ff9f5a")} />
              <stop offset="100%" stopColor="#ffd9a0" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#ds${seed})`} />
          <circle cx={W * 0.75} cy={H * 0.3} r={90 * u} fill="#fff1b8" opacity={0.9} />
          <path d={`M0 ${H * 0.7} Q${W * 0.3} ${H * 0.6} ${W * 0.6} ${H * 0.72} T${W} ${H * 0.68} V${H} H0Z`} fill="#f2c46d" />
          <path d={`M0 ${H * 0.84} Q${W * 0.4} ${H * 0.74} ${W} ${H * 0.86} V${H} H0Z`} fill="#e7b257" />
        </>
      );
      break;
    }
    case "sea": {
      content = (
        <>
          <rect width={W} height={H} fill={resolveColor(spec.color, "#a8dcff")} />
          <Cloud x={W * 0.2} y={H * 0.18} s={u} />
          <rect y={H * 0.62} width={W} height={H * 0.38} fill="#3f8ff0" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M0 ${H * (0.68 + i * 0.1)} ${Array.from({ length: 12 }).map((_, k) => `q${W / 24} ${-14 * u} ${W / 12} 0`).join(" ")}`} transform={`translate(${Math.sin(t * 1.4 + i) * 20 * u} 0)`} stroke="#bfe8ff" strokeWidth={5 * u} fill="none" opacity={0.7} />
          ))}
        </>
      );
      break;
    }
    case "city": {
      const base = resolveColor(spec.color, "#ffcf9e");
      content = (
        <>
          <rect width={W} height={H} fill={base} />
          {Array.from({ length: 14 }).map((_, i) => {
            const w = W / 14;
            const h = H * (0.25 + rand(seed, i) * 0.35);
            return <rect key={i} x={i * w} y={H * 0.78 - h} width={w * 0.9} height={h} fill={["#7c86a8", "#8f99bb", "#6d7799"][i % 3]} stroke={INK} strokeWidth={4 * u} />;
          })}
          <rect y={H * 0.78} width={W} height={H * 0.22} fill="#5d6680" />
        </>
      );
      break;
    }
    case "room":
    case "desk":
    case "stage": {
      const wall = resolveColor(spec.color, "#f6e3c3");
      content = (
        <>
          <rect width={W} height={H} fill={wall} />
          <rect y={H * 0.8} width={W} height={H * 0.2} fill={resolveColor(spec.color2, "#c49a6c")} />
          <line x1={0} y1={H * 0.8} x2={W} y2={H * 0.8} stroke={INK} strokeWidth={5 * u} />
          {type === "room" && (
            <g>
              <rect x={W * 0.7} y={H * 0.16} width={W * 0.16} height={H * 0.3} fill="#bfe8ff" stroke={INK} strokeWidth={6 * u} />
              <line x1={W * 0.78} y1={H * 0.16} x2={W * 0.78} y2={H * 0.46} stroke={INK} strokeWidth={5 * u} />
              <line x1={W * 0.7} y1={H * 0.31} x2={W * 0.86} y2={H * 0.31} stroke={INK} strokeWidth={5 * u} />
            </g>
          )}
          {type === "stage" && (
            <g>
              <rect x={W * 0.05} y={H * 0.08} width={W * 0.9} height={H * 0.5} fill="#fff" stroke={INK} strokeWidth={6 * u} />
              <rect x={W * 0.05} y={H * 0.08} width={W * 0.9} height={14 * u} fill={INK} />
            </g>
          )}
        </>
      );
      break;
    }
    case "classroom": {
      content = (
        <>
          <rect width={W} height={H} fill={resolveColor(spec.color, "#f3e6c8")} />
          <rect x={W * 0.12} y={H * 0.1} width={W * 0.76} height={H * 0.52} rx={10 * u} fill="#2f5d4a" stroke="#8d5a3b" strokeWidth={18 * u} />
          <rect y={H * 0.82} width={W} height={H * 0.18} fill="#c49a6c" />
        </>
      );
      break;
    }
    case "lab": {
      content = (
        <>
          <rect width={W} height={H} fill={resolveColor(spec.color, "#dff3f0")} />
          {Array.from({ length: 10 }).map((_, i) => <line key={i} x1={(W / 10) * i} y1={0} x2={(W / 10) * i} y2={H * 0.72} stroke="#c3e2dc" strokeWidth={3 * u} />)}
          <rect y={H * 0.72} width={W} height={H * 0.06} fill="#eceff1" stroke={INK} strokeWidth={5 * u} />
          <rect y={H * 0.78} width={W} height={H * 0.22} fill="#90a4ae" />
        </>
      );
      break;
    }
    case "underground": {
      content = (
        <>
          <rect width={W} height={H} fill="#b07a4f" />
          <rect width={W} height={H * 0.18} fill="#7ed957" />
          <rect y={H * 0.16} width={W} height={H * 0.08} fill="#8a5a36" />
          {Array.from({ length: 40 }).map((_, i) => (
            <rect key={i} x={rand(seed, i) * W} y={H * 0.25 + rand(seed, i + 99) * H * 0.75} width={(10 + rand(seed, i + 7) * 18) * u} height={(10 + rand(seed, i + 3) * 14) * u} fill="#f5ead7" opacity={0.8} transform={`rotate(${rand(seed, i + 5) * 90})`} />
          ))}
        </>
      );
      break;
    }
    case "burst": {
      const a = resolveColor(spec.color, BG.black);
      const b = resolveColor(spec.color2, "#4b2a7a");
      content = (
        <>
          <rect width={W} height={H} fill={a} />
          <g transform={`translate(${W / 2} ${H / 2}) rotate(${t * 6})`}>
            {Array.from({ length: 28 }).map((_, i) => (
              <path key={i} d={`M0 0 L${Math.max(W, H)} ${-30 * u} L${Math.max(W, H)} ${30 * u}Z`} fill={b} opacity={i % 2 ? 0.0 : 0.55} transform={`rotate(${(i * 360) / 28})`} />
            ))}
          </g>
        </>
      );
      break;
    }
    case "grid": {
      const a = resolveColor(spec.color, "#24305e");
      content = (
        <>
          <rect width={W} height={H} fill={a} />
          {Array.from({ length: Math.ceil(W / (60 * u)) }).map((_, i) => <line key={`v${i}`} x1={i * 60 * u} y1={0} x2={i * 60 * u} y2={H} stroke="#ffffff" strokeOpacity={0.09} strokeWidth={2} />)}
          {Array.from({ length: Math.ceil(H / (60 * u)) }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 60 * u} x2={W} y2={i * 60 * u} stroke="#ffffff" strokeOpacity={0.09} strokeWidth={2} />)}
        </>
      );
      break;
    }
    case "gradient": {
      const a = resolveColor(spec.color, BG.lilac);
      const b = resolveColor(spec.color2, BG.purple);
      content = (
        <>
          <defs>
            <linearGradient id={`gr${seed}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={a} />
              <stop offset="100%" stopColor={b} />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#gr${seed})`} />
        </>
      );
      break;
    }
    case "dark":
      content = <rect width={W} height={H} fill={resolveColor(spec.color, BG.black)} />;
      break;
    case "paper":
      content = <rect width={W} height={H} fill={resolveColor(spec.color, BG.paper)} />;
      break;
    default:
      content = <rect width={W} height={H} fill={c} />;
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {content}
        <defs>
          <radialGradient id={`vg${seed}`} cx="50%" cy="50%" r="72%">
            <stop offset="60%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={type === "space" || type === "dark" ? 0.35 : 0.13} />
          </radialGradient>
        </defs>
        {![...EVERYDAY_BACKGROUNDS, ...LIFE_BACKGROUNDS].some(name => name === type) && <rect width={W} height={H} fill={`url(#vg${seed})`} />}
      </svg>
      {type === "image" && spec.image && (
        <Img src={spec.image.startsWith("http") ? spec.image : staticFile(spec.image)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      {/* paper grain, shared texture */}
      {![...EVERYDAY_BACKGROUNDS, ...LIFE_BACKGROUNDS].some(name => name === type) && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("assets/grain.png")})`, backgroundSize: `${512 * u}px`, opacity: type === "space" || type === "dark" || type === "burst" ? 0.05 : 0.11, mixBlendMode: "multiply" }} />}
    </div>
  );
};
