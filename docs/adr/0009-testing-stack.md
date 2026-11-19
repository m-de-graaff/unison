# 0009. Testing stack

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Shared code, two renderers and four rendering platforms (Chromium, WebKit, iOS, Android) need tests
that catch both logic bugs and drift between platforms.

## Decision

- **Vitest** for `tokens`, `core`, `motion`, `react` and `ui` (jsdom where a DOM is needed), with v8
  coverage reported but not enforced in phase 0.
- **Jest with `jest-expo`** for `native`, since React Native's test tooling is Jest-based.
- **Type tests** (`vitest --typecheck`) for cross-platform contracts: the same `useReducedMotion`
  signature on both platforms, and the same exports and props in both renderers.
- **Parity harness** (`packages/parity`): Playwright (Chromium and WebKit, plus axe) and Maestro
  (iOS, Android) render the same fixtures. Layout metrics are compared across platforms (±1 px),
  screenshots only against per-platform baselines.

## Alternatives considered

- **Jest everywhere:** slower for web and shared code, with weaker ESM support.
- **Detox instead of Maestro:** more setup and tied to the app's test build. Maestro drives release
  builds through deep links.
- **Cross-platform pixel comparison:** font rendering always differs, so it can't be made stable.

## Consequences

- Native parity needs macOS and an Android emulator, so it runs on path-filtered CI jobs.
- Updating baselines is allowed only for intended visual changes, explained in the PR.
