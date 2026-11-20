import type { MotionPresetValue, PresetPhase } from "@unison-ui/tokens/motion";

/**
 * The phase to play. With reduced motion on, presets that have a reduced variant (an opacity
 * fade) use it; `press` has none, because components show a press with colour instead.
 */
export function selectPhase(
  preset: MotionPresetValue,
  phase: "enter" | "exit",
  reduced: boolean,
): PresetPhase {
  return reduced && preset.reduced ? preset.reduced[phase] : preset[phase];
}
