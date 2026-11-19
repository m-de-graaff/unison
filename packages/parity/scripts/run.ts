// Entry for `pnpm test:parity`: collector → platforms → compare → report.
import { execSync, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";
import { runs } from "../src/fixtures";
import { type Metrics, metricsPath, screenshotPath } from "../src/types";
import { startCollector } from "./collector";
import { compare, countRuns } from "./compare";
import { writeReport } from "./report";

type Target = "web" | "ios" | "android";

const { values } = parseArgs({
  options: {
    platform: { type: "string", default: "all" },
    update: { type: "boolean", default: false },
    // CI: each job has only its own platform, so skip the cross-platform check there.
    "baseline-only": { type: "boolean", default: false },
  },
});

const selected = values.platform;
if (!["web", "ios", "android", "all"].includes(selected)) {
  console.error("Usage: test:parity [--platform web|ios|android|all] [--update] [--baseline-only]");
  process.exit(1);
}
const targets: Target[] = selected === "all" ? ["web", "ios", "android"] : [selected as Target];

function quiet(cmd: string): string {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString();
  } catch {
    return "";
  }
}

const deviceRunning: Record<Exclude<Target, "web">, () => boolean> = {
  ios: () => quiet("xcrun simctl list devices booted").includes("(Booted)"),
  android: () => /\tdevice$/m.test(quiet("adb devices")),
};

/** Web: Playwright renders every run in Chromium and WebKit (see playwright.config.ts). */
function runWeb(): void {
  const projects = (process.env.PARITY_WEB_PROJECTS ?? "web-chromium,web-webkit")
    .split(",")
    .flatMap((p) => ["--project", p.trim()]);
  const result = spawnSync("pnpm", ["exec", "playwright", "test", "--trace", "off", ...projects], {
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error("web parity run failed");
}

const caseFlow = readFileSync(resolve("maestro/case.yaml"), "utf8");

/**
 * Runs a command without blocking the event loop. The collector lives in this process, so a
 * spawnSync while the app POSTs its metrics would leave the request unanswered.
 */
function runAsync(cmd: string, args: string[]): Promise<number | null> {
  return new Promise((done, fail) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.once("error", fail);
    child.once("close", done);
  });
}

/** Prints the texts and test ids on screen, so a failed run can be diagnosed from the CI log. */
function printScreen(platform: "ios" | "android"): void {
  const hierarchy = spawnSync("maestro", ["hierarchy"], { encoding: "utf8" }).stdout ?? "";
  const seen = new Set<string>();
  for (const m of hierarchy.matchAll(
    /"(?:text|accessibilityText|resource-id|id)"\s*:\s*"([^"]+)"/g,
  )) {
    if (m[1]) seen.add(m[1]);
  }
  console.error(
    `parity: ${platform} screen shows: ${[...seen].join(" | ") || "(nothing readable)"}`,
  );
}

/**
 * Native: Maestro deep-links each run into the release build, the app POSTs its metrics to the
 * collector, and the full-screen screenshot is cropped to the stage it reported.
 */
async function runNative(platform: "ios" | "android"): Promise<void> {
  if (platform === "android") {
    // Let the emulator's localhost:4545 reach the collector on the host.
    const reverse = spawnSync("adb", ["reverse", "tcp:4545", "tcp:4545"], { stdio: "inherit" });
    if (reverse.status !== 0) throw new Error("adb reverse tcp:4545 failed");
  }
  const shots = mkdtempSync(join(tmpdir(), `unison-parity-${platform}-`));
  try {
    for (const r of runs()) {
      const metricsFile = metricsPath(platform, r.id);
      rmSync(metricsFile, { force: true });
      const full = join(shots, r.id.replaceAll("/", "_"));
      // Fill the flow's placeholders here instead of relying on Maestro's -e substitution, so the
      // deep link that runs is exactly the one logged.
      const flow = join(shots, `${r.id.replaceAll("/", "_")}.yaml`);
      writeFileSync(
        flow,
        caseFlow
          .replaceAll("${COMPONENT}", r.component)
          .replaceAll("${CASE}", r.caseName)
          .replaceAll("${SCHEME}", r.scheme)
          .replaceAll("${OUT}", full),
      );
      console.log(`parity: ${platform} ${r.id}`);
      const status = await runAsync("maestro", ["test", flow]);
      if (status !== 0) {
        printScreen(platform);
        throw new Error(`maestro failed for ${platform} ${r.id}`);
      }
      if (!existsSync(metricsFile)) {
        throw new Error(`no metrics for ${platform} ${r.id}: did the app reach the collector?`);
      }
      const m = JSON.parse(readFileSync(metricsFile, "utf8")) as Metrics;
      const px = (n: number) => Math.round(n * m.pixelRatio);
      const out = screenshotPath(platform, r.id);
      mkdirSync(dirname(out), { recursive: true });
      await sharp(`${full}.png`)
        .extract({
          left: px(m.stage.x),
          top: px(m.stage.y),
          width: px(m.stage.width),
          height: px(m.stage.height),
        })
        .toFile(out);
    }
  } finally {
    rmSync(shots, { recursive: true, force: true });
  }
}

async function runPlatform(target: Target): Promise<void> {
  if (target === "web") return runWeb();
  return runNative(target);
}

const stop = await startCollector();
let exitCode = 0;
try {
  for (const target of targets) {
    if (target !== "web" && !deviceRunning[target]()) {
      console.warn(`warn: skipping ${target} (no booted simulator or emulator)`);
      continue;
    }
    await runPlatform(target);
  }
  const failures = compare({ update: values.update, baselineOnly: values["baseline-only"] });
  const report = writeReport(failures);
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    exitCode = 1;
  } else {
    console.log(`parity ok (${countRuns()} runs)`);
  }
  console.log(`report: ${report}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  exitCode = 1;
} finally {
  await stop();
}
process.exit(exitCode);
