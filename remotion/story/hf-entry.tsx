// Browser entry for the HyperFrames export: React renders the same StoryVideo, and a paused
// GSAP timeline registered on window.__timelines drives the frame clock when HyperFrames seeks.
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { StoryVideo } from "./StoryVideo";
import { ClockCtx } from "./engine-hf";

declare global {
  interface Window { __timelines: Record<string, any>; __STORY: any }
}
const props = window.__STORY;
const fps = props.storyboard.fps ?? 30;
const width = props.width, height = props.height;
const duration = props.storyboard.duration;
const durationInFrames = Math.ceil(duration * fps);
const root = createRoot(document.getElementById("stage")!);
let last = -1;
const draw = (frame: number) => {
  if (frame === last) return;
  last = frame;
  flushSync(() => {
    root.render(
      <ClockCtx.Provider value={{ frame, fps, width, height, durationInFrames }}>
        <StoryVideo {...props} />
      </ClockCtx.Provider>,
    );
  });
};
draw(0);
const state = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(state, { t: duration, duration, ease: "none", onUpdate: () => draw(Math.min(durationInFrames - 1, Math.floor(state.t * fps + 1e-6))) }, 0);
window.__timelines = window.__timelines || {};
window.__timelines["story"] = tl;
tl.seek(0);
