import { DemoItems } from "demo-content";
import { View } from "react-native";
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
      <ScopedPanel />
    </StyledSafeAreaView>
  );
}
