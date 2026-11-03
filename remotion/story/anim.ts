import gsap from "gsap";

// GSAP's easing library, used as pure functions of progress (0..1) so every
// frame is deterministic in both renderers.
const cache = new Map<string, (p: number) => number>();
export const ease = (name: string = "power2.out") => {
  let f = cache.get(name);
  if (!f) {
    f = (gsap.parseEase(name) as (p: number) => number) || ((p: number) => p);
    cache.set(name, f);
  }
  return f;
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** progress of a tween that starts at `at` (s) and lasts `dur` (s), eased. */
export const prog = (t: number, at: number, dur: number, e = "power2.out") =>
  ease(e)(clamp((t - at) / Math.max(dur, 1e-6)));

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Deterministic pseudo-random in [0,1) from integers/strings. */
export const rand = (seed: number | string, n = 0) => {
  let h = 2166136261 ^ n;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return ((h >>> 0) % 100000) / 100000;
};

/** Hand-drawn "line boil": tiny jitter that changes every `step` frames. */
export const boil = (frame: number, seed: string | number, amp = 1, step = 4) => {
  const k = Math.floor(frame / step);
  return {
    dx: (rand(seed, k * 3) - 0.5) * 2 * amp,
    dy: (rand(seed, k * 3 + 1) - 0.5) * 2 * amp,
    rot: (rand(seed, k * 3 + 2) - 0.5) * 1.2 * amp,
  };
};

export type Enter =
  | "pop" | "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down"
  | "drop" | "grow" | "spin" | "none";

/** Entrance transform for an element appearing at `at` seconds. */
export const enterStyle = (t: number, at: number, kind: Enter = "pop", dist = 400) => {
  if (kind === "none") return { opacity: t >= at ? 1 : 0, sx: 1, sy: 1, x: 0, y: 0, r: 0 };
  if (t < at) return { opacity: 0, sx: 0.001, sy: 0.001, x: 0, y: 0, r: 0 };
  const dt = t - at;
  switch (kind) {
    case "fade": {
      const p = prog(t, at, 0.35, "power1.out");
      return { opacity: p, sx: 1, sy: 1, x: 0, y: 0, r: 0 };
    }
    case "grow": {
      const p = prog(t, at, 0.6, "power3.out");
      return { opacity: 1, sx: p, sy: p, x: 0, y: 0, r: 0 };
    }
    case "spin": {
      const p = prog(t, at, 0.55, "sine.out");
      return { opacity: 1, sx: p, sy: p, x: 0, y: 0, r: (1 - p) * -200 };
    }
    case "drop": {
      const p = prog(t, at, 0.42, "sine.out");
      return { opacity: prog(t, at, 0.18, "sine.out"), sx: 1, sy: 1, x: 0, y: (1 - p) * -dist * 0.18, r: 0 };
    }
    case "slide-left":
    case "slide-right":
    case "slide-up":
    case "slide-down": {
      const p = prog(t, at, 0.5, "sine.inOut");
      const d = (1 - p) * dist;
      const x = kind === "slide-left" ? -d : kind === "slide-right" ? d : 0;
      const y = kind === "slide-up" ? d : kind === "slide-down" ? -d : 0;
      return { opacity: clamp(dt / 0.12), sx: 1, sy: 1, x, y, r: 0 };
    }
    default: {
      // pop with squash & stretch
      const p = prog(t, at, 0.42, "back.out(0.5)");
      const sq = Math.sin(clamp(dt / 0.42) * Math.PI) * 0.035;
      return { opacity: 1, sx: p * (1 + sq), sy: p * (1 - sq * 0.8), x: 0, y: 0, r: 0 };
    }
  }
};

export const exitStyle = (t: number, out: number | undefined) => {
  if (out === undefined || t < out) return 1;
  return 1 - prog(t, out, 0.25, "power2.in");
};
