import type { Dimension, ShadowLayer } from "./schema";

export type ShadowSize = "xs" | "sm" | "md" | "lg" | "xl";

const DARK_ALPHA_FACTOR = 2.5;
const DARK_ALPHA_CAP = 0.5;
const ANDROID_ELEVATION: Record<ShadowSize, number> = { xs: 1, sm: 2, md: 4, lg: 8, xl: 12 };

const px = (d: Dimension) => (d.unit === "rem" ? d.value * 16 : d.value);
const len = (d: Dimension) => (d.value === 0 ? "0" : `${d.value}${d.unit}`);
const alphaOf = (hex: string) => (hex.length === 9 ? Number.parseInt(hex.slice(7), 16) / 255 : 1);
const fmt = (n: number) => String(Number(n.toFixed(2)));

function rgbOf(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

/** `0 1px 2px rgb(0 0 0 / 0.05)`; a zero spread is left out. */
export function shadowToCss(layers: ShadowLayer[]): string {
  return layers
    .map((l) => {
      const [r, g, b] = rgbOf(l.color.hex);
      const parts = [len(l.x), len(l.y), len(l.blur)];
      if (l.spread.value !== 0) parts.push(len(l.spread));
      const css = `${parts.join(" ")} rgb(${r} ${g} ${b} / ${fmt(alphaOf(l.color.hex))})`;
      return l.inset ? `inset ${css}` : css;
    })
    .join(", ");
}

/** Same geometry, every alpha × 2.5 capped at 0.5: shadows barely show on dark surfaces. */
export function darkShadow(layers: ShadowLayer[]): ShadowLayer[] {
  return layers.map((l) => {
    const alpha = Math.min(DARK_ALPHA_CAP, alphaOf(l.color.hex) * DARK_ALPHA_FACTOR);
    const aa = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return { ...l, color: { hex: `${l.color.hex.slice(0, 7)}${aa}` } };
  });
}

/**
 * Pre-`boxShadow` React Native styles from the largest layer (by blur): iOS shadow* props and
 * Android `elevation`. `shadowRadius` is half the CSS blur, which matches how iOS spreads it.
 */
export function legacyShadow(
  layers: ShadowLayer[],
  size: ShadowSize,
): {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
} {
  const largest = layers.reduce((a, b) => (px(b.blur) > px(a.blur) ? b : a));
  return {
    shadowColor: largest.color.hex.slice(0, 7),
    shadowOffset: { width: px(largest.x), height: px(largest.y) },
    shadowOpacity: Number(alphaOf(largest.color.hex).toFixed(2)),
    shadowRadius: px(largest.blur) / 2,
    elevation: ANDROID_ELEVATION[size],
  };
}
