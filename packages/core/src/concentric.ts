/** Inner radius for a surface nested `padding` inside one with `outerRadius`; never negative. */
export const concentric = (outerRadius: number, padding: number): number =>
  Math.max(0, outerRadius - padding);
