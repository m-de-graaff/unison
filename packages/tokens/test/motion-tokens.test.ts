import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { compile } from "../src/index";

const out = mkdtempSync(join(tmpdir(), "unison-motion-"));
await compile({ cwd: join(import.meta.dirname, ".."), outDir: out });
const css = readFileSync(join(out, "web/tokens.css"), "utf8");
const native = (await import(join(out, "native/theme.js"))).themes.default.light;

it("web has four easings and six semantic durations", () => {
  for (const [name, curve] of [
    ["standard", "0.2, 0, 0, 1"],
    ["enter", "0.05, 0.7, 0.1, 1"],
    ["exit", "0.3, 0, 0.8, 0.15"],
    ["linear", "0, 0, 1, 1"],
  ]) {
    expect(css).toContain(`--unison-easing-${name}: cubic-bezier(${curve});`);
  }
  for (const [n, e, x] of [
    ["fast", 120, 80],
    ["base", 200, 140],
    ["slow", 320, 240],
  ]) {
    expect(css).toContain(`--unison-motion-duration-${n}-enter: var(--unison-duration-${e});`);
    expect(css).toContain(`--unison-motion-duration-${n}-exit: var(--unison-duration-${x});`);
  }
});

it("native has the tuples and plain milliseconds", () => {
  expect(native.motion.easing.enter).toEqual([0.05, 0.7, 0.1, 1]);
  expect(native.motion.duration["slow-exit"]).toBe(240);
  expect(Object.keys(native.motion.easing).sort()).toEqual(["enter", "exit", "linear", "standard"]);
});
