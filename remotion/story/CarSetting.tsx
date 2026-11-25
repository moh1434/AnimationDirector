import React, { useId } from "react";
import { INK } from "./theme";
import { CelFilter } from "./shade";
import { FAMILY_PROPS } from "./FamilyProps";

/**
 * Inside a car, seen from in front of the windscreen, drawn like the other story settings (flat fills, a thick
 * ink outline, the shared cel shade): the two front seats (passenger on the LEFT, driver on the RIGHT), the
 * back seat, and the rear window where the street ("car") or the park with the swings ("car_park") slides past.
 * Stand the actors at y ≈ 0.97 (size ≈ 0.5) and put the `car_dash` prop in front of them (x 0.5, y 1,
 * anchor bottom, size 0.5, zIndex 6) to hide their legs. Laid out for 9:16; it also fills 16:9.
 */
export const CAR_SETTINGS = ["car", "car_park"] as const;

const sid = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

export const CarSetting: React.FC<{ type: string; W: number; H: number; t?: number }> = ({ type, W, H, t = 0 }) => {
  const u = Math.min(W, H) / 1080;
  const id = "car" + sid(useId());
  const park = type === "car_park";
  const st = { stroke: INK, strokeWidth: 6 * u, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const cel = `url(#${id}cel)`;
  const wx0 = W * 0.08, wx1 = W * 0.92, wy0 = H * 0.24, wy1 = H * 0.53;
  const tile = 900 * u, off = (t * 150 * u) % tile;
  const base = wy1 - 34 * u;
  const view = (k: number) => (
    <g key={k} transform={`translate(${wx0 - off + k * tile} 0)`} {...st}>
      {park ? (
        <>
          <rect x={-4} y={base - 90 * u} width={tile + 8} height={130 * u} fill="#9edb8c" />
          <g filter={cel}>
            <path d={`M${110 * u} ${base - 60 * u} V${base - 200 * u}`} strokeWidth={14 * u} stroke="#ba885b" />
            <path d={`M${20 * u} ${base - 190 * u} Q${0} ${base - 300 * u} ${100 * u} ${base - 320 * u} Q${220 * u} ${base - 320 * u} ${200 * u} ${base - 190 * u}Z`} fill="#52b882" />
          </g>
          <g transform={`translate(${470 * u} ${base - 150 * u}) scale(${1.1 * u})`}>{FAMILY_PROPS.swing_set.draw(t, {})}</g>
          <g filter={cel}>
            <path d={`M${780 * u} ${base - 60 * u} V${base - 180 * u}`} strokeWidth={14 * u} stroke="#ba885b" />
            <path d={`M${690 * u} ${base - 170 * u} Q${680 * u} ${base - 280 * u} ${780 * u} ${base - 290 * u} Q${880 * u} ${base - 280 * u} ${870 * u} ${base - 170 * u}Z`} fill="#3d986d" />
          </g>
        </>
      ) : (
        [0, 1, 2].map((i) => {
          const hx = (40 + i * 300) * u, hw = 240 * u, hh = (190 + (i % 2) * 50) * u;
          return (
            <g key={i} filter={cel}>
              <rect x={hx} y={base - hh} width={hw} height={hh} fill={["#ffe4ad", "#bfe0d0", "#f4c3d0"][i]} />
              <path d={`M${hx - 16 * u} ${base - hh} L${hx + hw / 2} ${base - hh - 90 * u} L${hx + hw + 16 * u} ${base - hh}Z`} fill={["#7c5ce0", "#3d6fb0", "#e8836b"][i]} />
              <rect x={hx + 40 * u} y={base - hh + 50 * u} width={50 * u} height={50 * u} fill="#a8dcff" />
              <rect x={hx + 150 * u} y={base - hh + 50 * u} width={50 * u} height={50 * u} fill="#a8dcff" />
            </g>
          );
        })
      )}
    </g>
  );
  return (
    <>
      <defs>
        <CelFilter id={`${id}cel`} depth={15} opacity={0.2} />
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fc4ff" /><stop offset="1" stopColor="#e8f7ff" /></linearGradient>
        <clipPath id={`${id}win`}><rect x={wx0} y={wy0} width={wx1 - wx0} height={wy1 - wy0} rx={60 * u} /></clipPath>
      </defs>
      {/* the roof lining */}
      <rect width={W} height={H} fill="#d8d2c6" />
      {/* the rear window and the world sliding past */}
      <g clipPath={`url(#${id}win)`}>
        <rect x={wx0} y={wy0} width={wx1 - wx0} height={wy1 - wy0} fill={`url(#${id}sky)`} />
        {[0, 1, 2, 3].map(view)}
        <rect x={wx0} y={base} width={wx1 - wx0} height={60 * u} fill="#cfd3da" {...st} />
      </g>
      <rect x={wx0} y={wy0} width={wx1 - wx0} height={wy1 - wy0} rx={60 * u} fill="none" {...st} strokeWidth={14 * u} stroke="#4b5563" />
      <rect x={wx0} y={wy0} width={wx1 - wx0} height={wy1 - wy0} rx={60 * u} fill="none" {...st} />
      {/* the back seat and its headrests */}
      <g filter={cel}>
        <rect x={-10} y={wy1 + 10 * u} width={W + 20} height={H} fill="#5b6275" {...st} />
        {[0.22, 0.78].map((k) => <rect key={k} x={W * k - 90 * u} y={wy1 + 34 * u} width={180 * u} height={110 * u} rx={40 * u} fill="#6c7489" {...st} />)}
      </g>
      {/* the two front seats, right behind the actors */}
      {[0.3, 0.7].map((k) => (
        <g key={k} {...st} filter={cel}>
          <rect x={W * k - 36 * u} y={H * 0.615 + 130 * u} width={72 * u} height={80 * u} fill="#3e4455" />
          <rect x={W * k - 70 * u} y={H * 0.615} width={140 * u} height={150 * u} rx={50 * u} fill="#7a8399" />
          <rect x={W * k - 180 * u} y={H * 0.615 + 190 * u} width={360 * u} height={H} rx={70 * u} fill="#7a8399" />
        </g>
      ))}
      {/* the windscreen's pillars and top edge, closest to the camera */}
      <path d={`M-10 -10 L${90 * u} -10 L${10 * u} ${H + 10} L-10 ${H + 10}Z M${W + 10} -10 L${W - 90 * u} -10 L${W - 10 * u} ${H + 10} L${W + 10} ${H + 10}Z`} fill="#30343f" {...st} />
      <rect x={-10} y={-10} width={W + 20} height={70 * u} fill="#30343f" {...st} />
    </>
  );
};
