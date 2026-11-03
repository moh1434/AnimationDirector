// What a storyboard may name: layouts, props (+ aliases), backgrounds, characters, poses, expressions…
// Read straight from the source files, so the list is always the same as what the renderer knows.
// Used by `pnpm video catalog`, `pnpm video brief` and `pnpm video validate`.
import { createRequire } from "node:module";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./env.mjs";

const STORY = join(ROOT, "remotion", "story");
let cached = null;

function loadTs() {
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  for (const ext of [".ts", ".tsx"]) {
    if (require.extensions[ext]) continue;
    require.extensions[ext] = (module, file) =>
      module._compile(ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText, file);
  }
  return require;
}

const casesIn = (file, from, to) => {
  let s = readFileSync(join(STORY, file), "utf8");
  if (from) s = s.slice(s.indexOf(from), to ? s.indexOf(to, s.indexOf(from)) : undefined);
  return [...new Set([...s.matchAll(/case "([a-z_-]+)"/g)].map((m) => m[1]))];
};

export function catalog() {
  if (cached) return cached;
  const require = loadTs();
  const P = require(join(STORY, "Props.tsx"));
  const C = require(join(STORY, "Character.tsx"));
  const F = require(join(STORY, "Face.tsx"));
  const T = require(join(STORY, "theme.ts"));
  const aliases = {};
  for (const n of P.PROP_NAMES) aliases[n] = [];
  // collect aliases by probing the resolver with every alias the registries declare
  for (const file of readdirSync(STORY).filter((f) => /Props\.tsx$/.test(f))) {
    const src = readFileSync(join(STORY, file), "utf8");
    for (const m of src.matchAll(/aliases:\s*\[([^\]]*)\]/g))
      for (const a of m[1].matchAll(/"([^"]+)"|'([^']+)'/g)) {
        const al = a[1] ?? a[2];
        const k = P.resolveProp(al);
        if (k && aliases[k] && al !== k && !aliases[k].includes(al)) aliases[k].push(al);
      }
  }
  const bgTypes = new Set(casesIn("Backgrounds.tsx", "export const Background"));
  for (const f of ["EverydayBackgrounds.tsx", "LifeBackgrounds.tsx"]) {
    if (!existsSync(join(STORY, f))) continue;
    const m = readFileSync(join(STORY, f), "utf8").match(/=\s*\[([^\]]+)\]\s*as const/);
    if (m) for (const x of m[1].matchAll(/"([^"]+)"/g)) bgTypes.add(x[1]);
  }
  bgTypes.add("solid"); bgTypes.add("image");
  cached = {
    layouts: casesIn("Layout.ts", "switch (layout)"),
    props: P.PROP_NAMES.slice().sort(),
    propAliases: aliases,
    resolveProp: (n) => P.resolveProp(n),
    bgColors: Object.keys(T.BG),
    bgTypes: [...bgTypes].sort(),
    presets: Object.keys(T.PRESETS),
    presetAliases: T.PRESET_ALIASES ?? {},
    poses: Object.keys(C.POSES),
    expressions: Object.keys(F.EXPR),
    emotes: casesIn("Character.tsx", "export const Emote", "/* ---------------- the character"),
    enters: ["pop", "fade", "slide-left", "slide-right", "slide-up", "slide-down", "drop", "grow", "spin", "none"],
    motions: ["float", "spin", "pulse", "shake", "bounce", "orbit", "none"],
    textStyles: ["label", "date", "note", "quote", "title", "big"],
    transitions: ["cut", "whip", "iris", "flash", "zoom", "fade", "slide"],
    symbols: ["VS", "=", "≠", ">", "<"],
    sfx: ["pop", "tick", "boop", "ding", "sparkle", "whoosh", "swoosh", "swish", "boing", "hit", "thud", "iris"],
  };
  return cached;
}

/** A compact plain-text listing (for people and for small models). */
export function catalogText(c = catalog()) {
  const wrap = (arr, w = 100) => {
    const out = []; let line = "";
    for (const x of arr) { if ((line + " " + x).length > w) { out.push(line.trim()); line = ""; } line += " " + x; }
    if (line.trim()) out.push(line.trim());
    return out.map((l) => "  " + l).join("\n");
  };
  return [
    "LAYOUTS (scene.layout)", wrap(c.layouts),
    "CHARACTER PRESETS (cast.<id>.preset)", wrap(c.presets),
    "POSES (characters[].pose, actions[].pose)", wrap(c.poses),
    "EXPRESSIONS (expression)", wrap(c.expressions),
    "EMOTES (emote)", wrap(c.emotes),
    "BACKGROUND COLOURS (bg: \"mint\")", wrap(c.bgColors),
    "BACKGROUND TYPES (bg: {\"type\": \"space\"})", wrap(c.bgTypes),
    `PROPS (props[].name, items[].prop, holding) — ${c.props.length} drawings; aliases also work`, wrap(c.props),
    "PROP MOTION (props[].motion)", wrap(c.motions),
    "ENTRANCES (enter)", wrap(c.enters),
    "TEXT STYLES (texts[].style)", wrap(c.textStyles),
    "TRANSITIONS (transition)", wrap(c.transitions),
    "COMPARE SYMBOLS (symbol)", wrap(c.symbols),
    "SOUND EFFECTS (sfx[].name)", wrap(c.sfx),
  ].join("\n");
}
