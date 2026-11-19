/** `cssVar("color.accent")` → `"var(--unison-color-accent)"`. */
export const cssVar = (path: string): string => `var(--unison-${path.replaceAll(".", "-")})`;
