# Fonts

Unison never bundles font files. Apps load them, which keeps the packages small and leaves font
licensing with the app. The default faces are **Inter** (UI text) and **JetBrains Mono** (code).

The tokens name the families:

| Token | Web (CSS `font-family`) | Native (`nativeFonts`) |
| --- | --- | --- |
| `font-family.sans` | `"Inter Variable", Inter, ui-sans-serif, system-ui, …` | `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold` |
| `font-family.mono` | `"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, …` | `JetBrainsMono_400Regular` |

## Web (Next.js and Vite)

Install the variable fonts:

```bash
pnpm add @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

Import both once at the app root: `app/layout.tsx` in Next.js, `src/main.tsx` in Vite.

```ts
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
```

The packages register the families `Inter Variable` and `JetBrains Mono Variable`, the first
names in `font-family.sans` and `font-family.mono`, so no `@font-face` CSS is needed. Point the
page at the token:

```css
@layer base {
  html {
    font-family: var(--unison-font-family-sans);
  }
}
```

To check it, open DevTools → Elements → Computed → **Rendered Fonts**. It should list `Inter Variable`.

## Native (Expo)

Install the static faces. Android picks a weight by font file, not by `fontWeight`, so each
weight is its own face:

```bash
npx expo install expo-font expo-splash-screen @expo-google-fonts/inter @expo-google-fonts/jetbrains-mono
```

Load them in `src/app/_layout.tsx` and keep the splash screen up until they're ready:

```tsx
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
  });
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null; // on error, render with the system font
  // …
}
```

The keys passed to `useFonts` are the family names. They must match the values in the theme's
`nativeFonts` map exactly:

```ts
nativeFonts: {
  sans: { 400: "Inter_400Regular", 500: "Inter_500Medium", 600: "Inter_600SemiBold", 700: "Inter_700Bold" },
  mono: { 400: "JetBrainsMono_400Regular" },
}
```

The native text styles (`theme.text.<style>`) set `fontFamily` to the face for the style's
weight and leave out `fontWeight`, because a custom face combined with `fontWeight` renders
wrong on some Android versions.

To check it, temporarily point `nativeFonts.sans[700]` at a name that isn't loaded. Bold text
falls back to the system font. Revert afterwards.

## Using a brand font

1. Change `font-family.sans` (or `mono`) through `defineTheme`'s `fonts` option so its first
   family is the brand font's web name.
2. Change `nativeFonts` to the brand font's face names, one per weight you use (400, 500, 600 and 700).
3. Load the files: a `@fontsource` package or your own `@font-face` on web, and the font files
   through `useFonts` on native, with keys equal to the `nativeFonts` values.
