# Phase 5 — development todo: ecosystem & engine v1.0

Same format as before: follow the steps in order, pass each **Done when**, one commit per step. This phase finishes the engine's ecosystem — still no components. At the end, the Unison engine 1.0 is on npm with icons, three theme presets, a docs site with foundations and engine reference pages, live demos, phone previews and a theme builder, a CLI that can diff and update ejected code and re-theme an app, an open registry anyone can publish to, and a completed accessibility audit of the engine — the v1.0 gate. Components are added on top afterwards, following the component catalogue.

## 0. Before you start

### Prerequisites

- [ ] `phase-4-complete` is tagged and `0.4.0` is published.
- [ ] A domain for the docs site. Check availability of a few candidates (for example `unison-ui.dev`, `unisonui.dev`) and register one; every later step that needs a URL uses it. This todo writes it as `<docs-domain>`.
- [ ] A Vercel account (or Netlify) for hosting the docs site, and the Expo account from phase 0 for phone previews.

### Decisions this phase assumes

Each becomes an ADR in step 15.

| Decision | Default | Why |
| --- | --- | --- |
| Docs framework | Fumadocs (Next.js App Router + MDX), in `apps/docs` | Built for library docs; the docs site itself becomes a real Next.js consumer of Unison |
| Phone previews | The Expo demo app published with EAS Update to a `docs` channel, opened in Expo Go from a QR code on each docs page | Every dependency Unison uses is in Expo Go, so no app-store build is needed |
| Icons | `@unison-ui/icons`: Lucide (`lucide-react` on web, `lucide-react-native` on native) behind one import | Same names on both platforms; an `Icon` component comes later with the components |
| Theme builder | Runs the real token compiler in the browser | What you see in the builder is exactly what `unison-tokens build` produces |
| Accessibility audit | An internal WCAG 2.2 AA audit of the engine and foundations (checked through the probes), with a recommended (optional) external audit before 1.0 | A written, repeatable audit; components get their own audit rows when they land |
| Release path | `1.0.0-rc.x` prereleases via Changesets pre mode, at least 2 weeks of real use, then `1.0.0` | Find breaking issues while changing the API is still cheap |

### What "v1.0" promises

Write this into `docs/versioning.md` in step 14. It's the contract with users:

- [ ] Stable public API: every export of `@unison-ui/tokens`, `@unison-ui/core`, `@unison-ui/motion`, `@unison-ui/react`, `@unison-ui/native`, `@unison-ui/ui`, `@unison-ui/icons` and the CLI commands follows semantic versioning. Breaking changes only in a new major, after at least one minor release with deprecation warnings.
- [ ] Supported platforms: the React, React Native and Expo SDK versions tested in CI, the last two Expo SDKs, evergreen browsers and Safari 15.4+ (cascade layers and `oklch()` arrived in 15.4; browsers without `linear()` easing get the cubic-bezier fallback from phase 1).
- [ ] Not covered: anything under `/internal` (including the probes), `unstable_` options, the visual design itself (themes may be refined in minor releases), and registry file contents for ejected code.

## 1. Icons

### Step 1 — `@unison-ui/icons`

- [ ] New public package with the same platform-condition setup as `@unison-ui/ui` (phase 0, step 13):
  - `src/web.ts`: re-exports icons from `lucide-react`
  - `src/native.ts`: re-exports the same names from `lucide-react-native` (which needs `react-native-svg`, already a peer dependency)
- [ ] Don't use `export *`. A build script generates **explicit** named re-exports from the intersection of icon names present in both Lucide packages, so the two entries always have identical export lists (the contract test from phase 2 checks it) and tree-shaking stays reliable.
- [ ] Pin both Lucide packages to the same version through the catalog, and let Renovate update them together.

**Done when:** `import { Search } from "@unison-ui/icons"` works in all three demo apps; the web bundle contains only the icons imported (check with the bundle analyser); the contract test passes. Commit: `feat(icons): cross-platform lucide package`.

## 2. Themes

### Step 2 — Display font support

The editorial theme needs a separate heading font, which the token system doesn't have yet.

- [ ] Add `font-family.display` (defaults to the same stack as `sans`) and make the `title-lg` and `display` text styles use it. `title` and smaller stay on `sans`.
- [ ] `defineTheme({ fonts: { display, nativeFonts: { display: { 400: …, 600: … } } } })` sets it; the native emitter resolves `display` faces like `sans` ones (phase 1, step 7).
- [ ] Contrast and metrics don't change, but serif fonts often sit differently in the line box: the `type-ramp` parity fixture must still pass (heights are fixed by line height, so it should).

**Done when:** a theme with a different display font renders `title-lg` and `display` in it on all four surfaces, and parity passes. Commit: `feat(tokens): display font`.

### Step 3 — Three theme presets

- [ ] Ship them as ready-made option sets, exported from `@unison-ui/tokens/presets`:

| Preset | Accent | Neutral | Radius | Density | Motion | Fonts | Feel |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `neutral` (the default) | indigo | gray | md | default | snappy | Inter | Clean, precise, product UI |
| `soft` | violet | warm | lg | comfortable | smooth | Inter | Friendly, consumer apps |
| `editorial` | a deep ink blue (`{ hue: 255, chroma: 0.12 }`) | neutral | sm | default | snappy | Inter + a serif display face (for example Instrument Serif or Fraunces, both under the SIL Open Font License) | Content-heavy, typographic |

- [ ] Usage: `defineTheme({ ...presets.soft, accent: "teal" })`, so a preset is a starting point, never a lock-in.
- [ ] Each preset passes contrast in both schemes with no auto-contrast adjustments; tune its aliases until it does.
- [ ] `unison init` gets a preset prompt (default `neutral`), and the demo apps add `soft` and `editorial` as named themes, so the settings bar from phase 1 can switch between all three.

**Done when:** all three presets pass contrast with no adjustments; the `/tokens` showcase, the probe form and the Motion lab look intentional in each preset, both schemes (judge it side by side, not just "nothing breaks"); parity fixtures run for all three. Commit: `feat(tokens): neutral, soft and editorial presets`.

## 3. Docs site

### Step 4 — Set up `apps/docs`

- [ ] Scaffold with Fumadocs' creator (`create-fumadocs-app`) into `apps/docs`, Next.js App Router, MDX content in `apps/docs/content/docs`. The site itself uses Unison's tokens and engine with the neutral preset: the docs are the first real consumer.
- [ ] Information architecture (sidebar order):
  - Getting started: introduction, installation (Next.js, Vite, Expo), the CLI, theming your app
  - Foundations: tokens, colour, typography, spacing and shape, elevation, motion, theming and dark mode, accessibility
  - Engine: styling (`defineStyles`), interactions and press feedback, haptics, the form engine, `Presence` and animation, overlays, gestures
  - Components: an empty section with a "coming soon" page linking the catalogue; component pages are added as components land
  - Guides: authoring components, customising and ejecting, Tailwind, performance
  - Reference: CLI commands, token table (generated), changelog, versioning and support
  - Community: contributing, publishing to the registry
- [ ] Move the markdown written in phases 0–4 (`docs/forms.md`, `docs/overlays.md`, `docs/motion.md`, `docs/gestures.md`, `docs/authoring-components.md`, …) into these pages; `docs/` keeps only ADRs and internal checklists.
- [ ] Search: Fumadocs' built-in search. OG images per page. "Edit on GitHub" links.
- [ ] Deploy to Vercel at `<docs-domain>`, with preview deployments on every PR.

**Done when:** the site builds in CI, every page from the IA exists (stubs are fine for now), search finds "Presence", and Lighthouse scores ≥ 95 for performance and 100 for accessibility on the home page and the motion page. Commit: `feat(docs): docs site scaffold`.

### Step 5 — Engine reference pages

- [ ] One page per engine area, each with a live demo at the top (rendered by the probes from phases 2–4) and a code tab per platform (web / native): `defineStyles` and the styling rules; interactions and `onPress`; press feedback and haptics; the form engine (`FieldProvider`, `useFieldControl`, `FormProvider`, `fromController`); `Presence` and `animate()`; portals and the overlay stack; `useDrag` and release resolution.
- [ ] API tables generated from TypeScript, not written by hand: a script (`pnpm docs:api`, using the TypeScript compiler API) reads the types and doc comments of each public export and writes JSON; an MDX `<ApiTable name="useDrag" />` renders it. CI fails if the JSON is out of date. The same script is built to also produce props tables (shared props, web extras, native extras) once components exist.
- [ ] A ready page template for future component pages (variants, accessibility, motion and haptics, customisation with `className`, slots and native styles, eject notes), so components land with docs from day one.
- [ ] The token reference page is generated from `tokens.json` (phase 1), with swatches and contrast ratios.

**Done when:** every public engine export has a page with a working demo and a generated API table; renaming an option in code without regenerating fails CI. Commit: `feat(docs): engine reference pages`.

### Step 6 — Phone previews

- [ ] Make sure the Expo demo app is on the latest Expo SDK (Expo Go only runs the current one) and uses only libraries included in Expo Go (it should: Reanimated, Gesture Handler, SVG, Haptics, Fonts).
- [ ] CI step on every release: `eas update --channel docs --message "<version>"`.
- [ ] Each foundations and engine page shows a QR code (generated with the `qrcode` package) plus an "Open in Expo Go" link that deep-links to the matching screen of the demo app (the tokens showcase, the probe form, the Motion lab). Component pages get the same block later. Check Expo's current docs for the exact EAS Update URL format with a path, and test it on both phones.

**Done when:** scanning the QR on the motion page with an iPhone and an Android phone opens the Motion lab of the latest release in Expo Go. Commit: `feat(docs): phone previews`.

### Step 7 — Theme builder

- [ ] Refactor the token compiler (phase 1) into a pure core, `compileInMemory(config) => { css, tailwindCss, nativeTheme, json, contrastReport }`, with no file system access, plus a thin Node wrapper for the CLI. culori and the generator are pure JavaScript, so the same core runs in the browser and in React Native.
- [ ] `/themes` page:
  - Controls: preset, accent (presets + a colour picker for any hex), neutral, radius, density, motion, fonts
  - Live preview: the tokens showcase (colour ramps, type scale, radius, elevation), the probe form and the Motion lab presets in a `ThemeScope`, re-themed by injecting the compiled CSS into a `<style>` tag (debounced at 100 ms; the compile must take under 50 ms)
  - A contrast panel listing every pair with pass/fail, and any auto-contrast adjustments
  - Outputs: the `unison.config.ts` to copy, and an `npx @unison-ui/cli init --theme "<encoded>"` command (step 9 adds `--theme`)
  - A shareable URL (the options encoded in the query string)
  - "Preview on phone": a QR that opens the Expo demo with the encoded theme. The demo decodes it, runs `compileInMemory` on the device and applies the result through `UnisonProvider`.

**Done when:** changing the accent in the builder re-themes the preview in under 100 ms; a shared URL reproduces the same theme; the phone preview matches the browser preview side by side; the copied config produces byte-identical CSS through the CLI. Commit: `feat(docs): theme builder`.

## 4. CLI and registry

### Step 8 — `unison diff` and `unison update`

Ejected code drifts; these commands let teams pull in upstream fixes without losing their changes.

- [ ] `unison diff <name>`: three versions of each ejected file:
  - **base**: the registry item at the version recorded in `unison.json` when it was ejected (phase 2)
  - **theirs**: the registry item at the installed (or `--to`) version
  - **ours**: the local files
  - It prints two unified diffs — "upstream changed since your eject" (base → theirs) and "you changed" (base → ours) — and says when there's nothing upstream to take.
- [ ] `unison update <name>`: a three-way merge per file (`node-diff3`). Clean merges are written directly; conflicts get standard `<<<<<<< ours / ======= / >>>>>>> upstream` markers and are listed at the end. It updates the recorded version only when there are no conflicts left. `--dry-run` shows the result without writing.
- [ ] The web class-prefix rename (phase 2) is applied to base and theirs before merging, so it never shows up as a conflict.

**Done when:** in a test project with an ejected `probe` item that has a local style change, an upstream fix in a new registry version merges cleanly via `update`; a test with overlapping changes produces conflict markers and a clear message. Commit: `feat(cli): diff and update`.

### Step 9 — `unison theme`

- [ ] `unison theme`: prints the current config's options and a link to the theme builder pre-filled with them (the same encoding as step 7).
- [ ] `unison theme set <option> <value>` (for example `unison theme set accent rose`): edits `unison.config.ts` with ts-morph and rebuilds tokens. Unknown values get the same suggestions as `defineTheme` validation.
- [ ] `unison init --theme "<encoded>"` and `unison theme apply "<encoded>"`: apply a theme straight from a builder URL.

**Done when:** a round trip works: builder → copy command → `theme apply` in a fresh app → `unison theme` prints a link that opens the same theme in the builder. Commit: `feat(cli): theme commands`.

### Step 10 — Third-party registries

- [ ] `unison add <url>` installs any registry item URL (ours or anyone's), checking it against the schema first.
- [ ] Named registries in `unison.json`: `"registries": { "@acme": "https://acme.dev/r/{platform}/{name}.json" }`, so `unison add @acme/data-table` works. `{platform}` is filled with `web` or `native`.
- [ ] Safety: before writing files from a third-party registry, show the list of files and dependencies and ask for confirmation (skipped only with `--yes`); never run scripts from registry items.
- [ ] `@unison-ui/registry-kit`: a small public package with the build script from phase 2 (step 10), so others can build per-platform, schema-valid items from their own components.
- [ ] Docs page "Publishing to the registry": item format, platforms, `registryDependencies`, hosting on GitHub Pages, and how to make components that follow Unison's conventions (style specs, platform extras, the contract test).

**Done when:** a sample third-party registry (a separate small repo with one component, built with `registry-kit` and hosted on GitHub Pages) installs into a fresh Next.js app and a fresh Expo app with `unison add @sample/rating`. Commit: `feat(cli): third-party registries`.

## 5. Accessibility audit and quality sweep

### Step 11 — WCAG 2.2 AA audit

- [ ] `docs/accessibility/audit-1.0.md`: one table per engine area — tokens and contrast, styling and the focus ring, interaction and press feedback, the form engine, overlays and modal behaviour, motion and reduced motion, gestures — checked through the probes, with these success criteria as rows and pass / fail / not applicable plus notes, for web, iOS and Android. Components add their own tables when they land:

| Criterion | What to check in Unison |
| --- | --- |
| 1.3.1 Info and relationships | Labels tied to controls through the field engine, error and description ids wired up |
| 1.4.3 / 1.4.11 Contrast | Text 4.5:1, UI parts 3:1, in all 3 presets × 2 schemes (the build already enforces the token pairs; check real compositions in the probes) |
| 1.4.4 Resize text | Web at 200% zoom; native at the largest accessibility text sizes |
| 1.4.10 Reflow | Web at 320 CSS px wide: no horizontal scrolling in the probe form, the Motion lab and the docs pages |
| 1.4.12 Text spacing | Web with increased letter, word and line spacing: nothing clipped |
| 2.1.1 / 2.1.2 Keyboard, no trap | Everything works by keyboard; Escape always leaves overlays |
| 2.4.3 / 2.4.7 Focus order and visible | Logical order; the ring shows on every focusable element |
| 2.4.11 Focus not obscured | Overlays and the keyboard inset never cover the focused element |
| 2.5.7 Dragging movements | Every drag has a single-tap alternative: the drag helpers' keyboard handle and the probe drawer's close button |
| 2.5.8 Target size | At least 24 × 24 px on web; 44 × 44 pt on native via hit slop |
| 3.3.1 / 3.3.2 Errors and labels | Errors in text, tied to their fields, announced |
| 4.1.2 Name, role, value | Every probe control, checked with VoiceOver, TalkBack and the browser's accessibility tree |
| 4.1.3 Status messages | Form errors announced without moving focus |

- [ ] Tools: axe and Lighthouse (web), Xcode Accessibility Inspector (iOS), Accessibility Scanner (Android), plus the manual screen-reader passes from `docs/a11y-checks.md`.
- [ ] Known item to resolve here: phase 1 caps native font scaling at 1.5× (`text.max-scale`) for all text. That's too low for 1.4.4. Change it so body and heading text scale to at least 2× (or uncapped), and keep the 1.5× cap only for labels inside fixed-height controls (buttons, inputs, select triggers), whose fields grow instead of clipping. Re-run parity afterwards.
- [ ] Fix every "fail" before the release candidate. If budget allows, book an external audit of the RC and add its report next to the internal one.

**Done when:** the audit document has no open fails for any engine area on any platform. Commit: `a11y: wcag 2.2 aa audit and fixes`.

### Step 12 — Full quality sweep

- [ ] Parity: every fixture × 3 presets × 2 schemes × 4 platforms, plus motion-curve traces. Update baselines once, deliberately, and review the report image by image.
- [ ] Right-to-left: run the parity suite with `dir="rtl"` on web and `I18nManager.forceRTL(true)` on native, with Arabic text in the fixtures. Probe controls, icons with direction (chevrons, back arrows), drag axes and the probe drawer must mirror correctly.
- [ ] Large text: the probe form and the Motion lab at web 200% zoom and at the largest native text sizes; nothing clipped or overlapping.
- [ ] Tablets and landscape: the probe form and the Motion lab on an iPad simulator and an Android tablet emulator, in both orientations.
- [ ] Performance: re-run Flashlight and `perf-web`, and compare with `docs/performance.md`. No regressions beyond 5%.
- [ ] Bundle sizes: record gzipped size per entry point (each engine package, `@unison-ui/icons` with one icon imported, `styles.css`, `tokens.css`) in `docs/performance.md`, and add `size-limit` checks to CI at those numbers + 5%.

**Done when:** every check passes and the numbers are recorded. Commit: `chore: v1 quality sweep`.

## 6. v1.0 readiness

### Step 13 — API review and freeze

- [ ] Generate an API report per public package with API Extractor (`@microsoft/api-extractor`) and commit the `*.api.md` files. CI fails when the public API changes and the report wasn't updated, so every API change gets reviewed on purpose.
- [ ] Review the whole surface in one sitting, against this checklist:
  - Consistent names: `onValueChange`, `onCheckedChange`, `onOpenChange`, `onSnapChange`, `onPress`; sizes always `sm | md | lg`; `tone` and `intent` used the same way in style specs and tokens
  - Consistent defaults (for example overlays dismissible by default, `Presence` respecting reduced motion by default)
  - Nothing half-finished is public: move it behind `unstable_` or into `/internal`; the probes stay internal
  - Every public type has a doc comment (the API tables depend on them)
- [ ] Remove deprecated 0.x leftovers and write `MIGRATION.md` for 0.x → 1.0, with a CLI codemod for anything renamed (`unison migrate 1.0`).

**Done when:** the API reports are committed and reviewed, every public export has a doc comment, and the migration codemod upgrades the phase 4 demo apps without manual edits. Commit: `chore: api review and 1.0 migration`.

### Step 14 — Policies and project health

- [ ] `docs/versioning.md` with the v1.0 promise from section 0, and the deprecation policy: a deprecated prop logs one development warning and lives for at least one minor release.
- [ ] Support matrix enforced by CI: add a job that builds and tests the Expo demo on the **previous** Expo SDK too, and a browser matrix (Chromium, Firefox, WebKit) for the web parity suite.
- [ ] `SECURITY.md` (private reporting through GitHub Security Advisories, a response target such as 5 working days), `CODE_OF_CONDUCT.md` (Contributor Covenant), `GOVERNANCE.md` (who decides, how; honest about being a small team).
- [ ] Licence check: `license-checker` (or similar) in CI with an allowlist (MIT, Apache-2.0, ISC, BSD, and OFL for fonts); fail on anything else.
- [ ] Changelog quality: Changesets descriptions written for users (what changed and what to do), not commit messages.

**Done when:** all files exist, the previous-SDK and browser-matrix jobs are green, and the licence check passes. Commit: `chore: policies for 1.0`.

### Step 15 — Release candidate and dogfooding

- [ ] ADRs for this phase: Fumadocs; phone previews via EAS Update and Expo Go; the icons package; the theme builder running the real compiler; presets as starting points; the native text-scaling change from step 11; three-way merge for ejected code; third-party registry safety; the v1.0 promise.
- [ ] `pnpm changeset pre enter rc`, then release `1.0.0-rc.0`. Add a banner to the docs site pointing to it.
- [ ] Dogfood: build two small but real apps outside the monorepo using only the public docs — one Next.js web app and one Expo app. In each, theme the app with the builder and write two or three of your own components on the engine (at least one form control using the field engine and one overlay using `Presence`, the portal and the overlay stack), following the "Authoring components" guide. File every friction point as an issue labelled `rc-feedback`; anything that blocks real use is `rc-blocker`.
- [ ] Iterate with `rc.1`, `rc.2`, … for at least 2 weeks.
- [ ] Exit criteria: no open `rc-blocker` issues, and 7 consecutive days of use without a new blocker.

**Done when:** the exit criteria hold and the two dogfood apps run on the latest RC. Commit: (made by the Changesets bot for each RC).

## 7. Release and launch

### Step 16 — Release 1.0.0

- [ ] `pnpm changeset pre exit`, add a `major` changeset summarising 1.0 for every public package, and merge the "Version packages" PR.
- [ ] Verify after publishing:
  - `1.0.0` of every public package on npm, with provenance, tagged `latest`
  - Registry `r/1.0.0/` and `r/latest/` live
  - `eas update --channel docs` done for 1.0, so phone previews show 1.0
  - Docs site deployed with the RC banner removed and a versioned snapshot of the docs for 1.x
  - `cli-e2e.ts` passing against the published `1.0.0` for Next.js, Vite and Expo
- [ ] Tag the commit `v1.0.0` and create a GitHub Release with the highlights and links.

**Done when:** a machine that has never seen the repo can follow the docs' installation page for each framework and end up with a themed app in minutes. Commit: (made by the Changesets bot).

### Step 17 — Launch

- [ ] Landing page on the docs site's home: one sentence on what Unison is, a live tokens and motion showcase, a side-by-side "same code on web and phone" demo with the QR, the theme builder link, and the install command.
- [ ] Launch post (on your blog and cross-posted): the problem (one design system for web and native), the approach (shared tokens and style specs, platform renderers, motion-first), what's in the engine 1.0, and what's next (the components). Include a short screen recording of the Motion lab on web, iOS and Android.
- [ ] Announce where the audience is (X / Bluesky, Reddit r/reactjs and r/reactnative, Hacker News, the Expo and React Native communities), staggered over a few days, not all at once.
- [ ] Prepare for the first wave: issue templates and labels ready, a pinned "1.0 feedback" discussion, and a public roadmap of the first components to build on the engine.

**Done when:** the post is live, the landing page is up, and the feedback channels are ready. Commit: `docs: 1.0 launch`.

## 8. Final acceptance

### Step 18 — The v1.0 gate

Clone into a new folder and go through the list in order, without editing any file.

- [ ] `pnpm install`, `pnpm doctor`, `pnpm check`, `pnpm check:packages`, the API report check and the licence check pass
- [ ] `pnpm test:parity` passes for every fixture, all 3 presets × 2 schemes × 4 platforms, LTR and RTL, plus motion-curve traces
- [ ] The probe-form scenario (phase 3) and the drawer/overlay flows (phase 4) pass on all four platforms
- [ ] Performance budgets hold (Flashlight on the mid-range Android phone, `perf-web`, `size-limit`)
- [ ] `docs/accessibility/audit-1.0.md` has no open fails
- [ ] **The roadmap gate:** `1.0.0` is on npm with provenance for every public package, and the docs site is live at `<docs-domain>` with foundations and engine reference pages, live demos, phone previews and the theme builder
- [ ] `cli-e2e.ts` passes against `1.0.0` for all three frameworks; `diff`, `update`, `theme` and third-party `add` work as described
- [ ] The two dogfood apps run on `1.0.0`
- [ ] Every decision across phases 0–5 has an ADR

**When everything passes:** tag `v1.0.0` (done in step 16) and tick the Phase 5 gate in the roadmap tab. The Unison engine 1.0 is done. Components come next, built on this engine in the order of the component catalogue's tiers.
