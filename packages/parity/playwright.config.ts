import { defineConfig } from "@playwright/test";

// Optional: point Chromium at a preinstalled browser (e.g. a cloud container whose Playwright
// browsers belong to a different Playwright version).
const chromiumPath = process.env.PARITY_CHROMIUM_PATH;

export default defineConfig({
  testDir: "tests",
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  },
  webServer: {
    // web-vite also needs demo-content, which is not a parity dependency: build its deps first.
    command: "pnpm turbo run build --filter=web-vite^... && pnpm --filter web-vite dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    cwd: "../..",
  },
  projects: [
    {
      name: "web-chromium",
      use: {
        browserName: "chromium",
        ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
      },
    },
    { name: "web-webkit", use: { browserName: "webkit" } },
  ],
});
