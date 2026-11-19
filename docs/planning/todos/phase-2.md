# Phase 2 — development todo: styling & interaction engine, CLI

Same format as before: follow the steps in order, pass each **Done when** before moving on, one commit per step. This phase builds the **engine** every component will sit on — style specs compiled to layered CSS on web and resolved at runtime on native, the interaction and accessibility foundations, press feedback and haptics — tested through one internal probe component. It ends with a CLI and registry that set up a fresh Next.js, Vite or Expo app in under two minutes. Components themselves are added later, from the component catalogue.

## 0. Before you start

### Prerequisites

- [ ] `phase-1-complete` is tagged and `0.1.0` is on npm.
- [ ] Rename phase 0's placeholder `Box` to `Probe` and make it internal (exported only from `/internal`). It's the engine's test subject: this phase rebuilds it on the new engine with two variants (`tone`, `size`), every interaction state and press feedback, so every feature has something real to run against. Real components replace it later.

### Decisions this phase assumes

Each becomes an ADR in step 15.

| Decision | Default | Why |
| --- | --- | --- |
| How components are styled | A platform-free style spec per component (`defineStyles`, step 1). Web: compiled at build time to a CSS file inside the `components` cascade layer (the same layer Tailwind v4 declares below its utilities). Native: resolved to `StyleSheet` objects at runtime from the theme. | Works **without** Tailwind (concept-doc promise) and needs no runtime CSS-in-JS on web |
| How users override styles | Web: `className` (and Tailwind) always beats component styles because component CSS lives in a lower cascade layer, so there are no `!important` or specificity fights. Native: `style`. Both: per-slot `classNames` / `styles` props. | The customisation ladder from the concept doc, levels 3–4 |
| Variant states | Web: CSS selectors (`:hover`, `:focus-visible`, `[data-pressed]`, `:disabled`). Native: style keys picked from `Pressable` state. | Native code to the platform; no JS on web for hover |
| Web interaction hooks | `react-aria` (`usePress`, `useHover`, `useFocusRing`) | Correct pointer, keyboard and touch behaviour is hard to get right; React Aria is battle-tested (Apache-2.0) |
| Haptics | `expo-haptics` as an **optional** peer dependency of `@unison-ui/native`; no-op if missing | Haptics without forcing a dependency |
| Icons | Components accept any `ReactNode` as an icon now; the Lucide wrapper ships in phase 5 | Keeps phase 2 small |
| Registry | Static JSON, shadcn-compatible `registry-item` format, one file per component **per platform** | shadcn tooling can install the web variant; our CLI picks the platform |
| Distribution default | Package first (`npm i`); `eject` copies source when a team wants to own it | Concept doc |

### Component anatomy

Every component from here on has the same files. `pnpm new:component` (phase 0, step 28) is updated in step 1 to generate exactly this:

```
packages/core/src/components/button/
├─ button.types.ts    props contract (shared by both renderers)
├─ button.styles.ts   defineStyles spec: slots, variants, states
├─ button.motion.ts   which motion presets it uses, and when
└─ use-button.ts      headless state (if any)
packages/react/src/button/button.tsx      web renderer
packages/native/src/button/button.tsx     native renderer
packages/parity/src/fixtures/button.ts    parity cases
docs/components/button.md                 docs page
```

## 1. Styling engine

### Step 1 — `defineStyles()` in `@unison-ui/core`

- [ ] API, mirroring the familiar tailwind-variants shape (slots, variants, compound variants, defaults), with states as `_`-prefixed keys:

```ts
export const buttonStyles = defineStyles({
  slots: {
    root:  { flexDirection: "row", alignItems: "center", justifyContent: "center",
             gap: "space.2", radius: "radius.control", borderWidth: 1 },
    label: { text: "text.label" },
    icon:  { width: "size.icon-sm", height: "size.icon-sm" },
  },
  variants: {
    variant: {
      solid: {
        root:  { bg: "color.accent", borderColor: "color.accent",
                 _hover: { bg: "color.accent-hover" }, _pressed: { bg: "color.accent-active" } },
        label: { color: "color.on-accent" },
      },
      // soft, outline, ghost …
    },
    size: { sm: { root: { height: "size.control-sm", px: "space.3" } } /* md, lg */ },
  },
  compoundVariants: [{ when: { variant: "solid", intent: "danger" }, root: { bg: "color.danger" } }],
  defaultVariants: { variant: "solid", size: "md" },
});
```

- [ ] Property vocabulary: only properties that mean the same thing in CSS and React Native.
  - Layout: `flexDirection`, `alignItems`, `justifyContent`, `flexWrap`, `flexGrow`, `flexShrink`, `alignSelf`, `gap`, `position` (`relative` / `absolute`), `inset`, `overflow`
  - Size: `width`, `height`, `minWidth`, `minHeight`, `maxWidth`
  - Spacing: `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl`, and the same for `m`
  - Paint: `bg`, `color`, `borderColor`, `borderWidth`, `radius`, `opacity`, `shadow`, `ring` (boolean: the focus ring)
  - Text: `text` (a text-style token), `textAlign`, `fontVariantNumeric` (`tabular-nums`)
  - Every element is `display: flex` with `flexDirection: column` by default, matching React Native, so layouts behave the same on web.
- [ ] Values are typed by property: `bg` accepts only colour tokens, `p` only space tokens, `radius` only radius tokens. Numbers are allowed only for `borderWidth`, `opacity`, `flexGrow` and `flexShrink`, plus `0` anywhere.
- [ ] States: `_hover`, `_pressed`, `_focusVisible`, `_disabled`. They're applied in that order, so `_disabled` always wins.
- [ ] Update `tooling/scripts/new-component.ts` (phase 0, step 28) to generate the anatomy from section 0.

**Done when:** type tests prove `bg: "space.2"` and `p: "color.fg"` are errors and the example above compiles. Commit: `feat(core): defineStyles`.

### Step 2 — Web: compile specs to CSS

- [ ] `packages/react/scripts/build-css.ts` runs as part of the package build. It imports every spec from `@unison-ui/core` and writes `dist/styles.css`, wrapped in `@layer components { … }`.
- [ ] Naming: the root is `.u-<component>`, each slot `.u-<component>__<slot>`, and variants are data attributes on the root (`data-variant="solid"`, `data-size="md"`). Slot rules that depend on a variant hang off the root: `.u-button[data-variant="solid"] .u-button__label { … }`.
- [ ] States become selectors:
  - `_hover`: `@media (hover: hover) { .u-x:hover:not([data-disabled]) { … } }`. The media query prevents sticky hover on touch screens.
  - `_pressed`: `[data-pressed]` (set by `usePress` in step 4, not `:active`, so keyboard presses look the same as clicks)
  - `_focusVisible`: `[data-focus-visible]` (set by `useFocusRing`)
  - `_disabled`: `[data-disabled]`
  - `ring: true`: `outline: 2px solid var(--unison-color-ring); outline-offset: 2px`
- [ ] Token values become `var(--unison-…)`, so components follow theme switches with no JavaScript.
- [ ] A base rule for every `.u-*` root: `display: flex; flex-direction: column; box-sizing: border-box; min-width: 0`.
- [ ] Export it: `"./styles.css": "./dist/styles.css"` in `@unison-ui/react`, re-exported as `@unison-ui/ui/styles.css`.
- [ ] Merging classes: root `className` = `cx("u-button", props.className)`. No `tailwind-merge` is needed, because the cascade layer already makes user classes win.
- [ ] Budget: under 8 KB gzipped for the engine's base CSS and the probe.

**Done when:** in the Vite demo, `Probe` rebuilt on `defineStyles` turns red with `className="bg-danger"` and no `!important`, even when `styles.css` is imported **after** Tailwind. Commit: `feat(react): compile style specs to layered css`.

### Step 3 — Native: resolve specs at runtime

- [ ] `useStyles(spec, variants)` in `@unison-ui/native`: resolves token paths against `useTheme().tokens` and returns, per slot, a function `(state) => StyleProp`, where `state` is `{ pressed, hovered, focused, disabled }` from `Pressable`.
- [ ] Cache resolved base and state styles per theme × scheme × variant combination (a `WeakMap` keyed by the theme object, then a `Map` keyed by the variant string), so re-renders allocate nothing new.
- [ ] `text: "text.body"` expands to the theme's ready-made text style (`fontFamily`, `fontSize`, `lineHeight`, `letterSpacing`).
- [ ] `shadow` uses the strategy decided in phase 1, step 10.
- [ ] Overrides: the component's `style` is applied last on the root; `styles={{ label: … }}` per slot.
- [ ] Style parity unit test (`packages/parity/test/style-parity.test.ts`): for every component × variant × state, resolve the spec through the web path (CSS variables resolved via `tokens.json`) and the native path, and assert equal values. This catches drift in milliseconds, before the screenshot parity runs.

**Done when:** the style parity test passes for a test spec covering every property, and a render-count test shows that pressing a native button doesn't re-resolve styles. Commit: `feat(native): style resolver`.

## 2. Interaction foundations

### Step 4 — Pressables on web and native

- [ ] Web: `pnpm --filter @unison-ui/react add react-aria`. In `src/interactions/use-pressable.ts` (`"use client"`), combine `usePress`, `useHover` and `useFocusRing` with React Aria's `mergeProps`. Return `{ pressableProps, state, dataAttributes }`, where `dataAttributes` is `data-pressed`, `data-hovered`, `data-focus-visible` and `data-disabled`, each present only when true. These are what the CSS from step 2 targets.
- [ ] Web disabled and loading rules:
  - `disabled`: real `disabled` attribute on `<button>` (not focusable, not announced as actionable)
  - `loading`: `aria-disabled="true"` + `aria-busy="true"`. It stays **focusable**, so keyboard focus isn't lost when a form submits; presses are ignored.
- [ ] Native: `src/interactions/pressable.tsx` wraps `Pressable`. It maps `disabled` and `loading` to `accessibilityState={{ disabled, busy }}`, sets `accessibilityRole="button"`, turns off `android_ripple` (we draw our own feedback), and passes `{ pressed, hovered, focused }` to the style function from step 3.
- [ ] Use React 19's `ref` as a normal prop throughout. No `forwardRef`.

**Done when:** in a test harness on web, mouse, touch (Playwright `tap`) and keyboard (Enter and Space) all fire `onPress` exactly once and set `data-pressed` while held; a loading button is reachable with Tab but ignores Enter. Commit: `feat: pressable foundations`.

### Step 5 — Platform-only props and `asChild`

- [ ] In `@unison-ui/core/src/platform.ts`, define what each platform adds on top of the shared contract:

```ts
export type WebExtras<Slots extends string> = {
  className?: string;
  classNames?: Partial<Record<Slots, string>>;
  asChild?: boolean;
};
export type NativeExtras<Slots extends string> = {
  style?: StyleProp<ViewStyle>;
  styles?: Partial<Record<Slots, StyleProp<ViewStyle | TextStyle>>>;
  hitSlop?: Insets | number;
};
```

(Native types come from a type-only import of `react-native`, so no runtime code crosses over.)

The phase 0 boundary checker forbids `react-native` in `core`. Teach it to skip `import type` statements, which are erased at build time, and add `react-native` to `core`'s dev dependencies for the types only.

- [ ] Update the contract test from phase 0 (`packages/ui/test/contract.test-d.ts`): web props must equal exactly `XProps & WebExtras<XSlots>`, and native props must equal exactly `XProps & NativeExtras<XSlots>`. Any other difference fails.
- [ ] Web `Slot` (`src/slot.tsx`): when `asChild` is true, render the single child instead of the default element and merge onto it: `className` concatenated, event handlers chained (the child's handler runs first, then ours, unless it calls `preventDefault`), refs composed, other props with the child's winning. Write it yourself (about 60 lines) with tests; that avoids a dependency for one function.
- [ ] `composeRefs(...refs)` utility with tests for callback refs and object refs.

**Done when:** `<Probe asChild><a href="/x">Go</a></Probe>` renders an `<a>` with the probe's classes and press behaviour, and adding a stray web-only prop to the probe's shared props type fails the contract test. Commit: `feat: platform extras and slot`.

## 3. Press feedback and haptics

### Step 6 — `usePressFeedback`

- [ ] Move `MotionBadge` out of the libraries into the demo apps' own code (it was only a phase 0 probe).
- [ ] Web: press feedback is pure CSS, generated from the `press` preset (phase 1, step 13). Components with `feedback: "scale"` in their `*.motion.ts` get `transform: scale(0.97)` on `[data-pressed]`, with `transition: transform var(--unison-duration-80) var(--unison-easing-standard)` on press and the `spring.snappy` easing on release. Inside `@media (prefers-reduced-motion: reduce)` the transform is removed and only the colour state remains.
- [ ] Native: `usePressFeedback({ kind: "scale" })` in `@unison-ui/native` returns `{ onPressIn, onPressOut, animatedStyle }`. It's built on a Reanimated shared value: press-in runs `withTiming(0.97, …)` from the `press` preset; press-out runs `withSpring(1, spring.snappy)`. Everything runs on the UI thread, and the release keeps its velocity, so a quick tap feels springy, not stepped.
- [ ] Both sides honour reduced motion through `useReducedMotion()` and the theme's `motion: "reduced"`.
- [ ] The component wraps its root in `Animated.View` only when feedback is enabled, so static components never pay for Reanimated.

**Done when:** a Playwright test confirms the computed transform is `scale(0.97)` while pressed and `none` with reduced motion emulated; on both simulators the press feels identical to the web (manual side-by-side check). Commit: `feat(motion): press feedback`.

### Step 7 — Haptics

- [ ] `@unison-ui/native/src/haptics.ts`:
  - `haptics.selection()`, `haptics.impact("light" | "medium")`, `haptics.notify("success" | "warning" | "error")`
  - Lazily `require("expo-haptics")` inside a try/catch. If it isn't installed, every call is a no-op, with a one-time dev warning.
  - Declare `expo-haptics` as an optional peer dependency (`peerDependenciesMeta`).
- [ ] Global switch: `<UnisonProvider haptics={false}>` turns all haptics off. Default on.
- [ ] Web: the same `haptics` export, implemented as no-ops. Not `navigator.vibrate`, which is unreliable and often unwelcome.
- [ ] Rule written into `docs/motion.md`: haptics mark the **result** of an action (a toggle flipped, a sheet snapped), not every touch. For buttons, the default is `haptics="none"`; `"light"` is opt-in per button.

**Done when:** with `expo-haptics` installed, a test button produces a light impact on a physical iPhone or Android phone (simulators don't vibrate); with it uninstalled, the app runs and logs the warning once. Commit: `feat(native): haptics`.

## 4. Engine tests and parity

### Step 8 — Engine tests

- [ ] `defineStyles`: type tests for every property family; compile tests that snapshot the generated CSS for the probe spec (base, each variant, compound variants, each state) and check the selector shapes and the `components` layer wrapper.
- [ ] Native resolver: every property type resolves; re-renders return the same style objects (cache hit); state merge order (`_disabled` always wins).
- [ ] Style parity unit test (step 3) over the probe spec **and** a synthetic spec that uses every property once.
- [ ] Web interactions (Vitest + Playwright): mouse, touch and keyboard through `usePressable`; disabled and loading semantics; `Slot` merge rules for `className`, handlers and refs.
- [ ] Native interactions (Jest): accessibility props from the pressable wrapper; pressed, hovered and focused state reaching the style function.
- [ ] Press feedback and haptics (steps 6–7), including reduced motion and the provider's haptics switch.
- [ ] The contract test from step 5 runs for the probe and is written as a reusable helper, so each future component gets it with one line.
- [ ] Coverage over 85% for `core`, `react`, `native` and `motion`.

**Done when:** `pnpm test` passes from the root. Commit: `test: engine tests`.

### Step 9 — Engine parity

- [ ] Static states for fixtures: an internal `unstable_forceState?: { hovered?, pressed?, focusVisible? }` prop that sets the data attributes on web and feeds the style function on native, exported only from `/internal`.
- [ ] Fixtures (× 2 themes × 2 schemes):
  - `probe`: every `tone` × `size` × state (normal, hover, pressed, focus-visible, disabled); cross-platform layout metrics ±1 px, colour at centre ΔE ≤ 3, focus-ring offset ±1 px
  - `kitchen-sink`: a synthetic spec that uses every style property once, so a mapping drift in the CSS compiler or the native resolver is caught before any real component exists

**Done when:** `pnpm test:parity` passes on all four platforms; sabotage (native resolver scaling padding by 1.1; web ring offset set to 1 px) fails with clear reasons. Revert both. Commit: `test(parity): engine fixtures`.

## 5. Registry and CLI

### Step 10 — Registry

- [ ] New private package `packages/registry`. Its build script reads each component's source and writes static JSON:
  - `dist/r/<version>/web/<name>.json` and `dist/r/<version>/native/<name>.json`
  - A copy under `dist/r/latest/…`
  - `dist/r/<version>/index.json` listing every item with its platforms
- [ ] Each file is a valid shadcn `registry-item` (`"$schema": "https://ui.shadcn.com/schema/registry-item.json"`, `type: "registry:ui"`, `dependencies`, `registryDependencies`, `files[].content`). Validate every file against that schema in the build.
- [ ] What an item contains differs by platform, because the platforms style differently:
  - **Web:** `button.tsx`, `button.types.ts` and a generated `button.css` (the layered CSS from step 2 for this component only). The style spec isn't included; on web you edit the CSS directly.
  - **Native:** `button.tsx`, `button.types.ts`, `button.styles.ts` (the spec, resolved at runtime, so editing it just works) and `button.motion.ts`.
  - Internal dependencies (`Spinner`) go in `registryDependencies` and are copied too.
- [ ] Hosting: a `registry.yml` workflow publishes `dist/r` to GitHub Pages on every release: `https://unison-ui.github.io/unison/r/…`. The base URL is a constant in the CLI and can be overridden with `--registry`.

**Done when:** `pnpm --filter registry build` outputs a schema-valid item for the probe on both platforms (marked internal and hidden from listings; real components join as they're built), and in a scratch Next.js project initialised with shadcn, `npx shadcn@latest add <url of web/probe.json>` installs a working copy. Commit: `feat(registry): static shadcn-compatible registry`.

### Step 11 — CLI foundation and project detection

- [ ] Dependencies for `@unison-ui/cli`: `citty` (commands), `@clack/prompts` (prompts), `picocolors`, `nypm` (installs with the detected package manager), `ts-morph` (safe edits to TS/TSX files), `diff` (dry-run output).
- [ ] `src/detect.ts` returns `{ framework, packageManager, tailwind, srcDir, appRouter, typescript }`:
  - framework: `next` in deps → `next`; `expo` → `expo`; `vite` + `react` → `vite`; otherwise stop with a clear message
  - packageManager: from the lockfile (pnpm, npm, yarn, bun)
  - tailwind: `tailwindcss` major ≥ 4 **and** a CSS file containing `@import "tailwindcss"`
- [ ] `unison.json` at the project root (the CLI's own config, like shadcn's `components.json`): `{ framework, registry, componentsDir, classPrefix, ejected: {} }`.
- [ ] Every command supports `--cwd`, `--yes` (accept defaults) and `--dry-run` (print a diff of every file it would change, change nothing).
- [ ] Safe-edit rule: if a file doesn't have the shape the CLI expects (for example a heavily customised `layout.tsx`), it doesn't guess. It prints the exact lines to add by hand and continues.

**Done when:** detection unit tests pass against fixture projects for Next.js (App Router, with and without `src/`), Vite and Expo, each with npm, pnpm and bun lockfiles. Commit: `feat(cli): detection and config`.

### Step 12 — `unison init`

- [ ] Prompts (skipped with `--yes`): accent preset, neutral, radius, and — if Tailwind is detected — strict mode (default **no** in existing projects, so their `bg-blue-500` classes keep working).
- [ ] All frameworks: install `@unison-ui/ui` and `@unison-ui/tokens`; write `unison.config.ts` from the answers; add `"unison:tokens": "unison-tokens build --config unison.config.ts --out .unison"` and run it from `predev` and `prebuild`; add `.unison/` to `.gitignore`; write `unison.json`.
- [ ] Next.js:
  - Global CSS: add `@import "../.unison/tokens.css";`, the Tailwind theme import (if Tailwind is present) and `@import "@unison-ui/ui/styles.css";`, with the relative path computed from the CSS file's location
  - `layout.tsx`: add `suppressHydrationWarning` to `<html>`, `<ThemeScript />` to `<head>` (create `<head>` if missing), and wrap `{children}` in `<ThemeProvider>`
  - Fonts: add the `@fontsource-variable/inter` import
- [ ] Vite: the same CSS imports in the entry CSS; `themeScript()` output into `index.html`'s `<head>`; wrap the root in `<ThemeProvider>` in `main.tsx`.
- [ ] Expo:
  - Install with `npx expo install` so versions match the SDK: `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `expo-haptics`, `expo-font`, `expo-splash-screen`, `@expo-google-fonts/inter`
  - `app/_layout.tsx`: load the Inter faces (phase 1, step 8) and wrap the tree in `<UnisonProvider themes={themes}>`, importing from `.unison/native/theme.js`
  - Native Tailwind setup is **not** done automatically; print a pointer to `docs/tailwind.md`
- [ ] Idempotent: running `init` twice changes nothing the second time and says so.
- [ ] End with a summary: files changed, packages installed, and the next command (`unison add probe`).

**Done when:** on fresh apps from `create-next-app`, `create-vite --template react-ts` and `create-expo-app`, `unison init --yes` produces an app that builds and shows Unison's canvas colour and Inter font; a second run reports "already initialised"; `--dry-run` changes no files. Commit: `feat(cli): init`.

### Step 13 — `unison add` and `unison eject`

- [ ] `unison add <names…>` (package mode, the default):
  - Checks that `@unison-ui/ui` is installed and has the components
  - Installs any extra dependencies the registry item lists for this platform that aren't installed yet (with `npx expo install` on Expo)
  - Prints a ready-to-paste usage snippet per component
  - Unknown names fail with the closest match (`buton` → `button`)
- [ ] `unison eject <name>` (alias: `add <name> --copy`):
  - Fetches the registry item for the **installed** version and platform, and writes its files into `componentsDir/<name>/`, plus its `registryDependencies`
  - Web: renames the class prefix in the copied TSX and CSS from `u-` to `classPrefix` (default `app-`), so the copy never collides with the package's CSS
  - Offers to rewrite imports across the project (`import { Button } from "@unison-ui/ui"` → the local path) with ts-morph, leaving other named imports from the package untouched
  - Records `ejected: { button: "<version>" }` in `unison.json`, for `unison diff` in phase 5
- [ ] Ejected code imports only public APIs (`@unison-ui/core`, `@unison-ui/motion`, `@unison-ui/react` or `@unison-ui/native` hooks). A registry build check fails if an item imports anything internal.

**Done when:** in each fresh app from step 12, `unison add probe` followed by rendering it works; `unison eject probe` produces a local copy that renders identically, and changing its CSS (web) or spec (native) changes only the ejected copy. Commit: `feat(cli): add and eject`.

## 6. CLI in CI, docs and release

### Step 14 — CLI end-to-end tests and the timing script

- [ ] `tooling/scripts/cli-e2e.ts`, for each framework (Next.js, Vite, Expo), in a temp directory **outside** the monorepo:
  1. Create a fresh app with the official creator, untimed
  2. Point it at the locally packed CLI and packages (`pnpm pack` tarballs), so the test uses what would be published
  3. **Start the timer.** Run `unison init --yes`, then `unison add probe`, then render the probe on the home screen with a small codemod
  4. Build: `next build`; `vite build`; `npx expo export --platform web,ios` for Expo (no native compile)
  5. **Stop the timer.** Fail if it's over 120 seconds, and print a per-command breakdown
- [ ] A CI workflow `cli-e2e.yml` that runs nightly and on PRs touching `packages/cli` or `packages/registry`: Ubuntu for Next.js and Vite, macOS for Expo.
- [ ] Package-manager matrix in the nightly run: npm, pnpm and bun for Next.js; npm only for the others.

**Done when:** the script passes locally for all three frameworks and prints times under 120 s; the nightly workflow is green. Commit: `test(cli): end-to-end and timing`.

### Step 15 — Docs and ADRs

- [ ] `docs/cli.md`: `npx @unison-ui/cli init`, `add` and `eject`; what each changes per framework; `unison.json`; `--dry-run`; troubleshooting when a file couldn't be edited automatically.
- [ ] `docs/styling.md`: how `defineStyles` works, the property vocabulary, the cascade-layer override model, and why there's no `tailwind-merge`.
- [ ] `docs/authoring-components.md`: the contributor guide for building a component on the engine — the anatomy from section 0, `defineStyles`, `usePressable`, platform extras and the contract test, press feedback and haptics rules, parity fixtures and registry items, using the probe as the worked example.
- [ ] ADRs: style spec compiled to layered CSS on web and resolved at runtime on native; React Aria for web interactions; `onPress` everywhere (no `onClick`); platform extras and the contract test; haptics as an optional peer; registry format and per-platform items; eject renames the class prefix.

**Done when:** someone can build a small new component on the engine using only `docs/authoring-components.md`, and it passes the contract test and gets a parity fixture. Commit: `docs: phase 2 engine, cli, styling`.

### Step 16 — Release 0.2.0

- [ ] Changesets for every public package (`minor`), including the new `@unison-ui/cli` with its `unison` bin.
- [ ] Snapshot release, then run `cli-e2e.ts` against the **published** snapshot instead of local tarballs.
- [ ] Merge the "Version packages" PR; confirm the `registry.yml` workflow published `r/0.2.0/` and updated `r/latest/`.

**Done when:** `npx @unison-ui/cli@latest init` works in a fresh app from a machine that has never seen the monorepo. Commit: (made by the Changesets bot).

## 7. Final acceptance

### Step 17 — Clean-clone run and the phase 2 gate

Clone into a new folder and go through the list in order, without editing any file.

- [ ] `pnpm install`, `pnpm doctor`, `pnpm check` and `pnpm check:packages` pass
- [ ] `pnpm test:parity` passes on all four platforms for every phase 1 and phase 2 fixture
- [ ] **The roadmap gate:** `tooling/scripts/cli-e2e.ts` passes for Next.js, Vite and Expo against the published `0.2.0`, each under 120 seconds from `init` to a successful build
- [ ] On web, `className` overrides beat engine styles with no `!important`, whatever the CSS import order
- [ ] With density switched to `compact` in a demo app's `unison.config.ts`, the probe's size follows, and parity still passes after `--update`
- [ ] The probe's press feedback, focus ring, keyboard behaviour, haptics and reduced motion work on all four surfaces
- [ ] `unison eject probe` in a fresh app gives an independent copy; the registry for `0.2.0` is live
- [ ] Every new decision has an ADR, and `docs/authoring-components.md` is complete

**When everything passes:** tag `phase-2-complete` and tick the Phase 2 gate in the roadmap tab. Phase 3 adds the form engine on top: field context, the value API and accessible error handling.
