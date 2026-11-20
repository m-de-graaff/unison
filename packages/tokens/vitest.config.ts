import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: ["src/**"],
      // bin.ts runs as a subprocess in test/cli.test.ts, which v8 coverage doesn't see.
      thresholds: { lines: 90 },
    },
  },
});
