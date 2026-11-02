import React from "react";
import { INK, FONT, resolveColor } from "./theme";
import { enterStyle, exitStyle, prog, Enter, clamp } from "./anim";
import { Img, staticFile } from "./engine";

export const dirOf = (lang?: string) => (["ar", "fa", "ur", "he"].includes((lang ?? "").slice(0, 2)) ? "rtl" : "ltr");

/** Absolutely positioned wrapper with an entrance animation, centred on (x,y) px. */
export const Pop: React.FC<{
  x: number; y: number; t: number; at?: number; out?: number; enter?: Enter; rotate?: number; children: React.ReactNode; z?: number; anchor?: "center" | "bottom";
}> = ({ x, y, t, at = 0, out, enter = "pop", rotate = 0, children, z = 1, anchor = "center" }) => {
  const e = enterStyle(t, at, enter);
  const o = exitStyle(t, out);
  if (e.opacity <= 0 || o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, zIndex: z,
        transform: `translate(-50%, ${anchor === "bottom" ? "-100%" : "-50%"}) translate(${e.x}px, ${e.y}px) rotate(${rotate + e.r}deg) scale(${e.sx * o}, ${e.sy * o})`,
        transformOrigin: anchor === "bottom" ? "50% 100%" : "50% 50%",
        opacity: e.opacity,
      }}
    >
      {children}
    </div>
  );
};

const outlineText = (px: number, color = INK) => ({
  WebkitTextStroke: `${Math.max(2, px * 0.09)}px ${color}`,
  paintOrder: "stroke fill" as const,
});

/** Big kinetic title: words pop in one after another. */
export const TitleText: React.FC<{ text: string; t: number; at: number; size: number; color?: string; dir: string; maxWidth: number; stroke?: string; font?: string; stagger?: number }> = ({
  text, t, at, size, color = "#fff", dir, maxWidth, stroke = INK, font = FONT.display, stagger = 0.09,
}) => {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div dir={dir} style={{ maxWidth, textAlign: "center", lineHeight: 1.15, fontFamily: font, fontSize: size, color, ...outlineText(size, stroke), textShadow: `0 ${size * 0.06}px 0 rgba(0,0,0,0.25)` }}>
      {words.map((w, i) => {
        const e = enterStyle(t, at + i * stagger, "pop");
        return (
          <span key={i} style={{ display: "inline-block", margin: `0 ${size * 0.24}px`, transform: `scale(${e.sx}, ${e.sy}) translateY(${(1 - Math.min(1, e.sy)) * 20}px)`, opacity: e.opacity }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Tag: React.FC<{ text: string; size: number; color?: string; bg?: string; dir: string; rotate?: number }> = ({ text, size, color = INK, bg = "#fff", dir, rotate = 0 }) => (
  <div dir={dir} style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: size, color, background: bg, border: `${Math.max(4, size * 0.11)}px solid ${INK}`, borderRadius: size * 0.45, padding: `${size * 0.05}px ${size * 0.45}px ${size * 0.0}px`, whiteSpace: "nowrap", transform: `rotate(${rotate}deg)`, boxShadow: `0 ${size * 0.12}px 0 rgba(0,0,0,0.18)`, lineHeight: 1.45 }}>
    {text}
  </div>
);

export const Note: React.FC<{ text: string; size: number; color?: string; dir: string; maxWidth: number; align?: "center" | "start" }> = ({ text, size, color = INK, dir, maxWidth, align = "center" }) => (
  <div dir={dir} style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: size, color, maxWidth, textAlign: align, lineHeight: 1.3 }}>{text}</div>
);

export const Bubble: React.FC<{ text: string; size: number; dir: string; maxWidth: number; kind?: "speech" | "thought"; tail?: "left" | "right" | "down-left" | "down-right"; children?: React.ReactNode; minW?: number; minH?: number }> = ({
  text, size, dir, maxWidth, kind = "speech", tail = "down-left", children, minW, minH,
}) => {
  const bw = Math.max(5, size * 0.13);
  const thought = kind === "thought";
  return (
    <div style={{ position: "relative" }}>
      <div dir={dir} style={{
        background: "#fff", border: `${bw}px solid ${INK}`, borderRadius: thought ? "50%" : size * 0.9,
        padding: thought ? `${size * 1.1}px ${size * 1.4}px` : `${size * 0.45}px ${size * 0.8}px`, maxWidth, minWidth: minW, minHeight: minH,
        fontFamily: FONT.body, fontWeight: 700, fontSize: size, color: INK, textAlign: "center", lineHeight: 1.3,
        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 ${size * 0.15}px 0 rgba(0,0,0,0.15)`,
      }}>
        {children ?? text}
      </div>
      {thought ? (
        <>
          <div style={{ position: "absolute", width: size * 0.9, height: size * 0.9, borderRadius: "50%", background: "#fff", border: `${bw}px solid ${INK}`, bottom: -size * 0.8, [tail.includes("right") ? "right" : "left"]: "18%" }} />
          <div style={{ position: "absolute", width: size * 0.5, height: size * 0.5, borderRadius: "50%", background: "#fff", border: `${bw}px solid ${INK}`, bottom: -size * 1.6, [tail.includes("right") ? "right" : "left"]: "10%" }} />
        </>
      ) : (
        <svg width={size * 2} height={size * 1.6} style={{ position: "absolute", bottom: -size * 1.6 + bw * 1.5, [tail.includes("right") ? "right" : "left"]: "18%", overflow: "visible" }} viewBox="0 0 100 80">
          <path d={tail.includes("right") ? "M10 0 L90 80 L60 0" : "M90 0 L10 80 L40 0"} fill="#fff" stroke={INK} strokeWidth={bw * (100 / (size * 2))} strokeLinejoin="round" />
          <path d={tail.includes("right") ? "M14 -6 L60 -6" : "M86 -6 L40 -6"} stroke="#fff" strokeWidth={bw * 2.4 * (100 / (size * 2))} />
        </svg>
      )}
    </div>
  );
};

export const NameCard: React.FC<{ name: string; subtitle?: string; detail?: string; t: number; at: number; dir: string; scale: number; align: "start" | "end" | "center" }> = ({ name, subtitle, detail, t, at, dir, scale, align }) => {
  const p1 = prog(t, at, 0.45, "back.out(1.6)");
  const p2 = prog(t, at + 0.25, 0.4, "power2.out");
  const p3 = prog(t, at + 0.45, 0.4, "power2.out");
  return (
    <div dir={dir} style={{ textAlign: align === "center" ? "center" : dir === "rtl" ? (align === "start" ? "right" : "left") : align === "start" ? "left" : "right", color: INK }}>
      <div style={{ fontFamily: FONT.display, fontSize: 110 * scale, lineHeight: 1.05, transform: `scale(${p1})`, transformOrigin: dir === "rtl" ? "right center" : "left center" }}>{name}</div>
      {subtitle && <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 46 * scale, opacity: p2, transform: `translateY(${(1 - p2) * 20}px)` }}>{subtitle}</div>}
      {detail && <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36 * scale, opacity: p3 * 0.8, marginTop: 6 * scale }}>{detail}</div>}
    </div>
  );
};

export const fmtNumber = (v: number, decimals = 0, group = true) =>
  v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: group });

export const NumberReveal: React.FC<{ value: number; from?: number; prefix?: string; suffix?: string; label?: string; decimals?: number; group?: boolean; t: number; at: number; size: number; dir: string; color?: string; lang?: string }> = ({
  value, from = 0, prefix = "", suffix = "", label, decimals = 0, group = true, t, at, size, dir, color = "#ffd23f",
}) => {
  const p = prog(t, at, 1.3, "power3.out");
  const v = from + (value - from) * p;
  const e = enterStyle(t, at, "pop");
  const pl = prog(t, at + 0.9, 0.4, "back.out(1.7)");
  return (
    <div style={{ textAlign: "center" }}>
      <div dir="ltr" style={{ fontFamily: FONT.display, fontSize: size, color, ...outlineText(size), lineHeight: 1, transform: `scale(${e.sx}, ${e.sy})`, textShadow: `0 ${size * 0.06}px 0 rgba(0,0,0,0.25)` }}>
        {prefix}{fmtNumber(v, decimals, group)}{suffix}
      </div>
      {label && (
        <div dir={dir} style={{ marginTop: size * 0.12, display: "inline-block", transform: `scale(${pl})` }}>
          <Tag text={label} size={size * 0.28} dir={dir} />
        </div>
      )}
    </div>
  );
};

/** Hand-drawn thick arrow that draws itself from (x1,y1) to (x2,y2). Coordinates in px. */
export const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number; at: number; color?: string; width?: number; curve?: number }> = ({ x1, y1, x2, y2, t, at, color = "#e53950", width = 18, curve = -0.15 }) => {
  const p = prog(t, at, 0.45, "power2.inOut");
  if (p <= 0) return null;
  const mx = (x1 + x2) / 2 - (y2 - y1) * curve;
  const my = (y1 + y2) / 2 + (x2 - x1) * curve;
  const len = Math.hypot(x2 - x1, y2 - y1) * 1.1;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const hs = width * 2.4;
  const hx = x2, hy = y2;
  const head = `M${hx - Math.cos(ang - 0.5) * hs} ${hy - Math.sin(ang - 0.5) * hs} L${hx} ${hy} L${hx - Math.cos(ang + 0.5) * hs} ${hy - Math.sin(ang + 0.5) * hs}`;
  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 3 }} width="100%" height="100%">
      <path d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} fill="none" stroke={INK} strokeWidth={width + 10} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
      <path d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
      {p > 0.92 && (
        <>
          <path d={head} fill="none" stroke={INK} strokeWidth={width + 10} strokeLinecap="round" strokeLinejoin="round" />
          <path d={head} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
};

export const Badge: React.FC<{ text: string; size: number; bg?: string; color?: string }> = ({ text, size, bg = "#e53950", color = "#fff" }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: bg, border: `${size * 0.06}px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, fontSize: size * 0.42, color, boxShadow: `0 ${size * 0.06}px 0 rgba(0,0,0,0.2)` }}>
    <span style={{ ...outlineText(size * 0.42), lineHeight: 1, marginTop: size * 0.06 }}>{text}</span>
  </div>
);

export const ImageCard: React.FC<{ src: string; w: number; h: number; t: number; caption?: string; dir: string; fit?: "contain" | "cover" }> = ({ src, w, h, t, caption, dir, fit = "cover" }) => {
  const kb = 1.04 + t * 0.012;
  const url = src.startsWith("http") || src.startsWith("data:") ? src : staticFile(src);
  return (
    <div style={{ background: "#fff", padding: w * 0.025, paddingBottom: caption ? w * 0.1 : w * 0.025, border: `6px solid ${INK}`, boxShadow: "0 14px 0 rgba(0,0,0,0.18)", transform: "rotate(-2deg)" }}>
      <div style={{ width: w, height: h, overflow: "hidden", border: `4px solid ${INK}`, background: "#ddd" }}>
        <Img src={url} style={{ width: "100%", height: "100%", objectFit: fit, transform: `scale(${clamp(kb, 1, 1.25)})` }} />
      </div>
      {caption && <div dir={dir} style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: w * 0.055, textAlign: "center", marginTop: w * 0.02, color: INK }}>{caption}</div>}
      <div style={{ position: "absolute", top: -18, left: "40%", width: w * 0.22, height: 36, background: "rgba(255,230,140,0.85)", transform: "rotate(-4deg)" }} />
    </div>
  );
};

export const NewsCard: React.FC<{ headline: string; kicker: string; w: number; dir: string; image?: string }> = ({ headline, kicker, w, dir, image }) => (
  <div dir={dir} style={{ width: w, background: "#fafafa", border: `7px solid ${INK}`, padding: w * 0.05, boxShadow: "0 16px 0 rgba(0,0,0,0.2)", transform: "rotate(1.5deg)", fontFamily: FONT.body, color: INK }}>
    <div style={{ background: "#e53950", color: "#fff", fontWeight: 800, fontSize: w * 0.075, padding: `0 ${w * 0.04}px`, display: "inline-block", border: `5px solid ${INK}` }}>{kicker}</div>
    <div style={{ fontFamily: FONT.display, fontSize: w * 0.095, lineHeight: 1.15, marginTop: w * 0.04 }}>{headline}</div>
    <div style={{ display: "flex", gap: w * 0.04, marginTop: w * 0.04, flexDirection: dir === "rtl" ? "row-reverse" : "row" }}>
      {image ? <Img src={staticFile(image)} style={{ width: w * 0.35, height: w * 0.26, objectFit: "cover", border: `4px solid ${INK}` }} /> : <div style={{ width: w * 0.35, height: w * 0.26, background: "#cfd8dc", border: `4px solid ${INK}` }} />}
      <div style={{ flex: 1 }}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ height: w * 0.025, background: "#b0bec5", borderRadius: 4, marginBottom: w * 0.025, width: `${100 - (i === 4 ? 40 : 0)}%` }} />)}
      </div>
    </div>
  </div>
);

export const textColorOn = (bg: string) => {
  const c = resolveColor(bg);
  const h = c.replace("#", "");
  if (h.length < 6) return INK;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 120 ? "#ffffff" : INK;
};
