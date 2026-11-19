import { describe, expect, it } from "vitest";
import { simulateSpring } from "../src/spring";

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
