import type { ThemeScopeProps } from "@unison-ui/core";
import { useContext, useMemo } from "react";
import { ThemeContext } from "./provider";

/**
 * Overrides the theme and/or scheme for a subtree: `useTheme()` and `useUnisonTheme()` inside it
 * see the scoped values. Must be inside `UnisonProvider`. Style the subtree from
 * `useTheme().tokens`; a global Tailwind engine can't follow a nested scope.
 */
export function ThemeScope({ theme, scheme, children }: ThemeScopeProps) {
  const parent = useContext(ThemeContext);
  if (!parent) throw new Error("ThemeScope must be used inside UnisonProvider");
  const name = theme ?? parent.theme;
  const resolvedScheme = scheme ?? parent.resolvedScheme;
  const tokens = Object.hasOwn(parent.all, name) ? parent.all[name]?.[resolvedScheme] : undefined;
  if (!tokens) throw new Error(`unknown theme "${name}" (themes: ${parent.themes.join(", ")})`);
  const value = useMemo(
    () => ({ ...parent, theme: name, resolvedScheme, tokens }),
    [parent, name, resolvedScheme, tokens],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
