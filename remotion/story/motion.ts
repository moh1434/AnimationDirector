// Shared, frame-independent motion policy (seconds, not frame counts).
export const MOTION = { gesture: 0.5, expression: 0.28, transition: 0.32, speech: 0.10 };
export const smooth = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
/** Interrupted cubic blends preserve both position and velocity; seeking needs no previous frame. */
/**
 * `bounce` (optional, one number per channel) adds anticipation and overshoot to a move: the value
 * first dips a little the other way, then passes its target and settles. 0.12 = 12 % of the move.
 */
export function sampleTrack(initial: number[], events: { at: number; value: number[] }[], time: number, duration: number, bounce?: number[]) {
  let from = initial, to = initial, velocity = initial.map(() => 0), start = -duration;
  const evaluate = (t: number) => {
    const u = Math.max(0, Math.min(1, (t - start) / duration));
    const value = from.map((a, i) => (2*u*u*u-3*u*u+1)*a + (u*u*u-2*u*u+u)*duration*velocity[i] + (-2*u*u*u+3*u*u)*to[i]);
    const speed = from.map((a, i) => u === 1 ? 0 : ((6*u*u-6*u)*a + (3*u*u-4*u+1)*duration*velocity[i] + (-6*u*u+6*u)*to[i])/duration);
    return { value, speed };
  };
  for (const event of events) {
    if (event.at > time) break;
    const current = evaluate(event.at);
    from = current.value; velocity = current.speed; to = event.value; start = event.at;
  }
  const value = evaluate(time).value;
  if (!bounce) return value;
  const u = Math.max(0, Math.min(1, (time - start) / duration));
  // zero (and flat) at both ends; negative in the first half (anticipation), positive in the second (overshoot)
  const wave = -Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * u);
  return value.map((v, i) => v + (to[i] - from[i]) * (bounce[i] ?? 0) * wave);
}
export function speechEnvelope(samples: number[], frame: number, fps: number) {
  const radius = Math.max(1, Math.round(fps * MOTION.speech));
  let sum = 0, weight = 0;
  for (let i = -radius; i <= radius; i++) { const w = radius + 1 - Math.abs(i); sum += (samples[frame+i] ?? 0)*w; weight += w; }
  return sum / weight / 100;
}
