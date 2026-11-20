# @unison-ui/ui

The public entry of Unison: one import that works on the web and in React Native.

Most apps install only this package and `@unison-ui/tokens`:

```bash
pnpm add @unison-ui/ui @unison-ui/tokens
```

```tsx
import { Box, MotionBadge } from "@unison-ui/ui";
```

`@unison-ui/ui` re-exports `@unison-ui/react` on the web and `@unison-ui/native` in React Native,
picked by the `react-native` export condition, so bundlers choose the right one without
`.web` / `.native` files.

Setup (CSS imports, Expo, testing with `jest-expo`) is in the
[main README](https://github.com/m-de-graaff/unison#using-it).

Exports today: `Box`, `MotionBadge`, `BoxProps`.

> **Preview.** Only `0.0.0-pr…` snapshot builds exist so far; the API will change before `0.1.0`.
> Part of [Unison](https://github.com/m-de-graaff/unison), a design system for React on the web
> and React Native, with motion built in. MIT licensed.
