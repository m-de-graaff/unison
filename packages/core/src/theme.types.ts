import type { ReactNode } from "react";

/** What the user picked; `system` follows the OS. */
export type ColorScheme = "light" | "dark" | "system";
/** The scheme actually shown. */
export type ResolvedScheme = "light" | "dark";

/** Returned by `useTheme()` on web and native (native adds `tokens`). */
export interface ThemeState {
  scheme: ColorScheme;
  resolvedScheme: ResolvedScheme;
  setScheme: (scheme: ColorScheme) => void;
  theme: string;
  setTheme: (theme: string) => void;
  themes: readonly string[];
}

/** Scopes a theme and/or scheme to a subtree. */
export interface ThemeScopeProps {
  theme?: string;
  scheme?: ResolvedScheme;
  children?: ReactNode;
}
