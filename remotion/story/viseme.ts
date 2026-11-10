// Lip shapes from the words being spoken. The voice's loudness opens the mouth (motion.ts);
// this adds the shape of the sound: lips shut on m/b/p, spread on "ee", rounded on "oo".
// It is a guess from spelling (English and Arabic letters), spread evenly over each word's time.
import type { MouthShape } from "./Face";

type Word = { w: string; s: number; e: number };

const SHUT = "mbpمب";
const TEETH = "fvف";
const ROUND = "ouwqوؤ";
const SPREAD = "eiyيىئإ";
const OPEN = "aاأآعحهh";

const shapeOf = (ch: string): MouthShape => {
  if (SHUT.includes(ch)) return { wide: 0, close: 1 };
  if (TEETH.includes(ch)) return { wide: 0.2, close: 0.6 };
  if (ROUND.includes(ch)) return { wide: -0.85, close: 0 };
  if (SPREAD.includes(ch)) return { wide: 0.8, close: 0 };
  if (OPEN.includes(ch)) return { wide: 0.15, close: 0 };
  return { wide: 0.1, close: 0.25 }; // other consonants: a little narrower
};

const REST: MouthShape = { wide: 0, close: 0 };
const lettersCache = new Map<string, string[]>();
const lettersOf = (w: string) => {
  let l = lettersCache.get(w);
  if (!l) { l = [...w.toLowerCase()].filter((c) => c.toLowerCase() !== c.toUpperCase() || (c >= "ء" && c <= "ي")); lettersCache.set(w, l); }
  return l;
};

const rawAt = (words: Word[], time: number): MouthShape => {
  // binary search for the last word that starts at or before `time`
  let lo = 0, hi = words.length - 1, k = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (words[mid].s <= time) { k = mid; lo = mid + 1; } else hi = mid - 1; }
  if (k < 0) return REST;
  const word = words[k];
  if (time >= word.e) return REST;
  const letters = lettersOf(word.w);
  if (!letters.length) return REST;
  const p = (time - word.s) / Math.max(1e-3, word.e - word.s);
  return shapeOf(letters[Math.min(letters.length - 1, Math.floor(p * letters.length))]);
};

/** Smoothed lip shape at `time` (seconds from the start of the video). */
export const mouthShapeAt = (words: Word[] | undefined, time: number): MouthShape => {
  if (!words?.length) return REST;
  let wide = 0, close = 0, total = 0;
  for (let i = -3; i <= 3; i++) {
    const weight = 4 - Math.abs(i);
    const s = rawAt(words, time + i * 0.018);
    wide += s.wide * weight; close += s.close * weight; total += weight;
  }
  return { wide: wide / total, close: close / total };
};
