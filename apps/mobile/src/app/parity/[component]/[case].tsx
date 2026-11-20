import { getParityCase } from "@unison-ui/parity/registry";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { themes } from "../../../../.unison/native/theme.js";

// The iOS simulator shares the host's localhost; on Android, run.ts maps the emulator's
// localhost:4545 to the host with `adb reverse`.
const COLLECTOR = "http://localhost:4545";
const POST_TIMEOUT_MS = 5000;
// Measure only after the layout has stayed put this long (any change restarts the wait).
const SETTLE_MS = 400;

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
  const insets = useSafeAreaInsets();
  const stage = useRef<HostInstance>(null);
  const subject = useRef<HostInstance>(null);
  const [step, setStep] = useState("waiting for the colour scheme");
  // The run whose metrics reached the collector. A run id, not a boolean: when a deep link reuses
  // this screen for the next run, the previous run's marker must not show for a frame.
  const [readyRun, setReadyRun] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const parityCase = useMemo(() => getParityCase(component, caseName), [component, caseName]);
  const run = `${component}/${caseName}/${target}`;
  const ready = readyRun === run;

  // Measure once the requested scheme is active and a frame has rendered. An effect (rather than
  // onLayout) re-runs when the scheme flips, so the measurement can't be skipped.
  // biome-ignore lint/correctness/useExhaustiveDependencies: insets.top is a trigger, re-measure when it changes
  useEffect(() => {
    if (!parityCase || active !== target) return;
    // A layout change (hiding the status bar shrinks the top inset on Android) re-runs this effect:
    // drop any earlier result so Maestro never screenshots a layout that moved after measuring.
    setReadyRun(undefined);
    setError(undefined);
    setStep("waiting for the layout to settle");
    let cancelled = false;
    const settle = setTimeout(measure, SETTLE_MS);
    function measure() {
      const stageView = stage.current;
      const subjectView = subject.current;
      if (cancelled || !stageView || !subjectView) {
        if (!cancelled) setError("stage or subject view not mounted");
        return;
      }
      setStep("measuring");
      subjectView.measureLayout(
        stageView,
        (x, y, width, height) => {
          stageView.measureInWindow(async (sx, sy, sw, sh) => {
            if (cancelled) return;
            setStep(`posting to ${COLLECTOR}`);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
            try {
              const response = await fetch(`${COLLECTOR}/metrics`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                  platform: Platform.OS,
                  run,
                  pixelRatio: PixelRatio.get(),
                  stage: { x: sx, y: sy, width: sw, height: sh },
                  parts: { subject: { x, y, width, height } },
                }),
              });
              if (!response.ok) throw new Error(`collector answered ${response.status}`);
              if (!cancelled) setReadyRun(run);
            } catch (e) {
              const reason = controller.signal.aborted
                ? `no answer within ${POST_TIMEOUT_MS} ms`
                : e instanceof Error
                  ? e.message
                  : String(e);
              if (!cancelled) setError(`${COLLECTOR}: ${reason}`);
            } finally {
              clearTimeout(timeout);
            }
          });
        },
        () => {
          if (!cancelled) setError("measureLayout failed");
        },
      );
    }
    return () => {
      cancelled = true;
      clearTimeout(settle);
    };
  }, [active, target, parityCase, run, insets.top]);

  if (!parityCase) {
    return <Text testID="parity-status">{`unknown parity case: ${component}/${caseName}`}</Text>;
  }
  return (
    // Below the safe area, with the status bar hidden: the screenshot crop must never contain the
    // clock or status icons, which change between runs.
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <StatusBar hidden />
      <View
        key={active}
        ref={stage}
        testID="stage"
        style={{
          width: 390,
          padding: 16,
          backgroundColor: themes.default[active].color.surface,
          alignItems: "flex-start",
        }}
      >
        {/* A native view to measure: Box does not forward refs. Same frame as the Box. */}
        <View ref={subject} collapsable={false}>
          <parityCase.Subject {...parityCase.props} testID="subject" />
        </View>
      </View>
      {/* Below the stage, so outside the screenshot crop. Read by run.ts when a run fails. */}
      {ready && <Text testID="parity-ready">{`ready ${run}`}</Text>}
      {error && <Text testID="parity-error">{`parity error: ${error}`}</Text>}
      {!ready && !error && (
        <Text testID="parity-status">{`${step} (scheme ${active}, wanted ${target})`}</Text>
      )}
    </View>
  );
}
