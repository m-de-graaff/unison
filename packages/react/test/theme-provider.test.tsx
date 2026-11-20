import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "../src/theme-provider";

let dark = false;
let listeners: (() => void)[] = [];
beforeEach(() => {
  dark = false;
  listeners = [];
  window.matchMedia = vi.fn(() => ({
    get matches() {
      return dark;
    },
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (_: string, fn: () => void) => {
      listeners = listeners.filter((l) => l !== fn);
    },
  })) as never;
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-unison-theme");
});

let state: ReturnType<typeof useTheme> | undefined;
function Probe() {
  state = useTheme();
  return (
    <span data-testid="probe">{`${state.scheme}/${state.resolvedScheme}/${state.theme}`}</span>
  );
}
const mount = () =>
  render(
    <ThemeProvider themes={["default", "brand"]}>
      <Probe />
    </ThemeProvider>,
  );

it("follows the OS while the scheme is system", () => {
  mount();
  expect(screen.getByTestId("probe").textContent).toBe("system/light/default");
  act(() => {
    dark = true;
    for (const l of listeners) l();
  });
  expect(screen.getByTestId("probe").textContent).toBe("system/dark/default");
  expect(document.documentElement.dataset.theme).toBe("dark");
});

it("setScheme writes storage and the attribute", () => {
  mount();
  act(() => state?.setScheme("dark"));
  expect(localStorage.getItem("unison-scheme")).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(screen.getByTestId("probe").textContent).toBe("dark/dark/default");
});

it("a storage event from another tab updates the theme", () => {
  mount();
  act(() => {
    localStorage.setItem("unison-theme", "brand");
    window.dispatchEvent(new StorageEvent("storage", { key: "unison-theme", newValue: "brand" }));
  });
  expect(screen.getByTestId("probe").textContent).toBe("system/light/brand");
  expect(document.documentElement.dataset.unisonTheme).toBe("brand");
});

it("rejects a theme the config doesn't have, and useTheme needs the provider", () => {
  mount();
  expect(() => state?.setTheme("purple")).toThrow('unknown theme "purple"');
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() => render(<Probe />)).toThrow("useTheme must be used inside ThemeProvider");
});
