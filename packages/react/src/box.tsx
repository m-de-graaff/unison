import { type BoxProps, boxStyles } from "@unison-ui/core";
import { cssVar } from "./css-var";

export function Box({ tone = "accent", testID, children }: BoxProps) {
  return (
    <div
      data-testid={testID}
      style={{
        width: cssVar(boxStyles.size),
        height: cssVar(boxStyles.size),
        borderRadius: cssVar(boxStyles.radius),
        border: `1px solid ${cssVar(boxStyles.border)}`,
        background: cssVar(boxStyles.background[tone]),
      }}
    >
      {children}
    </div>
  );
}
