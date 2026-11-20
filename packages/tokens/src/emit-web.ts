import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ThemeBuild } from "./build";
import { animateDeclarations, keyframes } from "./motion/css";
import { expandPresets } from "./motion/presets";
import { cssVarName } from "./paths";
import type { Resolved, ResolvedToken } from "./resolve";
import type { ColorValue, Dimension, ShadowLayer, Typography } from "./schema";
import { shadowToCss } from "./shadow";
import { type SpringConfig, springToCssLinear } from "./spring";

export { cssVarName };

/**
 * One declaration: the CSS to print and the resolved value to compare. A `var()` is substituted
 * on the element that declares it, so a nested scope only sees a change when the resolved value
 * differs, even if the alias text is the same.
 */
interface Decl {
  css: string;
  resolved: string;
}
/** Variable name → declaration. */
type Decls = Map<string, Decl>;
const plain = (css: string): Decl => ({ css, resolved: css });

const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "ui-rounded",
  "-apple-system",
]);
/** Quotes every family that isn't a generic or unquoted-safe keyword. */
const cssFamilyList = (families: string[]) =>
  families
    .map((f) => (GENERIC_FAMILIES.has(f) || /^[A-Za-z-]+$/.test(f) ? f : `"${f}"`))
    .join(", ");

const measure = (v: { value: number; unit: string }) => `${v.value}${v.unit}`;

/** The CSS value of one token; an alias becomes `var()` so a scheme switch re-points it. */
export function cssValue(t: ResolvedToken): string {
  if (t.aliasOf) return `var(${cssVarName(t.aliasOf)})`;
  switch (t.type) {
    case "color":
      return (t.value as ColorValue).hex;
    case "dimension":
    case "duration":
      return measure(t.value as Dimension);
    case "number":
    case "fontWeight":
      return String(t.value);
    case "fontFamily":
      return cssFamilyList(t.value as string[]);
    case "cubicBezier":
      return `cubic-bezier(${(t.value as number[]).join(", ")})`;
    case "shadow":
      return shadowToCss(t.value as ShadowLayer[]);
    default:
      throw new Error(`${t.path}: no CSS value for type ${t.type}`);
  }
}

const PLAIN_TYPES = new Set([
  "color",
  "dimension",
  "duration",
  "number",
  "fontFamily",
  "cubicBezier",
  "shadow",
]);
/** Primitives that only feed text styles; the styles are printed as `--unison-text-*` instead. */
const TEXT_PRIMITIVE = /^(font-size|line-height|letter-spacing|font-weight)\./;

/** Every variable a scheme of a theme declares: tokens, springs, text styles and animations. */
function schemeDecls(build: ThemeBuild, scheme: "light" | "dark"): Decls {
  const tokens: Resolved = build[scheme].tokens;
  const out: Decls = new Map();
  for (const t of tokens.values()) {
    const name = cssVarName(t.path);
    if (t.type === "spring") {
      const { easing, durationMs } = springToCssLinear(t.value as SpringConfig);
      out.set(name, plain(easing));
      out.set(`${name}-duration`, plain(`${durationMs}ms`));
    } else if (t.type === "typography" && t.path.startsWith("text.")) {
      const v = t.value as Typography;
      out.set(`${name}-size`, plain(measure(v.fontSize)));
      out.set(`${name}-line-height`, plain(measure(v.lineHeight)));
      out.set(`${name}-weight`, plain(String(v.fontWeight)));
      out.set(`${name}-tracking`, plain(measure(v.letterSpacing)));
    } else if (PLAIN_TYPES.has(t.type) && !TEXT_PRIMITIVE.test(t.path)) {
      out.set(name, { css: cssValue(t), resolved: JSON.stringify(t.value) });
    }
  }
  const presets = expandPresets(build.light.tokens, build.motion);
  for (const [name, value] of animateDeclarations(presets, tokens, "")) out.set(name, plain(value));
  return out;
}

/** `--unison-animate-*` for reduced motion. */
function reducedDecls(build: ThemeBuild): Decls {
  const presets = expandPresets(build.light.tokens, build.motion);
  return new Map(
    animateDeclarations(presets, build.light.tokens, "reduced-").map(([k, v]) => [k, plain(v)]),
  );
}

/** The oklch form of every colour primitive of a scheme. */
function oklchDecls(tokens: Resolved): Decls {
  const out: Decls = new Map();
  for (const t of tokens.values()) {
    const oklch = (t.value as Partial<ColorValue>).oklch;
    if (t.type === "color" && t.tier === "primitive" && oklch) {
      out.set(cssVarName(t.path), plain(oklch));
    }
  }
  return out;
}

const chunks = (s: string) => s.match(/\d+|\D+/g) ?? [];
/** Digit runs compare as numbers, so `accent-50` comes before `accent-100`. */
function naturalCompare(a: string, b: string): number {
  const x = chunks(a);
  const y = chunks(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const p = x[i];
    const q = y[i];
    if (p === q) continue;
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    if (/^\d/.test(p) && /^\d/.test(q) && Number(p) !== Number(q)) return Number(p) - Number(q);
    return p < q ? -1 : 1;
  }
  return 0;
}

const only = (d: Decls, keep: (name: string, d: Decl) => boolean): Decls =>
  new Map([...d].filter(([k, v]) => keep(k, v)).sort(([a], [b]) => naturalCompare(a, b)));

/** A rule: hex declarations, then the colour primitives of the rule again as oklch under `@supports`. */
function rules(selector: string, decls: Decls, oklch: Decls, indent: string): string[] {
  if (decls.size === 0) return [];
  const list = (d: Decls, pad: string) => [...d].map(([k, v]) => `${pad}${k}: ${v.css};`);
  const wide = only(oklch, (name) => decls.has(name));
  return [
    `${indent}${selector} {`,
    ...list(decls, `${indent}  `),
    `${indent}}`,
    "",
    ...(wide.size === 0
      ? []
      : [
          `${indent}@supports (color: oklch(0 0 0)) {`,
          `${indent}  ${selector} {`,
          ...list(wide, `${indent}    `),
          `${indent}  }`,
          `${indent}}`,
          "",
        ]),
  ];
}

const scope = (name: string) => `[data-unison-theme="${name}"]`;
const MEDIA_DARK = "@media (prefers-color-scheme: dark)";
const NOT_LIGHT = ':not([data-theme="light"])';

/** The three selector lists of a theme; the first theme also owns `:root` and bare `[data-theme]`. */
function selectorsFor(name: string, isFirst: boolean) {
  const s = scope(name);
  return isFirst
    ? {
        light: `:root, ${s}, [data-theme="light"]`,
        dark: `[data-theme="dark"], [data-theme="dark"] ${s}, ${s}[data-theme="dark"]`,
        media: `:root${NOT_LIGHT}, :root${NOT_LIGHT} ${s}${NOT_LIGHT}`,
      }
    : {
        light: `${s}, ${s}[data-theme="light"]`,
        dark: `[data-theme="dark"] ${s}, ${s}[data-theme="dark"]`,
        media: `:root${NOT_LIGHT} ${s}${NOT_LIGHT}`,
      };
}

/** Browsers without linear() get a plain cubic-bezier instead (the duration variable still applies). */
function springFallback(light: Decls): string[] {
  const springs = [...light.keys()].filter(
    (k) => k.startsWith("--unison-spring-") && !k.endsWith("-duration"),
  );
  if (springs.length === 0) return [];
  return [
    "@supports not (transition-timing-function: linear(0, 1)) {",
    "  :root {",
    ...springs.map((k) => `    ${k}: cubic-bezier(0.2, 0, 0, 1);`),
    "  }",
    "}",
    "",
  ];
}

/** The `tokens.css` of every theme; the first theme is the default and owns `:root`. */
export function emitTokensCss(themes: ThemeBuild[]): string {
  const [first] = themes;
  if (!first) throw new Error("emitTokensCss needs at least one theme");
  const base = { light: schemeDecls(first, "light"), dark: schemeDecls(first, "dark") };
  const blocks: string[] = [];
  const reduced: string[] = [];
  const reducedBase = reducedDecls(first);

  themes.forEach((theme, i) => {
    const sel = selectorsFor(theme.name, i === 0);
    const light = i === 0 ? base.light : schemeDecls(theme, "light");
    const dark = i === 0 ? base.dark : schemeDecls(theme, "dark");
    const lightOut = only(
      light,
      (k, v) =>
        i === 0 ||
        base.light.get(k)?.resolved !== v.resolved ||
        // Under a dark ancestor, anything equal to default-light would inherit default-dark.
        base.dark.get(k)?.resolved !== v.resolved,
    );
    // Nothing may leak in from an ancestor's default dark, so also compare against it.
    const darkOut = only(
      dark,
      (k, v) =>
        light.get(k)?.resolved !== v.resolved ||
        (i > 0 && base.dark.get(k)?.resolved !== v.resolved),
    );
    const lightWide = oklchDecls(theme.light.tokens);
    const darkWide = oklchDecls(theme.dark.tokens);
    blocks.push(
      ...rules(sel.light, lightOut, lightWide, ""),
      ...rules(sel.dark, darkOut, darkWide, ""),
      ...(darkOut.size === 0
        ? []
        : [`${MEDIA_DARK} {`, ...rules(sel.media, darkOut, darkWide, "  ").slice(0, -1), "}", ""]),
    );
    const own = reducedDecls(theme);
    const reducedOut = only(
      own,
      (k, v) =>
        i === 0 ||
        reducedBase.get(k)?.resolved !== v.resolved ||
        base.light.get(k)?.resolved !== light.get(k)?.resolved,
    );
    if (reducedOut.size > 0) reduced.push(...rules(sel.light, reducedOut, new Map(), "  "));
  });

  return [
    ...blocks,
    ...springFallback(base.light),
    ...keyframes(expandPresets(first.light.tokens, first.motion)),
    ...(reduced.length === 0
      ? []
      : ["@media (prefers-reduced-motion: reduce) {", ...reduced.slice(0, -1), "}", ""]),
  ].join("\n");
}

/** Writes dist/web/tokens.css; returns the written path. */
export function emitWeb(outDir: string, themes: ThemeBuild[]): string[] {
  mkdirSync(outDir, { recursive: true });
  const tokensPath = join(outDir, "tokens.css");
  writeFileSync(tokensPath, emitTokensCss(themes));
  return [tokensPath];
}
