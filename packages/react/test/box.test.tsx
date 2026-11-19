import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it } from "vitest";
import { Box } from "../src/box";

afterEach(cleanup);

it("renders data-testid and the accent background by default", () => {
  render(<Box testID="b" />);
  expect(screen.getByTestId("b").style.background).toBe("var(--unison-color-accent)");
});

it("uses the surface colour for tone=neutral", () => {
  render(<Box tone="neutral" testID="n" />);
  expect(screen.getByTestId("n").style.background).toBe("var(--unison-color-surface)");
});

it("sizes with border-box, like React Native, so the border stays inside size.box", () => {
  render(<Box testID="sized" />);
  expect(screen.getByTestId("sized").style.boxSizing).toBe("border-box");
});

it("renders on the server", () => {
  expect(renderToString(<Box testID="s" />)).toContain('data-testid="s"');
});
