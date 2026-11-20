import { themes } from "@unison-ui/tokens/native";
import { nativeKey } from "@unison-ui/tokens/paths";
import type { SemanticTokenPath, SemanticTokenValues, UnisonTheme } from "@unison-ui/tokens/types";
import { useContext } from "react";
import { useColorScheme } from "react-native";
import { type NativeThemeState, ThemeContext } from "./provider";

/** The current theme and scheme, the setters and the resolved `tokens`. Throws outside `UnisonProvider`. */
export function useTheme(): NativeThemeState {
  const state = useContext(ThemeContext);
  if (!state) throw new Error("useTheme must be used inside UnisonProvider");
  const { all: _all, ...rest } = state;
  return rest;
}

/**
 * The tokens for the current theme and scheme. Outside a provider it falls back to the built-in
 * default theme and the system scheme ("light" when unknown).
 */
export function useUnisonTheme(): UnisonTheme {
  const state = useContext(ThemeContext);
  const scheme = useColorScheme();
  return state ? state.tokens : themes.default[scheme === "dark" ? "dark" : "light"];
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
