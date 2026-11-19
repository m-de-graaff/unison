import { expect, it } from "vitest";
import { flatten } from "../src/read";

it("inherits $type from the nearest group, as DTCG allows", () => {
  const tokens = flatten({
    color: { $type: "color", accent: { $value: "#5b5bd6" }, fg: { $value: "#111113" } },
    space: { $type: "dimension", "1": { $value: "4px" }, nested: { "2": { $value: "8px" } } },
  });
  expect(tokens).toEqual([
    { path: "color.accent", type: "color", value: "#5b5bd6" },
    { path: "color.fg", type: "color", value: "#111113" },
    { path: "space.1", type: "dimension", value: "4px" },
    { path: "space.nested.2", type: "dimension", value: "8px" },
  ]);
});

it("a token's own $type overrides its group's", () => {
  const [token] = flatten({ g: { $type: "dimension", d: { $type: "duration", $value: "200ms" } } });
  expect(token).toEqual({ path: "g.d", type: "duration", value: "200ms" });
});

it("still names the path when no $type is set anywhere", () => {
  expect(() => flatten({ color: { accent: { $value: "#5b5bd6" } } })).toThrow(
    'Unknown $type "undefined" at color.accent',
  );
});
