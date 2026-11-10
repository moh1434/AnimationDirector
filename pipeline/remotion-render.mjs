import { bundle } from "@remotion/bundler";
import { makeCancelSignal, renderMedia, renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import { join } from "node:path";
import { ROOT, remotionBrowser } from "./env.mjs";
import { bundlerName } from "./whisper-config.mjs";

let bundled = new Map();
export async function getBundle(publicDir) {
  if (bundled.has(publicDir)) return bundled.get(publicDir);
  // Rspack (default) bundles ~4x faster than webpack; REMOTION_BUNDLER="webpack" in .env switches back
  const serveUrl = await bundle({ entryPoint: join(ROOT, "remotion", "index.ts"), publicDir, onProgress: () => {}, rspack: bundlerName() === "rspack" });
  bundled.set(publicDir, serveUrl);
  return serveUrl;
}

const common = () => {
  const b = remotionBrowser();
  return b ? { browserExecutable: b } : {};
};

/** CPU: software drawing + x264. GPU: Chrome draws on the graphics card and NVENC encodes (it takes a bitrate, not a crf). */
const engine = (gpu, draft) => (gpu
  ? { chromiumOptions: { gl: "angle" }, hardwareAcceleration: "if-possible", videoBitrate: draft ? "3M" : GPU_BITRATE }
  : { chromiumOptions: { gl: "swiftshader" }, crf: draft ? 28 : 18, x264Preset: draft ? "veryfast" : "medium" });
const GPU_BITRATE = "6M";

/**
 * Run a GPU render so that any failure comes back as an error. When the hardware encoder dies, its
 * pipe breaks outside Remotion's promise (write EPIPE) and would otherwise end the whole process.
 */
function catchingEncoderCrash(start) {
  return new Promise((resolve, reject) => {
    const { cancelSignal, cancel } = makeCancelSignal();
    let crash = null;
    const onCrash = (e) => { crash ??= e; cancel(); };
    process.on("uncaughtException", onCrash);
    start(cancelSignal).then(
      (value) => (crash ? reject(crash) : resolve(value)),
      (e) => reject(crash ?? e),
    ).finally(() => process.off("uncaughtException", onCrash));
  });
}

export async function renderVideo({ publicDir, inputProps, out, compositionId = "StoryVideo", draft = false, onProgress, concurrency, gpu = false, onGpuFailed }) {
  const serveUrl = await getBundle(publicDir);
  const composition = await selectComposition({ serveUrl, id: compositionId, inputProps, ...common() });
  const run = (useGpu, cancelSignal) => renderMedia({
    serveUrl, composition, inputProps, codec: "h264", outputLocation: out,
    scale: draft ? 0.5 : 1, pixelFormat: "yuv420p", audioBitrate: "192k",
    concurrency: concurrency ?? null, cancelSignal,
    onProgress: ({ progress }) => onProgress?.(progress), ...common(),
    ...engine(useGpu, draft),
  });
  if (!gpu) await run(false);
  else try { await catchingEncoderCrash((signal) => run(true, signal)); } catch (e) {
    // no NVIDIA card, an old driver, or a crash part way through: the video must still get made
    onGpuFailed?.(e);
    await run(false);
  }
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
