import { join } from "node:path";
import { expect, it } from "vitest";
import { loadSource, TokenValidationError } from "../src/load";
import { validateFile } from "../src/validate";

const file = "tokens/primitive/space.json";

it("rejects an em dimension with file, path and the allowed units", () => {
  const { errors } = validateFile(file, "primitive", {
    space: { "2": { $type: "dimension", $value: "8em" } },
  });
  expect(errors.map((e) => `${e.file} › ${e.path}: ${e.message}`)).toEqual([
    'tokens/primitive/space.json › space.2: unit "em" not allowed (px, rem)',
  ]);
});

it("normalises both dimension forms to the object form", () => {
  const { tokens, errors } = validateFile(file, "primitive", {
    space: {
      $type: "dimension",
      "1": { $value: "4px" },
      "2": { $value: { value: 0.5, unit: "rem" } },
    },
  });
  expect(errors).toEqual([]);
  expect(tokens.map((t) => t.value)).toEqual([
    { value: 4, unit: "px" },
    { value: 0.5, unit: "rem" },
  ]);
});

it("keeps aliases unresolved, including inside composites", () => {
  const { tokens, errors } = validateFile("tokens/semantic/text.json", "semantic", {
    text: {
      body: {
        $type: "typography",
        $value: {
          fontFamily: "{font-family.sans}",
          fontWeight: "{font-weight.regular}",
          fontSize: "16px",
          lineHeight: "24px",
          letterSpacing: "-0.011em",
        },
      },
    },
  });
  expect(errors).toEqual([]);
  expect(tokens[0]?.value).toMatchObject({ fontFamily: "{font-family.sans}" });
});

it("reports every error in a file, not just the first", () => {
  expect(() => loadSource(join(import.meta.dirname, "fixtures/three-errors"))).toThrow(
    TokenValidationError,
  );
  try {
    loadSource(join(import.meta.dirname, "fixtures/three-errors"));
  } catch (e) {
    expect((e as TokenValidationError).errors).toHaveLength(3);
    expect((e as Error).message).toBe(
      [
        "3 token errors:",
        '  tokens/primitive/space.json › space.1: unit "em" not allowed (px, rem)',
        '  tokens/primitive/space.json › space.2: expected dimension, got "big"',
        '  tokens/primitive/space.json › space.3: unknown $type "size"',
      ].join("\n"),
    );
  }
});

it("marks the tier by folder and reads the raw extension", () => {
  const { tokens } = validateFile("tokens/semantic/color.light.json", "semantic", {
    color: {
      overlay: {
        $type: "color",
        $value: "#00000080",
        $extensions: { "dev.unison": { raw: true } },
      },
    },
  });
  expect(tokens[0]).toMatchObject({ tier: "semantic", raw: true, value: { hex: "#00000080" } });
});

it("rejects a motionPreset with a bad reduced mode or translateY", () => {
  const preset = (reduced: string, translateY: unknown) => ({
    p: {
      $type: "motionPreset",
      $value: {
        enter: {
          from: { translateY },
          to: { translateY: 0 },
          transition: { spring: "{spring.snappy}" },
        },
        exit: { to: { opacity: 0 }, transition: { spring: "{spring.snappy}" } },
        reduced,
      },
    },
  });
  expect(validateFile(file, "semantic", preset("opacity", "100%")).errors).toEqual([]);
  expect(validateFile(file, "semantic", preset("fade", 8)).errors[0]?.message).toMatch(
    /reduced: expected "opacity" or "none"/,
  );
  expect(validateFile(file, "semantic", preset("opacity", "tall")).errors[0]?.message).toMatch(
    /enter: from: translateY: unexpected "tall"/,
  );
});
