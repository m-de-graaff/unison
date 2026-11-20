import { expect, it } from "vitest";
import { buildTheme } from "../src/build";
import { legacyShadow, shadowToCss } from "../src/shadow";

const t = buildTheme({
  name: "default",
  accent: { name: "accent", hue: 275, chroma: 0.2 },
  neutral: { name: "gray", hue: 275, chroma: 0.012 },
  autoContrast: true,
});
const css = (s: "light" | "dark", p: string) => shadowToCss(t[s].tokens.get(p)?.value as never);

it("light values match the todo", () => {
  expect(css("light", "shadow.xs")).toBe("0 1px 2px rgb(0 0 0 / 0.05)");
  expect(css("light", "shadow.lg")).toBe(
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  );
});
it("dark multiplies alpha by 2.5, capped at 0.5", () => {
  expect(css("dark", "shadow.xs")).toBe("0 1px 2px rgb(0 0 0 / 0.13)"); // 0.125 → 2 decimals
  expect(css("dark", "shadow.xl")).toBe(
    "0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)",
  );
});
it("elevations alias shadows", () => {
  expect(t.light.tokens.get("elevation.popover")?.aliasOf).toBe("shadow.lg");
});
it("layers and breakpoints", () => {
  expect(t.light.tokens.get("z-index.toast")?.value).toBe(1700);
  expect(
    (t.light.tokens.get("breakpoint.2xl")?.value as { value: number } | undefined)?.value,
  ).toBe(1536);
});

it("legacyShadow takes the largest layer and the Android elevation", () => {
  const lg = t.light.tokens.get("shadow.lg")?.value as Parameters<typeof legacyShadow>[0];
  expect(legacyShadow(lg, "lg")).toEqual({
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 7.5,
    elevation: 8,
  });
});
