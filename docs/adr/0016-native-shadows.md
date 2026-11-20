# 0016. Native shadows through `boxShadow`

- **Status:** Proposed
- **Date:** 2026-11-20

## Context

The tokens define five shadows (`shadow.xs` … `shadow.xl`) as layered CSS shadows, plus a dark
variant with every alpha × 2.5 (capped at 0.5). The web uses them as `box-shadow`. React Native
on the New Architecture supports a `boxShadow` style prop that takes the same CSS string, which
would let one value serve both platforms. Older React Native shadows are platform-specific:
`shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius` on iOS, and a single
`elevation` number on Android.

## Decision

The native theme carries each shadow as its CSS string, `theme.shadow.<size>`, and renderers pass
it to `boxShadow`.

This only becomes Accepted once a spike has been checked on devices: five `View`s with
`style={{ boxShadow: theme.shadow.<size> }}` on `canvas`, on the iOS Simulator and the Android
emulator. **Spike result: not run yet, unverified, needs Mark.** The phase 1 build container has
no simulators.

If the spike fails on either platform, the fallback is already written:
`legacyShadow(layers, size)` in `@unison-ui/tokens` derives iOS `shadow*` props from the largest
layer (`shadowRadius` = blur / 2) and Android `elevation` (xs 1, sm 2, md 4, lg 8, xl 12). The
native emitter would then also output `shadow.<size>-legacy`, and renderers would use one
`shadowStyle(theme, size)` helper in `@unison-ui/native`.

## Alternatives considered

- **Legacy shadow props only.** They work on every React Native version, but Android's
  `elevation` can't express colour, offset or multiple layers, so the platforms would look
  different.
- **Rendered shadow images or SVG.** These match pixel for pixel, but they're expensive, can't
  animate, and add a dependency.

## Consequences

- One shadow definition serves web and native, and the dark variant is derived in the compiler,
  so the geometry can't drift.
- If the spike fails, renderers need the `shadowStyle()` helper, and Android shadows become an
  approximation that parity screenshots must allow for.
