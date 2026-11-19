"use client";
import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";
const next: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };

/** Cycles system → light → dark. App code, not library code. */
export function ThemeToggle() {
  // The server can't know the saved theme, so render "system" first and read the real mode
  // (set by the before-paint script in layout.tsx) after hydration.
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") setMode(t);
  }, []);

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
    <button type="button" data-testid="theme-toggle" onClick={cycle}>
      theme: {mode}
    </button>
  );
}
