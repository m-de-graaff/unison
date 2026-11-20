import { defineConfig } from "tsdown";

// Only the registries are built: the apps import them. The node scripts run with tsx.
export default defineConfig([
  {
    entry: { "registry.web": "src/registry.web.tsx" },
    format: "esm",
    dts: true,
    platform: "neutral",
    deps: { neverBundle: [/^react/, /^@unison-ui\//] },
  },
  {
    entry: { "registry.native": "src/registry.native.tsx" },
    format: "esm",
    dts: true,
    platform: "neutral",
    tsconfig: "tsconfig.native.json",
    // Same dist/ as the web registry: don't wipe it.
    clean: false,
    deps: { neverBundle: ["react", "react-native", /^@unison-ui\//] },
  },
]);
