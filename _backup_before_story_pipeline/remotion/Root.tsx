import { Composition } from "remotion";
import { DidYouKnow, type DidYouKnowProps } from "./compositions/DidYouKnow";

// Portrait 1080x1920 for Shorts / Reels / TikTok. Change width/height for 16:9.
export const RemotionRoot = () => {
  return (
    <Composition
      id="DidYouKnow"
      component={DidYouKnow}
      durationInFrames={180}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={
        {
          kicker: "Did you know...",
          fact: "Octopuses have three hearts.",
        } satisfies DidYouKnowProps
      }
    />
  );
};
