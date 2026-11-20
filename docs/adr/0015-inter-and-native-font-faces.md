# 0015. Inter as the default font, and the native font-face map

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Text should look the same on four surfaces. Android chooses a weight by font file, not by
`fontWeight`, and some Android versions render a custom face plus `fontWeight` wrongly. React
Native's `lineHeight` only takes absolute values.

## Decision

- Inter (UI) and JetBrains Mono (code). On the web, the variable fonts from `@fontsource-variable`;
  on native, static faces from `@expo-google-fonts`. Apps load the fonts; the packages never
  bundle them.
- Line heights are absolute pixels, and tracking is authored in `em` and converted to px on native
  (`title-lg`: 24 × −0.02 = −0.48).
- `nativeFonts` maps family × weight → face name (`Inter_600SemiBold`). Native text styles carry
  that `fontFamily` and **no** `fontWeight`.
- `letter-spacing.*` primitives are `number` tokens in em: the todo gives no em type, and
  `dimension` only allows px and rem. The resolver turns them into `{ value, unit: "em" }` inside a
  typography composite.

## Alternatives considered

- **System fonts:** zero cost, but different metrics on every platform, which breaks parity.
- **`fontWeight` with a single family:** renders the wrong weight on some Android versions.

## Consequences

- A brand font means changing `fonts.sans` and `fonts.nativeFonts` and loading the files
  ([fonts.md](../fonts.md)).
- Web check: Chromium renders the bundled variable Inter (`isCustomFont: true`). The native
  fallback and distinct weights are unverified on device.
