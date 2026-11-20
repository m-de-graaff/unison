import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Token, TokenSets } from "./build";
import type { SpringConfig } from "./spring";

type Leaf = string | number | SpringConfig;
interface Tree {
  [key: string]: Tree | Leaf;
}

function nativeValue(t: Token): Leaf {
  switch (t.type) {
    case "dimension":
      return Number.parseFloat((t.value as string).replace(/px$/, ""));
    case "duration":
      return Number.parseFloat((t.value as string).replace(/ms$/, ""));
    case "spring": {
      const { stiffness, damping, mass } = t.value as SpringConfig;
      return { stiffness, damping, mass };
    }
    case "color":
      return t.value as string;
  }
}

function toTree(tokens: Token[]): Tree {
  const root: Tree = {};
  for (const t of tokens) {
    // A decimal step such as space.0.5 stays one key ("0.5"); Task 16's nativeKey replaces this.
    const keys = t.path.match(/\d+\.\d+|[^.]+/g) as string[];
    let node = root;
    for (const key of keys.slice(0, -1)) {
      node[key] ??= {};
      node = node[key] as Tree;
    }
    node[keys.at(-1) as string] = nativeValue(t);
  }
  return root;
}

const SPRING_TYPE =
  "{ readonly stiffness: number; readonly damping: number; readonly mass: number }";

function typeOf(node: Tree | Leaf, depth: number, isSpring: boolean): string {
  if (typeof node === "string") return "string";
  if (typeof node === "number") return "number";
  if (isSpring) return SPRING_TYPE;
  const pad = "  ".repeat(depth + 1);
  const lines = Object.entries(node).map(
    ([k, v]) => `${pad}readonly ${JSON.stringify(k)}: ${typeOf(v, depth + 1, false)};`,
  );
  return `{\n${lines.join("\n")}\n${"  ".repeat(depth)}}`;
}

/** Builds the UnisonTheme type from the light tree, so the type cannot drift from the data. */
function themeType(tokens: Token[], tree: Tree): string {
  const springs = new Set(tokens.filter((t) => t.type === "spring").map((t) => t.path));
  const walk = (node: Tree | Leaf, path: string, depth: number): string => {
    if (typeof node !== "object" || springs.has(path)) return typeOf(node, depth, true);
    const pad = "  ".repeat(depth + 1);
    const lines = Object.entries(node).map(([k, v]) => {
      const childPath = path ? `${path}.${k}` : k;
      return `${pad}readonly ${JSON.stringify(k)}: ${walk(v, childPath, depth + 1)};`;
    });
    return `{\n${lines.join("\n")}\n${"  ".repeat(depth)}}`;
  };
  return walk(tree, "", 0);
}

function colorDeclarations(tokens: Token[], indent: string): string[] {
  return tokens
    .filter((t) => t.type === "color")
    .map(
      (t) => `${indent}--color-${t.path.replace(/^color\./, "").replaceAll(".", "-")}: ${t.value};`,
    );
}

const tokenValue = (tokens: Token[], path: string) => tokens.find((t) => t.path === path)?.value;

/**
 * Tailwind theme for Uniwind (native className support). Uniwind can't resolve the
 * `var(--unison-…)` chain from theme.css on native, so this file carries literal values:
 * colours per light/dark variant, plus the static radius and spacing.
 */
function nativeThemeCss(sets: TokenSets): string {
  return [
    "@theme {",
    `  --radius-md: ${tokenValue(sets.light, "radius.md")};`,
    `  --spacing: ${tokenValue(sets.light, "space.1")};`,
    "}",
    "",
    "@layer theme {",
    "  :root {",
    "    @variant light {",
    ...colorDeclarations(sets.light, "      "),
    "    }",
    "",
    "    @variant dark {",
    ...colorDeclarations(sets.dark, "      "),
    "    }",
    "  }",
    "}",
    "",
  ].join("\n");
}

/**
 * Writes dist/native/theme.js, dist/native/theme.d.ts and dist/native/theme.css;
 * returns the written paths.
 */
export function emitNative(outDir: string, sets: TokenSets): string[] {
  mkdirSync(outDir, { recursive: true });
  const text = Object.fromEntries(sets.text.map(({ style, native }) => [style, { ...native }]));
  const light = { ...toTree(sets.light), text };
  const dark = { ...toTree(sets.dark), text };
  const js = `export const themes = ${JSON.stringify({ light, dark }, null, 2)};\n`;
  const dts = [
    `export interface UnisonTheme ${themeType(sets.light, light)}`,
    "",
    "export declare const themes: { readonly light: UnisonTheme; readonly dark: UnisonTheme };",
    "",
  ].join("\n");
  const jsPath = join(outDir, "theme.js");
  const dtsPath = join(outDir, "theme.d.ts");
  const cssPath = join(outDir, "theme.css");
  writeFileSync(jsPath, js);
  writeFileSync(dtsPath, dts);
  writeFileSync(cssPath, nativeThemeCss(sets));
  return [jsPath, dtsPath, cssPath];
}
