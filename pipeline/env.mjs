// Shared paths and tool discovery (Windows + macOS + Linux).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const IS_WIN = process.platform === "win32";

export function findPython() {
  if (process.env.VIDEO_PYTHON) return process.env.VIDEO_PYTHON;
  const venv = IS_WIN ? join(ROOT, ".venv", "Scripts", "python.exe") : join(ROOT, ".venv", "bin", "python");
  if (existsSync(venv)) return venv;
  for (const c of IS_WIN ? ["python", "py"] : ["python3", "python"]) {
    const r = spawnSync(c, ["-c", "import numpy, pedalboard, pretty_midi"], { encoding: "utf8" });
    if (r.status === 0) return c;
  }
  return IS_WIN ? "python" : "python3";
}

export function findFfmpeg(name = "ffmpeg") {
  const env = process.env[name === "ffmpeg" ? "FFMPEG_PATH" : "FFPROBE_PATH"];
  if (env) return env;
  const r = spawnSync(name, ["-version"], { encoding: "utf8" });
  if (r.status === 0) return name;
  // Remotion ships an ffmpeg binary inside @remotion/compositor-*
  try {
    const nm = join(ROOT, "node_modules", "@remotion");
    for (const d of readdirSync(nm)) {
      if (!d.startsWith("compositor-")) continue;
      const p = join(nm, d, IS_WIN ? `${name}.exe` : name);
      if (existsSync(p)) return p;
    }
  } catch {}
  return null;
}

/** A Chromium for Tone.js offline rendering and for Remotion (if its own download is unavailable). */
export function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const cands = [];
  // Remotion's downloaded chrome-headless-shell
  const rem = join(ROOT, "node_modules", ".remotion", "chrome-headless-shell");
  try {
    for (const plat of readdirSync(rem)) {
      const base = join(rem, plat);
      for (const sub of readdirSync(base)) {
        cands.push(join(base, sub, IS_WIN ? "chrome-headless-shell.exe" : "chrome-headless-shell"));
      }
    }
  } catch {}
  if (IS_WIN) {
    const pf = [process.env["PROGRAMFILES"], process.env["PROGRAMFILES(X86)"], process.env["LOCALAPPDATA"]].filter(Boolean);
    for (const p of pf) {
      cands.push(join(p, "Google", "Chrome", "Application", "chrome.exe"));
      cands.push(join(p, "Microsoft", "Edge", "Application", "msedge.exe"));
    }
  } else if (process.platform === "darwin") {
    cands.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  } else {
    cands.push("/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser");
  }
  return cands.find((c) => existsSync(c)) ?? null;
}

/** Remotion uses its own headless shell unless REMOTION_CHROME (or CHROME_PATH on Linux CI) is set. */
export function remotionBrowser() {
  return process.env.REMOTION_CHROME || (process.platform === "linux" && process.env.CHROME_PATH) || null;
}

/** Run a package's CLI with this Node (no shell, so paths with spaces are safe on Windows). */
export function binOf(pkg, name) {
  const pj = JSON.parse(readFileSync(join(ROOT, "node_modules", pkg, "package.json"), "utf8"));
  const rel = typeof pj.bin === "string" ? pj.bin : pj.bin[name ?? Object.keys(pj.bin)[0]];
  return join(ROOT, "node_modules", pkg, rel);
}
