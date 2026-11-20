import type { SemanticTokenPath } from "@unison-ui/tokens";

/** `cssVar("color.accent")` → `"var(--unison-color-accent)"`. Semantic tokens only. */
export const cssVar = (path: SemanticTokenPath): string =>
  `var(--unison-${path.replaceAll(".", "-")})`;
