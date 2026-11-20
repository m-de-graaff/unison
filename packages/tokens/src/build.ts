import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ContrastError, type ContrastResult, checkContrast } from "./color/auto-contrast";
import type { Mode } from "./color/generate-scale";
import { BUILT_IN_PALETTES, colorPrimitives, type PaletteSpec } from "./color/palettes";
import {
  ConfigError,
  DEFAULT_CONFIG,
  toBuildOptions,
  type UnisonConfig,
  validateConfig,
} from "./config";
import { emitJson } from "./emit-json";
import { emitMotion } from "./emit-motion";
import { emitNative } from "./emit-native";
import { emitTailwind } from "./emit-tailwind";
import { emitTypes } from "./emit-types";
import { emitWeb } from "./emit-web";
import { assertTiers } from "./lint-tiers";
import { loadSource } from "./load";
import type { MotionFeel } from "./motion/presets";
import { type Resolved, resolve } from "./resolve";
import type { ShadowLayer, SourceLayers, SourceToken } from "./schema";
import { darkShadow } from "./shadow";
import { type Density, densityLayer, type RadiusOption, radiusLayer } from "./shape";
import { DEFAULT_NATIVE_FONTS, type NativeFonts } from "./typography";
import { normalise } from "./validate";

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
  /** Replaces `font-family.sans` / `.mono` (CSS lists); `nativeFonts` merges over the defaults. */
  fonts?: { sans?: string; mono?: string; nativeFonts?: Partial<NativeFonts> };
  /** Semantic token → alias, applied as the last semantic layer (so it's contrast-checked). */
  overrides?: Record<string, string>;
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

const semanticTokens = (layers: SourceLayers) => [
  ...layers.semantic,
  ...layers.light,
  ...layers.dark,
];

/** `fonts.sans` / `fonts.mono` as primitive overrides of `font-family.*`. */
function fontLayer(fonts: ThemeBuildOptions["fonts"]): SourceToken[] {
  return (["sans", "mono"] as const).flatMap((family) => {
    const css = fonts?.[family];
    if (css === undefined) return [];
    const r = normalise("fontFamily", css);
    if (!r.ok) throw new ConfigError([`fonts.${family}: ${r.message}`]);
    return [
      {
        path: `font-family.${family}`,
        type: "fontFamily" as const,
        value: r.value,
        file: "config:fonts",
        tier: "primitive" as const,
      },
    ];
  });
}

/** Overrides keep the overridden token's type, so the resolver type-checks the alias. */
function overrideLayer(
  layers: SourceLayers,
  overrides: ThemeBuildOptions["overrides"],
): SourceToken[] {
  const byPath = new Map(semanticTokens(layers).map((t) => [t.path, t]));
  return Object.entries(overrides ?? {}).map(([path, alias]) => {
    const target = byPath.get(path);
    if (!target)
      throw new ConfigError([
        `overrides[${JSON.stringify(path)}]: only semantic tokens can be overridden`,
      ]);
    return {
      path,
      type: target.type,
      value: alias,
      file: "config:overrides",
      tier: "semantic" as const,
    };
  });
}

function mergeNativeFonts(extra: Partial<NativeFonts> | undefined): NativeFonts {
  return {
    sans: { ...DEFAULT_NATIVE_FONTS.sans, ...extra?.sans },
    mono: { ...DEFAULT_NATIVE_FONTS.mono, ...extra?.mono },
  };
}

/** Builds one theme for both schemes and enforces contrast; throws `ContrastError` on failures. */
export function buildTheme(opts: ThemeBuildOptions, source?: SourceLayers): ThemeBuild {
  const layers = source ?? loadSource(opts.root ?? packageRoot());
  if (!source) assertTiers(layers);
  const fonts = fontLayer(opts.fonts);
  const overrides = overrideLayer(layers, opts.overrides);
  const palettes = BUILT_IN_PALETTES().map((p) =>
    p.name === opts.accent.name ? opts.accent : p.name === opts.neutral.name ? opts.neutral : p,
  );
  const warnings: string[] = [];
  const failures: ContrastResult[] = [];
  const build = (scheme: Mode): SchemeBuild => {
    const base = [
      ...colorPrimitives(palettes, scheme),
      ...layers.primitive,
      ...fonts,
      ...densityLayer(opts.density ?? "default"),
      ...(scheme === "dark" ? darkShadowLayer(layers.primitive) : []),
    ];
    const shape = radiusLayer(opts.radius ?? "md");
    const stacks =
      scheme === "light"
        ? [layers.semantic, shape, layers.light, overrides]
        : [layers.semantic, shape, layers.light, layers.dark, overrides];
    const first = resolve(base, ...stacks);
    const {
      results,
      overrides: adjusted,
      warnings: w,
    } = checkContrast(first, {
      theme: opts.name,
      scheme,
      autoContrast: opts.autoContrast,
    });
    warnings.push(...w);
    failures.push(...results.filter((r) => !r.pass));
    // Auto-contrast overrides are applied after the tier lint, so they may be raw.
    const tokens = adjusted.length > 0 ? resolve(base, ...stacks, adjusted) : first;
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
    nativeFonts: opts.nativeFonts ?? mergeNativeFonts(opts.fonts?.nativeFonts),
    motion: opts.motion ?? "snappy",
  };
}

export interface BuildResult {
  themes: ThemeBuild[];
  defaultTheme: string;
  warnings: string[];
}

/**
 * Validates a config and builds every theme in it, in config order. Throws `ConfigError` for
 * invalid options and `ContrastError` for failing pairs. `sourceDir` (default: this package)
 * holds `tokens/`.
 */
export function build(
  config: UnisonConfig = DEFAULT_CONFIG,
  { sourceDir }: { sourceDir?: string } = {},
): BuildResult {
  const layers = loadSource(sourceDir ?? packageRoot());
  assertTiers(layers);
  const problems = validateConfig(config, new Set(semanticTokens(layers).map((t) => t.path)));
  if (problems.length > 0) throw new ConfigError(problems);
  const themes = Object.entries(config.themes).map(([name, o]) =>
    buildTheme(toBuildOptions(name, o), layers),
  );
  const defaultTheme = config.defaultTheme ?? (themes[0] as ThemeBuild).name;
  return { themes, defaultTheme, warnings: themes.flatMap((t) => t.warnings) };
}

/** Writes every output for a build into `outDir`; returns the written paths. */
export function writeOutputs(r: BuildResult, outDir: string): string[] {
  return [
    ...emitWeb(join(outDir, "web"), r.themes),
    ...emitTailwind(outDir, r.themes),
    ...emitNative(join(outDir, "native"), r.themes),
    ...emitMotion(outDir, r.themes),
    ...emitTypes(outDir, r.themes),
    ...emitJson(outDir, r.themes, r.defaultTheme),
  ];
}
