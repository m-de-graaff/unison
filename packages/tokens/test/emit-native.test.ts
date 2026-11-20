import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { compile } from "../src/index";
import { nativeKey } from "../src/paths";

const out = mkdtempSync(join(tmpdir(), "unison-native-"));
await compile({ cwd: join(import.meta.dirname, ".."), outDir: out });
const { themes } = await import(join(out, "native/theme.js"));
const { motionPresets } = await import(join(out, "motion.js"));
const light = themes.default.light;

it("keys themes by name, then scheme", () => {
  expect(Object.keys(themes)).toEqual(["default"]);
  expect(Object.keys(themes.default)).toEqual(["light", "dark"]);
});
it("holds a semantic colour and a primitive step side by side", () => {
  expect(light.color["fg-muted"]).toBe("#5c5d64");
  expect(light.color["accent-600"]).toBe("#535cda");
  expect(light.color.accent).toBe("#535cda");
});
it("converts text styles, springs and presets", () => {
  expect(light.text["title-lg"].letterSpacing).toBe(-0.48);
  expect(light.motion.spring.snappy).toEqual({ stiffness: 400, damping: 30, mass: 1 });
  expect(light.motion.presets["scale-in"]).toEqual(motionPresets.default["scale-in"]);
  expect(light.motion.presets).toEqual(motionPresets.default);
});
it("puts every token where nativeKey says", () => {
  const at = (keys: readonly string[]) =>
    keys.reduce((node: Record<string, unknown>, k) => node[k] as Record<string, unknown>, light);
  expect(at(nativeKey("space.0.5"))).toBe(2);
  expect(at(nativeKey("motion.duration.fast.enter"))).toBe(120);
  expect(at(nativeKey("duration.200"))).toBe(200);
  expect(at(nativeKey("border-width.default"))).toBe(1);
  expect(at(nativeKey("radius.card"))).toBe(light.radius.card);
  expect(at(nativeKey("text.max-scale"))).toBe(light.text["max-scale"]);
});
it("only holds numbers, strings, null, plain objects and arrays", () => {
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) {
      v.forEach((x, i) => {
        walk(x, `${path}[${i}]`);
      });
      return;
    }
    if (v === null) return; // `reduced: null` on a preset without a reduced variant
    if (typeof v === "object") {
      for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
      return;
    }
    expect(["number", "string"], path).toContain(typeof v);
  };
  walk(themes, "themes");
  expect(JSON.parse(JSON.stringify(themes))).toEqual(themes);
});

it.each([
  ["color.accent", ["color", "accent"]],
  ["color.accent.600", ["color", "accent-600"]],
  ["space.0.5", ["space", "0-5"]],
  ["border-width.default", ["borderWidth", "default"]],
  ["ring-offset.default", ["ringOffset", "default"]],
  ["z-index.modal", ["zIndex", "modal"]],
  ["font-family.sans", ["fontFamily", "sans"]],
  ["font-weight.bold", ["fontWeight", "bold"]],
  ["text.title-lg", ["text", "title-lg"]],
  ["text.max-scale", ["text", "max-scale"]],
  ["duration.200", ["motion", "duration", "200"]],
  ["motion.duration.fast.enter", ["motion", "duration", "fast-enter"]],
  ["easing.standard", ["motion", "easing", "standard"]],
  ["spring.snappy", ["motion", "spring", "snappy"]],
  ["motion.preset.scale-in", ["motion", "presets", "scale-in"]],
  ["motion.emphasis", ["motion", "transition", "emphasis"]],
])("nativeKey(%s)", (path, keys) => {
  expect(nativeKey(path)).toEqual(keys);
});
