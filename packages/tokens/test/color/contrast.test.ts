import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildTheme, ContrastError } from "../../src/build";
import { autoAdjust, checkContrast } from "../../src/color/auto-contrast";
import { apcaLc, wcagRatio } from "../../src/color/contrast";
import { CONTRAST_PAIRS } from "../../src/color/contrast-pairs";
import { paletteFromSeed } from "../../src/color/palettes";
import type { Resolved, ResolvedToken } from "../../src/resolve";

const neutral = (hue: number) => ({ name: "gray", hue, chroma: 0.012 });
const indigo = { name: "accent", hue: 275, chroma: 0.2 };
const seeded = (hex: string) => {
  const { hue, chroma } = paletteFromSeed(hex);
  return { accent: { name: "accent", hue, chroma, anchor: hex }, neutral: neutral(hue) };
};

it("keeps the phase 0 ratio checks", () => {
  expect(wcagRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
  expect(wcagRatio("#777777", "#ffffff")).toBeLessThan(4.5);
});

it("expands the todo's table to 24 pairs", () => {
  expect(CONTRAST_PAIRS).toHaveLength(24);
  expect(CONTRAST_PAIRS).toContainEqual({ fg: "color.fg-subtle", bg: "color.surface", min: 3 });
  expect(CONTRAST_PAIRS).toContainEqual({ fg: "color.on-warning", bg: "color.warning", min: 4.5 });
});

it("the default theme passes with no adjustments", () => {
  const t = buildTheme({
    name: "default",
    accent: indigo,
    neutral: neutral(275),
    autoContrast: true,
  });
  expect(t.warnings).toEqual([]);
  for (const s of [t.light, t.dark])
    expect(s.contrast.every((r) => r.pass && !r.adjusted)).toBe(true);
});

it("pins the tightest default ratios from the plan", () => {
  const t = buildTheme({
    name: "default",
    accent: indigo,
    neutral: neutral(275),
    autoContrast: true,
  });
  const ratio = (s: typeof t.light, fg: string, bg: string) =>
    Number(s.contrast.find((r) => r.fg === fg && r.bg === bg)?.ratio.toFixed(2));
  expect(ratio(t.light, "color.border-strong", "color.surface")).toBe(3.1);
  expect(ratio(t.light, "color.on-success", "color.success")).toBe(4.65);
  expect(ratio(t.dark, "color.accent", "color.surface")).toBe(3.33);
});

// OQ-3a: #3d846d replaces the todo's #facc15 (which passes with no warning) as the failing seed.
const WARN_SEED = "#3d846d";

// The seed-with-warning Done-when clause is dropped by owner decision: hover and active are
// darker steps than accent, so no seed lets a single on-accent pass all three backgrounds.
// The rescue is proven directly on checkContrast with one shared background colour; to be
// recorded in ADR 0013 (Task 23).
const flatAccent = () => {
  const base = buildTheme({
    name: "default",
    accent: indigo,
    neutral: neutral(275),
    autoContrast: true,
  }).light.tokens;
  const tokens: Resolved = new Map(base);
  for (const path of ["color.accent", "color.accent-hover", "color.accent-active"]) {
    tokens.set(path, { ...(base.get(path) as ResolvedToken), value: { hex: "#3d846d" } });
  }
  return tokens;
};
const ctx = { theme: "default", scheme: "light" as const };

describe("auto-contrast rescue", () => {
  it("adjusts on-accent and warns", () => {
    const { warnings, results } = checkContrast(flatAccent(), { ...ctx, autoContrast: true });
    expect(warnings).toEqual([
      "auto-contrast: theme default, scheme light, color.on-accent adjusted #ffffff → #000000 on color.accent (4.45:1 → 4.72:1)",
    ]);
    expect(results.every((r) => r.pass)).toBe(true);
  });

  it("overrides only on-accent, as a raw auto-contrast token", () => {
    const { overrides } = checkContrast(flatAccent(), { ...ctx, autoContrast: true });
    expect(overrides).toHaveLength(1);
    expect(overrides[0]).toMatchObject({
      path: "color.on-accent",
      raw: true,
      file: "auto-contrast",
      value: { hex: "#000000" },
    });
  });

  it("fails without overrides when autoContrast is off", () => {
    const { results, overrides } = checkContrast(flatAccent(), { ...ctx, autoContrast: false });
    expect(overrides).toEqual([]);
    expect(results.some((r) => r.fg === "color.on-accent" && !r.pass)).toBe(true);
  });

  it("throws, naming on-accent, when no single colour passes every background", () => {
    try {
      buildTheme({ name: "default", ...seeded(WARN_SEED), autoContrast: true });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ContrastError);
      expect((e as ContrastError).failures.some((f) => f.fg === "color.on-accent")).toBe(true);
    }
  });
});

it("fails with the exact pair when autoContrast is off", () => {
  expect(() => buildTheme({ name: "default", ...seeded(WARN_SEED), autoContrast: false })).toThrow(
    /^contrast: theme default, scheme light, color\.on-accent on color\.accent is 4\.\d\d:1 \(needs 4\.5:1\)$/m,
  );
});

it("the yellow accent builds and its on-accent is legible", () => {
  const t = buildTheme({ name: "default", ...seeded("#facc15"), autoContrast: true });
  const r = t.light.contrast.find((x) => x.fg === "color.on-accent" && x.bg === "color.accent");
  expect(r?.ratio).toBeGreaterThanOrEqual(4.5);
});

describe("accent presets", () => {
  it.each([
    ["indigo", 275, 0.2],
    ["blue", 255, 0.19],
    ["orange", 50, 0.19],
    ["violet", 295, 0.21],
    ["teal", 185, 0.13],
    ["green", 150, 0.17],
    ["rose", 10, 0.21],
  ])("%s passes", (_, hue, chroma) => {
    expect(() =>
      buildTheme({
        name: "default",
        accent: { name: "accent", hue, chroma },
        neutral: neutral(hue),
        autoContrast: true,
      }),
    ).not.toThrow();
  });
});

it("ContrastError carries the failures", () => {
  try {
    buildTheme({ name: "default", ...seeded(WARN_SEED), autoContrast: false });
    expect.unreachable();
  } catch (e) {
    expect(e).toBeInstanceOf(ContrastError);
    expect((e as ContrastError).failures.length).toBeGreaterThan(0);
  }
});

describe("autoAdjust", () => {
  it("darkens a dark-ish foreground on a light background", () => {
    const r = autoAdjust("#999999", "#ffffff", 4.5);
    expect(r).toBeDefined();
    expect(r?.ratio).toBeGreaterThanOrEqual(4.5);
    expect(r?.hex < "#999999").toBe(true);
  });

  it("flips to the opposite pole when the foreground is already at one", () => {
    const r = autoAdjust("#ffffff", "#3d846d", 4.5);
    expect(r?.hex).toBe("#000000");
    expect(r?.ratio).toBeCloseTo(4.72, 2);
  });

  it("returns undefined when no lightness can pass", () => {
    expect(autoAdjust("#777777", "#777777", 21)).toBeUndefined();
  });
});

it("apcaLc has the polarity of text on background", () => {
  expect(apcaLc("#000000", "#ffffff")).toBeCloseTo(106, 0);
  expect(apcaLc("#ffffff", "#000000")).toBeLessThan(0);
});

it("collects failures from both schemes and several pairs into one ContrastError", () => {
  try {
    buildTheme({ name: "default", ...seeded(WARN_SEED), autoContrast: false });
    expect.unreachable();
  } catch (e) {
    const { failures } = e as ContrastError;
    expect(failures.length).toBeGreaterThan(1);
    expect(new Set(failures.map((f) => f.scheme))).toEqual(new Set(["light", "dark"]));
    expect((e as Error).message.split("\n")).toHaveLength(failures.length);
  }
});

it("is deterministic", () => {
  const run = () =>
    JSON.stringify(
      buildTheme({ name: "default", accent: indigo, neutral: neutral(275), autoContrast: true }),
      (_, v) => (v instanceof Map ? [...v] : v),
    );
  expect(run()).toBe(run());
});

describe("buildTheme rescue on a fixture root", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  it("re-resolves with the adjusted foreground and still passes", () => {
    const root = mkdtempSync(join(tmpdir(), "unison-contrast-"));
    dirs.push(root);
    cpSync(join(import.meta.dirname, "../../tokens"), join(root, "tokens"), { recursive: true });
    const file = join(root, "tokens/semantic/color.light.json");
    // success-fg on success-subtle, pointed at a step that is too pale.
    writeFileSync(
      file,
      readFileSync(file, "utf8").replace("{color.success.700}", "{color.success.300}"),
    );
    const t = buildTheme({
      name: "default",
      root,
      accent: indigo,
      neutral: neutral(275),
      autoContrast: true,
    });
    expect(t.warnings.join("\n")).toMatch(
      /^auto-contrast: theme default, scheme light, color\.success-fg adjusted #[0-9a-f]{6} → #[0-9a-f]{6} on color\.success-subtle/m,
    );
    const tok = t.light.tokens.get("color.success-fg");
    const adjusted = t.light.contrast.find((r) => r.fg === "color.success-fg");
    expect(tok).toMatchObject({ raw: true, file: "auto-contrast" });
    expect((tok?.value as { hex: string } | undefined)?.hex).toBe(adjusted?.adjusted?.to);
    expect(adjusted?.pass).toBe(true);
    expect(t.light.contrast.every((r) => r.pass)).toBe(true);
    expect(t.dark.contrast.every((r) => r.pass && !r.adjusted)).toBe(true);
  });
});
