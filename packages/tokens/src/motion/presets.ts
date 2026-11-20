// Platform-free: the preset types are re-exported to apps through "@unison-ui/tokens/motion".
import type { Resolved } from "../resolve";
import type { SpringConfig } from "../spring";

export type MotionFeel = "snappy" | "smooth" | "reduced";
export type CubicBezier = [number, number, number, number];
export type MotionValues = {
  opacity?: number;
  scale?: number;
  /** Numbers are px. */
  translateY?: number | `${number}%`;
};
export type ResolvedTransition =
  | { type: "spring"; config: SpringConfig }
  | { type: "timing"; duration: number; easing: CubicBezier };
export interface PresetPhase {
  from: MotionValues;
  to: MotionValues;
  transition: ResolvedTransition;
}
export interface MotionPresetValue {
  enter: PresetPhase;
  exit: PresetPhase;
  /** `null` when the preset has no reduced variant (press shows itself with colour). */
  reduced: { enter: PresetPhase; exit: PresetPhase } | null;
}

export const PRESETS = ["fade", "scale-in", "slide-up", "sheet", "pop", "press"] as const;
export type MotionPresetName = (typeof PRESETS)[number];

/** The resolved shape of a `motionPreset` token. */
interface SourcePhase {
  from?: MotionValues;
  to: MotionValues;
  transition: { spring: SpringConfig } | { duration: { value: number }; easing: number[] };
}
interface SourcePreset {
  enter: SourcePhase;
  exit: SourcePhase;
  reduced: "opacity" | "none";
}

const SMOOTH_DURATION_SCALE = 1.2;

function value<T>(tokens: Resolved, path: string): T {
  const tok = tokens.get(path);
  if (!tok) throw new Error(`motion preset: unknown token ${path}`);
  return tok.value as T;
}

const springConfig = (s: SpringConfig): SpringConfig => ({
  stiffness: s.stiffness,
  damping: s.damping,
  mass: s.mass,
});
const sameSpring = (a: SpringConfig, b: SpringConfig) =>
  a.stiffness === b.stiffness && a.damping === b.damping && a.mass === b.mass;

function transitionOf(t: SourcePhase["transition"]): ResolvedTransition {
  if ("spring" in t) return { type: "spring", config: springConfig(t.spring) };
  return { type: "timing", duration: t.duration.value, easing: t.easing as CubicBezier };
}

function fade(tokens: Resolved, from: 0 | 1, speed: "enter" | "exit"): PresetPhase {
  return {
    from: { opacity: from },
    to: { opacity: 1 - from },
    transition: {
      type: "timing",
      duration: value<{ value: number }>(tokens, `motion.duration.fast.${speed}`).value,
      easing: [...value<CubicBezier>(tokens, "easing.linear")],
    },
  };
}

function stretch(t: ResolvedTransition, tokens: Resolved): ResolvedTransition {
  if (t.type === "timing") {
    return { ...t, duration: Math.round(t.duration * SMOOTH_DURATION_SCALE) };
  }
  const snappy = value<SpringConfig>(tokens, "spring.snappy");
  return sameSpring(t.config, snappy)
    ? { type: "spring", config: springConfig(value<SpringConfig>(tokens, "spring.smooth")) }
    : t;
}

const smoothPhase = (p: PresetPhase, tokens: Resolved): PresetPhase => ({
  ...p,
  transition: stretch(p.transition, tokens),
});

/** A phase that jumps straight to its end state. */
const still = (p: PresetPhase, tokens: Resolved): PresetPhase => ({
  ...p,
  transition: {
    type: "timing",
    duration: 0,
    easing: [...value<CubicBezier>(tokens, "easing.linear")],
  },
});

/**
 * Expands one `motion.preset.*` token into enter, exit and reduced phases. The theme's `motion`
 * feel (`ThemeBuild.motion`, default snappy) is applied after the aliases are resolved.
 */
export function expandPreset(
  tokens: Resolved,
  name: MotionPresetName,
  feel: MotionFeel = "snappy",
): MotionPresetValue {
  const src = value<SourcePreset>(tokens, `motion.preset.${name}`);
  const enter: PresetPhase = {
    from: { ...src.enter.from },
    to: { ...src.enter.to },
    transition: transitionOf(src.enter.transition),
  };
  const exit: PresetPhase = {
    from: { ...(src.exit.from ?? src.enter.to) },
    to: { ...src.exit.to },
    transition: transitionOf(src.exit.transition),
  };
  const reduced =
    src.reduced === "opacity"
      ? { enter: fade(tokens, 0, "enter"), exit: fade(tokens, 1, "exit") }
      : null;

  if (feel === "reduced") {
    return {
      enter: reduced?.enter ?? still(enter, tokens),
      exit: reduced?.exit ?? still(exit, tokens),
      reduced,
    };
  }
  if (feel === "smooth") {
    return {
      enter: smoothPhase(enter, tokens),
      exit: smoothPhase(exit, tokens),
      reduced: reduced && {
        enter: smoothPhase(reduced.enter, tokens),
        exit: smoothPhase(reduced.exit, tokens),
      },
    };
  }
  return { enter, exit, reduced };
}

/** Every preset, in `PRESETS` order. */
export function expandPresets(
  tokens: Resolved,
  feel: MotionFeel = "snappy",
): Record<MotionPresetName, MotionPresetValue> {
  return Object.fromEntries(
    PRESETS.map((name) => [name, expandPreset(tokens, name, feel)]),
  ) as Record<MotionPresetName, MotionPresetValue>;
}
