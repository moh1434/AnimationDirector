// Story-mode rules shared by the renderer and the pipeline (plain JS so both can import it).
export const ANIMAL_KINDS = ["dog", "cat", "bird"];
export const MOVE_POSES = ["walk", "run"];
export const MOVE_EASES = ["sine.inOut", "linear", "power2.in", "power2.out", "power3.in", "back.out"];

export const isAnimal = (member) => ANIMAL_KINDS.includes(member?.kind);

export function dialogueSpeaker(sb, time) {
  return sb.dialogue ? (sb.dialogue.find((c) => time >= c.start && time < c.end)?.who ?? "none") : undefined;
}

/** "clip:12" = when recording 12 starts, "clip:12:end" = when it ends, "clip:12+0.4" = 0.4 s later. */
export const CLIP_REF = /^clip:(\d+)(:end)?([+-]\d+(?:\.\d+)?)?$/i;
export const isClipRef = (value) => typeof value === "string" && CLIP_REF.test(value.trim());

/** Seconds from the start of the video, or null when the reference does not match a clip. */
export function clipTime(ref, dialogue) {
  const m = String(ref).trim().match(CLIP_REF);
  const clip = m && dialogue?.[+m[1] - 1];
  if (!clip) return null;
  return (m[2] ? clip.end : clip.start) + (m[3] ? parseFloat(m[3]) : 0);
}

/**
 * The words of a scene that begins on a recording: every word of its clips, by clip rather than by
 * clock, because word timing is approximate and can fall just outside the cut. Null for other scenes.
 */
export function clipSceneWords(words, scene, next, index, dialogue) {
  const clipOf = (s) => (isClipRef(s?.start) ? +String(s.start).trim().match(CLIP_REF)[1] : undefined);
  const first = clipOf(scene) ?? (dialogue && index === 0 ? 1 : undefined);
  if (first === undefined || (next && clipOf(next) === undefined) || !words.some((w) => w.seg !== undefined)) return null;
  const last = next ? clipOf(next) - 1 : Infinity;
  return words.filter((w) => w.seg + 1 >= first && w.seg + 1 <= last);
}

const moveProblem = (m, until) => {
  if (m.until === undefined && (!Number.isFinite(m.duration) || m.duration <= 0)) return `needs "duration" in seconds, or "until" (a time such as "@word" or "clip:12")`;
  if (typeof m.x !== "number" || m.x < -0.5 || m.x > 1.5) return `"x" must be a fraction of the frame width (below 0 or above 1 is off screen)`;
  if (m.y !== undefined && (typeof m.y !== "number" || m.y < -0.5 || m.y > 1.5)) return `"y" must be a fraction of the frame height`;
  if (typeof m.at === "number" && m.at < until - 1e-6) return `starts at ${m.at} s, before the previous move ends (${until} s)`;
  if (m.pose !== undefined && !MOVE_POSES.includes(m.pose)) return `"pose" must be ${MOVE_POSES.join(" or ")}`;
  if (m.ease !== undefined && !MOVE_EASES.includes(m.ease)) return `"ease" must be one of ${MOVE_EASES.join(", ")}`;
  return null;
};

/**
 * Problems a story storyboard can have. Times written as "@word" or "clip:3" are only compared once
 * compile() has turned them into seconds, so this is safe on an authored storyboard as well.
 */
export function storyProblems(sb) {
  const problems = [];
  for (const [id, c] of Object.entries(sb.cast ?? {})) if (c.kind && c.kind !== "human" && !ANIMAL_KINDS.includes(c.kind)) problems.push(`cast.${id}: unknown actor kind "${c.kind}" (use human, ${ANIMAL_KINDS.join(", ")}).`);
  let end = 0;
  for (const c of sb.dialogue ?? []) {
    if (!Number.isFinite(c.start) || !Number.isFinite(c.end) || c.start < end || c.end <= c.start) problems.push(`dialogue: "${c.text ?? c.who}" has invalid or overlapping times.`);
    if (c.who !== "narrator" && c.who !== "none" && !sb.cast?.[c.who]) problems.push(`dialogue: speaker "${c.who}" is not in the storyboard's "cast". Add it, with the same id as in dialogue.json.`);
    end = c.end;
  }
  (sb.scenes ?? []).forEach((s, i) => {
    const check = (list, name) => {
      let until = 0;
      for (const [j, m] of (list ?? []).entries()) {
        const problem = moveProblem(m, until);
        if (problem) problems.push(`scene ${s.id ?? i + 1}, ${name} move[${j}]: ${problem}.`);
        if (typeof m.at === "number" && Number.isFinite(m.duration)) until = m.at + m.duration;
      }
    };
    for (const c of s.characters ?? []) check(c.move, c.who);
    for (const p of s.props ?? []) check(p.move, p.name);
  });
  return problems;
}

export function validateStoryMode(sb) {
  const problems = storyProblems(sb);
  if (problems.length) throw new Error(problems.join("\n"));
}
