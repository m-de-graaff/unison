import { expect, it } from "vitest";
import { contrastRatio } from "../src/contrast";

it("black on white is 21:1", () => {
  expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
});

it("#777777 on white is below 4.5:1", () => {
  expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
});
