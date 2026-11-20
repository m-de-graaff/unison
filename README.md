# Unison

[![npm](https://img.shields.io/npm/v/@unison-ui/ui?label=npm)](https://www.npmjs.com/package/@unison-ui/ui)
[![CI](https://github.com/m-de-graaff/unison/actions/workflows/ci.yml/badge.svg)](https://github.com/m-de-graaff/unison/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

One design system for React on the web (Next.js, Vite) and React Native (Expo), with motion
built in.

Components look finished on install and can be customised all the way down. One token source
compiles to CSS variables, a Tailwind v4 theme and a typed native theme. A screenshot parity
harness renders every component on web (Chromium and WebKit), iOS and Android and fails the
build when they drift apart.

> **Status: early.** Unison is built in six phases (0–5); this is the end of phase 0, the
> foundation. In place: the monorepo, the token compiler, the platform split, three demo apps,
> the parity harness and CI. There are no real components yet (only `Box` and `MotionBadge`,
> which prove the pipeline). The packages are on npm as preview builds (`0.0.0-pr…`); expect
> breaking changes until the first release, `0.1.0`.
> See the [roadmap](docs/planning/roadmap.md).

## Packages

| Package | npm | What it is |
| --- | --- | --- |
| [`@unison-ui/ui`](packages/ui) | [npm](https://www.npmjs.com/package/@unison-ui/ui) | The public entry. Re-exports the web or the native renderers, picked by the `react-native` export condition, so one import works everywhere |
| [`@unison-ui/tokens`](packages/tokens) | [npm](https://www.npmjs.com/package/@unison-ui/tokens) | Design tokens in DTCG JSON and the compiler that turns them into CSS variables, a Tailwind v4 theme and a typed native theme |
| [`@unison-ui/core`](packages/core) | [npm](https://www.npmjs.com/package/@unison-ui/core) | Platform-free props types, state hooks and style specs |
| [`@unison-ui/motion`](packages/motion) | [npm](https://www.npmjs.com/package/@unison-ui/motion) | Springs (compiled to CSS `linear()` on web) and reduced-motion support |
| [`@unison-ui/react`](packages/react) | [npm](https://www.npmjs.com/package/@unison-ui/react) | Web renderers |
| [`@unison-ui/native`](packages/native) | [npm](https://www.npmjs.com/package/@unison-ui/native) | React Native renderers |

All packages are ESM only. The component packages need React 19, and on native Expo with the New
Architecture
([ADR 0003](docs/adr/0003-expo-only-native.md), [ADR 0004](docs/adr/0004-react-19-new-architecture.md)).

## Using it

Install the public entry and the tokens:

```bash
pnpm add @unison-ui/ui @unison-ui/tokens
```

These are preview builds, so pin the exact version you test with. Every published version is
built in GitHub Actions with [npm provenance](https://docs.npmjs.com/generating-provenance-statements),
except the first snapshot, `0.0.0-pr7-20261120101000`. To try a pull request's build, label the PR
`snapshot`; CI publishes it under a `pr<n>` tag and comments the install command
(`pnpm add @unison-ui/ui@pr<n> @unison-ui/tokens@pr<n>`).

**Web (Next.js or Vite).** Import the tokens in your global CSS. `theme.css` is only needed if you
use Tailwind classes such as `bg-accent`:

```css
@import "tailwindcss";
@import "@unison-ui/tokens/tokens.css";
@import "@unison-ui/tokens/theme.css";
```

**Native (Expo).** Components read the typed theme, so they need no CSS. For Tailwind classes in
your own app code, set up [Uniwind](https://uniwind.dev) and import the native theme:

```css
@import "tailwindcss";
@import "uniwind";
@import "@unison-ui/tokens/native-theme.css";
```

The packages are ESM only. If you test with `jest-expo`, add `@unison-ui` to the packages Jest
transforms:

```json
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unison-ui/.*))"
  ]
}
```

Then, on either platform:

```tsx
import { Box, MotionBadge } from "@unison-ui/ui";

export function Demo() {
  return (
    <>
      <Box />
      <Box tone="neutral" />
      <MotionBadge />
    </>
  );
}
```

Dark mode follows the system setting. On web, setting `data-theme="light"` or `data-theme="dark"`
on `<html>` overrides it.

## Developing

You need Node 26 (see `.nvmrc`) and pnpm through Corepack. The iOS parts need a Mac with Xcode;
Android needs Android Studio and an emulator. [CONTRIBUTING.md](CONTRIBUTING.md) has the full
setup, including the parity devices.

```bash
pnpm install
pnpm run doctor
pnpm dev
```

`pnpm dev` starts every package watcher plus the Next.js app (http://localhost:3000), the Vite app
(http://localhost:5173) and Metro for the Expo app. Edit a token in
`packages/tokens/tokens/base.json` and both web apps update without a restart; Metro rebuilds
the Expo bundle at the same time.

| Command | What it does |
| --- | --- |
| `pnpm check` | Lint (Biome and import boundaries), typecheck, unit tests, build |
| `pnpm check:packages` | `publint` and `attw` on every published package |
| `pnpm test:parity` | Parity harness on web, iOS and Android (`--platform web` for web only) |
| `pnpm dev:web` / `pnpm dev:mobile` | Only the web apps, or only Metro, with the packages they use |

## Repository layout

```
apps/        web-next, web-vite, mobile: demo apps, which also host the parity screens
packages/    the libraries above, plus private demo-content and parity
tooling/     shared tsconfig presets and scripts (doctor, boundary check, generators)
docs/        architecture, ADRs, planning and plans
```

## Docs

- [Concept](docs/planning/concept.md): what Unison is for and how it's built
- [Roadmap](docs/planning/roadmap.md): the six phases and their gates
- [Component catalogue](docs/planning/component-catalogue.md): what's coming
- [Architecture](docs/architecture.md): package graph, import rules, how a token becomes a pixel
- [Decisions](docs/adr/): one ADR per architectural decision
- [Contributing](CONTRIBUTING.md): setup, commands, parity devices, releases

## License

[MIT](LICENSE)
