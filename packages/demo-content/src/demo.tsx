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
