import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { SchemeBuild, ThemeBuild } from "./build";
import { expandPresets } from "./motion/presets";
import { nativeKey } from "./paths";
import type { ColorValue, Dimension, ShadowLayer, Typography } from "./schema";
import { shadowToCss } from "./shadow";
import type { SpringConfig } from "./spring";
import { toNativeTextStyle } from "./typography";

/** One token as it sits in a `UnisonTheme`. */
export interface NativeEntry {
  path: string;
  tier: "primitive" | "semantic";
  /** Where it lives, from `nativeKey`. */
  keys: readonly string[];
  value: unknown;
  /** The TypeScript type of `value`, for the generated `UnisonTheme`. */
  ts: string;
}

const ROOT_PX = 16;
const px = (d: Dimension) => (d.unit === "rem" ? d.value * ROOT_PX : d.value);
/** Primitives that only feed text styles; the styles are in the theme instead. */
const TEXT_PRIMITIVE = /^(font-size|line-height|letter-spacing)\./;

export const NATIVE_TYPES = {
  number: "number",
  string: "string",
  bezier: "readonly [number, number, number, number]",
  spring: "{ readonly stiffness: number; readonly damping: number; readonly mass: number }",
  text: "NativeTextStyle",
  transition: "ResolvedTransition",
  preset: "MotionPresetValue",
} as const;

/** Every token of one scheme that has a native form, in path order. */
export function nativeEntries(build: ThemeBuild, scheme: SchemeBuild): NativeEntry[] {
  const tokens = scheme.tokens;
  const presets = expandPresets(build.light.tokens, build.motion);
  const mono = JSON.stringify(tokens.get("font-family.mono")?.value);
  const out: NativeEntry[] = [];
  for (const t of tokens.values()) {
    if (TEXT_PRIMITIVE.test(t.path)) continue;
    const keys = nativeKey(t.path);
    let value: unknown;
    let ts: string = NATIVE_TYPES.number;
    switch (t.type) {
      case "color":
        value = (t.value as ColorValue).hex;
        ts = NATIVE_TYPES.string;
        break;
      case "dimension":
        value = px(t.value as Dimension);
        break;
      case "duration":
        value = (t.value as { value: number }).value;
        break;
      case "number":
      case "fontWeight":
        value = t.value;
        break;
      case "fontFamily": {
        const family = t.path === "font-family.mono" ? "mono" : "sans";
        value = build.nativeFonts[family][400];
        if (typeof value !== "string") throw new Error(`no native font for ${family} 400`);
        ts = NATIVE_TYPES.string;
        break;
      }
      case "cubicBezier":
        value = [...(t.value as number[])];
        ts = NATIVE_TYPES.bezier;
        break;
      case "spring": {
        const { stiffness, damping, mass } = t.value as SpringConfig;
        value = { stiffness, damping, mass };
        ts = NATIVE_TYPES.spring;
        break;
      }
      case "shadow":
        value = shadowToCss(t.value as ShadowLayer[]);
        ts = NATIVE_TYPES.string;
        break;
      case "typography": {
        const style = t.value as Typography;
        const family = JSON.stringify(style.fontFamily) === mono ? "mono" : "sans";
        value = { ...toNativeTextStyle(style, family, build.nativeFonts) };
        ts = NATIVE_TYPES.text;
        break;
      }
      case "transition": {
        const v = t.value as {
          duration?: { value: number };
          easing?: number[];
          spring?: SpringConfig;
        };
        if (v.spring) {
          const { stiffness, damping, mass } = v.spring;
          value = { type: "spring", config: { stiffness, damping, mass } };
        } else {
          value = { type: "timing", duration: v.duration?.value, easing: [...(v.easing ?? [])] };
        }
        ts = NATIVE_TYPES.transition;
        break;
      }
      case "motionPreset":
        value = presets[t.path.slice("motion.preset.".length) as keyof typeof presets];
        ts = NATIVE_TYPES.preset;
        break;
    }
    out.push({ path: t.path, tier: t.tier, keys, value, ts });
  }
  return out;
}

interface Tree {
  [key: string]: Tree | unknown;
}

function place(root: Tree, keys: readonly string[], leaf: unknown) {
  let node = root;
  for (const key of keys.slice(0, -1)) {
    const next = node[key] ?? {};
    node[key] = next;
    node = next as Tree;
  }
  node[keys.at(-1) as string] = leaf;
}

/** The nested `UnisonTheme` object for one scheme. */
export function themeTree(entries: NativeEntry[]): Tree {
  const root: Tree = {};
  for (const e of entries) place(root, e.keys, e.value);
  return root;
}

class TypeLeaf {
  constructor(readonly ts: string) {}
}

/** The `UnisonTheme` body: a nested readonly object type, from the entries' own types. */
export function themeType(entries: NativeEntry[]): string {
  const root: Tree = {};
  for (const e of entries) place(root, e.keys, new TypeLeaf(e.ts));
  const walk = (node: Tree, depth: number): string => {
    const pad = "  ".repeat(depth + 1);
    const lines = Object.entries(node).map(
      ([k, v]) =>
        `${pad}readonly ${JSON.stringify(k)}: ${v instanceof TypeLeaf ? v.ts : walk(v as Tree, depth + 1)};`,
    );
    return `{\n${lines.join("\n")}\n${"  ".repeat(depth)}}`;
  };
  return walk(root, 0);
}

/** Writes dist/native/theme.js and theme.d.ts, `themes[name].{light,dark}`; returns the paths. */
export function emitNative(outDir: string, themes: ThemeBuild[]): string[] {
  mkdirSync(outDir, { recursive: true });
  const data = Object.fromEntries(
    themes.map((b) => [
      b.name,
      {
        light: themeTree(nativeEntries(b, b.light)),
        dark: themeTree(nativeEntries(b, b.dark)),
      },
    ]),
  );
  const js = `export const themes = ${JSON.stringify(data, null, 2)};\n`;
  const dts = [
    'import type { UnisonTheme } from "../types.js";',
    "",
    "export declare const themes: {",
    ...themes.map(
      (b) =>
        `  readonly ${JSON.stringify(b.name)}: { readonly light: UnisonTheme; readonly dark: UnisonTheme };`,
    ),
    "};",
    "",
  ].join("\n");
  const jsPath = join(outDir, "theme.js");
  const dtsPath = join(outDir, "theme.d.ts");
  writeFileSync(jsPath, js);
  writeFileSync(dtsPath, dts);
  return [jsPath, dtsPath];
}
