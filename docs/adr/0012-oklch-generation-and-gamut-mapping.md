# 0012. OKLCH colour generation and gamut mapping

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

A theme has to come from one accent choice and still pass contrast, look even across hues, and
render the same on web and native. Hand-picked palettes don't scale to "any brand colour", and
HSL-based ramps vary wildly in perceived lightness from one hue to the next.

## Decision

- Every palette is generated in OKLCH. Each step has a fixed lightness, and its chroma is a
  fraction of the palette's chroma (`src/color/generate-scale.ts`), so `gray`, `accent` and the
  four status palettes line up step for step at any hue.
- The **hex** is gamut-mapped to sRGB with culori `toGamut("rgb", "oklch")`. Native uses it, and
  the web uses it as the fallback. The web also re-declares colour primitives as the **unmapped**
  `oklch()` under `@supports (color: oklch(0 0 0))`.
- A `#hex` seed (`defineTheme({ accent: "#e11d48" })`) takes its hue and chroma from the seed and
  replaces the closest-lightness step, in each scheme's ramp, with the exact seed.
- `oklch()` is written with L to 3, C to 4 and H to 2 decimals (OQ-16).
- OQ-1 option (a): dark step 500 has lightness **0.54** (not 0.52), and light `ring` aliases
  `accent.600`. Together they make every accent preset, the demo brand seed `#e11d48` (OQ-2) and a
  full hue × chroma sweep pass AA. That moves gray dark 500 to `#6d6e75` and accent dark 500 to
  `#545ed5`.

## Alternatives considered

- **HSL or hand-tuned ramps:** uneven perceived lightness across hues, so contrast would need
  per-hue fixes.
- **Emit the mapped colour as `oklch()` on the web:** identical to native, but wide-gamut
  screens lose the richer colour (OQ-10).
- **Leave dark 500 at 0.52:** four presets and the brand seed fail dark `accent` on `surface`
  (2.89–2.96 : 1).

## Consequences

- Any hue builds a coherent theme, and the property test checks monotonic, in-sRGB,
  deterministic scales for random hue and chroma.
- **Browsers clip, they don't gamut-map** (measured in Chromium, Task 21). An out-of-gamut
  `oklch()` renders the per-channel clipped colour: dark `warning.400` `oklch(0.4 0.1377 75)` shows
  `#713700`, while native's mapped hex is `#673d00`. Parity's colour fixture therefore uses 12
  semantic colours that stay within ΔE2000 2 of the hex (OQ-10). WebKit wasn't measured.
- In light mode `ring` and `accent` are the same colour.
