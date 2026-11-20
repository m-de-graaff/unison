import { BUILT_IN_PALETTES, colorPrimitives } from "./color/palettes";
import { assertTiers } from "./lint-tiers";
import { loadSource } from "./load";
import { type ResolvedToken, resolve } from "./resolve";
import type { ColorValue, Dimension, Duration, SourceToken } from "./schema";
import type { SpringConfig } from "./spring";

export interface Token {
  path: string;
  type: "color" | "dimension" | "duration" | "spring";
  value: string | SpringConfig;
}
export interface TokenSets {
  light: Token[];
  dark: Token[];
  darkOverrides: Token[];
}

const LEGACY_TYPES = new Set(["color", "dimension", "duration", "spring"]);

/** Phase 0 emitters still take string values; this adapter goes away in Tasks 14 and 16. */
export function toLegacy(tokens: (SourceToken | ResolvedToken)[]): Token[] {
  return tokens
    .filter(
      (t) =>
        LEGACY_TYPES.has(t.type) &&
        typeof t.value !== "string" &&
        (!("file" in t) || t.file !== "generated"),
    )
    .map((t) => {
      const type = t.type as Token["type"];
      switch (type) {
        case "color":
          return { path: t.path, type, value: (t.value as ColorValue).hex };
        case "dimension":
        case "duration": {
          const v = t.value as Dimension | Duration;
          return { path: t.path, type, value: `${v.value}${v.unit}` };
        }
        default:
          return { path: t.path, type, value: t.value as SpringConfig };
      }
    });
}

/** Phase 0's output order, so the legacy outputs stay byte-identical. */
const LEGACY_ORDER = [
  "color.accent",
  "color.surface",
  "color.fg",
  "color.border",
  "space.1",
  "space.2",
  "space.4",
  "radius.md",
  "size.box",
  "motion.duration.base",
  "motion.spring.snappy",
];
const rank = (path: string) => {
  const i = LEGACY_ORDER.indexOf(path);
  return i === -1 ? LEGACY_ORDER.length : i;
};

const ordered = (tokens: Token[]) =>
  tokens
    .map((t, i) => ({ t, i }))
    .sort((a, b) => rank(a.t.path) - rank(b.t.path) || a.i - b.i)
    .map(({ t }) => t);

/** light = primitive + semantic + light; dark = the same with dark merged over light. */
export function legacySets(root: string): TokenSets {
  const layers = loadSource(root);
  assertTiers(layers);
  const { primitive, semantic, light, dark } = layers;
  const palettes = BUILT_IN_PALETTES();
  const lightPrimitive = [...colorPrimitives(palettes, "light"), ...primitive];
  const darkPrimitive = [...colorPrimitives(palettes, "dark"), ...primitive];
  const l = ordered(toLegacy([...resolve(lightPrimitive, semantic, light).values()]));
  const d = ordered(toLegacy([...resolve(darkPrimitive, semantic, light, dark).values()]));
  const lightValues = new Map(l.map((t) => [t.path, JSON.stringify(t.value)]));
  const darkOverrides = d.filter((t) => lightValues.get(t.path) !== JSON.stringify(t.value));
  return { light: l, dark: d, darkOverrides };
}
