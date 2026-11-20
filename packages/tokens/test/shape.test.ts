import { expect, it } from "vitest";
import { buildTheme } from "../src/build";

const base = {
  name: "default",
  accent: { name: "accent", hue: 275, chroma: 0.2 },
  neutral: { name: "gray", hue: 275, chroma: 0.012 },
  autoContrast: true,
};
const px = (t: ReturnType<typeof buildTheme>, path: string) =>
  (t.light.tokens.get(path)?.value as { value: number } | undefined)?.value;

it("compact density makes control-md 36", () =>
  expect(px(buildTheme({ ...base, density: "compact" }), "size.control-md")).toBe(36));
it("default density makes control-md 40", () =>
  expect(px(buildTheme(base), "size.control-md")).toBe(40));
it("radius lg makes card 12", () =>
  expect(px(buildTheme({ ...base, radius: "lg" }), "radius.card")).toBe(12));
it.each([
  ["none", 0, 0, 0],
  ["sm", 4, 6, 8],
  ["md", 6, 8, 12],
  ["lg", 8, 12, 16],
  ["full", 9999, 16, 16],
] as const)("radius %s → control %i, card %i, overlay %i", (radius, control, card, overlay) => {
  const t = buildTheme({ ...base, radius });
  expect([px(t, "radius.control"), px(t, "radius.card"), px(t, "radius.overlay")]).toEqual([
    control,
    card,
    overlay,
  ]);
});
it("space.4 is 16 and touch-target is always 44", () => {
  expect(px(buildTheme(base), "space.4")).toBe(16);
  expect(px(buildTheme({ ...base, density: "compact" }), "size.touch-target")).toBe(44);
});
