import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import { join } from "node:path";
import { ROOT, remotionBrowser } from "./env.mjs";

let bundled = new Map();
export async function getBundle(publicDir) {
  if (bundled.has(publicDir)) return bundled.get(publicDir);
  const serveUrl = await bundle({ entryPoint: join(ROOT, "remotion", "index.ts"), publicDir, onProgress: () => {} });
  bundled.set(publicDir, serveUrl);
  return serveUrl;
}

const common = () => {
  const b = remotionBrowser();
  return b ? { browserExecutable: b } : {};
};

export async function renderVideo({ publicDir, inputProps, out, compositionId = "StoryVideo", draft = false, onProgress, concurrency }) {
  const serveUrl = await getBundle(publicDir);
  const composition = await selectComposition({ serveUrl, id: compositionId, inputProps, ...common() });
  await renderMedia({
    serveUrl, composition, inputProps, codec: "h264", outputLocation: out,
    scale: draft ? 0.5 : 1, crf: draft ? 28 : 18, pixelFormat: "yuv420p", audioBitrate: "192k",
    concurrency: concurrency ?? null, x264Preset: draft ? "veryfast" : "medium",
    onProgress: ({ progress }) => onProgress?.(progress), ...common(),
    chromiumOptions: { gl: "swiftshader" },
  });
  return out;
}

export async function renderStills({ publicDir, inputProps, frames, outPattern, compositionId = "StoryVideo", scale = 0.5, onLog }) {
  const serveUrl = await getBundle(publicDir);
  const composition = await selectComposition({ serveUrl, id: compositionId, inputProps, ...common() });
  const outs = [];
  // Expanded motion audits render many frames. Reuse Chrome instead of launching it for each one.
  const browser = await openBrowser("chrome", common());
  try {
    for (const f of frames) {
      const output = outPattern.replace("{f}", String(f).padStart(5, "0"));
      await renderStill({ serveUrl, composition, inputProps, puppeteerInstance: browser, frame: Math.min(f, composition.durationInFrames - 1), output, imageFormat: "jpeg", jpegQuality: 85, scale, onBrowserLog: onLog ? (l) => onLog(l.text, f) : undefined, ...common() });
      outs.push(output);
    }
  } finally {
    await browser.close({ silent: true });
  }
  return outs;
}
