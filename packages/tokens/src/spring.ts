// Platform-free: re-exported to browsers through "@unison-ui/tokens/spring". No node: imports.

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

const STEP = 1 / 240;
const MAX_SECONDS = 2;
const EPSILON = 0.001;
const SAMPLE_COUNT = 32;

function rk4Step(s: SpringConfig, x: number, v: number, h: number): [number, number] {
  const accel = (px: number, pv: number) => (-s.stiffness * (px - 1) - s.damping * pv) / s.mass;
  const k1x = v;
  const k1v = accel(x, v);
  const k2x = v + (h / 2) * k1v;
  const k2v = accel(x + (h / 2) * k1x, v + (h / 2) * k1v);
  const k3x = v + (h / 2) * k2v;
  const k3v = accel(x + (h / 2) * k2x, v + (h / 2) * k2v);
  const k4x = v + h * k3v;
  const k4v = accel(x + h * k3x, v + h * k3v);
  return [
    x + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
    v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v),
  ];
}

/** Spring position (target 1, from x = 0, v = 0) after `tMs`, by RK4 at a 1/240 s step. */
export function springPosition(spring: SpringConfig, tMs: number): number {
  const n = Math.round(tMs / 1000 / STEP);
  let x = 0;
  let v = 0;
  for (let i = 0; i < n; i++) [x, v] = rk4Step(spring, x, v, STEP);
  return x;
}

/**
 * Integrates x'' = (−stiffness·(x − 1) − damping·v) / mass (RK4, 1/240 s) from x = 0, v = 0 until
 * the spring settles (|x − 1| < 0.001 and |v| < 0.001) or 2 s pass. Returns 32 samples evenly
 * spaced in time.
 */
export function simulateSpring(spring: SpringConfig): { durationMs: number; samples: number[] } {
  let x = 0;
  let v = 0;
  let steps = 0;
  const positions = [0];
  while (steps * STEP < MAX_SECONDS) {
    [x, v] = rk4Step(spring, x, v, STEP);
    steps++;
    positions.push(x);
    if (Math.abs(x - 1) < EPSILON && Math.abs(v) < EPSILON) break;
  }
  const last = positions.length - 1;
  const samples = Array.from(
    { length: SAMPLE_COUNT },
    (_, i) => positions[Math.round((i * last) / (SAMPLE_COUNT - 1))] as number,
  );
  return { durationMs: Math.round(steps * STEP * 1000), samples };
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** A CSS `linear()` easing that reproduces the spring, plus the duration to pair it with. */
export function springToCssLinear(spring: SpringConfig): { easing: string; durationMs: number } {
  const { durationMs, samples } = simulateSpring(spring);
  const points = samples.map(round4);
  points[0] = 0;
  points[points.length - 1] = 1;
  return { easing: `linear(${points.join(", ")})`, durationMs };
}
