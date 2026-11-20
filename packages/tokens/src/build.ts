import { fileURLToPath } from "node:url";
import { ContrastError, type ContrastResult, checkContrast } from "./color/auto-contrast";
import type { Mode } from "./color/generate-scale";
import { BUILT_IN_PALETTES, colorPrimitives, type PaletteSpec } from "./color/palettes";
import { assertTiers } from "./lint-tiers";
import { loadSource } from "./load";
import {
  expandPresets,
  type MotionFeel,
  type MotionPresetName,
  type MotionPresetValue,
} from "./motion/presets";
import { type Resolved, type ResolvedToken, resolve } from "./resolve";
import type {
  ColorValue,
  Dimension,
  Duration,
  ShadowLayer,
  SourceToken,
  Typography,
} from "./schema";
import { darkShadow, type ShadowSize, shadowToCss } from "./shadow";
import { type Density, densityLayer, type RadiusOption, radiusLayer } from "./shape";
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
  type: "color" | "dimension" | "duration" | "spring" | "cubicBezier";
  value: string | SpringConfig | number[];
}
/** One text style for the interim native emitter. */
export interface TextStyleOutput {
  style: string;
  native: NativeTextStyle;
}
export interface TokenSets {
  light: Token[];
  dark: Token[];
  darkOverrides: Token[];
  text: TextStyleOutput[];
  /** `shadow.<size>` as CSS strings per scheme, sorted by size name. */
  shadows: { light: Record<string, string>; dark: Record<string, string> };
  /** The theme the presets belong to (`dist/motion.js` is keyed by it). */
  themeName: string;
  /** Every motion preset with its feel applied; the same for both schemes. */
  motionPresets: Record<MotionPresetName, MotionPresetValue>;
}

const LEGACY_TYPES = new Set(["color", "dimension", "duration", "spring", "cubicBezier"]);
/** Primitives that only feed text styles; the interim emitters output the styles instead. */
const TEXT_PRIMITIVE = /^(font-size|line-height)\./;

/** The phase 0 native emitter still takes string values; this adapter goes away in Task 16. */
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
        case "cubicBezier":
          return { path: t.path, type, value: [...(t.value as number[])] };
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
  "spring.snappy",
  "spring.smooth",
  "spring.bouncy",
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

/** The phase 0 token sets for the native emitters, taken from a theme build so the outputs match what contrast checked. */
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
    shadows: { light: shadows(build.light.tokens), dark: shadows(build.dark.tokens) },
    themeName: build.name,
    motionPresets: expandPresets(build.light.tokens, build.motion),
  };
}

function shadows(tokens: Resolved): Record<string, string> {
  return Object.fromEntries(
    [...tokens.values()]
      .filter((t) => t.type === "shadow" && /^shadow\.[^.]+$/.test(t.path))
      .map(
        (t) =>
          [
            t.path.slice("shadow.".length) as ShadowSize,
            shadowToCss(t.value as ShadowLayer[]),
          ] as const,
      )
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}

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
  /** Control heights; default `"default"`. */
  density?: Density;
  /** How round controls, cards and overlays are; default `"md"`. */
  radius?: RadiusOption;
  /** Native font face per family and weight; defaults to `DEFAULT_NATIVE_FONTS`. */
  nativeFonts?: NativeFonts;
  /** How the motion presets feel; default `"snappy"`. */
  motion?: MotionFeel;
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
  /** The motion feel the presets are expanded with. */
  motion: MotionFeel;
}

/** Dark overrides for every primitive shadow, derived so the geometry can't drift. */
function darkShadowLayer(primitive: SourceToken[]): SourceToken[] {
  return primitive
    .filter((t) => t.type === "shadow" && Array.isArray(t.value))
    .map((t) => ({ ...t, value: darkShadow(t.value as ShadowLayer[]), file: "dark-shadow" }));
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
    const base = [
      ...colorPrimitives(palettes, scheme),
      ...layers.primitive,
      ...densityLayer(opts.density ?? "default"),
      ...(scheme === "dark" ? darkShadowLayer(layers.primitive) : []),
    ];
    const shape = radiusLayer(opts.radius ?? "md");
    const stacks =
      scheme === "light"
        ? [layers.semantic, shape, layers.light]
        : [layers.semantic, shape, layers.light, layers.dark];
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
    motion: opts.motion ?? "snappy",
  };
}
