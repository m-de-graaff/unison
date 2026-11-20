import type { SourceToken } from "./schema";

export type Density = "compact" | "default" | "comfortable";
export type RadiusOption = "none" | "sm" | "md" | "lg" | "full";

const CONTROL: Record<Density, [number, number, number]> = {
  compact: [28, 36, 44],
  default: [32, 40, 48],
  comfortable: [36, 44, 52],
};

/** radius.{control,card,overlay} → primitive step, per the theme's radius option. */
const RADIUS: Record<RadiusOption, [string, string, string]> = {
  none: ["none", "none", "none"],
  sm: ["sm", "md", "lg"],
  md: ["md", "lg", "xl"],
  lg: ["lg", "xl", "2xl"],
  full: ["full", "2xl", "2xl"],
};

/** Overrides `size.control-*` for a density (`size.json` holds the default). */
export function densityLayer(d: Density): SourceToken[] {
  return (["sm", "md", "lg"] as const).map((step, i) => ({
    path: `size.control-${step}`,
    type: "dimension",
    value: { value: CONTROL[d][i] as number, unit: "px" },
    file: `density:${d}`,
    tier: "primitive",
  }));
}

/** Overrides the `radius.{control,card,overlay}` aliases (`shape.json` holds `md`). */
export function radiusLayer(r: RadiusOption): SourceToken[] {
  return (["control", "card", "overlay"] as const).map((name, i) => ({
    path: `radius.${name}`,
    type: "dimension",
    value: `{radius.${RADIUS[r][i]}}`,
    file: `radius:${r}`,
    tier: "semantic",
  }));
}
