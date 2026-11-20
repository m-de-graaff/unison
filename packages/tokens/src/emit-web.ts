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
      return [`${indent}${name}: ${easing};`, `${indent}${name}-duration: ${durationMs}ms;`];
    }
    if (t.type === "cubicBezier") {
      return [`${indent}${name}: cubic-bezier(${(t.value as number[]).join(", ")});`];
    }
    // Interim: only durations print aliases as var(); Task 14 makes that general.
    if (t.type === "duration" && t.aliasOf) {
      return [`${indent}${name}: var(${cssVarName(t.aliasOf)});`];
    }
    return [`${indent}${name}: ${t.value as string};`];
  });
}

/** Browsers without linear() get a plain cubic-bezier instead (the duration variable still applies). */
function springFallback(tokens: Token[]): string[] {
  const springs = tokens.filter((t) => t.type === "spring");
  if (springs.length === 0) return [];
  return [
    "@supports not (transition-timing-function: linear(0, 1)) {",
    "  :root {",
    ...springs.map((t) => `    ${cssVarName(t.path)}: cubic-bezier(0.2, 0, 0, 1);`),
    "  }",
    "}",
    "",
  ];
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
    ...sets.fontFamilies.map(
      ({ name, value }) => `  ${cssVarName(`font-family.${name}`)}: ${value};`,
    ),
    ...sets.text.flatMap(({ style, web }) =>
      Object.entries(web).map(([k, v]) => `  ${cssVarName(`text.${style}`)}-${k}: ${v};`),
    ),
    "}",
    "",
    ...springFallback(sets.light),
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
