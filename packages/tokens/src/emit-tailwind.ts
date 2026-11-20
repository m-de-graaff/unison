import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ThemeBuild } from "./build";
import { tailwindAnimations } from "./motion/css";
import { cssVarName } from "./paths";
import type { Resolved } from "./resolve";
import type { ColorValue, Dimension, Typography } from "./schema";

/** Every Tailwind namespace of the reset block that the system redefines. */
const RESET_NAMESPACES = ["color", "radius", "shadow", "font", "text"];

const variable = (path: string) => `var(${cssVarName(path)})`;
/** The last part of a path as a Tailwind key: `radius.card` → `card`, `space.0.5` → `0-5`. */
const keyOf = (path: string, prefix: string) => path.slice(prefix.length).replaceAll(".", "-");

/** Paths of one type under a prefix, in the resolver's order. */
function pathsUnder(tokens: Resolved, prefix: string, type?: string): string[] {
  return [...tokens.values()]
    .filter((t) => t.path.startsWith(prefix) && (!type || t.type === type))
    .map((t) => t.path);
}

/** The resolved value of a token that the build is known to have. */
function tokenValue<T>(tokens: Resolved, path: string): T {
  const t = tokens.get(path);
  if (!t) throw new Error(`emit-tailwind: unknown token ${path}`);
  return t.value as T;
}

/** `--<namespace>-<key>: var(--unison-…)` for every token under a path prefix. */
const mapped = (tokens: Resolved, prefix: string, namespace: string, type?: string): string[] =>
  pathsUnder(tokens, prefix, type).map(
    (path) => `  --${namespace}-${keyOf(path, prefix)}: ${variable(path)};`,
  );

function textStyles(tokens: Resolved): string[] {
  return pathsUnder(tokens, "text.", "typography").flatMap((path) => {
    const key = keyOf(path, "text.");
    const v = cssVarName(path);
    return [
      `  --text-${key}: var(${v}-size);`,
      `  --text-${key}--line-height: var(${v}-line-height);`,
      `  --text-${key}--letter-spacing: var(${v}-tracking);`,
      `  --text-${key}--font-weight: var(${v}-weight);`,
    ];
  });
}

/** Tailwind uses breakpoints in media queries, where `var()` doesn't work, so they stay literal. */
function breakpoints(tokens: Resolved): string[] {
  return pathsUnder(tokens, "breakpoint.", "dimension").map((path) => {
    const v = tokenValue<Dimension>(tokens, path);
    return `  --breakpoint-${keyOf(path, "breakpoint.")}: ${v.value}${v.unit};`;
  });
}

/**
 * `dist/web/theme.css` (`strict: false`) or `theme-strict.css` (`strict: true`, which first
 * removes Tailwind's own colours, radii, shadows, fonts and text sizes). Variables come from the
 * first theme; every theme declares the same names, so the maps are the same.
 */
export function emitThemeCss(themes: ThemeBuild[], opts: { strict: boolean }): string {
  const [first] = themes;
  if (!first) throw new Error("emitThemeCss needs at least one theme");
  const t = first.light.tokens;
  return [
    ...(opts.strict
      ? ["@theme {", ...RESET_NAMESPACES.map((n) => `  --${n}-*: initial;`), "}", ""]
      : []),
    "@theme inline {",
    ...mapped(t, "color.", "color", "color"),
    "  --font-sans: var(--unison-font-family-sans);",
    "  --font-mono: var(--unison-font-family-mono);",
    ...textStyles(t),
    ...mapped(t, "radius.", "radius"),
    ...mapped(t, "shadow.", "shadow", "shadow"),
    ...mapped(t, "elevation.", "shadow", "shadow"),
    `  --spacing: ${variable("space.1")};`,
    ...mapped(t, "easing.", "ease"),
    ...mapped(t, "spring.", "ease-spring"),
    ...tailwindAnimations("  "),
    "}",
    "",
    "@theme {",
    ...breakpoints(t),
    "}",
    "",
  ].join("\n");
}

const measure = (v: Dimension) => `${v.value}${v.unit}`;

const colors = (tokens: Resolved, indent: string): string[] =>
  pathsUnder(tokens, "color.", "color").map(
    (path) =>
      `${indent}--color-${keyOf(path, "color.")}: ${tokenValue<ColorValue>(tokens, path).hex};`,
  );

/** The static values every native theme shares: radius, spacing and text sizes as literals. */
function nativeStatics(tokens: Resolved): string[] {
  const dims = (prefix: string, namespace: string) =>
    pathsUnder(tokens, prefix, "dimension").map(
      (p) => `  --${namespace}-${keyOf(p, prefix)}: ${measure(tokenValue<Dimension>(tokens, p))};`,
    );
  const text = pathsUnder(tokens, "text.", "typography").flatMap((p) => {
    const v = tokenValue<Typography>(tokens, p);
    const key = keyOf(p, "text.");
    return [
      `  --text-${key}: ${measure(v.fontSize)};`,
      `  --text-${key}--line-height: ${measure(v.lineHeight)};`,
    ];
  });
  return [
    ...dims("radius.", "radius"),
    `  --spacing: ${measure(tokenValue<Dimension>(tokens, "space.1"))};`,
    ...text,
  ];
}

/**
 * `dist/native/theme.css` for Uniwind. Uniwind can't resolve the `var(--unison-…)` chain from
 * theme.css on native, so every value is a literal, with colours per light/dark variant. The first
 * theme owns `light` / `dark`; others become `<name>-light` / `<name>-dark` (OQ-19: unverified).
 */
export function emitNativeThemeCss(themes: ThemeBuild[]): string {
  const [first] = themes;
  if (!first) throw new Error("emitNativeThemeCss needs at least one theme");
  const variants = themes.flatMap((theme, i) =>
    (["light", "dark"] as const).flatMap((scheme) => [
      `    @variant ${i === 0 ? scheme : `${theme.name}-${scheme}`} {`,
      ...colors(theme[scheme].tokens, "      "),
      "    }",
      "",
    ]),
  );
  return [
    "@theme {",
    ...nativeStatics(first.light.tokens),
    "}",
    "",
    "@layer theme {",
    "  :root {",
    ...variants.slice(0, -1),
    "  }",
    "}",
    "",
  ].join("\n");
}

/** Writes web/theme.css, web/theme-strict.css and native/theme.css; returns the written paths. */
export function emitTailwind(outDir: string, themes: ThemeBuild[]): string[] {
  const files: [string, string][] = [
    [join(outDir, "web", "theme.css"), emitThemeCss(themes, { strict: false })],
    [join(outDir, "web", "theme-strict.css"), emitThemeCss(themes, { strict: true })],
    [join(outDir, "native", "theme.css"), emitNativeThemeCss(themes)],
  ];
  for (const [path, css] of files) {
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, css);
  }
  return files.map(([path]) => path);
}
