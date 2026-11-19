// Cross-platform layout comparison (±1 px) and per-platform screenshot baselines.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import {
  baselinePath,
  CROSS_PLATFORMS,
  type Metrics,
  OUT,
  PLATFORMS,
  type Platform,
} from "../src/types";

export interface CompareOptions {
  update?: boolean;
  baselineOnly?: boolean;
  crossOnly?: boolean;
  /** Directory holding <platform>/<run>.json; defaults to parity-output/metrics. */
  metricsDir?: string;
}

const TOLERANCE_PX = 1;
const PIXEL_THRESHOLD = 0.1;
const MAX_DIFF_RATIO = 0.001;

function walk(dir: string, ext: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, ext, out);
    else if (full.endsWith(ext)) out.push(full);
  }
  return out;
}

const runIdOf = (root: string, file: string, ext: string) =>
  relative(root, file).split("\\").join("/").slice(0, -ext.length);

function compareCross(metricsDir: string): { failures: string[]; runs: number } {
  const failures: string[] = [];
  const byRun = new Map<string, Map<Platform, Metrics>>();
  for (const platform of CROSS_PLATFORMS) {
    const root = join(metricsDir, platform);
    for (const file of walk(root, ".json")) {
      const run = runIdOf(root, file, ".json");
      const metrics = JSON.parse(readFileSync(file, "utf8")) as Metrics;
      if (!byRun.has(run)) byRun.set(run, new Map());
      byRun.get(run)?.set(platform, metrics);
    }
  }
  // Only the platforms present are compared (docs/plans/phase-0.md, OQ-14).
  for (const [run, platforms] of [...byRun].sort(([a], [b]) => a.localeCompare(b))) {
    const entries = [...platforms];
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [pa, a] = entries[i] as [Platform, Metrics];
        const [pb, b] = entries[j] as [Platform, Metrics];
        for (const prop of ["x", "y", "width", "height"] as const) {
          const va = a.parts.subject[prop];
          const vb = b.parts.subject[prop];
          const delta = Math.abs(va - vb);
          if (delta > TOLERANCE_PX) {
            failures.push(
              `FAIL ${run}: subject.${prop} ${pa}=${va} ${pb}=${vb} (Δ${+delta.toFixed(2)})`,
            );
          }
        }
      }
    }
  }
  return { failures, runs: byRun.size };
}

function compareBaselines(update: boolean): { failures: string[]; runs: number } {
  const failures: string[] = [];
  let count = 0;
  for (const platform of PLATFORMS) {
    const root = join(OUT, "screenshots", platform);
    for (const file of walk(root, ".png")) {
      count++;
      const run = runIdOf(root, file, ".png");
      const baseline = baselinePath(platform, run);
      if (update) {
        mkdirSync(dirname(baseline), { recursive: true });
        copyFileSync(file, baseline);
        continue;
      }
      if (!existsSync(baseline)) {
        failures.push(`FAIL ${run} [${platform}]: missing baseline (run with --update)`);
        continue;
      }
      const a = PNG.sync.read(readFileSync(file));
      const b = PNG.sync.read(readFileSync(baseline));
      if (a.width !== b.width || a.height !== b.height) {
        failures.push(
          `FAIL ${run} [${platform}]: size ${a.width}x${a.height} vs baseline ${b.width}x${b.height}`,
        );
        continue;
      }
      const diff = pixelmatch(a.data, b.data, undefined, a.width, a.height, {
        threshold: PIXEL_THRESHOLD,
      });
      const ratio = diff / (a.width * a.height);
      if (ratio > MAX_DIFF_RATIO) {
        failures.push(`FAIL ${run} [${platform}]: ${(ratio * 100).toFixed(2)}% pixels differ`);
      }
    }
  }
  return { failures, runs: count };
}

/** Returns one failure line per problem; an empty array means everything matched. */
export function compare(opts: CompareOptions = {}): string[] {
  const failures: string[] = [];
  if (!opts.baselineOnly) {
    failures.push(...compareCross(opts.metricsDir ?? join(OUT, "metrics")).failures);
  }
  if (!opts.crossOnly) failures.push(...compareBaselines(opts.update ?? false).failures);
  return failures;
}

export function countRuns(opts: CompareOptions = {}): number {
  return compareCross(opts.metricsDir ?? join(OUT, "metrics")).runs;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      update: { type: "boolean", default: false },
      "baseline-only": { type: "boolean", default: false },
      "cross-only": { type: "boolean", default: false },
      "metrics-dir": { type: "string" },
    },
  });
  const opts: CompareOptions = {
    update: values.update,
    baselineOnly: values["baseline-only"],
    crossOnly: values["cross-only"],
    ...(values["metrics-dir"] ? { metricsDir: values["metrics-dir"] } : {}),
  };
  const failures = compare(opts);
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log(`parity ok (${countRuns(opts)} runs)`);
}
