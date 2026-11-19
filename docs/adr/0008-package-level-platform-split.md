# 0008. Platform split at package level

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Web and native renderers must share props, state and style specs but differ in what they render.
React Native's usual tool for this is per-file extensions (`.web.tsx` / `.native.tsx`), which every
bundler resolves differently and which leak into package builds.

## Decision

Split by **package**, not by file extension:

- Platform-free code (props types, state hooks, style and motion specs) lives in `@unison-ui/core`
  and `@unison-ui/motion` (`src/shared`).
- `@unison-ui/react` and `@unison-ui/native` hold only renderers, with identical export names.
- `@unison-ui/ui` re-exports one of them through `exports` conditions: `react-native` →
  `dist/native.js`, `browser` / `default` → `dist/web.js`. A top-level `"react-native"` field covers
  tools that ignore `exports`.
- `@unison-ui/motion` uses the same conditions for its two builds.

An import-boundary check (`tooling/scripts/check-boundaries.ts`, part of `pnpm lint`) stops
platform code leaking into the wrong package, and a contract type test (`packages/ui/test`) fails
when the two renderers' exports or props drift apart.

## Alternatives considered

Per-file platform extensions inside one package: fewer packages, but fragile across Next.js, Vite,
Metro and tsdown, and harder to check.

## Consequences

- Both renderers must export exactly the same names with the same props; CI enforces it.
- `@unison-ui/ui` serves both platforms from the web `.d.ts`, which is safe only because the
  signatures are identical.
