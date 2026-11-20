import { fileURLToPath } from "node:url";
import { ContrastError, type ContrastResult, checkContrast } from "./color/auto-contrast";
import type { Mode } from "./color/generate-scale";
import { BUILT_IN_PALETTES, colorPrimitives, type PaletteSpec } from "./color/palettes";
import { assertTiers } from "./lint-tiers";
import { loadSource } from "./load";
import type { MotionFeel } from "./motion/presets";
import { type Resolved, resolve } from "./resolve";
import type { ShadowLayer, SourceToken } from "./schema";
import { darkShadow } from "./shadow";
import { type Density, densityLayer, type RadiusOption, radiusLayer } from "./shape";
import { DEFAULT_NATIVE_FONTS, type NativeFonts } from "./typography";

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
