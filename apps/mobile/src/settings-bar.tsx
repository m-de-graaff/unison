import { ThemeScope, useTheme } from "@unison-ui/ui";
import { SCHEMES, THEMES } from "demo-content";
import { Pressable, Text, View } from "react-native";

function Choice({
  id,
  label,
  selected,
  onPress,
}: {
  id: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={id}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`rounded-control border border-border-strong px-3 py-1 ${selected ? "bg-accent" : ""}`}
    >
      <Text className={`text-label ${selected ? "text-on-accent" : "text-fg"}`}>{label}</Text>
    </Pressable>
  );
}

/** One button per scheme and per theme; the active one is selected. App code, not library code. */
export function SettingsBar() {
  const { scheme, setScheme, theme, setTheme } = useTheme();
  return (
    <View className="flex-row flex-wrap gap-2">
      {SCHEMES.map((s) => (
        <Choice
          key={s}
          id={`settings-scheme-${s}`}
          label={s}
          selected={scheme === s}
          onPress={() => setScheme(s)}
        />
      ))}
      {THEMES.map((t) => (
        <Choice
          key={t}
          id={`settings-theme-${t}`}
          label={t}
          selected={theme === t}
          onPress={() => setTheme(t)}
        />
      ))}
    </View>
  );
}

/** Styled from the scope's tokens: Uniwind's theme is global and can't follow a nested scope. */
function PanelCard() {
  const { tokens } = useTheme();
  return (
    <View
      testID="scoped-panel"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: tokens.space["4"],
        borderRadius: tokens.radius.card,
        backgroundColor: tokens.color.surface,
      }}
    >
      <View
        testID="scoped-accent"
        style={{
          width: 24,
          height: 24,
          borderRadius: tokens.radius.control,
          backgroundColor: tokens.color.accent,
        }}
      />
      <Text style={{ ...tokens.text.body, color: tokens.color.fg }}>brand · dark</Text>
    </View>
  );
}

/** Always brand-dark, whatever the app uses. */
export function ScopedPanel() {
  return (
    <ThemeScope theme="brand" scheme="dark">
      <PanelCard />
    </ThemeScope>
  );
}
