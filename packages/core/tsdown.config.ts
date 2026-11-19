import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  platform: "neutral",
  // One file per module: the hook carries its own "use client" boundary, so the server-safe
  // boxStyles/BoxProps can be imported from a React Server Component.
  unbundle: true,
  deps: { neverBundle: ["react"] },
});
