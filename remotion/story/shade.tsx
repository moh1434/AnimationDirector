// Cel shading and soft shadows for every drawing, applied by the renderer so characters, animals
// and props all share one light. The light comes from the upper left; forms get a cool shadow band
// along their lower-right edge. Filters use only offset/composite/flood (no blur), so they are cheap
// in both renderers.
import React from "react";

/** Shadow tint: a cool violet that reads as shade on white skin and on saturated clothes alike. */
export const SHADE = "#33265e";
export const sid = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

/**
 * A filter that shades the lower-right edge of whatever silhouette it is applied to.
 * `depth` is the band's width in the drawing's own units; `opacity` its strength.
 * Use: <CelFilter id={id} depth={16} /> then <g filter={`url(#${id})`}>…</g>.
 */
export const CelFilter: React.FC<{ id: string; depth?: number; opacity?: number }> = ({ id, depth = 16, opacity = 0.2 }) => (
  <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
    <feOffset in="SourceAlpha" dx={-depth} dy={-depth * 0.55} result="moved" />
    <feComposite in="SourceAlpha" in2="moved" operator="out" result="band" />
    <feFlood floodColor={SHADE} floodOpacity={opacity} />
    <feComposite in2="band" operator="in" result="shade" />
    <feMerge>
      <feMergeNode in="SourceGraphic" />
      <feMergeNode in="shade" />
    </feMerge>
  </filter>
);

/** A filter that turns any drawing into a flat shadow of itself (for a fringe's shadow on the face). */
export const ShadowFilter: React.FC<{ id: string; opacity?: number }> = ({ id, opacity = 0.2 }) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="130%" colorInterpolationFilters="sRGB">
    <feFlood floodColor={SHADE} floodOpacity={opacity} />
    <feComposite in2="SourceAlpha" operator="in" />
  </filter>
);

/** A soft oval shadow on the ground (darker in the middle, fading out). */
export const GroundShadow: React.FC<{ id: string; rx: number; ry: number; x?: number; y?: number; opacity?: number }> = ({ id, rx, ry, x = 0, y = 0, opacity = 0.32 }) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor="#1b1436" stopOpacity={opacity} />
        <stop offset="0.6" stopColor="#1b1436" stopOpacity={opacity * 0.55} />
        <stop offset="1" stopColor="#1b1436" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id})`} />
  </g>
);
