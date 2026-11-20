import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { WARM_UP_TIMEOUT_MS, warmUpCommands } from "../scripts/flow";

const caseYaml = readFileSync(join(import.meta.dirname, "../maestro/case.yaml"), "utf8");
const commands = caseYaml.slice(caseYaml.indexOf("\n---\n") + 5);

it("gives the warm-up launch the cold-start wait and no screenshot", () => {
  const warm = warmUpCommands(commands);
  expect(warm).toContain(`timeout: ${WARM_UP_TIMEOUT_MS}`);
  expect(warm).not.toMatch(/timeout: 15000/);
  expect(warm).not.toMatch(/takeScreenshot/);
  // Everything else is the run's own commands.
  expect(warm).toContain("openLink:");
  expect(warm).toContain('id: "parity-ready"');
});

it("leaves the real runs' wait alone", () => {
  expect(commands).toMatch(/timeout: 15000/);
});

it("throws if case.yaml no longer has the step it rewrites", () => {
  expect(() => warmUpCommands("- openLink: x\n")).toThrow(/case\.yaml/);
});
