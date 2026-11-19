import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  platform: "browser",
  // One output file per source file, so a "use client" directive stays on its own module.
  unbundle: true,
  deps: { neverBundle: [/^react/, /^@unison-ui\//] },
});
