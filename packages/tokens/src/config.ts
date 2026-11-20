import type { SemanticTokenPath } from "@unison-ui/tokens/types";
import type { ThemeBuildOptions } from "./build";
import { type PaletteSpec, paletteFromSeed } from "./color/palettes";
import type { MotionFeel } from "./motion/presets";
import type { Density, RadiusOption } from "./shape";
import { nearest } from "./suggest";
import type { NativeFonts } from "./typography";

export const ACCENT_PRESETS = {
  indigo: { hue: 275, chroma: 0.2 },
  violet: { hue: 295, chroma: 0.21 },
  blue: { hue: 255, chroma: 0.19 },
  teal: { hue: 185, chroma: 0.13 },
  green: { hue: 150, chroma: 0.17 },
  orange: { hue: 50, chroma: 0.19 },
  rose: { hue: 10, chroma: 0.21 },
} as const;
export type AccentPreset = keyof typeof ACCENT_PRESETS;

/** `gray` takes the accent's hue; the others are fixed. */
export const NEUTRAL_PRESETS = {
  gray: { hue: undefined, chroma: 0.012 },
  neutral: { hue: 0, chroma: 0 },
  slate: { hue: 250, chroma: 0.02 },
  warm: { hue: 60, chroma: 0.015 },
} as const;
export type NeutralPreset = keyof typeof NEUTRAL_PRESETS;

const RADII = ["none", "sm", "md", "lg", "full"] as const satisfies readonly RadiusOption[];
const DENSITIES = ["compact", "default", "comfortable"] as const satisfies readonly Density[];
const FEELS = ["snappy", "smooth", "reduced"] as const satisfies readonly MotionFeel[];

export interface ThemeOptions {
  /** Inherit every option this theme doesn't set from another theme in the same config. */
  extends?: string;
  accent?: AccentPreset | `#${string}` | { hue: number; chroma: number };
  neutral?: NeutralPreset;
  radius?: RadiusOption;
  density?: Density;
  motion?: MotionFeel;
  autoContrast?: boolean;
  fonts?: { sans?: string; mono?: string; nativeFonts?: Partial<NativeFonts> };
  /** One-off changes: semantic token → alias of another token. */
  overrides?: Partial<Record<SemanticTokenPath, `{${string}}`>>;
}

export interface UnisonConfig {
  themes: Record<string, ThemeOptions>;
  defaultTheme?: string;
}

export const defineTheme = (o: ThemeOptions): ThemeOptions => o;
export const defineConfig = (c: UnisonConfig): UnisonConfig => c;
export const DEFAULT_CONFIG: UnisonConfig = { themes: { default: {} } };

export class ConfigError extends Error {
  override name = "ConfigError";
  constructor(readonly problems: string[]) {
    super(problems.join("\n"));
  }
}

const THEME_KEYS = [
  "extends",
  "accent",
  "neutral",
  "radius",
  "density",
  "motion",
  "autoContrast",
  "fonts",
  "overrides",
] as const;
const FONT_KEYS = ["sans", "mono", "nativeFonts"] as const;
const HEX = /^#[0-9a-f]{6}$/i;
const ALIAS = /^\{[a-z0-9.-]+\}$/;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function unknownKey(at: string, key: string, known: readonly string[]): string {
  const hint = nearest(key, known);
  return `${at}.${key}: unknown option${hint ? `, did you mean "${hint}"?` : ""}`;
}

function oneOf(at: string, value: unknown, options: readonly string[]): string | undefined {
  if (typeof value === "string" && options.includes(value)) return undefined;
  const hint = typeof value === "string" ? nearest(value, options) : undefined;
  return hint
    ? `${at}: ${JSON.stringify(value)} is not valid, did you mean "${hint}"?`
    : `${at}: expected one of ${options.join(", ")}`;
}

function accentProblem(at: string, v: unknown): string | undefined {
  if (typeof v === "string" && (v in ACCENT_PRESETS || HEX.test(v))) return undefined;
  if (
    isRecord(v) &&
    typeof v.hue === "number" &&
    typeof v.chroma === "number" &&
    v.chroma >= 0 &&
    Object.keys(v).length === 2
  ) {
    return undefined;
  }
  if (typeof v === "string" && !v.startsWith("#")) return oneOf(at, v, Object.keys(ACCENT_PRESETS));
  return `${at}: expected a preset (${Object.keys(ACCENT_PRESETS).join(", ")}), a "#rrggbb" colour or { hue, chroma }`;
}

/**
 * Checks a config's shape; returns every problem (empty = valid). `semanticPaths`, when given,
 * also checks that overrides only target semantic tokens.
 */
export function validateConfig(c: unknown, semanticPaths?: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  if (!isRecord(c)) return ["config: expected an object with themes"];
  for (const key of Object.keys(c)) {
    if (key !== "themes" && key !== "defaultTheme") {
      problems.push(unknownKey("config", key, ["themes", "defaultTheme"]));
    }
  }
  if (!isRecord(c.themes) || Object.keys(c.themes).length === 0) {
    return [...problems, "themes: expected at least one theme"];
  }
  if (c.defaultTheme !== undefined && !(String(c.defaultTheme) in c.themes)) {
    problems.push(`defaultTheme: ${JSON.stringify(c.defaultTheme)} is not one of the themes`);
  }
  for (const [name, theme] of Object.entries(c.themes)) {
    const at = `themes.${name}`;
    if (!isRecord(theme)) {
      problems.push(`${at}: expected the result of defineTheme()`);
      continue;
    }
    for (const [key, v] of Object.entries(theme)) {
      const field = `${at}.${key}`;
      let p: string | undefined;
      switch (key) {
        case "extends":
          if (typeof v !== "string") p = `${field}: expected a theme name`;
          break;
        case "accent":
          p = accentProblem(field, v);
          break;
        case "neutral":
          p = oneOf(field, v, Object.keys(NEUTRAL_PRESETS));
          break;
        case "radius":
          p = oneOf(field, v, RADII);
          break;
        case "density":
          p = oneOf(field, v, DENSITIES);
          break;
        case "motion":
          p = oneOf(field, v, FEELS);
          break;
        case "autoContrast":
          if (typeof v !== "boolean") p = `${field}: expected true or false`;
          break;
        case "fonts":
          if (!isRecord(v)) p = `${field}: expected { sans?, mono?, nativeFonts? }`;
          else {
            for (const [fk, fv] of Object.entries(v)) {
              if (!(FONT_KEYS as readonly string[]).includes(fk)) {
                problems.push(unknownKey(field, fk, FONT_KEYS));
              } else if (fk !== "nativeFonts" && typeof fv !== "string") {
                problems.push(`${field}.${fk}: expected a CSS font-family list`);
              } else if (fk === "nativeFonts" && !isRecord(fv)) {
                problems.push(`${field}.nativeFonts: expected { sans?, mono? } face maps`);
              }
            }
          }
          break;
        case "overrides":
          if (!isRecord(v)) p = `${field}: expected { "<semantic path>": "{alias}" }`;
          else {
            for (const [path, alias] of Object.entries(v)) {
              const o = `${field}[${JSON.stringify(path)}]`;
              if (semanticPaths && !semanticPaths.has(path)) {
                problems.push(`${o}: only semantic tokens can be overridden`);
              } else if (typeof alias !== "string" || !ALIAS.test(alias)) {
                problems.push(`${o}: must be an alias like "{color.accent.400}"`);
              }
            }
          }
          break;
        default:
          p = unknownKey(at, key, THEME_KEYS);
      }
      if (p) problems.push(p);
    }
  }
  return problems;
}

/** Fills in the defaults and turns presets into palette specs. */
export function toBuildOptions(name: string, o: ThemeOptions): ThemeBuildOptions {
  const accentOpt = o.accent ?? "indigo";
  let accent: PaletteSpec;
  if (typeof accentOpt === "string" && accentOpt.startsWith("#")) {
    const seed = accentOpt.toLowerCase();
    const { hue, chroma } = paletteFromSeed(seed, { anchor: true });
    accent = { name: "accent", hue, chroma, anchor: seed };
  } else {
    const { hue, chroma } =
      typeof accentOpt === "string" ? ACCENT_PRESETS[accentOpt as AccentPreset] : accentOpt;
    accent = { name: "accent", hue, chroma };
  }
  const n = NEUTRAL_PRESETS[o.neutral ?? "gray"];
  const neutral: PaletteSpec = { name: "gray", hue: n.hue ?? accent.hue, chroma: n.chroma };
  return {
    name,
    accent,
    neutral,
    autoContrast: o.autoContrast ?? true,
    radius: o.radius ?? "md",
    density: o.density ?? "default",
    motion: o.motion ?? "snappy",
    ...(o.fonts ? { fonts: o.fonts } : {}),
    ...(o.overrides ? { overrides: o.overrides as Record<string, string> } : {}),
  };
}
