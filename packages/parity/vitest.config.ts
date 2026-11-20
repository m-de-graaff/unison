import { defineConfig } from "vitest/config";

// tests/ holds the Playwright parity spec; only test/ is for vitest.
export default defineConfig({ test: { include: ["test/**/*.test.ts"] } });
