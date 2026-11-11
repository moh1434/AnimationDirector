// Colour helper for characters, props and grounds. Works in OKLCH, where equal numbers look
// equally light and equally strong to the eye (HSL does not). See .claude/skills/color-harmony.
//
//   node scripts/palette.mjs show "#5b4be0" "#ffc83d"        lightness, chroma, hue of each colour
//   node scripts/palette.mjs schemes "#7a2a55"              colours that go with one (same strength)
//   node scripts/palette.mjs check berry                       test a character preset against the rules
//   node scripts/palette.mjs check berry hairColor=#6b3f2a hairTips=#e39a4a     …with changes tried on
//   node scripts/palette.mjs cast                             every preset's hair colour, to stay distinct
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ---------- colour maths (sRGB <-> OKLab/OKLCH, Björn Ottosson's formulas) ---------- */
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
export const hexToRgb = (hex) => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((x) => x + x).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
export const toOklch = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360, A, B };
};
const oklchToLinear = (L, C, h) => {
  const A = C * Math.cos((h * Math.PI) / 180), B = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};
/** OKLCH → hex. A colour the screen cannot show loses chroma (never lightness or hue) until it fits. */
export const fromOklch = (L, C, h) => {
  let c = C;
  for (let i = 0; i < 40; i++) {
    const rgb = oklchToLinear(L, c, h);
    if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) {
      return "#" + rgb.map((v) => Math.round(Math.min(1, Math.max(0, fromLin(Math.min(1, Math.max(0, v))))) * 255).toString(16).padStart(2, "0")).join("");
    }
    c *= 0.95;
  }
  return fromOklch(L, 0, h);
};
/** How different two colours look (0 = same; under ~0.10 they blend at video size). */
export const diff = (a, b) => { const x = toOklch(a), y = toOklch(b); return Math.hypot(x.L - y.L, x.A - y.A, x.B - y.B); };
const hueGap = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const hueName = (h, C) => C < 0.04 ? "neutral" : h < 20 ? "pink-red" : h < 45 ? "red" : h < 75 ? "orange" : h < 105 ? "yellow" : h < 135 ? "lime" : h < 165 ? "green" : h < 200 ? "teal" : h < 235 ? "cyan-blue" : h < 275 ? "blue" : h < 305 ? "violet" : h < 335 ? "purple-magenta" : "pink";
const fmt = (hex) => { const o = toOklch(hex); return `${hex}  L ${o.L.toFixed(2)}  C ${o.C.toFixed(2)}  h ${String(Math.round(o.h)).padStart(3)}°  ${hueName(o.h, o.C)}`; };

/* ---------- the project's colours ---------- */
const loadTheme = () => {
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  require.extensions[".ts"] = (module, file) => module._compile(ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, file);
  return require(join(ROOT, "remotion", "story", "theme.ts"));
};
const INK = "#1d1b20";
const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v);

/** Where each colour of a look is used, and how big that area is on screen (rough share of the figure). */
const rolesOf = (look) => {
  const r = [];
  const add = (role, hex, area) => isHex(hex) && r.push({ role, hex: hex.toLowerCase(), area });
  if (look.hair && look.hair !== "none" && look.hair !== "tuft") add("hair", look.hairColor ?? INK, 0.3);
  add("hair tips", look.hairTips, 0.04);
  if (look.hat && look.hat !== "none") add("hat", look.hatColor, look.hat === "bow" ? 0.03 : 0.15);
  else if (look.hatColor) add("hair clip", look.hatColor, 0.02);
  const twoPiece = ["overalls", "dungarees"].includes(look.outfit ?? "");
  add(twoPiece ? "top" : "outfit", look.shirt ?? "#ffd23f", twoPiece ? 0.08 : 0.3);
  if (twoPiece) add("dungarees", look.pants, 0.25);
  add("accent", look.accent, 0.04);
  add("shoes", look.shoes, 0.03);
  return r;
};

function check(look, T, name) {
  const roles = rolesOf(look);
  const skin = (look.skin ?? "#ffffff").toLowerCase();
  const out = [], bad = [], warn = [];
  out.push(`Colours of ${name}:`);
  out.push(`  skin        ${fmt(skin)}`);
  for (const r of roles) out.push(`  ${r.role.padEnd(11)} ${fmt(r.hex)}`);

  // 1. hue families (neutrals are free)
  const families = [];
  for (const r of roles.filter((x) => x.area >= 0.08)) {
    const o = toOklch(r.hex);
    if (o.C < 0.04) continue;
    const f = families.find((x) => hueGap(x.h, o.h) < 32);
    if (f) f.members.push(r.role); else families.push({ h: o.h, name: hueName(o.h, o.C), members: [r.role] });
  }
  out.push("", `Hue families in the big areas: ${families.length} (${families.map((f) => `${f.name}: ${f.members.join(", ")}`).join(" · ")})`);
  if (families.length > 3) bad.push(`${families.length} hue families. Keep to 3 at most (2 is calmer): merge two of them, or make one a neutral.`);

  // 2. one loud colour: big areas should not all be at full strength
  const big = roles.filter((r) => r.area >= 0.15);
  const loud = big.filter((r) => toOklch(r.hex).C >= 0.15);
  if (loud.length > 1) bad.push(`${loud.map((r) => r.role).join(" and ")} are both big and strong (chroma ≥ 0.15), so they fight. Let one lead: lower the other's chroma to 0.06–0.13.`);
  const total = roles.reduce((n, r) => n + r.area, 0);
  const strength = roles.reduce((n, r) => n + toOklch(r.hex).C * r.area, 0) / total;
  out.push(`Average strength (chroma weighted by area): ${strength.toFixed(2)}  (0.08–0.14 is comfortable; over 0.16 everything shouts)`);
  if (strength > 0.16) bad.push(`Every colour is near full strength (average chroma ${strength.toFixed(2)}). Keep strong colour for small accents and make the big areas quieter.`);
  const hairRole = roles.find((r) => r.role === "hair");
  if (hairRole && toOklch(hairRole.hex).C > 0.17) bad.push(`Hair is the biggest shape and it is neon (chroma ${toOklch(hairRole.hex).C.toFixed(2)}). Hair that pleases sits at chroma 0.06–0.15: deep or soft, not electric.`);
  const anyStrong = roles.some((r) => toOklch(r.hex).C >= 0.12);
  if (!anyStrong) warn.push("No colour has much strength (all chroma under 0.12): the figure may look washed out. Give the accent some.");

  // 3. lightness ladder between neighbours
  const pair = (a, b, min, why) => {
    if (!a || !b) return;
    const d = Math.abs(toOklch(a.hex).L - toOklch(b.hex).L), e = diff(a.hex, b.hex);
    if (d < min && e < 0.15) warn.push(`${a.role} and ${b.role} are close in lightness (ΔL ${d.toFixed(2)}) ${why}. Move one lighter or darker by 0.15 or more.`);
  };
  const by = (role) => roles.find((r) => r.role === role);
  const skinRole = { role: "skin", hex: skin };
  pair(by("hair"), skinRole, 0.22, "so the face does not stand out from the hair");
  pair(by("hair"), by("outfit") ?? by("dungarees"), 0.12, "so head and body merge");
  pair(by("top"), by("dungarees"), 0.12, "so the two pieces merge");
  pair(by("hair"), by("hair tips"), 0.1, "so the tips do not show");

  // 4. detail on the fill must stay visible: ink lines on dark fills vanish
  for (const r of big) if (toOklch(r.hex).L < 0.36) warn.push(`${r.role} is very dark (L ${toOklch(r.hex).L.toFixed(2)}): the ink outline and inner lines disappear in it. Keep big fills at L 0.40 or more.`);

  // 5. against the grounds the director cycles through
  const hits = [];
  for (const r of big) for (const g of T.BG_CYCLE) { const e = diff(r.hex, T.BG[g]); if (e < 0.1) hits.push(`${r.role} on "${g}" (${e.toFixed(2)})`); }
  if (hits.length) warn.push(`Blends into a common ground: ${hits.join(", ")}. The outline still separates it, but avoid that ground for this character or shift the colour.`);

  // 6. distinct from the rest of the cast (hair is what the eye uses to tell characters apart)
  const hair = by("hair");
  if (hair) {
    const twins = Object.entries(T.PRESETS).filter(([n, l]) => n !== name && l.hair && l.hair !== "none" && isHex(l.hairColor) && diff(l.hairColor, hair.hex) < 0.09).map(([n]) => n);
    if (twins.length) warn.push(`Hair colour is almost the same as: ${twins.join(", ")}. Fine for extras; a main character should differ.`);
  }

  out.push("");
  if (!bad.length && !warn.length) out.push("✔ Passes every check.");
  for (const b of bad) out.push(`✖ ${b}`);
  for (const w of warn) out.push(`⚠ ${w}`);
  console.log(out.join("\n"));
  return bad.length === 0;
}

function schemes(hex) {
  const o = toOklch(hex);
  const at = (dh, L = o.L, C = o.C) => fromOklch(L, C, (o.h + dh + 360) % 360);
  const row = (label, list) => console.log(`  ${label.padEnd(22)} ${list.join("  ")}`);
  console.log(`Base: ${fmt(hex)}\n`);
  console.log("Same lightness and strength, other hues:");
  row("analogous (±30°)", [at(-30), hex, at(30)]);
  row("complementary (180°)", [hex, at(180)]);
  row("split (150°, 210°)", [hex, at(150), at(210)]);
  row("triadic (120°, 240°)", [hex, at(120), at(240)]);
  console.log("\nSame hue, other roles:");
  row("light tint (tips, shine)", [at(0, Math.min(0.9, o.L + 0.22), o.C * 0.7)]);
  row("dark shade (shadow)", [at(0, Math.max(0.3, o.L - 0.15), o.C * 0.9)]);
  row("quiet version (big area)", [at(0, o.L, Math.min(o.C, 0.1))]);
  console.log("\nAccent for it (opposite hue, strong, mid-light):");
  row("accent", [fromOklch(0.72, 0.17, (o.h + 180) % 360), fromOklch(0.8, 0.15, (o.h + 150) % 360)]);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "show") for (const a of args) console.log(fmt(a));
else if (cmd === "schemes" && args[0]) schemes(args[0]);
else if (cmd === "check" && args[0]) {
  const T = loadTheme();
  const base = T.PRESETS[args[0]] ?? T.PRESETS[T.PRESET_ALIASES?.[args[0]]];
  if (!base) { console.error(`No preset "${args[0]}". Presets: ${Object.keys(T.PRESETS).join(", ")}`); process.exit(1); }
  const over = Object.fromEntries(args.slice(1).map((a) => a.split("=")));
  process.exit(check({ ...base, ...over }, T, T.PRESETS[args[0]] ? args[0] : T.PRESET_ALIASES[args[0]]) ? 0 : 1);
} else if (cmd === "cast") {
  const T = loadTheme();
  for (const [n, l] of Object.entries(T.PRESETS)) if (l.hair && l.hair !== "none" && isHex(l.hairColor)) console.log(`${n.padEnd(14)} ${fmt(l.hairColor)}`);
} else {
  console.log("Usage:\n  node scripts/palette.mjs show <#hex>…\n  node scripts/palette.mjs schemes <#hex>\n  node scripts/palette.mjs check <preset> [key=#hex …]\n  node scripts/palette.mjs cast");
}
