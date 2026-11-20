import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, it } from "vitest";
import { build, defineConfig, defineTheme, writeOutputs } from "../src/index";

// The demo apps' config (Task 18).
const demo = defineConfig({
  themes: {
    default: defineTheme({ accent: "indigo" }),
    brand: defineTheme({ extends: "default", accent: "#e11d48", radius: "lg" }),
  },
  defaultTheme: "default",
});
const out = mkdtempSync(join(tmpdir(), "unison-outputs-"));
afterAll(() => rmSync(out, { recursive: true, force: true }));
writeOutputs(build(demo), out);

// One readable file per output, so a token change shows up as a plain diff in review.
it.each([
  ["web/tokens.css", "tokens.css"],
  ["web/theme.css", "theme.css"],
  ["web/theme-strict.css", "theme-strict.css"],
  ["native/theme.js", "native-theme.js"],
  ["types.d.ts", "types.d.ts"],
])("%s matches its snapshot", async (file, snapshot) => {
  await expect(readFileSync(join(out, file), "utf8")).toMatchFileSnapshot(
    `__snapshots__/outputs/${snapshot}`,
  );
});
