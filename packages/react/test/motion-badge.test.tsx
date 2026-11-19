import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MotionBadge } from "../src/motion-badge";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const stubMatchMedia = (matches: boolean) =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches, addEventListener() {}, removeEventListener() {} })),
  );

it("shows motion: full by default", () => {
  stubMatchMedia(false);
  render(<MotionBadge />);
  expect(screen.getByTestId("motion-badge").textContent).toBe("motion: full");
});

it("shows motion: reduced when the user prefers reduced motion", () => {
  stubMatchMedia(true);
  render(<MotionBadge />);
  expect(screen.getByTestId("motion-badge").textContent).toBe("motion: reduced");
});
