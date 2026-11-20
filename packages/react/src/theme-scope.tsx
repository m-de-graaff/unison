import type { ThemeScopeProps } from "@unison-ui/core";

/** Scopes a theme and/or scheme to its subtree without adding a box (`display: contents`). */
export function ThemeScope({ theme, scheme, children }: ThemeScopeProps) {
  return (
    <div style={{ display: "contents" }} data-unison-theme={theme} data-theme={scheme}>
      {children}
    </div>
  );
}
