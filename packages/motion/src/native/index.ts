import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export * from "../shared";

/** True when the user asked the OS for reduced motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    // A change event is newer than the initial query, so once one arrives the query's
    // (possibly stale) answer is ignored.
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => {
      changed = true;
      setReduced(value);
    });
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active && !changed) setReduced(value);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
