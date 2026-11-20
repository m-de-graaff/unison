# @unison-ui/ui

## 0.1.0

### Minor Changes

- d0e3169: Runtime theming with the same API on web and native.
  
  - Web: `ThemeScript` / `themeScript()` sets the theme before first paint, so there's no flash. `ThemeProvider` and `useTheme()` cover light, dark and system, plus named themes, with storage and cross-tab sync.
  - Native: `UnisonProvider` with an optional storage adapter (AsyncStorage, MMKV, …), `Appearance` integration and `onThemeChange` for the app's Tailwind engine.
  - `ThemeScope` scopes a theme and/or scheme to a subtree on both platforms. Inside it, `useTheme()` returns the scoped values; on native it also returns the scoped `tokens`.
  - `token()` (native) and `cssVar()` (web) accept semantic token paths only.
  - `@unison-ui/ui` resolves platform-specific types through its `react-native` export condition.

### Patch Changes

- Updated dependencies [d0e3169]
  - @unison-ui/react@0.1.0
  - @unison-ui/native@0.1.0
