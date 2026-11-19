import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MotionBadge } from "../src/motion-badge";

afterEach(cleanup);

// jsdom (and some embedded WebViews) have no window.matchMedia; consumers' tests run there.
it("renders motion: full when matchMedia is unavailable", () => {
  expect(typeof window.matchMedia).toBe("undefined");
  render(<MotionBadge />);
  expect(screen.getByTestId("motion-badge").textContent).toBe("motion: full");
});
