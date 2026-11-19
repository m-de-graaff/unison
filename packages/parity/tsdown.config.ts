import { defineConfig } from "tsdown";

// Only the registry is built: the apps import it. The node scripts run with tsx.
export default defineConfig({
  entry: { registry: "src/registry.tsx" },
  format: "esm",
  dts: true,
  platform: "neutral",
  deps: { neverBundle: [/^react/, /^@unison-ui\//] },
});
