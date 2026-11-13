import type { Look } from "./theme";
import type { Expression } from "./Face";
import type { Pose } from "./Character";
import type { Enter } from "./anim";
import type { BgSpec } from "./Backgrounds";

/** `at` = seconds from the scene start (the planner turns word references into numbers). */
export type At = number;

/** Travel during a scene. x, y are frame fractions; at and duration are seconds. */
export type Move = {
  at: At; duration: number; x: number; y?: number;
  until?: At; // instead of duration: arrive on this word or clip
  pose?: "walk" | "run";
  ease?: string;
  rotate?: number; // degrees to end at (a fall, a tumble)
  arc?: number; // height of a jump, as a fraction of the frame height
  steps?: number; // climb in this many equal steps; arc is then the height of each hop
  facing?: "left" | "right" | "keep"; // default: turn to the direction of travel
};

export type CastMember = { preset?: string; look?: Look; name?: string; kind?: "human" | "dog" | "cat" | "bird" };

export type CharRef = {
  who: string; // cast id
  x?: number; y?: number; size?: number; // x,y = 0..1 of the frame (y = feet), size = height in units of min(W,H)
  expression?: Expression;
  pose?: Pose;
  facing?: "left" | "right";
  enter?: Enter;
  at?: At;
  out?: At;
  emote?: string;
  emoteAt?: At;
  holding?: string;
  walkFrom?: number; // x (0..1) to walk in from
  lookAt?: { x: number; y: number };
  look?: Look;
  zIndex?: number;
  move?: Move[];
};

export type PropRef = {
  zIndex?: number;
  move?: Move[];
  anchor?: "center" | "bottom"; // bottom: y is the floor it stands on
  name: string;
  x?: number; y?: number; size?: number; // size = width in units of min(W,H)
  face?: Expression | boolean;
  talking?: boolean; // prop speaks (lip-sync) instead of a character
  at?: At; out?: At;
  enter?: Enter;
  color?: string; color2?: string;
  label?: string;
  motion?: "float" | "spin" | "pulse" | "shake" | "orbit" | "bounce" | "none";
  rotate?: number;
  flip?: boolean;
};

export type TextRef = {
  text: string;
  style?: "title" | "label" | "note" | "big" | "tag" | "date" | "quote";
  x?: number; y?: number; size?: number; // size = font px at 1080 units
  color?: string;
  at?: At; out?: At;
  enter?: Enter;
  rotate?: number;
};

export type Item = { prop?: string; label?: string; text?: string; face?: Expression | boolean; color?: string; image?: string; at?: At };

export type Action = {
  at: At;
  who: string;
  pose?: Pose;
  expression?: Expression;
  emote?: string;
  facing?: "left" | "right";
  lookAt?: { x: number; y: number };
  speaker?: boolean;
  look?: Look; // a costume change from this moment on
  holding?: string; // pick something up; "" puts it down
};

export type Scene = {
  id?: string;
  start: number;
  end: number;
  text?: string;
  layout?: string;
  bg?: BgSpec | string;
  speaker?: string; // cast id or prop name that lip-syncs; "none" = nobody
  characters?: CharRef[];
  props?: PropRef[];
  texts?: TextRef[];
  title?: string;
  subtitle?: string;
  detail?: string;
  bubble?: { who?: string; text: string; kind?: "speech" | "thought"; at?: At; prop?: string };
  items?: Item[];
  symbol?: string; // compare: vs | = | ≠ | > | <
  number?: { value: number; from?: number; prefix?: string; suffix?: string; label?: string; decimals?: number; group?: boolean; at?: At };
  image?: { src: string; caption?: string; at?: At; fit?: "contain" | "cover" };
  /**
   * zoom/pan run over the whole scene. "on" aims at a cast member's face and centres them (a close shot).
   * moves change the shot inside the scene: at a time, to a zoom, onto a character (on) or a point (focus);
   * duration 0 is a cut, the default 0.55 s a push. tilt is a slow roll in degrees; drift (default on) is a hand-held sway.
   */
  camera?: { zoom?: [number, number]; pan?: [number, number]; shake?: At[]; punch?: At[]; focus?: { x: number; y: number }; on?: string; tilt?: [number, number]; drift?: boolean; moves?: { at: At; zoom?: number; on?: string; focus?: { x: number; y: number }; duration?: number }[] };
  /** The scene's lighting. Default: chosen from the background (day outdoors, warm indoors, night at night). */
  light?: "day" | "warm" | "cool" | "dusk" | "night" | "spot" | "none";
  transition?: "cut" | "whip" | "iris" | "flash" | "zoom" | "fade" | "slide";
  actions?: Action[];
  sfx?: { at: At; name: string; gain?: number }[];
  mirror?: boolean;
};

export type Word = { w: string; s: number; e: number };

export type Storyboard = {
  version: number;
  title?: string;
  language?: string; // "ar" | "en" | ...
  fps?: number;
  duration: number;
  /** The project's own drawings (props/*.svg), filled in by the pipeline: name → SVG text. */
  customProps?: Record<string, string>;
  dialogue?: { who: string; start: number; end: number; clip?: number; text?: string }[];
  cast: Record<string, CastMember>;
  scenes: Scene[];
  captions?: { enabled?: boolean; style?: "pop" | "box" | "plain"; position?: number; maxChars?: number };
  watermark?: string;
  hook?: string;
  directedBy?: string;
};

export type RenderProps = {
  storyboard: Storyboard;
  words: Word[];
  mouth: number[]; // per-frame lip-sync 0..100
  audio?: string; // file in public dir
  format: "youtube" | "shorts" | "square";
  width?: number;
  height?: number;
};
