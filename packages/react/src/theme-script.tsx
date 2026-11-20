import type { ColorScheme } from "@unison-ui/core";

export interface ThemeScriptOptions {
  /** Storage keys are `<storageKey>-scheme` and `<storageKey>-theme`; default `"unison"`. */
  storageKey?: string;
  defaultScheme?: ColorScheme;
  defaultTheme?: string;
}

/**
 * A self-contained script for `<head>`: before first paint it sets `data-theme` (the resolved
 * scheme) and `data-unison-theme` on `<html>` from storage, so there's no flash of the wrong theme.
 */
export function themeScript({
  storageKey = "unison",
  defaultScheme = "system",
  defaultTheme = "default",
}: ThemeScriptOptions = {}): string {
  const j = JSON.stringify;
  return `(function(){var d=document.documentElement,s=${j(defaultScheme)},t=${j(defaultTheme)};try{var a=localStorage.getItem(${j(`${storageKey}-scheme`)});if(a==="light"||a==="dark"||a==="system")s=a;var b=localStorage.getItem(${j(`${storageKey}-theme`)});if(b&&/^[a-z0-9-]+$/.test(b))t=b}catch(e){}if(s==="system")s=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.setAttribute("data-theme",s);d.setAttribute("data-unison-theme",t)})()`;
}

/** `<ThemeScript />` in `<head>`; server-safe (no hooks). */
export function ThemeScript(props: ThemeScriptOptions) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the script is generated from options, not user input
  return <script dangerouslySetInnerHTML={{ __html: themeScript(props) }} />;
}
