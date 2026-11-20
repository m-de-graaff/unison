import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { buildTheme } from "../src/build";
import { cssValue, emitTokensCss, cssVarName as fromEmit } from "../src/emit-web";
import { cssVarName } from "../src/paths";

const def = buildTheme({
  name: "default",
  accent: { name: "accent", hue: 275, chroma: 0.2 },
  neutral: { name: "gray", hue: 275, chroma: 0.012 },
  autoContrast: true,
});
const css = emitTokensCss([def]);

/** A theme's selector list for one scheme (ADR 0018); the first theme also owns the base shapes. */
const list = (theme: string, scheme: "light" | "dark", first: boolean) => {
  const s = `[data-unison-theme="${theme}"]`;
  const a = `[data-theme="${scheme}"]`;
  const base = first ? (scheme === "light" ? [":root", a] : [a]) : [];
  const own = scheme === "light" ? s : `:root${a} ${s}`;
  return `${s}${a}, :where(${[...base, own, `:root${s} ${a}`].join(", ")}), :where(:not(:root)${a}) ${s}, :where(:not(:root)${s}) ${a}`;
};
const LIGHT = list("default", "light", true);
const DARK = list("default", "dark", true);
const OCEAN_LIGHT = list("ocean", "light", false);
const OCEAN_DARK = list("ocean", "dark", false);

it("emits semantic tokens as references", () => {
  expect(css).toContain("--unison-color-accent: var(--unison-color-accent-600);");
  expect(css).toContain("--unison-color-fg-muted: var(--unison-color-gray-700);");
});
it("dark only overrides what differs", () => {
  const dark = css.split(`${DARK} {`)[1]?.split("}")[0] ?? "";
  expect(dark).toContain("--unison-color-accent: var(--unison-color-accent-500);");
  // gray.950 is the same alias in both schemes but resolves differently. A nested
  // data-theme="dark" subtree inherits the light value unless it is re-declared, and the todo's
  // Done-when (dark on one <div> turns only that subtree dark) requires it. The plan's
  // `not.toContain("--unison-color-fg:")` contradicted the todo.
  expect(dark).toContain("--unison-color-fg: var(--unison-color-gray-950);");
  expect(dark).not.toContain("--unison-space-4:");
});
it("emits hex first and oklch under @supports", () => {
  expect(css.indexOf("--unison-color-accent-600: #535cda;")).toBeLessThan(
    css.indexOf("@supports (color: oklch(0 0 0))"),
  );
  expect(css).toContain(
    `@supports (color: oklch(0 0 0)) {\n  ${LIGHT} {\n    --unison-color-accent-50: oklch(`,
  );
});
it("emits typography and shadows", () => {
  expect(css).toContain("--unison-text-title-lg-size: 24px;");
  expect(css).toContain("--unison-text-title-lg-tracking: -0.02em;");
  expect(css).toContain("--unison-shadow-xs: 0 1px 2px rgb(0 0 0 / 0.05);");
});
it("is deterministic", () => expect(emitTokensCss([def])).toBe(css));
it("stays under 8 KB gzipped", () => expect(gzipSync(css).length).toBeLessThan(8 * 1024));

describe("selectors (OQ-8, ADR 0018)", () => {
  it("light list includes :root and [data-theme=light]", () => {
    expect(css).toContain(`${LIGHT} {`);
    expect(LIGHT).toContain(':where(:root, [data-theme="light"], [data-unison-theme="default"]');
  });
  it("the compound on the element is the only selector that isn't inside :where()", () => {
    // [theme][scheme] weighs (0,2,0); one attribute with the other on a non-root ancestor (0,1,0);
    // everything else 0. So a scope's compound beats any rule an ancestor makes match.
    expect(LIGHT.startsWith('[data-unison-theme="default"][data-theme="light"], :where(')).toBe(
      true,
    );
    expect(DARK.startsWith('[data-unison-theme="default"][data-theme="dark"], :where(')).toBe(true);
    for (const sel of [LIGHT, DARK]) {
      const outside = sel.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, "");
      expect(outside).not.toContain(":root");
      expect(outside).not.toMatch(/\] \[/); // no descendant pair outside :where()
    }
  });
  it("the default light block declares every token, so a light scope resets a dark ancestor", () => {
    const light = css.split(`${LIGHT} {`)[1]?.split("}")[0] ?? "";
    expect(light).toContain("--unison-color-fg: var(--unison-color-gray-950);");
    expect(light).toContain("--unison-space-4: 16px;");
  });
  it("dark list includes the compound theme + dark selector", () => {
    expect(css).toContain(`${DARK} {`);
  });
  it("media block keeps :root:not([data-theme=light]) and scopes the default theme where nothing sets a scheme", () => {
    expect(css).toContain(
      '@media (prefers-color-scheme: dark) {\n  :where(:root:not([data-theme="light"]), [data-unison-theme="default"]:not([data-theme]):not([data-theme] *)) {',
    );
  });
});

describe("everything the earlier tasks emitted", () => {
  it("keeps font families, durations, easings and spring fallback", () => {
    expect(css).toContain('--unison-font-family-sans: "Inter Variable", Inter, ');
    expect(css).toContain("--unison-duration-200: 200ms;");
    expect(css).toContain("--unison-motion-duration-base-enter: var(--unison-duration-200);");
    expect(css).toContain("--unison-easing-standard: cubic-bezier(0.2, 0, 0, 1);");
    expect(css).toMatch(/--unison-spring-snappy: linear\(/);
    expect(css).toMatch(/--unison-spring-snappy-duration: \d+ms;/);
    const fallback =
      css.split("@supports not (transition-timing-function: linear(0, 1)) {")[1] ?? "";
    const block = fallback.split("}")[0] ?? "";
    expect(block).toContain(`  ${LIGHT} {`);
    expect(block).toContain("--unison-spring-snappy: cubic-bezier(0.2, 0, 0, 1);");
    expect(block).not.toContain("-duration");
  });
  it("keeps keyframes, animate variables and the reduced-motion block", () => {
    expect(css).toContain("@keyframes unison-scale-in-in");
    expect(css).toMatch(/--unison-animate-fade: unison-fade-in /);
    expect(css).toContain("@media (prefers-reduced-motion: reduce) {");
  });
  it("prints decimal paths as one variable", () => {
    expect(css).toContain("--unison-space-0-5: 2px;");
  });
});

describe("cssVarName and cssValue", () => {
  it("names variables", () => {
    expect(cssVarName("color.accent")).toBe("--unison-color-accent");
    expect(cssVarName("space.0.5")).toBe("--unison-space-0-5");
    expect(fromEmit).toBe(cssVarName);
  });
  it("prints values per type and aliases as var()", () => {
    const tok = (type: string, value: unknown, aliasOf?: string) =>
      ({ path: "x.y", type, value, file: "f", tier: "primitive", aliasOf }) as never;
    expect(cssValue(tok("dimension", { value: 16, unit: "px" }))).toBe("16px");
    expect(cssValue(tok("duration", { value: 200, unit: "ms" }))).toBe("200ms");
    expect(cssValue(tok("number", 0.5))).toBe("0.5");
    expect(cssValue(tok("fontFamily", ["Inter Variable", "system-ui"]))).toBe(
      '"Inter Variable", system-ui',
    );
    expect(cssValue(tok("cubicBezier", [0.2, 0, 0, 1]))).toBe("cubic-bezier(0.2, 0, 0, 1)");
    expect(cssValue(tok("color", { hex: "#ffffff" }))).toBe("#ffffff");
    expect(cssValue(tok("color", { hex: "#ffffff" }, "color.white"))).toBe(
      "var(--unison-color-white)",
    );
  });
});

describe("several themes", () => {
  const other = buildTheme({
    name: "ocean",
    accent: { name: "accent", hue: 200, chroma: 0.15 },
    neutral: { name: "gray", hue: 275, chroma: 0.012 },
    autoContrast: true,
  });
  const both = emitTokensCss([def, other]);
  const body = (selector: string) => both.split(`${selector} {\n`)[1]?.split("\n  }")[0] ?? "";

  it("scopes the other theme and declares only what varies across themes and schemes", () => {
    const light = body(OCEAN_LIGHT);
    expect(light).toMatch(/--unison-color-accent-600: #[0-9a-f]{6};/);
    expect(light).not.toContain("--unison-space-4:");
    expect(light).not.toContain(":root");
  });
  it("re-declares aliases whose text is unchanged but whose value differs", () => {
    const light = body(OCEAN_LIGHT);
    // color.accent -> accent-600 in both themes, but accent-600 resolves differently.
    expect(light).toContain("--unison-color-accent: var(--unison-color-accent-600);");
    expect(light).toContain("--unison-color-ring: var(--unison-color-accent-600);");
  });
  it("re-declares tokens equal to default-light but different in default-dark", () => {
    // color.fg is the same in default-light and ocean-light, but default-dark differs; under a
    // dark ancestor an ocean light scope would otherwise inherit the dark value.
    const light = body(OCEAN_LIGHT);
    expect(light).toContain("--unison-color-fg: var(--unison-color-gray-950);");
    expect(light).not.toContain("--unison-space-4:");
  });
  it("declares in the dark block what equals default-dark but not the theme's light", () => {
    const dark = body(OCEAN_DARK);
    expect(dark).toContain("--unison-color-fg: var(--unison-color-gray-950);");
  });
  it("the @supports block holds exactly the colour primitives of its block", () => {
    for (const sel of [LIGHT, OCEAN_LIGHT, OCEAN_DARK]) {
      const hex = body(sel);
      const wide =
        both.split(`@supports (color: oklch(0 0 0)) {\n  ${sel} {\n`)[1]?.split("\n  }")[0] ?? "";
      const names = (b: string) => b.split("\n").map((l) => l.trim().split(":")[0] as string);
      const primitives = names(hex).filter((n) =>
        /^--unison-color-([a-z]+-\d+|black|white)$/.test(n),
      );
      expect(names(wide)).toEqual(primitives);
      expect(wide).not.toMatch(/: #/);
    }
  });
  it("dark block of the other theme is scoped under data-theme=dark", () => {
    const dark = body(OCEAN_DARK);
    expect(dark).toMatch(/--unison-color-accent-500: #[0-9a-f]{6};/);
  });
  it("media block applies to the other theme where nothing sets a scheme", () => {
    expect(both).toContain(
      ':where([data-unison-theme="ocean"]:not([data-theme]):not([data-theme] *)) {',
    );
  });
  it("the default theme's scopes re-declare what another theme changes", () => {
    // A default scope can sit inside an ocean subtree, so default light and dark both carry the
    // accent ramp, which only ocean changes in light.
    for (const sel of [DARK, `${LIGHT}`]) {
      expect(body(sel)).toMatch(/--unison-color-accent-600: #[0-9a-f]{6};/);
    }
  });
  it("puts themes in config order", () => {
    expect(both.indexOf('[data-unison-theme="default"]')).toBeLessThan(
      both.indexOf('[data-unison-theme="ocean"]'),
    );
  });
});
