import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { ThemeProvider } from "@unison-ui/ui";
import { THEMES } from "demo-content";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DemoPage } from "./demo-page";
import { ParityPage } from "./parity-page";
import { Showcase } from "./tokens-page";

const path = location.pathname;
const page = path.startsWith("/parity/") ? (
  <ParityPage />
) : path === "/tokens" ? (
  <Showcase />
) : (
  <DemoPage />
);

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ThemeProvider themes={THEMES}>{page}</ThemeProvider>
  </StrictMode>,
);
