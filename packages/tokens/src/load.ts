import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SourceLayers, ValidationError } from "./schema";
import { validateFile } from "./validate";

export class TokenValidationError extends Error {
  constructor(readonly errors: ValidationError[]) {
    const n = errors.length;
    super(
      [
        `${n} token error${n === 1 ? "" : "s"}:`,
        ...errors.map((e) => `  ${e.file} › ${e.path}: ${e.message}`),
      ].join("\n"),
    );
    this.name = "TokenValidationError";
  }
}

const jsonFiles = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .sort()
    : [];

/** Reads <root>/tokens/{primitive,semantic}/*.json, sorted by file name. */
export function loadSource(root: string): SourceLayers {
  const layers: SourceLayers = { primitive: [], semantic: [], light: [], dark: [] };
  const errors: ValidationError[] = [];
  for (const tier of ["primitive", "semantic"] as const) {
    for (const name of jsonFiles(join(root, "tokens", tier))) {
      const file = `tokens/${tier}/${name}`;
      let tree: unknown;
      try {
        tree = JSON.parse(readFileSync(join(root, file), "utf8"));
      } catch (e) {
        errors.push({ file, path: "<root>", message: `invalid JSON: ${(e as Error).message}` });
        continue;
      }
      const result = validateFile(file, tier, tree);
      errors.push(...result.errors);
      const layer =
        tier === "primitive"
          ? "primitive"
          : name === "color.light.json"
            ? "light"
            : name === "color.dark.json"
              ? "dark"
              : "semantic";
      layers[layer].push(...result.tokens);
    }
  }
  if (errors.length > 0) throw new TokenValidationError(errors);
  return layers;
}
