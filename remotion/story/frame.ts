// The design grid for each output shape: safe areas, regions, type scale and spacing.
// Every layout decision in Layout.ts is made from these numbers, never from ad-hoc pixels,
// so YouTube and Shorts each get a deliberate composition (see .claude/skills/layout-composition).

export type Rect = { x0: number; y0: number; x1: number; y1: number };
export const rw = (r: Rect) => r.x1 - r.x0;
export const rh = (r: Rect) => r.y1 - r.y0;
export const rcx = (r: Rect) => (r.x0 + r.x1) / 2;
export const rcy = (r: Rect) => (r.y0 + r.y1) / 2;

export type TypeScale = {
  caption: number; // burned-in word captions
  label: number; // tags under objects, step labels
  body: number; // bubbles, notes
  h3: number; // name-card subtitle, small headings
  h2: number; // headings above a stage
  h1: number; // a title inside a scene
  display: number; // a title card
  number: number; // a counting figure
};

export type FrameSpec = {
  W: number;
  H: number;
  U: number; // min(W, H): 1080 for both 16:9 and 9:16
  portrait: boolean;
  /** Where subjects and text must stay (characters may still stand on the bottom edge). */
  safe: Rect;
  /** Stricter rectangle for text (keeps clear of platform UI on Shorts/Reels/TikTok). */
  textSafe: Rect;
  /** Burned-in captions band (reserved: nothing important goes here). */
  captionBand: Rect | null;
  /** The y of the characters' feet. */
  ground: number;
  type: TypeScale;
  gap: { xs: number; s: number; m: number; l: number; xl: number };
};

/**
 * 16:9 — title-safe margins of 5 %; headlines ≥ 5 % of the frame height.
 * 9:16 — the top ~7 % (status bar / channel name), the bottom ~20 % (description, buttons) and the
 * right edge (like / comment / share column) are covered by the app UI, so text keeps out of them.
 */
export function frameSpec(W: number, H: number, captionsOn: boolean): FrameSpec {
  const portrait = H > W * 1.1;
  const U = Math.min(W, H);
  if (portrait) {
    const safe = { x0: W * 0.055, y0: H * 0.065, x1: W * 0.945, y1: H * 0.995 };
    const textSafe = { x0: W * 0.065, y0: H * 0.075, x1: W * 0.88, y1: H * 0.8 };
    return {
      W, H, U, portrait, safe, textSafe,
      captionBand: captionsOn ? { x0: W * 0.06, y0: H * 0.485, x1: W * 0.94, y1: H * 0.575 } : null,
      ground: H * 0.985,
      // anchored on the frame WIDTH: a phone shows 1080 px across, so small text is the risk
      type: { caption: 74, label: 56, body: 56, h3: 64, h2: 80, h1: 100, display: 136, number: 210 },
      gap: { xs: 12, s: 24, m: 40, l: 64, xl: 96 },
    };
  }
  const safe = { x0: W * 0.05, y0: H * 0.05, x1: W * 0.95, y1: H * 0.995 };
  const textSafe = { x0: W * 0.05, y0: H * 0.05, x1: W * 0.95, y1: H * 0.95 };
  return {
    W, H, U, portrait, safe, textSafe,
    captionBand: captionsOn ? { x0: W * 0.15, y0: H * 0.835, x1: W * 0.85, y1: H * 0.94 } : null,
    ground: H * 0.97,
    type: { caption: 58, label: 48, body: 50, h3: 58, h2: 74, h1: 94, display: 150, number: 230 },
    gap: { xs: 10, s: 20, m: 36, l: 56, xl: 88 },
  };
}

/** Height a Tag (label) occupies, including its border and shadow. */
export const tagHeight = (size: number) => size * 1.6;

/** Seconds on-screen text should stay readable: words / 3 + 1 (after it has animated in). */
export const readTime = (text: string) => text.trim().split(/\s+/).filter(Boolean).length / 3 + 1;
