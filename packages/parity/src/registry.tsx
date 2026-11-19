import { Box } from "@unison-ui/ui";

/** Component name → component, resolved to web or native by the app's bundler. */
export const registry = { box: Box } as const;

export { fixtures, SCHEMES } from "./fixtures";
