import { toWaapi, useReducedMotion } from "@unison-ui/motion";
import { useTheme } from "@unison-ui/ui";
import { type ShowcaseItem, showcaseSections, type TokensJson } from "demo-content";
import { useRef, useState } from "react";
import { motionPresets } from "../unison/motion.js";
import tokensJson from "../unison/tokens.json";
import { SettingsBar } from "./settings-bar";

/** Literal class names, so Tailwind sees them (it can't see classes built at runtime). */
const TEXT_CLASS: Record<string, string> = {
  caption: "text-caption",
  label: "text-label",
  "body-sm": "text-body-sm",
  body: "text-body",
  "body-lg": "text-body-lg",
  "title-sm": "text-title-sm",
  title: "text-title",
  "title-lg": "text-title-lg",
  display: "text-display",
  code: "text-code font-mono",
};

const v = (token: string) => `var(--unison-${token.replaceAll(".", "-")})`;
const name = (token: string) => token.replace(/^[a-z-]+\./, "");

function Curve({ preset, curve }: { preset: string; curve: number[] }) {
  if (curve.length === 0) return <span className="text-caption text-fg-muted">timing</span>;
  // 120 × 40, y = 1 at a third from the top, so the overshoot shows.
  const points = curve.map((y, i) => `${(i / (curve.length - 1)) * 120},${40 - y * 26}`).join(" ");
  return (
    <svg
      data-testid={`curve-${preset}`}
      width="120"
      height="40"
      viewBox="0 0 120 40"
      aria-hidden="true"
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MotionSection({ items }: { items: ShowcaseItem[] }) {
  const { theme } = useTheme();
  const osReduced = useReducedMotion();
  const [forced, setForced] = useState(false);
  const [active, setActive] = useState("scale-in");
  const card = useRef<HTMLDivElement>(null);
  const byTheme: Record<string, (typeof motionPresets)["default"]> = motionPresets;
  const presets = byTheme[theme] ?? motionPresets.default;
  function play(preset: string) {
    setActive(preset);
    const p = presets[preset as keyof typeof presets];
    if (p && card.current)
      card.current.animate(...toWaapi(p, "enter", { reduced: forced || osReduced }));
  }
  const curve = items.find((i) => i.kind === "motion" && i.preset === active);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((i) =>
          i.kind === "motion" ? (
            <button
              key={i.preset}
              type="button"
              data-testid={`play-${i.preset}`}
              onClick={() => play(i.preset)}
              className="rounded-control border border-border-strong px-3 py-1 text-label"
            >
              Play {i.preset}
            </button>
          ) : null,
        )}
        <label className="flex items-center gap-2 text-label">
          <input
            type="checkbox"
            data-testid="reduced-switch"
            checked={forced}
            onChange={(e) => setForced(e.target.checked)}
          />
          Reduced
        </label>
      </div>
      <div className="flex items-center gap-6">
        <div
          ref={card}
          data-testid="motion-card"
          className="size-24 rounded-card bg-accent"
          style={{ boxShadow: v("elevation.raised") }}
        />
        {curve?.kind === "motion" ? <Curve preset={curve.preset} curve={curve.curve} /> : null}
      </div>
    </div>
  );
}

function Item({ item }: { item: ShowcaseItem }) {
  switch (item.kind) {
    case "swatch":
      return (
        <div data-testid={`swatch-${item.token}`} className="flex items-center gap-3">
          <div
            className="size-10 rounded-control border border-border"
            style={{ background: v(item.token) }}
          />
          <div className="flex flex-col">
            <span className="text-label text-fg">{name(item.token)}</span>
            <span className="text-caption text-fg-muted">{item.value}</span>
          </div>
          {item.contrast ? (
            <span
              data-testid={`badge-${item.token}`}
              className={`rounded-pill px-2 text-caption ${item.contrast.pass ? "bg-success-subtle text-success-fg" : "bg-danger-subtle text-danger-fg"}`}
              title={`on ${item.contrast.on}`}
            >
              {item.contrast.ratio.toFixed(2)}:1 {item.contrast.pass ? "pass" : "fail"}
            </span>
          ) : null}
        </div>
      );
    case "palette":
      return (
        <div className="flex items-center gap-1">
          <span className="w-16 text-label text-fg">{item.name}</span>
          {item.steps.map((s) => (
            <div
              key={s.step}
              data-testid={`palette-${item.name}-${s.step}`}
              title={`${item.name}.${s.step} ${s.value}`}
              className="size-8 rounded-control"
              style={{ background: v(`color.${item.name}.${s.step}`) }}
            />
          ))}
        </div>
      );
    case "text":
      return (
        <p data-testid={`text-${item.style}`} className={`${TEXT_CLASS[item.style] ?? ""} text-fg`}>
          <span className="text-caption text-fg-muted">
            {item.style} {item.size}/{item.lineHeight}{" "}
          </span>
          {item.sample}
        </p>
      );
    case "space":
      return (
        <div className="flex items-center gap-3">
          <span className="w-16 text-caption text-fg-muted">{name(item.token)}</span>
          <div className="h-3 rounded-control bg-accent" style={{ width: item.px }} />
          <span className="text-caption text-fg-muted">{item.px}px</span>
        </div>
      );
    case "radius":
      return (
        <div
          data-testid={`shape-${item.token}`}
          className="flex size-24 items-center justify-center border border-border-strong bg-surface-raised text-caption text-fg"
          style={{ borderRadius: v(item.token) }}
        >
          {name(item.token)}
        </div>
      );
    case "elevation":
      return (
        <div
          data-testid={`shape-${item.token}`}
          className="flex size-24 items-center justify-center rounded-card bg-surface-raised text-caption text-fg"
          style={{ boxShadow: v(item.token) }}
        >
          {name(item.token)}
        </div>
      );
    default:
      return null;
  }
}

/** The six token sections for the active theme and scheme. App code, not library code. */
export function Showcase() {
  const { theme, resolvedScheme } = useTheme();
  const sections = showcaseSections(tokensJson as TokensJson, theme, resolvedScheme);
  return (
    <main className="flex min-h-dvh flex-col gap-8 bg-canvas p-4 text-fg">
      <SettingsBar />
      {sections.map((s) => (
        <section key={s.id} data-testid={`section-${s.id}`} className="flex flex-col gap-4">
          <h2 className="text-title">{s.title}</h2>
          {s.id === "motion" ? (
            <MotionSection items={s.items} />
          ) : (
            <div className={s.id === "radius-elevation" ? "flex flex-wrap gap-6" : "grid gap-3"}>
              {s.items.map((item) => (
                <Item
                  key={"token" in item ? item.token : "name" in item ? item.name : ""}
                  item={item}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
