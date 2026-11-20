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
const LIGHT = '[data-theme="light"]';
const DARK = '[data-theme="dark"]';

/**
 * The selector lists of a theme (ADR 0018). Three weights, so a nearer element always wins:
 * - (0,2,0) the compound `[theme][scheme]` on the element itself; ThemeScope always writes both.
 * - (0,1,0) an element carrying one attribute, the other set on a non-root ancestor.
 * - 0 (`:where()`) the base shapes and an element carrying one attribute, the other set on `:root`.
 * Equal weights fall back to source order: themes in config order, light before dark.
 */
function selectorsFor(name: string, isFirst: boolean) {
  const s = scope(name);
  const list = (compound: string, where: string[], near: string[]) =>
    [compound, `:where(${where.join(", ")})`, ...near].join(", ");
  const scheme = (attr: string) =>
    list(
      `${s}${attr}`,
      [
        ...(isFirst ? (attr === LIGHT ? [":root", attr] : [attr]) : []),
        ...(attr === LIGHT ? [s] : [`:root${attr} ${s}`]),
        `:root${s} ${attr}`,
      ],
      [`:where(:not(:root)${attr}) ${s}`, `:where(:not(:root)${s}) ${attr}`],
    );
  // OS dark: only where nothing sets data-theme (the element or an ancestor).
  const media = [
    ...(isFirst ? [':root:not([data-theme="light"])'] : []),
    `${s}:not([data-theme]):not([data-theme] *)`,
  ];
  return { light: scheme(LIGHT), dark: scheme(DARK), media: `:where(${media.join(", ")})` };
}

/** One emitted rule, kept so the spring fallback can repeat its selector. */
interface Block {
  selector: string;
  decls: Decls;
  media: boolean;
  /** The `easing.standard` curve of the rule's theme and scheme. */
  curve: string;
}

/** `easing.standard` as CSS, the fallback curve for springs (`ease` if a source drops it). */
function standardCurve(tokens: Resolved): string {
  const t = tokens.get("easing.standard");
  return t?.type === "cubicBezier" ? `cubic-bezier(${(t.value as number[]).join(", ")})` : "ease";
}

/**
 * Browsers without linear() get the theme's standard curve instead (the duration variable still
 * applies): every rule that declares a spring is repeated with the same selector, so it wins.
 */
function springFallback(blocks: Block[]): string[] {
  const out: string[] = [];
  for (const b of blocks) {
    const springs = [...b.decls.keys()].filter(
      (k) => k.startsWith("--unison-spring-") && !k.endsWith("-duration"),
    );
    if (springs.length === 0) continue;
    const pad = b.media ? "    " : "  ";
    const rule = [
      `${pad}${b.selector} {`,
      ...springs.map((k) => `${pad}  ${k}: ${b.curve};`),
      `${pad}}`,
    ];
    out.push(...(b.media ? [`  ${MEDIA_DARK} {`, ...rule, "  }"] : rule));
  }
  if (out.length === 0) return [];
  return ["@supports not (transition-timing-function: linear(0, 1)) {", ...out, "}", ""];
}

/** Names whose resolved value isn't the same in every theme × scheme (or is missing in one). */
function varying(all: Decls[]): Set<string> {
  const names = new Set(all.flatMap((d) => [...d.keys()]));
  return new Set(
    [...names].filter((k) => new Set(all.map((d) => d.get(k)?.resolved ?? "")).size > 1),
  );
}

/**
 * The `tokens.css` of every theme; the first theme is the default and owns `:root`. Since a scope
 * may sit inside any other theme × scheme, every override rule declares each variable whose
 * resolved value differs anywhere (a `var()` resolves where it's declared, so equal alias text
 * isn't enough).
 */
export function emitTokensCss(themes: ThemeBuild[]): string {
  const [first] = themes;
  if (!first) throw new Error("emitTokensCss needs at least one theme");
  const decls = themes.map((t) => ({
    light: schemeDecls(t, "light"),
    dark: schemeDecls(t, "dark"),
  }));
  const vary = varying(decls.flatMap((d) => [d.light, d.dark]));
  const reducedAll = themes.map(reducedDecls);
  const reducedVary = varying(reducedAll);
  const blocks: Block[] = [];
  const out: string[] = [];
  const reduced: string[] = [];

  themes.forEach((theme, i) => {
    const sel = selectorsFor(theme.name, i === 0);
    const { light, dark } = decls[i] as { light: Decls; dark: Decls };
    const lightOut = only(light, (k) => i === 0 || vary.has(k));
    const darkOut = only(dark, (k) => vary.has(k));
    const lightWide = oklchDecls(theme.light.tokens);
    const darkWide = oklchDecls(theme.dark.tokens);
    const lightCurve = standardCurve(theme.light.tokens);
    const darkCurve = standardCurve(theme.dark.tokens);
    blocks.push(
      { selector: sel.light, decls: lightOut, media: false, curve: lightCurve },
      { selector: sel.dark, decls: darkOut, media: false, curve: darkCurve },
      { selector: sel.media, decls: darkOut, media: true, curve: darkCurve },
    );
    out.push(
      ...rules(sel.light, lightOut, lightWide, ""),
      ...rules(sel.dark, darkOut, darkWide, ""),
      ...(darkOut.size === 0
        ? []
        : [`${MEDIA_DARK} {`, ...rules(sel.media, darkOut, darkWide, "  ").slice(0, -1), "}", ""]),
    );
    const reducedOut = only(
      reducedAll[i] as Decls,
      (k) => i === 0 || vary.has(k) || reducedVary.has(k),
    );
    if (reducedOut.size > 0) {
      reduced.push(...rules(`${sel.light}, ${sel.dark}`, reducedOut, new Map(), "  "));
    }
  });

  return [
    ...out,
    ...springFallback(blocks.filter((b) => b.decls.size > 0)),
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
