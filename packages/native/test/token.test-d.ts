import { themes } from "@unison-ui/tokens/native";
import { expectTypeOf, test } from "vitest";
import { token } from "../src/theme";

const theme = themes.default.light;
test("semantic paths compile and are typed", () => {
  expectTypeOf(token(theme, "color.fg-muted")).toEqualTypeOf<string>();
  expectTypeOf(token(theme, "radius.card")).toEqualTypeOf<number>();
});
test("primitive paths are a type error", () => {
  // @ts-expect-error: components may only use semantic tokens
  token(theme, "color.gray.500");
  // @ts-expect-error
  token(theme, "radius.md");
});
