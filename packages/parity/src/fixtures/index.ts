import { boxFixture } from "./box";

export const fixtures = [boxFixture] as const;
export const SCHEMES = ["light", "dark"] as const;
export type Scheme = (typeof SCHEMES)[number];

export interface Run {
  /** "<component>/<case>/<scheme>" */
  id: string;
  component: string;
  caseName: string;
  scheme: Scheme;
  props: object;
}

/** Every component × case × scheme. */
export function runs(): Run[] {
  return fixtures.flatMap((f) =>
    Object.entries(f.cases).flatMap(([caseName, props]) =>
      SCHEMES.map((scheme) => ({
        id: `${f.component}/${caseName}/${scheme}`,
        component: f.component,
        caseName,
        scheme,
        props,
      })),
    ),
  );
}
