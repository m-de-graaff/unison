import { defineConfig } from "vitest/config";

// Only the `*.test-d.ts` type tests; the runtime tests run under jest.
export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      only: true,
      include: ["test/**/*.test-d.ts"],
      tsconfig: "./tsconfig.test.json",
    },
  },
});
