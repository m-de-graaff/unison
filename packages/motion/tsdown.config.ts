import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: { index: "src/web/index.ts" },
    outDir: "dist/web",
    format: "esm",
    dts: true,
    platform: "browser",
    tsconfig: "tsconfig.web.json",
    deps: { neverBundle: [/^react/, /^@unison-ui\//] },
  },
  {
    entry: { index: "src/native/index.ts" },
    outDir: "dist/native",
    format: "esm",
    dts: true,
    platform: "neutral",
    tsconfig: "tsconfig.native.json",
    deps: { neverBundle: ["react", "react-native", /^@unison-ui\//] },
  },
]);
