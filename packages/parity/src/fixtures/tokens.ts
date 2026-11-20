/** The 12 swatch colours (OQ-10: all within ΔE2000 2 of native's hex in both schemes). */
export const SWATCH_COLORS = [
  "canvas",
  "surface",
  "surface-raised",
  "subtle",
  "muted",
  "fg",
  "fg-muted",
  "border-strong",
  "accent",
  "accent-subtle",
  "success",
  "danger",
] as const;
export const TEXT_STYLES = [
  "caption",
  "label",
  "body-sm",
  "body",
  "body-lg",
  "title-sm",
  "title",
  "title-lg",
  "display",
  "code",
] as const;
export const RADII = ["control", "card", "overlay", "pill"] as const;
export const ELEVATIONS = ["raised", "popover", "overlay"] as const;
export const TYPE_SAMPLE = "Ag Hamburgefonstiv";
