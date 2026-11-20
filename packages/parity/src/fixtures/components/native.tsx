import { useTheme } from "@unison-ui/ui";
import { type ReactNode, useContext, useEffect, useRef } from "react";
import { type HostInstance, Text, View, type ViewStyle } from "react-native";
import { PartsContext } from "../../parts";
import { ELEVATIONS, RADII, SWATCH_COLORS, TEXT_STYLES, TYPE_SAMPLE } from "../tokens";

interface FixtureProps {
  testID?: string;
}

/** A measured part: registers itself with the parity route. */
function Part({
  name,
  sample = false,
  style,
  children,
}: {
  name: string;
  sample?: boolean;
  style?: ViewStyle;
  children?: ReactNode;
}) {
  const parts = useContext(PartsContext);
  const ref = useRef<HostInstance>(null);
  useEffect(() => parts?.register(name, ref.current, sample), [parts, name, sample]);
  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}

export function Swatches({ testID }: FixtureProps) {
  const { tokens } = useTheme();
  return (
    <View
      testID={testID}
      style={{ flexDirection: "row", flexWrap: "wrap", width: 6 * 40 + 5 * 8, gap: 8 }}
    >
      {SWATCH_COLORS.map((c, i) => (
        <Part
          key={c}
          name={`swatch-${i}`}
          sample
          style={{ width: 40, height: 40, backgroundColor: tokens.color[c] }}
        />
      ))}
    </View>
  );
}

export function TypeRamp({ testID }: FixtureProps) {
  const { tokens } = useTheme();
  return (
    <View testID={testID}>
      {TEXT_STYLES.map((s) => (
        <Part key={s} name={`line-${s}`}>
          <Text numberOfLines={1} style={{ ...tokens.text[s], color: tokens.color.fg }}>
            {TYPE_SAMPLE}
          </Text>
        </Part>
      ))}
    </View>
  );
}

export function Radius({ testID }: FixtureProps) {
  const { tokens } = useTheme();
  return (
    <View testID={testID} style={{ flexDirection: "row", gap: 8 }}>
      {RADII.map((r) => (
        <Part
          key={r}
          name={`radius-${r}`}
          style={{
            width: 64,
            height: 64,
            backgroundColor: tokens.color.accent,
            borderRadius: tokens.radius[r],
          }}
        />
      ))}
    </View>
  );
}

export function Elevation({ testID }: FixtureProps) {
  const { tokens } = useTheme();
  return (
    <View
      testID={testID}
      style={{ flexDirection: "row", gap: 16, padding: 16, backgroundColor: tokens.color.canvas }}
    >
      {ELEVATIONS.map((e) => (
        <Part
          key={e}
          name={`elevation-${e}`}
          style={{
            width: 80,
            height: 64,
            backgroundColor: tokens.color["surface-raised"],
            borderRadius: tokens.radius.card,
            boxShadow: tokens.elevation[e],
          }}
        />
      ))}
    </View>
  );
}
