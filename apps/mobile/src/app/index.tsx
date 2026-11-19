import { DemoItems } from "demo-content";
import { useState } from "react";
import { Appearance, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

type Mode = "system" | "light" | "dark";
const next: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };

// Third-party components need Uniwind's wrapper to accept className.
const StyledSafeAreaView = withUniwind(SafeAreaView);

export default function Index() {
  const [mode, setMode] = useState<Mode>("system");

  function cycle() {
    const m = next[mode];
    Appearance.setColorScheme(m === "system" ? "unspecified" : m);
    setMode(m);
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-surface p-4 flex-row flex-wrap items-center gap-4">
      <DemoItems />
      <View testID="tw-box" className="size-24 rounded-md border border-border bg-accent" />
      <Pressable
        testID="theme-toggle"
        onPress={cycle}
        accessibilityRole="button"
        accessibilityLabel={`theme: ${mode}`}
      >
        <Text className="text-fg">theme: {mode}</Text>
      </Pressable>
    </StyledSafeAreaView>
  );
}
