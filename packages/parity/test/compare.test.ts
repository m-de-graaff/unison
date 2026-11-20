import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { PNG } from "pngjs";
import { afterAll, expect, it } from "vitest";
import { compare, deltaE2000, sampleColor } from "../scripts/compare";
import type { Metrics, Platform } from "../src/types";

function filled(hex: string, size = 4): PNG {
  const png = new PNG({ width: size, height: size });
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  for (let i = 0; i < size * size; i++)
    png.data.set([r as number, g as number, b as number, 255], i * 4);
  return png;
}

it("samples the pixel at a stage point scaled by the pixel ratio", () => {
  expect(sampleColor(filled("#535cda"), { x: 1, y: 1 }, 2)).toBe("#535cda");
});

it("measures colour difference with CIEDE2000", () => {
  expect(deltaE2000("#535cda", "#535cda")).toBe(0);
  expect(deltaE2000("#535cda", "#5b5bd6")).toBeGreaterThan(1);
});

const tmp = mkdtempSync(join(tmpdir(), "parity-compare-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });
function write(
  dir: string,
  platform: Platform,
  run: string,
  metrics: Omit<Metrics, "platform" | "run">,
) {
  const file = join(dir, "metrics", platform, `${run}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ platform, run, ...metrics }));
}
const stage = rect(0, 0, 390, 200);

it("compares every part's y and height for type-ramp, not widths", () => {
  const dir = join(tmp, "type-ramp");
  const run = "type-ramp/all/default/light";
  const lines = (titleHeight: number, width: number) => ({
    subject: rect(16, 16, width, 100),
    "line-body": rect(16, 16, width, 24),
    "line-title": rect(16, 40, width, titleHeight),
  });
  write(dir, "web-chromium", run, { pixelRatio: 2, stage, parts: lines(28, 200) });
  write(dir, "ios", run, { pixelRatio: 3, stage, parts: lines(30, 180) }); // sabotaged line height
  const failures = compare({
    crossOnly: true,
    metricsDir: join(dir, "metrics"),
    screenshotsDir: join(dir, "shots"),
  });
  expect(failures.join("\n")).toMatch(
    /^FAIL type-ramp\/all\/default\/light: line-title\.height (web-chromium=28 ios=30|ios=30 web-chromium=28) \(Δ2\)$/,
  );
  expect(failures.some((f) => f.includes("width"))).toBe(false);
});

it("fails a swatch whose centre colour differs by more than ΔE 3", () => {
  const dir = join(tmp, "swatches");
  const run = "swatches/all/default/light";
  const parts = { subject: rect(16, 16, 40, 40), "swatch-8": rect(16, 16, 40, 40) };
  const samples = { "swatch-8": { x: 36, y: 36 } };
  write(dir, "web-chromium", run, { pixelRatio: 2, stage, parts, samples });
  write(dir, "ios", run, { pixelRatio: 3, stage, parts, samples });
  const shot = (platform: Platform, hex: string, ratio: number) => {
    const file = join(dir, "shots", platform, `${run}.png`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, PNG.sync.write(filled(hex, 60 * ratio)));
  };
  shot("web-chromium", "#535cda", 2);
  shot("ios", "#4b53cf", 3); // accent nudged a few steps
  const failures = compare({
    crossOnly: true,
    metricsDir: join(dir, "metrics"),
    screenshotsDir: join(dir, "shots"),
  });
  expect(failures).toHaveLength(1);
  expect(failures[0]).toMatch(
    /^FAIL swatches\/all\/default\/light: swatch-8 colour (web-chromium=#535cda ios=#4b53cf|ios=#4b53cf web-chromium=#535cda) \(ΔE \d+\.\d\d > 3\)$/,
  );
});
