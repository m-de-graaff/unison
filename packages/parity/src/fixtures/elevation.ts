export const elevationFixture = {
  component: "elevation",
  cases: { all: {} },
  themes: ["default", "brand"],
  // Shadows render differently by platform: compared against same-platform baselines only.
  check: "layout",
} as const;
