# Cross-platform design system: concept & architecture

Nov 16, 2026 · @Mark

## Vision & positioning

One design system for React on web (Next.js, Vite) and React Native (Expo, bare). Components look finished on install, customize all the way down, and move with production-grade motion on every platform.

- **Pitch:** motion-first, clean by default, native everywhere. It is not "shadcn for mobile"; that slot is taken.
- **Reference points:** shadcn/ui (you own the code) and Meta's Astryx (a package first, with `swizzle` to eject the source). Neither targets native, and neither ships a motion system.
- **Tailwind is first-class** on both platforms, but never required: the tokens also compile to plain CSS variables and a typed native theme.
- **Audience:** product teams shipping one brand across a web app and a mobile app who don't want two design systems.

## Design principles

The default look is restrained and precise. Every visual decision is a token or a variant, so nothing needs to be overridden with `!important` or forked.

1. **Clean out of the box.** A neutral palette, one accent, an 8-point spacing scale, crisp 1px borders, soft corners (6–10px), subtle shadows used only for elevation, and a tight type scale. Dark mode is designed alongside light mode, not inverted from it.
2. **Craft in the details.** Visible focus rings that only show for keyboard users, optical alignment of icons, tabular numbers in data, concentric radii for nested surfaces, and touch targets of at least 44pt on native.
3. **Customizable at every layer.** Tokens, then themes, then variants, then slots, then ejecting the source (see Customization model). Each layer is optional.
4. **The same API, idiomatic output.** Props match across platforms, but a Select becomes a native sheet on mobile and a popover on web.
5. **Motion is part of the component.** Enter, exit, press and gesture behaviour ship inside each component and are tuned through tokens.
6. **Accessible by default.** ARIA on web, accessibility props on native, reduced motion respected, and WCAG AA contrast enforced by the token compiler.

## Architecture

Share everything except the render layer. Tokens, behaviour, styles and motion specs are written once; each component then has a web renderer and a native renderer that implement the same props contract.

```
Shared across platforms, one source
├─ Tokens + motion tokens    DTCG JSON compiled to CSS vars, Tailwind v4 theme, native theme
├─ Headless core             state hooks, a11y state, shared props types
└─ Styles + motion specs     defineStyles: slots, variants, states; motion presets, springs
        │ browser condition                      │ react-native condition
        ▼                                        ▼
Web renderer (@unison-ui/react)          Native renderer (@unison-ui/native)
DOM + React Aria, CSS and WAAPI motion   RN views + a11y props, Reanimated, haptics
Layered CSS; Tailwind classes always win Runtime style resolver, style / styles props
        ▼                                        ▼
Next.js, Vite                            Expo, bare React Native
```

The platform split happens at package level, not with `.web.tsx` / `.native.tsx` files: platform-free code (props types, state hooks, style and motion specs) lives in `@unison-ui/core` and `@unison-ui/motion`, renderers live in `@unison-ui/react` and `@unison-ui/native`, and `@unison-ui/ui` re-exports the right one through `exports` conditions (`react-native`, `browser`, `default`).

Each component is written once as a shared spec — its props contract, its `defineStyles` styles (slots, variants, states) and its motion presets — plus a thin web renderer and a thin native renderer that use the engine's interaction, form, overlay and gesture helpers. The exact file layout is defined in `docs/authoring-components.md` (roadmap phase 2).

## Styling & Tailwind support

Components are styled by Unison's own engine, `defineStyles`, so they don't depend on any Tailwind runtime. App code can still use Tailwind on both platforms: Tailwind v4 on web, and Uniwind on native (NativeWind as the fallback), both reading the same compiled token theme.

| Layer | Web (Next.js, Vite) | Native (Expo, React Native) |
| --- | --- | --- |
| Token output | CSS variables + a Tailwind v4 `@theme` file | A typed theme object; the same theme file read by Uniwind |
| Component styles | `defineStyles` compiled to CSS in the `components` cascade layer | The same `defineStyles` spec, resolved at runtime |
| Overrides | `className` / per-slot `classNames`; Tailwind always wins over component styles | `style` / per-slot `styles` props |
| Without Tailwind | Plain CSS variables + `className` / `style` | `style` props built from the theme object |
| Theme switching | `data-theme` on `<html>`, no re-render | Theme context in `UnisonProvider` |
| Dark mode | `prefers-color-scheme` + manual override | `useColorScheme` + manual override |

- Each component's styles are one `defineStyles` spec (slots, variants, compound variants, `_hover`-style states), shared by both renderers, so variants never drift between platforms.
- Merge rule: on web, component CSS sits in a lower cascade layer, so a consumer `className` always wins — no `tailwind-merge`, no `!important`, no specificity fights.
- Web-only states (hover, focus-visible) have defined native equivalents: press states replace hover.

## Customization model

There are five escalating levels. Most teams stop at level 2, and every level up the ladder survives upgrades except level 5.

1. **Tokens.** Change brand colour, radius, font, density or motion feel in one config file: `defineTheme({ accent: 'violet', radius: 'md', density: 'compact', motion: 'snappy' })`. The compiler derives the full scale (50–950, plus hover, active and subtle steps) using OKLCH and checks contrast.
2. **Themes.** Several named themes per app (brand, high contrast, per-tenant). They are switched at runtime and can be scoped to a subtree.
3. **Variants.** Add or override variants in the shared `defineStyles` spec (`intent`, `size`, `tone`). TypeScript picks up new variants automatically.
4. **Slots and composition.** Every part of a component is a named slot that takes a `className` or `style` (`classNames={{ root, trigger, content, item }}`), plus an `asChild`-style prop for swapping the element. Compound APIs (`<Dialog.Root>`, `<Dialog.Content>`) let you rearrange the structure without forking.
5. **Eject.** `cli eject dialog` copies the full source (web, native, styles, motion) into your repo. You own it from then on, and the CLI can show a diff against upstream when you want to pull in fixes.

Presets ship as themes, not forks. Three ship with engine v1.0: neutral (the default), soft and editorial.

## Motion system

Motion is defined once as tokens and runs natively on each platform: CSS and the Web Animations API (WAAPI) on web, with no Motion dependency, and Reanimated with Gesture Handler on native, on the UI thread.

**Motion tokens**

| Token | Purpose | Default |
| --- | --- | --- |
| `motion.duration.fast / base / slow` | Small state changes, standard UI, large surfaces | 120 / 200 / 320 ms |
| `motion.ease.standard / enter / exit` | Cubic-bezier curves | Exit accelerates, enter decelerates |
| `motion.spring.snappy / smooth / bouncy` | Stiffness, damping and mass | Snappy for UI, smooth for sheets, bouncy only for playful moments |
| `motion.preset.*` | Semantic recipes: `fade`, `scale-in`, `slide-up`, `pop`, `collapse` | Composed from the tokens above |

Springs compile to CSS `linear()` easings on web and to `withSpring` configs on native, so one token feels the same on both.

**Primitives:** `<Presence>` for enter and exit with exit-before-unmount, `layout` transitions, `usePressFeedback` (scale plus haptics on native), and `useDrag` with velocity handoff to springs. Shared-element transitions are planned for v2.

**Best practices baked in**

- Animate only `transform` and `opacity`. Never animate layout properties directly; use FLIP or layout animations instead.
- Exits are faster than enters (about 70% of the duration). Nothing over 400 ms in regular UI.
- Every animation can be interrupted. Grabbing a sheet mid-flight continues from where it is, and the release velocity feeds the spring.
- Reduced motion (`prefers-reduced-motion`, `AccessibilityInfo.isReduceMotionEnabled`) swaps movement for short fades. Feedback stays; travel goes.
- No animation on high-frequency actions (typing, rapid toggles) or on first paint of server-rendered content.
- Origin-aware: popovers scale from their trigger, and sheets slide from their edge.
- Haptics on native are tied to the meaning of the action (selection, success, warning) and can be turned off globally.
- A motion test suite checks frame drops with Reanimated on low-end Android and with Chrome's CPU throttling on web.

## Distribution & CLI

It is a package by default, with copying the source as an option. Teams start with `npm i` and eject only the components they need to own.

- **Packages:** `@unison-ui/tokens` (compiler + presets), `@unison-ui/core` (headless hooks), `@unison-ui/react` (web components), `@unison-ui/native` (React Native components) and `@unison-ui/motion`. A single `@unison-ui/ui` entry with `exports` conditions (`react-native`, `browser`, `default`) gives one import path for every platform.
- **CLI:** `init` detects the project type (Next.js, Vite or Expo) and the Tailwind version, then writes the theme file and preset. `add` installs a component; `eject` copies its source; `diff` and `update` compare and merge ejected code with upstream; `theme` edits and previews token changes.
- **Registry:** compatible with the shadcn registry JSON format, so components can be installed with existing tooling and third parties can publish their own.
- **Next.js:** static components (Text, Stack, Card, Badge) are safe for Server Components. Interactive and animated ones carry `"use client"` at their own boundary, not at the package root.
- **Monorepo-friendly:** one theme file shared by `apps/web` and `apps/mobile`.

## Component scope

The roadmap first builds the engine every component will use, with no public components. The components themselves are planned in the [component catalogue](component-catalogue.md): 138 components in 9 categories, 35 blocks and 22 screen templates, released in three waves after engine v1.0, plus a Later tier and a community registry for niche extras.

## Risks & open questions

The biggest risk is maintenance: two renderers for every component roughly doubles the work. Scope discipline matters more than the feature list.

- **Crowded market.** Tamagui, gluestack-ui, React Native Reusables, NativeWind/Uniwind and Unistyles already exist. The motion system and the level of polish have to be clearly better, not just on par.
- **Platform drift.** Shared `defineStyles` specs, shared props types, a contract test for platform extras and a parity test (both renderers get the same props and state, then layout, colour and motion curves are compared) keep the two in step.
- **Owning the styling engine.** `defineStyles` keeps components independent of Uniwind and NativeWind release cycles, but it is ours to maintain. Keep its property vocabulary small and documented.
- **React Server Components (RSC) and the bundle.** Motion libraries must never leak into server components or bloat pages that don't animate.
- **Testing cost:** Playwright visual tests for web, Maestro for native, and axe for web accessibility.
- Open: support only Expo, or bare React Native too?
- Open: which minimum React and React Native versions to support (React 19 and the New Architecture only would simplify a lot).
- Decided: the name is Unison, published under the @unison-ui scope.

## Roadmap

Six phases build the engine, each ending in something you can demo, proven with internal probe components. No dates are set yet. Full detail is in the [roadmap](roadmap.md) and the per-phase todos in [todos/](todos/).

0. **Setup.** Monorepo, CI, demo apps for Next.js, Vite and Expo, parity harness. Gate: all three demo apps run from one `pnpm dev`.
1. **Tokens & motion compiler.** DTCG JSON in; CSS variables, a Tailwind v4 theme, a native theme object and spring configs out. Gate: one token change visibly updates a web page and an Expo app.
2. **Styling & interaction engine, CLI.** `defineStyles`, `onPress` interactions, press feedback, haptics; `init`, `add`, `eject`. Gate: `init` + `add probe` in a fresh app in under two minutes.
3. **Form engine.** Field and form wiring, a React Hook Form adapter, shared value state. Gate: the probe-form scenario behaves the same on web and native.
4. **Motion, overlay & gesture engine.** `Presence`, portals, one overlay stack, modal focus, drag and snap helpers. Gate: 60 fps on a mid-range Android phone, and reduced motion verified.
5. **Ecosystem & engine v1.0.** Theme presets, icons, docs with live demos and Expo previews, a theme builder, CLI `diff` / `update` / `theme`, an accessibility audit. Gate: engine v1.0 on npm with docs live.

Components follow in waves, on top of the engine.
