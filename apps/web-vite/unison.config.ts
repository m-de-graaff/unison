import { defineConfig, defineTheme } from "@unison-ui/tokens";

export default defineConfig({
  themes: {
    default: defineTheme({ accent: "indigo" }),
    brand: defineTheme({ extends: "default", accent: "#e11d48", radius: "lg" }),
  },
  defaultTheme: "default",
});
