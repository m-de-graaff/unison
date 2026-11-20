import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/spring.ts", "src/paths.ts", "src/bin.ts"],
  format: "esm",
  dts: true,
  platform: "node",
  // tsdown defaults to .mjs/.d.mts on platform "node"; the exports above use .js/.d.ts.
  fixedExtension: false,
});
