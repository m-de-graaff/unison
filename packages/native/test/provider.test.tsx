import { act, render, screen } from "@testing-library/react-native";
import { themes as built } from "@unison-ui/tokens/native";
import { Text } from "react-native";
import { type StorageAdapter, UnisonProvider } from "../src/provider";
import { useTheme } from "../src/theme";

// A second theme with its own objects, so identity checks can tell the two apart.
const themes = {
  default: built.default,
  brand: { light: { ...built.default.light }, dark: { ...built.default.dark } },
};

let seen: ReturnType<typeof useTheme> | undefined;
function Probe() {
  seen = useTheme();
  return <Text testID="probe">{`${seen.theme}/${seen.resolvedScheme}`}</Text>;
}

test("restores the stored theme from an async storage adapter", async () => {
  const storage: StorageAdapter = {
    getItem: async (key) => (key === "unison-theme" ? "brand" : null),
    setItem: jest.fn(),
  };
  await render(
    <UnisonProvider themes={themes} storage={storage}>
      <Probe />
    </UnisonProvider>,
  );
  await act(async () => {});
  expect(screen.getByTestId("probe")).toHaveTextContent("brand/light");
  expect(seen?.tokens).toBe(themes.brand.light);
});
