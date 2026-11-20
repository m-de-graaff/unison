import { themes } from "@unison-ui/tokens/native";
import { nativeKey } from "@unison-ui/tokens/paths";
import type { SemanticTokenPath, SemanticTokenValues, UnisonTheme } from "@unison-ui/tokens/types";
import { useColorScheme } from "react-native";

/** The default theme for the current colour scheme ("light" when the scheme is unknown). */
export function useUnisonTheme(): UnisonTheme {
  const scheme = useColorScheme();
  return themes.default[scheme === "dark" ? "dark" : "light"];
}

/** Typed lookup by semantic token path: `token(theme, "color.accent")`. */
export function token<P extends SemanticTokenPath>(
  theme: UnisonTheme,
  path: P,
): SemanticTokenValues[P] {
  return nativeKey(path).reduce<unknown>(
    (node, key) => (node as Record<string, unknown>)[key],
    theme,
  ) as SemanticTokenValues[P];
}
