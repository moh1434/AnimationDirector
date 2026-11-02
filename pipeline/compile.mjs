// storyboard.json (editable, may contain word references) -> render props + sound-effect cues.
import { norm } from "./lexicon.mjs";

/**
 * `at` may be: a number (seconds from scene start), "w:3" (4th word of the scene),
 * "@word" (first word in the scene that starts with that text), or "+1.2" (seconds) .
 */
function resolveAt(at, scene, sceneWords) {
  if (at === undefined || at === null || at === "") return undefined;
  if (typeof at === "number") return at;
  const s = String(at).trim();
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

export function compile(storyboard, analysis, { format }) {
  const sb = JSON.parse(JSON.stringify(storyboard));
  const words = analysis.words ?? [];
  sb.fps = sb.fps ?? analysis.fps ?? 30;
  sb.duration = Math.max(sb.duration ?? 0, analysis.duration ?? 0);
  // scene starts may be given as a global word index ("w:12") so they follow re-timed words
  for (const sc of sb.scenes ?? []) {
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
    const sw = words.filter((w) => w.s >= sc.start - 0.02 && w.s < sc.end);
    const fix = (o) => {
      if (!o || typeof o !== "object") return;
      for (const k of AT_KEYS) if (k in o) o[k] = resolveAt(o[k], sc, sw);
    };
    for (const list of ["characters", "props", "texts", "items", "actions", "sfx"]) (sc[list] ?? []).forEach(fix);
    fix(sc.bubble);
    fix(sc.number);
    fix(sc.image);
    if (sc.camera) {
      for (const k of ["punch", "shake"]) if (sc.camera[k]) sc.camera[k] = sc.camera[k].map((a) => resolveAt(a, sc, sw)).filter((x) => x !== undefined);
    }
    // default stagger for elements without times
    let k = 0;
    const span = Math.max(0.6, (sc.end - sc.start) * 0.55);
    for (const p of sc.props ?? []) if (p.at === undefined) p.at = +(0.2 + (span * k++) / Math.max(1, (sc.props?.length ?? 1))).toFixed(2);
    k = 0;
    for (const it of sc.items ?? []) if (it.at === undefined) it.at = +(0.3 + (span * k++) / Math.max(1, sc.items.length)).toFixed(2);
    for (const t of sc.texts ?? []) if (t.at === undefined) t.at = 0.25;
    if (sc.actions) sc.actions.sort((a, b) => a.at - b.at);
  });
  sb.scenes = scenes;

  // captions: per format default (shorts on, youtube off) unless the storyboard says otherwise
  const capCfg = storyboard.captionsByFormat?.[format];
  if (capCfg !== undefined) sb.captions = { ...(sb.captions ?? {}), enabled: !!capCfg };

  return { storyboard: sb, warnings };
}

/** Sound-effect cue list derived from what appears on screen. */
export function sfxCues(sb) {
  const cues = [];
  const add = (t, name, gain = 1) => cues.push({ t: +t.toFixed(3), name, gain });
  sb.scenes.forEach((sc, i) => {
    const s0 = sc.start;
    if (i > 0) {
      if (sc.transition === "whip") add(s0 - 0.12, "whoosh", 0.9);
      else if (sc.transition === "zoom") add(s0 - 0.05, "swoosh", 0.8);
      else if (sc.transition === "iris") add(s0 - 0.25, "iris", 0.7);
      else if (sc.transition === "flash") add(s0, "hit", 0.8);
      else if (sc.layout === "title") add(s0, "whoosh", 0.7);
    }
    for (const p of sc.props ?? []) {
      const e = p.enter ?? "pop";
      add(s0 + (p.at ?? 0), e === "drop" ? "boing" : e === "spin" ? "swish" : e.startsWith("slide") ? "swish" : "pop", 0.75);
    }
    (sc.items ?? []).forEach((it, k) => add(s0 + (it.at ?? 0.3 + k * 0.6), "pop", 0.75));
    if (sc.layout === "compare" && sc.items?.length > 1) add(s0 + (sc.items[1].at ?? 0.9) - 0.15, "swish", 0.6);
    for (const t of sc.texts ?? []) add(s0 + (t.at ?? 0.25), t.style === "title" || t.style === "big" ? "swoosh" : "tick", 0.55);
    if (sc.layout === "title" && sc.title) add(s0 + 0.1, "swoosh", 0.6);
    if (sc.bubble) add(s0 + (sc.bubble.at ?? 0.3), "pop", 0.6);
    if (sc.number) {
      const a = s0 + (sc.number.at ?? 0.3);
      for (let k = 0; k < 9; k++) add(a + k * 0.13 * (1 + k * 0.08), "tick", 0.35);
      add(a + 1.3, "ding", 0.7);
    }
    const emotes = [];
    for (const c of sc.characters ?? []) {
      if (c.emote) emotes.push([s0 + (c.emoteAt ?? c.at ?? 0), c.emote]);
      if (c.walkFrom !== undefined || (c.enter ?? "none").startsWith("slide")) add(s0 + (c.at ?? 0), "swish", 0.5);
      if (c.enter === "drop") add(s0 + (c.at ?? 0) + 0.4, "boing", 0.6);
    }
    for (const a of sc.actions ?? []) {
      if (a.emote) emotes.push([s0 + a.at, a.emote]);
      if (a.pose === "celebrate") add(s0 + a.at, "sparkle", 0.5);
    }
    for (const [t, e] of emotes) {
      const name = { idea: "ding", question: "boop", exclaim: "hit", sparkle: "sparkle", love: "pop", anger: "hit", sweat: "boop", dizzy: "boing", music: "sparkle" }[e];
      if (name) add(t, name, 0.6);
    }
    for (const s of sc.camera?.shake ?? []) add(s0 + s, "thud", 0.9);
    for (const x of sc.sfx ?? []) add(s0 + x.at, x.name, x.gain ?? 0.8);
  });
  cues.sort((a, b) => a.t - b.t);
  // thin out: never two cues within 90 ms (keep the louder)
  const out = [];
  for (const c of cues) {
    const last = out[out.length - 1];
    if (last && c.t - last.t < 0.09) {
      if (c.gain > last.gain) out[out.length - 1] = c;
    } else if (c.t >= 0) out.push(c);
  }
  return out;
}
