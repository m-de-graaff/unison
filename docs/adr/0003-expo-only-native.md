# 0003. Native support: Expo only for v1

- **Status:** Accepted (confirmed by Mark on 2026-11-19)
- **Date:** 2026-11-19

## Context

concept.md describes the native target as "Expo, bare", and left "Expo only, or bare React Native
too?" open. Supporting bare React Native means testing a second toolchain (manual native setup,
no Continuous Native Generation, no `expo install` version alignment) for every release.

## Decision

v1 supports **Expo only**. The demo app, the parity harness and CI use Expo (SDK 58 at the time of
writing) with development and release builds. Bare React Native is not tested.

## Alternatives considered

Supporting bare React Native too: wider reach, but roughly doubles the native test matrix while the
engine is still being built.

## Consequences

- Native dependencies follow Expo's pinned versions (`npx expo install`), and Renovate leaves them
  alone (docs/expo-upgrade.md).
- Bare React Native may work, since the packages use only React Native APIs, but nobody promises it
  until a later ADR adds it to the test matrix.
