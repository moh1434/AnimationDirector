import type { Look } from "./theme";
import type { Expression } from "./Face";
import type { Pose } from "./Character";
import type { Enter } from "./anim";
import type { BgSpec } from "./Backgrounds";

/** `at` = seconds from the scene start (the planner turns word references into numbers). */
export type At = number;

export type CastMember = { preset?: string; look?: Look; name?: string };

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
};

export type PropRef = {
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
  camera?: { zoom?: [number, number]; pan?: [number, number]; shake?: At[]; punch?: At[]; focus?: { x: number; y: number } };
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
