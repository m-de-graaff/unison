import { themes, type UnisonTheme } from "@unison-ui/tokens/native";
import { useColorScheme } from "react-native";

type Leaf =
  | string
  | number
  | { readonly stiffness: number; readonly damping: number; readonly mass: number };

/** Every dot path to a leaf of T, e.g. "color.accent" | "space.1" | … */
export type TokenPath<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends Leaf ? `${P}${K}` : TokenPath<T[K], `${P}${K}.`>;
}[keyof T & string];

/** The value type at a dot path. */
export type TokenValue<T, Path extends string> = Path extends `${infer H}.${infer R}`
  ? H extends keyof T
    ? TokenValue<T[H], R>
    : never
  : Path extends keyof T
    ? T[Path]
    : never;

/** The theme for the current colour scheme ("light" when the scheme is unknown). */
export function useUnisonTheme(): UnisonTheme {
  const scheme = useColorScheme();
  return themes[scheme === "dark" ? "dark" : "light"];
}

/** Typed lookup by dot path: `token(theme, "color.accent")`. */
export function token<P extends TokenPath<UnisonTheme>>(
  theme: UnisonTheme,
  path: P,
): TokenValue<UnisonTheme, P> {
  return path
    .split(".")
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], theme) as TokenValue<
    UnisonTheme,
    P
  >;
}
