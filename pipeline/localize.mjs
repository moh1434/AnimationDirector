// Second-language version of a video: the same scenes, re-timed to the other voice.
//
// The English (source) storyboard is compiled (all "@word" references become seconds), then every
// time is carried over to the other voice with a map anchored on each sentence: where sentence i
// starts and ends in one voice ↔ where it starts and ends in the other. Times are then snapped to
// the nearest word of the new voice, so objects still pop on a word. On-screen text (titles, labels,
// bubbles…) comes from translations.json in the new project.

const TIME_KEYS = ["at", "out", "emoteAt"];
const r3 = (x) => Math.round(x * 1000) / 1000;

/** Piecewise-linear map from source time to target time, anchored on each sentence's spoken span. */
export function timeMap(srcWords, srcDur, dstWords, dstDur, nSeg) {
  const span = (words, i) => {
    const ws = words.filter((w) => w.seg === i);
    return ws.length ? [ws[0].s, ws[ws.length - 1].e] : null;
  };
  const pts = [[0, 0]];
  for (let i = 0; i < nSeg; i++) {
    const a = span(srcWords, i), b = span(dstWords, i);
    if (!a || !b) continue;
    pts.push([a[0], b[0]], [a[1], b[1]]);
  }
  pts.push([srcDur, dstDur]);
  pts.sort((p, q) => p[0] - q[0]);
  const mono = [pts[0]];
  for (const p of pts.slice(1)) {
    const last = mono[mono.length - 1];
    if (p[0] > last[0] + 1e-6 && p[1] >= last[1]) mono.push(p);
  }
  return (t) => {
    if (t <= mono[0][0]) return mono[0][1];
    for (let i = 1; i < mono.length; i++) {
      const [x0, y0] = mono[i - 1], [x1, y1] = mono[i];
      if (t <= x1) return y0 + ((t - x0) / (x1 - x0)) * (y1 - y0);
    }
    const [xa, ya] = mono[mono.length - 1];
    return ya + (t - xa);
  };
}

/** Strings that appear on screen and need translating. */
export function screenStrings(sb) {
  const out = new Set();
  const add = (s) => { if (typeof s === "string" && s.trim()) out.add(s.trim()); };
  add(sb.title);
  for (const s of sb.scenes ?? []) {
    add(s.title); add(s.subtitle); add(s.detail);
    (s.props ?? []).forEach((p) => add(p.label));
    (s.items ?? []).forEach((it) => { add(it.label); add(it.text); });
    (s.texts ?? []).forEach((t) => add(t.text));
    add(s.bubble?.text); add(s.number?.label); add(s.image?.caption);
  }
  return [...out];
}

/**
 * @param src      the source storyboard AFTER compile() (numeric starts and times)
 * @param ctx      { srcAnalysis, dstAnalysis, dstSegments, translations, lang, source }
 * @returns        { storyboard, missing, warnings }
 */
export function localizeStoryboard(src, { srcAnalysis, dstAnalysis, dstSegments, translations = {}, lang = "ar", source }) {
  const warnings = [];
  const nSrc = Math.max(0, ...(srcAnalysis.words ?? []).map((w) => (w.seg ?? -1) + 1));
  const nDst = dstSegments.length;
  if (nSrc && nSrc !== nDst)
    throw new Error(`The source has ${nSrc} sentences (time segments) but the ${lang} script has ${nDst}. Give both scripts the same number of segments, in the same order (sentence 1 ↔ sentence 1, …).`);
  const map = timeMap(srcAnalysis.words ?? [], srcAnalysis.duration, dstAnalysis.words ?? [], dstAnalysis.duration, nDst);
  const words = dstAnalysis.words ?? [];
  const srcWords = srcAnalysis.words ?? [];
  const nearest = (list, t, radius) => {
    let best = null;
    for (const w of list) if (Math.abs(w.s - t) <= radius && (!best || Math.abs(w.s - t) < Math.abs(best.s - t))) best = w;
    return best;
  };
  const snapTo = (t, radius) => nearest(words, t, radius);
  // A time tied to a word ("@money" → just before "money") moves to the word at the same place in the
  // same sentence of the other voice (3rd of 10 words → ~3rd of 12). Other times use the sentence map.
  const toDst = (t) => {
    const w = nearest(srcWords, t, 0.3);
    if (w && w.seg !== undefined) {
      const E = srcWords.filter((x) => x.seg === w.seg), A = words.filter((x) => x.seg === w.seg);
      if (A.length) {
        const k = E.indexOf(w);
        const j = Math.round((k * (A.length - 1)) / Math.max(1, E.length - 1));
        return { t: A[j].s - Math.min(0.12, Math.max(-0.12, w.s - t)), word: true };
      }
    }
    return { t: map(t), word: false };
  };
  const missing = new Set();
  const tr = (s) => {
    if (typeof s !== "string" || !s.trim()) return s;
    const v = translations[s.trim()];
    if (typeof v === "string" && v.trim()) return v;
    missing.add(s.trim());
    return s;
  };
  const dur = dstAnalysis.duration;
  const out = JSON.parse(JSON.stringify(src));
  // 1. scene starts: carried over, then moved to just before the nearest word
  const starts = [];
  src.scenes.forEach((s, i) => {
    if (i === 0) return starts.push(0);
    const d = toDst(s.start + 0.02);
    let t = d.t - (d.word ? 0.02 : 0);
    if (!d.word) { const w = snapTo(t, 0.35); if (w) t = w.s - 0.06; }
    t = Math.max(t, starts[i - 1] + 0.3);
    starts.push(r3(Math.min(t, dur - 0.3)));
  });
  out.scenes = src.scenes.map((s, i) => {
    const ns = JSON.parse(JSON.stringify(s));
    const start = starts[i], end = starts[i + 1] ?? Math.max(dur, start + 0.5);
    const len = end - start;
    const rel = (x) => {
      if (typeof x !== "number") return x;
      const d = toDst(s.start + x);
      let t = d.t;
      if (!d.word) { const w = snapTo(t, 0.25); if (w) t = w.s - 0.05; }
      return r3(Math.min(Math.max(0.05, t - start), Math.max(0.05, len - 0.1)));
    };
    const fix = (o) => {
      if (!o || typeof o !== "object") return;
      // a move is retimed by both ends, so it still arrives on the same word
      for (const m of o.move ?? []) { const from = rel(m.at), to = rel(m.at + m.duration); m.at = from; m.duration = Math.max(0.05, r3(to - from)); }
      for (const k of TIME_KEYS) if (k in o) o[k] = rel(o[k]);
    };
    ns.start = start;
    ns.end = r3(end);
    for (const list of ["characters", "props", "texts", "items", "actions", "sfx"]) (ns[list] ?? []).forEach(fix);
    fix(ns.bubble); fix(ns.number); fix(ns.image);
    if (ns.camera) for (const k of ["punch", "shake"]) if (ns.camera[k]) ns.camera[k] = ns.camera[k].map(rel);
    // the words of the new voice that fall in this scene
    const said = words.filter((w) => w.s >= start - 0.02 && w.s < end).map((w) => w.w).join(" ");
    ns.text = said || ns.text;
    // on-screen text
    if (ns.title) ns.title = tr(ns.title);
    if (ns.subtitle) ns.subtitle = tr(ns.subtitle);
    if (ns.detail) ns.detail = tr(ns.detail);
    (ns.props ?? []).forEach((p) => { if (p.label) p.label = tr(p.label); });
    (ns.items ?? []).forEach((it) => { if (it.label) it.label = tr(it.label); if (it.text) it.text = tr(it.text); });
    (ns.texts ?? []).forEach((t) => { t.text = tr(t.text); });
    if (ns.bubble?.text) ns.bubble.text = tr(ns.bubble.text);
    if (ns.number?.label) ns.number.label = tr(ns.number.label);
    if (ns.image?.caption) ns.image.caption = tr(ns.image.caption);
    if (len < 0.6) warnings.push(`Scene ${ns.id ?? i + 1} is only ${len.toFixed(2)} s in the ${lang} voice.`);
    return ns;
  });
  out.title = tr(src.title) ?? src.title;
  out.language = lang;
  out.duration = dur;
  out.fps = dstAnalysis.fps ?? src.fps;
  out.directedBy = `adapted from ${source ?? "the source video"}`;
  out.adaptedFrom = source;
  delete out.inputsHash;
  delete out.dialogue; // speakers come from this language's own recordings (dialogue-<lang>.json)
  delete out.customProps;
  return { storyboard: out, missing: [...missing], warnings };
}
