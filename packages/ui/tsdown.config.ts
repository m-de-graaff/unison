import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { web: "src/web.ts", native: "src/native.ts" },
  format: "esm",
  dts: true,
  platform: "neutral",
  // Everything external: the app's bundler resolves @unison-ui/react or @unison-ui/native.
  deps: { neverBundle: [/.*/] },
});
