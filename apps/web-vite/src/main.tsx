import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { DemoPage } from "./demo-page";
import { ParityPage } from "./parity-page";

const page = location.pathname.startsWith("/parity/") ? <ParityPage /> : <DemoPage />;

createRoot(document.getElementById("root") as HTMLElement).render(<StrictMode>{page}</StrictMode>);
