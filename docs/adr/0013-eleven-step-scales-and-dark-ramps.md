# 0013. Eleven-step scales and separate dark ramps

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Semantic colours need enough steps to express surfaces, borders, fills and text in both schemes.
Dark mode made by inverting the light scale makes fills too bright and surfaces too flat.

## Decision

- 11 steps, `50`–`950`, named like Tailwind so classes feel familiar.
- Each palette gets a **separately generated dark ramp**. Lightness rises from 50 to 950, and
  chroma is 90 % of light. Semantic colours alias different steps per scheme
  (`semantic/color.light.json` / `color.dark.json`). Solid fills sit lower in dark mode, so white
  text keeps 4.5:1 while the fill still reads as UI against `surface`.
- Every semantic colour must exist in both files (tier lint).

## Alternatives considered

- **Inverting the light scale:** cheap, but the contrast relationships come out wrong in dark.
- **Fewer steps (9):** too few between `surface` and `border-strong` for subtle hover and
  pressed states.

## Consequences

- `autoContrast` (ADR 0014) can only rescue a foreground that works on all of its backgrounds.
  `on-accent` must pass on `accent`, `accent-hover` and `accent-active`, and hover and active are
  darker steps, so whatever rescues `accent` fails on them. A search over 1,440 seeds found none
  that builds with an `on-accent` warning. **Owner decision:** keep the rule, prove the rescue
  with unit tests on a hand-built token map, and drop the todo's "a custom seed passes with a
  printed warning" Done-when clause (OQ-3).
- Single-background foregrounds (`*-fg` on `*-subtle`) can still be rescued, and a test covers it.
