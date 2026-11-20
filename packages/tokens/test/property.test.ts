import { inGamut, parse } from "culori";
import fc from "fast-check";
import { expect, it } from "vitest";
import { autoAdjust } from "../src/color/auto-contrast";
import { generateScale, STEPS } from "../src/color/generate-scale";

const hue = fc.double({ min: 0, max: 360, noNaN: true });
const chroma = fc.double({ min: 0, max: 0.37, noNaN: true });
const mode = fc.constantFrom("light" as const, "dark" as const);

it("scales are monotonic, in sRGB and deterministic for any hue and chroma", () => {
  fc.assert(
    fc.property(hue, chroma, mode, (h, c, m) => {
      const a = generateScale({ name: "x", hue: h, chroma: c, mode: m });
      const ls = STEPS.map((s) => Number(/oklch\(([\d.]+)/.exec(a[s].oklch)?.[1]));
      const ok = ls.every(
        (l, i) =>
          i === 0 || (m === "light" ? l < (ls[i - 1] as number) : l > (ls[i - 1] as number)),
      );
      return (
        ok &&
        STEPS.every((s) => inGamut("rgb")(parse(a[s].hex))) &&
        JSON.stringify(a) ===
          JSON.stringify(generateScale({ name: "x", hue: h, chroma: c, mode: m }))
      );
    }),
  );
});

it("autoAdjust terminates within 100 steps for any seed (OQ-4)", () => {
  const hex = fc
    .integer({ min: 0, max: 0xffffff })
    .map((n) => `#${n.toString(16).padStart(6, "0")}`);
  fc.assert(
    fc.property(hex, hex, (fg, bg) => {
      const steps = { n: 0 };
      autoAdjust(fg, bg, 4.5, steps); // the optional 4th argument counts iterations
      // n ≥ 1: the counter must really count (a counter left at 0 would pass n ≤ 100 trivially).
      return steps.n >= 1 && steps.n <= 100;
    }),
  );
});

it("an impossible minimum gives up rather than looping", () => {
  const steps = { n: 0 };
  expect(autoAdjust("#777777", "#777777", 21, steps)).toBeUndefined();
  expect(steps.n).toBeLessThanOrEqual(100);
});
