# @unison-ui/motion

## 0.1.0

### Minor Changes

- d0e3169: Motion.
  
  - Durations and easings, and springs (`snappy`, `smooth`, `bouncy`) simulated with RK4 and emitted as CSS `linear()`, with a fallback for browsers without `linear()`.
  - Presets `fade`, `scale-in`, `slide-up`, `sheet`, `pop` and `press`. Each has enter, exit and reduced-motion variants, and a theme can choose the `snappy`, `smooth` or `reduced` feel.
  - `@unison-ui/motion`: `toWaapi()` and `useReducedMotion()` on the web, and `toReanimated()` / `useReanimatedPhase()` from `@unison-ui/motion/reanimated`, with `react-native-reanimated` (>= 4.7.1) as an optional peer.

### Patch Changes

- Updated dependencies [d0e3169]
- Updated dependencies [d0e3169]
  - @unison-ui/tokens@0.1.0
