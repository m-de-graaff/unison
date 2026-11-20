import { expect, it } from "vitest";
import { resolve } from "../src/resolve";
import type { SourceToken } from "../src/schema";

const t = (
  path: string,
  type: SourceToken["type"],
  value: unknown,
  tier: SourceToken["tier"] = "primitive",
): SourceToken => ({ path, type, value, tier, file: "test.json" });

it("resolves a three-step chain and keeps the direct reference", () => {
  const map = resolve([
    t("color.gray.900", "color", { hex: "#111111" }),
    t("color.ink", "color", "{color.gray.900}"),
    t("color.text", "color", "{color.ink}"),
    t("color.fg", "color", "{color.text}", "semantic"),
  ]);
  expect(map.get("color.fg")).toMatchObject({ value: { hex: "#111111" }, aliasOf: "color.text" });
});

it("resolves an alias inside a composite", () => {
  const map = resolve([
    t("font-family.sans", "fontFamily", ["Inter"]),
    t(
      "text.body",
      "typography",
      {
        fontFamily: "{font-family.sans}",
        fontWeight: 400,
        fontSize: { value: 16, unit: "px" },
        lineHeight: { value: 24, unit: "px" },
        letterSpacing: { value: 0, unit: "em" },
      },
      "semantic",
    ),
  ]);
  expect(map.get("text.body")?.value).toMatchObject({ fontFamily: ["Inter"] });
});

it("prints the full cycle", () => {
  expect(() =>
    resolve([t("a", "color", "{b}"), t("b", "color", "{c}"), t("c", "color", "{a}")]),
  ).toThrow("alias cycle: a → b → c → a");
});

it("names the token and the missing path", () => {
  expect(() => resolve([t("color.fg", "color", "{color.grey.900}")])).toThrow(
    "color.fg: unknown reference {color.grey.900}",
  );
});

it("rejects a type mismatch", () => {
  expect(() =>
    resolve([
      t("space.4", "dimension", { value: 16, unit: "px" }),
      t("color.fg", "color", "{space.4}"),
    ]),
  ).toThrow("color.fg: type mismatch, color aliases dimension space.4");
});

it("later layers win per path", () => {
  const map = resolve(
    [t("color.a", "color", { hex: "#000000" }), t("color.b", "color", "{color.a}")],
    [t("color.a", "color", { hex: "#ffffff" })],
  );
  expect(map.get("color.b")?.value).toEqual({ hex: "#ffffff" });
});
