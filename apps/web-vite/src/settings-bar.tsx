import { ThemeScope, useTheme } from "@unison-ui/ui";
import { SCHEMES, THEMES } from "demo-content";

const button =
  "rounded-control border border-border-strong px-3 py-1 text-label aria-pressed:bg-accent aria-pressed:text-on-accent";

/** One button per scheme and per theme; the active one is aria-pressed. App code, not library code. */
export function SettingsBar() {
  const { scheme, setScheme, theme, setTheme } = useTheme();
  return (
    <div role="toolbar" aria-label="Theme settings" className="flex flex-wrap gap-2">
      {SCHEMES.map((s) => (
        <button
          key={s}
          type="button"
          data-testid={`settings-scheme-${s}`}
          aria-pressed={scheme === s}
          onClick={() => setScheme(s)}
          className={button}
        >
          {s}
        </button>
      ))}
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          data-testid={`settings-theme-${t}`}
          aria-pressed={theme === t}
          onClick={() => setTheme(t)}
          className={button}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/** Always brand-dark, whatever the page uses. */
export function ScopedPanel() {
  return (
    <ThemeScope theme="brand" scheme="dark">
      <div
        data-testid="scoped-panel"
        className="flex items-center gap-3 rounded-card bg-surface p-4 text-fg"
      >
        <div data-testid="scoped-accent" className="size-6 rounded-control bg-accent" />
        <span className="text-body">brand · dark</span>
      </div>
    </ThemeScope>
  );
}
