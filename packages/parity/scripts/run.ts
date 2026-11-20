// Entry for `pnpm test:parity`: collector → platforms → compare → report.
import { execSync, spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";
import { runs } from "../src/fixtures";
import { type Metrics, metricsPath, screenshotPath } from "../src/types";
import { startCollector } from "./collector";
import { compare, countRuns } from "./compare";
import { warmUpCommands } from "./flow";
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

// maestro/case.yaml: the appId header, then one run's commands.
const [flowHeader, caseCommands] = (() => {
  const text = readFileSync(resolve("maestro/case.yaml"), "utf8");
  const split = text.indexOf("\n---\n");
  if (split < 0) throw new Error("maestro/case.yaml needs an appId header and a --- line");
  return [text.slice(0, split + 5), text.slice(split + 5)];
})();

/** The first file called `name` below `dir`, or undefined. */
function findFile(dir: string, name: string): string | undefined {
  if (!existsSync(dir)) return undefined;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isFile() && entry.name === name) return path;
    if (entry.isDirectory()) {
      const found = findFile(path, name);
      if (found) return found;
    }
  }
  return undefined;
}

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
 * collector, and the full-screen screenshot is cropped to the stage it reported. All runs share
 * one Maestro session: starting Maestro (on iOS, its XCTest driver) costs about a minute.
 */
async function runNative(platform: "ios" | "android"): Promise<void> {
  if (platform === "android") {
    // Let the emulator's localhost:4545 reach the collector on the host.
    const reverse = spawnSync("adb", ["reverse", "tcp:4545", "tcp:4545"], { stdio: "inherit" });
    if (reverse.status !== 0) throw new Error("adb reverse tcp:4545 failed");
  }
  const shots = mkdtempSync(join(tmpdir(), `unison-parity-${platform}-`));
  try {
    const all = runs().map((r) => ({ ...r, shotName: r.id.replaceAll("/", "_") }));
    // Fill the flow's placeholders here instead of relying on Maestro's -e substitution, so the
    // deep links that run are exactly the ones logged.
    const commandsFor = (r: (typeof all)[number]) =>
      caseCommands
        // biome-ignore lint/suspicious/noTemplateCurlyInString: literal Maestro placeholders
        .replaceAll("${COMPONENT}", r.component)
        // biome-ignore lint/suspicious/noTemplateCurlyInString: literal Maestro placeholders
        .replaceAll("${CASE}", r.caseName)
        // biome-ignore lint/suspicious/noTemplateCurlyInString: literal Maestro placeholders
        .replaceAll("${THEME}", r.theme)
        // biome-ignore lint/suspicious/noTemplateCurlyInString: literal Maestro placeholders
        .replaceAll("${SCHEME}", r.scheme)
        // biome-ignore lint/suspicious/noTemplateCurlyInString: literal Maestro placeholders
        .replaceAll("${OUT}", r.shotName);
    // Warm-up: open one run without a screenshot. On a cold start the parity screen hides the
    // status bar after its first measurement, which moves the layout up (Android). The next deep
    // link would cancel the re-measurement, leaving metrics that don't match the screenshot. After
    // the warm-up the status bar is already hidden. It uses the last run, so the first real run is
    // a fresh navigation rather than a link to the screen already shown.
    const warmUp = all.at(-1);
    let flow = flowHeader;
    if (warmUp) {
      flow += `# warm-up\n${warmUpCommands(commandsFor(warmUp))}`;
      flow += "- waitForAnimationToEnd:\n    timeout: 3000\n";
    }
    for (const r of all) {
      rmSync(metricsPath(platform, r.id), { force: true });
      console.log(`parity: ${platform} ${r.id}`);
      flow += `# run ${r.id}\n${commandsFor(r)}`;
    }
    const flowFile = join(shots, "parity.yaml");
    writeFileSync(flowFile, flow);
    // Maestro only writes screenshots inside its test output folder, so the flow uses bare names
    // and the files are looked up there afterwards.
    const outputDir = join(shots, "out");
    const status = await runAsync("maestro", ["test", "--test-output-dir", outputDir, flowFile]);
    if (status !== 0) {
      printScreen(platform);
      const done = all.filter((r) => existsSync(metricsPath(platform, r.id))).map((r) => r.id);
      throw new Error(
        `maestro failed on ${platform} (runs with metrics: ${done.join(", ") || "none"})`,
      );
    }
    for (const r of all) {
      const metricsFile = metricsPath(platform, r.id);
      if (!existsSync(metricsFile)) {
        throw new Error(`no metrics for ${platform} ${r.id}: did the app reach the collector?`);
      }
      const m = JSON.parse(readFileSync(metricsFile, "utf8")) as Metrics;
      const px = (n: number) => Math.round(n * m.pixelRatio);
      const out = screenshotPath(platform, r.id);
      mkdirSync(dirname(out), { recursive: true });
      const full = findFile(outputDir, `${r.shotName}.png`);
      if (!full) throw new Error(`maestro wrote no ${r.shotName}.png under ${outputDir}`);
      await sharp(full)
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
