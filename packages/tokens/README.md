# @unison-ui/tokens

Design tokens for Unison and the compiler that turns them into CSS variables, a Tailwind v4 theme and a typed React Native theme.

```bash
pnpm add @unison-ui/tokens
```

Web: import the compiled CSS in your global stylesheet. `theme.css` maps the tokens onto
Tailwind v4, so classes like `bg-accent` work:

```css
@import "tailwindcss";
@import "@unison-ui/tokens/tokens.css";
@import "@unison-ui/tokens/theme.css";
```

React Native with [Uniwind](https://uniwind.dev): import `@unison-ui/tokens/native-theme.css`.

| Entry | What it is |
| --- | --- |
| `@unison-ui/tokens/tokens.css` | CSS variables (`--unison-*`), light and dark |
| `@unison-ui/tokens/theme.css` | Tailwind v4 `@theme` mapping |
| `@unison-ui/tokens/native-theme.css` | Literal colours for Uniwind on native |
| `@unison-ui/tokens/native` | Typed native theme (`UnisonTheme`) |
| `@unison-ui/tokens/spring` | `simulateSpring`, `springToCssLinear` |
| `@unison-ui/tokens` | Compiler API (`compile`, `wcagRatio` (also exported as `contrastRatio`), …) |
| `unison-tokens build` | CLI that compiles the token source |

> **Preview.** Only `0.0.0-pr…` snapshot builds exist so far; the API will change before `0.1.0`.
> Part of [Unison](https://github.com/m-de-graaff/unison), a design system for React on the web
> and React Native, with motion built in. MIT licensed.
