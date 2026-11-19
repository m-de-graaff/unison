import { expectTypeOf, test } from "vitest";
import * as native from "../src/native";
import * as web from "../src/web";

test("useReducedMotion has the same signature on web and native", () => {
  expectTypeOf(web.useReducedMotion).toEqualTypeOf(native.useReducedMotion);
});
