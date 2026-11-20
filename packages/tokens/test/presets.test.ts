import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildTheme } from "../src/build";
import { MOTION_TYPES } from "../src/emit-motion";
import { compile } from "../src/index";
import { expandPreset, expandPresets, PRESETS } from "../src/motion/presets";

/** Expands with the feel the build carries, as the emitters do. */
const expand = (
  motion: "snappy" | "smooth" | "reduced" | undefined,
  name: (typeof PRESETS)[number],
) => {
  const t = theme(motion);
  return expandPreset(t.light.tokens, name, t.motion);
};

const theme = (motion?: "snappy" | "smooth" | "reduced") =>
  buildTheme({
    name: "default",
    motion,
    accent: { name: "accent", hue: 275, chroma: 0.2 },
    neutral: { name: "gray", hue: 275, chroma: 0.012 },
    autoContrast: true,
  });

describe.each(PRESETS)("%s", (name) => {
  const p = expandPreset(theme().light.tokens, name);
  it("has enter and exit", () => {
    expect(p.enter.transition).toBeDefined();
    expect(p.exit.transition).toBeDefined();
  });
  it("reduced only animates opacity, linearly", () => {
    if (name === "press") return expect(p.reduced).toBeNull();
    for (const ph of [p.reduced?.enter, p.reduced?.exit]) {
      expect(Object.keys({ ...ph?.from, ...ph?.to })).toEqual(["opacity"]);
      expect(ph?.transition).toMatchObject({ type: "timing", easing: [0, 0, 1, 1] });
    }
  });
});

it("scale-in enters with the snappy spring", () => {
  expect(expandPreset(theme().light.tokens, "scale-in").enter.transition).toEqual({
    type: "spring",
    config: { stiffness: 400, damping: 30, mass: 1 },
  });
});
it("smooth swaps the spring and stretches durations", () => {
  const p = expand("smooth", "scale-in");
  expect(p.enter.transition).toMatchObject({ config: { stiffness: 300, damping: 35 } });
  expect(p.exit.transition).toMatchObject({ type: "timing", duration: 96 }); // 80 × 1.2
});
it("reduced feel always uses the reduced variant", () => {
  const p = expand("reduced", "slide-up");
  expect(p.enter).toEqual(p.reduced?.enter);
});
it("reduced feel makes press stand still", () => {
  const p = expand("reduced", "press");
  expect(p.enter.transition).toMatchObject({ type: "timing", duration: 0 });
  expect(p.exit.transition).toMatchObject({ type: "timing", duration: 0 });
  expect(p.reduced).toBeNull();
});
it("a smooth build's emitted presets reflect smooth", () => {
  const smooth = theme("smooth");
  const presets = expandPresets(smooth.light.tokens, smooth.motion);
  expect(presets["scale-in"].exit.transition).toMatchObject({ duration: 96 });
  expect(presets["scale-in"].enter.transition).toMatchObject({
    config: { stiffness: 300, damping: 35 },
  });
  const snappy = theme();
  expect(
    expandPresets(snappy.light.tokens, snappy.motion)["scale-in"].exit.transition,
  ).toMatchObject({
    duration: 80,
  });
});
it("exit starts from where enter ended", () => {
  const p = expandPreset(theme().light.tokens, "scale-in");
  expect(p.exit.from).toEqual(p.enter.to);
});
it("sheet slides from 100%", () => {
  expect(expandPreset(theme().light.tokens, "sheet").enter.from).toEqual({ translateY: "100%" });
});

describe("outputs", () => {
  const out = mkdtempSync(join(tmpdir(), "unison-presets-"));
  const root = join(import.meta.dirname, "..");
  const ready = compile({ cwd: root, outDir: out });
  const read = async (file: string) => {
    await ready;
    return readFileSync(join(out, file), "utf8");
  };

  it("tokens.css has keyframes, animate variables and the reduced block", async () => {
    const css = await read("web/tokens.css");
    expect(css).toContain("@keyframes unison-scale-in-in");
    expect(css).toContain("@keyframes unison-scale-in-reduced-out");
    expect(css).toContain(
      "--unison-animate-scale-in: unison-scale-in-in var(--unison-spring-snappy-duration) var(--unison-spring-snappy) both;",
    );
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain(
      "--unison-animate-scale-in: unison-scale-in-reduced-in var(--unison-motion-duration-fast-enter) var(--unison-easing-linear) both;",
    );
    expect(css).toContain("from { opacity: 0; transform: translateY(8px); }");
    expect(css).toContain("from { opacity: 0; transform: scale(0.96); }");
    expect(css).not.toContain("unison-press-reduced");
  });

  it("theme.css maps --animate-* for every preset", async () => {
    const css = await read("web/theme.css");
    for (const name of PRESETS) {
      expect(css).toContain(`--animate-${name}: var(--unison-animate-${name});`);
      expect(css).toContain(`--animate-${name}-out: var(--unison-animate-${name}-out);`);
    }
  });

  it("dist/motion.js and the native theme carry the same preset data", async () => {
    await ready;
    const { motionPresets } = await import(join(out, "motion.js"));
    const { themes } = await import(join(out, "native/theme.js"));
    expect(motionPresets.default["scale-in"].enter.transition.type).toBe("spring");
    expect(themes.default.light.motion.presets["scale-in"]).toEqual(
      motionPresets.default["scale-in"],
    );
    expect(themes.default.dark.motion.presets).toEqual(themes.default.light.motion.presets);
    expect(Object.keys(motionPresets.default)).toEqual([...PRESETS]);
  });
});

describe("dist/motion.d.ts", () => {
  it("declares the same types as src/motion/presets.ts", () => {
    const dir = mkdtempSync(join(tmpdir(), "unison-motion-types-"));
    writeFileSync(join(dir, "gen.d.ts"), MOTION_TYPES.join("\n"));
    writeFileSync(
      join(dir, "probe.ts"),
      [
        'import type * as G from "./gen";',
        `import type * as S from "${join(import.meta.dirname, "../src/motion/presets")}";`,
        "type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;",
        "export const ok: [",
        "  Same<G.MotionPresetValue, S.MotionPresetValue>,",
        "  Same<G.MotionPresetName, S.MotionPresetName>,",
        "  Same<G.MotionFeel, S.MotionFeel>,",
        "  Same<G.PresetPhase, S.PresetPhase>,",
        "  Same<G.ResolvedTransition, S.ResolvedTransition>,",
        "  Same<G.MotionValues, S.MotionValues>,",
        "] = [true, true, true, true, true, true];",
      ].join("\n"),
    );
    const tsc = join(import.meta.dirname, "../../../node_modules/.bin/tsc");
    const run = spawnSync(
      tsc,
      [
        "--noEmit",
        "--strict",
        "--skipLibCheck",
        "--target",
        "es2022",
        "--module",
        "esnext",
        "--moduleResolution",
        "bundler",
        "--types",
        "",
        "probe.ts",
      ],
      { cwd: dir, encoding: "utf8" },
    );
    expect(run.stdout + run.stderr).toBe("");
    expect(run.status).toBe(0);
  });
});
