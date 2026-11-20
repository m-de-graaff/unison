import { expect, it } from "vitest";
import { editDistance, nearest } from "../src/suggest";

it("measures edit distance", () => {
  expect(editDistance("acent", "accent")).toBe(1);
  expect(editDistance("medium", "md")).toBe(4);
});

it("suggests within 3 edits, or an abbreviation of the input", () => {
  expect(nearest("acent", ["accent", "neutral"])).toBe("accent");
  expect(nearest("medium", ["none", "sm", "md", "lg", "full"])).toBe("md");
  expect(nearest("grey", ["gray", "neutral", "slate", "warm"])).toBe("gray");
});

it("gives nothing when no option is close", () => {
  expect(nearest("xyzzy", ["none", "sm", "md", "lg", "full"])).toBeUndefined();
});
