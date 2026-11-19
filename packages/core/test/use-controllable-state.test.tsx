import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useControllableState } from "../src/use-controllable-state";

describe("useControllableState", () => {
  it("uncontrolled: updates internal state", () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 1 }));
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(2);
  });

  it("controlled: ignores internal updates and calls onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: 1, defaultValue: 0, onChange }),
    );
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(1);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("does not call onChange when setting the same value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultValue: 3, onChange }));
    act(() => result.current[1](3));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("the functional updater receives the latest value", () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 0 }));
    act(() => {
      result.current[1]((p) => p + 1);
      result.current[1]((p) => p + 1);
    });
    expect(result.current[0]).toBe(2);
  });
});
