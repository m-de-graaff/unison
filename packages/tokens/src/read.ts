import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SpringConfig } from "./spring";

export type TokenType = "color" | "dimension" | "duration" | "spring";

export interface Token {
  path: string;
  type: TokenType;
  value: string | SpringConfig;
}

export interface TokenSets {
  light: Token[];
  dark: Token[];
  darkOverrides: Token[];
}

const TYPES = new Set<string>(["color", "dimension", "duration", "spring"]);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isPositive = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n > 0;

function validValue(type: TokenType, value: unknown): boolean {
  switch (type) {
    case "color":
      return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
    case "dimension":
      return typeof value === "string" && /^-?\d+(\.\d+)?px$/.test(value);
    case "duration":
      return typeof value === "string" && /^\d+(\.\d+)?ms$/.test(value);
    case "spring":
      return (
        isRecord(value) &&
        isPositive(value.stiffness) &&
        isPositive(value.damping) &&
        isPositive(value.mass)
      );
  }
}

/**
 * Flattens a DTCG tree into `{ path, type, value }` records. A token without its own `$type`
 * inherits the nearest group's, as the DTCG format allows. Throws with the token path.
 */
export function flatten(tree: unknown, prefix = "", inheritedType?: unknown): Token[] {
  if (!isRecord(tree)) throw new Error(`Expected an object at ${prefix || "<root>"}`);
  const groupType = "$type" in tree ? tree.$type : inheritedType;
  const out: Token[] = [];
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith("$")) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isRecord(node) && "$value" in node) {
      const type = "$type" in node ? node.$type : groupType;
      if (typeof type !== "string" || !TYPES.has(type)) {
        throw new Error(`Unknown $type "${String(type)}" at ${path}`);
      }
      if (!validValue(type as TokenType, node.$value)) {
        throw new Error(`Malformed ${type} value at ${path}: ${JSON.stringify(node.$value)}`);
      }
      out.push({ path, type: type as TokenType, value: node.$value as Token["value"] });
    } else {
      out.push(...flatten(node, path, groupType));
    }
  }
  return out;
}

const readJson = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));

/** Loads tokens/base.json and tokens/dark.json and resolves the dark set over the light one. */
export function readTokens(cwd: string): TokenSets {
  const light = flatten(readJson(join(cwd, "tokens/base.json")));
  const darkOverrides = flatten(readJson(join(cwd, "tokens/dark.json")));
  const overrides = new Map(darkOverrides.map((t) => [t.path, t]));
  for (const t of darkOverrides) {
    if (!light.some((l) => l.path === t.path)) {
      throw new Error(`dark.json overrides ${t.path}, which base.json does not define`);
    }
  }
  const dark = light.map((t) => overrides.get(t.path) ?? t);
  return { light, dark, darkOverrides };
}
