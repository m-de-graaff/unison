import { describe, expect, it } from "vitest";
import { simulateSpring, springPosition } from "../src/spring";

const snappy = { stiffness: 400, damping: 30, mass: 1 };

describe("simulateSpring", () => {
  it("snappy settles in 150–600 ms", () => {
    const { durationMs } = simulateSpring(snappy);
    expect(durationMs).toBeGreaterThanOrEqual(150);
    expect(durationMs).toBeLessThanOrEqual(600);
  });

  it("samples start at 0 and end within 0.001 of 1", () => {
    const { samples } = simulateSpring(snappy);
    expect(samples).toHaveLength(32);
    expect(samples[0]).toBe(0);
    expect(Math.abs((samples.at(-1) as number) - 1)).toBeLessThan(0.001);
  });

  it("a heavily damped spring never exceeds 1", () => {
    const { samples } = simulateSpring({ stiffness: 400, damping: 80, mass: 1 });
    expect(Math.max(...samples)).toBeLessThanOrEqual(1);
  });

  it("a bouncy spring overshoots above 1", () => {
    const { samples } = simulateSpring({ stiffness: 300, damping: 10, mass: 1 });
    expect(Math.max(...samples)).toBeGreaterThan(1);
  });
});

const SPRINGS = {
  snappy: { stiffness: 400, damping: 30, mass: 1 },
  smooth: { stiffness: 300, damping: 35, mass: 1 },
  bouncy: { stiffness: 300, damping: 15, mass: 1 },
};

/** x(t) for x(0) = 0, v(0) = 0, target 1. */
function analytic({ stiffness: k, damping: d, mass: m }: typeof SPRINGS.snappy, t: number): number {
  const w0 = Math.sqrt(k / m);
  const z = d / (2 * Math.sqrt(k * m));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  const s = Math.sqrt(z * z - 1);
  const r1 = -w0 * (z - s);
  const r2 = -w0 * (z + s);
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

describe.each(Object.entries(SPRINGS))("%s", (_, spring) => {
  it.each([50, 100, 200, 300, 500])("matches the analytic solution at %i ms within 0.005", (ms) => {
    expect(Math.abs(springPosition(spring, ms) - analytic(spring, ms / 1000))).toBeLessThan(0.005);
  });
});

it("ζ matches the table", () => {
  const zeta = ({ stiffness, damping, mass }: typeof SPRINGS.snappy) =>
    damping / (2 * Math.sqrt(stiffness * mass));
  expect(zeta(SPRINGS.snappy)).toBeCloseTo(0.75, 2);
  expect(zeta(SPRINGS.smooth)).toBeCloseTo(1.01, 2);
  expect(zeta(SPRINGS.bouncy)).toBeCloseTo(0.43, 2);
});

it("smooth never exceeds 1.0", () => {
  expect(Math.max(...simulateSpring(SPRINGS.smooth).samples)).toBeLessThanOrEqual(1);
});
