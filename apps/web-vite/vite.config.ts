import tailwindcss from "@tailwindcss/vite";
import { themeScript } from "@unison-ui/ui";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // The before-paint theme script comes from the library, so it can't go stale.
      name: "unison-theme-script",
      transformIndexHtml: () => [
        { tag: "script", children: themeScript(), injectTo: "head-prepend" },
      ],
    },
  ],
  // Playwright (packages/parity) depends on this exact port.
  server: { port: 5173, strictPort: true },
});
