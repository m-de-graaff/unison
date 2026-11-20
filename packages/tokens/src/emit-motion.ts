import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { TokenSets } from "./build";

/**
 * The preset types, written out so the declaration file stands alone (the build reads
 * dist/native/theme.d.ts, which imports it, while it rebuilds dist/index.d.ts). A test checks
 * these stay assignable both ways to the types in src/motion/presets.ts.
 */
export const MOTION_TYPES = [
  'export type MotionFeel = "snappy" | "smooth" | "reduced";',
  "export type CubicBezier = [number, number, number, number];",
  "export type MotionValues = {",
  "  opacity?: number;",
  "  scale?: number;",
  // biome-ignore lint/suspicious/noTemplateCurlyInString: TypeScript source text, not a template
  "  translateY?: number | `${number}%`;",
  "};",
  "export type ResolvedTransition =",
  '  | { type: "spring"; config: { stiffness: number; damping: number; mass: number } }',
  '  | { type: "timing"; duration: number; easing: CubicBezier };',
  "export interface PresetPhase {",
  "  from: MotionValues;",
  "  to: MotionValues;",
  "  transition: ResolvedTransition;",
  "}",
  "export interface MotionPresetValue {",
  "  enter: PresetPhase;",
  "  exit: PresetPhase;",
  "  reduced: { enter: PresetPhase; exit: PresetPhase } | null;",
  "}",
  'export type MotionPresetName = "fade" | "scale-in" | "slide-up" | "sheet" | "pop" | "press";',
];

/**
 * Writes dist/motion.js and dist/motion.d.ts, the preset data apps and `@unison-ui/motion` import
 * through "@unison-ui/tokens/motion". Plain JSON only, so it is safe in browsers and Metro.
 */
export function emitMotion(outDir: string, sets: TokenSets): string[] {
  mkdirSync(outDir, { recursive: true });
  const js = `export const motionPresets = ${JSON.stringify({ [sets.themeName]: sets.motionPresets }, null, 2)};\n`;
  const dts = [
    ...MOTION_TYPES,
    "",
    "/** Expanded presets, keyed by theme name. */",
    "export declare const motionPresets: {",
    `  readonly ${JSON.stringify(sets.themeName)}: Readonly<Record<MotionPresetName, MotionPresetValue>>;`,
    "};",
    "",
  ].join("\n");
  const jsPath = join(outDir, "motion.js");
  const dtsPath = join(outDir, "motion.d.ts");
  writeFileSync(jsPath, js);
  writeFileSync(dtsPath, dts);
  return [jsPath, dtsPath];
}
