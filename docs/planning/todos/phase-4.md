# Phase 4 — development todo: motion & overlay engine

Same format as before: follow the steps in order, pass each **Done when**, one commit per step. This phase builds the **motion, overlay and gesture engine** that future dialogs, sheets, toasts and menus will use — interruptible velocity-aware springs, `Presence`, portals, one overlay stack, focus and screen-reader isolation, drag and snap helpers — proven through two internal probe overlays. The phase 4 gate holds for the engine: 60 fps on a mid-range Android phone, with reduced motion verified on iOS, Android and web.

## 0. Before you start

### Prerequisites

- [ ] `phase-3-complete` is tagged and `0.3.0` is published.
- [ ] A **physical mid-range Android phone** for the performance gate (for example a Pixel 6a or Galaxy A54 class device). Emulators and flagship phones hide jank, so they don't count.
- [ ] Install [Flashlight](https://github.com/bamlab/flashlight) (following its README) for Android performance measurement in step 12.

### Decisions this phase assumes

Each becomes an ADR in step 16.

| Decision | Default | Why |
| --- | --- | --- |
| Web motion engine (ADR 0006, deferred since phase 0) | **No Motion dependency.** CSS for simple state changes; the Web Animations API (WAAPI) for enter/exit and gestures, with springs as `linear()` easings that include the release velocity | Small bundle; springs already compile to `linear()`; WAAPI animations can be read and interrupted mid-flight |
| Native overlays | A `PortalHost` inside `UnisonProvider` renders overlays at the app root. **Not** React Native's `Modal`. | Gestures inside `Modal` need extra setup, several modals don't stack well, and we need full control over animation and focus |
| Native modal accessibility | iOS: `accessibilityViewIsModal` on the overlay. Android: `importantForAccessibility="no-hide-descendants"` on the app content while an overlay is open. `BackHandler` closes the top overlay. | What `Modal` would have done for us, done explicitly |
| Web modal behaviour | React Aria `FocusScope` (contain + restore), `usePreventScroll` and `ariaHideOutside` | Correct focus trapping, scroll lock (including iOS Safari) and screen-reader isolation |
| Overlay stacking | One overlay stack per app. Escape, Android back and scrim taps close only the **top** overlay. z-index from the layer tokens (phase 1). | Nested overlays must behave |
| Gestures | React Native Gesture Handler + Reanimated worklets on native; pointer events + WAAPI on web; one shared, pure release-resolution function | Same physics and the same decisions on both platforms |

## 1. Motion engine upgrades

### Step 1 — Springs with initial velocity

- [ ] Extend the phase 1 simulator: `simulateSpring(spring, { from, to, velocity })`, with velocity in units per second, sampled until settled. `springToCssLinear` gains the same options and returns a `linear()` easing plus duration for that specific move.
- [ ] Cache generated `linear()` strings by `(spring, rounded velocity / distance ratio)` so dragging doesn't regenerate them every frame.
- [ ] Native needs nothing new: Reanimated's `withSpring(to, { ...config, velocity })` takes the same input.

**Done when:** tests show that a positive initial velocity overshoots further and a negative one starts by moving backwards, matching the analytic solution within 0.005 at 5 sample points. Commit: `feat(tokens): springs with initial velocity`.

### Step 2 — Interruptible `animate()` on web

- [ ] `@unison-ui/motion` web: `animate(element, { to, transition, velocity? }) => { finished: Promise, stop() }`, built on `element.animate()` with `fill: "both"`.
- [ ] Interruption: before starting, read the element's **current** computed transform and opacity (`getComputedStyle`), cancel running animations on the same properties, and start from those values. A half-open dialog that's closed reverses from where it is, without a jump.
- [ ] When an animation finishes, `commitStyles()` then `cancel()`, so the final values live in inline style and no animation objects pile up.
- [ ] Reduced motion handled here centrally: any transform animation becomes an opacity-only fade with `motion.duration.fast` and `easing.linear`.
- [ ] Native counterpart: `toReanimated()` from phase 1 is already interruptible, because Reanimated starts from a shared value's current value.

**Done when:** a Playwright test starts an enter animation, interrupts it at 50% with an exit, and samples the transform every frame: it never jumps by more than one frame's worth of motion. Commit: `feat(motion): interruptible web animate`.

### Step 3 — `Presence`

- [ ] Public contract: `<Presence present={boolean} preset="fade" | "scale-in" | "slide-up" | "sheet" | "pop" onExitComplete?={() => void}>{child}</Presence>`, plus `appear?: boolean` (animate on first mount, default `true`).
- [ ] Behaviour on both platforms: when `present` becomes false, the child stays mounted, plays its exit, then unmounts and calls `onExitComplete`. If `present` turns true again during the exit, the exit reverses into an enter from the current position (steps 1–2).
- [ ] Web: wraps the single child, gets its DOM node through a ref, runs `animate()`; the child gets `inert` during exit so it can't be clicked or focused.
- [ ] Native: wraps the child in an `Animated.View` driven by shared values; `pointerEvents="none"` during exit; unmounting via `runOnJS` after the exit's `withSpring` / `withTiming` callback reports `finished`.
- [ ] Transform origin: an optional `origin` prop (`"top left"`, `"center"`, …) for the `scale-in` preset; popovers pass the side facing their trigger.

**Done when:** unit tests cover mount, unmount, re-entry during exit and reduced motion on both platforms. Commit: `feat(motion): Presence`.

## 2. Overlay infrastructure

### Step 4 — Portals

- [ ] Web: `Portal` renders into a `<div data-unison-portal>` appended to `document.body` once. It copies `data-theme` and `data-unison-theme` from the nearest `ThemeScope`, so a scoped theme reaches its overlays.
- [ ] Native: `UnisonProvider` renders `<PortalHost />` as the last child of a full-screen container wrapping the app. `Portal` registers its children with the host (a small store with `useSyncExternalStore`), keyed and ordered by when they opened. The host is inside the theme and gesture-handler providers, so overlays get both.
- [ ] Overlays inside a `ThemeScope` render with that scope's theme on native too: the portal entry carries the scope's theme and scheme.

**Done when:** an overlay opened inside the brand-dark `ThemeScope` panel from phase 1 renders brand-dark on all four surfaces. Commit: `feat: portals`.

### Step 5 — The overlay stack

- [ ] `useOverlayStack()` (in core, platform-free): `push(id, { modal, onDismiss })` returns `pop()`; `isTop(id)`; `topModal()`.
- [ ] Dismiss routing:
  - Web: one `keydown` listener for Escape at the document level dismisses only the top overlay with a dismiss handler.
  - Native: one `BackHandler` listener does the same and returns `true` so the app doesn't navigate back.
  - Scrim taps dismiss only their own overlay, and only if it's the top one.
- [ ] z-index: `layer.modal` for dialogs and sheets, `layer.toast` for toasts, plus the stack position, so a dialog opened from a sheet sits above the sheet.

**Done when:** with two stacked test overlays (the probes from step 10 work too), Escape (web) or back (Android) closes only the top one, and a second press closes the other. Commit: `feat: overlay stack`.

### Step 6 — Focus, scroll lock and screen-reader isolation

- [ ] Web, `useModalBehaviour(ref, { open })`:
  - React Aria `FocusScope` with `contain` and `restoreFocus`; `autoFocus` on the first focusable element unless an `initialFocus` ref is given
  - `usePreventScroll()` (handles iOS Safari's body-scroll quirks)
  - `ariaHideOutside([ref.current])` so screen readers can't wander behind the overlay
- [ ] Native, the same hook name:
  - iOS: `accessibilityViewIsModal` on the overlay container
  - Android: set `importantForAccessibility="no-hide-descendants"` on the app content container (exposed by `PortalHost`) while any modal overlay is open
  - Move accessibility focus to the overlay's title on open (`AccessibilityInfo.setAccessibilityFocus` on the title's node, after the enter animation starts), and back to the trigger on close
- [ ] Non-modal overlays (toasts) use none of this.

**Done when:** with a modal test overlay open, Tab can't leave it on web; VoiceOver on iOS and TalkBack on Android can't reach content behind it; focus returns to the trigger on close on all four surfaces. Commit: `feat: modal focus and isolation`.

## 3. Gesture engine

### Step 7 — Release resolution (shared)

- [ ] Pure functions in `@unison-ui/core`, shared by both platforms and unit-tested on their own:
  - `projectRelease(position, velocity)` = position + velocity × 0.2 s (a momentum projection)
  - `resolveSnap({ points, position, velocity, dismissAt? })`: the snap point nearest the projection; a fling faster than 1000 px/s always moves at least one point in its direction; returns `{ target: "snap", index } | { target: "dismiss" }` when the projection passes `dismissAt`
  - `rubberBand(overshoot, dimension)` = `(1 − 1 / (overshoot × 0.55 / dimension + 1)) × dimension`, the resistance curve iOS uses for scroll views
- [ ] Snap-point parsing for future sheets and drawers: numbers (px), percentages of the window, and `"content"` (measured, capped at 90%).

**Done when:** table-driven tests cover slow drags, flings, multi-point flings, dismissal thresholds and rubber-banding. Commit: `feat(core): release resolution`.

### Step 8 — Native drag helpers

- [ ] `useDrag({ axis, bounds, snapPoints, onSettle })` in `@unison-ui/native`: a Gesture Handler `Gesture.Pan()` that updates a shared value on the UI thread (worklets only), applies `rubberBand` past the bounds, and on release calls `resolveSnap` as a worklet, then `withSpring(target, { ...spring, velocity })`.
- [ ] Haptics: `selection()` when settling on a different snap point than before.
- [ ] Scroll handover helper `useScrollHandover()`: a Reanimated scroll view tracks its offset in a shared value; the drag only takes over while the content is scrolled to the top and the finger moves toward dismissal (or while below the top snap point). Wired with `Gesture.Native()` and `simultaneousWithExternalGesture`.
- [ ] Keyboard: an optional bottom inset that follows `useAnimatedKeyboard()`.
- [ ] Reduced motion: drags still follow the finger (direct manipulation), but releases settle with a short timing animation instead of a spring.

**Done when:** in a test screen, a draggable panel feels glued to the finger on a physical phone, flicks reach the right snap point, and a scroll view inside hands over at the top. Commit: `feat(native): drag helpers`.

### Step 9 — Web drag helpers

- [ ] `useDrag` with the same options in `@unison-ui/react`: pointer events with `setPointerCapture`; velocity from pointer samples in the last 100 ms (a pause before release counts as zero); release via `resolveSnap`, then `animate()` (step 2) with the velocity-aware `linear()` easing; a new drag during the animation picks up from where it is.
- [ ] Scroll handover on web: a drag on scrollable content starts only if it's at `scrollTop === 0` and the first 6 px of movement go toward dismissal. CSS: `touch-action: none` on handles, `pan-y` on scrollable bodies.
- [ ] Keyboard alternative (WCAG 2.5.7): a helper that turns a focusable handle into a button cycling through snap points.

**Done when:** the same test panel behaves like the native one on iOS Safari and Android Chrome, and works with mouse, trackpad and keyboard on desktop. Commit: `feat(react): drag helpers`.

### Step 10 — Probe overlays

- [ ] Two internal overlays, exported only from `/internal`, that exist purely to exercise the engine:
  - `ProbeOverlay`: a centred modal panel with a scrim, using `Portal`, the overlay stack, modal behaviour (step 6) and `Presence` with the `scale-in` preset
  - `ProbeDrawer`: a bottom panel with snap points, using `useDrag`, scroll handover and the `sheet` preset; dismissible by dragging
- [ ] A "Motion lab" screen in `demo-content`: buttons to open each probe (and to open the overlay from inside the drawer), every `Presence` preset on a test card, a "Reduced" switch, and a "Block JS for 2 s" button (step 12).

**Done when:** both probes open, close, nest and dismiss correctly on all four surfaces, and interrupted open/close never jumps. Commit: `feat: probe overlays and motion lab`.

## 4. Tests

### Step 11 — Engine tests

- [ ] Web (Vitest and Playwright): `Presence` and `animate()` interruption; portals and theme scoping; overlay stack dismissal order; focus containment and restore; scroll lock released after rapid open/close; axe passes with each probe open.
- [ ] Native (Jest with Reanimated's test setup): portal ordering; the Android back handler closes only the top overlay; `importantForAccessibility` toggles on the app content; `resolveSnap` wired to gesture end (Gesture Handler's test utilities).
- [ ] End-to-end with Maestro on both simulators: open the drawer, drag to the top snap, drag closed; open the overlay from inside the drawer and close both with back (Android).
- [ ] Extend `docs/a11y-checks.md` with rows for the probe overlay and drawer (VoiceOver on macOS and iOS, TalkBack), filled in by hand.

**Done when:** all of the above pass and the manual table has no open issues. Commit: `test: motion and overlay engine`.

## 5. Performance and motion quality

### Step 12 — Performance budgets

- [ ] Guardrail first: in development builds, `animate()` (web) and `toReanimated()` (native) throw if asked to animate anything other than `transform`, `opacity` and SVG `strokeDashoffset`. Layout-property animations can never sneak in.
- [ ] Android, the gate device, **release** build:
  - A Maestro flow `perf/engine.yaml` on the Motion lab: open and close the probe overlay 10 times; drag the probe drawer between snap points 10 times and dismiss it; play 20 cards entering with presets at once
  - Run it under Flashlight and record average FPS and frame times
  - Budget: average ≥ 58 fps during the flow, and no single UI-thread frame over 32 ms during an animation or drag
- [ ] The UI-thread proof: press "Block JS for 2 s" in the Motion lab, then drag the drawer. It must still follow the finger and settle, which is only possible if all gesture and animation work runs in worklets.
- [ ] iOS (physical iPhone, if available): Instruments' Animation Hitches template over the same flow; hitch rate under 5 ms/s.
- [ ] Web: Playwright with CPU throttling at 4×, sampling `requestAnimationFrame` timestamps during each preset and a scripted drawer drag. Budget: at most 2 frames over 33 ms per animation. Add it to CI as `perf-web`.
- [ ] Write the numbers into `docs/performance.md` with device, OS version and date.

**Done when:** every budget passes and is documented; the "Block JS" test keeps the drawer responsive. Commit: `perf: overlay budgets and guardrails`.

### Step 13 — Reduced-motion matrix

- [ ] `docs/motion.md` gets the full matrix, and every cell is tested:

| Engine feature | Normal | Reduced (OS setting or `motion: "reduced"`) |
| --- | --- | --- |
| `Presence` presets (`fade`, `scale-in`, `slide-up`, `pop`) | as defined in phase 1 | opacity only, `motion.duration.fast`, linear |
| `sheet` preset | spring from the edge | fade |
| Press feedback | scale 0.97 | colour change only |
| Drag release | spring with release velocity | short timing animation |
| Scrim | fades with position | fades with position (opacity isn't motion) |
| Looping indicators | continuous rotation | opacity pulse |

- [ ] Automated: Playwright with `reducedMotion: "reduce"` inspects `element.getAnimations()` keyframes during each transition and fails if any animate `transform`; native Jest tests with `AccessibilityInfo.isReduceMotionEnabled` mocked to `true` assert the reduced transition configs.
- [ ] Manual: toggle the OS setting on iOS (Reduce Motion), Android (Remove animations) and macOS/Windows (browser follows the OS), and walk the matrix on each. Record the result in `docs/a11y-checks.md`.

**Done when:** automated checks pass and the manual walk-through is recorded with no failures. Commit: `test: reduced motion matrix`.

### Step 14 — Motion-curve parity

Screenshots prove things look the same at rest; this proves they **move** the same.

- [ ] A trace mode, enabled by `UNISON_MOTION_TRACE=1` in parity builds only:
  - Web: `animate()` samples the animated value on each `requestAnimationFrame` and records `(t, progress)`
  - Native: a `useFrameCallback` worklet records the shared value each frame and sends the batch to the parity collector (phase 0) via `runOnJS` when the animation ends
- [ ] An internal `snapTo(index, { velocity })` on `ProbeDrawer`, so tests can start a snap with a known velocity without a real finger.
- [ ] Traced animations: every `Presence` preset, enter and exit, on the probe overlay; drawer open; drawer snap from 0 to 1 with velocity 0 and with velocity −1500 px/s; press feedback.
- [ ] Compare per animation, normalised to progress 0 → 1: the maximum difference between web and native curves is ≤ 0.03, and the settle time differs by ≤ 32 ms.

**Done when:** all traced animations pass across web-chromium, iOS and Android; sabotage (native probe drawer using `spring.snappy` instead of `smooth`) fails with a clear curve-difference report. Commit: `test(parity): motion curves`.

## 6. CLI, docs and release

### Step 15 — Registry and CLI updates

- [ ] Registry items for `presence`, `portal`, `overlay-stack` and the drag helpers, published as building blocks that future overlay components list in `registryDependencies`.
- [ ] `unison init` on Expo now checks that the app root is wrapped in `UnisonProvider` (which includes `GestureHandlerRootView` and the `PortalHost`) and prints a fix if not. Re-running `init` on a phase 3 project adds only what's missing.
- [ ] Extend `cli-e2e.ts`: render the probe overlay, still within 120 seconds.

**Done when:** `cli-e2e.ts` passes on all three frameworks, and an existing phase 3 app upgraded with `init` gets the portal host and nothing else. Commit: `feat(cli): overlays`.

### Step 16 — Docs and ADRs

- [ ] `docs/overlays.md`: portals, the overlay stack, nesting rules, theme scoping with overlays, and modal accessibility on each platform.
- [ ] `docs/motion.md`: add interruption, velocity handoff, the rubber-band curve, the reduced-motion matrix and the performance guardrail.
- [ ] `docs/gestures.md`: the drag helpers, snap resolution and its constants, scroll handover, and the keyboard alternative.
- [ ] `docs/performance.md` from step 12.
- [ ] `docs/authoring-components.md`: a "Building an overlay" chapter using the probe overlay and drawer as worked examples.
- [ ] ADRs: WAAPI instead of Motion (closes ADR 0006); portal host instead of `Modal` on native; native modal accessibility; one overlay stack; release resolution and its constants; the transform/opacity guardrail; motion-curve parity as a test.

**Done when:** someone builds a small new overlay (for example a probe popover) on the engine using only the docs. Commit: `docs: phase 4`.

### Step 17 — Release 0.4.0

- [ ] Changesets (`minor`) for every public package.
- [ ] Snapshot release; run `cli-e2e.ts`, the probe-form scenario and the Flashlight flow against it.
- [ ] Merge the "Version packages" PR; confirm `r/0.4.0/` is live.

**Done when:** `0.4.0` is on npm with provenance, and `npx @unison-ui/cli@latest init` sets up the portal host in a fresh Expo app. Commit: (made by the Changesets bot).

## 7. Final acceptance

### Step 18 — Clean-clone run and the phase 4 gate

Clone into a new folder and go through the list in order, without editing any file.

- [ ] `pnpm install`, `pnpm run doctor`, `pnpm check` and `pnpm check:packages` pass
- [ ] `pnpm test:parity` passes on all four platforms for every fixture from phases 1–4, including the motion-curve traces
- [ ] **The roadmap gate, part 1:** the Flashlight flow on the physical mid-range Android phone averages ≥ 58 fps with no UI-thread frame over 32 ms, and the "Block JS" test keeps the drawer responsive
- [ ] **The roadmap gate, part 2:** the reduced-motion matrix passes, automated and by hand, on iOS, Android and web
- [ ] The probe-form scenario from phase 3 still passes everywhere
- [ ] By hand on each surface: drawer → overlay nesting, closed one at a time with Escape or back; focus and screen-reader isolation hold; interrupted open/close never jumps
- [ ] `perf-web` and `cli-e2e` pass in CI
- [ ] `0.4.0` is on npm; every new decision has an ADR (including the closed ADR 0006)

**When everything passes:** tag `phase-4-complete` and tick the Phase 4 gate in the roadmap tab. Phase 5 is the ecosystem and v1.0 of the engine: theme presets, icons, the docs site, the theme builder, the CLI's remaining commands and the audit.
