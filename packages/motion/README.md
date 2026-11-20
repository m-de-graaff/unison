# @unison-ui/motion

Motion helpers for Unison: springs and reduced-motion support for the web and React Native.

```bash
pnpm add @unison-ui/motion
```

| Export | What it does |
| --- | --- |
| `useReducedMotion()` | `true` when the user asked for reduced motion (`prefers-reduced-motion` on the web, the OS setting on native) |
| `simulateSpring` | Simulate a spring (`stiffness`, `damping`, `mass`): returns `{ durationMs, samples }` |
| `springToCssLinear` | The same spring as a CSS `linear()` easing: returns `{ easing, durationMs }` |

The right implementation is picked per platform through export conditions.

> **Preview.** Only `0.0.0-pr…` snapshot builds exist so far; the API will change before `0.1.0`.
> Part of [Unison](https://github.com/m-de-graaff/unison), a design system for React on the web
> and React Native, with motion built in. MIT licensed.
