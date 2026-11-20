import type { MotionPresetValue } from "@unison-ui/tokens/motion";
import { useSyncExternalStore } from "react";
import { toWaapi } from "./waapi";

export * from "../shared";
export { toWaapi };

const QUERY = "(prefers-reduced-motion: reduce)";

// jsdom and some embedded WebViews have no matchMedia: treat that as "no preference".
const query = (): MediaQueryList | undefined =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(QUERY)
    : undefined;

function subscribe(onChange: () => void): () => void {
  const mql = query();
  mql?.addEventListener("change", onChange);
  return () => mql?.removeEventListener("change", onChange);
}

const getSnapshot = () => query()?.matches ?? false;
const getServerSnapshot = () => false;

/** True when the user asked the OS for reduced motion. Always false on the server. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** `toWaapi` bound to a preset; picks the reduced variant while the OS asks for reduced motion. */
export function useWaapi(
  preset: MotionPresetValue,
): (phase: "enter" | "exit") => ReturnType<typeof toWaapi> {
  const reduced = useReducedMotion();
  return (phase) => toWaapi(preset, phase, { reduced });
}
