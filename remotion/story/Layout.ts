// Region-based scene layout. Each layout claims regions of the design grid (frame.ts):
// a character column / ground line and a "stage" rectangle for objects and text. Objects are
// packed into the stage at the largest size that fits with their labels, the group is centred
// in it, and everything is finally kept inside the safe area. Same storyboard → a composed
// 16:9 frame and a separately composed 9:16 frame.
import type { Scene, Storyboard, CharRef, PropRef, TextRef, Item } from "./types";
import { frameSpec, FrameSpec, Rect, rw, rh, rcx, rcy, tagHeight } from "./frame";
import { fitText, tagWidth, textWidth } from "./measure";

export type Placed<T> = T & { px: number; py: number; ps: number };
export type PlacedText = Placed<TextRef> & { maxW: number };

export type Layout = {
  frame: FrameSpec;
  portrait: boolean;
  U: number; W: number; H: number;
  rtl: boolean;
  layout: string;
  stage: Rect;
  chars: Placed<CharRef>[];
  props: Placed<PropRef>[];
  items: Placed<Item & { idx: number }>[];
  texts: PlacedText[];
  title: { x: number; y: number; size: number; maxW: number } | null;
  thought: { x: number; y: number; w: number } | null;
  symbol: { x: number; y: number; s: number } | null;
  number: { x: number; y: number; size: number } | null;
  image: { x: number; y: number; w: number } | null;
  news: { x: number; y: number; w: number } | null;
  card: { x: number; y: number; w: number; align: "start" | "center" } | null;
  labelSize: number;
};

const CHAR_TOP = 1.03; // character height above the feet, in units of its size
const CHAR_HALF_W = 0.3; // half its visible width (arms out), in units of its size

/** Pack n square objects (+ optional label under each) into a rectangle at the largest size that fits. */
function pack(n: number, r: Rect, o: { label: number; labelW?: number; gapX: number; gapY: number; maxSize: number; minSize: number; between?: number; preferRow?: boolean; rtl?: boolean }) {
  const lab = o.label > 0 ? tagHeight(o.label) + o.gapY * 0.5 : 0;
  let best = { cols: 1, rows: n, size: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const between = o.between ?? 0;
    const cellW = (rw(r) - (cols - 1) * (o.gapX + between)) / cols;
    const cellH = (rh(r) - (rows - 1) * o.gapY) / rows - lab;
    if (cols > 1 && o.labelW && cellW + o.gapX * 0.6 < o.labelW) continue; // labels would collide
    let size = Math.min(cellW, cellH, o.maxSize);
    if (o.preferRow && rows === 1) size *= 1.04; // rows read better for sequences
    if (size > best.size + 1) best = { cols, rows, size };
  }
  const size = Math.max(o.minSize, Math.min(best.size, o.maxSize));
  const { cols, rows } = best;
  const blockH = size + lab;
  const groupH = rows * blockH + (rows - 1) * o.gapY;
  const top = rcy(r) - groupH / 2;
  const centers: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    const col = i - row * cols;
    // spread the row across the stage, but never sparser than ~2 object widths apart
    const minStep = Math.max(size, o.labelW ?? 0) + o.gapX * 0.6;
    const step = Math.max(Math.min(minStep * 1.0, rw(r)), Math.min((rw(r) - Math.max(size, o.labelW ?? 0)) / Math.max(1, inRow - 1), size * 2.1 + (o.between ?? 0)));
    const rowW = (inRow - 1) * step;
    const x0 = rcx(r) - rowW / 2;
    const cx = x0 + (o.rtl ? inRow - 1 - col : col) * step;
    centers.push({ x: inRow === 1 ? rcx(r) : cx, y: top + row * (blockH + o.gapY) + size / 2 });
  }
  return { size, centers, cols, rows, groupH };
}

/** Move a box (given by its centre offsets) so it lies inside rect r. */
function keepIn(cx: number, cy: number, left: number, right: number, up: number, down: number, r: Rect) {
  let x = cx, y = cy;
  if (x - left < r.x0) x = r.x0 + left;
  if (x + right > r.x1) x = r.x1 - right;
  if (y - up < r.y0) y = r.y0 + up;
  if (y + down > r.y1) y = r.y1 - down;
  return { x, y };
}

export function layoutScene(scene: Scene, W: number, H: number, sb: Storyboard, captionsOn = H > W): Layout {
  const F = frameSpec(W, H, captionsOn);
  const { portrait, U, gap, type } = F;
  // lay out inside a slightly smaller rectangle: the default camera push-in (~4 %) and punch-zooms
  // scale the picture from the centre, which carries edge elements outward
  const ix = W * 0.02, iy = H * 0.015;
  const safe: Rect = { x0: F.safe.x0 + ix, y0: F.safe.y0 + iy, x1: F.safe.x1 - ix, y1: F.safe.y1 };
  const textSafe: Rect = { x0: F.textSafe.x0 + ix, y0: F.textSafe.y0 + iy, x1: F.textSafe.x1 - ix, y1: F.textSafe.y1 - iy };
  const layout = scene.layout ?? "host_talk";
  const rtl = ["ar", "fa", "ur", "he"].includes((sb.language ?? "").slice(0, 2));
  const mirror = !!scene.mirror;
  const flipX = (x: number) => (mirror ? W - x : x);
  const flipR = (r: Rect): Rect => (mirror ? { x0: W - r.x1, y0: r.y0, x1: W - r.x0, y1: r.y1 } : r);

  // Portrait illustrations sit below the caption band; each layout allocates its own stage depth.
  const pStageBottom = H * 0.55;
  const lStageBottom = F.captionBand ? F.captionBand.y0 - gap.s : H * 0.86;
  const pStage: Rect = { x0: textSafe.x0, y0: F.captionBand ? F.captionBand.y1 + gap.m : textSafe.y0, x1: textSafe.x1, y1: pStageBottom };

  type Slot = { x: number; s: number; y?: number; facing?: "left" | "right" };
  const slots: Slot[] = [];
  let stage: Rect;
  let thought: Layout["thought"] = null;
  let symbol: Layout["symbol"] = null;
  let number: Layout["number"] = null;
  let image: Layout["image"] = null;
  let news: Layout["news"] = null;
  let card: Layout["card"] = null;
  let titleMode: "top" | "center" | "none" = "top";

  switch (layout) {
    case "hero":
      stage = portrait ? { ...pStage, y1: H * 0.62 } : { x0: W * 0.24, y0: safe.y0, x1: W * 0.78, y1: lStageBottom };
      slots.push(portrait ? { x: W * 0.24, s: 0.48 } : { x: W * 0.12, s: 0.5 });
      break;
    case "duo":
      slots.push({ x: W * (portrait ? 0.28 : 0.27), s: 0.64, facing: "right" });
      slots.push({ x: W * (portrait ? 0.70 : 0.73), s: 0.64, facing: "left" });
      stage = portrait ? { ...pStage, y1: H * 0.44 } : { x0: W * 0.3, y0: safe.y0, x1: W * 0.7, y1: H * 0.3 };
      break;
    case "thought":
      slots.push(portrait ? { x: W * 0.5, s: 0.66 } : { x: W * 0.27, s: 0.74 });
      stage = portrait ? pStage : { x0: W * 0.44, y0: safe.y0, x1: safe.x1, y1: H * 0.66 };
      thought = { x: rcx(stage), y: rcy(stage), w: Math.min(rw(stage), portrait ? W * 0.86 : W * 0.48) };
      break;
    case "title":
      stage = { x0: textSafe.x0, y0: textSafe.y0, x1: textSafe.x1, y1: portrait ? H * 0.7 : H * 0.8 };
      titleMode = "center";
      slots.push(portrait ? { x: W * 0.5, s: 0.55 } : { x: W * 0.14, s: 0.5 });
      break;
    case "name_card":
      slots.push(portrait ? { x: W * 0.5, s: 0.66 } : { x: W * (rtl ? 0.7 : 0.3), s: 0.8 });
      stage = portrait ? pStage : rtl ? { x0: safe.x0, y0: safe.y0, x1: W * 0.52, y1: lStageBottom } : { x0: W * 0.48, y0: safe.y0, x1: safe.x1, y1: lStageBottom };
      card = { x: rcx(stage), y: rcy(stage), w: rw(stage), align: portrait ? "center" : "start" };
      titleMode = "none";
      break;
    case "compare":
    case "transform":
    case "steps":
      stage = portrait ? { ...pStage, y1: H * (layout === "steps" && (scene.items?.length ?? 0) > 3 ? 0.66 : 0.50) } : { x0: textSafe.x0, y0: safe.y0, x1: textSafe.x1, y1: H * 0.64 };
      slots.push(portrait ? { x: W * 0.5, s: layout === "steps" && (scene.items?.length ?? 0) > 3 ? 0.39 : 0.65 } : { x: W * 0.5, s: 0.34, y: H * 0.93 });
      break;
    case "number":
      slots.push(portrait ? { x: W * 0.5, s: 0.64 } : { x: W * 0.22, s: 0.76 });
      stage = portrait ? pStage : { x0: W * 0.42, y0: safe.y0, x1: textSafe.x1, y1: lStageBottom };
      break;
    case "image":
    case "news":
      slots.push(portrait ? { x: W * 0.5, s: 0.62 } : { x: W * 0.2, s: 0.74 });
      stage = portrait ? pStage : { x0: W * 0.38, y0: safe.y0, x1: textSafe.x1, y1: lStageBottom };
      break;
    case "crowd": {
      const n = Math.max(1, scene.characters?.length ?? 1);
      const span = portrait ? [0.16, 0.84] : [0.13, 0.87];
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? 0.5 : span[0] + ((span[1] - span[0]) * i) / (n - 1);
        slots.push({ x: W * x, y: portrait ? H * (0.81 + (i % 2) * 0.06) : F.ground, s: portrait ? 0.46 : Math.min(0.66, 2.1 / n), facing: x < 0.5 ? "right" : "left" });
      }
      stage = portrait ? { ...pStage, y1: Math.min(pStageBottom, H * 0.47) } : { x0: W * 0.2, y0: safe.y0, x1: W * 0.8, y1: H * 0.4 };
      break;
    }
    case "free":
      stage = { ...safe };
      break;
    case "host_talk":
    default:
      slots.push(portrait ? { x: W * 0.48, s: 0.78 } : { x: W * 0.235, s: 0.72 });
      stage = portrait ? { ...pStage, y1: H * 0.40 } : { x0: W * 0.43, y0: safe.y0, x1: textSafe.x1, y1: lStageBottom };
  }
  // Three traits read as a compact list beside their subject; four steps get a large grid.
  if (portrait && layout === "steps" && scene.items?.length === 3) {
    stage = { ...pStage, x1: W * 0.45, y1: H * 0.76 };
    slots[0] = { x: W * 0.70, s: 0.66, y: H * 0.87 };
  }
  stage = layout === "duo" || portrait ? stage : flipR(stage);
  if (thought) thought = { ...thought, x: rcx(stage), y: rcy(stage) };
  if (card) card = { ...card, x: rcx(stage) };

  /* ---- title row (only reserved when there is a title) ---- */
  let title: Layout["title"] = null;
  const hasStageContent = (scene.props?.length ?? 0) + (scene.items?.length ?? 0) > 0 || !!scene.number || !!scene.image || layout === "news" || !!scene.bubble;
  if (scene.title && layout !== "news" && titleMode !== "none") {
    if (titleMode === "center" || !hasStageContent) {
      const maxW = rw(stage);
      const size = fitText(scene.title, maxW, titleMode === "center" ? type.display : type.h1, type.h2 * 0.8, titleMode === "center" ? 3 : 2);
      title = { x: rcx(stage), y: rcy(stage), size, maxW };
    } else {
      const maxW = rw(stage);
      const size = fitText(scene.title, maxW, type.h2, type.h3, 1);
      title = { x: rcx(stage), y: stage.y0 + size * 0.65, size, maxW };
      stage = { ...stage, y0: stage.y0 + size * 1.3 + gap.m };
    }
  }

  /* ---- characters ---- */
  const chars: Placed<CharRef>[] = [];
  (scene.characters ?? []).forEach((c, i) => {
    const slot = slots[Math.min(i, slots.length - 1)] ?? { x: W / 2, s: 0.7 };
    const x = c.x !== undefined ? flipX(c.x * W) : layout === "duo" ? slot.x : flipX(slot.x);
    const ps = (c.size ?? slot.s) * U;
    const py = c.y !== undefined ? c.y * H : slot.y ?? F.ground;
    // keep the body inside the side margins (feet may touch the bottom edge)
    const kx = Math.min(Math.max(x, safe.x0 + ps * CHAR_HALF_W), safe.x1 - ps * CHAR_HALF_W);
    chars.push({
      ...c, px: c.x !== undefined ? x : kx, py, ps,
      facing: c.facing ?? (mirror && slot.facing ? (slot.facing === "left" ? "right" : "left") : slot.facing) ?? (kx < W / 2 ? "right" : "left"),
    });
  });

  const labelSize = type.label;

  /* ---- objects in the stage ---- */
  const props: Placed<PropRef>[] = [];
  const auto = (scene.props ?? []).filter((p) => p.x === undefined || p.y === undefined);
  const anyLabel = auto.some((p) => p.label);
  // reserve room under the objects for free label texts and a number
  let objRect = { ...stage };
  const freeLabels = (scene.texts ?? []).filter((t) => t.x === undefined && t.y === undefined && !["title", "big"].includes(t.style ?? "label"));
  if (scene.number) {
    const nH = type.number * 1.15 + (scene.number.label ? tagHeight(type.label) + gap.s : 0);
    number = { x: rcx(stage), y: stage.y1 - nH / 2, size: type.number };
    objRect = { ...stage, y1: stage.y1 - nH - gap.m };
  }
  if (freeLabels.length && auto.length) objRect = { ...objRect, y1: objRect.y1 - freeLabels.length * (tagHeight(type.label) + gap.s) };
  if (auto.length) {
    const maxSize = (layout === "hero" ? (portrait ? 0.66 : 0.62) : auto.length === 1 ? (portrait ? 0.6 : 0.56) : 0.46) * U;
    const pk = pack(auto.length, objRect, { label: anyLabel ? labelSize : 0, labelW: Math.max(0, ...auto.map((p) => (p.label ? tagWidth(p.label, labelSize) : 0))), gapX: gap.l, gapY: gap.m, maxSize, minSize: 0.16 * U, rtl });
    auto.forEach((p, i) => {
      const c = pk.centers[i];
      props.push({ ...p, px: c.x, py: c.y, ps: p.size ? p.size * U : pk.size });
    });
  }
  for (const p of scene.props ?? []) {
    if (p.x !== undefined && p.y !== undefined) props.push({ ...p, px: flipX(p.x * W), py: p.y * H, ps: (p.size ?? 0.3) * U });
  }

  /* ---- items: compare / transform / steps ---- */
  const items: Placed<Item & { idx: number }>[] = [];
  const its = scene.items ?? [];
  if (its.length) {
    const seq = layout === "transform" || layout === "steps";
    const pair = layout === "compare" || layout === "transform";
    const between = pair ? (layout === "compare" ? 0.2 * U : 0.16 * U) : !portrait && layout === "steps" ? 0.06 * U : 0;
    const pk = pack(its.length, stage, {
      label: its.some((i) => i.label || i.text) ? labelSize : 0, labelW: Math.max(0, ...its.map((i) => (i.label || i.text ? tagWidth((i.label || i.text)!, labelSize) : 0))), gapX: gap.l, gapY: portrait && layout === "steps" && its.length === 3 ? gap.l : portrait ? gap.m : gap.l, between, preferRow: seq || pair,
      maxSize: (portrait && layout === "steps" && its.length === 3 ? 0.18 : pair ? 0.4 : 0.36) * U, minSize: 0.15 * U, rtl,
    });
    its.forEach((it, i) => items.push({ ...it, idx: i, px: pk.centers[i].x, py: pk.centers[i].y, ps: pk.size }));
    if (layout === "compare" && its.length > 1) {
      const a = items[0], b = items[1];
      symbol = { x: (a.px + b.px) / 2, y: (a.py + b.py) / 2, s: Math.min(0.17 * U, Math.abs(b.px - a.px) - pk.size - gap.s) };
    }
  }

  /* ---- free texts ---- */
  const texts: PlacedText[] = [];
  let stackY = auto.length ? (props.reduce((m, p) => Math.max(m, p.py + p.ps / 2 + (p.label ? tagHeight(labelSize) + gap.s : 0)), stage.y0) + gap.m) : rcy(stage) - ((freeLabels.length - 1) * (tagHeight(type.label) + gap.m)) / 2;
  (scene.texts ?? []).forEach((tx) => {
    const st = tx.style ?? "label";
    const isTitle = st === "title" || st === "big";
    const size = tx.size ?? (st === "big" ? type.display * 1.4 : isTitle ? type.h1 : st === "note" || st === "quote" ? type.body : type.label);
    const maxW = isTitle ? rw(stage) : Math.min(rw(stage), portrait ? W * 0.8 : W * 0.55);
    let px: number, py: number;
    if (tx.x !== undefined || tx.y !== undefined) {
      px = flipX((tx.x ?? rcx(stage) / W) * W);
      py = (tx.y ?? rcy(stage) / H) * H;
    } else if (isTitle) {
      px = rcx(stage);
      py = props.length || items.length ? stage.y0 + size * 0.6 : rcy(stage);
    } else {
      px = rcx(stage);
      py = stackY + tagHeight(size) / 2;
      stackY += tagHeight(size) + gap.m;
    }
    const fitted = isTitle ? fitText(tx.text, maxW, size, Math.min(size, type.h3), st === "big" ? 1 : 2) : size;
    texts.push({ ...tx, px, py, ps: fitted, maxW });
  });

  /* ---- big media ---- */
  if (scene.image) {
    const w = Math.min(rw(stage) * 0.94, (rh(stage) * 0.88) / 0.62 / 1.08);
    image = { x: rcx(stage), y: rcy(stage), w };
  }
  if (layout === "news") news = { x: rcx(stage), y: rcy(stage), w: Math.min(rw(stage) * 0.92, rh(stage) * 1.15) };

  /* ---- keep everything inside the safe area ---- */
  for (const p of props) {
    const labW = p.label ? tagWidth(p.label, labelSize) / 2 : 0;
    const half = Math.max(p.ps / 2, labW);
    const down = p.ps / 2 + (p.label ? tagHeight(labelSize) + gap.xs : 0);
    const bounds = { ...(p.label ? textSafe : safe) };
    if (portrait && F.captionBand && layout !== "title") bounds.y0 = F.captionBand.y1 + gap.m;
    const k = keepIn(p.px, p.py, half, half, p.ps / 2, down, bounds);
    p.px = k.x; p.py = k.y;
  }
  for (const it of items) {
    const label = it.label || it.text;
    const labW = label ? tagWidth(label, labelSize) / 2 : 0;
    const half = Math.max(it.ps / 2, labW);
    const k = keepIn(it.px, it.py, half, half, it.ps / 2, it.ps / 2 + (label ? tagHeight(labelSize) + gap.xs : 0), textSafe);
    it.px = k.x; it.py = k.y;
  }
  for (const t of texts) {
    const st = t.style ?? "label";
    if (st === "title" || st === "big") continue;
    const w = st === "note" || st === "quote" ? Math.min(t.maxW, textWidth(t.text, t.ps, "body", 700)) : tagWidth(t.text, t.ps);
    const k = keepIn(t.px, t.py, w / 2, w / 2, tagHeight(t.ps) / 2, tagHeight(t.ps) / 2, textSafe);
    t.px = k.x; t.py = k.y;
  }

  return { frame: F, portrait, U, W, H, rtl, layout, stage, chars, props, items, texts, title, thought, symbol, number, image, news, card, labelSize };
}
