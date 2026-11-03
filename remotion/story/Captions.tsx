import React from "react";
import type { Word, Storyboard } from "./types";
import { FONT, INK } from "./theme";
import { prog, ease } from "./anim";
import { dirOf } from "./Elements";
import { frameSpec, rcx, rcy, rw } from "./frame";

type Group = { words: Word[]; s: number; e: number };

export const groupWords = (words: Word[], maxChars: number, cuts: number[]): Group[] => {
  const groups: Group[] = [];
  let cur: Word[] = [];
  let len = 0;
  const flush = () => {
    if (cur.length) groups.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e });
    cur = [];
    len = 0;
  };
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = cur[cur.length - 1];
    const crossesCut = prev && cuts.some((c) => prev.e <= c + 0.01 && w.s >= c - 0.01);
    const gap = prev ? w.s - prev.e : 0;
    if (cur.length && (len + w.w.length + 1 > maxChars || gap > 0.55 || crossesCut || /[.!?؟،,:;]$/.test(prev.w) && len > maxChars * 0.45)) flush();
    cur.push(w);
    len += w.w.length + 1;
  }
  flush();
  return groups;
};

export const Captions: React.FC<{ sb: Storyboard; words: Word[]; time: number; W: number; H: number; groups: Group[] }> = ({ sb, time, W, H, groups }) => {
  const cfg = sb.captions ?? {};
  if (cfg.enabled === false || !groups.length) return null;
  const portrait = H > W;
  const dir = dirOf(sb.language);
  // active group: the last one that has started and has not yet been replaced
  let gi = -1;
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].s - 0.05 <= time) gi = i;
    else break;
  }
  if (gi < 0) return null;
  const g = groups[gi];
  const next = groups[gi + 1];
  const hideAt = Math.min(g.e + 0.6, next ? next.s - 0.05 : Infinity);
  if (time > hideAt) return null;
  const size = portrait ? 74 : 58;
  const band = frameSpec(W, H, true).captionBand!;
  const y = cfg.position !== undefined ? cfg.position * H : rcy(band);
  const enter = prog(time, g.s - 0.05, 0.22, "back.out(2)");
  const style = cfg.style ?? (portrait ? "pop" : "box");
  return (
    <div style={{ position: "absolute", left: rcx(band), width: rw(band), top: y, transform: "translate(-50%, -50%)", display: "flex", justifyContent: "center", zIndex: 50, pointerEvents: "none" }}>
      <div
        data-box="captions"
        dir={dir}
        style={{
          maxWidth: rw(band),
          textAlign: "center",
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.25,
          transform: `scale(${0.85 + 0.15 * enter})`,
          opacity: Math.min(1, enter * 1.5),
          padding: style === "box" ? `${size * 0.1}px ${size * 0.45}px ${size * 0.02}px` : 0,
          background: style === "box" ? "rgba(20,18,24,0.72)" : "transparent",
          borderRadius: size * 0.35,
        }}
      >
        {g.words.map((w, i) => {
          const active = time >= w.s - 0.03 && time < (g.words[i + 1]?.s ?? w.e + 0.3);
          const spoken = time >= w.s;
          const k = active ? ease("back.out(3)")(Math.min(1, (time - w.s + 0.03) / 0.16)) : 0;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: `0 ${size * 0.22}px`,
                color: active ? "#ffd23f" : style === "box" ? (spoken ? "#ffffff" : "rgba(255,255,255,0.75)") : "#ffffff",
                WebkitTextStroke: style === "box" ? undefined : `${size * 0.14}px ${INK}`,
                paintOrder: "stroke fill",
                transform: `scale(${1 + 0.12 * k}) translateY(${-4 * k}px)`,
                textShadow: style === "box" ? undefined : `0 ${size * 0.08}px 0 rgba(0,0,0,0.35)`,
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
