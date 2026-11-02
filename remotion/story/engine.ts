// Thin abstraction over the frame clock. The Remotion build uses this file;
// the HyperFrames build aliases it to engine-hf.tsx so the SAME scene code can be
// driven by a paused GSAP timeline instead.
export {
  AbsoluteFill,
  Sequence,
  Img,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  delayRender,
  continueRender,
} from "remotion";
export const ENGINE = "remotion";
