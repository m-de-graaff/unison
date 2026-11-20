# Theming

One `unison.config.ts` per app defines its themes. `unison-tokens build` compiles it into a
`unison/` folder of CSS variables, Tailwind themes and a typed native theme. A small runtime
switches between themes and colour schemes without a reload.

Without a config the packages ship the default theme (`@unison-ui/tokens/tokens.css` and so on),
so an app that doesn't customise anything needs none of this.

## 1. Install

```bash
pnpm add @unison-ui/ui @unison-ui/tokens
```

`@unison-ui/ui` is the public entry point: on the web it resolves to the React DOM renderers, in
React Native to the native ones. `@unison-ui/tokens` holds the compiler (`unison-tokens`).

## 2. Write `unison.config.ts`

At the app's root:

```ts
import { defineConfig, defineTheme } from "@unison-ui/tokens";

export default defineConfig({
  themes: {
    default: defineTheme({ accent: "indigo" }),
    brand: defineTheme({ extends: "default", accent: "#e11d48", radius: "lg" }),
  },
  defaultTheme: "default",
});
```

### `defineTheme` options

| Option | Values | Default |
| --- | --- | --- |
| `accent` | A preset: `indigo`, `violet`, `blue`, `teal`, `green`, `orange`, `rose`. A seed colour `"#rrggbb"`, which is placed exactly in the generated scale. Or `{ hue, chroma }` in OKLCH | `"indigo"` |
| `neutral` | `gray` (tinted with the accent's hue), `neutral` (no tint), `slate`, `warm` | `"gray"` |
| `radius` | `none`, `sm`, `md`, `lg`, `full`: how round controls, cards and overlays are | `"md"` |
| `density` | `compact`, `default`, `comfortable`: control heights (`size.control-*`) | `"default"` |
| `motion` | `snappy`, `smooth` (softer springs, timings × 1.2), `reduced` (always the reduced variants) | `"snappy"` |
| `autoContrast` | `true` / `false`. When a text colour (`on-*`, `*-fg`) misses WCAG AA, nudge its lightness until it passes, and print a warning | `true` |
| `fonts` | `{ sans?, mono?, nativeFonts? }`: CSS font-family lists, and the native face per weight (see [fonts.md](fonts.md)) | Inter and JetBrains Mono |
| `overrides` | `{ "<semantic token>": "{alias}" }`, e.g. `{ "color.ring": "{color.accent.400}" }`. Only semantic tokens, and only aliases | none |
| `extends` | The name of another theme in the same config | none |

Mistakes fail the build with the nearest valid option (`radius: "medium"` → `did you mean "md"?`).
So do colours that miss WCAG 2 AA (4.5:1 for text, 3:1 for UI), naming the theme, scheme, pair and
ratio. See [ADR 0014](adr/0014-wcag-enforced-apca-informational.md).

### Named themes and `extends`

Every key in `themes` is a theme. Names use `a-z`, `0-9` and `-`. `default` is required: it's the
base theme the others are compared against, and the one `:root` gets. `extends` copies another
theme's options, and the child's keys win. `overrides` and `fonts` merge per key.

## 3. Generate the `unison/` folder

Add scripts that build the tokens before anything else uses them. Don't rely on `pre*` scripts:
pnpm 12 doesn't run them. Chain the build explicitly:

```json
{
  "scripts": {
    "tokens": "unison-tokens build --config unison.config.ts --out unison",
    "dev": "concurrently --kill-others \"unison-tokens build --watch --config unison.config.ts --out unison\" \"next dev\"",
    "build": "pnpm tokens && next build",
    "typecheck": "pnpm tokens && tsc --noEmit"
  }
}
```

(`pnpm add -D concurrently` for `dev`. Swap `next dev` / `next build` for `vite` / `vite build` or
`expo start`.) With `--watch`, edits to `unison.config.ts` reach the running app without a
restart.

Ignore the generated folder: add `unison/` to `.gitignore`. Use a plain folder name, not a
dot-folder: Next's dev server doesn't pick up edits inside a gitignored dot-folder.

`unison/` holds `web/tokens.css`, `web/theme.css`, `web/theme-strict.css`, `native/theme.js` (+
`.d.ts`), `native/theme.css`, `motion.js`, `types.d.ts` and `tokens.json`.

## 4. Web: Next.js

Replace the generated `app/globals.css` (`create-next-app`'s `:root` / `body` colour styles would
fight the tokens). Paths are relative to the CSS file:

```css
@import "tailwindcss";
@import "../unison/web/tokens.css";
@import "../unison/web/theme.css"; /* or theme-strict.css: Unison's tokens only */
```

`app/layout.tsx` (keep your `metadata` and font setup; add the two Unison pieces):

```tsx
import { ThemeProvider, ThemeScript } from "@unison-ui/ui";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // ThemeScript sets attributes on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider themes={["default", "brand"]}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

Then use the tokens: `<main className="bg-surface text-fg">`, `bg-accent text-on-accent`,
`rounded-card`, `shadow-popover`, `text-title`. The full list is in [tailwind.md](tailwind.md) and
[tokens.md](tokens.md).

`ThemeScript` runs before first paint. It reads the stored choice and sets `data-theme`
(`light` or `dark`, with `system` already resolved) and `data-unison-theme` on `<html>`, so the
page never flashes the wrong theme. `ThemeProvider` reads those attributes, so the server render
and hydration agree.

## 5. Web: Vite

Import the CSS from your entry stylesheet as above (e.g. `@import "../unison/web/tokens.css";`
from `src/index.css`). Put the theme script into `index.html` with a plugin, so it can't go stale:

```ts
// vite.config.ts
import { themeScript } from "@unison-ui/ui";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // …react(), tailwindcss()…
    {
      name: "unison-theme-script",
      transformIndexHtml: () => [{ tag: "script", children: themeScript(), injectTo: "head-prepend" }],
    },
  ],
});
```

Wrap the app in `<ThemeProvider themes={["default", "brand"]}>` in `main.tsx`.

## 6. Switching on the web

```tsx
"use client";
import { useTheme } from "@unison-ui/ui";

export function SchemeButtons() {
  const { scheme, setScheme, theme, setTheme, themes } = useTheme();
  // scheme: "system" | "light" | "dark"; resolvedScheme: "light" | "dark"
  return (
    <>
      <button onClick={() => setScheme("dark")} aria-pressed={scheme === "dark"}>Dark</button>
      <button onClick={() => setTheme("brand")} aria-pressed={theme === "brand"}>Brand</button>
    </>
  );
}
```

Choices are stored in `localStorage` under `unison-scheme` and `unison-theme` (change the prefix
with `storageKey` on both `ThemeScript` and `ThemeProvider`). They sync across tabs, and while the
scheme is `system` the page follows the OS.

## 7. Native: Expo

Unison's native surface is iOS and Android. For Expo's **web** target, use Next.js or Vite
instead: there `@unison-ui/ui` resolves to the React DOM build, which has no `UnisonProvider`.

Install Uniwind (Tailwind classes on native) and, optionally, a storage adapter:

```bash
pnpm add uniwind tailwindcss
npx expo install @react-native-async-storage/async-storage
```

Register the named themes with Uniwind as `<name>-light` / `<name>-dark`:

```js
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

module.exports = withUniwindConfig(getDefaultConfig(__dirname), {
  cssEntryFile: "./src/global.css",
  extraThemes: ["brand-light", "brand-dark"],
});
```

`src/global.css`:

```css
@import "tailwindcss";
@import "uniwind";
@import "../unison/native/theme.css";
```

`src/app/_layout.tsx`:

```tsx
import "../global.css";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ResolvedScheme, UnisonProvider } from "@unison-ui/ui";
import { Stack } from "expo-router";
import { Uniwind } from "uniwind";
import { themes } from "../../unison/native/theme.js";

// The one place the Tailwind engine is told about a change.
function syncUniwind(theme: string, scheme: ResolvedScheme) {
  Uniwind.setTheme(theme === "default" ? scheme : (`${theme}-${scheme}` as never));
}

export default function Layout() {
  return (
    <UnisonProvider themes={themes} storage={AsyncStorage} onThemeChange={syncUniwind}>
      <Stack />
    </UnisonProvider>
  );
}
```

Replace the template's `_layout.tsx` (its navigation `ThemeProvider` follows the OS, not your
choice), or wrap its content in `UnisonProvider`. Run `npx expo start` once before typechecking:
it writes `expo-env.d.ts` (types for the CSS import), and Uniwind writes `uniwind-types.d.ts`
(types for `className`).

`storage` is optional. Without it
the choice lasts for the session. Any object with `getItem` / `setItem`, sync or async, works,
MMKV included. `useTheme()` is the same hook as on the web, plus `tokens`: the resolved theme
object for styles that can't be classes (`style={{ backgroundColor: tokens.color.surface }}`).
Forcing `light` / `dark` calls `Appearance.setColorScheme`, and `system` follows the OS.

## 8. Scoping a subtree: `ThemeScope`

```tsx
import { ThemeScope } from "@unison-ui/ui";

<ThemeScope theme="brand" scheme="dark">
  <Card />
</ThemeScope>
```

On the web this is a `<div style="display: contents">` carrying `data-unison-theme` and
`data-theme`, so it scopes the CSS variables without adding a box. A prop you leave out takes the
nearest scope's or the page's value, and the scope shows exactly its theme and scheme whatever
its ancestors are. You can also put the attributes on any element yourself; put both on it to get
the same guarantee. `useTheme()` inside a scope returns its `theme` and `resolvedScheme` on both
platforms (the setters still change the whole app), and on native also the scoped `tokens`. Uniwind's theme is global, so style scoped native content from
`useTheme().tokens` rather than `className`. See
[ADR 0018](adr/0018-theme-attributes-and-scoping.md).

## Troubleshooting

- **`contrast: theme brand, scheme dark, color.accent on color.surface is 2.89:1`**: the colour
  misses AA. Pick another accent, or override the alias (`overrides: { "color.accent":
  "{color.accent.400}" }`).
- **Classes like `bg-blue-500` do nothing**: you imported `theme-strict.css`, which only has
  Unison's tokens. Use `theme.css` to keep Tailwind's palette.
- **A config edit doesn't show up**: is the `--watch` process running? It prints each file it
  writes, and an error (and keeps the previous output) if the config is invalid.
