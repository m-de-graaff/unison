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

it("ThemeScript renders the same script, which runs from static markup", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { ThemeScript } = await import("../src/theme-script");
  const html = renderToStaticMarkup(createElement(ThemeScript, {}));
  const code = /<script>([\s\S]*)<\/script>/.exec(html)?.[1] ?? "";
  localStorage.setItem("unison-scheme", "light");
  localStorage.setItem("unison-theme", "brand");
  new Function(code)();
  expect({ ...document.documentElement.dataset }).toEqual({ theme: "light", unisonTheme: "brand" });
});

it("a throwing localStorage leaves the defaults and doesn't throw", () => {
  const original = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() {
      throw new Error("denied");
    },
  });
  try {
    expect(() => new Function(themeScript({ defaultScheme: "dark" }))()).not.toThrow();
    expect({ ...document.documentElement.dataset }).toEqual({
      theme: "dark",
      unisonTheme: "default",
    });
  } finally {
    if (original) Object.defineProperty(window, "localStorage", original);
  }
});
