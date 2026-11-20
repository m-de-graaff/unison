import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { compile } from "../src/index";

const created: string[] = [];

function workspaceWith(tokensDir: string): string {
  const dir = mkdtempSync(join(tmpdir(), "unison-tokens-"));
  created.push(dir);
  cpSync(tokensDir, join(dir, "tokens"), { recursive: true });
  return dir;
}

afterEach(() => {
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
});

it("compiles the token source to css, tailwind and native outputs", async () => {
  const dir = workspaceWith(join(import.meta.dirname, "../tokens"));
  await compile({ cwd: dir });
  for (const file of [
    "dist/web/tokens.css",
    "dist/web/theme.css",
    "dist/web/theme-strict.css",
    "dist/native/theme.css",
    "dist/native/theme.js",
    "dist/native/theme.d.ts",
    "dist/types.d.ts",
  ]) {
    expect(readFileSync(join(dir, file), "utf8")).toMatchSnapshot(file);
  }
});

it("rejects low contrast and names both colours", async () => {
  const dir = workspaceWith(join(import.meta.dirname, "fixtures/low-contrast/tokens"));
  await expect(compile({ cwd: dir })).rejects.toThrow(
    /contrast: theme default, scheme light, color\.fg on color\.canvas is \d\.\d\d:1 \(needs 4\.5:1\)/,
  );
});
