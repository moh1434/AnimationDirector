// Copies browser builds of GSAP (+ plugins) and Tone.js into hyperframes/vendor/
// so HyperFrames compositions load them locally (offline, same version as package.json).
// Runs automatically after `pnpm install` (see "postinstall" in package.json),
// or manually with `pnpm vendor`.
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const out = join(root, "hyperframes", "vendor");

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "gsap"), { recursive: true });

const gsapDist = join(dirname(require.resolve("gsap/package.json")), "dist");
for (const f of readdirSync(gsapDist)) {
  if (f.endsWith(".min.js")) cpSync(join(gsapDist, f), join(out, "gsap", f));
}

const toneBuild = join(dirname(require.resolve("tone/package.json")), "build", "Tone.js");
cpSync(toneBuild, join(out, "Tone.js"));

console.log("vendored gsap + tone -> hyperframes/vendor/");
