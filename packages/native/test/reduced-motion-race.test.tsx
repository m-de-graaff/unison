import { act, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { MotionBadge } from "../src/motion-badge";

test("a reduce-motion change wins over a slower initial query", async () => {
  let resolveInitial: (value: boolean) => void = () => {};
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockReturnValue(new Promise<boolean>((resolve) => (resolveInitial = resolve)));
  let emit: (value: boolean) => void = () => {};
  jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(((
    _event: string,
    handler: (value: boolean) => void,
  ) => {
    emit = handler;
    return { remove: () => {} };
  }) as unknown as typeof AccessibilityInfo.addEventListener);

  await render(<MotionBadge />);
  await act(async () => emit(true)); // the user turns Reduce Motion on…
  await act(async () => resolveInitial(false)); // …then the stale initial query resolves
  expect(screen.getByTestId("motion-badge")).toHaveTextContent("motion: reduced");
});
