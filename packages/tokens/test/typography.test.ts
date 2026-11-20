import { expect, it } from "vitest";
import { buildTheme } from "../src/build";
import { DEFAULT_NATIVE_FONTS, TEXT_STYLES, toNativeTextStyle } from "../src/typography";

const t = buildTheme({
  name: "default",
  accent: { name: "accent", hue: 275, chroma: 0.2 },
  neutral: { name: "gray", hue: 275, chroma: 0.012 },
  autoContrast: true,
});

it("defines all ten styles", () => {
  for (const s of TEXT_STYLES) expect(t.light.tokens.get(`text.${s}`)?.type).toBe("typography");
});

it("native title-lg tracking is −0.48 px and has no fontWeight", () => {
  const style = toNativeTextStyle(
    t.light.tokens.get("text.title-lg")?.value as never,
    "sans",
    DEFAULT_NATIVE_FONTS,
  );
  expect(style).toEqual({
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.48,
  });
});

it("code uses the mono face", () => {
  expect(
    toNativeTextStyle(t.light.tokens.get("text.code")?.value as never, "mono", DEFAULT_NATIVE_FONTS)
      .fontFamily,
  ).toBe("JetBrainsMono_400Regular");
});

it("text.max-scale is 1.5", () => {
  expect(t.light.tokens.get("text.max-scale")?.value).toBe(1.5);
});
