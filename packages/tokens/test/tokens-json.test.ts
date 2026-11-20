import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Ajv from "ajv/dist/2020.js";
import { expect, it } from "vitest";
import schema from "../schema/tokens.schema.json" with { type: "json" };
import { compile } from "../src/index";

const out = mkdtempSync(join(tmpdir(), "unison-tokens-json-"));
await compile({ cwd: join(import.meta.dirname, ".."), outDir: out });
const json = JSON.parse(readFileSync(join(out, "tokens.json"), "utf8"));

it("validates against the committed schema", () => {
  const validate = new Ajv({ allErrors: true }).compile(schema);
  expect(validate(json), JSON.stringify(validate.errors)).toBe(true);
});
it("carries alias, tier, description and contrast", () => {
  expect(json.version).toBe(1);
  expect(json.defaultTheme).toBe("default");
  expect(json.themes.default.light["color.fg"]).toMatchObject({
    aliasOf: "color.gray.950",
    tier: "semantic",
    description: "Primary text",
    contrast: expect.arrayContaining([
      expect.objectContaining({ on: "color.surface", min: 4.5, pass: true }),
    ]),
  });
});
it("carries both schemes and oklch on colour primitives", () => {
  expect(Object.keys(json.themes.default)).toEqual(["light", "dark"]);
  expect(json.themes.default.light["color.gray.500"].oklch).toMatch(/^oklch\(/);
  expect(json.themes.default.dark["color.canvas"].value).not.toBe(
    json.themes.default.light["color.canvas"].value,
  );
});
