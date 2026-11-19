import type * as Native from "@unison-ui/native";
import type * as Web from "@unison-ui/react";
import type { ComponentProps } from "react";
import { expectTypeOf, test } from "vitest";

test("web and native export the same names", () => {
  expectTypeOf<keyof typeof Web>().toEqualTypeOf<keyof typeof Native>();
});

test("web and native components take the same props", () => {
  expectTypeOf<ComponentProps<typeof Web.Box>>().toEqualTypeOf<ComponentProps<typeof Native.Box>>();
  expectTypeOf<ComponentProps<typeof Web.MotionBadge>>().toEqualTypeOf<
    ComponentProps<typeof Native.MotionBadge>
  >();
});
