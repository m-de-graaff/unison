import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, it } from "vitest";

const pkg = join(import.meta.dirname, "..");
const tsx = join(pkg, "../../node_modules/.bin/tsx");
const bin = join(pkg, "src/bin.ts");
const index = join(pkg, "src/index.ts");
const tmp = mkdtempSync(join(tmpdir(), "unison-cli-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const OUTPUTS = [
  "web/tokens.css",
  "web/theme.css",
  "web/theme-strict.css",
  "native/theme.js",
  "native/theme.d.ts",
  "native/theme.css",
  "motion.js",
  "motion.d.ts",
  "types.d.ts",
  "tokens.json",
];

const configSource = (accent: string) =>
  `import { defineConfig, defineTheme } from ${JSON.stringify(index)};
export default defineConfig({ themes: { default: defineTheme({ accent: ${JSON.stringify(accent)} }) } });
`;

it("builds a config into --out and reports every file", () => {
  const config = join(tmp, "unison.config.ts");
  const out = join(tmp, "out");
  writeFileSync(config, configSource("#e11d48"));
  const stdout = execFileSync(tsx, [bin, "build", "--config", config, "--out", out], {
    encoding: "utf8",
  });
  for (const file of OUTPUTS) expect(stdout).toContain(`wrote ${join(out, file)}\n`);
  expect(readFileSync(join(out, "web/tokens.css"), "utf8")).toContain("#e11d48");
});

it("builds the default theme without --config", () => {
  const out = join(tmp, "default");
  const stdout = execFileSync(tsx, [bin, "build", "--out", out], { encoding: "utf8" });
  expect(stdout).toContain(`wrote ${join(out, "web/tokens.css")}`);
  expect(readFileSync(join(out, "web/tokens.css"), "utf8")).toContain(
    "--unison-color-accent-600: #535cda;",
  );
});

/** Starts `build --watch` and resolves once it's watching. */
async function startWatch(config: string, out: string) {
  const child = spawn(tsx, [bin, "build", "--watch", "--config", config, "--out", out]);
  let output = "";
  child.stdout.on("data", (d) => {
    output += String(d);
  });
  child.stderr.on("data", (d) => {
    output += String(d);
  });
  const waitFor = async (check: () => boolean, ms: number) => {
    const end = Date.now() + ms;
    while (!check()) {
      if (Date.now() > end) throw new Error(`timed out; output so far:\n${output}`);
      await new Promise((r) => setTimeout(r, 25));
    }
  };
  await waitFor(() => output.includes("watching "), 15_000); // first build (tsx start-up)
  const tokens = join(out, "web/tokens.css");
  const rebuilt = (text: string) =>
    waitFor(() => {
      try {
        return readFileSync(tokens, "utf8").includes(text);
      } catch {
        return false;
      }
    }, 2_000);
  return { child, rebuilt, waitFor, output: () => output };
}

it("--watch rebuilds within 2 s of the config changing", async () => {
  const config = join(tmp, "watch.config.ts");
  writeFileSync(config, configSource("indigo"));
  const w = await startWatch(config, join(tmp, "watch"));
  try {
    writeFileSync(config, configSource("#e11d48"));
    await w.rebuilt("#e11d48");
  } finally {
    w.child.kill();
  }
}, 30_000);

it("--watch keeps watching after an atomic save (temp file renamed over the config)", async () => {
  const dir = mkdtempSync(join(tmp, "atomic-"));
  const config = join(dir, "unison.config.ts");
  writeFileSync(config, configSource("indigo"));
  const w = await startWatch(config, join(dir, "out"));
  try {
    const save = (accent: string) => {
      const temp = join(dir, `.unison.config.ts.${accent.slice(1)}.tmp`);
      writeFileSync(temp, configSource(accent));
      renameSync(temp, config);
    };
    save("#e11d48");
    await w.rebuilt("#e11d48");
    save("#16a34a");
    await w.rebuilt("#16a34a");
    writeFileSync(config, configSource("#0891b2"));
    await w.rebuilt("#0891b2");
  } finally {
    w.child.kill();
  }
}, 30_000);

it("--watch survives the config going missing and picks it up when it's back", async () => {
  const dir = mkdtempSync(join(tmp, "missing-"));
  const config = join(dir, "unison.config.ts");
  const w = await startWatch(config, join(dir, "out"));
  try {
    expect(w.output()).toContain(`config not found: ${config}`);
    writeFileSync(config, configSource("#e11d48"));
    await w.rebuilt("#e11d48");
    rmSync(config);
    await w.waitFor(() => w.output().split("config not found").length === 3, 2_000);
    expect(w.child.exitCode).toBeNull();
    writeFileSync(config, configSource("#16a34a"));
    await w.rebuilt("#16a34a");
  } finally {
    w.child.kill();
  }
}, 30_000);
