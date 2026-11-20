import {
  isAlias,
  type SourceToken,
  type Tier,
  TOKEN_TYPES,
  type TokenType,
  type ValidationError,
} from "./schema";

type Result = { ok: true; value: unknown } | { ok: false; message: string };

const ok = (value: unknown): Result => ({ ok: true, value });
const bad = (type: string, value: unknown): Result => ({
  ok: false,
  message: `expected ${type}, got ${JSON.stringify(value)}`,
});

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isPositive = (v: unknown) => isNumber(v) && v > 0;

const NUMBER_UNIT = /^(-?(?:\d+\.?\d*|\.\d+))([a-z%]*)$/i;

function measure(
  type: string,
  value: unknown,
  units: readonly string[],
  unitError: boolean,
): Result {
  let n: unknown;
  let unit: unknown;
  if (typeof value === "string") {
    const m = NUMBER_UNIT.exec(value.trim());
    if (!m) return bad(type, value);
    n = Number(m[1]);
    unit = (m[2] as string).toLowerCase();
  } else if (isRecord(value)) {
    n = value.value;
    unit = value.unit;
  } else {
    return bad(type, value);
  }
  if (!isNumber(n) || typeof unit !== "string" || unit === "") return bad(type, value);
  if (!units.includes(unit)) {
    return unitError
      ? { ok: false, message: `unit "${unit}" not allowed (${units.join(", ")})` }
      : bad(type, value);
  }
  return ok({ value: n, unit });
}

const dimension = (v: unknown) => measure("dimension", v, ["px", "rem"], true);
const duration = (v: unknown) => measure("duration", v, ["ms"], false);

function color(v: unknown): Result {
  const hex = isRecord(v) ? v.hex : v;
  if (typeof hex !== "string" || !/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) {
    return bad("color", v);
  }
  let h = hex.slice(1).toLowerCase();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const out: { hex: string; oklch?: string } = { hex: `#${h}` };
  if (isRecord(v) && typeof v.oklch === "string") out.oklch = v.oklch;
  return ok(out);
}

/** Splits a CSS font-family list on commas outside quotes and strips the quotes. */
function splitFamilies(s: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (const ch of s) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out.filter((f) => f !== "");
}

function fontFamily(v: unknown): Result {
  if (typeof v === "string") {
    const list = splitFamilies(v);
    return list.length > 0 ? ok(list) : bad("fontFamily", v);
  }
  if (Array.isArray(v) && v.length > 0 && v.every((f) => typeof f === "string" && f.trim())) {
    return ok(v.map((f: string) => f.trim()));
  }
  return bad("fontFamily", v);
}

const fontWeight = (v: unknown): Result =>
  isNumber(v) && v >= 1 && v <= 1000 ? ok(v) : bad("fontWeight", v);

function cubicBezier(v: unknown): Result {
  if (!Array.isArray(v) || v.length !== 4 || !v.every(isNumber)) return bad("cubicBezier", v);
  const [x1, , x2] = v as number[];
  if ((x1 as number) < 0 || (x1 as number) > 1 || (x2 as number) < 0 || (x2 as number) > 1) {
    return bad("cubicBezier", v);
  }
  return ok([...v]);
}

function spring(v: unknown): Result {
  if (!isRecord(v) || !isPositive(v.stiffness) || !isPositive(v.damping) || !isPositive(v.mass)) {
    return bad("spring", v);
  }
  return ok({ stiffness: v.stiffness, damping: v.damping, mass: v.mass });
}

/** Normalises one field of a composite; aliases pass through unchanged. */
function field(name: string, check: (v: unknown) => Result, v: unknown): Result {
  if (isAlias(v)) return ok(v);
  const r = check(v);
  return r.ok ? r : { ok: false, message: `${name}: ${r.message}` };
}

function composite(
  type: string,
  v: unknown,
  fields: Record<string, (v: unknown) => Result>,
  optional: Record<string, (v: unknown) => Result> = {},
): Result {
  if (!isRecord(v)) return bad(type, v);
  const out: Record<string, unknown> = {};
  for (const [name, check] of Object.entries(fields)) {
    if (!(name in v)) return { ok: false, message: `${name}: missing` };
    const r = field(name, check, v[name]);
    if (!r.ok) return r;
    out[name] = r.value;
  }
  for (const [name, check] of Object.entries(optional)) {
    if (!(name in v)) continue;
    const r = field(name, check, v[name]);
    if (!r.ok) return r;
    out[name] = r.value;
  }
  return ok(out);
}

const letterSpacing = (v: unknown) => measure("letterSpacing", v, ["em", "px"], false);
const boolean = (v: unknown): Result => (typeof v === "boolean" ? ok(v) : bad("boolean", v));

const typography = (v: unknown) =>
  composite("typography", v, {
    fontFamily,
    fontWeight,
    fontSize: dimension,
    lineHeight: dimension,
    letterSpacing,
  });

const shadowLayer = (v: unknown) =>
  composite(
    "shadow",
    v,
    { x: dimension, y: dimension, blur: dimension, spread: dimension, color },
    { inset: boolean },
  );

function shadow(v: unknown): Result {
  const layers = Array.isArray(v) ? v : [v];
  if (layers.length === 0) return bad("shadow", v);
  const out: unknown[] = [];
  for (const layer of layers) {
    if (isAlias(layer)) {
      out.push(layer);
      continue;
    }
    const r = shadowLayer(layer);
    if (!r.ok) return r;
    out.push(r.value);
  }
  return ok(out);
}

function transition(v: unknown): Result {
  if (isRecord(v) && "spring" in v) return composite("transition", v, { spring });
  return composite("transition", v, { duration, easing: cubicBezier });
}

const motionPreset = (v: unknown): Result => (isRecord(v) ? ok(v) : bad("motionPreset", v));
const number = (v: unknown): Result => (isNumber(v) ? ok(v) : bad("number", v));

const NORMALISERS: Record<TokenType, (v: unknown) => Result> = {
  color,
  dimension,
  duration,
  number,
  fontFamily,
  fontWeight,
  cubicBezier,
  typography,
  shadow,
  transition,
  spring,
  motionPreset,
};

/** Validates and normalises one value. A whole-value alias passes through unchanged. */
export function normalise(type: TokenType, value: unknown): Result {
  return isAlias(value) ? ok(value) : NORMALISERS[type](value);
}

const TYPES = new Set<string>(TOKEN_TYPES);

/**
 * Flattens and validates one DTCG file. A token without its own `$type` inherits the nearest
 * group's. Every error in the file is collected, not just the first.
 */
export function validateFile(
  file: string,
  tier: Tier,
  tree: unknown,
): { tokens: SourceToken[]; errors: ValidationError[] } {
  const tokens: SourceToken[] = [];
  const errors: ValidationError[] = [];

  function walk(node: unknown, prefix: string, inherited: unknown): void {
    if (!isRecord(node)) {
      errors.push({ file, path: prefix || "<root>", message: "expected a token or a group" });
      return;
    }
    const groupType = "$type" in node ? node.$type : inherited;
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (isRecord(child) && "$value" in child) {
        const type = "$type" in child ? child.$type : groupType;
        if (typeof type !== "string" || !TYPES.has(type)) {
          errors.push({ file, path, message: `unknown $type "${String(type)}"` });
          continue;
        }
        const r = normalise(type as TokenType, child.$value);
        if (!r.ok) {
          errors.push({ file, path, message: r.message });
          continue;
        }
        const ext = isRecord(child.$extensions) ? child.$extensions["dev.unison"] : undefined;
        const token: SourceToken = { path, type: type as TokenType, value: r.value, file, tier };
        if (typeof child.$description === "string") token.description = child.$description;
        if (isRecord(ext) && ext.raw === true) token.raw = true;
        tokens.push(token);
      } else {
        walk(child, path, groupType);
      }
    }
  }

  walk(tree, "", undefined);
  return { tokens, errors };
}
