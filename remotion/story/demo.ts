import type { RenderProps, Storyboard, Word } from "./types";

// Small built-in example so Remotion Studio shows something without a project.
const sb: Storyboard = {
  version: 1,
  title: "Demo",
  language: "en",
  fps: 30,
  duration: 12,
  cast: { host: { preset: "host" }, sci: { preset: "scientist" } },
  scenes: [
    { start: 0, end: 3, layout: "host_talk", bg: "mint", speaker: "host", characters: [{ who: "host", pose: "wave", expression: "excited" }], props: [{ name: "earth", face: "happy", at: 0.4 }], camera: { punch: [0.4] } },
    { start: 3, end: 6, layout: "compare", bg: "lilac", transition: "whip", speaker: "none", items: [{ prop: "sun", label: "Hot", face: "smug" }, { prop: "snowflake", label: "Cold" }], symbol: "VS" },
    { start: 6, end: 9, layout: "duo", bg: "yellow", transition: "iris", speaker: "sci", characters: [{ who: "host", expression: "confused", emote: "question" }, { who: "sci", pose: "explain", expression: "happy" }], bubble: { who: "sci", text: "It is all about heat!" } },
    { start: 9, end: 12, layout: "number", bg: "space", transition: "flash", speaker: "host", characters: [{ who: "host", pose: "point", expression: "surprised" }], number: { value: 6000, suffix: "°C", label: "Earth's core" }, props: [{ name: "fire", at: 0.2 }] },
  ],
};

const words: Word[] = "Hello there this is a tiny demo of the cartoon pipeline with captions and lip sync".split(" ").map((w, i) => ({ w, s: 0.3 + i * 0.7, e: 0.3 + i * 0.7 + 0.5 }));
const mouth = Array.from({ length: 12 * 30 }, (_, f) => Math.round(Math.max(0, Math.sin(f * 0.9) * Math.sin(f * 0.23)) * 90));

export const DEMO_PROPS: RenderProps = { storyboard: sb, words, mouth, format: "youtube" };
