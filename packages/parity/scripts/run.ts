// Entry for `pnpm test:parity`: collector → platforms → compare → report.
import { execSync, spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
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

async function runPlatform(target: Target, _opts: { update: boolean }): Promise<void> {
  if (target === "web") return runWeb();
  throw new Error(`${target} runner not implemented yet (todo step 21)`);
}

const stop = await startCollector();
let exitCode = 0;
try {
  for (const target of targets) {
    if (target !== "web" && !deviceRunning[target]()) {
      console.warn(`warn: skipping ${target} (no booted simulator or emulator)`);
      continue;
    }
    await runPlatform(target, { update: values.update });
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
