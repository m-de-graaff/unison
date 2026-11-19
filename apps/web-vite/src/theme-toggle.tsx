import { useState } from "react";

type Mode = "system" | "light" | "dark";
const next: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };

function initialMode(): Mode {
  if (typeof document === "undefined") return "system";
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
}

/** Cycles system → light → dark. App code, not library code. */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>(initialMode);

  function cycle() {
    const m = next[mode];
    try {
      if (m === "system") localStorage.removeItem("unison-theme");
      else localStorage.setItem("unison-theme", m);
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this page.
    }
    if (m === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = m;
    setMode(m);
  }

  return (
    <button type="button" data-testid="theme-toggle" onClick={cycle} suppressHydrationWarning>
      theme: {mode}
    </button>
  );
}
