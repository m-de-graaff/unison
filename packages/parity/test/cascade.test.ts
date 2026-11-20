// Rendered theme cascade (ADR 0018): loads the generated tokens.css into headless Chromium and
// checks the colours each nesting resolves to. Skips when no Chromium binary is available.
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Browser, chromium, type Page } from "@playwright/test";
import { build, defineConfig, defineTheme, writeOutputs } from "@unison-ui/tokens";
import { formatHex, parse } from "culori";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deltaE2000 } from "../scripts/compare";

const executable = process.env.PARITY_CHROMIUM_PATH || chromium.executablePath();
const hasBrowser = existsSync(executable);

// The demo apps' config (apps/*/unison.config.ts).
const result = build(
  defineConfig({
    themes: {
      default: defineTheme({ accent: "indigo" }),
      brand: defineTheme({ extends: "default", accent: "#e11d48", radius: "lg" }),
    },
    defaultTheme: "default",
  }),
);
const out = mkdtempSync(join(tmpdir(), "parity-cascade-"));
writeOutputs(result, out);
const css = readFileSync(join(out, "web", "tokens.css"), "utf8");

type Theme = "default" | "brand";
type Scheme = "light" | "dark";
/** The colours a probe reads; each is a semantic token. */
const PROPS = {
  color: "color.accent",
  backgroundColor: "color.surface",
  borderTopColor: "color.fg",
};

/** The token hex values of a theme × scheme, straight from the build. */
function expected(theme: Theme, scheme: Scheme): Record<string, string> {
  const t = result.themes.find((x) => x.name === theme);
  if (!t) throw new Error(`no theme ${theme}`);
  return Object.fromEntries(
    Object.entries(PROPS).map(([prop, path]) => {
      const token = t[scheme].tokens.get(path);
      if (!token) throw new Error(`no token ${path}`);
      return [prop, (token.value as { hex: string }).hex];
    }),
  );
}

let browser: Browser;
let page: Page;
beforeAll(async () => {
  if (!hasBrowser) return;
  browser = await chromium.launch({
    executablePath: executable,
    args: ["--headless", "--no-sandbox"],
  });
  page = await browser.newPage();
});
afterAll(async () => {
  await browser?.close();
  rmSync(out, { recursive: true, force: true });
});

/**
 * Renders `body` under an `<html>` with `htmlAttrs` and the OS in `os` mode, and returns the
 * resolved colours of a probe inside `#t`.
 */
async function resolve(
  htmlAttrs: string,
  body: string,
  os: Scheme,
): Promise<Record<string, string>> {
  await page.emulateMedia({ colorScheme: os });
  await page.setContent(`<!doctype html><html ${htmlAttrs}><head><style>${css}
    .probe { color: var(--unison-color-accent); background-color: var(--unison-color-surface);
      border-top: 1px solid var(--unison-color-fg); }</style></head><body>${body}</body></html>`);
  const colours = await page.evaluate((props) => {
    const target = document.getElementById("t") ?? document.body;
    const probe = document.createElement("i");
    probe.className = "probe";
    target.append(probe);
    const cs = getComputedStyle(probe);
    return Object.fromEntries(props.map((p) => [p, cs[p as "color"]]));
  }, Object.keys(PROPS));
  return Object.fromEntries(
    Object.entries(colours).map(([k, v]) => [k, formatHex(parse(v)) ?? `unparsed ${v}`]),
  );
}

/** Asserts every probe colour is within ΔE2000 2 of the token hex (OQ-10's tolerance). */
function expectColours(actual: Record<string, string>, theme: Theme, scheme: Scheme) {
  const want = expected(theme, scheme);
  for (const [prop, hex] of Object.entries(want)) {
    const got = actual[prop] as string;
    expect(
      deltaE2000(got, hex),
      `${prop}: got ${got}, want ${hex} (${theme} ${scheme})`,
    ).toBeLessThan(2);
  }
}

/** What ThemeScope renders; `id="t"` marks the element read. */
const scope = (theme: string, scheme: string, inner = "", id = "") =>
  `<div style="display: contents"${id ? ` id="${id}"` : ""} data-unison-theme="${theme}" data-theme="${scheme}">${inner}</div>`;

// [name, <html> attributes, OS scheme, body (#t is the element read), expected theme, scheme]
const CASES: [string, string, Scheme, string, Theme, Scheme][] = [
  // The todo's base shapes.
  ["bare page, OS light", "", "light", "", "default", "light"],
  ["bare page, OS dark", "", "dark", "", "default", "dark"],
  ["page set dark", 'data-theme="dark"', "light", "", "default", "dark"],
  ["page forced light under OS dark", 'data-theme="light"', "dark", "", "default", "light"],
  ["brand page", 'data-unison-theme="brand" data-theme="light"', "light", "", "brand", "light"],
  ["brand page, dark", 'data-unison-theme="brand" data-theme="dark"', "light", "", "brand", "dark"],
  [
    "brand page without a scheme, OS dark",
    'data-unison-theme="brand"',
    "dark",
    "",
    "brand",
    "dark",
  ],
  [
    "a dark subtree in a light page",
    'data-unison-theme="default" data-theme="light"',
    "light",
    '<div data-theme="dark" id="t"></div>',
    "default",
    "dark",
  ],
  [
    "a default scope under OS dark",
    "",
    "dark",
    '<div data-unison-theme="default" id="t"></div>',
    "default",
    "dark",
  ],
  [
    "a brand scope under OS dark",
    "",
    "dark",
    '<div data-unison-theme="brand" id="t"></div>',
    "brand",
    "dark",
  ],
  // The review's failures: a scope with both attributes shows exactly its theme × scheme.
  [
    "brand light scope in a dark page",
    'data-unison-theme="default" data-theme="dark"',
    "light",
    scope("brand", "light", "", "t"),
    "brand",
    "light",
  ],
  [
    "default light scope in a dark page",
    'data-unison-theme="default" data-theme="dark"',
    "dark",
    scope("default", "light", "", "t"),
    "default",
    "light",
  ],
  [
    "dark scope in a brand page (ThemeScope writes the page's theme)",
    'data-unison-theme="brand" data-theme="light"',
    "light",
    scope("brand", "dark", "", "t"),
    "brand",
    "dark",
  ],
  [
    "light scope in a dark brand page",
    'data-unison-theme="brand" data-theme="dark"',
    "light",
    scope("brand", "light", "", "t"),
    "brand",
    "light",
  ],
  [
    "scheme-only element in a brand page (server render) takes the page's theme",
    'data-unison-theme="brand" data-theme="light"',
    "light",
    '<div data-theme="dark" id="t"></div>',
    "brand",
    "dark",
  ],
  [
    "a light subtree with a default theme under OS dark",
    "",
    "dark",
    '<div data-theme="light"><div data-unison-theme="default" id="t"></div></div>',
    "default",
    "light",
  ],
  [
    "the same with the page set dark by ThemeScript",
    'data-unison-theme="default" data-theme="dark"',
    "dark",
    '<div data-theme="light"><div data-unison-theme="default" id="t"></div></div>',
    "default",
    "light",
  ],
  [
    "a theme-only element in a dark subtree of a light page",
    'data-unison-theme="default" data-theme="light"',
    "light",
    '<div data-theme="dark"><div data-unison-theme="brand" id="t"></div></div>',
    "brand",
    "dark",
  ],
  [
    "a scheme-only element inside a default scope in a brand page",
    'data-unison-theme="brand" data-theme="light"',
    "light",
    scope("default", "dark", '<div data-theme="light" id="t"></div>'),
    "default",
    "light",
  ],
  [
    "scopes nested three deep",
    'data-unison-theme="brand" data-theme="dark"',
    "dark",
    scope("default", "light", scope("brand", "dark", scope("default", "light", "", "t"))),
    "default",
    "light",
  ],
];

describe.skipIf(!hasBrowser)("rendered theme cascade (Chromium)", () => {
  it("the four theme × scheme references differ", () => {
    const all = (["default", "brand"] as const).flatMap((t) =>
      (["light", "dark"] as const).map((s) => JSON.stringify(expected(t, s))),
    );
    expect(new Set(all).size).toBe(4);
  });

  it.each(CASES)("%s", async (_name, htmlAttrs, os, body, theme, scheme) => {
    expectColours(await resolve(htmlAttrs, body, os), theme, scheme);
  });

  // ADR 0018: app CSS that sets a token on :root still wins over the default theme, also once
  // ThemeScript has put both attributes on <html> (the default compound skips :root).
  it.each([
    ["a bare <html>", ""],
    ["<html> after ThemeScript, light", 'data-unison-theme="default" data-theme="light"'],
    ["<html> after ThemeScript, dark", 'data-unison-theme="default" data-theme="dark"'],
  ])("an app :root override wins on %s", async (_name, attrs) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
    await page.setContent(`<!doctype html><html ${attrs}><head><style>${css}</style>
      <style>:root { --unison-color-accent: rgb(255, 0, 0); }</style></head><body>
      <i id="a" style="display:block;color:var(--unison-color-accent)"></i></body></html>`);
    const colour = await page.evaluate(
      () => getComputedStyle(document.getElementById("a") as Element).color,
    );
    expect(colour).toBe("rgb(255, 0, 0)");
  });

  it("radius follows brand inside a brand scope in a dark default page", async () => {
    await page.setContent(`<!doctype html><html data-unison-theme="default" data-theme="dark"><head>
      <style>${css}</style></head><body>${scope("brand", "light", '<i id="r" style="display:block;border-top-left-radius:var(--unison-radius-card)"></i>')}<i id="d" style="display:block;border-top-left-radius:var(--unison-radius-card)"></i></body></html>`);
    const radius = (id: string) =>
      page.evaluate(
        (i) => getComputedStyle(document.getElementById(i) as Element).borderTopLeftRadius,
        id,
      );
    expect(await radius("r")).toBe("12px");
    expect(await radius("d")).toBe("8px");
  });

  it("reduced motion reaches a compound scope and an OS-dark page", async () => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body>
      ${scope("brand", "dark", "", "t")}</body></html>`);
    const fade = await page.evaluate(() =>
      ["t", ""].map(
        (id) =>
          getComputedStyle(id ? (document.getElementById(id) as Element) : document.documentElement)
            .getPropertyValue("--unison-animate-fade")
            .trim()
            .split(" ")[0],
      ),
    );
    expect(fade).toEqual(["unison-fade-reduced-in", "unison-fade-reduced-in"]);
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  });
});
