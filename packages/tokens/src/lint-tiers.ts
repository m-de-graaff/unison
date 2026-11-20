import { ALIAS, isAlias, type SourceLayers, type SourceToken } from "./schema";

export class TierError extends Error {
  override name = "TierError";
  constructor(readonly problems: string[]) {
    super(["tier lint:", ...problems.map((p) => `  ${p}`)].join("\n"));
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Composite fields that are structure, not design values, and may stay literal. */
const STRUCTURAL_FIELDS = new Set(["inset"]);

/**
 * True when a semantic token's value (or one field of a composite) is a literal design value
 * rather than an alias. Every field of a typography, shadow or transition must be an alias
 * (`fontWeight` numbers and `transition.spring` included); `motionPreset` bodies are structure
 * until Task 13.1 defines them.
 */
export function isRawLeaf(tok: SourceToken): boolean {
  const v = tok.value;
  if (isAlias(v)) return false;
  switch (tok.type) {
    case "motionPreset":
      return false;
    case "typography":
    case "transition":
      return (
        !isRecord(v) || Object.entries(v).some(([k, x]) => !STRUCTURAL_FIELDS.has(k) && !isAlias(x))
      );
    case "shadow":
      return (
        !Array.isArray(v) ||
        v.some(
          (layer) =>
            !isAlias(layer) &&
            (!isRecord(layer) ||
              Object.entries(layer).some(([k, x]) => !STRUCTURAL_FIELDS.has(k) && !isAlias(x))),
        )
      );
    default:
      return true;
  }
}

function aliasesIn(v: unknown): string[] {
  if (isAlias(v)) return [(ALIAS.exec(v) as RegExpExecArray)[1] as string];
  if (Array.isArray(v)) return v.flatMap(aliasesIn);
  if (isRecord(v)) return Object.values(v).flatMap(aliasesIn);
  return [];
}

/** Returns every tier-rule violation; empty means the source passes. */
export function lintTiers(layers: SourceLayers): string[] {
  const problems: string[] = [];
  const semantic = [...layers.semantic, ...layers.light, ...layers.dark];
  const semanticPaths = new Set(semantic.map((t) => t.path));

  for (const tok of semantic) {
    if (!tok.raw && isRawLeaf(tok)) {
      problems.push(
        `semantic token ${tok.path} (${tok.file}): raw value not allowed, alias a primitive or mark it raw`,
      );
    }
  }
  for (const tok of layers.primitive) {
    for (const ref of aliasesIn(tok.value)) {
      if (semanticPaths.has(ref)) {
        problems.push(
          `primitive token ${tok.path} (${tok.file}): may not alias semantic token ${ref}`,
        );
      }
    }
  }
  const colours = (layer: SourceToken[]) =>
    new Set(layer.filter((t) => t.type === "color").map((t) => t.path));
  const light = colours(layers.light);
  const dark = colours(layers.dark);
  for (const path of [...light].sort()) {
    if (!dark.has(path)) problems.push(`semantic colour ${path}: missing in dark`);
  }
  for (const path of [...dark].sort()) {
    if (!light.has(path)) problems.push(`semantic colour ${path}: missing in light`);
  }
  return problems;
}

export function assertTiers(layers: SourceLayers): void {
  const problems = lintTiers(layers);
  if (problems.length > 0) throw new TierError(problems);
}
