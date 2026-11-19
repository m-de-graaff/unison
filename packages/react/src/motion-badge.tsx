"use client";
import { useReducedMotion } from "@unison-ui/motion";

export function MotionBadge() {
  const reduced = useReducedMotion();
  return <span data-testid="motion-badge">{`motion: ${reduced ? "reduced" : "full"}`}</span>;
}
