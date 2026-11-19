// Entry for `pnpm test:parity`: collector → platforms → compare → report.
import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
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
  },
});

const selected = values.platform;
if (!["web", "ios", "android", "all"].includes(selected)) {
  console.error("Usage: test:parity [--platform web|ios|android|all] [--update]");
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

/**
 * Native: Maestro deep-links each run into the release build, the app POSTs its metrics to the
 * collector, and the full-screen screenshot is cropped to the stage it reported.
 */
async function runNative(platform: "ios" | "android"): Promise<void> {
  const shots = mkdtempSync(join(tmpdir(), `unison-parity-${platform}-`));
  try {
    for (const r of runs()) {
      const metricsFile = metricsPath(platform, r.id);
      rmSync(metricsFile, { force: true });
      const full = join(shots, r.id.replaceAll("/", "_"));
      const result = spawnSync(
        "maestro",
        [
          "test",
          "-e",
          `COMPONENT=${r.component}`,
          "-e",
          `CASE=${r.caseName}`,
          "-e",
          `SCHEME=${r.scheme}`,
          "-e",
          `OUT=${full}`,
          resolve("maestro/case.yaml"),
        ],
        { stdio: "inherit" },
      );
      if (result.status !== 0) throw new Error(`maestro failed for ${platform} ${r.id}`);
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
  const failures = compare({ update: values.update });
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
