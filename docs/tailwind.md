# Tailwind v4 and Uniwind

`@unison-ui/tokens` writes three Tailwind files. Variable names are `--unison-*` (see `tokens.css`);
the theme files map Tailwind's namespaces onto them.

| File | Export | For |
| --- | --- | --- |
| `dist/web/theme.css` | `@unison-ui/tokens/theme.css` | Web, Tailwind's defaults plus Unison |
| `dist/web/theme-strict.css` | `@unison-ui/tokens/theme-strict.css` | Web, Unison only (the demo apps use this) |
| `dist/native/theme.css` | `@unison-ui/tokens/native-theme.css` | Native (Uniwind), literal values |

Import `tailwindcss`, then `tokens.css`, then one theme file:

```css
@import "tailwindcss";
@import "@unison-ui/tokens/tokens.css";
@import "@unison-ui/tokens/theme-strict.css";
```

## Namespaces

All mappings sit in `@theme inline`, so classes follow runtime theme switches
(`--color-surface: var(--unison-color-surface)`).

| Tailwind namespace | From | Example class |
| --- | --- | --- |
| `--color-*` | Semantic colours and primitive palettes | `bg-surface`, `text-fg-muted`, `bg-accent-hover`, `bg-gray-100` |
| `--font-*` | `font-family.sans`, `.mono` | `font-sans`, `font-mono` |
| `--text-*` (+ `--line-height`, `--letter-spacing`, `--font-weight`) | Typography styles | `text-body`, `text-title-lg` |
| `--radius-*` | Radius primitives, `control`, `card`, `overlay`, `pill` | `rounded-card` |
| `--shadow-*` | `xs` to `xl`, plus `raised`, `popover`, `overlay` (from `--unison-elevation-*`) | `shadow-popover` |
| `--spacing` | `space.1` (4px base) | `p-4`, `gap-6` |
| `--ease-*` | Easings, and springs as `ease-spring-<name>` | `ease-enter`, `ease-spring-snappy` |
| `--animate-*` | Motion presets, each with an `-out` variant | `animate-scale-in` |
| `--breakpoint-*` | Breakpoints, as literals in a separate non-inline `@theme` | `md:flex-row` |

Breakpoints are literal (`--breakpoint-md: 768px`) because Tailwind uses them in media queries,
where `var()` does not work.

## Strict and non-strict

`theme.css` adds Unison's tokens next to Tailwind's defaults, so `bg-blue-500` still compiles.

`theme-strict.css` first resets the colour, radius, shadow, font and text namespaces
(`--color-*: initial;` and so on). Only system tokens exist, and off-system classes such as
`bg-blue-500` compile to nothing. Spacing, breakpoints, easings and animations keep Tailwind's
defaults alongside the system's.

## Native (Uniwind)

Uniwind cannot resolve the `var(--unison-*)` chain, so `dist/native/theme.css` carries literal
values: colours per `@variant light` / `@variant dark`, plus radius, spacing and text sizes in a
static `@theme`.

Named themes are emitted as `@variant <name>-light` and `@variant <name>-dark` (OQ-19). **This is a
hypothesis and unverified on device**; no theme besides `default` exists until Task 18, and only a
unit test with a second theme covers the output.

### Verification status (OQ-14)

**Native class check: unverified, needs Mark.** No simulators were available. Still to check on iOS
and Android: `bg-surface`, `text-fg-muted`, `rounded-card`, `text-body`, `p-4`.

Families likely unsupported on native, also unverified:

- `shadow-*`: React Native has no `box-shadow` string on every version and platform; use the
  `shadow` objects in the native theme.
- `animate-*`: CSS keyframe animations do not exist on native; use the Reanimated presets from
  `@unison-ui/motion`.
