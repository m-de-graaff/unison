import { getParityCase } from "@unison-ui/parity/registry";
import { themes } from "@unison-ui/tokens/native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Appearance,
  type HostInstance,
  LogBox,
  PixelRatio,
  Platform,
  Text,
  useColorScheme,
  View,
} from "react-native";

// The emulator reaches the host at 10.0.2.2; the iOS simulator shares the host's localhost.
const COLLECTOR = Platform.OS === "android" ? "http://10.0.2.2:4545" : "http://localhost:4545";

// Route: unison-demo://parity/<component>/<case>?scheme=light|dark. Follows the stage contract in
// packages/parity: a 390-wide stage with 16 padding, the subject top-left, metrics POSTed to the
// collector, then a "parity-ready" marker below the stage (outside the screenshot crop).
export default function ParityCase() {
  const params = useLocalSearchParams<{ component: string; case: string; scheme?: string }>();
  const component = params.component ?? "";
  const caseName = params.case ?? "";
  const target = params.scheme === "dark" ? "dark" : "light";

  useEffect(() => {
    Appearance.setColorScheme(target);
  }, [target]);

  // Keep dev overlays out of parity screenshots, only while a parity screen is mounted.
  useEffect(() => {
    LogBox.ignoreAllLogs(true);
    return () => LogBox.ignoreAllLogs(false);
  }, []);

  const active = useColorScheme() === "dark" ? "dark" : "light";
  const stage = useRef<HostInstance>(null);
  const subject = useRef<HostInstance>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const parityCase = getParityCase(component, caseName);

  function onLayout() {
    if (active !== target || !stage.current || !subject.current) return;
    const stageView = stage.current;
    subject.current.measureLayout(stageView, (x, y, width, height) => {
      stageView.measureInWindow(async (sx, sy, sw, sh) => {
        try {
          const response = await fetch(`${COLLECTOR}/metrics`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              platform: Platform.OS,
              run: `${component}/${caseName}/${target}`,
              pixelRatio: PixelRatio.get(),
              stage: { x: sx, y: sy, width: sw, height: sh },
              parts: { subject: { x, y, width, height } },
            }),
          });
          if (!response.ok) throw new Error(`collector answered ${response.status}`);
          setReady(true);
        } catch (e) {
          setError(`${COLLECTOR}: ${e instanceof Error ? e.message : String(e)}`);
        }
      });
    });
  }

  if (!parityCase) {
    return <Text testID="parity-status">{`unknown parity case: ${component}/${caseName}`}</Text>;
  }
  return (
    <View style={{ flex: 1 }}>
      <View
        key={active}
        ref={stage}
        testID="stage"
        onLayout={onLayout}
        style={{
          width: 390,
          padding: 16,
          backgroundColor: themes[active].color.surface,
          alignItems: "flex-start",
        }}
      >
        {/* A native view to measure: Box does not forward refs. Same frame as the Box. */}
        <View ref={subject} collapsable={false}>
          <parityCase.Subject {...parityCase.props} testID="subject" />
        </View>
      </View>
      {/* Below the stage, so outside the screenshot crop. Read by run.ts when a run fails. */}
      {ready && <Text testID="parity-ready">ready</Text>}
      {error && <Text testID="parity-error">{`parity error: ${error}`}</Text>}
      {!ready && !error && (
        <Text testID="parity-status">{`waiting: scheme ${active}, wanted ${target}`}</Text>
      )}
    </View>
  );
}
