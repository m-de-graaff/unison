import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { ThemeProvider } from "@unison-ui/ui";
import { THEMES } from "demo-content";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DemoPage } from "./demo-page";
import { ParityPage } from "./parity-page";

const page = location.pathname.startsWith("/parity/") ? <ParityPage /> : <DemoPage />;

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ThemeProvider themes={THEMES}>{page}</ThemeProvider>
  </StrictMode>,
);
