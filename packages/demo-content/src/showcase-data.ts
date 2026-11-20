import { simulateSpring } from "@unison-ui/tokens/spring";

/** The parts of `tokens.json` the showcase reads. */
export interface TokensJson {
  version: number;
  defaultTheme: string;
  themes: Record<
    string,
    Record<
      "light" | "dark",
      Record<
        string,
        { type: string; value: unknown; contrast?: { on: string; ratio: number; pass: boolean }[] }
      >
    >
  >;
}

export type ShowcaseItem =
  | {
      kind: "swatch";
      token: string;
      value: string;
      contrast?: { on: string; ratio: number; pass: boolean };
    }
  | { kind: "palette"; name: string; steps: { step: number; value: string }[] }
  | { kind: "text"; token: string; style: string; size: number; lineHeight: number; sample: string }
  | { kind: "space"; token: string; px: number }
  | { kind: "radius"; token: string; px: number }
  | { kind: "elevation"; token: string; shadow: string }
  /** `curve`: 32 samples of the preset's enter spring; empty for a timing transition. */
  | { kind: "motion"; preset: string; curve: number[] };

export interface ShowcaseSection {
  id: "semantic-colors" | "palettes" | "typography" | "space" | "radius-elevation" | "motion";
  title: string;
  items: ShowcaseItem[];
}

export const SAMPLE_TEXT = "The quick brown fox — 1234567890";

const STATUSES = ["success", "warning", "danger", "info"];
/** The todo's step 5 order. */
const SEMANTIC_COLORS = [
  "canvas",
  "surface",
  "surface-raised",
  "subtle",
  "muted",
  "fg",
  "fg-muted",
  "fg-subtle",
  "border",
  "border-strong",
  "ring",
  "accent",
  "accent-hover",
  "accent-active",
  "accent-subtle",
  "accent-fg",
  "on-accent",
  ...STATUSES.flatMap((s) => [s, `${s}-subtle`, `${s}-fg`, `${s}-border`, `on-${s}`]),
  "overlay",
];
const PALETTES = ["gray", "accent", "success", "warning", "danger", "info"];
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const TEXT_STYLES = [
  "caption",
  "label",
  "body-sm",
  "body",
  "body-lg",
  "title-sm",
  "title",
  "title-lg",
  "display",
  "code",
];
/** The todo's step 9 order. */
const SPACE = ["0", "0.5", "1", "1.5", "2", "3", "4", "5", "6", "8", "10", "12", "16", "20", "24"];
const RADII = ["control", "card", "overlay", "pill"];
const ELEVATIONS = ["raised", "popover", "overlay"];
const PRESETS = ["fade", "scale-in", "slide-up", "sheet", "pop", "press"];
/** Foregrounds whose contrast badge the showcase shows. */
const TEXT_TOKEN = /^color\.(fg|fg-muted|fg-subtle|on-.+|.+-fg)$/;

type Dim = { value: number; unit: string };
const px = (v: unknown): number => {
  if (typeof v === "string") return Number.parseFloat(v) * (v.endsWith("rem") ? 16 : 1);
  const d = v as Dim;
  return d.unit === "rem" ? d.value * 16 : d.value;
};
const len = (d: Dim) => (d.value === 0 ? "0" : `${d.value}${d.unit}`);

interface Layer {
  x: Dim;
  y: Dim;
  blur: Dim;
  spread: Dim;
  color: { hex: string };
  inset?: boolean;
}
/** CSS box-shadow, the same format the token compiler emits. */
function shadowCss(layers: Layer[]): string {
  return layers
    .map((l) => {
      const h = l.color.hex;
      const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
      const a = h.length === 9 ? Number.parseInt(h.slice(7), 16) / 255 : 1;
      const parts = [
        len(l.x),
        len(l.y),
        len(l.blur),
        ...(l.spread.value !== 0 ? [len(l.spread)] : []),
      ];
      return `${l.inset ? "inset " : ""}${parts.join(" ")} rgb(${r} ${g} ${b} / ${Number(a.toFixed(2))})`;
    })
    .join(", ");
}

/** Turns one theme × scheme of `tokens.json` into the showcase's sections. Pure. */
export function showcaseSections(
  tokens: TokensJson,
  theme: string,
  scheme: "light" | "dark",
): ShowcaseSection[] {
  const t = tokens.themes[theme]?.[scheme];
  if (!t) throw new Error(`tokens.json has no ${theme}/${scheme}`);
  const get = (path: string) => {
    const entry = t[path];
    if (!entry) throw new Error(`tokens.json has no ${path}`);
    return entry;
  };

  const swatches: ShowcaseItem[] = SEMANTIC_COLORS.map((name) => {
    const token = `color.${name}`;
    const entry = get(token);
    const first = TEXT_TOKEN.test(token) ? entry.contrast?.[0] : undefined;
    return {
      kind: "swatch",
      token,
      value: entry.value as string,
      ...(first ? { contrast: { on: first.on, ratio: first.ratio, pass: first.pass } } : {}),
    };
  });
  const palettes: ShowcaseItem[] = PALETTES.map((name) => ({
    kind: "palette",
    name,
    steps: STEPS.map((step) => ({ step, value: get(`color.${name}.${step}`).value as string })),
  }));
  const text: ShowcaseItem[] = TEXT_STYLES.map((style) => {
    const v = get(`text.${style}`).value as { fontSize: Dim; lineHeight: Dim };
    return {
      kind: "text",
      token: `text.${style}`,
      style,
      size: px(v.fontSize),
      lineHeight: px(v.lineHeight),
      sample: SAMPLE_TEXT,
    };
  });
  const space: ShowcaseItem[] = SPACE.map((step) => ({
    kind: "space",
    token: `space.${step}`,
    px: px(get(`space.${step}`).value),
  }));
  const shapes: ShowcaseItem[] = [
    ...RADII.map(
      (r): ShowcaseItem => ({
        kind: "radius",
        token: `radius.${r}`,
        px: px(get(`radius.${r}`).value),
      }),
    ),
    ...ELEVATIONS.map(
      (e): ShowcaseItem => ({
        kind: "elevation",
        token: `elevation.${e}`,
        shadow: shadowCss(get(`elevation.${e}`).value as Layer[]),
      }),
    ),
  ];
  const motion: ShowcaseItem[] = PRESETS.map((preset) => {
    const value = get(`motion.preset.${preset}`).value as {
      enter: { transition: { spring?: { stiffness: number; damping: number; mass: number } } };
    };
    const spring = value.enter.transition.spring;
    return { kind: "motion", preset, curve: spring ? simulateSpring(spring).samples : [] };
  });

  return [
    { id: "semantic-colors", title: "Semantic colours", items: swatches },
    { id: "palettes", title: "Palettes", items: palettes },
    { id: "typography", title: "Typography", items: text },
    { id: "space", title: "Space", items: space },
    { id: "radius-elevation", title: "Radius and elevation", items: shapes },
    { id: "motion", title: "Motion", items: motion },
  ];
}
