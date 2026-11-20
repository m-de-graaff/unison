import { join } from "node:path";
import { expect, it } from "vitest";
import { lintTiers } from "../src/lint-tiers";
import { loadSource } from "../src/load";

const src = loadSource(join(import.meta.dirname, ".."));
const paths = (layer: { path: string }[]) => layer.map((t) => t.path).sort();
const STATUS = ["success", "warning", "danger", "info"].flatMap((s) => [
  `color.${s}`,
  `color.${s}-subtle`,
  `color.${s}-fg`,
  `color.${s}-border`,
  `color.on-${s}`,
]);
const EXPECTED = [
  "canvas",
  "surface",
  "surface-raised",
  "subtle",
  "muted",
  "fg",
  "fg-muted",
  "fg-subtle",
  "border",
  "border-strong",
  "ring",
  "accent",
  "accent-hover",
  "accent-active",
  "accent-subtle",
  "accent-fg",
  "on-accent",
  "overlay",
]
  .map((n) => `color.${n}`)
  .concat(STATUS)
  .sort();

it("light and dark define exactly the same paths, and exactly the todo's set", () => {
  expect(paths(src.light)).toEqual(EXPECTED);
  expect(paths(src.dark)).toEqual(EXPECTED);
});

it("passes the tier lint", () => {
  expect(lintTiers(src)).toEqual([]);
});

it("only the overlay is raw", () => {
  expect(src.light.filter((t) => t.raw).map((t) => t.path)).toEqual(["color.overlay"]);
});
