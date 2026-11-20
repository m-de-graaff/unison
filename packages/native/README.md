# @unison-ui/native

The React Native renderers for Unison components (Expo, New Architecture).

You normally install [`@unison-ui/ui`](https://www.npmjs.com/package/@unison-ui/ui) instead,
which re-exports this package in React Native.

```bash
pnpm add @unison-ui/native
```

Exports today: `Box`, `MotionBadge`, `BoxProps`. Components read the typed theme from
`@unison-ui/tokens/native` and follow the system colour scheme; no CSS needed.

Requires React 19 and React Native 0.88+ (Expo SDK 58) on the New Architecture.

> **Preview.** Only `0.0.0-pr…` snapshot builds exist so far; the API will change before `0.1.0`.
> Part of [Unison](https://github.com/m-de-graaff/unison), a design system for React on the web
> and React Native, with motion built in. MIT licensed.
