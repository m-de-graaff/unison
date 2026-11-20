# @unison-ui/core

## 0.1.0

### Minor Changes

- d0e3169: Tokens and the token compiler.
  
  - Token source in DTCG JSON with primitive and semantic tiers. Every validation error is reported at once, aliases are resolved (cycles and type mismatches are errors), and a tier lint keeps components on semantic tokens.
  - Colour palettes are generated in OKLCH, with separate dark ramps. WCAG 2 AA is enforced on every theme × scheme, APCA is reported, and `autoContrast` nudges failing text colours.
  - Typography (Inter, JetBrains Mono, a native face per weight), space, size, radius (with density and radius options), borders, opacity, elevation, z-index and breakpoints.
  - `defineTheme()` / `defineConfig()` and `unison.config.ts`: accent and neutral presets or a `#hex` seed, named themes with `extends`, `overrides`, and suggestions for invalid options. `unison-tokens build --config unison.config.ts --out unison [--watch]`.
  - Outputs: multi-theme `tokens.css` (`data-theme` / `data-unison-theme`, scoped to any element), Tailwind v4 `theme.css` / `theme-strict.css`, a Uniwind `native/theme.css`, a typed native theme, `types.d.ts` (semantic-only `SemanticTokenPath`), `motion.js` and `tokens.json`.
  - `@unison-ui/core`: the shared `ThemeState` / `ThemeScopeProps` types and `concentric()`.
  
  Breaking changes from 0.0.0:
  - The native `themes` export is now `{ [theme]: { light, dark } }`, with flat groups such as `color["gray-500"]` and `motion.duration["fast-enter"]`.
  - `--unison-motion-spring-*-easing` is now `--unison-spring-*`.
  - `assertContrast` and `Token` are removed; use `buildTheme` and `ContrastError`.
  - `cssVarName` also lives in `@unison-ui/tokens/paths`.
