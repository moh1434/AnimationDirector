// Layout check: render each scene at its settled moment (all elements in) and at its midpoint,
// read the real on-screen box of every element from the page, and judge the composition:
// safe areas, collisions, caption band, text size, edges, balance, empty bands, small subjects.
// Writes out/check-<format>.md + .json and keeps the stills so they can be looked at.
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const TEXTY = /^(label|text|title|bubble|number|card|captions)/;
const ART = /^(char|prop|item|image|news)/;

function spec(W, H, captionsOn) {
  const portrait = H > W * 1.1;
  if (portrait)
    return {
      portrait, safe: [W * 0.055, H * 0.065, W * 0.945, H * 0.995], textSafe: [W * 0.065, H * 0.075, W * 0.88, H * 0.8],
      band: captionsOn ? [W * 0.06, H * 0.485, W * 0.94, H * 0.575] : null, minFont: 48, U: W,
    };
  return {
    portrait, safe: [W * 0.05, H * 0.05, W * 0.95, H * 0.995], textSafe: [W * 0.05, H * 0.05, W * 0.95, H * 0.95],
    band: captionsOn ? [W * 0.15, H * 0.835, W * 0.85, H * 0.94] : null, minFont: 40, U: H,
  };
}

const area = (b) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
const inter = (a, b) => area({ x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) });
const fmt = (b) => `${Math.round(b.x0)},${Math.round(b.y0)}–${Math.round(b.x1)},${Math.round(b.y1)}`;
const name = (b) => (b.kind + (b.text && TEXTY.test(b.kind) ? ` “${b.text.trim().slice(0, 24)}”` : ""));

export function judge(audit, sceneInfo, captionsOn) {
  const { W, H, boxes } = audit;
  const S = spec(W, H, captionsOn);
  const issues = [];
  const add = (sev, code, msg) => issues.push({ sev, code, msg });
  const fg = boxes.filter((b) => b.kind !== "captions");
  // 1. safe areas
  for (const b of boxes) {
    if (b.kind === "captions") continue;
    const r = TEXTY.test(b.kind) ? S.textSafe : S.safe;
    const isChar = b.kind.startsWith("char");
    const tol = 4;
    const out = [b.x0 < r[0] - tol && "left", b.x1 > r[2] + tol && "right", b.y0 < r[1] - (isChar ? H * 0.04 : tol) && "top", !isChar && b.y1 > r[3] + tol && "bottom"].filter(Boolean);
    if (out.length) add(TEXTY.test(b.kind) ? "error" : "warn", "safe-area", `${name(b)} leaves the ${TEXTY.test(b.kind) ? "text-" : ""}safe area (${out.join(", ")}) at ${fmt(b)}`);
  }
  // 2. collisions: text against anything; art against art (heavy overlap only)
  for (let i = 0; i < fg.length; i++)
    for (let j = i + 1; j < fg.length; j++) {
      const a = fg[i], b = fg[j];
      const ov = inter(a, b);
      if (!ov) continue;
      const small = Math.min(area(a), area(b));
      const r = ov / small;
      const textInvolved = TEXTY.test(a.kind) || TEXTY.test(b.kind);
      const bubbleOnChar = (a.kind === "bubble" && b.kind.startsWith("char")) || (b.kind === "bubble" && a.kind.startsWith("char"));
      if (textInvolved && r > (bubbleOnChar ? 0.15 : 0.06)) add("error", "collision", `${name(a)} overlaps ${name(b)} (${Math.round(r * 100)}% of the smaller)`);
      else if (!textInvolved && r > 0.35 && !(a.kind.startsWith("char") && b.kind.startsWith("char"))) add("warn", "crowding", `${name(a)} and ${name(b)} overlap ${Math.round(r * 100)}%`);
    }
  // 3. caption band must stay clear
  if (S.band && sceneInfo.layout !== "title") {
    const band = { x0: S.band[0], y0: S.band[1], x1: S.band[2], y1: S.band[3] };
    for (const b of fg) {
      if (b.kind.startsWith("char")) continue;
      const ov = inter(b, band);
      if (ov / Math.max(1, area(b)) > 0.08) add("error", "caption-band", `${name(b)} enters the caption band`);
    }
  }
  // 4. text size
  for (const b of boxes) {
    if (!TEXTY.test(b.kind) || b.kind === "captions" || !b.fs) continue;
    if (b.fs < S.minFont) add("warn", "small-text", `${name(b)} is ${Math.round(b.fs)}px (min ${S.minFont}px for this format)`);
  }
  // 5. composition
  const subjects = fg.filter((b) => ART.test(b.kind) || /^(title|number|card|bubble|text)/.test(b.kind));
  if (subjects.length) {
    const ux0 = Math.min(...subjects.map((b) => b.x0)), ux1 = Math.max(...subjects.map((b) => b.x1));
    const uy0 = Math.min(...subjects.map((b) => b.y0)), uy1 = Math.max(...subjects.map((b) => b.y1));
    const objs = subjects.filter((b) => /^(prop|item|image|news)/.test(b.kind));
    const biggest = Math.max(0, ...objs.map((b) => Math.max(b.x1 - b.x0, b.y1 - b.y0)));
    if (objs.length && biggest < S.U * 0.17) add("warn", "small-subject", `largest object is only ${Math.round(biggest)}px (${Math.round((biggest / S.U) * 100)}% of the frame) — hard to read on a phone`);
    if (uy0 > H * 0.42 && !sceneInfo.layout?.startsWith("crowd")) add("warn", "bottom-heavy", `everything sits below ${Math.round((uy0 / H) * 100)}% of the height; the top is empty`);
    if (uy1 < H * 0.55 && !S.portrait) add("warn", "top-heavy", `everything sits in the top half`);
    if ((ux1 - ux0) < W * 0.4 && (uy1 - uy0) < H * 0.4) add("warn", "sparse", `content covers only ${Math.round(((ux1 - ux0) / W) * 100)}% × ${Math.round(((uy1 - uy0) / H) * 100)}% of the frame`);
    // empty horizontal band between elements
    const ys = subjects.map((b) => [b.y0, b.y1]).sort((a, b) => a[0] - b[0]);
    let reach = ys[0][1];
    for (const [y0, y1] of ys.slice(1)) {
      const gap = y0 - reach;
      const bandOk = S.band && y0 >= S.band[3] - 4 && reach <= S.band[1] + 4; // the caption band itself is a planned gap
      if (gap > H * (S.portrait ? 0.24 : 0.3) && !bandOk) add("warn", "empty-band", `${Math.round(gap)}px empty band between elements (y ${Math.round(reach)}–${Math.round(y0)})`);
      reach = Math.max(reach, y1);
    }
    // left/right balance for centred layouts
    const cx = (ux0 + ux1) / 2;
    if (Math.abs(cx - W / 2) > W * 0.2 && subjects.length > 1) add("info", "off-centre", `the content block is centred at ${Math.round((cx / W) * 100)}% of the width`);
  }
  return issues;
}

/** Pick the moments to check: each scene once everything has appeared, and its midpoint. */
export function checkFrames(sb) {
  const fps = sb.fps ?? 30;
  const out = [];
  sb.scenes.forEach((s, i) => {
    const end = sb.scenes[i + 1]?.start ?? sb.duration;
    const dur = end - s.start;
    const ats = [...(s.props ?? []), ...(s.items ?? []), ...(s.texts ?? []), ...(s.characters ?? [])].map((x) => x.at ?? 0);
    if (s.number) ats.push((s.number.at ?? 0.3) + 1.3);
    if (s.bubble) ats.push(s.bubble.at ?? 0.3);
    // stay clear of the outgoing transition (whip / zoom / fade move the whole frame)
    const settled = Math.min(dur - 0.32, Math.max(0.6, ...ats.map((a) => a + 0.55)));
    const mid = dur * 0.5;
    const times = Math.abs(settled - mid) < 0.5 ? [settled] : [mid, settled].sort((a, b) => a - b);
    for (const tt of times) out.push({ scene: i, id: s.id ?? `s${i + 1}`, layout: s.layout, frame: Math.round((s.start + Math.max(0.05, tt)) * fps), t: +(s.start + tt).toFixed(2) });
  });
  return out;
}

export async function runCheck({ dir, build, props, format, renderStills }) {
  const sb = props.storyboard;
  const captionsOn = sb.captions?.enabled ?? format !== "youtube";
  const frames = checkFrames(sb);
  const odir = join(dir, "out", "check");
  mkdirSync(odir, { recursive: true });
  for (const f of readdirSync(odir)) if (f.startsWith(format + "-")) { try { unlinkSync(join(odir, f)); } catch {} }
  const audits = new Map();
  await renderStills({
    publicDir: build, inputProps: { ...props, audit: true }, frames: frames.map((f) => f.frame), outPattern: join(odir, `${format}-{f}.jpg`), scale: 0.5,
    onLog: (text, f) => { if (text.startsWith("LAYOUT_AUDIT ")) audits.set(f, JSON.parse(text.slice(13))); },
  });
  const report = [];
  let errors = 0, warns = 0;
  for (const f of frames) {
    const a = audits.get(f.frame);
    if (!a) { report.push({ ...f, issues: [{ sev: "warn", code: "no-audit", msg: "no measurements came back for this frame" }] }); continue; }
    const issues = judge(a, f, captionsOn);
    errors += issues.filter((x) => x.sev === "error").length;
    warns += issues.filter((x) => x.sev === "warn").length;
    report.push({ ...f, still: join(odir, `${format}-${String(f.frame).padStart(5, "0")}.jpg`), issues, boxes: a.boxes });
  }
  // de-duplicate the same issue on both frames of a scene
  const md = [`# Layout check — ${format}`, "", `${errors} errors, ${warns} warnings over ${frames.length} frames. Errors must be fixed; warnings are judgement calls (see .claude/skills/layout-composition).`, ""];
  let last = -1;
  for (const r of report) {
    if (r.scene !== last) { md.push(`## Scene ${r.scene + 1} · ${r.id} · ${r.layout ?? "host_talk"}`); last = r.scene; }
    const list = r.issues.length ? r.issues.map((x) => `- **${x.sev}** \`${x.code}\` ${x.msg}`).join("\n") : "- ok";
    md.push(`*t = ${r.t}s (frame ${r.frame})* — still: \`out/check/${format}-${String(r.frame).padStart(5, "0")}.jpg\`\n${list}\n`);
  }
  writeFileSync(join(dir, "out", `check-${format}.md`), md.join("\n"), "utf8");
  writeFileSync(join(dir, "out", `check-${format}.json`), JSON.stringify(report, null, 1), "utf8");
  return { errors, warns, file: join(dir, "out", `check-${format}.md`) };
}
