import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, it } from "vitest";
import { emitTokensCss } from "../src/emit-web";
import { build, defineConfig, defineTheme, writeOutputs } from "../src/index";

const demo = defineConfig({
  themes: {
    default: defineTheme({ accent: "indigo" }),
    brand: defineTheme({ extends: "default", accent: "#e11d48", radius: "lg" }),
  },
  defaultTheme: "default",
});
const px = (r: ReturnType<typeof build>, theme: string, path: string) =>
  (
    r.themes.find((t) => t.name === theme)?.light.tokens.get(path)?.value as
      | { value: number }
      | undefined
  )?.value;

const out = mkdtempSync(join(tmpdir(), "unison-named-"));
afterAll(() => rmSync(out, { recursive: true, force: true }));

it("builds both demo themes, default first", () => {
  expect(build(demo).themes.map((t) => t.name)).toEqual(["default", "brand"]);
});

it("emits a CSS block set for brand", () => {
  // The todo's `[data-unison-theme="brand"] {` gained OQ-8's extra selectors after it.
  expect(emitTokensCss(build(demo).themes)).toMatch(/^\[data-unison-theme="brand"\][,{ ]/m);
});

it("puts brand.light and brand.dark into the native theme", async () => {
  writeOutputs(build(demo), out);
  const { themes } = await import(join(out, "native/theme.js"));
  expect(Object.keys(themes)).toEqual(["default", "brand"]);
  expect(Object.keys(themes.brand)).toEqual(["light", "dark"]);
});

it("brand inherits what it doesn't set", () => {
  const r = build(
    defineConfig({
      themes: {
        default: defineTheme({ density: "compact" }),
        brand: defineTheme({ extends: "default", accent: "#e11d48", radius: "lg" }),
      },
    }),
  );
  expect(px(r, "brand", "size.control-md")).toBe(36);
  expect(px(r, "brand", "radius.card")).toBe(12);
  expect(px(r, "default", "radius.card")).toBe(8);
});

it("merges overrides per path", () => {
  const r = build(
    defineConfig({
      themes: {
        default: defineTheme({ overrides: { "radius.card": "{radius.2xl}" } }),
        brand: defineTheme({ extends: "default", overrides: { "radius.control": "{radius.sm}" } }),
      },
    }),
  );
  expect([px(r, "brand", "radius.card"), px(r, "brand", "radius.control")]).toEqual([16, 4]);
});

it.each([
  [{ default: {}, Brand: {} }, 'themes.Brand: theme names may only use a-z, 0-9 and "-"'],
  [{ brand: {} }, 'themes: missing the "default" theme'],
  [{ default: {}, a: { extends: "b" }, b: { extends: "a" } }, "themes.a.extends: cycle a → b → a"],
  [
    { default: {}, brand: { extends: "defualt" } },
    'themes.brand.extends: no theme "defualt", did you mean "default"?',
  ],
])("rejects %j", (themes, message) => {
  expect(() => build(defineConfig({ themes }))).toThrow(message);
});
