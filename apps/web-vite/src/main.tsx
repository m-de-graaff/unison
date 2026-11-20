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
// The parity stage sets its theme from the URL, so it renders outside ThemeProvider: the
// provider's fix-up effect would otherwise rewrite <html>'s attributes from the app's storage.
const page = path.startsWith("/parity/") ? (
  <ParityPage />
) : (
  <ThemeProvider themes={THEMES}>{path === "/tokens" ? <Showcase /> : <DemoPage />}</ThemeProvider>
);

createRoot(document.getElementById("root") as HTMLElement).render(<StrictMode>{page}</StrictMode>);
