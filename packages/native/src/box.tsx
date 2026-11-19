import { type BoxProps, boxStyles } from "@unison-ui/core";
import { View } from "react-native";
import { token, useUnisonTheme } from "./theme";

export function Box({ tone = "accent", testID, children }: BoxProps) {
  const theme = useUnisonTheme();
  const size = token(theme, boxStyles.size);
  return (
    <View
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius: token(theme, boxStyles.radius),
        borderWidth: 1,
        borderColor: token(theme, boxStyles.border),
        backgroundColor: token(theme, boxStyles.background[tone]),
      }}
    >
      {children}
    </View>
  );
}
