"use client";
import type { ThemeScopeProps } from "@unison-ui/core";
import { useContext, useMemo } from "react";
import { KnownContext, ThemeContext } from "./theme-provider";

/**
 * Scopes a theme and/or scheme to its subtree without adding a box (`display: contents`). A
 * missing prop inherits the nearest scope's or the provider's value, and the scope writes both
 * attributes, so it shows exactly its theme and scheme whatever its ancestors are. `useTheme()`
 * inside it returns the scoped `theme` and `resolvedScheme`.
 */
export function ThemeScope({ theme, scheme, children }: ThemeScopeProps) {
  const parent = useContext(ThemeContext);
  const known = useContext(KnownContext);
  const name = theme ?? parent?.theme;
  const resolvedScheme = scheme ?? parent?.resolvedScheme;
  // An inherited value is only written once it's the page's real one (not a server default).
  const scoped = useMemo(
    () => ({
      theme: theme !== undefined || (known.theme && parent !== null),
      scheme: scheme !== undefined || (known.scheme && parent !== null),
    }),
    [theme, scheme, known, parent],
  );
  const value = useMemo(
    () => (parent && name && resolvedScheme ? { ...parent, theme: name, resolvedScheme } : parent),
    [parent, name, resolvedScheme],
  );
  return (
    <div
      style={{ display: "contents" }}
      data-unison-theme={scoped.theme ? name : undefined}
      data-theme={scoped.scheme ? resolvedScheme : undefined}
    >
      <ThemeContext.Provider value={value}>
        <KnownContext.Provider value={scoped}>{children}</KnownContext.Provider>
      </ThemeContext.Provider>
    </div>
  );
}
