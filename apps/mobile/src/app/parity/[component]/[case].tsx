import { getParityCase, PartsContext, type PartsRegistry } from "@unison-ui/parity/registry";
import { ThemeScope, useTheme } from "@unison-ui/ui";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { type HostInstance, LogBox, PixelRatio, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The iOS simulator shares the host's localhost; on Android, run.ts maps the emulator's
// localhost:4545 to the host with `adb reverse`.
const COLLECTOR = "http://localhost:4545";
const POST_TIMEOUT_MS = 5000;
// Measure only after the layout has stayed put this long (any change restarts the wait).
const SETTLE_MS = 400;

type Rect = { x: number; y: number; width: number; height: number };

// Route: unison-demo://parity/<component>/<case>?theme=<name>&scheme=light|dark. Follows the stage
// contract in packages/parity: a 390-wide stage with 16 padding, the subject top-left, metrics
// (every registered part, plus centre samples) POSTed to the collector, then a "parity-ready"
// marker below the stage (outside the screenshot crop). Theme and scheme come from a ThemeScope:
// deterministic, and independent of the app's own (persisted) choice.
export default function ParityCase() {
  const params = useLocalSearchParams<{
    component: string;
    case: string;
    theme?: string;
    scheme?: string;
  }>();
  const theme = params.theme ?? "default";
  const target = params.scheme === "dark" ? "dark" : "light";
  return (
    <ThemeScope theme={theme} scheme={target}>
      <ParityStage
        component={params.component ?? ""}
        caseName={params.case ?? ""}
        theme={theme}
        target={target}
      />
    </ThemeScope>
  );
}

function ParityStage({
  component,
  caseName,
  theme,
  target,
}: {
  component: string;
  caseName: string;
  theme: string;
  target: "light" | "dark";
}) {
  const { tokens, resolvedScheme } = useTheme();
  const partViews = useRef(new Map<string, { view: HostInstance; sample: boolean }>());
  const parts = useMemo<PartsRegistry>(
    () => ({
      register(name, view, sample) {
        partViews.current.set(name, { view: view as HostInstance, sample });
        return () => partViews.current.delete(name);
      },
    }),
    [],
  );

  // Keep dev overlays out of parity screenshots, only while a parity screen is mounted.
  useEffect(() => {
    LogBox.ignoreAllLogs(true);
    return () => LogBox.ignoreAllLogs(false);
  }, []);

  const active = resolvedScheme;
  const insets = useSafeAreaInsets();
  const stage = useRef<HostInstance>(null);
  const subject = useRef<HostInstance>(null);
  const [step, setStep] = useState("waiting for the colour scheme");
  // The run whose metrics reached the collector. A run id, not a boolean: when a deep link reuses
  // this screen for the next run, the previous run's marker must not show for a frame.
  const [readyRun, setReadyRun] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const parityCase = useMemo(() => getParityCase(component, caseName), [component, caseName]);
  const run = `${component}/${caseName}/${theme}/${target}`;
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
      const measure = (view: HostInstance) =>
        new Promise<Rect>((resolve, reject) =>
          view.measureLayout(
            stageView,
            (x, y, width, height) => resolve({ x, y, width, height }),
            () => reject(new Error("measureLayout failed")),
          ),
        );
      void (async () => {
        try {
          const measured: Record<string, Rect> = { subject: await measure(subjectView) };
          const samples: Record<string, { x: number; y: number }> = {};
          for (const [name, { view, sample }] of [...partViews.current].sort(([a], [b]) =>
            a.localeCompare(b),
          )) {
            const r = await measure(view);
            measured[name] = r;
            if (sample) samples[name] = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
          }
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
                  parts: measured,
                  ...(Object.keys(samples).length > 0 ? { samples } : {}),
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
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : String(e));
        }
      })();
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
          backgroundColor: tokens.color.surface,
          alignItems: "flex-start",
        }}
      >
        {/* A native view to measure: Box does not forward refs. Same frame as the Box. */}
        <PartsContext.Provider value={parts}>
          <View ref={subject} collapsable={false}>
            <parityCase.Subject {...parityCase.props} testID="subject" />
          </View>
        </PartsContext.Provider>
      </View>
      {/* Below the stage, so outside the screenshot crop. Read by run.ts when a run fails. */}
      {ready && <Text testID="parity-ready">{`ready ${run}`}</Text>}
      {error && <Text testID="parity-error">{`parity error: ${error}`}</Text>}
      {!ready && !error && (
        <Text testID="parity-status">{`${step} (${theme}, scheme ${active}, wanted ${target})`}</Text>
      )}
    </View>
  );
}
