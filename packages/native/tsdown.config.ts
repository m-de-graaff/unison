import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  platform: "neutral",
  unbundle: true,
  // The regex also covers react-native.
  deps: { neverBundle: [/^react/, /^@unison-ui\//] },
});
