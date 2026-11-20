import { Box, MotionBadge } from "@unison-ui/ui";

export function DemoItems() {
  return (
    <>
      <Box testID="box-accent" />
      <Box tone="neutral" testID="box-neutral" />
      <MotionBadge />
    </>
  );
}
export { SCHEMES, THEMES } from "./settings";
export {
  SAMPLE_TEXT,
  type ShowcaseItem,
  type ShowcaseSection,
  showcaseSections,
  type TokensJson,
} from "./showcase-data";
