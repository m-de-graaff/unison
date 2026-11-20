import { formatHex, oklch, parse, toGamut } from "culori";
import type { Resolved } from "../resolve";
import type { SourceToken } from "../schema";
import { apcaLc, wcagRatio } from "./contrast";
import { CONTRAST_PAIRS, type ContrastPair } from "./contrast-pairs";
import { formatOklch, type Mode } from "./generate-scale";

const STEP = 0.01;
const MAX_STEPS = 100;
const toSrgb = toGamut("rgb", "oklch");

/** Only text-like foregrounds may be nudged; backgrounds never are. */
const ADJUSTABLE = /^color\.(on-|.*-fg$)/;

/**
 * Moves fg's OKLCH lightness away from bg until the pair passes. If it reaches a pole first it
 * flips once to the opposite pole and steps back towards bg (at most 100 steps).
 */
export function autoAdjust(
  fg: string,
  bg: string,
  min: number,
): { hex: string; ratio: number } | undefined {
  const f = oklch(parse(fg));
  const b = oklch(parse(bg));
  if (!f || !b) return undefined;
  let dir = f.l >= b.l ? 1 : -1;
  let l = f.l;
  let flipped = false;
  for (let i = 0; i < MAX_STEPS; i++) {
    const next = l + dir * STEP;
    if (next > 1 || next < 0) {
      if (flipped) return undefined;
      flipped = true;
      l = next > 1 ? 0 : 1; // jump to the other pole…
      dir = l === 0 ? 1 : -1; // …and step back towards bg from there
    } else l = next;
    const hex = formatHex(toSrgb({ ...f, l }));
    const ratio = wcagRatio(hex, bg);
    if (ratio >= min) return { hex, ratio };
  }
  return undefined;
}

export interface ContrastResult extends ContrastPair {
  theme: string;
  scheme: Mode;
  ratio: number;
  /** APCA Lc, rounded to one decimal. Informational. */
  apca: number;
  pass: boolean;
  adjusted?: { from: string; to: string };
}

export class ContrastError extends Error {
  override name = "ContrastError";
  constructor(readonly failures: ContrastResult[]) {
    super(failures.map(describeFailure).join("\n"));
  }
}

const r2 = (n: number) => n.toFixed(2);

const describeFailure = (r: ContrastResult) =>
  `contrast: theme ${r.theme}, scheme ${r.scheme}, ${r.fg} on ${r.bg} is ${r2(r.ratio)}:1 (needs ${r.min}:1)`;

function hexOf(tokens: Resolved, path: string): string {
  const value = tokens.get(path)?.value as { hex?: string } | undefined;
  if (typeof value?.hex !== "string") throw new Error(`Missing colour ${path}`);
  return value.hex;
}

/**
 * Evaluates every pair on the resolved hex values. With `autoContrast`, a failing text
 * foreground is nudged (see `autoAdjust`) so that all of its pairs pass; the nudge is returned
 * as a raw override token for the caller to re-resolve with.
 */
export function checkContrast(
  tokens: Resolved,
  ctx: { theme: string; scheme: Mode; autoContrast: boolean },
): { results: ContrastResult[]; overrides: SourceToken[]; warnings: string[] } {
  const { theme, scheme } = ctx;
  const fgHex = new Map<string, string>();
  const current = (path: string) => fgHex.get(path) ?? hexOf(tokens, path);
  const overrides: SourceToken[] = [];
  const warnings: string[] = [];
  const adjustedFrom = new Map<string, string>();

  if (ctx.autoContrast) {
    const fgs = [...new Set(CONTRAST_PAIRS.map((p) => p.fg))].filter((fg) => ADJUSTABLE.test(fg));
    for (const fg of fgs) {
      const pairs = CONTRAST_PAIRS.filter((p) => p.fg === fg);
      const worst = (hex: string) =>
        pairs
          .map((p) => ({ p, ratio: wcagRatio(hex, hexOf(tokens, p.bg)) }))
          .filter((x) => x.ratio < x.p.min)
          .sort((a, b) => a.ratio - b.ratio)[0];
      const original = hexOf(tokens, fg);
      const first = worst(original);
      if (!first) continue;
      // Adjust against the lowest-ratio background, then re-check the others.
      let hex = original;
      let target = first;
      for (let i = 0; i <= pairs.length && target; i++) {
        const next = autoAdjust(hex, hexOf(tokens, target.p.bg), target.p.min);
        if (!next) break;
        hex = next.hex;
        target = worst(hex) as typeof target;
      }
      if (worst(hex) || hex === original) continue;
      fgHex.set(fg, hex);
      adjustedFrom.set(fg, original);
      const bg = hexOf(tokens, first.p.bg);
      overrides.push({
        path: fg,
        type: "color",
        value: { hex, oklch: oklchString(hex) },
        file: "auto-contrast",
        tier: "semantic",
        raw: true,
      });
      warnings.push(
        `auto-contrast: theme ${theme}, scheme ${scheme}, ${fg} adjusted ${original} → ${hex} on ${first.p.bg} (${r2(first.ratio)}:1 → ${r2(wcagRatio(hex, bg))}:1)`,
      );
    }
  }

  const results = CONTRAST_PAIRS.map((p): ContrastResult => {
    const fg = current(p.fg);
    const bg = hexOf(tokens, p.bg);
    const ratio = wcagRatio(fg, bg);
    const from = adjustedFrom.get(p.fg);
    return {
      ...p,
      theme,
      scheme,
      ratio,
      apca: Math.round(apcaLc(fg, bg) * 10) / 10,
      pass: ratio >= p.min,
      ...(from ? { adjusted: { from, to: fg } } : {}),
    };
  });
  return { results, overrides, warnings };
}

function oklchString(hex: string): string {
  const { l, c, h } = oklch(parse(hex)) as { l: number; c: number; h?: number };
  return formatOklch(l, c, h ?? 0);
}
