---
"@unison-ui/motion": minor
"@unison-ui/tokens": minor
---

Motion.

- Durations and easings, and springs (`snappy`, `smooth`, `bouncy`) simulated with RK4 and emitted as CSS `linear()`, with a fallback for browsers without `linear()`.
- Presets `fade`, `scale-in`, `slide-up`, `sheet`, `pop` and `press`. Each has enter, exit and reduced-motion variants, and a theme can choose the `snappy`, `smooth` or `reduced` feel.
- `@unison-ui/motion`: `toWaapi()` and `useReducedMotion()` on the web, and `toReanimated()` / `useReanimatedPhase()` from `@unison-ui/motion/reanimated`, with `react-native-reanimated` (>= 4.7.1) as an optional peer.
