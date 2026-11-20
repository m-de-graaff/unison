# Cross-platform design system roadmap

Nov 16, 2026 · @Mark

Six phases take the system from a token compiler to a public engine v1.0: tokens, styling, interaction, form, motion, overlay and gesture engines, 3 theme presets, docs, CLI and registry, on web and native. Components come after, on top of this engine, following the [component catalogue](component-catalogue.md). Each phase ends with a gate you can demo, proven with internal probe components. No dates are set yet.

## At a glance

| # | Phase | What it builds | Gate |
| --- | --- | --- | --- |
| 0 | Setup | Monorepo, CI, demo apps for Next.js, Vite and Expo, parity test harness | All three demo apps run from one `pnpm dev` |
| 1 | Tokens and motion compiler | DTCG tokens to CSS variables, Tailwind v4 and a native theme; springs for both platforms | One token change updates the web and Expo demos |
| 2 | Styling and interaction engine, CLI | `defineStyles`, `onPress` interactions, press feedback, haptics; `init`, `add`, `eject`; registry | `init` + `add probe` in a fresh app in under two minutes |
| 3 | Form engine | Field and form wiring, React Hook Form adapter, shared value state, component token tier | The probe-form scenario behaves the same on web and native |
| 4 | Motion, overlay and gesture engine | `Presence`, portals, overlay stack, modal focus, drag and snap helpers, frame-drop tests | 60 fps on a mid-range Android phone, reduced motion verified |
| 5 | Ecosystem and engine v1.0 | 3 theme presets, icons, docs site, theme builder, CLI `diff` / `update` / `theme`, accessibility audit | Engine v1.0 published to npm, docs live |

Phases run in order; a phase starts only when the gate above it passes. Phase lengths are not to scale.

## Phase details

Each phase is done when its gate passes, not when its checklist is ticked.

### Phase 0 — Setup

- [x] Monorepo (pnpm + Turborepo): `packages/tokens`, `core`, `motion`, `react`, `native`, `ui`, `cli`, plus private `demo-content` and `parity`; `apps/web-next` (Next.js), `apps/web-vite` (Vite), `apps/mobile` (Expo)
- [x] CI: typecheck, lint, unit tests, changesets for releases
- [x] Parity test harness: render a component on both platforms with the same props and compare screenshots (Playwright + Maestro)
- [x] Settle the decisions listed at the end of this doc

- [x] **Gate:** all three demo apps build and run from one `pnpm dev`.

Detailed development todo: [Phase 0 todo](todos/phase-0.md)

### Phase 1 — Tokens & motion compiler

- [ ] Token source in DTCG JSON: colour (OKLCH scales), type, spacing, radius, elevation, motion
- [ ] Outputs: CSS variables, Tailwind v4 `@theme` (also read by Uniwind on native), typed native theme object
- [ ] Springs compiled to CSS `linear()` on web and `withSpring` configs on native
- [ ] `defineTheme()` API with derived scales and a WCAG AA contrast check that fails the build
- [ ] Light and dark modes, runtime theme switching

**Gate:** one token change visibly updates the Next.js and Expo demos.

Detailed development todo: [Phase 1 todo](todos/phase-1.md)

### Phase 2 — Styling & interaction engine, CLI

- [ ] Styling engine: `defineStyles` (slots, variants, states), compiled CSS in the `components` layer on web, a runtime resolver on native
- [ ] Interactions: React Aria on web, `Pressable` on native, one `onPress`; platform extras checked by a contract test
- [ ] `@unison-ui/motion`: press feedback, reduced-motion hook, haptics wrapper
- [ ] CLI: `init` (detects Next.js, Vite or Expo and the Tailwind version), `add`, `eject`
- [ ] Registry in shadcn-compatible JSON

**Gate:** `init` + `add probe` works in a fresh Next.js, Vite and Expo app in under two minutes.

Detailed development todo: [Phase 2 todo](todos/phase-2.md)

### Phase 3 — Form engine

- [ ] Field engine: `FieldProvider` / `useFieldControl` wiring labels, hints and errors for accessibility on both platforms
- [ ] Form engine: `FormProvider`, return-key flow on native, `fromController` for React Hook Form
- [ ] Shared value and selection state (`react-stately`), plus the component token tier

**Gate:** the probe-form scenario behaves identically on web and native (4 platforms).

Detailed development todo: [Phase 3 todo](todos/phase-3.md)

### Phase 4 — Motion, overlay & gesture engine

- [ ] `Presence` with exit-before-unmount, interruptible WAAPI `animate()` with velocity handoff
- [ ] Portals, one overlay stack, focus trap, scroll lock and screen-reader isolation on every platform
- [ ] Drag helpers with snap points, rubber-banding and scroll handover; proven with a probe overlay and probe drawer
- [ ] Frame-drop tests on a mid-range Android phone and with Chrome CPU throttling

**Gate:** 60 fps on a mid-range Android phone; reduced-motion fallbacks verified on iOS, Android and web.

Detailed development todo: [Phase 4 todo](todos/phase-4.md)

### Phase 5 — Ecosystem & engine v1.0

- [ ] 3 theme presets and the icons package (see Ecosystem deliverables)
- [ ] Docs site: foundations and engine reference pages, live demos, Expo QR previews, theme builder
- [ ] CLI `diff`, `update` and `theme` commands; third-party registries and a publishing guide
- [ ] Accessibility audit of the engine (axe on web, VoiceOver and TalkBack on native)

**Gate:** engine v1.0 published to npm with docs live.

Detailed development todo: [Phase 5 todo](todos/phase-5.md)

## Components

The phases above build no public components; they build the engine every component will use. Components are planned separately in the [component catalogue](component-catalogue.md) (tiers, names and blocks) and get their own todos later.

## Ecosystem deliverables

The engine v1.0 ships more than code: themes, docs, a CLI and a registry are what make it an ecosystem.

| Deliverable | What ships in engine v1.0 | Phase |
| --- | --- | --- |
| Themes | Neutral (default), Soft, Editorial | 1 (engine), 5 (presets) |
| Icons | `@unison-ui/icons`: `lucide-react` and `lucide-react-native` behind one import | 5 |
| Docs | Foundations and engine reference pages, live web demos, Expo QR previews, a theme builder | 5 |
| CLI | `init`, `add`, `eject`, `diff`, `update`, `theme` | 2 and 5 |
| Registry | shadcn-compatible format, open to third-party themes and components | 2 (format), 5 (publishing guide) |

Later, with the components: screen templates and blocks, an `Icon` component, a Figma kit generated from the tokens, and community themes.

## Decisions

- [x] **Name and npm scope.** Decided: Unison, npm scope @unison-ui. Still to do: claim the npm org and the GitHub org.
- [x] **Native styling engine.** Decided: Uniwind for Tailwind classes in native app code, with NativeWind as the fallback, settled by the spike in phase 0 (step 17.5). Unison's own components don't depend on either: `defineStyles` compiles to layered CSS on web and runs through its own runtime resolver on native, and native components take `style` / `styles` props (phase 2, steps 1–3).
- [x] **Web motion engine.** Decided: CSS plus the Web Animations API, no Motion dependency; springs become `linear()` easings with velocity (phase 4, ADR closing 0006).
- [x] **Native support.** Decided: Expo only for v1; bare React Native is not tested ([ADR 0003](../adr/0003-expo-only-native.md)).
- [x] **Minimum versions.** Decided: React 19 and the React Native New Architecture only ([ADR 0004](../adr/0004-react-19-new-architecture.md)).
- [x] **License.** Decided: MIT ([ADR 0010](../adr/0010-mit-license.md)).
