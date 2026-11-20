import { expectTypeOf, test } from "vitest";
import { cssVar } from "../src/css-var";

test("semantic paths compile and return a var() string", () => {
  expectTypeOf(cssVar("color.fg-muted")).toEqualTypeOf<string>();
  expectTypeOf(cssVar("radius.card")).toEqualTypeOf<string>();
});
test("primitive paths are a type error", () => {
  // @ts-expect-error: components may only use semantic tokens
  cssVar("color.gray.500");
  // @ts-expect-error
  cssVar("radius.md");
});
