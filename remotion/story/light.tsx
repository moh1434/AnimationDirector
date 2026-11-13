// Scene lighting: one light (upper left) for every scene, so flat drawings sit in a lit space.
// Two layers: <LightBehind> goes over the background and under the actors (sun bloom, light shafts,
// a darker floor), <Grade> goes over the whole picture (vignette, warm-to-cool colour grade, grain).
// Everything is gradients: no blur filters, cheap in both renderers, and a pure function of t.
import React from "react";
import { staticFile } from "./engine";

export type LightMood = "day" | "warm" | "cool" | "dusk" | "night" | "spot" | "none";

type Rig = { bloom: string; bloomAt: [number, number]; shafts: number; floor: string; warm: string; cold: string; vignette: number; tint?: string };
const RIGS: Record<Exclude<LightMood, "none">, Rig> = {
  day: { bloom: "rgba(255,246,205,0.55)", bloomAt: [0.16, 0.06], shafts: 0.07, floor: "rgba(40,28,92,0.07)", warm: "rgba(255,238,180,0.34)", cold: "rgba(70,60,170,0.13)", vignette: 0.24 },
  warm: { bloom: "rgba(255,214,150,0.6)", bloomAt: [0.2, 0.1], shafts: 0.09, floor: "rgba(80,30,60,0.09)", warm: "rgba(255,210,140,0.4)", cold: "rgba(120,50,110,0.14)", vignette: 0.28 },
  cool: { bloom: "rgba(215,236,255,0.5)", bloomAt: [0.2, 0.06], shafts: 0.05, floor: "rgba(20,40,110,0.09)", warm: "rgba(210,235,255,0.3)", cold: "rgba(40,50,150,0.16)", vignette: 0.26 },
  dusk: { bloom: "rgba(255,190,140,0.55)", bloomAt: [0.22, 0.42], shafts: 0.06, floor: "rgba(70,30,90,0.2)", warm: "rgba(255,170,120,0.4)", cold: "rgba(90,50,150,0.3)", vignette: 0.38 },
  night: { bloom: "rgba(150,170,255,0.2)", bloomAt: [0.78, 0.08], shafts: 0, floor: "rgba(8,10,50,0.1)", warm: "rgba(150,170,255,0.2)", cold: "rgba(10,12,60,0.2)", vignette: 0.34 },
  spot: { bloom: "rgba(255,244,210,0.5)", bloomAt: [0.5, 0.3], shafts: 0, floor: "rgba(10,8,40,0.3)", warm: "rgba(255,240,200,0.2)", cold: "rgba(20,14,70,0.4)", vignette: 0.62 },
};

/** Which light a scene gets when the storyboard does not say: from the background's type and time. */
export const moodFor = (bgType: string | undefined, time: string | undefined, asked?: LightMood): LightMood => {
  if (asked) return asked;
  if (time === "night") return "night";
  if (time === "dusk") return "dusk";
  if (["space", "night", "dark"].includes(bgType ?? "")) return "night";
  if (["living_room", "kitchen", "room", "desk", "stage", "classroom", "workshop", "office"].includes(bgType ?? "")) return "warm";
  if (["sea", "lab", "airport", "underground"].includes(bgType ?? "")) return "cool";
  if (bgType === "image") return "none";
  return "day";
};

/** Over the background, under the actors: where the light comes from and where it does not reach. */
export const LightBehind: React.FC<{ mood: LightMood; W: number; H: number; t: number }> = ({ mood, W, H, t }) => {
  if (mood === "none") return null;
  const r = RIGS[mood];
  const [bx, by] = r.bloomAt;
  const breathe = 1 + Math.sin(t * 0.6) * 0.03; // the light is never perfectly still
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(${W * 0.95 * breathe}px ${W * 0.95 * breathe}px at ${bx * 100}% ${by * 100}%, ${r.bloom}, rgba(255,255,255,0) 70%)` }} />
      {r.shafts > 0 && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="shaftFade" x1="0" y1="0" x2="0.55" y2="1">
              <stop offset="0" stopColor="#fff8dc" stopOpacity={r.shafts * 2.2} />
              <stop offset="1" stopColor="#fff8dc" stopOpacity={0} />
            </linearGradient>
          </defs>
          {[[0.02, 0.2, 0.52], [0.3, 0.44, 0.84]].map(([a, b, c], i) => (
            <path key={i} d={`M${W * (bx - 0.12 + a * 0.3)} ${-20} L${W * (bx + a * 0.3 + 0.06)} ${-20} L${W * (c + 0.16 + Math.sin(t * 0.25 + i) * 0.01)} ${H * 0.78} L${W * (b + Math.sin(t * 0.25 + i) * 0.01)} ${H * 0.78}Z`} fill="url(#shaftFade)" />
          ))}
        </svg>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "38%", background: `linear-gradient(to bottom, rgba(0,0,0,0), ${r.floor})` }} />
    </div>
  );
};

/** Over everything in the scene: vignette, a warm-to-cool grade across the frame, and paper grain. */
export const Grade: React.FC<{ mood: LightMood; W: number; H: number; grain?: boolean }> = ({ mood, W, H, grain = true }) => {
  if (mood === "none") return null;
  const r = RIGS[mood];
  const u = Math.min(W, H) / 1080;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "soft-light", background: `linear-gradient(140deg, ${r.warm} 0%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, ${r.cold} 100%)` }} />
      {r.tint && <div style={{ position: "absolute", inset: 0, background: r.tint }} />}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 85% 75% at 46% 44%, rgba(18,10,48,0) 52%, rgba(18,10,48,${r.vignette}) 100%)` }} />
      {grain && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("assets/grain.png")})`, backgroundSize: `${512 * u}px`, opacity: 0.06, mixBlendMode: "multiply" }} />}
    </div>
  );
};
