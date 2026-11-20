// @vitest-environment node
import { motionPresets } from "@unison-ui/tokens/motion";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native-reanimated", () => ({
  withSpring: vi.fn((v, c) => ({ spring: [v, c] })),
  withTiming: vi.fn((v, c) => ({ timing: [v, c.duration] })),
  Easing: { bezier: vi.fn(() => ({ factory: true })) },
}));

// The native entry imports react-native, which is Flow source that vitest cannot parse.
const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock("../src/native/index", () => ({ useReducedMotion: () => reducedMotion.value }));

const { Easing, withSpring, withTiming } = await import("react-native-reanimated");
const { toReanimated, useReanimatedPhase } = await import("../src/native/reanimated");

beforeEach(() => {
  vi.clearAllMocks();
  reducedMotion.value = false;
});

it("a spring transition calls withSpring with exactly stiffness, damping and mass", () => {
  const config = { stiffness: 400, damping: 30, mass: 1 };
  expect(toReanimated({ type: "spring", config })(1)).toEqual({ spring: [1, config] });
  expect(withSpring).toHaveBeenCalledWith(1, config);
  expect(Object.keys(vi.mocked(withSpring).mock.calls[0]?.[1] ?? {}).sort()).toEqual([
    "damping",
    "mass",
    "stiffness",
  ]);
});

it("a timing transition calls withTiming with the duration and a bezier easing", () => {
  const out = toReanimated({ type: "timing", duration: 80, easing: [0.3, 0, 0.8, 0.15] })(0);
  expect(Easing.bezier).toHaveBeenCalledWith(0.3, 0, 0.8, 0.15);
  expect(withTiming).toHaveBeenCalledWith(0, { duration: 80, easing: { factory: true } });
  expect(out).toEqual({ timing: [0, 80] });
});

it("passes the completion callback through", () => {
  const callback = vi.fn();
  toReanimated({ type: "spring", config: { stiffness: 1, damping: 1, mass: 1 } })(1, callback);
  expect(withSpring).toHaveBeenCalledWith(1, { stiffness: 1, damping: 1, mass: 1 }, callback);
  toReanimated({ type: "timing", duration: 1, easing: [0, 0, 1, 1] })(1, callback);
  expect(withTiming).toHaveBeenCalledWith(1, { duration: 1, easing: { factory: true } }, callback);
});

describe.each(Object.entries(motionPresets.default))("%s", (_name, preset) => {
  const variants = [
    ["enter", preset.enter],
    ["exit", preset.exit],
    ...(preset.reduced
      ? ([
          ["reduced enter", preset.reduced.enter],
          ["reduced exit", preset.reduced.exit],
        ] as const)
      : []),
  ] as const;
  it.each(variants)("%s drives reanimated", (_label, phase) => {
    toReanimated(phase.transition)(1);
    if (phase.transition.type === "spring") {
      expect(withSpring).toHaveBeenCalledWith(1, phase.transition.config);
    } else {
      expect(withTiming).toHaveBeenCalledWith(1, {
        duration: phase.transition.duration,
        easing: { factory: true },
      });
    }
  });
});

it("useReanimatedPhase fades only while reduced motion is on", () => {
  const preset = motionPresets.default["scale-in"];
  const normal = useReanimatedPhase(preset, "enter");
  expect(normal.phase).toBe(preset.enter);
  normal.animate(1);
  expect(withSpring).toHaveBeenCalledWith(1, { stiffness: 400, damping: 30, mass: 1 });

  reducedMotion.value = true;
  const reduced = useReanimatedPhase(preset, "enter");
  expect(reduced.phase).toBe(preset.reduced?.enter);
  expect(Object.keys({ ...reduced.phase.from, ...reduced.phase.to })).toEqual(["opacity"]);
  reduced.animate(1);
  expect(withTiming).toHaveBeenCalledWith(1, { duration: 120, easing: { factory: true } });
});
