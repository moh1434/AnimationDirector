// storyboard.json (editable, may contain word references) -> render props + sound-effect cues.
import { clipSceneWords, clipTime, isClipRef, validateStoryMode } from "../remotion/story/story-mode.mjs";
import { norm } from "./lexicon.mjs";

const countWords = (t) => String(t ?? "").trim().split(/\s+/).filter(Boolean).length;
/** Seconds a viewer needs to read on-screen text once it has appeared: words / 3 + 1. */
export const readTime = (t) => countWords(t) / 3 + 1;

/**
 * `at` may be: a number (seconds from scene start), "w:3" (4th word of the scene),
 * "@word" (first word in the scene that starts with that text), "+1.2" (seconds), or
 * "clip:12" / "clip:12:end" / "clip:12+0.4" (when a recording of a multi-voice story starts or ends).
 */
function resolveAt(at, scene, sceneWords, dialogue) {
  if (at === undefined || at === null || at === "") return undefined;
  if (typeof at === "number") return at;
  const s = String(at).trim();
  if (isClipRef(s)) return Math.max(0, +((clipTime(s, dialogue) ?? scene.start + 0.3) - scene.start).toFixed(3));
  if (/^[+-]?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  let w = null;
  let m = s.match(/^w:(\d+)$/i);
  if (m) w = sceneWords[Math.min(+m[1], sceneWords.length - 1)];
  else if (s.startsWith("@")) {
    const q = norm(s.slice(1));
    w = sceneWords.find((x) => norm(x.w).startsWith(q)) ?? sceneWords.find((x) => norm(x.w).includes(q));
  }
  if (!w) return 0.3;
  return Math.max(0.05, +(w.s - scene.start - 0.05).toFixed(3));
}

const AT_KEYS = ["at", "out", "emoteAt"];

/** Seconds the picture keeps going after the voice ends, unless the storyboard sets "endHold". */
export const END_HOLD = 0;

/**
 * The video's length. The voice is the source of truth: it is never sped up, slowed down or cut, so
 * the video lasts at least the whole voice, and longer when the storyboard asks for more ("endHold"
 * seconds after the voice, or a longer "duration", for an ending beat after the last word).
 */
export function videoDuration(sb, analysis) {
  const voice = analysis?.duration ?? 0;
  const hold = Number.isFinite(sb?.endHold) && sb.endHold >= 0 ? sb.endHold : END_HOLD;
  return +Math.max(sb?.duration ?? 0, voice + hold).toFixed(3);
}

export function compile(storyboard, analysis, { format }) {
  const sb = JSON.parse(JSON.stringify(storyboard));
  const words = analysis.words ?? [];
  // the lip-sync curve is sampled at the analysis fps, so the render must use the same rate
  sb.fps = analysis.fps ?? sb.fps ?? 60;
  sb.duration = videoDuration(sb, analysis);
  // read before the starts below become seconds
  const byClip = new Map((sb.scenes ?? []).map((sc, i, all) => [sc, clipSceneWords(words, sc, all[i + 1], i, sb.dialogue)]));
  // scene starts may be given as a global word index ("w:12") so they follow re-timed words
  for (const sc of sb.scenes ?? []) {
    if (isClipRef(sc.start)) sc.start = Math.max(0, +((clipTime(sc.start, sb.dialogue) ?? 0) - 0.05).toFixed(3));
    if (typeof sc.start === "string") {
      const m = sc.start.match(/^w:(\d+)$/i);
      const w = m ? words[Math.min(+m[1], words.length - 1)] : null;
      sc.start = w ? Math.max(0, +(w.s - 0.06).toFixed(3)) : parseFloat(sc.start) || 0;
    }
  }
  const scenes = (sb.scenes ?? []).slice().sort((a, b) => a.start - b.start);
  const warnings = [];
  scenes.forEach((sc, i) => {
    sc.end = scenes[i + 1]?.start ?? Math.max(sc.end ?? sb.duration, sb.duration);
    if (sc.end - sc.start < 0.2) warnings.push(`Scene ${sc.id ?? i + 1} is very short (${(sc.end - sc.start).toFixed(2)}s).`);
    const sw = byClip.get(sc) ?? words.filter((w) => w.s >= sc.start - 0.02 && w.s < sc.end);
    const fix = (o) => {
      if (!o || typeof o !== "object") return;
      for (const k of AT_KEYS) if (k in o) o[k] = resolveAt(o[k], sc, sw, sb.dialogue);
      for (const m of o.move ?? []) {
        m.at = resolveAt(m.at, sc, sw, sb.dialogue);
        // "until" arrives on a word or a recording, so the move stays in step with any take
        if (m.until !== undefined) { m.duration = Math.max(0.05, +(resolveAt(m.until, sc, sw, sb.dialogue) - m.at).toFixed(3)); delete m.until; }
      }
      // moves tied to words can crowd each other in a faster take: the earlier one gives way
      (o.move ?? []).forEach((m, k, all) => {
        const next = all[k + 1];
        if (next && m.at + m.duration > next.at) {
          warnings.push(`Scene ${sc.id ?? i + 1}: a move of ${o.who ?? o.name} was shortened to end when the next one starts.`);
          m.duration = Math.max(0.05, +(next.at - m.at).toFixed(3));
          if (m.at + m.duration > next.at) next.at = +(m.at + m.duration).toFixed(3);
        }
      });
    };
    for (const list of ["characters", "props", "texts", "items", "actions", "sfx"]) (sc[list] ?? []).forEach(fix);
    fix(sc.bubble);
    fix(sc.number);
    fix(sc.image);
    if (sc.camera) {
      for (const k of ["punch", "shake"]) if (sc.camera[k]) sc.camera[k] = sc.camera[k].map((a) => resolveAt(a, sc, sw, sb.dialogue)).filter((x) => x !== undefined);
    }
    // default stagger for elements without times
    let k = 0;
    const span = Math.max(0.6, (sc.end - sc.start) * 0.55);
    for (const p of sc.props ?? []) if (p.at === undefined) p.at = +(0.2 + (span * k++) / Math.max(1, (sc.props?.length ?? 1))).toFixed(2);
    k = 0;
    for (const it of sc.items ?? []) if (it.at === undefined) it.at = +(0.3 + (span * k++) / Math.max(1, sc.items.length)).toFixed(2);
    for (const t of sc.texts ?? []) if (t.at === undefined) t.at = 0.25;
    if (sc.actions) sc.actions.sort((a, b) => a.at - b.at);
    // readability: text has to stay up long enough to be read, and stay short
    const dur = sc.end - sc.start;
    const name = `Scene ${sc.id ?? i + 1}`;
    const readable = [];
    if (sc.title) readable.push(["title", sc.title, sc.layout === "title" ? 0.25 : 0.4]);
    for (const t of sc.texts ?? []) if (["note", "quote", "title", "big"].includes(t.style ?? "label")) readable.push([`text “${t.text.slice(0, 20)}”`, t.text, (t.at ?? 0.25) + 0.3]);
    if (sc.bubble?.text) readable.push(["bubble", sc.bubble.text, (sc.bubble.at ?? 0.3) + 0.25]);
    const spoken = new Set(sw.map((w) => norm(w.w)));
    for (const [what, text, from] of readable) {
      // text that repeats what the voice says in this scene is read along with it, so it needs less time
      const echo = String(text).split(/\s+/).filter(Boolean).every((x) => spoken.has(norm(x)));
      const need = echo ? Math.max(0.8, countWords(text) / 3 + 0.3) : readTime(text), have = dur - from;
      if (have < need - 0.15) warnings.push(`${name}: ${what} has ${countWords(text)} words and needs ~${need.toFixed(1)}s to read${echo ? " (it echoes the voice)" : ""}, but is on screen ${have.toFixed(1)}s — shorten it or show it earlier.`);
    }
    for (const x of [...(sc.props ?? []), ...(sc.items ?? [])]) {
      const lab = x.label ?? x.text;
      if (lab && countWords(lab) > 3) warnings.push(`${name}: label “${lab}” is ${countWords(lab)} words — labels read best at 1–3 words.`);
    }
    if (sc.title && countWords(sc.title) > 8) warnings.push(`${name}: title is ${countWords(sc.title)} words — keep on-screen titles to about 6 (the voice says the rest).`);
    for (const x of [...(sc.props ?? []), ...(sc.items ?? [])]) {
      const left = dur - (x.at ?? 0);
      if (left < 0.6) warnings.push(`${name}: “${x.label ?? x.name ?? x.prop}” appears only ${Math.max(0, left).toFixed(1)}s before the cut — it will barely be seen; show it earlier or move the cut later.`);
    }
    const focal = (sc.props?.length ?? 0) + (sc.items?.length ?? 0) + (sc.texts?.length ?? 0);
    if (focal > 6) warnings.push(`${name}: ${focal} things on screen — one idea per scene reads better; split it.`);
  });
  sb.scenes = scenes;
  validateStoryMode(sb); // after the times above have become seconds

  // captions: per format default (shorts on, youtube off) unless the storyboard says otherwise
  const capCfg = storyboard.captionsByFormat?.[format];
  if (capCfg !== undefined) sb.captions = { ...(sb.captions ?? {}), enabled: !!capCfg };

  return { storyboard: sb, warnings };
}

/**
 * Sound-effect cue list derived from what appears on screen.
 * Each cue has a priority; lower-priority cues are dropped when they crowd each other, so the
 * track has a few meaningful accents instead of a pop on every element (sfxDensity: sparse|normal|full).
 */
export function sfxCues(sb) {
  const cues = [];
  // pri 4 = a sound the storyboard asked for (it beats the automatic thud of a shake on the same
  // moment), 3 = always (a shake, a number landing), 2 = structure (transitions,
  // titles, emotes), 1 = an object appearing, 0 = small ticks
  const add = (t, name, gain = 1, pri = 1, group) => cues.push({ t: +t.toFixed(3), name, gain, pri, group });
  sb.scenes.forEach((sc, i) => {
    const s0 = sc.start;
    if (i > 0) {
      if (sc.transition === "whip") add(s0 - 0.12, "whoosh", 0.9, 2);
      else if (sc.transition === "zoom") add(s0 - 0.05, "swoosh", 0.8, 2);
      else if (sc.transition === "iris") add(s0 - 0.25, "iris", 0.7, 2);
      else if (sc.transition === "flash") add(s0, "hit", 0.8, 2);
      else if (sc.layout === "title") add(s0, "whoosh", 0.7, 2);
    }
    (sc.props ?? []).forEach((p, k) => {
      const e = p.enter ?? "pop";
      add(s0 + (p.at ?? 0), e === "drop" ? "boing" : e === "spin" ? "swish" : e.startsWith("slide") ? "swish" : "pop", 0.75, k === 0 || p.sfx ? 1.5 : 1);
    });
    (sc.items ?? []).forEach((it, k) => add(s0 + (it.at ?? 0.3 + k * 0.6), "pop", 0.7, k === 0 ? 1.5 : 1));
    if (sc.layout === "compare" && sc.items?.length > 1) add(s0 + (sc.items[1].at ?? 0.9) - 0.15, "swish", 0.6, 1);
    for (const t of sc.texts ?? []) add(s0 + (t.at ?? 0.25), t.style === "title" || t.style === "big" ? "swoosh" : "tick", 0.55, t.style === "title" || t.style === "big" ? 2 : 0);
    if (sc.layout === "title" && sc.title) add(s0 + 0.1, "swoosh", 0.6, 2);
    if (sc.bubble) add(s0 + (sc.bubble.at ?? 0.3), "pop", 0.6, 1);
    if (sc.number) {
      const a = s0 + (sc.number.at ?? 0.3);
      for (let k = 0; k < 9; k++) add(a + k * 0.13 * (1 + k * 0.08), "tick", 0.3, 3, `roll${i}`);
      add(a + 1.3, "ding", 0.7, 3);
    }
    const emotes = [];
    for (const c of sc.characters ?? []) {
      if (c.emote) emotes.push([s0 + (c.emoteAt ?? c.at ?? 0), c.emote]);
      if (c.walkFrom !== undefined || (c.enter ?? "none").startsWith("slide")) add(s0 + (c.at ?? 0), "swish", 0.5, 1);
      if (c.enter === "drop") add(s0 + (c.at ?? 0) + 0.4, "boing", 0.6, 1.5);
    }
    for (const a of sc.actions ?? []) {
      if (a.emote) emotes.push([s0 + a.at, a.emote]);
      if (a.pose === "celebrate") add(s0 + a.at, "sparkle", 0.5, 1.5);
    }
    for (const [t, e] of emotes) {
      const name = { idea: "ding", question: "boop", exclaim: "hit", sparkle: "sparkle", love: "pop", anger: "hit", sweat: "boop", dizzy: "boing", music: "sparkle" }[e];
      if (name) add(t, name, 0.6, 2);
    }
    for (const s of sc.camera?.shake ?? []) add(s0 + s, "thud", 0.9, 3);
    for (const x of sc.sfx ?? []) add(s0 + x.at, x.name, x.gain ?? 0.8, 4);
  });
  // keep the important ones first, then fill in lesser cues only where there is room around them
  const density = sb.sfxDensity ?? "normal";
  const room = { sparse: [0.12, 0.6, 1.4, 2.2], normal: [0.09, 0.3, 0.75, 1.2], full: [0.09, 0.09, 0.2, 0.4] }[density] ?? [0.09, 0.3, 0.75, 1.2];
  const gapFor = (pri) => (pri >= 3 ? room[0] : pri >= 2 ? room[1] : pri >= 1 ? room[2] : room[3]);
  const kept = [];
  for (const c of cues.filter((c) => c.t >= 0).sort((a, b) => b.pri - a.pri || a.t - b.t)) {
    const g = gapFor(c.pri);
    const clash = kept.some((k) => Math.abs(k.t - c.t) < Math.max(c.group && c.group === k.group ? 0.05 : g, 0.09));
    if (!clash) kept.push(c);
  }
  return kept.sort((a, b) => a.t - b.t).map(({ t, name, gain }) => ({ t, name, gain }));
}
