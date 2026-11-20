import { boxFixture } from "./box";
import { elevationFixture } from "./elevation";
import { radiusFixture } from "./radius";
import { swatchesFixture } from "./swatches";
import { typeRampFixture } from "./type-ramp";

/** How a fixture's runs are compared across platforms (same-platform baselines always run). */
export type FixtureCheck =
  | "layout"
  | { layout: true; color: { maxDeltaE: number } }
  /** Each part's height and its gap from the part above, not widths (glyph widths differ by
   * platform) or absolute `y` (per-line rounding adds up). */
  | { layout: "height-y" };

export interface Fixture {
  component: string;
  cases: Record<string, object>;
  /** Default `["default"]`. */
  themes?: readonly string[];
  /** Default `"layout"`. */
  check?: FixtureCheck;
}

export const fixtures = [
  boxFixture,
  swatchesFixture,
  typeRampFixture,
  radiusFixture,
  elevationFixture,
] as const satisfies readonly Fixture[];
export const SCHEMES = ["light", "dark"] as const;
export type Scheme = (typeof SCHEMES)[number];
/** The demo apps' themes (unison.config.ts). */
export const THEMES = ["default", "brand"] as const;

export interface Run {
  /** "<component>/<case>/<theme>/<scheme>" */
  id: string;
  component: string;
  caseName: string;
  theme: string;
  scheme: Scheme;
  props: object;
}

export const checkOf = (component: string): FixtureCheck =>
  (fixtures as readonly Fixture[]).find((f) => f.component === component)?.check ?? "layout";

/** Every component × case × theme × scheme. */
export function runs(): Run[] {
  return (fixtures as readonly Fixture[]).flatMap((f) =>
    Object.entries(f.cases).flatMap(([caseName, props]) =>
      (f.themes ?? ["default"]).flatMap((theme) =>
        SCHEMES.map((scheme) => ({
          id: `${f.component}/${caseName}/${theme}/${scheme}`,
          component: f.component,
          caseName,
          theme,
          scheme,
          props,
        })),
      ),
    ),
  );
}
