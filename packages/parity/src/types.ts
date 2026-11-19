export const PLATFORMS = ["web-chromium", "web-webkit", "ios", "android"] as const;
export type Platform = (typeof PLATFORMS)[number];

/** The platforms whose layout metrics are compared with each other (±1 px). */
export const CROSS_PLATFORMS: readonly Platform[] = ["web-chromium", "ios", "android"];

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Metrics {
  platform: Platform;
  /** "<component>/<case>/<scheme>", e.g. "box/accent/dark" */
  run: string;
  pixelRatio: number;
  /** The stage in window coordinates. */
  stage: Rect;
  /** Named parts, relative to the stage. */
  parts: { subject: Rect };
}

/** Relative to packages/parity. */
export const OUT = "parity-output";
export const metricsPath = (p: Platform, run: string) => `${OUT}/metrics/${p}/${run}.json`;
export const screenshotPath = (p: Platform, run: string) => `${OUT}/screenshots/${p}/${run}.png`;
export const baselinePath = (p: Platform, run: string) => `baselines/${p}/${run}.png`;
