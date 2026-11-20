import { DemoItems } from "demo-content";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { ScopedPanel, SettingsBar } from "../settings-bar";

// Third-party components need Uniwind's wrapper to accept className.
const StyledSafeAreaView = withUniwind(SafeAreaView);

export default function Index() {
  return (
    <StyledSafeAreaView className="flex-1 bg-surface p-4 flex-row flex-wrap items-center gap-4">
      <DemoItems />
      <View testID="tw-box" className="size-24 rounded-md border border-border bg-accent" />
      <SettingsBar />
      <Link href="/tokens" testID="link-tokens">
        <Text className="text-label text-accent-fg underline">Token showcase</Text>
      </Link>
      <ScopedPanel />
    </StyledSafeAreaView>
  );
}
