import { fileURLToPath } from "node:url";
import { ContrastError, type ContrastResult, checkContrast } from "./color/auto-contrast";
import type { Mode } from "./color/generate-scale";
import { BUILT_IN_PALETTES, colorPrimitives, type PaletteSpec } from "./color/palettes";
import { assertTiers } from "./lint-tiers";
import { loadSource } from "./load";
import { type Resolved, type ResolvedToken, resolve } from "./resolve";
import type { ColorValue, Dimension, Duration, SourceToken, Typography } from "./schema";
import type { SpringConfig } from "./spring";
import {
  DEFAULT_NATIVE_FONTS,
  type NativeFonts,
  type NativeTextStyle,
  TEXT_STYLES,
  toNativeTextStyle,
} from "./typography";

export interface Token {
  path: string;
  type: "color" | "dimension" | "duration" | "spring";
  value: string | SpringConfig;
}
/** One text style for the interim emitters: web CSS values and the native style. */
export interface TextStyleOutput {
  style: string;
  web: { size: string; "line-height": string; weight: string; tracking: string };
  native: NativeTextStyle;
}
export interface TokenSets {
  light: Token[];
  dark: Token[];
  darkOverrides: Token[];
  text: TextStyleOutput[];
  /** `font-family.*` as CSS font-family lists. */
  fontFamilies: { name: string; value: string }[];
}

const LEGACY_TYPES = new Set(["color", "dimension", "duration", "spring"]);
/** Primitives that only feed text styles; the interim emitters output the styles instead. */
const TEXT_PRIMITIVE = /^(font-size|line-height)\./;

/** Phase 0 emitters still take string values; this adapter goes away in Tasks 14 and 16. */
export function toLegacy(tokens: (SourceToken | ResolvedToken)[]): Token[] {
  return tokens
    .filter(
      (t) =>
        LEGACY_TYPES.has(t.type) &&
        typeof t.value !== "string" &&
        !TEXT_PRIMITIVE.test(t.path) &&
        (!("file" in t) || t.file !== "generated"),
    )
    .map((t) => {
      const type = t.type as Token["type"];
      switch (type) {
        case "color":
          return { path: t.path, type, value: (t.value as ColorValue).hex };
        case "dimension":
        case "duration": {
          const v = t.value as Dimension | Duration;
          return { path: t.path, type, value: `${v.value}${v.unit}` };
        }
        default:
          return { path: t.path, type, value: t.value as SpringConfig };
      }
    });
}

/** Phase 0's output order, so the legacy outputs stay byte-identical. */
const LEGACY_ORDER = [
  "color.accent",
  "color.surface",
  "color.fg",
  "color.border",
  "space.1",
  "space.2",
  "space.4",
  "radius.md",
  "size.box",
  "motion.duration.base",
  "motion.spring.snappy",
];
const rank = (path: string) => {
  const i = LEGACY_ORDER.indexOf(path);
  return i === -1 ? LEGACY_ORDER.length : i;
};

const ordered = (tokens: Token[]) =>
  tokens
    .map((t, i) => ({ t, i }))
    .sort((a, b) => rank(a.t.path) - rank(b.t.path) || a.i - b.i)
    .map(({ t }) => t);

/** The phase 0 token sets, taken from a theme build so the outputs match what contrast checked. */
export function legacyFromBuild(build: ThemeBuild): TokenSets {
  const l = ordered(toLegacy([...build.light.tokens.values()]));
  const d = ordered(toLegacy([...build.dark.tokens.values()]));
  const lightValues = new Map(l.map((t) => [t.path, JSON.stringify(t.value)]));
  const darkOverrides = d.filter((t) => lightValues.get(t.path) !== JSON.stringify(t.value));
  return {
    light: l,
    dark: d,
    darkOverrides,
    text: textStyles(build),
    fontFamilies: fontFamilies(build.light.tokens),
  };
}

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

function fontFamilies(tokens: Resolved): { name: string; value: string }[] {
  return [...tokens.values()]
    .filter((t) => t.type === "fontFamily" && t.path.startsWith("font-family."))
    .map((t) => ({
      name: t.path.slice("font-family.".length),
      value: cssFamilyList(t.value as string[]),
    }));
}

const measure = (v: { value: number; unit: string }) => `${v.value}${v.unit}`;

/** Text styles are scheme-independent, so they come from the light scheme. */
function textStyles(build: ThemeBuild): TextStyleOutput[] {
  const tokens = build.light.tokens;
  const mono = JSON.stringify(tokens.get("font-family.mono")?.value);
  return TEXT_STYLES.flatMap((style) => {
    const t = tokens.get(`text.${style}`)?.value as Typography | undefined;
    if (!t) return [];
    const family = JSON.stringify(t.fontFamily) === mono ? "mono" : "sans";
    return [
      {
        style,
        web: {
          size: measure(t.fontSize),
          "line-height": measure(t.lineHeight),
          weight: String(t.fontWeight),
          tracking: measure(t.letterSpacing),
        },
        native: toNativeTextStyle(t, family, build.nativeFonts),
      },
    ];
  });
}

export { ContrastError };

/** The folder that holds `tokens/`, from this module's own location (`src/` or `dist/`). */
// Lazy: consumers that only import `compile`-adjacent helpers may load this under a non-file URL.
const packageRoot = () => fileURLToPath(new URL("..", import.meta.url));

export interface ThemeBuildOptions {
  name: string;
  accent: PaletteSpec;
  neutral: PaletteSpec;
  autoContrast: boolean;
  /** Native font face per family and weight; defaults to `DEFAULT_NATIVE_FONTS`. */
  nativeFonts?: NativeFonts;
  /** Where `tokens/` lives. Defaults to this package. */
  root?: string;
}
export interface SchemeBuild {
  tokens: Resolved;
  contrast: ContrastResult[];
}
export interface ThemeBuild {
  name: string;
  light: SchemeBuild;
  dark: SchemeBuild;
  warnings: string[];
  nativeFonts: NativeFonts;
}

/** Builds one theme for both schemes and enforces contrast; throws `ContrastError` on failures. */
export function buildTheme(opts: ThemeBuildOptions): ThemeBuild {
  const layers = loadSource(opts.root ?? packageRoot());
  assertTiers(layers);
  const palettes = BUILT_IN_PALETTES().map((p) =>
    p.name === opts.accent.name ? opts.accent : p.name === opts.neutral.name ? opts.neutral : p,
  );
  const warnings: string[] = [];
  const failures: ContrastResult[] = [];
  const build = (scheme: Mode): SchemeBuild => {
    const base = [...colorPrimitives(palettes, scheme), ...layers.primitive];
    const stacks =
      scheme === "light"
        ? [layers.semantic, layers.light]
        : [layers.semantic, layers.light, layers.dark];
    const first = resolve(base, ...stacks);
    const {
      results,
      overrides,
      warnings: w,
    } = checkContrast(first, {
      theme: opts.name,
      scheme,
      autoContrast: opts.autoContrast,
    });
    warnings.push(...w);
    failures.push(...results.filter((r) => !r.pass));
    // Auto-contrast overrides are applied after the tier lint, so they may be raw.
    const tokens = overrides.length > 0 ? resolve(base, ...stacks, overrides) : first;
    return { tokens, contrast: results };
  };
  const light = build("light");
  const dark = build("dark");
  if (failures.length > 0) throw new ContrastError(failures);
  return {
    name: opts.name,
    light,
    dark,
    warnings,
    nativeFonts: opts.nativeFonts ?? DEFAULT_NATIVE_FONTS,
  };
}
