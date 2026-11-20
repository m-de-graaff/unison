import { inGamut, parse } from "culori";
import { describe, expect, it } from "vitest";
import { generateScale, STEPS } from "../../src/color/generate-scale";
import { BUILT_IN_PALETTES, paletteFromSeed } from "../../src/color/palettes";

const lightness = (oklch: string) => Number(/oklch\(([\d.]+)/.exec(oklch)?.[1]);
const modes = ["light", "dark"] as const;

describe.each(BUILT_IN_PALETTES())("$name", (p) => {
  it.each(modes)("lightness is monotonic in %s", (mode) => {
    const ls = STEPS.map((s) => lightness(generateScale({ ...p, mode })[s].oklch));
    const sorted = [...ls].sort((a, b) => (mode === "light" ? b - a : a - b));
    expect(ls).toEqual(sorted);
    expect(new Set(ls).size).toBe(11);
  });
  it.each(modes)("every hex is inside sRGB in %s", (mode) => {
    for (const s of STEPS)
      expect(inGamut("rgb")(parse(generateScale({ ...p, mode })[s].hex))).toBe(true);
  });
});

it("matches the committed snapshot of all 12 scales", () => {
  const all = Object.fromEntries(
    BUILT_IN_PALETTES().flatMap((p) =>
      modes.map((mode) => [`${p.name}/${mode}`, generateScale({ ...p, mode })]),
    ),
  );
  expect(all).toMatchSnapshot();
});

it("is deterministic", () => {
  const p = { name: "accent", hue: 275, chroma: 0.2, mode: "light" as const };
  expect(JSON.stringify(generateScale(p))).toBe(JSON.stringify(generateScale(p)));
});

it("anchors a seed exactly", () => {
  const { light, dark } = paletteFromSeed("#e11d48", { anchor: true });
  expect(Object.values(light).map((s) => s.hex)).toContain("#e11d48");
  expect(Object.values(dark).map((s) => s.hex)).toContain("#e11d48"); // OQ-16: both modes
});

it("pins the reference values from the plan's contrast table", () => {
  const gray = (mode: "light" | "dark") =>
    generateScale({ name: "gray", hue: 275, chroma: 0.012, mode });
  const accent = (mode: "light" | "dark") =>
    generateScale({ name: "accent", hue: 275, chroma: 0.2, mode });
  expect([gray("light")[50].hex, gray("light")[500].hex, gray("light")[950].hex]).toEqual([
    "#fafafb",
    "#90929a",
    "#212124",
  ]);
  expect([gray("dark")[100].hex, gray("dark")[500].hex, gray("dark")[950].hex]).toEqual([
    "#18181a",
    "#6d6e75",
    "#f1f2f5",
  ]);
  expect([accent("light")[600].hex, accent("dark")[500].hex]).toEqual(["#535cda", "#545ed5"]);
});
