#!/usr/bin/env node
import { watch } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { createJiti } from "jiti";
import { build, writeOutputs } from "./build";
import { DEFAULT_CONFIG, type UnisonConfig } from "./config";

const USAGE = "Usage: unison-tokens build [--config <file>] [--out <dir>] [--watch]";

let args: ReturnType<typeof parse>;
function parse() {
  return parseArgs({
    allowPositionals: true,
    options: {
      config: { type: "string" },
      out: { type: "string", default: "dist" },
      watch: { type: "boolean", default: false },
    },
  });
}
try {
  args = parse();
} catch (error) {
  console.error(`${(error as Error).message}\n${USAGE}`);
  process.exit(1);
}
if (args.positionals[0] !== "build" || args.positionals.length !== 1) {
  console.error(USAGE);
  process.exit(1);
}

const configPath = args.values.config ? resolve(args.values.config) : undefined;
const outDir = resolve(args.values.out as string);
// No module cache, so --watch picks up every edit to the config.
const jiti = createJiti(import.meta.url, { moduleCache: false });

async function loadConfig(): Promise<UnisonConfig> {
  if (!configPath) return DEFAULT_CONFIG;
  return jiti.import<UnisonConfig>(configPath, { default: true });
}

/** One build; returns false (after printing why) when it fails. */
async function run(): Promise<boolean> {
  try {
    const result = build(await loadConfig());
    for (const warning of result.warnings) console.error(`warning: ${warning}`);
    for (const file of writeOutputs(result, outDir)) console.log(`wrote ${file}`);
    return true;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return false;
  }
}

const ok = await run();
if (!args.values.watch) process.exit(ok ? 0 : 1);
if (!configPath) {
  console.error("--watch needs --config");
  process.exit(1);
}

// A failing rebuild prints its error and keeps watching.
let timer: NodeJS.Timeout | undefined;
watch(configPath, () => {
  clearTimeout(timer);
  timer = setTimeout(() => void run(), 50);
});
console.error(`watching ${configPath}`);
