import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

it("--watch rebuilds within 2 s of the config changing", async () => {
  const config = join(tmp, "watch.config.ts");
  const out = join(tmp, "watch");
  writeFileSync(config, configSource("indigo"));
  const child = spawn(tsx, [bin, "build", "--watch", "--config", config, "--out", out]);
  try {
    let stdout = "";
    child.stdout.on("data", (d) => {
      stdout += String(d);
    });
    const waitFor = async (check: () => boolean, ms: number) => {
      const end = Date.now() + ms;
      while (!check()) {
        if (Date.now() > end) throw new Error(`timed out; output so far:\n${stdout}`);
        await new Promise((r) => setTimeout(r, 25));
      }
    };
    await waitFor(() => stdout.includes("tokens.css"), 15_000); // first build (tsx start-up)
    const tokens = join(out, "web/tokens.css");
    writeFileSync(config, configSource("#e11d48"));
    await waitFor(() => {
      try {
        return readFileSync(tokens, "utf8").includes("#e11d48");
      } catch {
        return false;
      }
    }, 2_000);
  } finally {
    child.kill();
  }
}, 30_000);
