import { selectPhase, useReducedMotion } from "@unison-ui/motion";
import { toReanimated } from "@unison-ui/motion/reanimated";
import { useTheme } from "@unison-ui/ui";
import { type ShowcaseItem, showcaseSections, type TokensJson } from "demo-content";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { motionPresets } from "../../unison/motion.js";
import tokensJson from "../../unison/tokens.json";
import { SettingsBar } from "../settings-bar";

const CARD = 96;
const name = (token: string) => token.replace(/^[a-z-]+\./, "");
type MotionValues = { opacity?: number; scale?: number; translateY?: number | `${number}%` };
const translate = (v: MotionValues["translateY"]) =>
  typeof v === "string" ? (Number.parseFloat(v) / 100) * CARD : (v ?? 0);

/** The spring curve as 2 × 2 dots (no SVG dependency). */
function Curve({ preset, curve, color }: { preset: string; curve: number[]; color: string }) {
  if (curve.length === 0) return <Text className="text-caption text-fg-muted">timing</Text>;
  return (
    <View testID={`curve-${preset}`} style={{ width: 120, height: 40 }}>
      {curve.map((y, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: samples are positional
          key={i}
          style={{
            position: "absolute",
            left: (i / (curve.length - 1)) * 118,
            top: 40 - y * 26 - 1,
            width: 2,
            height: 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

function MotionSection({ items }: { items: ShowcaseItem[] }) {
  const { theme, tokens } = useTheme();
  const osReduced = useReducedMotion();
  const [forced, setForced] = useState(false);
  const [active, setActive] = useState("scale-in");
  const byTheme: Record<string, (typeof motionPresets)["default"]> = motionPresets;
  const presets = byTheme[theme] ?? motionPresets.default;
  const progress = useSharedValue(1);
  const [range, setRange] = useState<{ from: MotionValues; to: MotionValues }>({
    from: {},
    to: {},
  });

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const mix = (a: number | undefined, b: number | undefined, d: number) =>
      (a ?? d) + ((b ?? d) - (a ?? d)) * t;
    return {
      opacity: mix(range.from.opacity, range.to.opacity, 1),
      transform: [
        { translateY: mix(translate(range.from.translateY), translate(range.to.translateY), 0) },
        { scale: mix(range.from.scale, range.to.scale, 1) },
      ],
    };
  });

  function play(preset: string) {
    setActive(preset);
    const p = presets[preset as keyof typeof presets];
    if (!p) return;
    const phase = selectPhase(p, "enter", forced || osReduced);
    setRange({ from: phase.from, to: phase.to });
    progress.value = 0;
    progress.value = toReanimated(phase.transition)(1);
  }

  const curve = items.find((i) => i.kind === "motion" && i.preset === active);
  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center gap-2">
        {items.map((i) =>
          i.kind === "motion" ? (
            <Pressable
              key={i.preset}
              testID={`play-${i.preset}`}
              accessibilityRole="button"
              onPress={() => play(i.preset)}
              className="rounded-control border border-border-strong px-3 py-1"
            >
              <Text className="text-label text-fg">Play {i.preset}</Text>
            </Pressable>
          ) : null,
        )}
        <View className="flex-row items-center gap-2">
          <Switch testID="reduced-switch" value={forced} onValueChange={setForced} />
          <Text className="text-label text-fg">Reduced</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-6">
        <Animated.View
          testID="motion-card"
          style={[
            {
              width: CARD,
              height: CARD,
              borderRadius: tokens.radius.card,
              backgroundColor: tokens.color.accent,
              boxShadow: tokens.elevation.raised,
            },
            style,
          ]}
        />
        {curve?.kind === "motion" ? (
          <Curve preset={curve.preset} curve={curve.curve} color={tokens.color.fg} />
        ) : null}
      </View>
    </View>
  );
}

function Item({ item }: { item: ShowcaseItem }) {
  const { tokens } = useTheme();
  const fg = { color: tokens.color.fg };
  const muted = { color: tokens.color["fg-muted"] };
  switch (item.kind) {
    case "swatch":
      return (
        <View testID={`swatch-${item.token}`} className="flex-row items-center gap-3">
          <View
            className="size-10 rounded-control border border-border"
            style={{ backgroundColor: item.value }}
          />
          <View>
            <Text className="text-label" style={fg}>
              {name(item.token)}
            </Text>
            <Text className="text-caption" style={muted}>
              {item.value}
            </Text>
          </View>
          {item.contrast ? (
            <View
              className="rounded-pill px-2"
              style={{
                backgroundColor: item.contrast.pass
                  ? tokens.color["success-subtle"]
                  : tokens.color["danger-subtle"],
              }}
            >
              <Text
                testID={`badge-${item.token}`}
                className="text-caption"
                style={{
                  color: item.contrast.pass
                    ? tokens.color["success-fg"]
                    : tokens.color["danger-fg"],
                }}
              >
                {item.contrast.ratio.toFixed(2)}:1 {item.contrast.pass ? "pass" : "fail"}
              </Text>
            </View>
          ) : null}
        </View>
      );
    case "palette":
      return (
        <View className="flex-row items-center gap-1">
          <Text className="w-16 text-label" style={fg}>
            {item.name}
          </Text>
          {item.steps.map((s) => (
            <View
              key={s.step}
              testID={`palette-${item.name}-${s.step}`}
              className="size-6 rounded-control"
              style={{ backgroundColor: s.value }}
            />
          ))}
        </View>
      );
    case "text": {
      const style = tokens.text[item.style as keyof typeof tokens.text];
      return (
        <Text testID={`text-${item.style}`} style={[typeof style === "object" ? style : {}, fg]}>
          <Text className="text-caption" style={muted}>
            {item.style} {item.size}/{item.lineHeight}{" "}
          </Text>
          {item.sample}
        </Text>
      );
    }
    case "space":
      return (
        <View className="flex-row items-center gap-3">
          <Text className="w-16 text-caption" style={muted}>
            {name(item.token)}
          </Text>
          <View
            className="h-3 rounded-control"
            style={{ width: item.px, backgroundColor: tokens.color.accent }}
          />
          <Text className="text-caption" style={muted}>
            {item.px}px
          </Text>
        </View>
      );
    case "radius":
    case "elevation":
      return (
        <View
          testID={`shape-${item.token}`}
          className="size-24 items-center justify-center border border-border-strong"
          style={{
            backgroundColor: tokens.color["surface-raised"],
            borderRadius: item.kind === "radius" ? Math.min(item.px, 48) : tokens.radius.card,
            ...(item.kind === "elevation" ? { boxShadow: item.shadow, borderWidth: 0 } : {}),
          }}
        >
          <Text className="text-caption" style={fg}>
            {name(item.token)}
          </Text>
        </View>
      );
    default:
      return null;
  }
}

/** The six token sections for the active theme and scheme. App code, not library code. */
export default function Tokens() {
  const { theme, resolvedScheme, tokens } = useTheme();
  const sections = showcaseSections(tokensJson as TokensJson, theme, resolvedScheme);
  return (
    <ScrollView
      style={{ backgroundColor: tokens.color.canvas }}
      contentContainerClassName="gap-8 p-4"
    >
      <SettingsBar />
      {sections.map((s) => (
        <View key={s.id} testID={`section-${s.id}`} className="gap-4">
          <Text className="text-title" style={{ color: tokens.color.fg }}>
            {s.title}
          </Text>
          {s.id === "motion" ? (
            <MotionSection items={s.items} />
          ) : (
            <View className={s.id === "radius-elevation" ? "flex-row flex-wrap gap-6" : "gap-3"}>
              {s.items.map((item) => (
                <Item
                  key={"token" in item ? item.token : "name" in item ? item.name : ""}
                  item={item}
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
