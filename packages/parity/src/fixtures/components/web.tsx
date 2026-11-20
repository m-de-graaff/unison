import { cssVarName } from "@unison-ui/tokens/paths";
import type { CSSProperties } from "react";
import { ELEVATIONS, RADII, SWATCH_COLORS, TEXT_STYLES, TYPE_SAMPLE } from "../tokens";

const v = (path: string) => `var(${cssVarName(path)})`;
interface FixtureProps {
  testID?: string;
}

/** 12 semantic colours as 40 × 40 squares in a 6 × 2 grid with 8 px gaps. */
export function Swatches({ testID }: FixtureProps) {
  return (
    <div
      data-testid={testID}
      style={{ display: "grid", gridTemplateColumns: "repeat(6, 40px)", gap: 8 }}
    >
      {SWATCH_COLORS.map((c, i) => (
        <div
          key={c}
          data-part={`swatch-${i}`}
          data-sample=""
          style={{ width: 40, height: 40, background: v(`color.${c}`) }}
        />
      ))}
    </div>
  );
}

/** Every text style as one line, stacked with no gaps. */
export function TypeRamp({ testID }: FixtureProps) {
  return (
    <div data-testid={testID} style={{ display: "flex", flexDirection: "column" }}>
      {TEXT_STYLES.map((s) => {
        const style: CSSProperties = {
          margin: 0,
          whiteSpace: "nowrap",
          color: v("color.fg"),
          fontFamily: v(s === "code" ? "font-family.mono" : "font-family.sans"),
          fontSize: `var(--unison-text-${s}-size)`,
          lineHeight: `var(--unison-text-${s}-line-height)`,
          fontWeight: `var(--unison-text-${s}-weight)` as unknown as number,
          letterSpacing: `var(--unison-text-${s}-tracking)`,
        };
        return (
          <p key={s} data-part={`line-${s}`} style={style}>
            {TYPE_SAMPLE}
          </p>
        );
      })}
    </div>
  );
}

/** One 64 × 64 box per semantic radius. */
export function Radius({ testID }: FixtureProps) {
  return (
    <div data-testid={testID} style={{ display: "flex", gap: 8 }}>
      {RADII.map((r) => (
        <div
          key={r}
          data-part={`radius-${r}`}
          style={{
            width: 64,
            height: 64,
            background: v("color.accent"),
            borderRadius: v(`radius.${r}`),
          }}
        />
      ))}
    </div>
  );
}

/** One card per elevation on canvas. */
export function Elevation({ testID }: FixtureProps) {
  return (
    <div
      data-testid={testID}
      style={{ display: "flex", gap: 16, padding: 16, background: v("color.canvas") }}
    >
      {ELEVATIONS.map((e) => (
        <div
          key={e}
          data-part={`elevation-${e}`}
          style={{
            width: 80,
            height: 64,
            background: v("color.surface-raised"),
            borderRadius: v("radius.card"),
            boxShadow: v(`elevation.${e}`),
          }}
        />
      ))}
    </div>
  );
}
