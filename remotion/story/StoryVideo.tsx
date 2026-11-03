import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig, delayRender, continueRender, ENGINE } from "./engine";
import type { RenderProps, Scene } from "./types";
import { SceneView } from "./Scene";
import { Captions, groupWords } from "./Captions";
import { prog } from "./anim";
import { FONT, INK } from "./theme";
import { setCustomProps } from "./Props";

/* ---------- fonts (bundled, offline) ---------- */
const FONT_FILES: [string, string, string][] = [
  ["Baloo Bhaijaan 2", "assets/fonts/baloo-bhaijaan-2-arabic-800-normal.woff2", "800"],
  ["Baloo Bhaijaan 2", "assets/fonts/baloo-bhaijaan-2-latin-800-normal.woff2", "800"],
  ["Baloo Bhaijaan 2", "assets/fonts/baloo-bhaijaan-2-arabic-700-normal.woff2", "700"],
  ["Baloo Bhaijaan 2", "assets/fonts/baloo-bhaijaan-2-latin-700-normal.woff2", "700"],
  ["Baloo Bhaijaan 2", "assets/fonts/baloo-bhaijaan-2-arabic-500-normal.woff2", "500"],
  ["Baloo Bhaijaan 2", "assets/fonts/baloo-bhaijaan-2-latin-500-normal.woff2", "500"],
  ["Lalezar", "assets/fonts/lalezar-arabic-400-normal.woff2", "400"],
  ["Lalezar", "assets/fonts/lalezar-latin-400-normal.woff2", "400"],
];
let fontsPromise: Promise<void> | null = null;
let fontsReady = false;
const loadFonts = () => {
  if (fontsPromise || typeof document === "undefined") return fontsPromise;
  fontsPromise = Promise.all(
    FONT_FILES.map(([fam, file, weight]) => {
      const ff = new FontFace(fam, `url(${staticFile(file)})`, { weight });
      return ff.load().then((f) => (document as any).fonts.add(f)).catch(() => null);
    }),
  ).then(() => { fontsReady = true; });
  return fontsPromise;
};

/** Holds the frame until the fonts are in, then re-renders once so text is measured with them. */
const useFonts = () => {
  const [ready, setReady] = useState(fontsReady);
  useLayoutEffect(() => {
    if (ready) return;
    const h = delayRender("fonts");
    (loadFonts() ?? Promise.resolve()).then(() => {
      setReady(true);
      requestAnimationFrame(() => continueRender(h));
    });
  }, [ready]);
  return ready;
};

/* ---------- transitions ---------- */
const TransitionWrap: React.FC<{ scene: Scene; next?: Scene; durFrames: number; W: number; H: number; children: React.ReactNode }> = ({ scene, next, durFrames, W, H, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inK = scene.transition ?? "cut";
  const outK = next?.transition ?? "cut";
  const tIn = f / fps;
  const tOut = (durFrames - f) / fps; // seconds until the cut
  let tx = 0, ty = 0, sc = 1, blur = 0, overlay: React.ReactNode = null;
  const D = 0.2;
  if (inK === "whip" && tIn < D) { const p = prog(tIn, 0, D, "power3.out"); tx = (1 - p) * W * 0.7; blur = (1 - p) * 26; }
  if (outK === "whip" && tOut < D) { const p = 1 - tOut / D; tx = -p * p * W * 0.7; blur = p * 26; }
  if (inK === "slide" && tIn < 0.28) { const p = prog(tIn, 0, 0.28, "power3.out"); ty = (1 - p) * H; }
  if (inK === "zoom" && tIn < 0.3) { const p = prog(tIn, 0, 0.3, "power3.out"); sc = 1.6 - 0.6 * p; blur = (1 - p) * 10; }
  if (outK === "zoom" && tOut < 0.18) { const p = 1 - tOut / 0.18; sc = 1 + p * 0.5; blur = p * 10; }
  if (inK === "flash" && tIn < 0.25) overlay = <AbsoluteFill style={{ background: "#fff", opacity: 1 - prog(tIn, 0, 0.25, "power1.out"), zIndex: 90 }} />;
  if (inK === "fade" && tIn < 0.3) overlay = <AbsoluteFill style={{ background: "#000", opacity: 1 - prog(tIn, 0, 0.3), zIndex: 90 }} />;
  if (outK === "fade" && tOut < 0.25) overlay = <AbsoluteFill style={{ background: "#000", opacity: 1 - tOut / 0.25, zIndex: 90 }} />;
  const iris = (r: number) => {
    const R = Math.hypot(W, H) * 0.55 * r;
    return <AbsoluteFill style={{ zIndex: 90, background: `radial-gradient(circle at 50% 50%, transparent ${R}px, ${INK} ${R + 1}px)` }} />;
  };
  if (inK === "iris" && tIn < 0.35) overlay = iris(prog(tIn, 0, 0.35, "power2.in"));
  if (outK === "iris" && tOut < 0.3) overlay = iris(1 - prog(0.3 - tOut, 0, 0.3, "power2.in"));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) scale(${sc})`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>
      {overlay}
    </AbsoluteFill>
  );
};

const Watermark: React.FC<{ text: string; W: number; H: number }> = ({ text, W, H }) => (
  <div style={{ position: "absolute", right: W * 0.025, top: H * 0.03, fontFamily: FONT.body, fontWeight: 800, fontSize: Math.min(W, H) * 0.03, color: "#fff", opacity: 0.85, WebkitTextStroke: `4px ${INK}`, paintOrder: "stroke fill", zIndex: 60 }}>{text}</div>
);

/** Layout audit: report the real on-screen box of every tagged element (read by `pnpm video check`). */
const useLayoutAudit = (enabled: boolean, frame: number, W: number, H: number) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;
    const rr = ref.current.getBoundingClientRect();
    // the page may be scaled; fall back to the element's layout size if the rect is degenerate
    const root = { left: rr.left, top: rr.top, width: rr.width > 1 ? rr.width : ref.current.offsetWidth || W };
    const k = W / root.width;
    const boxes: any[] = [];
    ref.current.querySelectorAll("[data-box]").forEach((el) => {
      const target = el.tagName.toLowerCase() === "svg" && el.firstElementChild ? el.firstElementChild : el;
      const r = (target as Element).getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      let fs = 0;
      if (!/^(char|prop|item)/.test(el.getAttribute("data-box") ?? "")) {
        // font size of the first real text in the element (ignores wrappers)
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let n: Node | null;
        while ((n = w.nextNode())) if ((n.textContent ?? "").trim() && n.parentElement) { fs = parseFloat(getComputedStyle(n.parentElement).fontSize) * k || 0; break; }
      }
      const text = ((el as HTMLElement).innerText ?? el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
      boxes.push({ kind: el.getAttribute("data-box"), x0: (r.left - root.left) * k, y0: (r.top - root.top) * k, x1: (r.right - root.left) * k, y1: (r.bottom - root.top) * k, fs, text });
    });
    console.log("LAYOUT_AUDIT " + JSON.stringify({ frame, W, H, root: [rr.left, rr.top, rr.width, rr.height], boxes }));
  });
  return ref;
};

export const StoryVideo: React.FC<RenderProps & { audit?: boolean }> = (props) => {
  const fontsIn = useFonts();
  const { storyboard: sb, words = [], mouth = [], audio } = props;
  setCustomProps(sb.customProps);
  const { width: W, height: H, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const time = frame / fps;
  const scenes = sb.scenes ?? [];
  const groups = useMemo(() => {
    const maxChars = sb.captions?.maxChars ?? (H > W ? 22 : 38);
    return groupWords(words, maxChars, scenes.map((s) => s.start));
  }, [words, scenes, W, H, sb.captions?.maxChars]);
  // no captions over title cards (the words are already on screen)
  const inTitle = scenes.some((s, i) => s.layout === "title" && time >= s.start && time < (scenes[i + 1]?.start ?? sb.duration));
  const captionsOn = sb.captions?.enabled ?? H > W;
  const showCaptions = captionsOn && !inTitle;
  const auditRef = useLayoutAudit(!!props.audit && fontsIn, frame, W, H);

  return (
    <AbsoluteFill ref={auditRef} style={{ background: "#111", fontFamily: FONT.body }}>
      {scenes.map((s, i) => {
        const from = Math.round(s.start * fps);
        const to = i < scenes.length - 1 ? Math.round(scenes[i + 1].start * fps) : Math.round(Math.max(s.end, sb.duration) * fps);
        const d = Math.max(1, to - from);
        return (
          <Sequence key={s.id ?? i} from={from} durationInFrames={d} name={`${i + 1}. ${s.layout ?? ""} ${(s.text ?? "").slice(0, 30)}`}>
            <TransitionWrap scene={s} next={scenes[i + 1]} durFrames={d} W={W} H={H}>
              <SceneView scene={s} sb={sb} mouth={mouth} startFrame={from} index={i} W={W} H={H} captionsOn={captionsOn} />
            </TransitionWrap>
          </Sequence>
        );
      })}
      {showCaptions && <Captions sb={{ ...sb, captions: { ...(sb.captions ?? {}), enabled: true } }} words={words} time={time} W={W} H={H} groups={groups} />}
      {sb.watermark && <Watermark text={sb.watermark} W={W} H={H} />}
      {audio && ENGINE === "remotion" && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};

export const FORMATS = {
  youtube: { width: 1920, height: 1080 },
  shorts: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};
