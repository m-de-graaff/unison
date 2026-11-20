import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { cssVarName } from "@unison-ui/tokens";
import { expect, it } from "vitest";
import { cssVar } from "../src/css-var";

// cssVar() duplicates the compiler's naming rule; this keeps the two from drifting apart.
it("matches the variable names the token compiler emits", () => {
  const tokensCss = createRequire(import.meta.url).resolve("@unison-ui/tokens/tokens.css");
  const css = readFileSync(tokensCss, "utf8");
  for (const path of [
    "color.accent",
    "color.surface",
    "color.border",
    "radius.card",
    "size.demo-box",
  ] as const) {
    expect(cssVar(path)).toBe(`var(${cssVarName(path)})`);
    expect(css).toContain(`${cssVarName(path)}:`);
  }
});
