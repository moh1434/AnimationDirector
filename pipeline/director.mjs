// Offline auto-director: turns timed narration into a cartoon storyboard.
// It is a rule-based first draft (bilingual keyword lexicon + cue words + variety rules).
// For the best result, let Claude (or you) edit storyboard.json — see STORYBOARD_GUIDE.md.
import { propHits, castHits, bgHits, hasCue, cueIndex, isStop, norm } from "./lexicon.mjs";

const FACE_PROPS = new Set(["sun", "moon", "earth", "planet", "star", "heart", "brain", "coin", "moneybag", "rock", "cloud", "water", "fire", "tree", "apple", "bomb", "robot", "lightbulb", "ghost", "bacteria", "closedbook", "phone", "laptop", "shield", "trophy", "cat", "dog", "fish", "blackhole", "house"]);
const SPACE_PROPS = new Set(["sun", "moon", "planet", "star", "blackhole", "galaxy", "meteor", "rocket", "satellite", "telescope"]);
const BG_SOLIDS = ["mint", "yellow", "lilac", "sky", "peach", "aqua", "pink", "lime", "cream", "paper"];

const hash = (s) => {
  let h = 2166136261;
  for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
};
const clean = (w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}%]+$/gu, "");
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toLatinDigits = (s) => s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));

const MULT = [
  [/^(million|millions|مليون|ملايين|مليونا)$/i, " million", " مليون"],
  [/^(billion|billions|مليار|مليارات|بليون)$/i, " billion", " مليار"],
  [/^(thousand|thousands|الف|آلاف|الاف|ألف)$/i, " thousand", " ألف"],
  [/^(percent|%|بالمئه|بالمئة|بالمائة|في المئه)$/i, "%", "%"],
];

function findNumber(tokens, lang) {
  for (let i = 0; i < tokens.length; i++) {
    const raw = toLatinDigits(tokens[i].w);
    const m = raw.match(/(\d[\d,]*(?:\.\d+)?)(%?)/);
    if (!m) continue;
    const value = parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;
    let suffix = m[2] || "";
    const next = clean(tokens[i + 1]?.w ?? "");
    for (const [re, en, ar] of MULT) if (re.test(next) || re.test(norm(next))) suffix = lang === "ar" ? ar : en;
    const isYear = !suffix && Number.isInteger(value) && value >= 1000 && value <= 2100;
    const significant = suffix || isYear || value >= 10 || (m[1].includes(".") && value > 0);
    if (!significant) continue;
    return { value, suffix, index: i, isYear, decimals: m[1].includes(".") ? Math.min(2, m[1].split(".")[1].length) : 0 };
  }
  return null;
}

/** Split long segments into scenes of ~3–7 s at sentence/clause ends or pauses. */
function splitScenes(segments, words, maxLen = 7.5) {
  const scenes = [];
  segments.forEach((seg, si) => {
    const ws = words.filter((w) => w.seg === si || (w.s >= seg.start - 0.01 && w.s < seg.end && w.seg === undefined));
    const dur = seg.end - seg.start;
    if (dur <= maxLen || ws.length < 6) {
      scenes.push({ start: seg.start, end: seg.end, words: ws, text: seg.text, seg: si, title: seg.title });
      return;
    }
    const parts = Math.ceil(dur / 5.5);
    const target = dur / parts;
    let cur = [];
    let curStart = seg.start;
    ws.forEach((w, k) => {
      cur.push(w);
      const elapsed = w.e - curStart;
      const next = ws[k + 1];
      if (!next) return;
      const punct = /[.!?؟،,:;]$/.test(w.w);
      const gap = next.s - w.e;
      const remaining = seg.end - next.s;
      if (elapsed >= target * 0.75 && remaining > 2 && (punct || gap > 0.25 || elapsed > target * 1.35)) {
        const cut = next.s - Math.min(0.08, gap / 2);
        scenes.push({ start: curStart, end: cut, words: cur, text: cur.map((x) => x.w).join(" "), seg: si });
        cur = [];
        curStart = cut;
      }
    });
    if (cur.length) scenes.push({ start: curStart, end: seg.end, words: cur, text: cur.map((x) => x.w).join(" "), seg: si });
  });
  // close gaps: each scene runs until the next one starts
  for (let i = 0; i < scenes.length - 1; i++) scenes[i].end = scenes[i + 1].start;
  return scenes;
}

export function direct({ segments, words, duration, settings = {} }) {
  const lang = settings.language ?? "en";
  const hostId = "host";
  const cast = { host: { preset: settings.host ?? "host", name: settings.hostName } };
  if (settings.hostLook) cast.host.look = settings.hostLook;
  const scenesIn = splitScenes(segments, words);

  // topic: the most frequent prop across the whole narration
  const freq = {};
  for (const s of scenesIn) for (const h of propHits(s.words.map((w) => w.w))) freq[h.key] = (freq[h.key] ?? 0) + 1;
  const topic = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
  const spaceTopic = topic && SPACE_PROPS.has(topic);

  const out = [];
  let bgIdx = Math.floor(hash(settings.title ?? "x") * BG_SOLIDS.length);
  let lastBg = "";
  let hostSide = 0;
  const recent = [];

  scenesIn.forEach((sc, i) => {
    const toks = sc.words.length ? sc.words : sc.text.split(/\s+/).map((w, k, a) => ({ w, s: sc.start + ((sc.end - sc.start) * k) / a.length, e: sc.start + ((sc.end - sc.start) * (k + 1)) / a.length }));
    const T = toks.map((w) => w.w);
    const dur = sc.end - sc.start;
    const rel = (k) => Math.max(0.12, +(toks[Math.min(k, toks.length - 1)].s - sc.start - 0.05).toFixed(2));
    const text = sc.text;
    const isQ = /[?؟]/.test(text) || hasCue(text, "question") && /^\s*\S+/.test(text) && cueIndex(T, "question") <= 1 && cueIndex(T, "question") >= 0;
    const excl = /!/.test(text);
    const surprise = cueIndex(T, "surprise");
    const negative = hasCue(text, "negative");
    const positive = hasCue(text, "positive");
    const impact = cueIndex(T, "impact");
    const greeting = i === 0 && hasCue(text, "greeting");
    const ending = i === scenesIn.length - 1 || hasCue(text, "ending");

    // props: unique keys, first mention time
    const seen = new Set();
    const hits = propHits(T).filter((h) => (h.key === "question" ? false : seen.has(h.key) ? false : (seen.add(h.key), true)));
    const people = [];
    const pseen = new Set();
    for (const h of castHits(T)) if (!pseen.has(h.key)) { pseen.add(h.key); people.push(h); }
    const bgh = bgHits(T)[0]?.key;
    const num = findNumber(toks, lang);

    const baseExpr = isQ ? "confused" : surprise >= 0 ? "surprised" : negative ? "worried" : excl || positive ? "excited" : i % 2 ? "happy" : "neutral";
    const scene = { id: `s${i + 1}`, start: +sc.start.toFixed(3), end: +sc.end.toFixed(3), text, speaker: hostId };
    const actions = [];
    const camera = { zoom: i % 2 ? [1.06, 1.0] : [1.0, 1.06], punch: [], shake: [] };
    if (excl) {
      const k = toks.findIndex((w) => /!/.test(w.w));
      camera.punch.push(rel(Math.max(0, k - 1)));
    }
    if (surprise >= 0) camera.punch.push(rel(surprise));
    if (impact >= 0) camera.shake.push(rel(impact));

    const host = (extra = {}) => ({ who: hostId, expression: baseExpr, ...extra });
    const propLabel = (h) => clean(T[h.index]) || undefined;
    const faceFor = (key, k) => (FACE_PROPS.has(key) && hash(key + i + k) < 0.55 ? (negative ? "worried" : surprise >= 0 ? "surprised" : "happy") : undefined);

    let layout = "host_talk";
    const recent2 = recent.slice(-2);
    const shortPunch = dur < 2.6 && T.length <= 6 && !hits.length && !num && i > 0 && !ending;

    if (greeting || i === 0) {
      layout = "host_talk";
      scene.characters = [host({ pose: greeting ? "wave" : isQ ? "think" : "explain", expression: greeting ? "excited" : baseExpr, emote: isQ ? "question" : undefined, emoteAt: 0.4 })];
      scene.props = hits.slice(0, 2).map((h, k) => ({ name: h.key, at: rel(h.index), face: faceFor(h.key, k) ?? "happy", label: hits.length === 1 ? propLabel(h) : undefined }));
      if (!scene.props.length && topic) scene.props = [{ name: topic, at: 0.5, face: "happy" }];
      camera.punch.push(0.3);
    } else if (ending) {
      layout = "host_talk";
      scene.characters = [host({ pose: "wave", expression: "excited", emote: "sparkle", emoteAt: 0.3 })];
      scene.props = hits.slice(0, 1).map((h) => ({ name: h.key, at: rel(h.index), face: "happy" }));
      if (!scene.props.length && topic) scene.props = [{ name: topic, at: 0.3, face: "happy", motion: "bounce" }];
      scene.transition = "zoom";
    } else if (num) {
      layout = "number";
      scene.characters = [host({ pose: "point", expression: "surprised" })];
      scene.number = num.isYear
        ? { value: num.value, from: Math.max(0, num.value - 60), group: false, at: rel(num.index) }
        : { value: num.value, suffix: num.suffix, decimals: num.decimals, at: rel(num.index), label: hits[0] ? propLabel(hits[0]) : undefined };
      if (hits[0]) scene.props = [{ name: hits[0].key, at: Math.max(0.15, rel(hits[0].index) - 0.2) }];
      scene.transition = "flash";
      camera.punch.push(rel(num.index));
    } else if (hits.length >= 2 && (hasCue(text, "compare") || hasCue(text, "transform")) && !recent2.some((l) => l === "compare" || l === "transform")) {
      layout = hasCue(text, "transform") ? "transform" : "compare";
      // pick the two things either side of the cue word ("A becomes B", "A or B")
      const ci = Math.max(cueIndex(T, layout === "transform" ? "transform" : "compare"), 0);
      const before = hits.filter((h) => h.index < ci).pop() ?? hits[0];
      const after = hits.find((h) => h.index > ci && h !== before) ?? hits.find((h) => h !== before);
      scene.items = [before, after].map((h, k) => ({ prop: h.key, label: propLabel(h), at: rel(h.index), face: faceFor(h.key, k) }));
      scene.characters = [host({ pose: "present" })];
      scene.symbol = layout === "compare" ? "VS" : undefined;
    } else if ((hits.length >= 3 || (hits.length >= 2 && hasCue(text, "steps"))) && !recent2.includes("steps")) {
      layout = "steps";
      scene.items = hits.slice(0, 4).map((h, k) => ({ prop: h.key, label: propLabel(h), at: rel(h.index), face: faceFor(h.key, k) }));
      scene.characters = [host({ pose: "talk" })];
    } else if (people.length) {
      const p = people[0].key;
      cast[p] = cast[p] ?? { preset: p };
      const plural = /s$|ين$|ون$|اء$|جيش|army|troops|people|الناس/.test(norm(T[people[0].index] ?? ""));
      if (plural && !["king", "pharaoh"].includes(p)) {
        layout = "crowd";
        const n = dur > 4 ? 4 : 3;
        scene.characters = Array.from({ length: n }, (_, k) => ({ who: p, expression: negative ? "worried" : k % 2 ? "happy" : "neutral", pose: k === 0 ? "point" : k === n - 1 ? "hips" : "idle", at: k === 0 ? 0 : rel(people[0].index) }));
        scene.speaker = "none";
        if (hits[0]) scene.props = [{ name: hits[0].key, at: rel(hits[0].index), face: faceFor(hits[0].key, 0) }];
      } else {
        layout = "duo";
        scene.characters = [host({ pose: "talk" }), { who: p, expression: negative ? "sad" : positive ? "proud" : "neutral", pose: hits[0] ? "hold" : "hips", holding: hits[0]?.key, enter: "slide-right", at: rel(people[0].index) }];
        const quote = text.match(/["“«](.+?)["”»]/);
        if (quote) scene.bubble = { who: p, text: quote[1].slice(0, 70), at: rel(people[0].index) + 0.4 };
      }
    } else if (isQ && !recent2.includes("thought")) {
      layout = "thought";
      scene.characters = [host({ pose: "think", expression: "thinking", emote: hits.length ? undefined : "question", emoteAt: 0.5 })];
      scene.bubble = { kind: "thought", text: "", prop: hits[0]?.key ?? "question", at: hits[0] ? rel(hits[0].index) : 0.4 };
    } else if (shortPunch && !recent2.includes("title")) {
      layout = "title";
      scene.title = text.replace(/[.،,]$/, "");
      scene.speaker = "none";
      scene.bg = { type: "burst", color: "black", color2: ["#4b2a7a", "#7a2a3b", "#24507a"][i % 3] };
      scene.characters = [];
    } else if (hits.length === 1 && dur >= 2.2 && recent[recent.length - 1] !== "hero") {
      layout = hash(text) < 0.55 ? "hero" : "host_talk";
      const h = hits[0];
      if (layout === "hero") {
        scene.props = [{ name: h.key, at: rel(h.index), face: FACE_PROPS.has(h.key) ? (negative ? "worried" : surprise >= 0 ? "surprised" : "happy") : undefined, label: propLabel(h), motion: "float" }];
        scene.characters = [host({ pose: "point", expression: baseExpr === "neutral" ? "happy" : baseExpr })];
      } else {
        scene.props = [{ name: h.key, at: rel(h.index), face: faceFor(h.key, 0), label: propLabel(h) }];
        scene.characters = [host({ pose: "talk" })];
      }
    } else {
      layout = "host_talk";
      scene.characters = [host({ pose: "talk", emote: isQ ? "question" : undefined })];
      scene.props = hits.slice(0, 3).map((h, k) => ({ name: h.key, at: rel(h.index), face: faceFor(h.key, k), label: hits.length <= 2 ? propLabel(h) : undefined }));
      if (!scene.props.length) {
        // no drawable keyword: pop the 1–2 most important spoken words as tags
        const cand = toks.map((w, k) => ({ w: clean(w.w), k })).filter((x) => x.w && !isStop(x.w));
        cand.sort((a, b) => b.w.length - a.w.length);
        const pick = cand.slice(0, dur > 3.5 ? 2 : 1).sort((a, b) => a.k - b.k);
        if (pick.length) {
          scene.texts = pick.map((p, k) => ({ text: p.w, style: "label", size: 64, at: rel(p.k), x: undefined, y: undefined }));
          if (pick.length === 2) {
            scene.texts[0].y = 0.36; scene.texts[1].y = 0.56;
          }
        } else if (topic) scene.props = [{ name: topic, at: 0.4, face: "happy" }];
      }
    }

    // nothing on screen for a long time? pop an early key word as a tag (kinetic typography)
    const firstAt = Math.min(...[...(scene.props ?? []), ...(scene.items ?? []), ...(scene.texts ?? [])].map((x) => x.at ?? 0), scene.number?.at ?? 99, scene.bubble?.at ?? 99, scene.title ? 0 : 99);
    if (firstAt > 1.6 && ["host_talk", "hero", "duo", "thought"].includes(layout)) {
      const k = toks.findIndex((w) => w.s - sc.start < firstAt - 0.6 && clean(w.w).length >= 4 && !isStop(clean(w.w)));
      if (k >= 0) {
        scene.texts = [...(scene.texts ?? []), { text: clean(toks[k].w), style: "label", size: 62, at: rel(k), out: Math.max(rel(k) + 0.8, firstAt - 0.1), y: layout === "thought" ? 0.12 : 0.3 }];
      }
    }

    // host gestures across the scene (limited animation, like the references)
    const hasHost = (scene.characters ?? []).some((c) => c.who === hostId);
    if (hasHost && layout !== "crowd") {
      const firstProp = (scene.props ?? scene.items ?? [])[0];
      if (firstProp && ["host_talk", "hero", "number", "compare", "transform"].includes(layout)) {
        const at = (firstProp.at ?? 0.3) + 0.05;
        actions.push({ at, who: hostId, pose: "point" });
        if (dur - at > 2) actions.push({ at: at + 1.4, who: hostId, pose: "explain" });
      }
      if (surprise >= 0) actions.push({ at: rel(surprise), who: hostId, expression: "surprised", pose: "shrug" });
      if (isQ && layout !== "thought") actions.push({ at: Math.max(0.2, dur - 1.6), who: hostId, pose: "think", expression: "thinking" });
      if (excl && positive) actions.push({ at: Math.max(0.2, dur - 1.2), who: hostId, pose: "celebrate", expression: "laughing" });
      const gest = ["talk", "explain", "present", "talk", "hips"];
      for (let tt = 2.6; tt < dur - 1.2; tt += 2.6) if (!actions.some((a) => Math.abs(a.at - tt) < 1.2)) actions.push({ at: +tt.toFixed(2), who: hostId, pose: gest[Math.floor(hash(text + tt) * gest.length)] });
    }
    if (actions.length) scene.actions = actions.sort((a, b) => a.at - b.at);

    // background
    if (!scene.bg) {
      let type = "solid";
      const keys = (scene.props ?? scene.items ?? []).map((p) => p.name ?? p.prop);
      if (bgh) type = bgh;
      else if (keys.some((k) => SPACE_PROPS.has(k)) || (spaceTopic && hash(text) < 0.35)) type = "space";
      if (type === "solid" || (type === lastBg && type !== "space" && hash(i) < 0.6)) {
        let c = BG_SOLIDS[bgIdx++ % BG_SOLIDS.length];
        if (c === lastBg) c = BG_SOLIDS[bgIdx++ % BG_SOLIDS.length];
        scene.bg = c;
        lastBg = c;
      } else {
        scene.bg = type;
        lastBg = type;
      }
    }

    // variety: put the host on the other side now and then
    if (layout === "host_talk" && i > 0) {
      hostSide++;
      if (hostSide % 3 === 0) scene.mirror = true;
    }
    if (!scene.transition && i > 0) {
      const prevBg = out[i - 1]?.bg;
      const space = (b) => (typeof b === "string" ? b : b?.type) === "space";
      if (space(scene.bg) !== space(prevBg)) scene.transition = "whip";
      else if (sc.seg !== scenesIn[i - 1].seg && i % 4 === 0) scene.transition = "whip";
    }
    if (camera.punch.length === 0) delete camera.punch;
    if (camera.shake.length === 0) delete camera.shake;
    scene.camera = camera;
    scene.layout = layout;
    if (sc.title && !scene.title && layout !== "number") scene.title = sc.title;
    out.push(scene);
    recent.push(layout);
  });

  return {
    version: 1,
    title: settings.title ?? "Untitled",
    language: lang,
    fps: settings.fps ?? 60,
    duration: +duration.toFixed(3),
    cast,
    captions: settings.captions === undefined || settings.captions === "auto" ? undefined : { enabled: !!settings.captions },
    watermark: settings.watermark || undefined,
    directedBy: "auto",
    scenes: out,
  };
}
