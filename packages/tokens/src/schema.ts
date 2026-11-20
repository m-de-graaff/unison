import type { SpringConfig } from "./spring";

export const TOKEN_TYPES = [
  "color",
  "dimension",
  "duration",
  "number",
  "fontFamily",
  "fontWeight",
  "cubicBezier",
  "typography",
  "shadow",
  "transition",
  "spring",
  "motionPreset",
] as const;

export type TokenType = (typeof TOKEN_TYPES)[number];
export type Tier = "primitive" | "semantic";

export interface Dimension {
  value: number;
  unit: "px" | "rem";
}
export interface Duration {
  value: number;
  unit: "ms";
}
export interface ColorValue {
  /** Lowercase `#rrggbb` or `#rrggbbaa`. */
  hex: string;
  oklch?: string;
}
export interface ShadowLayer {
  x: Dimension;
  y: Dimension;
  blur: Dimension;
  spread: Dimension;
  color: ColorValue;
  inset?: boolean;
}
export interface Typography {
  fontFamily: string[];
  fontWeight: number;
  fontSize: Dimension;
  lineHeight: Dimension;
  letterSpacing: { value: number; unit: "em" | "px" };
}
export type CubicBezier = [number, number, number, number];
export type Transition = { duration: Duration; easing: CubicBezier } | { spring: SpringConfig };

export interface SourceToken {
  path: string;
  type: TokenType;
  /** Normalised; may still contain alias strings like `"{color.gray.900}"`. */
  value: unknown;
  file: string;
  tier: Tier;
  description?: string;
  raw?: boolean;
}

export interface ValidationError {
  file: string;
  path: string;
  message: string;
}

/** `light` / `dark` are color.light.json / color.dark.json; `semantic` is the other semantic files. */
export interface SourceLayers {
  primitive: SourceToken[];
  semantic: SourceToken[];
  light: SourceToken[];
  dark: SourceToken[];
}

export const ALIAS = /^\{([a-z0-9.-]+)\}$/;
export const isAlias = (v: unknown): v is string => typeof v === "string" && ALIAS.test(v);
