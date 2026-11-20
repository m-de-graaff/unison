# 0014. WCAG 2 enforced, APCA informational, `autoContrast`

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Themes are built from arbitrary seeds, so contrast can't be checked once by hand. It has to be a
build gate. WCAG 2 is the legal and audit baseline. APCA predicts perceived contrast better but
isn't a standard yet.

## Decision

- 24 pairs (`src/color/contrast-pairs.ts`), checked for every theme × scheme: `fg` and
  `fg-muted` on four backgrounds (4.5), `fg-subtle` on `surface` (3), `on-accent` on
  accent/hover/active (4.5), `accent-fg` and each `<status>-fg` on their subtle background (4.5),
  each `on-<status>` on its fill (4.5), and `border-strong`, `ring` and `accent` on `surface` (3). The
  plan said 27; its own table sums to 24.
- A failing pair stops the build with
  `contrast: theme <t>, scheme <s>, <fg> on <bg> is <r>:1 (needs <min>:1)`.
- APCA Lc (colorjs.io, OQ-13) is computed for every pair and written to `tokens.json` for the
  docs, never enforced.
- `autoContrast` (default on) may only move `on-*` and `*-fg` foregrounds, never backgrounds. It
  steps OKLCH lightness 0.01 away from the background. At a pole (white is already L = 1) it jumps
  to the other pole and steps back, at most 100 steps (OQ-4). A rescue is applied only if one
  colour passes on all of that foreground's backgrounds. It becomes a raw semantic override, added
  after the tier lint (OQ-5), and prints
  `auto-contrast: … adjusted #ffffff → #000000 on color.accent (4.45:1 → 4.72:1)`.

## Alternatives considered

- **APCA enforced:** not yet a standard. Some combinations that pass APCA fail WCAG 2, which
  audits still use.
- **Allowing `autoContrast` to move `accent`/`ring`** (OQ-1 option c): breaks "never touch
  backgrounds", because `accent` is the background for `on-accent`.

## Consequences

- An invalid theme can't ship, and the error names the pair and the fix direction.
- The default theme passes with no adjustments. Its tightest pairs are pinned in tests:
  `border-strong` on `surface` 3.10, `on-success` 4.65, dark `accent` on `surface` 3.33.
- See ADR 0013 for why `on-accent` is effectively never rescued.
