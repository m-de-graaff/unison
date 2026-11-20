import { formatHex, toGamut } from "culori";

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type Step = (typeof STEPS)[number];
export type Mode = "light" | "dark";
export type Scale = Record<Step, { oklch: string; hex: string }>;

const LIGHT_L = [0.985, 0.967, 0.928, 0.872, 0.775, 0.66, 0.54, 0.48, 0.4, 0.33, 0.25];
const DARK_L = [0.17, 0.21, 0.26, 0.32, 0.4, 0.54, 0.6, 0.7, 0.8, 0.9, 0.96]; // OQ-1a: 500 is 0.54
const CHROMA = [0.12, 0.25, 0.45, 0.7, 0.9, 1, 0.95, 0.85, 0.7, 0.55, 0.45];
const DARK_CHROMA = 0.9;
const toSrgb = toGamut("rgb", "oklch");

/** Trims trailing zeros: `0.5000` becomes `0.5`. */
const fmt = (n: number, d: number) => String(Number(n.toFixed(d)));

export const formatOklch = (l: number, c: number, h: number) =>
  `oklch(${fmt(l, 3)} ${fmt(c, 4)} ${fmt(h, 2)})`;

/** The lightness of each step's ramp in a mode. */
export const rampLightness = (mode: Mode): readonly number[] =>
  mode === "light" ? LIGHT_L : DARK_L;

export function generateScale({
  hue,
  chroma,
  mode,
}: {
  name: string;
  hue: number;
  chroma: number;
  mode: Mode;
}): Scale {
  const ls = rampLightness(mode);
  const k = mode === "dark" ? DARK_CHROMA : 1;
  const out = {} as Scale;
  STEPS.forEach((step, i) => {
    const color = {
      mode: "oklch" as const,
      l: ls[i] as number,
      c: chroma * (CHROMA[i] as number) * k,
      h: hue,
    };
    out[step] = {
      oklch: formatOklch(color.l, color.c, color.h), // unmapped
      hex: formatHex(toSrgb(color)), // mapped into sRGB
    };
  });
  return out;
}
