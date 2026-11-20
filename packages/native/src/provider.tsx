import type { ColorScheme, ResolvedScheme, ThemeState } from "@unison-ui/core";
import type { UnisonTheme } from "@unison-ui/tokens/types";
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Appearance, useColorScheme } from "react-native";

/** AsyncStorage, MMKV or anything with these two methods (sync or async). */
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}

export type NativeThemes = Record<string, { light: UnisonTheme; dark: UnisonTheme }>;
export type NativeThemeState = ThemeState & { tokens: UnisonTheme };

/** @internal Shared with theme.ts and theme-scope.tsx. */
export const ThemeContext = createContext<(NativeThemeState & { all: NativeThemes }) | null>(null);

export interface UnisonProviderProps {
  /** The generated `themes` object (`unison/native/theme.js`). */
  themes: NativeThemes;
  defaultTheme?: string;
  defaultScheme?: ColorScheme;
  /** Persists the choice across launches; without it the choice lasts for the session. */
  storage?: StorageAdapter;
  /** Keys are `<storageKey>-scheme` and `<storageKey>-theme`; default `"unison"`. */
  storageKey?: string;
  /** Tell the app's Tailwind engine (e.g. Uniwind) about changes; the library never imports one. */
  onThemeChange?: (theme: string, scheme: ResolvedScheme) => void;
  children: ReactNode;
}

const SCHEMES: readonly string[] = ["light", "dark", "system"];

/** Theme and colour scheme state for React Native. */
export function UnisonProvider({
  themes,
  defaultTheme = "default",
  defaultScheme = "system",
  storage,
  storageKey = "unison",
  onThemeChange,
  children,
}: UnisonProviderProps) {
  const names = useMemo(() => Object.keys(themes), [themes]);
  const [scheme, setSchemeState] = useState<ColorScheme>(defaultScheme);
  const [theme, setThemeState] = useState(defaultTheme);
  // Once the user picks something, a slower storage read must not overwrite it.
  const touched = useRef({ scheme: false, theme: false });

  useEffect(() => {
    if (!storage) return;
    let live = true;
    void (async () => {
      try {
        const [s, t] = await Promise.all([
          storage.getItem(`${storageKey}-scheme`),
          storage.getItem(`${storageKey}-theme`),
        ]);
        if (!live) return;
        if (s && SCHEMES.includes(s) && !touched.current.scheme) setSchemeState(s as ColorScheme);
        if (t && t in themes && !touched.current.theme) setThemeState(t);
      } catch {
        // A failing storage read keeps the defaults.
      }
    })();
    return () => {
      live = false;
    };
  }, [storage, storageKey, themes]);

  useEffect(() => {
    Appearance.setColorScheme?.(scheme === "system" ? "unspecified" : scheme);
  }, [scheme]);

  const system = useColorScheme();
  const resolvedScheme: ResolvedScheme =
    scheme === "system" ? (system === "dark" ? "dark" : "light") : scheme;
  const active = theme in themes ? theme : defaultTheme;

  useEffect(() => {
    onThemeChange?.(active, resolvedScheme);
  }, [onThemeChange, active, resolvedScheme]);

  const persist = useCallback(
    (key: string, value: string) => {
      try {
        void Promise.resolve(storage?.setItem(`${storageKey}-${key}`, value)).catch(() => {});
      } catch {
        // Storage is best-effort.
      }
    },
    [storage, storageKey],
  );
  const setScheme = useCallback(
    (s: ColorScheme) => {
      touched.current.scheme = true;
      setSchemeState(s);
      persist("scheme", s);
    },
    [persist],
  );
  const setTheme = useCallback(
    (t: string) => {
      if (!(t in themes)) throw new Error(`unknown theme "${t}" (themes: ${names.join(", ")})`);
      touched.current.theme = true;
      setThemeState(t);
      persist("theme", t);
    },
    [themes, names, persist],
  );

  const tokens = (themes[active] ?? Object.values(themes)[0])?.[resolvedScheme];
  if (!tokens) throw new Error("UnisonProvider needs at least one theme");
  const value = useMemo(
    () => ({
      scheme,
      resolvedScheme,
      setScheme,
      theme: active,
      setTheme,
      themes: names,
      tokens,
      all: themes,
    }),
    [scheme, resolvedScheme, setScheme, active, setTheme, names, tokens, themes],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
