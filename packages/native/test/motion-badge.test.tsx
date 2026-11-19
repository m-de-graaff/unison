import { render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { MotionBadge } from "../src/motion-badge";

test("shows motion: reduced when reduce motion is enabled", async () => {
  jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  await render(<MotionBadge />);
  expect(await screen.findByText("motion: reduced")).toBeOnTheScreen();
});
