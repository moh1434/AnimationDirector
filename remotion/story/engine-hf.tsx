// HyperFrames build of the frame clock: same API as engine.ts, driven by a paused GSAP
// timeline (see hf-entry.tsx) instead of Remotion. Used only by `pipeline/hyperframes.mjs`.
import React, { createContext, useContext } from "react";

type Clock = { frame: number; fps: number; width: number; height: number; durationInFrames: number };
export const ClockCtx = createContext<Clock>({ frame: 0, fps: 30, width: 1920, height: 1080, durationInFrames: 1 });
const OffsetCtx = createContext(0);

export const useCurrentFrame = () => useContext(ClockCtx).frame - useContext(OffsetCtx);
export const useVideoConfig = () => {
  const c = useContext(ClockCtx);
  return { fps: c.fps, width: c.width, height: c.height, durationInFrames: c.durationInFrames, id: "story" };
};
export const AbsoluteFill: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", ...style }}>{children}</div>
);
export const Sequence: React.FC<{ from?: number; durationInFrames?: number; children?: React.ReactNode; name?: string }> = ({ from = 0, durationInFrames = Infinity, children }) => {
  const parent = useContext(OffsetCtx);
  const abs = useContext(ClockCtx).frame;
  const local = abs - parent - from;
  if (local < 0 || local >= durationInFrames) return null;
  return (
    <OffsetCtx.Provider value={parent + from}>
      <AbsoluteFill>{children}</AbsoluteFill>
    </OffsetCtx.Provider>
  );
};
export const Img: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (p) => <img {...p} />;
export const Audio: React.FC<any> = () => null; // audio is a HyperFrames <audio> clip in index.html
export const staticFile = (p: string) => p.replace(/^\/+/, "");
export const interpolate = (x: number, inR: number[], outR: number[]) => {
  const t = Math.min(1, Math.max(0, (x - inR[0]) / (inR[1] - inR[0])));
  return outR[0] + (outR[1] - outR[0]) * t;
};
export const delayRender = (_l?: string) => 0;
export const continueRender = (_h: number) => {};
export const ENGINE = "hyperframes";
