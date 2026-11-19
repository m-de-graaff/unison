import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/demo.tsx"],
  format: "esm",
  dts: true,
  platform: "neutral",
  // The app's bundler resolves @unison-ui/ui to web or native, not this package.
  deps: { neverBundle: [/^react/, /^@unison-ui\//] },
});
