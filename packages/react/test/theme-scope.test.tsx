import { render } from "@testing-library/react";
import { expect, it } from "vitest";
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

it("leaves out what it doesn't set", () => {
  const { container } = render(<ThemeScope theme="brand" />);
  expect((container.firstElementChild as HTMLElement).hasAttribute("data-theme")).toBe(false);
});
