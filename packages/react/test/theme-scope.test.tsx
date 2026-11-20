import { act, cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "../src/theme-provider";
import { ThemeScope } from "../src/theme-scope";

it("renders a display: contents div carrying both attributes", () => {
  const { container } = render(
    <ThemeScope theme="brand" scheme="dark">
      <span>child</span>
    </ThemeScope>,
  );
  const div = container.firstElementChild as HTMLElement;
  expect(div.getAttribute("style")).toBe("display: contents;");
  expect(div.dataset).toMatchObject({ unisonTheme: "brand", theme: "dark" });
});

it("without a provider, leaves out what it doesn't set", () => {
  const { container } = render(<ThemeScope theme="brand" />);
  expect((container.firstElementChild as HTMLElement).hasAttribute("data-theme")).toBe(false);
});

let seen: ReturnType<typeof useTheme> | undefined;
function Probe() {
  seen = useTheme();
  return null;
}

describe("inside ThemeProvider", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-unison-theme");
  });

  const page = (node: ReactNode) => {
    localStorage.setItem("unison-theme", "brand");
    localStorage.setItem("unison-scheme", "light");
    return <ThemeProvider themes={["default", "brand"]}>{node}</ThemeProvider>;
  };

  it("writes both attributes, taking a missing one from the page", () => {
    const { container } = render(page(<ThemeScope scheme="dark" />));
    const div = container.firstElementChild as HTMLElement;
    expect(div.dataset).toMatchObject({ unisonTheme: "brand", theme: "dark" });
  });

  it("a nested scope inherits the nearest scope, not the page", () => {
    const { container } = render(
      page(
        <ThemeScope theme="default" scheme="dark">
          <ThemeScope theme="brand" />
        </ThemeScope>,
      ),
    );
    const inner = container.querySelectorAll("div")[1] as HTMLElement;
    expect(inner.dataset).toMatchObject({ unisonTheme: "brand", theme: "dark" });
  });

  it("useTheme() inside returns the scoped theme and scheme, with the page's setters", () => {
    render(
      page(
        <ThemeScope theme="default" scheme="dark">
          <Probe />
        </ThemeScope>,
      ),
    );
    expect(seen).toMatchObject({ theme: "default", resolvedScheme: "dark" });
    expect(document.documentElement.dataset).toMatchObject({
      unisonTheme: "brand",
      theme: "light",
    });
    act(() => seen?.setTheme("default"));
    expect(document.documentElement.dataset.unisonTheme).toBe("default");
    expect(localStorage.getItem("unison-theme")).toBe("default");
  });

  it("on the server, leaves out what it would inherit (CSS takes it from <html>)", () => {
    const html = renderToString(
      <ThemeProvider themes={["default", "brand"]}>
        <ThemeScope scheme="dark">x</ThemeScope>
      </ThemeProvider>,
    );
    expect(html).toContain('data-theme="dark"');
    expect(html).not.toContain("data-unison-theme");
  });
});
