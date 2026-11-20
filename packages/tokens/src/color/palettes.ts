import { oklch, parse } from "culori";
import type { SourceToken } from "../schema";
import {
  formatOklch,
  generateScale,
  type Mode,
  rampLightness,
  type Scale,
  STEPS,
} from "./generate-scale";

export interface PaletteSpec {
  name: string;
  hue: number;
  chroma: number;
  /** Seed hex that replaces the closest step in each mode. */
  anchor?: string;
}

export function BUILT_IN_PALETTES(accentHue = 275): PaletteSpec[] {
  return [
    { name: "gray", hue: accentHue, chroma: 0.012 },
    { name: "accent", hue: 275, chroma: 0.2 },
    { name: "success", hue: 150, chroma: 0.17 },
    { name: "warning", hue: 75, chroma: 0.17 },
    { name: "danger", hue: 25, chroma: 0.2 },
    { name: "info", hue: 240, chroma: 0.15 },
  ];
}

/** Replaces the step whose lightness is closest to the seed's with the seed itself. */
function anchorScale(scale: Scale, seed: string, mode: Mode): Scale {
  const parsed = parse(seed);
  if (!parsed) throw new Error(`Cannot parse seed colour "${seed}"`);
  const { l, c, h } = oklch(parsed);
  const ramp = rampLightness(mode);
  let best = 0;
  ramp.forEach((rl, i) => {
    if (Math.abs(rl - l) < Math.abs((ramp[best] as number) - l)) best = i;
  });
  return {
    ...scale,
    [STEPS[best] as (typeof STEPS)[number]]: {
      hex: seed.toLowerCase(),
      oklch: formatOklch(l, c, h ?? 0),
    },
  };
}

export function paletteFromSeed(
  seed: string,
  opts: { anchor?: boolean; name?: string } = {},
): { hue: number; chroma: number; light: Scale; dark: Scale } {
  const parsed = parse(seed);
  if (!parsed) throw new Error(`Cannot parse seed colour "${seed}"`);
  const { c, h } = oklch(parsed);
  const hue = h ?? 0;
  const name = opts.name ?? "seed";
  const build = (mode: Mode): Scale => {
    const scale = generateScale({ name, hue, chroma: c, mode });
    return opts.anchor ? anchorScale(scale, seed, mode) : scale;
  };
  return { hue, chroma: c, light: build("light"), dark: build("dark") };
}

export function colorPrimitives(palettes: PaletteSpec[], mode: Mode): SourceToken[] {
  const token = (path: string, hex: string, ok: string): SourceToken => ({
    path,
    type: "color",
    value: { hex, oklch: ok },
    file: "generated",
    tier: "primitive",
  });
  const out: SourceToken[] = [];
  for (const p of palettes) {
    const generated = generateScale({ ...p, mode });
    const scale = p.anchor ? anchorScale(generated, p.anchor, mode) : generated;
    for (const step of STEPS) {
      out.push(token(`color.${p.name}.${step}`, scale[step].hex, scale[step].oklch));
    }
  }
  out.push(token("color.white", "#ffffff", "oklch(1 0 0)"));
  out.push(token("color.black", "#000000", "oklch(0 0 0)"));
  return out;
}
