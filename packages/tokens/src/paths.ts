/** Browser-safe: no node:, culori or colorjs.io in here, so apps can import it from `@unison-ui/tokens/paths`. */

/** `"color.accent"` → `"--unison-color-accent"`; a decimal step stays one name (`space.0.5` → `--unison-space-0-5`). */
export const cssVarName = (path: string): string => `--unison-${path.replaceAll(".", "-")}`;

/** Token groups that are a group of their own in the native theme, under their camelCase name. */
const NATIVE_GROUPS: Record<string, string> = {
  color: "color",
  space: "space",
  size: "size",
  radius: "radius",
  opacity: "opacity",
  shadow: "shadow",
  elevation: "elevation",
  breakpoint: "breakpoint",
  "border-width": "borderWidth",
  "ring-offset": "ringOffset",
  "z-index": "zIndex",
  "font-family": "fontFamily",
  "font-weight": "fontWeight",
};

const dashed = (rest: string[]) => rest.join("-");

/**
 * Where a token lives inside a `UnisonTheme`: `"color.accent.600"` → `["color", "accent-600"]`,
 * `"motion.duration.fast.enter"` → `["motion", "duration", "fast-enter"]`. Every group is flat,
 * so `color.accent` and `color.accent.600` don't collide (`space.0.5` → `space["0-5"]`).
 */
export function nativeKey(path: string): readonly string[] {
  const [head, ...rest] = path.split(".");
  const [first = ""] = rest;
  const group = NATIVE_GROUPS[head as string];
  if (rest.length === 0) throw new Error(`nativeKey: ${path} has no key`);
  if (group) return [group, dashed(rest)];
  switch (head) {
    case "text":
      return ["text", dashed(rest)];
    case "duration":
      return ["motion", "duration", dashed(rest)];
    case "easing":
      return ["motion", "easing", dashed(rest)];
    case "spring":
      return ["motion", "spring", dashed(rest)];
    case "motion":
      if (first === "duration") return ["motion", "duration", dashed(rest.slice(1))];
      if (first === "preset") return ["motion", "presets", dashed(rest.slice(1))];
      if (["enter", "exit", "emphasis"].includes(first)) {
        return ["motion", "transition", dashed(rest)];
      }
  }
  throw new Error(`nativeKey: ${path} has no place in the native theme`);
}
