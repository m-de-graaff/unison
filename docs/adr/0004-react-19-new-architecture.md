# 0004. Minimum versions: React 19 and the New Architecture only

- **Status:** Accepted (confirmed by Mark on 2026-11-19)
- **Date:** 2026-11-19

## Context

Supporting React 18 and the old React Native architecture would mean more code paths (no `ref` as a
prop, no `use`, different Fabric behaviour) and a larger test matrix.

## Decision

- Every library has `react >=19` as a peer dependency.
- `@unison-ui/native` requires `react-native >=0.88` (Expo SDK 58), and only the **New
  Architecture** is supported; nothing in the demo app turns it off.

## Alternatives considered

Supporting React 18 and the old architecture: a larger audience today, at the cost of complexity
that the roadmap explicitly wants to avoid.

## Consequences

- Simpler renderers and motion code (React Native 0.88 renders `View` as a function component whose
  ref is a `HostInstance`).
- Projects on React 18 or the old architecture can't adopt Unison until they upgrade.
