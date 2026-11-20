import Color from "colorjs.io";
import { wcagContrast } from "culori";

/** WCAG 2 contrast ratio between two colours, from 1 to 21. */
export function wcagRatio(fg: string, bg: string): number {
  return wcagContrast(fg, bg);
}

/** APCA lightness contrast (Lc) of text `fg` on `bg`. Informational; build-time only. */
export function apcaLc(fg: string, bg: string): number {
  return Color.contrastAPCA(bg, fg);
}
