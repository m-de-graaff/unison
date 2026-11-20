import { compile } from "@tailwindcss/node";
import { describe, expect, it } from "vitest";
import { buildTheme } from "../src/build";
import { emitNativeThemeCss, emitThemeCss } from "../src/emit-tailwind";
import { emitTokensCss } from "../src/emit-web";

const def = buildTheme({
  name: "default",
  accent: { name: "accent", hue: 275, chroma: 0.2 },
  neutral: { name: "gray", hue: 275, chroma: 0.012 },
  autoContrast: true,
});
const brand = buildTheme({
  name: "brand",
  accent: { name: "accent", hue: 150, chroma: 0.15 },
  neutral: { name: "gray", hue: 150, chroma: 0.012 },
  autoContrast: true,
});

const RESET = [
  "--color-*: initial;",
  "--radius-*: initial;",
  "--shadow-*: initial;",
  "--font-*: initial;",
  "--text-*: initial;",
];

describe("emitThemeCss", () => {
  const strict = emitThemeCss([def], { strict: true });
  const loose = emitThemeCss([def], { strict: false });
  const inline = (css: string) => css.split("@theme inline {")[1]?.split("\n}")[0] ?? "";

  it("strict starts with the reset block, non-strict has none", () => {
    expect(strict.startsWith(`@theme {\n${RESET.map((l) => `  ${l}`).join("\n")}\n}`)).toBe(true);
    for (const line of RESET) expect(loose).not.toContain(line);
  });

  it("maps every namespace to its --unison-* variable", () => {
    const body = inline(strict);
    for (const line of [
      "--color-fg-muted: var(--unison-color-fg-muted);",
      "--color-gray-100: var(--unison-color-gray-100);",
      "--font-sans: var(--unison-font-family-sans);",
      "--font-mono: var(--unison-font-family-mono);",
      "--text-title-lg: var(--unison-text-title-lg-size);",
      "--text-title-lg--line-height: var(--unison-text-title-lg-line-height);",
      "--text-title-lg--letter-spacing: var(--unison-text-title-lg-tracking);",
      "--text-title-lg--font-weight: var(--unison-text-title-lg-weight);",
      "--radius-card: var(--unison-radius-card);",
      "--radius-md: var(--unison-radius-md);",
      "--shadow-md: var(--unison-shadow-md);",
      // The brief says --unison-shadow-popover, a variable that doesn't exist; the semantic
      // shadows are --unison-elevation-*.
      "--shadow-popover: var(--unison-elevation-popover);",
      "--spacing: var(--unison-space-1);",
      "--ease-enter: var(--unison-easing-enter);",
      "--ease-spring-snappy: var(--unison-spring-snappy);",
      "--animate-scale-in: var(--unison-animate-scale-in);",
      "--animate-scale-in-out: var(--unison-animate-scale-in-out);",
    ]) {
      expect(body).toContain(line);
    }
  });

  it("puts breakpoints outside @theme inline, as literals", () => {
    expect(strict).toContain("--breakpoint-md: 768px;");
    expect(inline(strict)).not.toContain("--breakpoint");
    expect(strict).not.toMatch(/--breakpoint-[\w]+: var\(/);
  });

  it("references only variables that tokens.css declares", () => {
    const declared = new Set(
      [...emitTokensCss([def]).matchAll(/^\s*(--unison-[a-z0-9-]+):/gm)].map((m) => m[1]),
    );
    const used = [...inline(strict).matchAll(/var\((--unison-[a-z0-9-]+)\)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(100);
    expect(used.filter((n) => !declared.has(n as string))).toEqual([]);
  });
});

describe("emitNativeThemeCss", () => {
  const css = emitNativeThemeCss([def]);
  it("uses literal values inside light and dark variants", () => {
    expect(css).toContain("@layer theme {\n  :root {\n    @variant light {");
    expect(css).toContain("@variant dark {");
    expect(css).not.toContain("var(");
    expect(css).toMatch(/--color-surface: #[0-9a-f]{6};/);
  });
  it("keeps static radius, spacing and text sizes", () => {
    expect(css).toMatch(/--radius-card: \d+px;/);
    expect(css).toMatch(/--spacing: \d+px;/);
    expect(css).toMatch(/--text-body: \d+px;/);
  });
  it("emits a named theme as <name>-light and <name>-dark variants", () => {
    const two = emitNativeThemeCss([def, brand]);
    expect(two).toContain("@variant brand-light {");
    expect(two).toContain("@variant brand-dark {");
    expect(two.match(/@variant light \{/g)).toHaveLength(1);
    const brandLight = two.split("@variant brand-light {")[1]?.split("}")[0] ?? "";
    const defLight = two.split("@variant light {")[1]?.split("}")[0] ?? "";
    expect(brandLight).toMatch(/--color-accent: #[0-9a-f]{6};/);
    expect(brandLight).not.toBe(defLight);
  });
});

const classes = [
  "bg-surface",
  "text-fg-muted",
  "bg-accent-hover",
  "bg-gray-100",
  "font-sans",
  "font-mono",
  "text-body",
  "text-title-lg",
  "rounded-card",
  "shadow-popover",
  "p-4",
  "gap-6",
  "ease-enter",
  "ease-spring-snappy",
  "animate-scale-in",
  "md:flex-row",
];
async function build(themeFile: string, candidates: string[]) {
  const c = await compile(
    `@import "tailwindcss/theme.css" layer(theme);\n${themeFile}\n@tailwind utilities;`,
    { base: process.cwd(), onDependency: () => {} },
  );
  return c.build(candidates);
}

describe("through Tailwind", () => {
  it("strict: every example class compiles, bg-blue-500 doesn't", async () => {
    const css = await build(emitThemeCss([def], { strict: true }), [...classes, "bg-blue-500"]);
    for (const cls of classes) expect(css).toContain(`.${cls.replace(":", "\\:")}`);
    expect(css).not.toContain(".bg-blue-500");
  });
  it("non-strict keeps Tailwind's palette", async () => {
    expect(await build(emitThemeCss([def], { strict: false }), ["bg-blue-500"])).toContain(
      ".bg-blue-500",
    );
  });
});
