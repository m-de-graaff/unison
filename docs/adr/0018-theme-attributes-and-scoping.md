# 0018. Theme attributes, scoping and `display: contents`

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Apps need light, dark and system, plus named themes, switchable at runtime with no flash on the
web, and scoped to a subtree (a dark card in a light page, a brand panel).

## Decision

- Two attributes, on `<html>` or any element: `data-theme` (`light` | `dark`, always resolved)
  and `data-unison-theme` (name, `default` when absent). `themeScript()` sets both on `<html>`
  before paint from `<key>-scheme` / `<key>-theme` storage. `ThemeProvider` reads them through
  `useSyncExternalStore`, so server render and hydration agree.
- Selectors (OQ-8 adopted): the default light block is
  `:root, [data-unison-theme="default"], [data-theme="light"]`. The dark block is
  `[data-theme="dark"], [data-theme="dark"] [data-unison-theme="default"], [data-unison-theme="default"][data-theme="dark"]`,
  plus `@media (prefers-color-scheme: dark)` on `:root:not([data-theme="light"])` and
  `:root:not([data-theme="light"]) [data-unison-theme="default"]:not([data-theme="light"])`. A named
  theme N gets the same shapes scoped to N (a bare `[data-theme="light"]` in N's list would apply N
  everywhere), including the compound `[N][data-theme="dark"]`.
- **Override blocks declare every token whose resolved value differs from what the inherited
  context provides.** That's not the same as every token whose alias text differs: a `var()` is
  substituted where it's declared, so a nested subtree would otherwise inherit already-resolved
  light values (`color.fg` aliases `gray.950` in both schemes, but `gray.950` differs). Named-theme
  light blocks compare against default light **and** dark, and dark blocks against N-light **and**
  default-dark.
- `ThemeScope` is a `<div style="display: contents">` with both attributes on the web, and a
  nested provider on native (OQ-19: Uniwind's theme is global, so scoped native content uses
  `useTheme().tokens`).

## Alternatives considered

- **Class names** (`.dark`): fine for one dimension, but they collide with app classes and don't
  carry a theme name.
- **A wrapper element with a box:** breaks flex and grid layouts; `display: contents` doesn't.

## Consequences

- `default` tokens.css is about 5.7 KB gzipped, under the 8 KB budget.
- Known edge, unfixed: under OS dark, `<div data-theme="light"><div data-unison-theme="default">`
  renders dark, because the media selector only looks at `:root` and the element itself.
  `ThemeScope` sets both attributes on one element, so it doesn't hit this.
