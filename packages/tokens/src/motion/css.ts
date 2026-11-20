import type { Token } from "../build";
import { cssVarName } from "../emit-web";
import { type SpringConfig, springToCssLinear } from "../spring";
import {
  type MotionPresetName,
  type MotionPresetValue,
  type MotionValues,
  PRESETS,
  type PresetPhase,
  type ResolvedTransition,
} from "./presets";

type Presets = Record<MotionPresetName, MotionPresetValue>;
type Variant = "" | "reduced-";
type Phase = "in" | "out";

const px = (n: number) => `${n}px`;

function transform(v: MotionValues): string | undefined {
  const parts = [
    v.translateY === undefined
      ? ""
      : `translateY(${typeof v.translateY === "number" ? px(v.translateY) : v.translateY})`,
    v.scale === undefined ? "" : `scale(${v.scale})`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function frame(v: MotionValues): string {
  const props = [
    v.opacity === undefined ? "" : `opacity: ${v.opacity};`,
    transform(v) === undefined ? "" : `transform: ${transform(v)};`,
  ].filter(Boolean);
  return props.join(" ");
}

const sameSpring = (a: SpringConfig, b: SpringConfig) =>
  a.stiffness === b.stiffness && a.damping === b.damping && a.mass === b.mass;

/** The CSS duration and easing of a transition; reuses a token's variable when one matches. */
function timing(
  t: ResolvedTransition,
  tokens: Token[],
  phase: Phase,
): { duration: string; easing: string } {
  if (t.type === "spring") {
    const named = tokens.find(
      (k) => k.type === "spring" && sameSpring(k.value as SpringConfig, t.config),
    );
    if (named) {
      const v = cssVarName(named.path);
      return { duration: `var(${v}-duration)`, easing: `var(${v})` };
    }
    const { easing, durationMs } = springToCssLinear(t.config);
    return { duration: `${durationMs}ms`, easing };
  }
  const ms = `${t.duration}ms`;
  // A semantic duration of the same phase wins (`motion.duration.fast.exit`), then a primitive.
  const semantic = new RegExp(
    `^motion\\.duration\\.[a-z]+\\.${phase === "in" ? "enter" : "exit"}$`,
  );
  const duration =
    tokens.find((k) => k.type === "duration" && k.value === ms && semantic.test(k.path)) ??
    tokens.find((k) => k.type === "duration" && k.value === ms && /^duration\.\d+$/.test(k.path));
  const curve = JSON.stringify(t.easing);
  const easing = tokens.find((k) => k.type === "cubicBezier" && JSON.stringify(k.value) === curve);
  return {
    duration: duration ? `var(${cssVarName(duration.path)})` : ms,
    easing: easing ? `var(${cssVarName(easing.path)})` : `cubic-bezier(${t.easing.join(", ")})`,
  };
}

const phaseOf = (p: MotionPresetValue, variant: Variant, phase: Phase): PresetPhase | undefined =>
  variant === ""
    ? p[phase === "in" ? "enter" : "exit"]
    : p.reduced?.[phase === "in" ? "enter" : "exit"];

const keyframesName = (name: string, variant: Variant, phase: Phase) =>
  `unison-${name}-${variant}${phase}`;

/** `@keyframes` for every preset: `-in`, `-out`, and `-reduced-in` / `-reduced-out` where defined. */
export function keyframes(presets: Presets): string[] {
  return PRESETS.flatMap((name) =>
    (["", "reduced-"] as const).flatMap((variant) =>
      (["in", "out"] as const).flatMap((phase) => {
        const p = phaseOf(presets[name], variant, phase);
        if (!p) return [];
        return [
          `@keyframes ${keyframesName(name, variant, phase)} {`,
          `  from { ${frame(p.from)} }`,
          `  to { ${frame(p.to)} }`,
          "}",
          "",
        ];
      }),
    ),
  );
}

/** `--unison-animate-<preset>` and `-out` declarations for the normal or the reduced variant. */
export function animateDeclarations(
  presets: Presets,
  tokens: Token[],
  variant: Variant,
  indent: string,
): string[] {
  return PRESETS.flatMap((name) =>
    (["in", "out"] as const).flatMap((phase) => {
      const p = phaseOf(presets[name], variant, phase);
      if (!p) return [];
      const { duration, easing } = timing(p.transition, tokens, phase);
      const prop = cssVarName(`animate.${name}`) + (phase === "out" ? "-out" : "");
      return [
        `${indent}${prop}: ${keyframesName(name, variant, phase)} ${duration} ${easing} both;`,
      ];
    }),
  );
}

/** Tailwind's `--animate-*` theme entries, one `animate-<preset>` and `animate-<preset>-out` each. */
export function tailwindAnimations(indent: string): string[] {
  return PRESETS.flatMap((name) => [
    `${indent}--animate-${name}: var(${cssVarName(`animate.${name}`)});`,
    `${indent}--animate-${name}-out: var(${cssVarName(`animate.${name}`)}-out);`,
  ]);
}
