import type { Typography } from "./schema";

export const TEXT_STYLES = [
  "caption",
  "label",
  "body-sm",
  "body",
  "body-lg",
  "title-sm",
  "title",
  "title-lg",
  "display",
  "code",
] as const;
export type TextStyle = (typeof TEXT_STYLES)[number];

export type FontWeightKey = 400 | 500 | 600 | 700;
/** Android picks a weight by font file, so each weight names its own face. */
export type NativeFonts = Record<"sans" | "mono", Partial<Record<FontWeightKey, string>>>;

export const DEFAULT_NATIVE_FONTS: NativeFonts = {
  sans: {
    400: "Inter_400Regular",
    500: "Inter_500Medium",
    600: "Inter_600SemiBold",
    700: "Inter_700Bold",
  },
  mono: { 400: "JetBrainsMono_400Regular" },
};

/** No `fontWeight`: a custom face plus `fontWeight` renders wrong on some Android versions. */
export interface NativeTextStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

const ROOT_PX = 16;
const px = (d: { value: number; unit: string }) => (d.unit === "rem" ? d.value * ROOT_PX : d.value);
const round2 = (n: number) => Math.round(n * 100) / 100 + 0; // + 0 turns -0 into 0

export function toNativeTextStyle(
  t: Typography,
  family: "sans" | "mono",
  fonts: NativeFonts,
): NativeTextStyle {
  const face = fonts[family][t.fontWeight as FontWeightKey];
  if (!face) throw new Error(`no native font for ${family} ${t.fontWeight}`);
  const fontSize = px(t.fontSize);
  const ls = t.letterSpacing;
  return {
    fontFamily: face,
    fontSize,
    lineHeight: px(t.lineHeight),
    letterSpacing: round2(ls.unit === "em" ? ls.value * fontSize : ls.value),
  };
}
