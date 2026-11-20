export const swatchesFixture = {
  component: "swatches",
  cases: { all: {} },
  themes: ["default", "brand"],
  check: { layout: true, color: { maxDeltaE: 3 } },
} as const;
