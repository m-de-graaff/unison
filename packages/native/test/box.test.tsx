import { render, screen } from "@testing-library/react-native";
import { themes } from "@unison-ui/tokens/native";
import { Box } from "../src/box";

const mockScheme = jest.fn(() => "light");
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockScheme(),
}));

afterEach(() => mockScheme.mockReturnValue("light"));

test("the accent box uses the light accent colour", async () => {
  await render(<Box testID="b" />);
  expect(screen.getByTestId("b")).toHaveStyle({ backgroundColor: themes.light.color.accent });
});

test("the neutral box in dark mode uses the dark surface colour", async () => {
  mockScheme.mockReturnValue("dark");
  await render(<Box tone="neutral" testID="n" />);
  expect(screen.getByTestId("n")).toHaveStyle({ backgroundColor: themes.dark.color.surface });
});
