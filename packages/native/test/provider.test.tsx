import { act, render, screen } from "@testing-library/react-native";
import { themes as built } from "@unison-ui/tokens/native";
import { Appearance, Text } from "react-native";
import { type StorageAdapter, UnisonProvider } from "../src/provider";
import { useTheme } from "../src/theme";
import { ThemeScope } from "../src/theme-scope";

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

test("setScheme switches tokens, drives Appearance and reports the change", async () => {
  const appearance = jest.spyOn(Appearance, "setColorScheme").mockImplementation(() => {});
  const onThemeChange = jest.fn();
  await render(
    <UnisonProvider themes={themes} onThemeChange={onThemeChange}>
      <Probe />
    </UnisonProvider>,
  );
  expect(seen?.tokens).toBe(themes.default.light);
  expect(appearance).toHaveBeenLastCalledWith("unspecified"); // system

  await act(async () => seen?.setScheme("dark"));
  expect(seen?.tokens).toBe(themes.default.dark);
  expect(appearance).toHaveBeenLastCalledWith("dark");

  await act(async () => seen?.setTheme("brand"));
  expect(onThemeChange).toHaveBeenLastCalledWith("brand", "dark");
  expect(seen?.tokens).toBe(themes.brand.dark);

  await act(async () => seen?.setScheme("system"));
  expect(appearance).toHaveBeenLastCalledWith("unspecified");
  appearance.mockRestore();
});

test("persists choices through the storage adapter, and a user pick beats a slow read", async () => {
  let resolve: (v: string | null) => void = () => {};
  const storage: StorageAdapter = {
    getItem: (key) =>
      key === "unison-theme" ? new Promise<string | null>((r) => (resolve = r)) : null,
    setItem: jest.fn(),
  };
  await render(
    <UnisonProvider themes={themes} storage={storage}>
      <Probe />
    </UnisonProvider>,
  );
  await act(async () => seen?.setTheme("brand"));
  expect(storage.setItem).toHaveBeenCalledWith("unison-theme", "brand");
  await act(async () => resolve("default")); // the stale stored value arrives late
  expect(seen?.theme).toBe("brand");
});

let inner: ReturnType<typeof useTheme> | undefined;
function Inner() {
  inner = useTheme();
  return null;
}

test("ThemeScope overrides theme and scheme for its subtree only", async () => {
  await render(
    <UnisonProvider themes={themes}>
      <Probe />
      <ThemeScope theme="brand" scheme="dark">
        <Inner />
      </ThemeScope>
    </UnisonProvider>,
  );
  expect(inner?.tokens).toBe(themes.brand.dark);
  expect(seen?.tokens).toBe(themes.default.light);
});

test.each(["constructor", "__proto__", "toString"])(
  'a stored "%s" falls back to the default theme',
  async (stored) => {
    const storage: StorageAdapter = {
      getItem: (key) => (key === "unison-theme" ? stored : null),
      setItem: jest.fn(),
    };
    await render(
      <UnisonProvider themes={themes} storage={storage}>
        <Probe />
      </UnisonProvider>,
    );
    await act(async () => {});
    expect(screen.getByTestId("probe")).toHaveTextContent("default/light");
    expect(seen?.tokens).toBe(themes.default.light);
    expect(() => seen?.setTheme(stored)).toThrow(`unknown theme "${stored}"`);
  },
);

test("a provider whose defaultTheme is an inherited key still renders the first theme", async () => {
  await render(
    <UnisonProvider themes={themes} defaultTheme="constructor">
      <Probe />
    </UnisonProvider>,
  );
  expect(seen?.tokens).toBe(themes.default.light);
});

test("ThemeScope rejects an inherited key as an unknown theme", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  await expect(
    render(
      <UnisonProvider themes={themes}>
        <ThemeScope theme="constructor">
          <Probe />
        </ThemeScope>
      </UnisonProvider>,
    ),
  ).rejects.toThrow('unknown theme "constructor"');
  jest.restoreAllMocks();
});
