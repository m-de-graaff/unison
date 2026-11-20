export interface ContrastPair {
  fg: string;
  bg: string;
  min: 3 | 4.5;
}

const STATUSES = ["success", "warning", "danger", "info"] as const;
const c = (name: string) => `color.${name}`;

/** The pairs that must pass for every theme and scheme (phase 1 todo, step 6). */
export const CONTRAST_PAIRS: ContrastPair[] = [
  ...["fg", "fg-muted"].flatMap((fg) =>
    ["canvas", "surface", "surface-raised", "subtle"].map(
      (bg): ContrastPair => ({ fg: c(fg), bg: c(bg), min: 4.5 }),
    ),
  ),
  { fg: c("fg-subtle"), bg: c("surface"), min: 3 },
  ...["accent", "accent-hover", "accent-active"].map(
    (bg): ContrastPair => ({ fg: c("on-accent"), bg: c(bg), min: 4.5 }),
  ),
  { fg: c("accent-fg"), bg: c("accent-subtle"), min: 4.5 },
  ...STATUSES.map((s): ContrastPair => ({ fg: c(`${s}-fg`), bg: c(`${s}-subtle`), min: 4.5 })),
  ...STATUSES.map((s): ContrastPair => ({ fg: c(`on-${s}`), bg: c(s), min: 4.5 })),
  ...["border-strong", "ring", "accent"].map(
    (fg): ContrastPair => ({ fg: c(fg), bg: c("surface"), min: 3 }),
  ),
];
