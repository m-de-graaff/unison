// The only file that imports react-native-reanimated, so apps without it can still use the main
// entry. It is published as "@unison-ui/motion/reanimated".
import type { MotionPresetValue, PresetPhase, ResolvedTransition } from "@unison-ui/tokens/motion";
import { Easing, withSpring, withTiming } from "react-native-reanimated";
import { selectPhase } from "../shared";
import { useReducedMotion } from "./index";

/** Turns a resolved transition into a function that animates a shared value to `toValue`. */
export function toReanimated(
  transition: ResolvedTransition,
): (toValue: number, callback?: (finished?: boolean) => void) => number {
  if (transition.type === "spring") {
    const { stiffness, damping, mass } = transition.config;
    const config = { stiffness, damping, mass };
    return (toValue, callback) =>
      callback ? withSpring(toValue, config, callback) : withSpring(toValue, config);
  }
  const config = { duration: transition.duration, easing: Easing.bezier(...transition.easing) };
  return (toValue, callback) =>
    callback ? withTiming(toValue, config, callback) : withTiming(toValue, config);
}

/** The phase to play (the reduced variant when the OS asks for reduced motion) and its animator. */
export function useReanimatedPhase(
  preset: MotionPresetValue,
  phase: "enter" | "exit",
): { phase: PresetPhase; animate: ReturnType<typeof toReanimated> } {
  const selected = selectPhase(preset, phase, useReducedMotion());
  return { phase: selected, animate: toReanimated(selected.transition) };
}
