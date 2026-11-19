import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useReducedMotion } from "../src/web";

afterEach(() => vi.unstubAllGlobals());

it("tracks prefers-reduced-motion and removes its listener on unmount", () => {
  let matches = false;
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return matches;
    },
    addEventListener: vi.fn((_: string, cb: () => void) => listeners.add(cb)),
    removeEventListener: vi.fn((_: string, cb: () => void) => listeners.delete(cb)),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql),
  );

  const { result, unmount } = renderHook(() => useReducedMotion());
  expect(result.current).toBe(false);

  act(() => {
    matches = true;
    for (const listener of listeners) listener();
  });
  expect(result.current).toBe(true);

  unmount();
  expect(mql.removeEventListener).toHaveBeenCalled();
  expect(listeners.size).toBe(0);
});
