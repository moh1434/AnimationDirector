import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import gsap from "gsap";

export type DidYouKnowProps = {
  kicker: string;
  fact: string;
};

/**
 * Remotion + GSAP pattern: build a *paused* GSAP timeline once,
 * then seek it to the current frame on every render. This keeps
 * GSAP animations frame-accurate and deterministic when rendering.
 */
export const DidYouKnow: React.FC<DidYouKnowProps> = ({ kicker, fact }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      tl.current = gsap
        .timeline({ paused: true })
        .from(".dot", { scale: 0, duration: 0.5, ease: "back.out(2)" }, 0)
        .from(".kicker", { y: 60, opacity: 0, duration: 0.6, ease: "power3.out" }, 0.2)
        .from(".word", { y: 80, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }, 0.8)
        .to(".dot", { y: -20, duration: 0.6, yoyo: true, repeat: 5, ease: "sine.inOut" }, 1.4);
    }, root);
    return () => ctx.revert();
  }, [fact, kicker]);

  // Drive the timeline from Remotion's clock.
  tl.current?.seek(frame / fps, false);

  return (
    <AbsoluteFill
      ref={root}
      style={{
        background: "#0f172a",
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
        textAlign: "center",
      }}
    >
      <div className="dot" style={{ width: 90, height: 90, borderRadius: 999, background: "#facc15", marginBottom: 60 }} />
      <div className="kicker" style={{ fontSize: 64, color: "#facc15", fontWeight: 700, marginBottom: 40 }}>
        {kicker}
      </div>
      <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.15 }}>
        {fact.split(" ").map((w, i) => (
          <span key={i} className="word" style={{ display: "inline-block", marginRight: "0.25em" }}>
            {w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
