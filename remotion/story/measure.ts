// Text measurement with the real fonts (canvas measureText), so layouts can size and place text
// by its actual width instead of guessing. Falls back to an estimate outside a browser.
import { FONT } from "./theme";

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

const getCtx = () => {
  if (ctx) return ctx;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  ctx = c.getContext("2d");
  return ctx;
};

/** Width in px of a single line of text. */
export function textWidth(text: string, size: number, font: "body" | "display" = "body", weight = 800): number {
  const key = `${font}|${weight}|${size}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const c = getCtx();
  let w: number;
  if (c) {
    c.font = `${weight} ${size}px ${font === "display" ? FONT.display : FONT.body}`;
    w = c.measureText(text).width;
    // only cache once the web font is really in use (a fallback font measures differently)
    if ((document as any).fonts?.check?.(`${weight} ${size}px ${font === "display" ? "Lalezar" : "'Baloo Bhaijaan 2'"}`)) cache.set(key, w);
  } else {
    w = text.length * size * (font === "display" ? 0.5 : 0.56);
  }
  return w;
}

/** Width of a Tag (label) box: text + horizontal padding + border. */
export const tagWidth = (text: string, size: number) => textWidth(text, size, "body", 800) + size * 0.9 + size * 0.22;

/**
 * Largest font size (≤ max) at which `text` fits in `maxWidth` on at most `maxLines` lines,
 * breaking only between words. Used for titles so they never overflow or shrink to a word per line.
 */
export function fitText(text: string, maxWidth: number, max: number, min: number, maxLines = 2, font: "body" | "display" = "display", wordGap = 0.48): number {
  const words = text.split(/\s+/).filter(Boolean);
  for (let size = max; size >= min; size -= 4) {
    const gap = size * wordGap;
    let lines = 1, line = 0;
    let ok = true;
    for (const w of words) {
      const ww = textWidth(w, size, font, font === "display" ? 400 : 800);
      if (ww > maxWidth) { ok = false; break; }
      const add = line === 0 ? ww : line + gap + ww;
      if (add > maxWidth) { lines++; line = ww; } else line = add;
    }
    if (ok && lines <= maxLines) return size;
  }
  return min;
}
