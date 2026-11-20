/** Browser-safe: no node:, culori or colorjs.io in here, so apps can import it from `@unison-ui/tokens/paths`. */

/** `"color.accent"` → `"--unison-color-accent"`; a decimal step stays one name (`space.0.5` → `--unison-space-0-5`). */
export const cssVarName = (path: string): string => `--unison-${path.replaceAll(".", "-")}`;
