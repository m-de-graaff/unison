import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Playwright (packages/parity) depends on this exact port.
  server: { port: 5173, strictPort: true },
});
