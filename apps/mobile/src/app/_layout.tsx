import "../global.css";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ResolvedScheme, UnisonProvider } from "@unison-ui/ui";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Uniwind } from "uniwind";
import { themes } from "../../unison/native/theme.js";

SplashScreen.preventAutoHideAsync();

/** The one hand-off to the Tailwind engine: Uniwind names themes "light", "dark", "<name>-<scheme>". */
function syncUniwind(theme: string, scheme: ResolvedScheme) {
  Uniwind.setTheme(theme === "default" ? scheme : (`${theme}-${scheme}` as never));
}

export default function Layout() {
  // The keys are the family names the tokens' nativeFonts map points at.
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
  });
  useEffect(() => {
    if (error) console.error("font loading failed; falling back to the system font", error);
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  // On error, render anyway with the system font so a parity route never stays blank.
  if (!loaded && !error) return null;
  return (
    <UnisonProvider themes={themes} storage={AsyncStorage} onThemeChange={syncUniwind}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </UnisonProvider>
  );
}
