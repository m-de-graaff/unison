"use client";
import type { ColorScheme, ResolvedScheme, ThemeState } from "@unison-ui/core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

const ThemeContext = createContext<ThemeState | null>(null);
const CHANGE = "unison:theme-change";
const DARK = "(prefers-color-scheme: dark)";
const SCHEMES: readonly string[] = ["light", "dark", "system"];

export interface ThemeProviderProps {
  /** Every theme name the app's config defines. */
  themes: readonly string[];
  defaultTheme?: string;
  defaultScheme?: ColorScheme;
  /** Same as ThemeScript's; default `"unison"`. */
  storageKey?: string;
  children: ReactNode;
}

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the choice still applies to this page.
  }
};
const systemScheme = (): ResolvedScheme =>
  typeof window.matchMedia === "function" && window.matchMedia(DARK).matches ? "dark" : "light";

/**
 * Theme and scheme state for the web. `<html>`'s attributes (set before paint by ThemeScript)
 * are the source of truth, so the server render and hydration never disagree.
 */
export function ThemeProvider({
  themes,
  defaultTheme = "default",
  defaultScheme = "system",
  storageKey = "unison",
  children,
}: ThemeProviderProps) {
  const schemeKey = `${storageKey}-scheme`;
  const themeKey = `${storageKey}-theme`;

  const storedScheme = useCallback((): ColorScheme => {
    const v = read(schemeKey);
    return v && SCHEMES.includes(v) ? (v as ColorScheme) : defaultScheme;
  }, [schemeKey, defaultScheme]);
  const storedTheme = useCallback((): string => {
    const v = read(themeKey);
    return v && themes.includes(v) ? v : defaultTheme;
  }, [themeKey, themes, defaultTheme]);

  /** Writes the attributes from storage and the OS setting, then tells subscribers. */
  const apply = useCallback(() => {
    const scheme = storedScheme();
    const html = document.documentElement;
    html.setAttribute("data-theme", scheme === "system" ? systemScheme() : scheme);
    html.setAttribute("data-unison-theme", storedTheme());
    window.dispatchEvent(new Event(CHANGE));
  }, [storedScheme, storedTheme]);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const onStorage = (e: StorageEvent) => {
        if (e.key === null || e.key === schemeKey || e.key === themeKey) apply(); // other tabs
      };
      const media = typeof window.matchMedia === "function" ? window.matchMedia(DARK) : undefined;
      const onMedia = () => {
        if (storedScheme() === "system") apply();
      };
      window.addEventListener(CHANGE, onChange);
      window.addEventListener("storage", onStorage);
      media?.addEventListener("change", onMedia);
      return () => {
        window.removeEventListener(CHANGE, onChange);
        window.removeEventListener("storage", onStorage);
        media?.removeEventListener("change", onMedia);
      };
    },
    [apply, schemeKey, themeKey, storedScheme],
  );

  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      const html = document.documentElement;
      return `${storedScheme()}|${html.getAttribute("data-unison-theme") ?? defaultTheme}|${html.getAttribute("data-theme") ?? "light"}`;
    },
    () => `${defaultScheme}|${defaultTheme}|${defaultScheme === "dark" ? "dark" : "light"}`,
  );

  // Fix up a stored theme the config no longer has, or a page without ThemeScript.
  useEffect(() => {
    const html = document.documentElement;
    if (
      html.getAttribute("data-unison-theme") !== storedTheme() ||
      !html.hasAttribute("data-theme")
    ) {
      apply();
    }
  }, [apply, storedTheme]);

  const setScheme = useCallback(
    (s: ColorScheme) => {
      write(schemeKey, s);
      apply();
    },
    [schemeKey, apply],
  );
  const setTheme = useCallback(
    (t: string) => {
      if (!themes.includes(t))
        throw new Error(`unknown theme "${t}" (themes: ${themes.join(", ")})`);
      write(themeKey, t);
      apply();
    },
    [themeKey, themes, apply],
  );

  const value = useMemo<ThemeState>(() => {
    const [scheme, theme, resolved] = snapshot.split("|") as [ColorScheme, string, ResolvedScheme];
    return { scheme, resolvedScheme: resolved, setScheme, theme, setTheme, themes };
  }, [snapshot, setScheme, setTheme, themes]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The current theme and scheme, and setters. Throws outside `ThemeProvider`. */
export function useTheme(): ThemeState {
  const state = useContext(ThemeContext);
  if (!state) throw new Error("useTheme must be used inside ThemeProvider");
  return state;
}
