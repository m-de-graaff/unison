import { afterEach, expect, it } from "vitest";
import { themeScript } from "../src/theme-script";

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.unisonTheme;
});

it("applies the stored scheme and theme before paint", () => {
  localStorage.setItem("unison-scheme", "dark");
  localStorage.setItem("unison-theme", "brand");
  new Function(themeScript())();
  expect({ ...document.documentElement.dataset }).toEqual({ theme: "dark", unisonTheme: "brand" });
});

it("falls back to the defaults and resolves system with matchMedia", () => {
  window.matchMedia = ((q: string) => ({ matches: q.includes("dark") })) as never;
  new Function(themeScript({ defaultTheme: "default" }))();
  expect({ ...document.documentElement.dataset }).toEqual({
    theme: "dark",
    unisonTheme: "default",
  });
});

it("ignores a stored value that isn't valid", () => {
  localStorage.setItem("unison-scheme", "purple");
  localStorage.setItem("unison-theme", "<script>");
  new Function(themeScript({ defaultScheme: "light" }))();
  expect({ ...document.documentElement.dataset }).toEqual({
    theme: "light",
    unisonTheme: "default",
  });
});
