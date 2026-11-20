import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { SchemeBuild, ThemeBuild } from "./build";
import type { ColorValue, Dimension, TokenType } from "./schema";

export interface ContrastEntry {
  on: string;
  ratio: number;
  apca: number;
  min: number;
  pass: boolean;
  adjusted?: { from: string; to: string };
}
export interface Entry {
  type: TokenType;
  value: unknown;
  oklch?: string;
  aliasOf?: string;
  tier: "primitive" | "semantic";
  description?: string;
  contrast?: ContrastEntry[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const measure = (d: Dimension | { value: number; unit: string }) => `${d.value}${d.unit}`;

function jsonValue(type: TokenType, value: unknown): unknown {
  switch (type) {
    case "color":
      return (value as ColorValue).hex;
    case "dimension":
    case "duration":
      return measure(value as Dimension);
    default:
      return value;
  }
}

function schemeEntries(scheme: SchemeBuild): Record<string, Entry> {
  const out: Record<string, Entry> = {};
  for (const t of scheme.tokens.values()) {
    const contrast = scheme.contrast
      .filter((r) => r.fg === t.path)
      .map(
        (r): ContrastEntry => ({
          on: r.bg,
          ratio: r2(r.ratio),
          apca: r.apca,
          min: r.min,
          pass: r.pass,
          ...(r.adjusted ? { adjusted: r.adjusted } : {}),
        }),
      );
    const oklch = t.type === "color" ? (t.value as ColorValue).oklch : undefined;
    out[t.path] = {
      type: t.type,
      value: jsonValue(t.type, t.value),
      ...(oklch ? { oklch } : {}),
      ...(t.aliasOf ? { aliasOf: t.aliasOf } : {}),
      tier: t.tier,
      ...(t.description ? { description: t.description } : {}),
      ...(contrast.length > 0 ? { contrast } : {}),
    };
  }
  return out;
}

/** Writes dist/tokens.json: every token of every theme and scheme, for docs and other tools. */
export function emitJson(outDir: string, themes: ThemeBuild[], defaultTheme: string): string[] {
  mkdirSync(outDir, { recursive: true });
  const json = {
    version: 1,
    defaultTheme,
    themes: Object.fromEntries(
      themes.map((t) => [t.name, { light: schemeEntries(t.light), dark: schemeEntries(t.dark) }]),
    ),
  };
  const path = join(outDir, "tokens.json");
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
  return [path];
}
