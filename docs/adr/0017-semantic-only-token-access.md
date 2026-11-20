# 0017. Semantic-only token access, enforced by types

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Components that reach for primitives (`color.gray.500`) break theming: a theme only changes what
the semantic layer points at. The rule has to hold without review discipline.

## Decision

- `token(theme, path)` (native) and `cssVar(path)` (web) accept only `SemanticTokenPath`, a union
  generated into `types.d.ts`. `SemanticTokenValues` maps each path to its value type
  (`"text.body": NativeTextStyle`, `"radius.card": number`, `"color.fg-muted": string`).
  `token(theme, "color.gray.500")` is a type error, and a `test-d` file pins it.
- OQ-7: the native theme object uses **flat groups** keyed by the rest of the path joined with
  `-` (`color["accent-600"]`, `color.accent`, `motion.duration["fast-enter"]`), because
  `color.accent` and `color.accent.600` can't both live in a nested object. One function,
  `nativeKey(path)` in browser-safe `paths.ts`, maps paths for the emitter and for `token()`, so the
  two can't disagree.

## Alternatives considered

- **A lint rule:** easy to bypass and invisible in editors.
- **Nested native objects:** they collide (`color.accent` vs `color.accent.600`).

## Consequences

- OQ-17: space, z-index and breakpoints are primitive-only, so `token(theme, "space.4")` is a
  type error. Phase 2's `defineStyles` needs a typed route to spacing.
- The demo Box uses `size.demo-box` and `radius.card` (OQ-11).
