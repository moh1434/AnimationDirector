import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "./engine";
import { PROP_NAMES, PropArt } from "./Props";
import { Character, POSES, Pose } from "./Character";
import { EXPR, Expression } from "./Face";
import { PRESETS, FONT, INK } from "./theme";

/** Visual catalogue of everything the director can use (open it in Remotion Studio). */
export const Library: React.FC<{ page?: "props" | "characters" | "faces" }> = ({ page = "props" }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const t = frame / fps;
  if (page === "characters") {
    const names = Object.keys(PRESETS);
    const poses = Object.keys(POSES) as Pose[];
    const exprs = Object.keys(EXPR) as Expression[];
    const cols = 6;
    const cw = W / cols, ch = H / Math.ceil(names.length / cols);
    return (
      <AbsoluteFill style={{ background: "#c6f7ee" }}>
        {names.map((n, i) => {
          const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
          const pose = poses[(Math.floor(t / 1.5) + i) % poses.length];
          const ex = exprs[(Math.floor(t / 1.5) + i * 3) % exprs.length];
          const s = (ch * 0.78) / 760;
          return (
            <div key={n} style={{ position: "absolute", left: x, top: y, width: cw, height: ch }}>
              <svg width={cw} height={ch * 0.86} viewBox={`${-cw / 2 / s} ${-760} ${cw / s} ${(ch * 0.86) / s}`}>
                <Character look={PRESETS[n]} pose={pose} expression={ex} t={t} frame={frame} fps={fps} seed={i} talking={i % 3 === 0} mouth={Math.abs(Math.sin(t * 9 + i)) * 0.8} />
              </svg>
              <div style={{ textAlign: "center", fontFamily: FONT.body, fontWeight: 800, fontSize: 22, color: INK }}>{n} · {pose} · {ex}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    );
  }
  const cols = 12;
  const rows = Math.ceil(PROP_NAMES.length / cols);
  const cw = W / cols, ch = H / rows;
  return (
    <AbsoluteFill style={{ background: "#fff3a3" }}>
      {PROP_NAMES.map((n, i) => {
        const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
        const sz = Math.min(cw, ch) * 0.62;
        return (
          <div key={n} style={{ position: "absolute", left: x, top: y, width: cw, height: ch, textAlign: "center" }}>
            <svg width={cw} height={ch * 0.78} viewBox={`${-cw / 2} ${-ch * 0.39} ${cw} ${ch * 0.78}`}>
              <PropArt name={n} size={sz} t={t} face={i % 4 === 0 ? "happy" : undefined} />
            </svg>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 15, color: INK, marginTop: -6 }}>{n}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
