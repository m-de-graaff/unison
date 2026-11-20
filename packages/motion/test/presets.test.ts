// @vitest-environment node
import { motionPresets } from "@unison-ui/tokens/motion";
import { describe, expect, it } from "vitest";
import { selectPhase } from "../src/shared";

describe.each(Object.entries(motionPresets.default))("%s", (name, preset) => {
  for (const phase of ["enter", "exit"] as const) {
    it(`${phase}: reduced picks the reduced variant, otherwise the main one`, () => {
      // press has no reduced variant: it shows itself with colour, so it keeps its own phase.
      expect(selectPhase(preset, phase, true)).toBe(
        preset.reduced ? preset.reduced[phase] : preset[phase],
      );
      expect(selectPhase(preset, phase, false)).toBe(preset[phase]);
    });
  }
  it("only press lacks a reduced variant", () => {
    expect(preset.reduced === null).toBe(name === "press");
  });
});
