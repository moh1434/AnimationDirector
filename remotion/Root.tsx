import React from "react";
import { Composition } from "remotion";
import { DidYouKnow, type DidYouKnowProps } from "./compositions/DidYouKnow";
import { StoryVideo, FORMATS } from "./story/StoryVideo";
import { Library } from "./story/Library";
import type { RenderProps } from "./story/types";
import { DEMO_PROPS } from "./story/demo";

// StoryVideo is the voice-led cartoon pipeline. `node pipeline/cli.mjs make <project>`
// builds its props (storyboard + word timings + lip-sync) and renders it.
// In Studio, the project's render.json is passed with --props.
const meta = ({ props }: { props: RenderProps }) => {
  const fps = props.storyboard?.fps ?? 60;
  const f = FORMATS[props.format ?? "youtube"] ?? FORMATS.youtube;
  return {
    durationInFrames: Math.max(1, Math.ceil((props.storyboard?.duration ?? 5) * fps)),
    fps,
    width: props.width ?? f.width,
    height: props.height ?? f.height,
  };
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="StoryVideo"
        component={StoryVideo as any}
        durationInFrames={600}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={DEMO_PROPS as any}
        calculateMetadata={meta as any}
      />
      <Composition
        id="StoryVideoShorts"
        component={StoryVideo as any}
        durationInFrames={600}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{ ...DEMO_PROPS, format: "shorts" } as any}
        calculateMetadata={meta as any}
      />
      <Composition id="Library" component={Library as any} durationInFrames={240} fps={30} width={1920} height={1080} defaultProps={{ page: "props" }} />
      <Composition id="LibraryCharacters" component={Library as any} durationInFrames={240} fps={30} width={1920} height={1080} defaultProps={{ page: "characters" }} />
      {/* Original sample, unchanged */}
      <Composition
        id="DidYouKnow"
        component={DidYouKnow}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ kicker: "Did you know...", fact: "Octopuses have three hearts." } satisfies DidYouKnowProps}
      />
    </>
  );
};
