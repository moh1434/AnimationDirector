import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig, delayRender, continueRender, ENGINE } from "./engine";
import type { RenderProps, Scene } from "./types";
import { SceneView } from "./Scene";
import { Captions, groupWords } from "./Captions";
import { prog } from "./anim";
import { FONT, INK } from "./theme";

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
let fontsRequested = false;
const loadFonts = () => {
  if (fontsRequested || typeof document === "undefined") return;
  fontsRequested = true;
  const handle = delayRender("fonts");
  Promise.all(
    FONT_FILES.map(([fam, file, weight]) => {
      const ff = new FontFace(fam, `url(${staticFile(file)})`, { weight });
      return ff.load().then((f) => (document as any).fonts.add(f)).catch(() => null);
    }),
  ).then(() => continueRender(handle));
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

export const StoryVideo: React.FC<RenderProps> = (props) => {
  loadFonts();
  const { storyboard: sb, words = [], mouth = [], audio } = props;
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
  const showCaptions = (sb.captions?.enabled ?? H > W) && !inTitle;

  return (
    <AbsoluteFill style={{ background: "#111", fontFamily: FONT.body }}>
      {scenes.map((s, i) => {
        const from = Math.round(s.start * fps);
        const to = i < scenes.length - 1 ? Math.round(scenes[i + 1].start * fps) : Math.round(Math.max(s.end, sb.duration) * fps);
        const d = Math.max(1, to - from);
        return (
          <Sequence key={s.id ?? i} from={from} durationInFrames={d} name={`${i + 1}. ${s.layout ?? ""} ${(s.text ?? "").slice(0, 30)}`}>
            <TransitionWrap scene={s} next={scenes[i + 1]} durFrames={d} W={W} H={H}>
              <SceneView scene={s} sb={sb} mouth={mouth} startFrame={from} index={i} W={W} H={H} />
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
