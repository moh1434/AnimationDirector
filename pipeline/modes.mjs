// Video modes. A project picks one with "mode" in its video.json (default "story").
//   story     — the family series and other cartoon stories: remotion/story/StoryVideo.tsx
//   explainer — one narrator (Wendy by default) explains a topic: remotion/explainer/ExplainerVideo.tsx
// Both share the characters, props, settings and drawings in remotion/story/.
export const MODES = {
  story: { composition: "StoryVideo", folder: "family", host: "host" },
  explainer: { composition: "ExplainerVideo", folder: "explainer", host: "wendy" },
};

export const modeOf = (settings = {}) => {
  const m = settings.mode ?? "story";
  if (!MODES[m]) throw new Error(`video.json: "mode" must be one of ${Object.keys(MODES).join(", ")} (got ${JSON.stringify(m)})`);
  return m;
};

/** The Remotion composition that renders a project. */
export const compositionFor = (settings) => MODES[modeOf(settings)].composition;
