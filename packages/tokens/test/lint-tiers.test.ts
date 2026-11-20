import { expect, it } from "vitest";
import { lintTiers } from "../src/lint-tiers";
import type { SourceLayers, SourceToken } from "../src/schema";

const tok = (
  path: string,
  value: unknown,
  tier: SourceToken["tier"],
  extra: Partial<SourceToken> = {},
): SourceToken => ({ path, type: "color", value, tier, file: `tokens/${tier}/x.json`, ...extra });
const layers = (p: Partial<SourceLayers>): SourceLayers => ({
  primitive: [],
  semantic: [],
  light: [],
  dark: [],
  ...p,
});

it("rejects a raw hex in a semantic token, with its path", () => {
  expect(
    lintTiers(
      layers({
        light: [tok("color.fg", { hex: "#111111" }, "semantic")],
        dark: [tok("color.fg", "{color.gray.950}", "semantic")],
      }),
    ),
  ).toEqual([
    "semantic token color.fg (tokens/semantic/x.json): raw value not allowed, alias a primitive or mark it raw",
  ]);
});

it("allows raw when marked", () => {
  const overlay = tok("color.overlay", { hex: "#00000080" }, "semantic", { raw: true });
  expect(lintTiers(layers({ light: [overlay], dark: [overlay] }))).toEqual([]);
});

it("forbids primitives aliasing semantic tokens", () => {
  expect(
    lintTiers(
      layers({
        primitive: [tok("color.x", "{color.fg}", "primitive")],
        light: [tok("color.fg", "{color.x}", "semantic")],
        dark: [tok("color.fg", "{color.x}", "semantic")],
      }),
    ),
  ).toContain(
    "primitive token color.x (tokens/primitive/x.json): may not alias semantic token color.fg",
  );
});

it("requires every semantic colour in both schemes", () => {
  expect(
    lintTiers(layers({ light: [tok("color.fg-muted", "{color.gray.700}", "semantic")] })),
  ).toEqual(["semantic colour color.fg-muted: missing in dark"]);
});
