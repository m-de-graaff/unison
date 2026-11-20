import { expect, it } from "vitest";
import { build, ConfigError, defineConfig, defineTheme } from "../src/index";

const one = (o: Parameters<typeof defineTheme>[0]) =>
  build(defineConfig({ themes: { default: defineTheme(o) } }));
const px = (r: ReturnType<typeof build>, p: string) =>
  (r.themes[0]?.light.tokens.get(p)?.value as { value: number } | undefined)?.value;

it("builds the todo's example", () => {
  const r = one({ accent: "#e11d48", radius: "lg", density: "compact" });
  const accent = [...(r.themes[0]?.light.tokens.values() ?? [])]
    .filter((t) => t.path.startsWith("color.accent."))
    .map((t) => (t.value as { hex: string }).hex);
  expect(accent).toContain("#e11d48");
  expect(px(r, "radius.card")).toBe(12);
  expect(px(r, "size.control-md")).toBe(36);
});

it("suggests the nearest radius", () => {
  expect(() => one({ radius: "medium" as never })).toThrow(
    'themes.default.radius: "medium" is not valid, did you mean "md"?',
  );
});

it.each([
  ["accent", "indigo", "purple"],
  ["neutral", "slate", "grey"],
  ["radius", "full", "round"],
  ["density", "compact", "tight"],
  ["motion", "smooth", "slow"],
  ["autoContrast", false, "no"],
] as const)("%s: %s is valid, %s is not", (key, ok, bad) => {
  expect(() => one({ [key]: ok } as never)).not.toThrow(ConfigError);
  expect(() => one({ [key]: bad } as never)).toThrow(ConfigError);
});

it("rejects unknown keys with a suggestion", () => {
  expect(() => one({ acent: "indigo" } as never)).toThrow(
    'themes.default.acent: unknown option, did you mean "accent"?',
  );
});

it("overrides accept semantic aliases only", () => {
  expect(px(one({ overrides: { "radius.card": "{radius.2xl}" } }), "radius.card")).toBe(16);
  expect(() => one({ overrides: { "color.gray.500": "{color.gray.400}" } as never })).toThrow(
    "only semantic tokens can be overridden",
  );
});

it.each([
  ["fonts", { sans: "Geist, sans-serif" }, { sans: 42 }],
  ["overrides", { "radius.card": "{radius.xl}" }, { "radius.card": "12px" }],
] as const)("%s: a valid and an invalid value", (key, ok, bad) => {
  expect(() => one({ [key]: ok } as never)).not.toThrow();
  expect(() => one({ [key]: bad } as never)).toThrow(ConfigError);
});

it("extends: a known parent builds, an unknown one fails with a suggestion", () => {
  const two = (parent: string) =>
    build(
      defineConfig({
        themes: { default: defineTheme({}), brand: defineTheme({ extends: parent }) },
      }),
    );
  expect(() => two("default")).not.toThrow();
  expect(() => two("defualt")).toThrow(
    'themes.brand.extends: no theme "defualt", did you mean "default"?',
  );
});
