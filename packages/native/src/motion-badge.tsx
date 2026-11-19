import { useReducedMotion } from "@unison-ui/motion";
import { Text } from "react-native";

export function MotionBadge() {
  const reduced = useReducedMotion();
  return <Text testID="motion-badge">{`motion: ${reduced ? "reduced" : "full"}`}</Text>;
}
