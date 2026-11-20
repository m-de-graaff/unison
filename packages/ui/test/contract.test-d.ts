import type * as Native from "@unison-ui/native";
import type * as Web from "@unison-ui/react";
import type { ComponentProps } from "react";
import { expectTypeOf, test } from "vitest";

// Platform-only exports (OQ-18): the web needs a before-paint script and a DOM provider; native
// needs a provider that owns storage and the Tailwind engine hand-off.
type WebOnly = "ThemeScript" | "themeScript" | "ThemeProvider";
type NativeOnly = "UnisonProvider";

test("web and native export the same names, apart from the platform-only ones", () => {
  expectTypeOf<Exclude<keyof typeof Web, WebOnly>>().toEqualTypeOf<
    Exclude<keyof typeof Native, NativeOnly>
  >();
});

test("web and native components take the same props", () => {
  expectTypeOf<ComponentProps<typeof Web.Box>>().toEqualTypeOf<ComponentProps<typeof Native.Box>>();
  expectTypeOf<ComponentProps<typeof Web.MotionBadge>>().toEqualTypeOf<
    ComponentProps<typeof Native.MotionBadge>
  >();
  expectTypeOf<ComponentProps<typeof Web.ThemeScope>>().toEqualTypeOf<
    ComponentProps<typeof Native.ThemeScope>
  >();
});

test("useTheme returns the same state; native only adds tokens", () => {
  type WebState = ReturnType<typeof Web.useTheme>;
  type NativeState = ReturnType<typeof Native.useTheme>;
  expectTypeOf<Omit<NativeState, "tokens">>().toEqualTypeOf<WebState>();
  expectTypeOf<Exclude<keyof NativeState, keyof WebState>>().toEqualTypeOf<"tokens">();
});
