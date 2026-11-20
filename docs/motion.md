# Motion

Motion tokens come in three layers: primitive durations, easings and springs; semantic
durations and transitions; and **presets**, which are what components use. Every preset has an
enter, an exit and a reduced-motion variant, and the same values drive the web (Web Animations
API / CSS) and native (Reanimated).

## Durations and easings

| Token | Enter | Exit | Use |
| --- | --- | --- | --- |
| `motion.duration.fast` | 120 ms | 80 ms | Small state changes: hover, toggles, colour |
| `motion.duration.base` | 200 ms | 140 ms | Standard UI: popovers, menus, fades |
| `motion.duration.slow` | 320 ms | 240 ms | Large surfaces: dialogs, sheets (when not spring-driven) |

**Exits run at about 70 % of the matching enter.** Something leaving shouldn't hold attention as
long as something arriving.

| Easing | Curve | Use |
| --- | --- | --- |
| `easing.standard` | `0.2, 0, 0, 1` | Elements moving on screen |
| `easing.enter` | `0.05, 0.7, 0.1, 1` | Elements appearing (decelerate) |
| `easing.exit` | `0.3, 0, 0.8, 0.15` | Elements leaving (accelerate) |
| `easing.linear` | `0, 0, 1, 1` | Opacity-only and reduced-motion fades |

## Springs

| Spring | Stiffness / damping / mass | ζ | Feel | Use for |
| --- | --- | --- | --- | --- |
| `spring.snappy` | 400 / 30 / 1 | 0.75 | Quick, a hint of overshoot | Most enters: popovers, menus, toasts |
| `spring.smooth` | 300 / 35 / 1 | 1.01 | No overshoot | Large surfaces that must not wobble: sheets |
| `spring.bouncy` | 300 / 15 / 1 | 0.43 | Visible overshoot | Playful emphasis only: badges, a "pop" |

On the web a spring becomes a CSS `linear()` easing sampled from an RK4 simulation, plus its
duration (`--unison-spring-snappy` / `--unison-spring-snappy-duration`). Browsers without
`linear()` fall back to `easing.standard`. On native the same `{ stiffness, damping, mass }` goes
to Reanimated's `withSpring`.

## Presets

| Preset | Enter | Exit | Reduced |
| --- | --- | --- | --- |
| `fade` | opacity 0 → 1, `base.enter` + `easing.enter` | → 0, `base.exit` + `easing.exit` | opacity |
| `scale-in` | opacity 0 → 1, scale 0.96 → 1, `spring.snappy` | → opacity 0, scale 0.98, `fast.exit` | opacity |
| `slide-up` | opacity 0 → 1, y 8 → 0, `spring.snappy` | → opacity 0, y 4, `fast.exit` | opacity |
| `sheet` | y 100 % → 0, `spring.smooth` | → y 100 %, `slow.exit` | opacity |
| `pop` | scale 0.9 → 1, `spring.bouncy` | → opacity 0, `fast.exit` | opacity |
| `press` | scale 1 → 0.97, 80 ms `easing.standard` | → 1, `spring.snappy` | none (see below) |

An exit starts from the enter's end values unless it says otherwise.

## Reduced motion

- When the OS asks for reduced motion, every preset except `press` plays its **reduced** variant. That's a
  plain opacity fade: enter 0 → 1 over `motion.duration.fast.enter` (120 ms), exit → 0 over
  `fast.exit` (80 ms), both `easing.linear`. Nothing moves or scales.
- `press` has no reduced variant, so the OS setting leaves its 80 ms scale-to-0.97 in place. It's a
  direct response to a touch, not motion across the screen, and components also show press with
  colour. Only `defineTheme({ motion: "reduced" })` stops it (0 ms).
- On the web, `tokens.css` re-points `--unison-animate-<preset>` (every preset except `press`) to
  the reduced keyframes inside `@media (prefers-reduced-motion: reduce)`, so `animate-scale-in`
  follows the OS with no JavaScript.
- A theme can force it with `defineTheme({ motion: "reduced" })`. `motion: "smooth"` swaps
  `spring.snappy` for `spring.smooth` and stretches timings by 1.2.

## Using presets

```tsx
// Web: Tailwind
<div className="animate-scale-in" />

// Web: imperatively, with the OS reduced-motion setting
import { toWaapi, useReducedMotion } from "@unison-ui/motion";
import { motionPresets } from "../unison/motion.js";
const reduced = useReducedMotion();
element.animate(...toWaapi(motionPresets.default["scale-in"], "enter", { reduced }));

// Native: Reanimated (optional peer react-native-reanimated >= 4.7.1)
import { useReanimatedPhase } from "@unison-ui/motion/reanimated";
const { phase, animate } = useReanimatedPhase(motionPresets.default["scale-in"], "enter");
progress.value = animate(1); // phase.from / phase.to hold the values to interpolate
```
