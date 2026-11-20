import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Token, TokenSets } from "./build";
import { type SpringConfig, springToCssLinear } from "./spring";

export const cssVarName = (path: string): string => `--unison-${path.replaceAll(".", "-")}`;

function declarations(tokens: Token[], indent: string): string[] {
  return tokens.flatMap((t) => {
    const name = cssVarName(t.path);
    if (t.type === "spring") {
      const { easing, durationMs } = springToCssLinear(t.value as SpringConfig);
      return [`${indent}${name}-easing: ${easing};`, `${indent}${name}-duration: ${durationMs}ms;`];
    }
    return [`${indent}${name}: ${t.value as string};`];
  });
}

const THEME_CSS = `@theme inline {
  --color-accent: var(--unison-color-accent);
  --color-surface: var(--unison-color-surface);
  --color-fg: var(--unison-color-fg);
  --color-border: var(--unison-color-border);
  --radius-md: var(--unison-radius-md);
  --spacing: var(--unison-space-1);
}
`;

/** Writes dist/web/tokens.css and dist/web/theme.css; returns the written paths. */
export function emitWeb(outDir: string, sets: TokenSets): string[] {
  mkdirSync(outDir, { recursive: true });
  const tokensCss = [
    ":root {",
    ...declarations(sets.light, "  "),
    "}",
    "",
    '[data-theme="dark"] {',
    ...declarations(sets.darkOverrides, "  "),
    "}",
    "",
    "@media (prefers-color-scheme: dark) {",
    '  :root:not([data-theme="light"]) {',
    ...declarations(sets.darkOverrides, "    "),
    "  }",
    "}",
    "",
  ].join("\n");
  const tokensPath = join(outDir, "tokens.css");
  const themePath = join(outDir, "theme.css");
  writeFileSync(tokensPath, tokensCss);
  writeFileSync(themePath, THEME_CSS);
  return [tokensPath, themePath];
}
