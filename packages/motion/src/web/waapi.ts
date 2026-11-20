import type { MotionPresetValue, PresetPhase } from "@unison-ui/tokens/motion";
import { selectPhase, springToCssLinear } from "../shared";

type MotionValues = PresetPhase["from"];

function transform(v: MotionValues): string | undefined {
  const parts = [
    v.translateY === undefined
      ? ""
      : `translateY(${typeof v.translateY === "number" ? `${v.translateY}px` : v.translateY})`,
    v.scale === undefined ? "" : `scale(${v.scale})`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function keyframe(v: MotionValues): Keyframe {
  const frame: Keyframe = {};
  if (v.opacity !== undefined) frame.opacity = v.opacity;
  const t = transform(v);
  if (t !== undefined) frame.transform = t;
  return frame;
}

/**
 * Keyframes and options for `element.animate()`. Springs play as a CSS `linear()` easing over the
 * simulated settle time. `opts.reduced` picks the reduced variant, where the preset has one.
 */
export function toWaapi(
  preset: MotionPresetValue,
  phase: "enter" | "exit",
  opts: { reduced?: boolean } = {},
): [Keyframe[], KeyframeAnimationOptions] {
  const { from, to, transition } = selectPhase(preset, phase, opts.reduced ?? false);
  const frames = [keyframe(from), keyframe(to)];
  if (transition.type === "spring") {
    const { easing, durationMs } = springToCssLinear(transition.config);
    return [frames, { duration: durationMs, easing, fill: "both" }];
  }
  const curve = transition.easing.join(", ");
  return [
    frames,
    {
      duration: transition.duration,
      easing: curve === "0, 0, 1, 1" ? "linear" : `cubic-bezier(${curve})`,
      fill: "both",
    },
  ];
}
