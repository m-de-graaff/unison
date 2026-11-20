import type { Token } from "./build";

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2 contrast ratio between two hex colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const MIN_RATIO = 4.5;

/** Throws if `color.fg` on `color.surface` is below 4.5:1 in either theme. */
export function assertContrast(sets: { light: Token[]; dark: Token[] }): void {
  for (const [scheme, tokens] of Object.entries(sets)) {
    const get = (path: string) => {
      const value = tokens.find((t) => t.path === path)?.value;
      if (typeof value !== "string") throw new Error(`Missing colour ${path} in ${scheme}`);
      return value;
    };
    const fg = get("color.fg");
    const surface = get("color.surface");
    const ratio = contrastRatio(fg, surface);
    if (ratio < MIN_RATIO) {
      throw new Error(
        `Contrast too low in ${scheme}: color.fg ${fg} on color.surface ${surface} is ` +
          `${ratio.toFixed(2)}:1 (needs ${MIN_RATIO}:1)`,
      );
    }
  }
}
