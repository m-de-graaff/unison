# Phase 1 — development todo: tokens & motion compiler

Follow the steps in order, exactly like phase 0: each step has what to do, a **Done when** check and a commit message. At the end, one config file defines a complete, accessible visual language — colour, type, space, radius, elevation and motion — that compiles to CSS variables, Tailwind v4, a typed native theme and Reanimated configs, and switches theme at runtime on every platform. Still no components: phase 2 starts the styling and interaction engine, and components come after engine v1.0.

## 0. Before you start

### Prerequisites

- [x] Phase 0 is complete: the `phase-0-complete` tag exists, and `pnpm check` and `pnpm test:parity` pass on `main`.
- [ ] Same working rules as phase 0: a branch per section (`phase1/colour`, …), one commit per step, dependencies at `@latest`, never move on with a failing **Done when**.
- [ ] Install the build-time colour library in the tokens package: `pnpm --filter @unison-ui/tokens add culori` and `add -D @types/culori`. It runs only inside the compiler and never ships to users.

### What exists at the end

- `unison.config.ts` in each app: one `defineTheme()` call picks accent, neutral, radius, density, motion feel and font.
- `unison-tokens build` turns it into:
  - `tokens.css`: CSS variables for every theme and scheme
  - `theme.css`: Tailwind v4 `@theme` for every token category
  - a typed native theme
  - Reanimated-ready motion configs
  - `tokens.json` for docs and tooling
- Runtime switching: light, dark or system, plus named themes, on web without a flash and on native without a reload. On web, themes can also be scoped to a subtree.
- Token showcase screens on all three apps, covered by parity tests.

### Token tiers

| Tier | Example | Who uses it |
| --- | --- | --- |
| Primitive | `color.gray.500`, `space.4`, `duration.200` | Only semantic tokens; never components directly |
| Semantic | `color.surface`, `color.fg-muted`, `radius.control`, `motion.enter` | Components, apps, Tailwind classes |
| Component (reserved) | `button.height.md` | Tier turned on in phase 3; tokens are added with the components, only when a semantic token isn't enough |

Rule: a component may only reference semantic tokens. Step 3's linter enforces it.

### Decisions this phase assumes

Each becomes an ADR in step 23.

| Decision | Default |
| --- | --- |
| Colour model | Scales generated in OKLCH; web output `oklch()` with a hex fallback, native output hex |
| Scale shape | 11 steps, `50`–`950`, matching Tailwind's naming so classes feel familiar |
| Built-in palettes | `gray` (neutral), `accent` (default hue 275), `success` (150), `warning` (75), `danger` (25), `info` (240) |
| Dark mode | A separately generated dark scale per palette, not an inversion of the light one |
| Contrast standard | WCAG 2 AA enforced (4.5:1 text, 3:1 UI and large text); APCA reported for information only |
| Default font | Inter: the variable font on web, static weights on native (Android needs one file per weight) |
| Shadows on native | React Native's `boxShadow` style prop (New Architecture), so one CSS shadow string works on both platforms. Verified in step 10, with a fallback. |
| Theme config | `unison.config.ts` at each app's root; the tokens package ships the defaults |
| Semantic colour names | Flat and Tailwind-friendly: `bg-surface`, `text-fg-muted`, `border-border`, `bg-accent-hover` (full list in step 5) |

## 1. Schema, aliases and tiers

### Step 1 — Token source layout and schema

- [ ] Replace phase 0's `tokens/base.json` and `tokens/dark.json` with this layout in `packages/tokens/tokens/`:

```
tokens/
├─ primitive/
│  ├─ space.json        space.0 … space.96
│  ├─ size.json         size.control-sm … size.icon-*
│  ├─ radius.json       radius.none … radius.full
│  ├─ border.json       border-width.0 / 1 / 2
│  ├─ font.json         font-family.*, font-weight.*, font-size.*, line-height.*, letter-spacing.*
│  ├─ shadow.json       shadow.xs … shadow.xl (light + dark variants)
│  ├─ motion.json       duration.*, easing.*, spring.*
│  └─ layer.json        z-index.* , breakpoint.*
└─ semantic/
   ├─ color.light.json  aliases into generated colour scales
   ├─ color.dark.json
   ├─ text.json         typography composites (body, title, …)
   ├─ shape.json        radius.control, radius.card, radius.overlay
   ├─ elevation.json    elevation.raised, elevation.overlay, elevation.popover
   └─ motion.json       motion.enter, motion.exit, motion.emphasis, presets
```

Colour primitives (`color.gray.50` …) are **generated** in step 4, not hand-written. The tier is decided by folder.

- [ ] `src/schema.ts`: the `TokenType` union and value types:
  - `color`, `dimension`, `duration`, `number`, `fontFamily`, `fontWeight`, `cubicBezier`
  - Composites: `typography` (`fontFamily`, `fontWeight`, `fontSize`, `lineHeight`, `letterSpacing`), `shadow` (array of `{ x, y, blur, spread, color, inset? }`), `transition` (`{ duration, easing }` or `{ spring }`)
  - Our own types: `spring` (`{ stiffness, damping, mass }`) and `motionPreset` (step 13)
- [ ] Dimensions accept both `"8px"` and the DTCG object form `{ "value": 8, "unit": "px" }`, and are normalised to the object form internally. Only `px` and `rem` are allowed; `rem` converts at 16px for native.
- [ ] `src/validate.ts`: validates every file against the schema. Errors carry file, token path and expected type. It collects all errors before failing, not only the first.

**Done when:** a token with `$type: "dimension"` and `$value: "8em"` fails with `tokens/primitive/space.json › space.2: unit "em" not allowed (px, rem)`, and a file with three errors reports all three. Commit: `feat(tokens): source layout and schema validation`.

### Step 2 — Aliases and the resolver

- [ ] Support DTCG aliases: `"$value": "{color.gray.900}"`, also inside composites (`"fontFamily": "{font-family.sans}"`).
- [ ] `src/resolve.ts`: resolves aliases depth-first with memoisation and returns a flat `Map<path, ResolvedToken>`. Each resolved token keeps `aliasOf` (the direct reference), so CSS output can emit `var(--unison-color-gray-900)` instead of copying values.
- [ ] Errors:
  - Unknown reference: names the token and the missing path
  - Cycle: prints the full chain (`a → b → c → a`)
  - Type mismatch: a `color` aliasing a `dimension`
- [ ] Theme layering: `resolve(base, ...overrides)`, where later layers win per path. Dark is a layer, and so is every `defineTheme()` output (step 17).

**Done when:** unit tests cover a three-step alias chain, an alias inside a composite, a cycle, an unknown reference and a type mismatch, each with the exact error text. Commit: `feat(tokens): alias resolver with layering`.

### Step 3 — Tier rules

- [ ] `src/lint-tiers.ts`, run as part of every build:
  - Every semantic token must be an alias to a primitive (no raw values). The exception is a token marked `"$extensions": { "dev.unison": { "raw": true } }`, which is used sparingly, for example for the overlay scrim's alpha.
  - Primitives may not alias semantic tokens.
  - Every semantic colour must exist in **both** `color.light.json` and `color.dark.json`.
- [ ] The "components use semantic tokens only" rule is enforced through types in step 16, not here.

**Done when:** a semantic token with a raw hex fails the build with its path, and deleting `color.fg-muted` from the dark file fails with "missing in dark". Commit: `feat(tokens): tier lint`.

## 2. Colour

### Step 4 — OKLCH scale generator

- [ ] `src/color/generate-scale.ts`: `generateScale({ name, hue, chroma, mode })` returns 11 steps (`50`–`950`), each `{ oklch: "oklch(L C H)", hex }`.
- [ ] Lightness targets (OKLCH L). In **dark** mode the ramp runs the other way, so step `50` is always "closest to the background" and `950` "closest to the text" in both schemes. That keeps semantic aliases nearly identical between light and dark.

| Step | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Light L | 0.985 | 0.967 | 0.928 | 0.872 | 0.775 | 0.660 | 0.540 | 0.480 | 0.400 | 0.330 | 0.250 |
| Dark L | 0.170 | 0.210 | 0.260 | 0.320 | 0.400 | 0.520 | 0.600 | 0.700 | 0.800 | 0.900 | 0.960 |
| Chroma × peak | 0.12 | 0.25 | 0.45 | 0.70 | 0.90 | 1.00 | 0.95 | 0.85 | 0.70 | 0.55 | 0.45 |

- [ ] In dark mode, multiply chroma by 0.9; saturated colours look louder on dark backgrounds.
- [ ] Gamut mapping: convert each colour to sRGB with culori's `toGamut("rgb", "oklch")`, which reduces chroma and keeps lightness and hue. Output `hex` from the mapped colour and `oklch` from the unmapped one (browsers with wide-gamut screens get the richer colour).
- [ ] Built-in palettes (`src/color/palettes.ts`):

| Palette | Hue | Peak chroma |
| --- | --- | --- |
| `gray` | the accent's hue (a slightly tinted neutral) | 0.012 |
| `accent` | 275 | 0.20 |
| `success` | 150 | 0.17 |
| `warning` | 75 | 0.17 |
| `danger` | 25 | 0.20 |
| `info` | 240 | 0.15 |

- [ ] Plus two fixed primitives: `color.white` (`#ffffff`) and `color.black` (`#000000`).
- [ ] Custom seeds: `paletteFromSeed("#e11d48")` converts to OKLCH and uses its hue and chroma. With `anchor: true`, the step whose lightness is closest to the seed gets the seed's exact colour, so a brand colour appears unchanged.
- [ ] The generator is a pure function: the same input always gives byte-identical output.

**Done when:** tests prove that lightness rises monotonically (dark) or falls monotonically (light) across steps for every palette, every `hex` is inside sRGB, a snapshot of all 12 scales (6 palettes × 2 modes) is committed, and `paletteFromSeed("#e11d48", { anchor: true })` contains `#e11d48` exactly. Commit: `feat(tokens): oklch scale generator`.

### Step 5 — Semantic colours

- [ ] Write `semantic/color.light.json` and `semantic/color.dark.json`, aliases only:

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `canvas` | gray.50 | gray.50 | App background |
| `surface` | white | gray.100 | Cards, inputs, sheets |
| `surface-raised` | white | gray.200 | Popovers, menus, dialogs |
| `subtle` | gray.100 | gray.200 | Hover backgrounds, zebra rows |
| `muted` | gray.200 | gray.300 | Pressed backgrounds, disabled fills |
| `fg` | gray.950 | gray.950 | Primary text |
| `fg-muted` | gray.700 | gray.700 | Secondary text |
| `fg-subtle` | gray.500 | gray.600 | Placeholder, hints |
| `border` | gray.200 | gray.300 | Decorative borders, dividers (not contrast-checked) |
| `border-strong` | gray.500 | gray.500 | Input and control borders (meets 3:1) |
| `ring` | accent.500 | accent.600 | Focus ring |
| `accent` | accent.600 | accent.500 | Primary actions |
| `accent-hover` | accent.700 | accent.400 | Hover |
| `accent-active` | accent.800 | accent.300 | Pressed |
| `accent-subtle` | accent.100 | accent.200 | Selected rows, soft buttons |
| `accent-fg` | accent.700 | accent.900 | Accent text on `accent-subtle` |
| `on-accent` | white | white | Text on `accent` |
| `<status>` | status.600 (warning: warning.400) | status.500 (warning: warning.700) | Solid status fill (success, warning, danger, info) |
| `<status>-subtle` | status.100 | status.200 | Status background |
| `<status>-fg` | status.700 | status.900 | Status text on subtle |
| `<status>-border` | status.300 | status.400 | Status border |
| `on-<status>` | white (warning: black) | white (warning: black) | Text on solid status |
| `overlay` | black at 50% (raw) | black at 60% (raw) | Scrim behind dialogs and sheets |

In dark mode, solid fills sit one or two steps *below* their light counterparts. That's what keeps white text above 4.5:1 on them while the fill still reads as UI against `surface` (3:1). If step 6 flags a default pair, fix the alias in this table, never the pair list.

**Done when:** the tier lint (step 3) passes and both files define exactly the same set of paths. Commit: `feat(tokens): semantic colours`.

### Step 6 — Contrast enforcement

- [ ] `src/color/contrast-pairs.ts`, the pairs that must pass, checked for **every theme × scheme**:

| Foreground | On | Minimum |
| --- | --- | --- |
| `fg`, `fg-muted` | `canvas`, `surface`, `surface-raised`, `subtle` | 4.5 |
| `fg-subtle` | `surface` | 3.0 (placeholders and hints only) |
| `on-accent` | `accent`, `accent-hover`, `accent-active` | 4.5 |
| `accent-fg` | `accent-subtle` | 4.5 |
| `<status>-fg` | `<status>-subtle` | 4.5 |
| `on-<status>` | `<status>` | 4.5 |
| `border-strong`, `ring`, `accent` | `surface` | 3.0 (UI components) |

- [ ] On failure the build stops and prints theme, scheme, pair, actual ratio and required ratio.
- [ ] `autoContrast` (on by default, configurable in `defineTheme`): for `on-*` and `*-fg` tokens only, nudge the foreground's OKLCH lightness in 0.01 steps (away from the background) until the pair passes, and print a warning naming the adjustment. This rescues custom seeds like a yellow accent; it never touches backgrounds.
- [ ] Write every pair's WCAG ratio and APCA Lc value into `tokens.json` (step 14) for the docs site.

**Done when:** the default theme passes with no auto-adjustments; `defineTheme({ accent: "#facc15" })` (yellow) passes with a printed auto-contrast warning for `on-accent`; with `autoContrast: false` the same theme fails with the exact pair. Commit: `feat(tokens): contrast enforcement`.

## 3. Typography

### Step 7 — Type tokens

Line heights are absolute pixels, not ratios, because React Native's `lineHeight` only accepts absolute values. Letter spacing is authored in `em` and converted to `px` for native.

- [ ] `primitive/font.json`:
  - `font-family.sans`: `"Inter Variable", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
  - `font-family.mono`: `"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`
  - `font-weight`: `regular` 400, `medium` 500, `semibold` 600, `bold` 700
- [ ] `semantic/text.json`, typography composites:

| Style | Size / line height (px) | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `caption` | 12 / 16 | regular | 0 | Helper text, timestamps |
| `label` | 13 / 18 | medium | 0 | Form labels, small buttons |
| `body-sm` | 14 / 20 | regular | 0 | Dense UI, table cells |
| `body` | 16 / 24 | regular | −0.011em | Default text |
| `body-lg` | 18 / 28 | regular | −0.011em | Lead paragraphs |
| `title-sm` | 16 / 24 | semibold | −0.011em | Card titles |
| `title` | 20 / 28 | semibold | −0.011em | Section titles |
| `title-lg` | 24 / 32 | semibold | −0.02em | Page titles |
| `display` | 36 / 40 | bold | −0.02em | Hero text |
| `code` | 13 / 20 (mono) | regular | 0 | Inline and block code |

- [ ] `text.max-scale`: `1.5`, the largest Dynamic Type / font-scale multiplier components will allow on native (passed as `maxFontSizeMultiplier` once components exist).
- [ ] Native font-face map in the theme config (step 17), because Android selects weights by font file, not by `fontWeight`:

```ts
nativeFonts: {
  sans: { 400: "Inter_400Regular", 500: "Inter_500Medium", 600: "Inter_600SemiBold", 700: "Inter_700Bold" },
  mono: { 400: "JetBrainsMono_400Regular" },
}
```

The native emitter resolves each text style to `{ fontFamily: <face for its weight>, fontSize, lineHeight, letterSpacing }` and **omits** `fontWeight`, because combining a custom face with `fontWeight` renders wrong on some Android versions.

**Done when:** the build emits all ten styles for both platforms, and `letterSpacing` for native `title-lg` is −0.48 (24 × −0.02). Commit: `feat(tokens): typography tokens`.

### Step 8 — Loading fonts in the apps

The library never bundles fonts; apps load them. That keeps the package small and licensing with the app.

- [ ] Web (both apps): `pnpm add @fontsource-variable/inter @fontsource-variable/jetbrains-mono` and import both once at the app root (Next.js: `layout.tsx`; Vite: `main.tsx`). The family names match `font-family.*` exactly, so no extra CSS is needed.
- [ ] Native: `npx expo install expo-font expo-splash-screen @expo-google-fonts/inter @expo-google-fonts/jetbrains-mono`. In `app/_layout.tsx`, call `SplashScreen.preventAutoHideAsync()` at module level, load the five faces with `useFonts({ Inter_400Regular, … })`, and hide the splash screen once they're loaded. The keys passed to `useFonts` are the family names, matching `nativeFonts`.
- [ ] Write both setups into `docs/fonts.md`, including how to swap Inter for a brand font: change `font-family.sans` and `nativeFonts`, and load the new files.

**Done when:** all four surfaces render text in Inter (check web with DevTools → Computed → Rendered Fonts; check native by temporarily changing `nativeFonts.sans.700` to a missing name and seeing the fallback appear, then reverting). Android shows four visibly distinct weights. Commit: `feat(apps): load inter and jetbrains mono`.

## 4. Space, shape and depth

### Step 9 — Space, size, radius, borders, opacity

- [ ] `primitive/space.json`: a 4 px base. Names are multiples of 4 px, matching Tailwind (`space.4` = 16 px):

| Name | 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| px | 0 | 2 | 4 | 6 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 | 80 | 96 |

- [ ] `primitive/size.json`, where control heights depend on **density** (chosen in `defineTheme`, step 17):

| Token | Compact | Default | Comfortable |
| --- | --- | --- | --- |
| `size.control-sm` | 28 | 32 | 36 |
| `size.control-md` | 36 | 40 | 44 |
| `size.control-lg` | 44 | 48 | 52 |
| `size.icon-sm` / `-md` / `-lg` | 16 / 20 / 24 | 16 / 20 / 24 | 16 / 20 / 24 |
| `size.touch-target` | 44 | 44 | 44 |

`size.touch-target` is the minimum hit area on native. Components smaller than it extend their touch area with `hitSlop` once components exist.

- [ ] `primitive/radius.json`: `none` 0, `xs` 2, `sm` 4, `md` 6, `lg` 8, `xl` 12, `2xl` 16, `full` 9999.
- [ ] `semantic/shape.json`: `radius.control`, `radius.card`, `radius.overlay`, `radius.pill`. Their aliases depend on the theme's `radius` option:

| `defineTheme` radius | control | card | overlay |
| --- | --- | --- | --- |
| `none` | none | none | none |
| `sm` | sm | md | lg |
| `md` (default) | md | lg | xl |
| `lg` | lg | xl | 2xl |
| `full` | full | 2xl | 2xl |

- [ ] `border-width`: `0`, `1` (default), `2` (focus ring width). Ring offset: `2`.
- [ ] `opacity.disabled`: 0.5.
- [ ] Add `concentric(outerRadius, padding)` to `@unison-ui/core`. It returns `max(0, outer − padding)`, the inner radius for nested surfaces, and is used by components once they exist.

**Done when:** the compiled output for `density: "compact"` has `size.control-md` = 36, and for `radius: "lg"` has `radius.card` = 12. Commit: `feat(tokens): space, size, radius, borders`.

### Step 10 — Elevation, layers, breakpoints

- [ ] `primitive/shadow.json`, light values (dark uses the same geometry with every alpha × 2.5, capped at 0.5, because shadows barely show on dark surfaces):

| Token | Value (light) |
| --- | --- |
| `shadow.xs` | `0 1px 2px rgb(0 0 0 / 0.05)` |
| `shadow.sm` | `0 1px 3px rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)` |
| `shadow.md` | `0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)` |
| `shadow.lg` | `0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10)` |
| `shadow.xl` | `0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10)` |

- [ ] `semantic/elevation.json`: `elevation.raised` → sm, `elevation.popover` → lg, `elevation.overlay` → xl. In dark mode, elevated surfaces also get the lighter `surface-raised` colour (step 5); that does more for depth than the shadow.
- [ ] Native shadows, verified before you build on them:
  - Spike (max 2 hours): in `apps/mobile`, render a `View` with `style={{ boxShadow: "<shadow.lg value>" }}` on iOS and Android. React Native supports `boxShadow` on the New Architecture.
  - **Works on both:** the native emitter outputs the CSS string as `boxShadow`. Done.
  - **Doesn't work:** the emitter additionally outputs a `legacy` object per shadow: iOS `shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius` from the largest layer, and Android `elevation` (xs 1, sm 2, md 4, lg 8, xl 12). Renderers use it through a single helper in `@unison-ui/native`. Record the outcome in the ADR.
- [ ] `primitive/layer.json`, z-index: `base` 0, `raised` 10, `dropdown` 1000, `sticky` 1100, `overlay` 1300, `modal` 1400, `popover` 1500, `toast` 1700, `tooltip` 1800. On native most layering comes from portals, but the same numbers are used where `zIndex` matters.
- [ ] Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. These go to Tailwind's `--breakpoint-*` and to the native theme (a `useBreakpoint()` hook comes with the components).

**Done when:** the shadow spike's result is recorded and the native theme contains working shadow output for all five sizes, visually checked on both simulators. Commit: `feat(tokens): elevation, layers, breakpoints`.

## 5. Motion

### Step 11 — Durations and easings

- [ ] `primitive/motion.json` durations (ms): 0, 50, 80, 120, 140, 160, 200, 240, 320, 400, 500.
- [ ] Semantic durations in `semantic/motion.json`. Exits run at about 70% of the matching enter:

| Token | Enter | Exit | Use |
| --- | --- | --- | --- |
| `motion.duration.fast` | 120 | 80 | Small state changes: hover, toggles, colour |
| `motion.duration.base` | 200 | 140 | Standard UI: popovers, menus, fades |
| `motion.duration.slow` | 320 | 240 | Large surfaces: dialogs, sheets (when not spring-driven) |

- [ ] Easings (cubic-bezier):

| Token | Curve | Use |
| --- | --- | --- |
| `easing.standard` | 0.2, 0, 0, 1 | Elements moving on screen |
| `easing.enter` | 0.05, 0.7, 0.1, 1 | Elements appearing (decelerate) |
| `easing.exit` | 0.3, 0, 0.8, 0.15 | Elements leaving (accelerate) |
| `easing.linear` | 0, 0, 1, 1 | Opacity-only and reduced-motion fades |

- [ ] Outputs: on web, `cubic-bezier(…)`; on native, a 4-number tuple that `@unison-ui/motion` turns into `Easing.bezier(…)` for Reanimated's `withTiming`.

**Done when:** both outputs contain all four easings and six durations. Commit: `feat(tokens): durations and easings`.

### Step 12 — Springs

- [ ] Three springs. The damping ratio ζ = damping / (2√(stiffness × mass)) decides overshoot:

| Token | Stiffness | Damping | Mass | ζ | Feel | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `spring.snappy` | 400 | 30 | 1 | 0.75 | Quick, barely any overshoot | Most UI: popovers, presses, toggles |
| `spring.smooth` | 300 | 35 | 1 | ≈1.0 | No overshoot | Sheets, drawers, large surfaces |
| `spring.bouncy` | 300 | 15 | 1 | 0.43 | Visible bounce | Playful moments only: toasts, badges |

- [ ] Web output, per spring: `--unison-spring-<name>` (a `linear()` easing from step 8 of phase 0's simulator) and `--unison-spring-<name>-duration`. Add a fallback block: `@supports not (transition-timing-function: linear(0, 1)) { … }` that sets each spring variable to `cubic-bezier(0.2, 0, 0, 1)`.
- [ ] Native output: the `{ stiffness, damping, mass }` config, which Reanimated's `withSpring` takes as is, so both platforms run the same physics.
- [ ] Test the simulator against the analytic solution of a damped spring: at 5 points in time, the position matches within 0.005 for all three springs.

**Done when:** the tests pass and `spring.smooth` never exceeds 1.0 in the simulated samples. Commit: `feat(tokens): springs`.

### Step 13 — Presets and reduced motion

- [ ] Preset definitions in `semantic/motion.json` (`$type: "motionPreset"`), each with `enter`, `exit` and `reduced`:

| Preset | Enter | Exit | Reduced (enter and exit) |
| --- | --- | --- | --- |
| `fade` | opacity 0→1, base, `easing.enter` | opacity →0, base exit, `easing.exit` | opacity, fast, linear |
| `scale-in` | opacity 0→1, scale 0.96→1, `spring.snappy` | opacity →0, scale →0.98, fast exit | opacity, fast, linear |
| `slide-up` | opacity 0→1, translateY 8→0, `spring.snappy` | opacity →0, translateY →4, fast exit | opacity, fast, linear |
| `sheet` | translateY 100%→0, `spring.smooth` | translateY →100%, slow exit, `easing.exit` | opacity, fast, linear |
| `pop` | scale 0.9→1, `spring.bouncy` | opacity →0, fast exit | opacity, fast, linear |
| `press` | scale 1→0.97, 80 ms, `easing.standard` | scale →1, `spring.snappy` | none (components show press with colour) |

- [ ] The `motion` option of `defineTheme` (step 17): `"snappy"` (default) as above; `"smooth"` swaps `spring.snappy` for `spring.smooth` and multiplies durations by 1.2; `"reduced"` always uses the reduced variants, even when the OS setting is off.
- [ ] Web output:
  - `@keyframes unison-<preset>-in` and `-out`
  - Tailwind `--animate-<preset>` (enter) and `--animate-<preset>-out` (exit), so the classes read `animate-scale-in` and `animate-scale-in-out`
  - An `@media (prefers-reduced-motion: reduce)` block that swaps every preset to its reduced keyframes
- [ ] Native output: `motionPresets` in the native theme, as plain data: `{ from, to, transition: { type: "spring", config } | { type: "timing", duration, easing } }` for enter, exit and reduced.
- [ ] Runtime helpers in `@unison-ui/motion`:
  - Web: `toWaapi(preset, phase)` returns `[keyframes, options]` for `element.animate()`
  - Native: `toReanimated(transition)` returns a function `(toValue) => withSpring(…) | withTiming(…)`. Add `react-native-reanimated` as an optional peer dependency of `@unison-ui/motion`.
  - Both helpers pick the reduced variant automatically when `useReducedMotion()` is true or the theme's motion is `"reduced"`.

**Done when:** unit tests cover every preset's three variants on both platforms; on web, `animate-scale-in` on a test element plays the spring; with the OS reduce-motion setting on, the same class only fades. Commit: `feat(motion): presets, reduced motion and platform helpers`.

## 6. Outputs

Two attributes control theming on web from here on:

- `data-theme`: the scheme, `light` or `dark`, as in phase 0
- `data-unison-theme`: the named theme (step 18), `default` when absent

Both work on `<html>` or on any element, which scopes the theme to that subtree.

### Step 14 — CSS output (`tokens.css`)

- [ ] Rewrite `emit-web.ts` to emit, per theme:

```css
:root, [data-unison-theme="default"] { /* primitives + semantic, light */ }
[data-theme="dark"], [data-theme="dark"] [data-unison-theme="default"] { /* dark overrides */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark overrides */ }
}
[data-unison-theme="brand"] { … }   /* one block per named theme, same three shapes */
```

- [ ] Semantic tokens are emitted as references, not copied values: `--unison-color-accent: var(--unison-color-accent-600);`. A dark or named theme then only overrides what actually differs.
- [ ] Colour primitives are emitted twice: hex first, then inside `@supports (color: oklch(0 0 0)) { … }` as `oklch()`. Wide-gamut screens get richer colour; everything else gets the safe hex.
- [ ] Typography as `--unison-text-<style>-size`, `-line-height`, `-weight`, `-tracking`; shadows as full shadow strings; motion as in steps 11–13.
- [ ] Stable, sorted output (by path), so diffs are readable.
- [ ] Budget: `tokens.css` for the default theme is under 8 KB gzipped (`gzip -c dist/web/tokens.css | wc -c`).

**Done when:** in the Vite demo, setting `data-theme="dark"` on a single `<div>` turns only that subtree dark, and the budget check passes. Commit: `feat(tokens): full css output`.

### Step 15 — Tailwind v4 output

- [ ] Two files:
  - `theme.css`: adds Unison's tokens next to Tailwind's defaults
  - `theme-strict.css`: first resets Tailwind's colour, radius, shadow, font and text namespaces (`--color-*: initial;` and so on), so **only** system tokens exist and off-system classes like `bg-blue-500` don't compile. The demo apps use the strict file.
- [ ] Mappings, all inside `@theme inline` so classes follow runtime theme switches:

| Tailwind namespace | From | Example class |
| --- | --- | --- |
| `--color-*` | Semantic colours + primitive palettes | `bg-surface`, `text-fg-muted`, `bg-accent-hover`, `bg-gray-100` |
| `--font-*` | `font-family.sans`, `.mono` | `font-sans`, `font-mono` |
| `--text-*` (+ `--line-height`, `--letter-spacing`, `--font-weight` sub-properties) | Typography styles | `text-body`, `text-title-lg` |
| `--radius-*` | Primitives + `control`, `card`, `overlay`, `pill` | `rounded-card` |
| `--shadow-*` | `xs`–`xl` + `raised`, `popover`, `overlay` | `shadow-popover` |
| `--spacing` | `space.1` (4 px base) | `p-4`, `gap-6` |
| `--ease-*` | Easings + springs | `ease-enter`, `ease-spring-snappy` |
| `--animate-*` | Presets (step 13) | `animate-scale-in` |
| `--breakpoint-*` | Breakpoints | `md:flex-row` |

- [ ] Native: point the native Tailwind engine chosen in phase 0 at the same file (or at the literal-value native file, if the phase 0 spike needed it). Verify `bg-surface`, `text-fg-muted`, `rounded-card`, `text-body` and `p-4` on iOS and Android. Note any class family the engine can't support (likely `shadow-*` or `animate-*`) in `docs/tailwind.md`.

**Done when:** in the strict demo, `bg-blue-500` produces no CSS, every example class in the table works on web, and the five checked classes work on both native platforms. Commit: `feat(tokens): tailwind v4 theme and strict mode`.

### Step 16 — Native theme, generated types, `tokens.json`

- [ ] `dist/native/theme.js`: `themes: { [name]: { light, dark } }`, each with the groups `color`, `space`, `size`, `radius`, `borderWidth`, `opacity`, `text` (ready-made style objects), `shadow`, `motion` (`duration`, `easing`, `spring`, `presets`), `zIndex` and `breakpoint`. Plain numbers and strings only, so it can be passed straight to `StyleSheet`.
- [ ] Generated types in `dist/types.d.ts`, re-exported from the main entry:
  - `UnisonTheme`, the full theme shape
  - Unions: `SemanticColor`, `TextStyle`, `RadiusToken`, `ShadowToken`, `MotionPreset`, …
  - `SemanticTokenPath`, the union of **semantic** paths only
- [ ] Change `cssVar()` in `@unison-ui/react` and `token()` in `@unison-ui/native` to accept only `SemanticTokenPath`. That's how "components use semantic tokens only" (step 3) is enforced: by the type checker.
- [ ] `dist/tokens.json`: every token for every theme and scheme, with its resolved value, `aliasOf`, tier, description and (for colours) the contrast data from step 6. The docs site in phase 5 is built from this file.
- [ ] Migrate phase 0's `Box`: its `size.box` is a primitive and now fails the type check. Add `size.demo-box` to `semantic/shape.json` as an alias of a 96 px primitive and point `boxStyles` at it, so the box keeps its size and the parity baselines stay valid.

**Done when:** `token(theme, "color.gray.500")` in `@unison-ui/native` is a type error (covered by a `@ts-expect-error` test), `token(theme, "color.fg-muted")` compiles, and `tokens.json` validates against a JSON Schema committed next to it. Commit: `feat(tokens): native theme, generated types and tokens.json`.

## 7. Themes and runtime switching

### Step 17 — `defineTheme()` and `unison.config.ts`

- [ ] Public API in `@unison-ui/tokens`:

```ts
// unison.config.ts (in an app)
import { defineConfig, defineTheme } from "@unison-ui/tokens";

export default defineConfig({
  themes: {
    default: defineTheme({
      accent: "indigo",          // preset name | "#hex" | { hue, chroma }
      neutral: "gray",           // "gray" (tinted by accent) | "neutral" | "slate" | "warm"
      radius: "md",              // "none" | "sm" | "md" | "lg" | "full"
      density: "default",        // "compact" | "default" | "comfortable"
      motion: "snappy",          // "snappy" | "smooth" | "reduced"
      autoContrast: true,
      fonts: { /* optional: sans, mono, nativeFonts (step 7) */ },
      overrides: { /* optional: { "color.ring": "{color.accent.400}" } */ },
    }),
  },
  defaultTheme: "default",
});
```

- [ ] Accent presets (hue, chroma): `indigo` (275, 0.20), `violet` (295, 0.21), `blue` (255, 0.19), `teal` (185, 0.13), `green` (150, 0.17), `orange` (50, 0.19), `rose` (10, 0.21).
- [ ] Neutral presets: `gray` (the accent's hue, chroma 0.012), `neutral` (chroma 0), `slate` (hue 250, 0.02), `warm` (hue 60, 0.015).
- [ ] `overrides` accepts only semantic paths (typed with `SemanticTokenPath`), and values must be aliases. This is the escape hatch for one-off changes without forking.
- [ ] Validation: unknown keys and invalid values fail with the nearest valid option (`radius: "medium"` → `did you mean "md"?`).
- [ ] CLI: `unison-tokens build --config unison.config.ts --out .unison` loads the TypeScript config with `jiti` and writes the same set of files as the package's `dist/` into the app's `.unison/` folder. `--watch` rebuilds on config changes. Without `--config`, it uses the built-in default theme.
- [ ] The package's own `dist/` keeps shipping the default theme, so apps that don't customise need no config at all.

**Done when:** `defineTheme({ accent: "#e11d48", radius: "lg", density: "compact" })` builds, the output contains `#e11d48` in the accent scale, `radius.card` is 12, `size.control-md` is 36, and `radius: "medium"` fails with the suggestion. Commit: `feat(tokens): defineTheme and config file`.

### Step 18 — Named themes

- [ ] Several entries in `themes` produce one CSS block set per theme (step 14) and one entry per theme in the native `themes` object.
- [ ] `defineTheme({ extends: "default", accent: "rose" })` inherits everything else from another theme in the same config.
- [ ] Name rules: lowercase, `a-z`, `0-9` and `-`; `default` is reserved for the base theme.
- [ ] Demo config in all three apps: `default` (indigo) and `brand` (`extends: "default"`, accent `#e11d48`, radius `lg`). Each app imports its generated `.unison/` files instead of the package defaults. Add `.unison/` to `.gitignore` and a `prebuild` / `predev` script that runs `unison-tokens build`.
- [ ] In each app's `dev` script, run `unison-tokens build --watch --config unison.config.ts --out .unison` alongside the dev server (for example with `concurrently`), so config edits reach the running app without a restart. The phase 1 gate depends on this.

**Done when:** both themes build, the CSS has a `[data-unison-theme="brand"]` block, and the native theme object has `themes.brand.light` and `themes.brand.dark`. Commit: `feat(tokens): named themes with extends`.

### Step 19 — Runtime switching

Web and native get the **same** API; a type-level contract test (as in phase 0) keeps it that way.

- [ ] `@unison-ui/react`:
  - `<ThemeScript storageKey="unison" defaultScheme="system" />`: a server-safe component that renders an inline `<script>`. Before paint, it reads the stored scheme and theme and sets `data-theme` and `data-unison-theme` on `<html>`. It replaces the hand-written scripts from phase 0. For Vite, also export `themeScript(options)`, which returns the same script as a string to paste into `index.html`.
  - `"use client"` `<ThemeProvider>` and `useTheme()`, returning `{ scheme, resolvedScheme, setScheme, theme, setTheme, themes }`. It follows `prefers-color-scheme` while `scheme` is `"system"`, persists to `localStorage`, and syncs across tabs through the `storage` event.
  - `<ThemeScope theme="brand" scheme="dark">`: renders a `<div style={{ display: "contents" }}>` with the attributes. Custom properties still inherit through `display: contents`, so it scopes the theme without affecting layout.
- [ ] `@unison-ui/native`:
  - `<UnisonProvider themes={themes} defaultTheme="default" defaultScheme="system" storage={adapter}>`. `themes` comes from the app's generated `.unison/native/theme.js`. `storage` is an optional `{ getItem, setItem }` adapter, so the app chooses AsyncStorage, MMKV or nothing.
  - `useTheme()` returns the same shape as on web, plus `tokens` (the resolved theme object).
  - `<ThemeScope theme scheme>`: a nested provider.
  - When the scheme is forced, call `Appearance.setColorScheme()` so system UI (status bar, native pickers) follows. Notify the native Tailwind engine through its theme API; put that call in one adapter function.
  - Components read the theme from context only, never by importing `@unison-ui/tokens/native` directly. Update `Box` and `useUnisonTheme()` from phase 0 to use the context.
- [ ] Demo apps: replace the phase 0 toggles with a small settings bar: scheme (system, light, dark) and theme (default, brand), plus a `ThemeScope` panel that always shows `brand` in dark.

**Done when:** on all four surfaces, switching through 2 themes × 3 schemes updates instantly with no reload; the scoped panel stays brand-dark regardless of the outer setting; reloading the web apps on any combination shows no flash; restarting the native app keeps the choice when a storage adapter is passed. Commit: `feat: runtime theme switching on web and native`.

## 8. Showcase and parity

### Step 20 — Token showcase screens

The showcase is app code (not library code), built with Tailwind classes on all platforms, so it also tests the Tailwind mappings from step 15.

- [ ] `demo-content/src/showcase-data.ts`: a pure function `showcaseSections(theme)` that turns the resolved theme into a list of sections and items. Every app renders that same data, so new tokens appear everywhere automatically.
- [ ] Routes: `/tokens` in both web apps, and `app/tokens.tsx` in Expo, linked from each demo's home screen.
- [ ] Sections, in this order:
  1. **Semantic colours**: a swatch, the token name, the resolved value and, for text tokens, the contrast ratio against its background with a pass/fail badge
  2. **Palettes**: a 6 × 11 grid of every scale
  3. **Typography**: each text style with its name and size/line height, set as "The quick brown fox — 1234567890"
  4. **Space**: horizontal bars for each step, labelled in px
  5. **Radius and elevation**: cards showing each semantic radius and each elevation
  6. **Motion**: one "Play" button per preset that animates a sample card (web: `toWaapi`; native: `toReanimated`), a "Reduced" switch that forces the reduced variant, and the active preset's spring curve drawn as a small line chart
- [ ] The settings bar from step 19 is visible on this screen too, so you can flip themes and schemes while looking at everything.

**Done when:** all four surfaces render the six sections for both themes and both schemes, every contrast badge shows pass for the default theme, and the motion section feels the same side by side on web and a simulator (a manual check: spring overshoot and timing look identical). Commit: `feat(demo): token showcase`.

### Step 21 — Parity fixtures for tokens

- [ ] Extend the parity stage contract: runs get a `theme` dimension, so a run is now `component/case/theme/scheme`. Run the new fixtures for `default` and `brand`, in both schemes.
- [ ] The parity registry now needs platform-specific fixture components, so give `@unison-ui/parity/registry` web and native entries with the `react-native` export condition, exactly like `@unison-ui/ui`.
- [ ] New fixtures:

| Fixture | Renders | Cross-platform check | Baseline screenshots |
| --- | --- | --- | --- |
| `swatches` | 12 semantic colours as 40 × 40 squares in a 6 × 2 grid, 8 px gaps | Layout metrics ±1 px **and** the colour at each square's centre, within ΔE2000 ≤ 3 | Yes |
| `type-ramp` | Each text style as one line ("Ag Hamburgefonstiv") stacked with no gaps | The **height** and **y** of every line ±1 px (widths are skipped because glyph widths differ by platform) | Yes |
| `radius` | One 64 × 64 box per semantic radius | Layout metrics only | Yes |
| `elevation` | One card per elevation on `canvas` | Layout metrics only | Yes (shadows differ by platform, so only same-platform baselines) |

- [ ] Add a colour sampler to `compare.ts`: read the pixel at each reported centre point from the cropped screenshots, convert to OKLab and compute ΔE2000 with culori. A small tolerance is needed because the web emits `oklch()` while native uses the gamut-mapped hex.

**Done when:** `pnpm test:parity --update` then `pnpm test:parity` pass across all four platforms; the report shows the new fixtures for 2 themes × 2 schemes. Sabotage: changing native `title` line height to 30 fails `type-ramp`; changing the native `accent` hex by a few steps fails `swatches`. Revert both. Commit: `test(parity): token fixtures`.

## 9. Tests, docs and release

### Step 22 — Test sweep

Most tests were written step by step. This step fills the gaps and adds the tests that span several steps.

- [ ] Property-based tests with `fast-check` for the generator: for any hue (0–360) and chroma (0–0.37), scales are monotonic, every `hex` is in sRGB, and output is deterministic. `autoContrast` always terminates (within 100 iterations) for any seed.
- [ ] Snapshot every output file for the demo config (`default` + `brand`): `tokens.css`, `theme.css`, `theme-strict.css`, `native/theme.js`, `types.d.ts`. A token change must show up as a readable snapshot diff.
- [ ] Config validation: every `defineTheme` option with one valid and one invalid value.
- [ ] Web runtime (`jsdom`):
  - `ThemeScript` output executes and sets both attributes from storage
  - `ThemeProvider` follows `matchMedia` while on system, persists `setScheme`, and syncs on a `storage` event
  - `ThemeScope` renders `display: contents`
- [ ] Native runtime (Jest): `UnisonProvider` with a mock storage adapter restores the saved theme; `useTheme().tokens` switches with the scheme; `Appearance.setColorScheme` is called when forcing a scheme.
- [ ] Contract test: `useTheme()` return types and `ThemeScope` props are identical on web and native.
- [ ] Build performance: `unison-tokens build` for the demo config finishes in under 1 second on your machine (`time pnpm --filter web-vite exec unison-tokens build --config unison.config.ts`). If it's slower, profile before adding themes.

**Done when:** `pnpm check` and `pnpm test:parity` pass, and the tokens package's coverage is above 90% of lines. Commit: `test: phase 1 test sweep`.

### Step 23 — Docs and ADRs

- [ ] `tooling/scripts/docs-tokens.ts` (`pnpm docs:tokens`) generates `docs/tokens.md` from `tokens.json`: every semantic token with its light and dark value, alias and use. CI fails if the committed file is out of date.
- [ ] `docs/theming.md`: every `defineTheme` option with its values and default; named themes and `extends`; setup snippets for Next.js (`ThemeScript` in `layout.tsx`), Vite (`themeScript()` in `index.html`) and Expo (`UnisonProvider` in `_layout.tsx`); scoping with `ThemeScope`.
- [ ] `docs/tailwind.md`: the namespace table from step 15, strict vs. non-strict, and any native class limitations found.
- [ ] `docs/motion.md`: the preset table, which spring to use when, the reduced-motion rules, and the exit-faster-than-enter rule.
- [ ] ADRs (continuing the numbering from phase 0):
  - OKLCH generation and gamut mapping
  - 11-step scale and separate dark ramps
  - WCAG 2 enforced, APCA informational, `autoContrast`
  - Inter as default font and the native font-face map
  - Native shadow strategy (the step 10 spike result)
  - Semantic-only token access enforced by types
  - Theme attributes, scoping and `display: contents`
  - App config file and the `.unison/` output folder

**Done when:** a new person can theme a fresh Next.js app and a fresh Expo app with only `docs/theming.md`. Commit: `docs: phase 1 docs and ADRs`.

### Step 24 — Release 0.1.0

- [ ] Add changesets describing the new tokens API, theming API and motion helpers (a `minor` bump for every public package; the `fixed` group keeps them in step).
- [ ] Label a PR `snapshot` and test the snapshot in a fresh Next.js app and a fresh Expo app **outside** the monorepo, following `docs/theming.md` word for word. Fix the docs wherever you had to guess.
- [ ] Merge the "Version packages" PR to publish `0.1.0`.

**Done when:** `0.1.0` is on npm with provenance for every public package, and both outside apps render the token showcase basics (swatches, type ramp) with a custom `defineTheme` config. Commit: (made by the Changesets bot).

## 10. Final acceptance

### Step 25 — Clean-clone run and the phase 1 gate

Clone into a new folder and go through the list in order, without editing any file.

- [ ] `pnpm install`, `pnpm run doctor`, `pnpm check` and `pnpm check:packages` all pass
- [ ] `pnpm test:parity` passes on web-chromium, web-webkit, iOS and Android for all fixtures × 2 themes × 2 schemes
- [ ] **The roadmap gate:** with `pnpm dev` running, change `accent` in `apps/web-next/unison.config.ts` (and the same in the other two apps) from `"indigo"` to `"teal"`, and each surface updates without a manual restart
- [ ] The `/tokens` showcase on all four surfaces shows every section; all default-theme contrast badges pass
- [ ] 2 themes × 3 schemes switch instantly everywhere; no flash on web reload; the scoped panel stays brand-dark
- [ ] With the OS reduce-motion setting on, every preset in the motion section only fades, on all four surfaces
- [ ] `bg-blue-500` produces nothing in the strict web apps; `token(theme, "color.gray.500")` is a type error in component code
- [ ] A yellow accent (`#facc15`) builds with an auto-contrast warning, and its `on-accent` text is legible
- [ ] `docs/tokens.md` is up to date (the CI check passes), and every new decision has an ADR
- [ ] `0.1.0` is on npm, and the two outside apps from step 24 still work after a fresh `pnpm install`

**When everything passes:** tag `phase-1-complete` and tick the Phase 1 gate in the roadmap tab. Phase 2 builds the styling and interaction engine on top of these tokens: `defineStyles`, interactions, press feedback and haptics, and the CLI's `init` / `add`, proven with an internal probe component.
