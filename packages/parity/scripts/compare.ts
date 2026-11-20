// Cross-platform layout comparison (±1 px) and per-platform screenshot baselines.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { differenceCiede2000 } from "culori";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { checkOf, runs } from "../src/fixtures";
import {
  baselinePath,
  CROSS_PLATFORMS,
  type Metrics,
  OUT,
  PLATFORMS,
  type Platform,
  type Rect,
} from "../src/types";

export interface CompareOptions {
  update?: boolean;
  baselineOnly?: boolean;
  crossOnly?: boolean;
  /** Directory holding <platform>/<run>.json; defaults to parity-output/metrics. */
  metricsDir?: string;
  /** Directory holding <platform>/<run>.png for the colour check; defaults to parity-output/screenshots. */
  screenshotsDir?: string;
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

const hex2 = (n: number) => n.toString(16).padStart(2, "0");

/** The colour at a stage-relative point of a stage screenshot taken at `pixelRatio`. */
export function sampleColor(png: PNG, point: { x: number; y: number }, pixelRatio: number): string {
  const x = Math.min(png.width - 1, Math.max(0, Math.round(point.x * pixelRatio)));
  const y = Math.min(png.height - 1, Math.max(0, Math.round(point.y * pixelRatio)));
  const i = (y * png.width + x) * 4;
  return `#${hex2(png.data[i] as number)}${hex2(png.data[i + 1] as number)}${hex2(png.data[i + 2] as number)}`;
}

const ciede2000 = differenceCiede2000();
/** CIEDE2000 colour difference between two hex colours (0 = identical, ~1 = just noticeable). */
export const deltaE2000 = (a: string, b: string): number => ciede2000(a, b);

// Only the current fixtures count: stale output from a deleted fixture must not fail the run.
const currentRuns = () => new Set(runs().map((r) => r.id));

const runIdOf = (root: string, file: string, ext: string) =>
  relative(root, file).split("\\").join("/").slice(0, -ext.length);

function compareCross(
  metricsDir: string,
  screenshotsDir: string,
): { failures: string[]; runs: number } {
  const failures: string[] = [];
  const byRun = new Map<string, Map<Platform, Metrics>>();
  const known = currentRuns();
  for (const platform of CROSS_PLATFORMS) {
    const root = join(metricsDir, platform);
    for (const file of walk(root, ".json")) {
      const run = runIdOf(root, file, ".json");
      if (!known.has(run)) continue;
      const metrics = JSON.parse(readFileSync(file, "utf8")) as Metrics;
      if (!byRun.has(run)) byRun.set(run, new Map());
      byRun.get(run)?.set(platform, metrics);
    }
  }
  // Only the platforms present are compared (docs/plans/phase-0.md, OQ-14).
  for (const [run, platforms] of [...byRun].sort(([a], [b]) => a.localeCompare(b))) {
    const check = checkOf(run.split("/")[0] as string);
    const heightY = typeof check === "object" && check.layout === "height-y";
    const entries = [...platforms];
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [pa, a] = entries[i] as [Platform, Metrics];
        const [pb, b] = entries[j] as [Platform, Metrics];
        // Both platforms must report the same parts and samples, or the checks below pass vacuously.
        failures.push(
          ...missingNames(run, "parts", [pa, a.parts], [pb, b.parts]),
          ...missingNames(run, "samples", [pa, a.samples ?? {}], [pb, b.samples ?? {}]),
        );
        const names = Object.keys(a.parts)
          .filter((n) => Object.hasOwn(b.parts, n))
          .sort();
        const order = heightY ? stackOrder(a.parts, names) : [];
        const valuesA = heightY ? stackValues(a.parts, order) : layoutValues(a.parts, names);
        const valuesB = heightY ? stackValues(b.parts, order) : layoutValues(b.parts, names);
        for (const name of names) {
          for (const [prop, va] of Object.entries(valuesA[name] ?? {})) {
            const vb = valuesB[name]?.[prop] as number;
            const delta = Math.abs(va - vb);
            if (delta > TOLERANCE_PX) {
              failures.push(
                `FAIL ${run}: ${name}.${prop} ${pa}=${va} ${pb}=${vb} (Δ${+delta.toFixed(2)})`,
              );
            }
          }
        }
        if (typeof check === "object" && "color" in check) {
          failures.push(
            ...compareColors(run, [pa, a], [pb, b], check.color.maxDeltaE, screenshotsDir),
          );
        }
      }
    }
  }
  return { failures, runs: byRun.size };
}

type Values = Record<string, Record<string, number>>;

function layoutValues(parts: Record<string, Rect>, names: string[]): Values {
  return Object.fromEntries(
    names.map((n) => {
      const { x, y, width, height } = parts[n] as Rect;
      return [n, { x, y, width, height }];
    }),
  );
}

/** The parts of a `height-y` stack (all but `subject`), top to bottom on the reference platform. */
const stackOrder = (parts: Record<string, Rect>, names: string[]) =>
  names.filter((n) => n !== "subject").sort((p, q) => (parts[p] as Rect).y - (parts[q] as Rect).y);

/**
 * A `height-y` stack: each part's height, and its gap from the bottom of the part above (the
 * subject's top for the first). Native text boxes round up to a device pixel (⅓ px on a 3× iPhone),
 * so absolute `y` would add that rounding up down the stack; per-part values hold each line to the
 * tolerance on its own. The subject only contributes its `y`: its height is the sum of the parts.
 */
function stackValues(parts: Metrics["parts"], order: string[]): Values {
  const out: Values = { subject: { y: parts.subject.y } };
  let bottom = parts.subject.y;
  for (const name of order) {
    const r = parts[name] as Rect;
    out[name] = { height: r.height, gap: r.y - bottom };
    bottom = r.y + r.height;
  }
  return out;
}

/** `FAIL <run>: parts differ, ios lacks line-title` for every name one platform lacks. */
function missingNames(
  run: string,
  what: "parts" | "samples",
  [pa, a]: [Platform, object],
  [pb, b]: [Platform, object],
): string[] {
  const lacks = (p: Platform, have: object, other: object) =>
    Object.keys(other)
      .filter((n) => !Object.hasOwn(have, n))
      .sort()
      .map((n) => `FAIL ${run}: ${what} differ, ${p} lacks ${n}`);
  return [...lacks(pb, b, a), ...lacks(pa, a, b)];
}

const readPng = (file: string) => PNG.sync.read(readFileSync(file));

/** Samples each platform's screenshot at the reported centre points and compares the colours. */
function compareColors(
  run: string,
  [pa, a]: [Platform, Metrics],
  [pb, b]: [Platform, Metrics],
  maxDeltaE: number,
  screenshotsDir: string,
): string[] {
  const shotA = join(screenshotsDir, pa, `${run}.png`);
  const shotB = join(screenshotsDir, pb, `${run}.png`);
  if (!existsSync(shotA) || !existsSync(shotB)) {
    return [`FAIL ${run}: colour check needs screenshots from ${pa} and ${pb}`];
  }
  const [pngA, pngB] = [readPng(shotA), readPng(shotB)];
  const failures: string[] = [];
  for (const name of Object.keys(a.samples ?? {}).sort()) {
    const sa = a.samples?.[name];
    const sb = b.samples?.[name];
    if (!sa || !sb) continue;
    const ca = sampleColor(pngA, sa, a.pixelRatio);
    const cb = sampleColor(pngB, sb, b.pixelRatio);
    const d = deltaE2000(ca, cb);
    if (d > maxDeltaE) {
      failures.push(
        `FAIL ${run}: ${name} colour ${pa}=${ca} ${pb}=${cb} (ΔE ${d.toFixed(2)} > ${maxDeltaE})`,
      );
    }
  }
  return failures;
}

function compareBaselines(update: boolean): { failures: string[]; runs: number } {
  const failures: string[] = [];
  let count = 0;
  const known = currentRuns();
  for (const platform of PLATFORMS) {
    const root = join(OUT, "screenshots", platform);
    for (const file of walk(root, ".png")) {
      const run = runIdOf(root, file, ".png");
      if (!known.has(run)) continue;
      count++;
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
    failures.push(
      ...compareCross(
        opts.metricsDir ?? join(OUT, "metrics"),
        opts.screenshotsDir ?? join(OUT, "screenshots"),
      ).failures,
    );
  }
  if (!opts.crossOnly) failures.push(...compareBaselines(opts.update ?? false).failures);
  return failures;
}

export function countRuns(opts: CompareOptions = {}): number {
  return compareCross(
    opts.metricsDir ?? join(OUT, "metrics"),
    opts.screenshotsDir ?? join(OUT, "screenshots"),
  ).runs;
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
