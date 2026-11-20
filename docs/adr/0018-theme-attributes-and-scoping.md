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
- Selectors (OQ-8 adopted, reworked after the phase 1 review). Each theme N gets a light rule, a
  dark rule and a `prefers-color-scheme: dark` rule, in three weights so the nearest element wins:
  - **(0,2,0): the compound on the element itself**, `[data-unison-theme="N"][data-theme="light"]`
    and `[data-unison-theme="N"][data-theme="dark"]`, for every theme, `default` included. It's
    the only selector outside `:where()`, so an element carrying both attributes shows exactly
    that theme × scheme whatever its ancestors are.
  - **(0,1,0): one attribute on the element, the other on a non-root ancestor**, e.g.
    `:where(:not(:root)[data-theme="dark"]) [data-unison-theme="N"]` and
    `:where(:not(:root)[data-unison-theme="N"]) [data-theme="dark"]`. A nearer ancestor beats
    `<html>`.
  - **0 (inside `:where()`)**: the base shapes, `:root` (default light), `[data-theme="light"]`
    and `[data-theme="dark"]` (default), `[data-unison-theme="N"]` (N light), and one attribute
    with the other on `:root` (`:root[data-theme="dark"] [data-unison-theme="N"]`,
    `:root[data-unison-theme="N"] [data-theme="dark"]`). The media rule is
    `:where(:root:not([data-theme="light"]), [data-unison-theme="N"]:not([data-theme]):not([data-theme] *))`:
    the OS setting applies only where neither the element nor an ancestor sets `data-theme`.

  Equal weights fall back to source order (themes in config order, light before dark). App CSS
  that sets a token on `:root` beats the base shapes without `!important`.
- **Override blocks declare every token whose resolved value differs anywhere**, in any theme ×
  scheme, because a scope can sit inside any other theme × scheme. Comparing resolved values (not
  alias text) matters: a `var()` is substituted where it's declared, so a nested subtree would
  otherwise inherit already-resolved values (`color.fg` aliases `gray.950` in both schemes, but
  `gray.950` differs). Only the default light rule declares every token.
- `ThemeScope` is a `"use client"` `<div style="display: contents">` on the web. A missing prop
  takes the nearest scope's or the provider's value, and it always writes both attributes, so it
  hits the compound. Inside it, `useTheme()` returns the scoped `theme` and `resolvedScheme` (the
  setters still change the page), as on native, where it's a nested provider (OQ-19: Uniwind's
  theme is global, so scoped native content uses `useTheme().tokens`). On the server and during
  hydration the provider only knows its defaults, so a scope leaves out an inherited attribute
  until mount and the 0 / (0,1,0) rules take it from `<html>`, which ThemeScript set.

## Alternatives considered

- **Class names** (`.dark`): fine for one dimension, but they collide with app classes and don't
  carry a theme name.
- **A wrapper element with a box:** breaks flex and grid layouts; `display: contents` doesn't.

## Consequences

- `default` tokens.css is about 5.8 KB gzipped (5,776 bytes), under the 8 KB budget.
- `packages/parity/test/cascade.test.ts` renders the nesting cases in Chromium and checks the
  resolved colours.
- An element carrying only one attribute resolves the other from `<html>` or the nearest
  non-root ancestor. If two or more non-root ancestors set that attribute to different values,
  CSS can't tell which is nearer and source order decides. `ThemeScope` writes both attributes,
  so it never depends on this.
