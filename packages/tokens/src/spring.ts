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

/**
 * Integrates x'' = (−stiffness·(x − 1) − damping·v) / mass from x = 0, v = 0 until the spring
 * settles (|x − 1| < 0.001 and |v| < 0.001) or 2 s pass. Returns 32 samples evenly spaced in time.
 */
export function simulateSpring(spring: SpringConfig): { durationMs: number; samples: number[] } {
  let x = 0;
  let v = 0;
  let t = 0;
  const positions = [0];
  while (t < MAX_SECONDS) {
    const a = (-spring.stiffness * (x - 1) - spring.damping * v) / spring.mass;
    v += a * STEP;
    x += v * STEP;
    t += STEP;
    positions.push(x);
    if (Math.abs(x - 1) < EPSILON && Math.abs(v) < EPSILON) break;
  }
  const last = positions.length - 1;
  const samples = Array.from(
    { length: SAMPLE_COUNT },
    (_, i) => positions[Math.round((i * last) / (SAMPLE_COUNT - 1))] as number,
  );
  return { durationMs: Math.round(t * 1000), samples };
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
