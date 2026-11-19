import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{ts,tsx}"],
    coverage: { provider: "v8", reporter: ["text"], include: ["src/**"] },
    typecheck: {
      enabled: true,
      include: ["test/**/*.test-d.ts"],
      // Both platforms in one program, so the two signatures can be compared.
      tsconfig: "./tsconfig.test.json",
    },
  },
});
