import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, it } from "vitest";
import { showcaseSections, type TokensJson } from "../src/showcase-data";

const json = JSON.parse(
  readFileSync(createRequire(import.meta.url).resolve("@unison-ui/tokens/tokens.json"), "utf8"),
) as TokensJson;

it("lists the sections in the todo's order", () => {
  expect(showcaseSections(json, "default", "light").map((s) => s.id)).toEqual([
    "semantic-colors",
    "palettes",
    "typography",
    "space",
    "radius-elevation",
    "motion",
  ]);
});

it("has 6 palettes of 11 steps and 10 type styles", () => {
  const [, palettes, typography] = showcaseSections(json, "default", "light");
  expect(palettes?.items).toHaveLength(6);
  for (const p of palettes?.items ?? []) expect(p.kind === "palette" && p.steps.length).toBe(11);
  expect(typography?.items).toHaveLength(10);
});

it.each(["light", "dark"] as const)(
  "every contrast badge passes for the default theme (%s)",
  (scheme) => {
    const swatches = showcaseSections(json, "default", scheme)[0]?.items ?? [];
    const badges = swatches.flatMap((i) => (i.kind === "swatch" && i.contrast ? [i.contrast] : []));
    expect(badges.length).toBeGreaterThan(10);
    expect(badges.every((b) => b.pass)).toBe(true);
  },
);

it("gives spring presets a 32-sample curve and timing presets none", () => {
  const motion = showcaseSections(json, "default", "light")[5]?.items ?? [];
  const curve = (p: string) => motion.find((i) => i.kind === "motion" && i.preset === p);
  expect(curve("scale-in")).toMatchObject({ curve: expect.any(Array) });
  expect((curve("scale-in") as { curve: number[] }).curve).toHaveLength(32);
  expect((curve("fade") as { curve: number[] }).curve).toEqual([]);
});

it("is deterministic", () => {
  expect(JSON.stringify(showcaseSections(json, "default", "dark"))).toBe(
    JSON.stringify(showcaseSections(json, "default", "dark")),
  );
});
