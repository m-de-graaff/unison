import { Box } from "@unison-ui/ui";
import type { ComponentType } from "react";
import { fixtures } from "./fixtures";
import { Elevation, Radius, Swatches, TypeRamp } from "./fixtures/components/native";

/** Component name → component (React Native renderers). */
export const registry = {
  box: Box,
  swatches: Swatches,
  "type-ramp": TypeRamp,
  radius: Radius,
  elevation: Elevation,
} as const;

export { checkOf, fixtures, SCHEMES, THEMES } from "./fixtures";
export { PartsContext, type PartsRegistry } from "./parts";

type CaseProps = Record<string, unknown>;

export interface ParityCase {
  Subject: ComponentType<CaseProps & { testID?: string }>;
  props: CaseProps;
}

/** Looks up a fixture case by name; undefined when the component or case doesn't exist. */
export function getParityCase(component: string, caseName: string): ParityCase | undefined {
  const fixture = fixtures.find((f) => f.component === component);
  const props = (fixture?.cases as Record<string, CaseProps> | undefined)?.[caseName];
  const Subject = (registry as unknown as Record<string, ParityCase["Subject"] | undefined>)[
    component
  ];
  return Subject && props ? { Subject, props } : undefined;
}
