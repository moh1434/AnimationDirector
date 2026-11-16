// whisper.cpp word times are loose: after a pause it often puts a word's start well before the sound
// (up to a second), and it can mistake a repeated word. The script's own segments (the clips of a
// multi-voice story, or the user's `start | end | text` lines) are exact, so a clip's words must lie
// inside its segment. When whisper placed a segment's words early or late as a block, this moves the
// block into the segment (its internal spacing is usually right) and squeezes it if it is then too long.

const LEAD = 0.06; // a clip's first word starts a moment after the clip does
const TOLERANCE = 0.15;

/**
 * words:    [{ w, s, e, seg }], times replaced by whisper's where `fixed[i]`
 * segments: [{ start, end }], indexed by words[i].seg
 * Returns the number of segments that were moved. Words are changed in place.
 */
export function fitWordsToSegments(words, segments, fixed = []) {
  const groups = new Map();
  words.forEach((w, i) => {
    if (fixed[i] !== undefined && !fixed[i]) return; // estimated words already lie in their segment
    if (!groups.has(w.seg)) groups.set(w.seg, []);
    groups.get(w.seg).push(i);
  });
  let moved = 0;
  for (const [k, idx] of groups) {
    const seg = segments?.[k];
    if (!seg || !Number.isFinite(seg.start) || !Number.isFinite(seg.end) || !idx.length) continue;
    const first = words[idx[0]], last = words[idx[idx.length - 1]];
    if (first.s >= seg.start - TOLERANCE && last.e <= seg.end + TOLERANCE) continue;
    const a = seg.start + LEAD, shift = a - first.s;
    for (const i of idx) { words[i].s += shift; words[i].e += shift; }
    const b = seg.end - 0.02, over = words[idx[idx.length - 1]].e - b;
    if (over > 0) {
      const k2 = Math.max(0.2, (b - a) / (words[idx[idx.length - 1]].e - a));
      for (const i of idx) { words[i].s = a + (words[i].s - a) * k2; words[i].e = a + (words[i].e - a) * k2; }
    }
    moved++;
  }
  // words stay in order, whatever happened above
  for (let i = 1; i < words.length; i++) if (words[i].s < words[i - 1].s) { words[i].e += words[i - 1].s - words[i].s; words[i].s = words[i - 1].s; }
  return moved;
}
