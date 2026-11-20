# Phase 1 (Tokens & motion compiler): Implementation Plan

Nov 20, 2026 · source: [`docs/planning/todos/phase-1.md`](../planning/todos/phase-1.md) (the source of truth)

> **To execute:** use the `executing-plans` skill. Steps use `- [ ]` for tracking. Tasks are
> numbered after the todo's steps (Task 7 = todo step 7). Some steps are split into sub-tasks
> (10.1–10.2, 13.1–13.2, 19.1–19.3, 20.1–20.3, 21.1–21.3, 22a–22f). **A split step still gets exactly
> one commit**, made at the end of its last sub-task with the todo's commit message.
>
> This plan is a hypothesis about work not yet done. If a command's real output differs from the
> "Expect" line, stop and treat it as a finding (see `executing-plans`). Don't push past it.
> Where a task can't be written without an answer to an open question, it follows the todo
> literally and marks the step **⚠ OQ-n**. Stop at that marker if the question is still open.

**Goal:** one `unison.config.ts` per app defines a complete, accessible visual language (colour,
type, space, radius, elevation, motion) that compiles to CSS variables, Tailwind v4, a typed native
theme, Reanimated configs and `tokens.json`, and switches theme at runtime on every platform. No
components.

**Architecture:** the token source (DTCG JSON in `packages/tokens/tokens/{primitive,semantic}`)
is loaded, validated, merged with generated OKLCH colour primitives and the app's `defineTheme()`
layers, then resolved into one flat `Map<path, ResolvedToken>` per theme × scheme. Every output is
an emitter over those maps. `unison-tokens build --config` writes the outputs into an app's
`.unison/`; the package's own `dist/` ships the default theme. Runtime switching is two
attributes on web (`data-theme`, `data-unison-theme`) and a React context on native.

**Tech stack:** culori 4.0.2 (build-time colour maths), jiti 2.7.0 (TS config loading),
fast-check 4.10.3, Reanimated 4.7.1 (Expo SDK 58 pin), Tailwind 4.3.5, Uniwind 1.14.0, the phase 0
stack otherwise. No Style Dictionary (see "Current versions").

---

## Open questions

Answer these before you execute the tasks they block. OQ-1 to OQ-3 come from computing the todo's
OKLCH values with culori 4.0.2 (`toGamut("rgb", "oklch")`, `wcagContrast`); the numbers are in
"Contrast check results" below. **No spec value has been changed in this plan.**

**OQ-1: Four of the seven accent presets fail AA, including `teal`, which the phase 1 gate uses**
(blocks Task 6's preset test, Task 17, Task 25's gate).
With the step 4 lightness table and the step 5 aliases:

| Preset | Fails | Ratio | Needed |
| --- | --- | --- | --- |
| `violet` (295, 0.21) | dark `accent` on `surface` (`#7448c8` on `#181819`) | 2.96 | 3.0 |
| `teal` (185, 0.13) | light `ring` on `surface` (`#00ab9d` on `#ffffff`) | 2.87 | 3.0 |
| `green` (150, 0.17) | light `ring` on `surface` (`#24ae56` on `#ffffff`) | 2.89 | 3.0 |
| `rose` (10, 0.21) | dark `accent` on `surface` (`#bb2050` on `#191818`) | 2.90 | 3.0 |

`indigo`, `blue` and `orange` pass. `autoContrast` can't rescue any of these: it only moves
`on-*` / `*-fg` foregrounds, and `ring` and `accent` are neither. So the gate step "change
`accent` to `"teal"` and each surface updates" ends in a failed build.
A hue sweep (0–355 in steps of 5, chroma 0.10/0.15/0.20/0.25) fails 148 of 288 combinations.
Options:
- (a) **Recommended.** Two spec changes: light `ring` → `accent.600` (instead of `.500`), and dark
  step `500` lightness 0.52 → **0.54**. With both, every preset, both seeds below and the whole
  sweep pass; the default theme still needs no auto-adjustment. Cost: in light mode `ring` and
  `accent` become the same colour.
- (b) Only change light `ring` → `accent.600`. Fixes teal and green; violet, rose and the brand
  seed still fail in dark (59 of 288 sweep combinations).
- (c) Allow `autoContrast` to also nudge `ring`, `accent` and `border-strong`. This breaks the
  todo's rule that autoContrast never touches backgrounds (`accent` is the background for
  `on-accent`).
- (d) Keep the values and change the gate to an accent that passes (`blue` or `orange`).

**OQ-2: The demo `brand` theme (`#e11d48`, step 18) fails in dark** (blocks Task 18 and
everything after it). Dark `accent` on `surface` is `#c1133b` on `#191818` = **2.89:1** (needs
3.0), anchored or not. It's the same failure as `rose`; option (a) in OQ-1 fixes it (3.0+).
Otherwise you'd need another brand colour.

**OQ-3: The yellow accent can't produce the auto-contrast warning that step 6's Done-when
expects** (blocks Task 6's Done-when, Task 22b, Task 25).
`defineTheme({ accent: "#facc15" })` passes **every** pair with no adjustment: the `accent`
slot is step 600 (L 0.54), not the seed, so white on it is `#ffffff` on `#8a6a00` = 5.07 (light)
and `#ffffff` on `#836500` = 5.49 (dark). So "passes with a printed warning for `on-accent`" and
"with `autoContrast: false` the same theme fails" can't both hold. Searching the seed space,
`on-accent` only fails when the seed is anchored onto step 600 with high luminance. A seed
where *only* auto-fixable pairs fail is **`#3d846d`** (L 0.561, hue 170, chroma 0.081): white on it is
4.45 (light; with OQ-1 option (a) also dark), and every other pair passes. (`#3a8d25` fails
`on-accent` too, but also light `ring` at 2.94, which autoContrast can't fix.) Options:
- (a) **Recommended.** Keep `#facc15` in the gate as "builds, `on-accent` legible" (it is: 5.07).
  Use `#3d846d` for the warning and `autoContrast: false` checks in Task 6 and Task 22.
- (b) Keep the Done-when as written. Then it can't pass.
- (c) Put the seed at the `accent` slot (anchor to step 600 always). That's a generator change.

**OQ-4: `autoContrast` can't move white** (blocks Task 6, Task 22a).
"Nudge the foreground's lightness away from the background" means *lighter* for white on a
mid-tone fill, and white is already L = 1. As written, every `on-*` rescue loops forever, and
step 22's "always terminates within 100 iterations" fails. Recommended rule: step 0.01 away from
the background; on reaching L = 0 or 1 without passing, jump to the opposite pole (black ↔ white)
and step back towards the background until the pair passes. Stop after 100 steps and fail
with the pair. For `#3d846d`, black on it is 4.72:1, so it's rescued on the first flip.

**OQ-5: An auto-adjusted foreground is a raw value, which step 3's tier lint forbids**
(blocks Task 6). The adjusted `on-accent` is no longer an alias. Recommended: the adjustment is
applied after the tier lint, as a generated semantic override marked
`"$extensions": { "dev.unison": { "raw": true, "autoContrast": true } }`. CSS emits it as a
literal; `tokens.json` records the original alias and the adjustment.

**OQ-6: The phase 0 spring simulator isn't accurate enough for step 12's test** (blocks Task 12).
`simulateSpring` uses semi-implicit Euler at 1/240 s. Compared with the analytic damped-spring
solution at t = 50, 100, 200, 300 and 500 ms, its largest error is 0.029 (snappy), 0.022 (smooth)
and 0.029 (bouncy). The tolerance is 0.005. Recommended: switch the integrator to RK4 at the same
step, which gives a largest error of 3 × 10⁻⁷. That changes the phase 0 `linear()` strings and
their snapshot. Alternative: evaluate the analytic solution directly.

**OQ-7: The native theme can't hold both `color.accent` and `color.accent.600`** (blocks Task 16).
Step 5 names semantic `color.accent`, `color.success`, … and step 4 names primitives
`color.accent.600`, `color.success.600`, …. In a nested object `theme.color.accent` can't be a
string and an object at once. (The CSS names `--unison-color-accent` / `--unison-color-accent-600`
don't collide.) Step 16 also nests durations, easings, springs and presets under `motion`, where
`duration.200` (primitive) and `motion.duration.fast.enter` (semantic) would share
`motion.duration`. Recommended: groups follow the todo's list, and each group is **flat**, keyed
by the rest of the path joined with `-`. So you get `color["accent-600"]`, `color.accent`,
`motion.duration["fast-enter"]` and `motion.duration["200"]`. The mapping lives in one exported
function, `nativeKey(path)` (table in Task 16), and the native `token()` uses it.

**OQ-8: The step 14 selectors don't scope `light` or same-element theme + scheme** (blocks Task 14
and Task 19.1).
- `:root, [data-unison-theme="default"]` doesn't match an element with only
  `data-theme="light"`, so a light subtree inside a dark page stays dark.
- `[data-theme="dark"] [data-unison-theme="brand"]` is a descendant selector. `ThemeScope`
  (step 19) puts both attributes on **one** `div`, so the brand-dark panel gets brand-light.

Recommended: add `[data-theme="light"]` to each theme's light selector list, and give each theme
the compound `[data-unison-theme="brand"][data-theme="dark"]` next to the descendant form.

**OQ-9: pnpm 12 doesn't run `pre*` scripts** (blocks Task 18). I checked: with pnpm 12.21.0,
`pnpm run hello` doesn't run `prehello`, even with `enablePrePostScripts: true` in
`pnpm-workspace.yaml`. The todo's `prebuild` / `predev` would never run. Recommended: chain them
explicitly (`"build": "pnpm tokens && next build"`, with
`"tokens": "unison-tokens build --config unison.config.ts --out .unison"`). Also run
`pnpm tokens` before `typecheck`, because `.unison/` is gitignored.

**OQ-10: Which 12 colours go into the `swatches` fixture, and the ΔE tolerance** (blocks Task 21.2).
The web emits the *unmapped* `oklch()`. If Chromium/WebKit clip it per channel instead of
gamut-mapping (to verify in Task 21.3), some semantic colours differ from native's hex by more
than ΔE2000 3: light `warning-fg` (warning.700) 3.55, light `<status>-border` danger.300 3.98,
dark `warning-border` (warning.400) 5.26. Recommended set, all within 2.0:
`canvas, surface, surface-raised, subtle, muted, fg, fg-muted, border-strong, accent,
accent-subtle, success, danger`. Alternative: emit `oklch()` from the *mapped* colour, which
changes step 4's rule.

**OQ-11: Box migration and baseline churn** (blocks Task 9, Task 14, Task 16).
- Box also uses `radius.md`, a primitive. That's a type error after step 16 too, and its value
  changes from 8 to **6** in step 9. Recommended: point `boxStyles.radius` at `radius.card`
  (8 px with the default `radius: "md"`), so the Box keeps its shape.
- Box colours change at Task 14, when the new semantic aliases reach the CSS
  (`accent` `#5b5bd6` → `#535cda`, dark `surface` `#111113` → `#18181a`). So web baselines need
  `--update` at Task 14, and native baselines at the first native run (CI's `workflow_dispatch`
  with `update_baselines`, or a Mac). Recommended: update them in the task that changes the
  colour, with "intended visual change" in the commit body. Step 16's "baselines stay valid"
  then only holds for layout metrics.

**OQ-12: Reanimated version** (blocks Task 13.2). `react-native-reanimated@latest` is **4.8.0**
(peers `react-native 0.87 - 0.89`, `react-native-worklets 0.14.x`). Expo SDK 58 pins **4.7.1**
with worklets 0.13.0, and `apps/mobile` uses 4.7.1. Recommended: add it to `@unison-ui/motion` as an
optional peer `"react-native-reanimated": ">=4.7.1 <5"`, with the dev dependency `4.7.1` (Expo's
pin), not `@latest`.

**OQ-13: Where APCA comes from** (blocks Task 6). culori 4.0.2 has `wcagContrast` but no APCA.
`apca-w3` (0.1.9, last published 2022) uses the "Limited W3 License". `colorjs.io` (0.7.1, MIT)
has `contrastAPCA`. Recommended: `colorjs.io` as a dependency of the tokens package (build-time
only, like culori).

**OQ-14: Devices and accounts** (blocks the native halves of Tasks 8, 10.2, 13.2, 15, 19.2, 20.3,
21.3, and Tasks 24 and 25). This container has no macOS, simulators or emulator, and no npm or
GitHub-org access. Recommended: the phase 0 rule (OQ-17 there). Do everything possible here, mark
each device check "unverified, needs Mark", and continue. Native parity can run in CI's native
jobs if you OK labelling the PR `native`.

**OQ-15: Branches** (blocks starting). The todo says a branch per section (`phase1/colour`, …).
This session is set to develop on `feat/awesome-pasteur-5rjenv`, and CLAUDE.md asks for
`feat/`-style prefixes. Phase 0 used one branch. Recommended: one branch for the phase, one
commit per todo step.

**OQ-16: Values the todo doesn't give** (blocks the named tasks; the plan uses these defaults):

| What | Default in this plan | Task |
| --- | --- | --- |
| `motion.enter` / `motion.exit` / `motion.emphasis` | `{ duration: motion.duration.base.enter, easing: easing.enter }` / `{ duration: motion.duration.base.exit, easing: easing.exit }` / `{ spring: spring.snappy }` | 11 |
| Semantic names for border width, ring offset, opacity | `border-width.default` → `border-width.1`, `border-width.ring` → `border-width.2`, `ring-offset.default` → `ring-offset.2`, `opacity.disabled` → `opacity.50` (primitive 0.5) | 9 |
| Preset token paths | `motion.preset.<name>` (`motion.preset.scale-in`) | 13.1 |
| `size.demo-box` target | `{space.24}` (96 px; `size.json` has no 96 px token) | 16 |
| Duration source form | `"200ms"` or `{ "value": 200, "unit": "ms" }`, normalised to the object form like dimensions | 1 |
| Anchor in dark mode | The seed replaces the closest-lightness step in **each** mode's ramp | 4 |
| `oklch()` precision | `oklch(L C H)` with L to 3, C to 4 and H to 2 decimals | 4 |

**OQ-17: Space, z-index and breakpoints are primitives only** (blocks nothing in phase 1). After
step 16, `token(theme, "space.4")` is a type error, so components (phase 2+) have no typed path to
spacing. Phase 1 has no components; flagging it for phase 2's `defineStyles` design.

**OQ-18: The contract tests assume identical exports and return types** (blocks Task 19.1 and
Task 22e). The phase 0 `ui` contract test requires web and native to export the same names. Step 19
adds web-only (`ThemeScript`, `themeScript`, `ThemeProvider`) and native-only (`UnisonProvider`)
exports, and native `useTheme()` returns an extra `tokens` key, while step 22 says the
return types are "identical". Recommended: explicit platform-only allowlists in the contract
test. `useTheme()` compares equal after `Omit<…, "tokens">`, and the test asserts that `tokens` is
the only extra key.

**OQ-19: Uniwind and named or scoped themes** (blocks the native half of Tasks 15, 19.2 and
19.3). Phase 0 only used Uniwind's `light` / `dark` variants. This plan assumes Uniwind can
register extra themes (`brand-light`, `brand-dark`) and switch them with `Uniwind.setTheme()`, but
I haven't verified that API. A theme that's global can't follow a nested `ThemeScope` either,
so the native scoped panel uses `useTheme().tokens` styles instead of `className`. Verify on
device in Task 15. If named themes aren't supported, the fallback is: native `className` follows
the scheme only, and theme-dependent native styling comes from `useTheme().tokens`. Record the
outcome in ADR 0005.

---

## Contrast check results

The todo's OKLCH values computed with culori 4.0.2 (`toGamut("rgb", "oklch")` → `formatHex`,
WCAG 2 ratio from the hex). Gray = hue 275, chroma 0.012. Computed while writing this plan
(the script isn't committed; Task 4 pins the hex values and Task 6 pins the tightest ratios).

**Default theme (indigo): passes every pair with no adjustment.**

| Pair (min) | Light | Dark |
| --- | --- | --- |
| `fg` on `canvas` / `surface` / `surface-raised` / `subtle` (4.5) | 15.40 / 16.06 / 16.06 / 14.59 | 17.11 / 15.84 / 13.88 / 13.88 |
| `fg-muted` on the same four (4.5) | 6.28 / 6.55 / 6.55 / 5.95 | 7.15 / 6.62 / 5.80 / 5.80 |
| `fg-subtle` on `surface` (3.0) | **3.10** | 4.49 |
| `on-accent` on `accent` / `-hover` / `-active` (4.5) | 5.37 / 6.91 / 9.61 | 5.80 / 9.77 / 13.20 |
| `accent-fg` on `accent-subtle` (4.5) | 6.20 | 11.49 |
| `success-fg` / `warning-fg` / `danger-fg` / `info-fg` on `-subtle` (4.5) | 5.56 / 5.95 / 6.21 / 5.73 | 11.56 / 11.48 / 11.19 / 11.43 |
| `on-success` / `on-warning` / `on-danger` / `on-info` (4.5) | **4.65** / 10.12 / 5.58 / 4.90 | 5.08 / 7.69 / 6.05 / 5.35 |
| `border-strong` / `ring` / `accent` on `surface` (3.0) | **3.10** / 3.33 / 5.37 | 3.23 / 4.29 / **3.06** |

Bold = within 0.15 of the minimum; a rounding change in the generator could flip it. Task 6
adds a regression test that pins these.

Key hex values (light / dark): gray.50 `#fafafb` / `#0f0f10`, gray.100 `#f3f4f6` / `#18181a`,
gray.500 `#90929a` / `#67696f`, gray.950 `#212124` / `#f1f2f5`; accent.500 `#7281ff` /
`#4f58ce`, accent.600 `#535cda` / `#6572e4`.

Other themes: see OQ-1 (presets), OQ-2 (brand) and OQ-3 (yellow). Neutral presets `neutral`,
`slate` and `warm` with indigo all pass.

---

## Current versions (looked up Nov 20, 2026)

Sources: `npm view <pkg> version` / `peerDependencies`, and `expo@58.0.26`'s
`bundledNativeModules.json`.

| What | Version | Note |
| --- | --- | --- |
| `culori` / `@types/culori` | **4.0.2** / **4.0.1** | Has `toGamut`, `clampRgb`, `inGamut`, `wcagContrast`, `differenceCiede2000`; no APCA |
| Style Dictionary | 5.8.0 | **Not used.** The todo specifies Unison's own validator, resolver and emitters (phase 0 already has its own compiler). |
| `react-native-reanimated` | latest **4.8.0**; Expo SDK 58 pin **4.7.1** | OQ-12 |
| `react-native-worklets` | latest 0.14.0; Expo pin 0.13.0 | |
| `jiti` | 2.7.0 | Loads `unison.config.ts` |
| `fast-check` | 4.10.3 | Task 22a |
| `concurrently` | 10.0.7 | App `dev` scripts (Task 18) |
| `@fontsource-variable/inter` / `@fontsource-variable/jetbrains-mono` | 5.3.0 / 5.3.0 | Families "Inter Variable", "JetBrains Mono Variable" |
| `@expo-google-fonts/inter` / `@expo-google-fonts/jetbrains-mono` | 0.4.2 / 0.4.1 | Installed with `npx expo install` |
| `expo-font` / `expo-splash-screen` | ~58.0.12 / ~58.0.14 | Already in `apps/mobile` |
| `@react-native-async-storage/async-storage` | 2.2.0 (Expo pin) | Demo storage adapter (Task 19.3) |
| `colorjs.io` | 0.7.1 (MIT) | APCA, OQ-13 |
| `ajv` | 8.20.0 | Validates `tokens.json` against its JSON Schema in tests |
| `tailwindcss` / `uniwind` | 4.3.5 / 1.14.0 | |

Install with `@latest` (or `npx expo install` for Expo-pinned packages), as in phase 0. The table
records what that resolves to today.

---

## Global constraints

- Phase 1 only. No components; `Box` and `MotionBadge` stay placeholders.
- Keep the todo's step order. One commit per todo step, with the todo's commit message exactly.
  Step 24's commit is made by the Changesets bot.
- Conventional Commits. No `Co-Authored-By` or other tool attribution anywhere. Author and
  committer: `m-de-graaff` / `214983662+m-de-graaff@users.noreply.github.com` (check
  `git config user.name` / `user.email` before the first commit).
- Branch names never start with `claude/` (scheme: OQ-15).
- Dependencies at `@latest`, except Expo-pinned ones (`npx expo install`). Never hand-type
  versions, except Reanimated (OQ-12).
- `culori` and `colorjs.io` run only inside the compiler. They are never imported from a file that
  ships to browsers or Metro (`src/spring.ts`, `src/paths.ts`, the generated outputs).
- Import boundaries as in CLAUDE.md. `tokens`, `core`, `motion/src/shared` are typechecked without
  the DOM lib.
- CSS variable names: `--unison-<path, dots → dashes>` (`cssVarName`).
- Web theming attributes: `data-theme` (`light` | `dark`) and `data-unison-theme` (name,
  `default` when absent), on `<html>` or any element.
- Theme names: `/^[a-z0-9-]+$/`; `default` is reserved for the base theme.
- Output is deterministic: the same input gives byte-identical files (sorted by path).
- Budget: default-theme `tokens.css` under 8 KB gzipped.
- Contrast: WCAG 2 AA enforced (4.5 text, 3.0 UI and large text); APCA is informational only.
- A component may only reference semantic tokens, enforced by types from Task 16.
- Fixed ports from phase 0: Next.js 3000, Vite 5173, Metro 8081, parity collector 4545.

## Human-only actions (the executor can't do these)

| Task | Action |
| --- | --- |
| 8, 10.2, 13.2, 15, 19.2, 20.3, 21.3 | Run on the iOS Simulator and the Android emulator (macOS), or OK the CI native jobs (OQ-14) |
| 21.3, 22f | Native baselines (`--update`) on a Mac or through CI's `update_baselines` |
| 24 | Label the PR `snapshot`; test it in two fresh apps outside the repo; merge the "Version packages" PR (publishes to npm) |
| 25 | Clean-clone acceptance on macOS with both simulators; tag `phase-1-complete` and push it; tick the roadmap gate |

---

## File map

| Path | Responsibility | Task |
| --- | --- | --- |
| `packages/tokens/tokens/primitive/*.json` | Hand-written primitives | 1, 7, 9, 10.1, 11, 12 |
| `packages/tokens/tokens/semantic/*.json` | Aliases: colour, text, shape, elevation, motion | 1, 5, 7, 9, 10.1, 11, 13.1, 16 |
| `packages/tokens/src/schema.ts` | `TokenType`, value types, `SourceToken` | 1 |
| `packages/tokens/src/validate.ts` | Per-type validation and normalisation, all errors collected | 1 |
| `packages/tokens/src/load.ts` | Reads the source folders into layers (replaces `read.ts`) | 1 |
| `packages/tokens/src/resolve.ts` | Aliases, cycles, type checks, layering | 2 |
| `packages/tokens/src/lint-tiers.ts` | Tier rules | 3 |
| `packages/tokens/src/color/{generate-scale,palettes}.ts` | OKLCH scales, built-in palettes, seeds | 4 |
| `packages/tokens/src/color/{contrast,contrast-pairs,auto-contrast}.ts` | WCAG + APCA, the pair list, autoContrast | 6 |
| `packages/tokens/src/spring.ts` | Spring simulator and `linear()` (browser-safe) | 12 |
| `packages/tokens/src/motion/presets.ts` | Preset expansion (enter/exit/reduced, feel) | 13.1 |
| `packages/tokens/src/paths.ts` | `cssVarName`, `nativeKey` (browser-safe) | 14, 16 |
| `packages/tokens/src/build.ts` | The pipeline: config → layers → resolved maps → contrast | 1–6, 17, 18 |
| `packages/tokens/src/emit-web.ts` | `tokens.css` | 14 |
| `packages/tokens/src/emit-tailwind.ts` | `theme.css`, `theme-strict.css`, native `theme.css` | 15 |
| `packages/tokens/src/emit-native.ts` | `native/theme.js` + `.d.ts` | 7, 10.1, 13.1, 16 |
| `packages/tokens/src/emit-types.ts`, `emit-json.ts`, `schema/tokens.schema.json` | `types.d.ts`, `tokens.json` and its schema | 16 |
| `packages/tokens/src/config.ts` | `defineTheme`, `defineConfig`, validation, suggestions | 17, 18 |
| `packages/tokens/src/bin.ts` | `unison-tokens build [--config] [--out] [--watch]` | 17 |
| `packages/core/src/concentric.ts` | `concentric()` | 9 |
| `packages/motion/src/{shared,web,native}/*` | `toWaapi`, `toReanimated`, reduced-motion selection | 13.2 |
| `packages/react/src/{css-var,theme-script,theme-provider,theme-scope}.tsx` | Web runtime theming | 16, 19.1 |
| `packages/native/src/{theme,provider,theme-scope}.tsx` | Native runtime theming | 16, 19.2 |
| `packages/demo-content/src/{showcase-data,settings}.ts` | Showcase data, settings shared by apps | 20.1 |
| `apps/*/unison.config.ts`, `apps/*/.unison/` (ignored) | App theme config and generated output | 18 |
| `apps/*` routes `/tokens`, settings bar, fonts | Showcase, switching, fonts | 8, 19.3, 20.2, 20.3 |
| `packages/parity/src/fixtures/*`, `scripts/compare.ts`, registry entries | Token fixtures, theme dimension, colour sampler | 21 |
| `tooling/scripts/docs-tokens.ts`, `docs/{tokens,theming,tailwind,motion,fonts}.md` | Docs | 8, 15, 23 |
| `docs/adr/0012`–`0019` | Phase 1 decisions | 23 |
| `.changeset/*.md` | Release notes for 0.1.0 | 24 |

---

# Section 1: Schema, aliases and tiers

### Task 1: Token source layout and schema (todo step 1, plus the prerequisites)

**Files:**
- Delete: `packages/tokens/tokens/base.json`, `packages/tokens/tokens/dark.json`, `packages/tokens/src/read.ts`, `packages/tokens/test/read.test.ts`
- Create: `packages/tokens/tokens/primitive/{space,size,radius,border,font,shadow,motion,layer}.json`
- Create: `packages/tokens/tokens/semantic/{color.light,color.dark,text,shape,elevation,motion}.json`
- Create: `packages/tokens/src/schema.ts`, `src/validate.ts`, `src/load.ts`, `src/build.ts`
- Modify: `packages/tokens/src/index.ts`, `src/emit-web.ts`, `src/emit-native.ts`, `src/contrast.ts` (import `Token` from `./build` instead of `./read`)
- Modify: `packages/tokens/test/fixtures/low-contrast/tokens/*` (move to the new layout)
- Test: `packages/tokens/test/validate.test.ts`, `test/fixtures/three-errors/tokens/**`

**Interfaces:**
- Produces:
  - `type TokenType = "color" | "dimension" | "duration" | "number" | "fontFamily" | "fontWeight" | "cubicBezier" | "typography" | "shadow" | "transition" | "spring" | "motionPreset"`
  - `type Tier = "primitive" | "semantic"`
  - `interface Dimension { value: number; unit: "px" | "rem" }`, `interface Duration { value: number; unit: "ms" }`
  - `interface ColorValue { hex: string /* lowercase #rrggbb or #rrggbbaa */; oklch?: string }`
  - `interface ShadowLayer { x: Dimension; y: Dimension; blur: Dimension; spread: Dimension; color: ColorValue; inset?: boolean }`
  - `interface Typography { fontFamily: string[]; fontWeight: number; fontSize: Dimension; lineHeight: Dimension; letterSpacing: { value: number; unit: "em" | "px" } }`
  - `type Transition = { duration: Duration; easing: CubicBezier } | { spring: SpringConfig }`, `type CubicBezier = [number, number, number, number]`
  - `interface SourceToken { path: string; type: TokenType; value: unknown; file: string; tier: Tier; description?: string; raw?: boolean }` (`value` is normalised; it may still contain alias strings like `"{color.gray.900}"`)
  - `interface ValidationError { file: string; path: string; message: string }`; formatted `` `${file} › ${path}: ${message}` ``
  - `validateFile(file: string, tier: Tier, tree: unknown): { tokens: SourceToken[]; errors: ValidationError[] }`
  - `class TokenValidationError extends Error { errors: ValidationError[] }`
  - `interface SourceLayers { primitive: SourceToken[]; semantic: SourceToken[]; light: SourceToken[]; dark: SourceToken[] }` in `schema.ts` (`light` / `dark` are `color.light.json` / `color.dark.json`; `semantic` is the other semantic files)
  - `loadSource(root: string): SourceLayers` (throws one `TokenValidationError` with every error from every file)

- [ ] **Step 0: Prerequisites and the user check**

Run: `git config user.name; git config user.email` → set them to `m-de-graaff` /
`214983662+m-de-graaff@users.noreply.github.com` if they differ.
Run: `pnpm install && pnpm check`
Expect: passes (phase 0 baseline). If not, stop: phase 0 isn't green.
Run: `pnpm --filter @unison-ui/tokens add culori && pnpm --filter @unison-ui/tokens add -D @types/culori`
Expect: `culori ^4.0.2` in `dependencies`, `@types/culori ^4.0.1` in `devDependencies`.

- [ ] **Step 1: Write the failing tests**

`packages/tokens/test/validate.test.ts`:

```ts
import { join } from "node:path";
import { expect, it } from "vitest";
import { loadSource, TokenValidationError } from "../src/load";
import { validateFile } from "../src/validate";

const file = "tokens/primitive/space.json";

it("rejects an em dimension with file, path and the allowed units", () => {
  const { errors } = validateFile(file, "primitive", {
    space: { "2": { $type: "dimension", $value: "8em" } },
  });
  expect(errors.map((e) => `${e.file} › ${e.path}: ${e.message}`)).toEqual([
    'tokens/primitive/space.json › space.2: unit "em" not allowed (px, rem)',
  ]);
});

it("normalises both dimension forms to the object form", () => {
  const { tokens, errors } = validateFile(file, "primitive", {
    space: {
      $type: "dimension",
      "1": { $value: "4px" },
      "2": { $value: { value: 0.5, unit: "rem" } },
    },
  });
  expect(errors).toEqual([]);
  expect(tokens.map((t) => t.value)).toEqual([
    { value: 4, unit: "px" },
    { value: 0.5, unit: "rem" },
  ]);
});

it("keeps aliases unresolved, including inside composites", () => {
  const { tokens, errors } = validateFile("tokens/semantic/text.json", "semantic", {
    text: {
      body: {
        $type: "typography",
        $value: {
          fontFamily: "{font-family.sans}",
          fontWeight: "{font-weight.regular}",
          fontSize: "16px",
          lineHeight: "24px",
          letterSpacing: "-0.011em",
        },
      },
    },
  });
  expect(errors).toEqual([]);
  expect(tokens[0]?.value).toMatchObject({ fontFamily: "{font-family.sans}" });
});

it("reports every error in a file, not just the first", () => {
  expect(() => loadSource(join(import.meta.dirname, "fixtures/three-errors"))).toThrow(
    TokenValidationError,
  );
  try {
    loadSource(join(import.meta.dirname, "fixtures/three-errors"));
  } catch (e) {
    expect((e as TokenValidationError).errors).toHaveLength(3);
    expect((e as Error).message).toBe(
      [
        "3 token errors:",
        '  tokens/primitive/space.json › space.1: unit "em" not allowed (px, rem)',
        '  tokens/primitive/space.json › space.2: expected dimension, got "big"',
        '  tokens/primitive/space.json › space.3: unknown $type "size"',
      ].join("\n"),
    );
  }
});

it("marks the tier by folder and reads the raw extension", () => {
  const { tokens } = validateFile("tokens/semantic/color.light.json", "semantic", {
    color: {
      overlay: {
        $type: "color",
        $value: "#00000080",
        $extensions: { "dev.unison": { raw: true } },
      },
    },
  });
  expect(tokens[0]).toMatchObject({ tier: "semantic", raw: true, value: { hex: "#00000080" } });
});
```

Fixture `packages/tokens/test/fixtures/three-errors/tokens/primitive/space.json`:

```json
{
  "space": {
    "1": { "$type": "dimension", "$value": "8em" },
    "2": { "$type": "dimension", "$value": "big" },
    "3": { "$type": "size", "$value": "8px" }
  }
}
```

(and an empty `tokens/semantic/color.light.json` / `color.dark.json` with `{}` so `loadSource`
finds both folders).

- [ ] **Step 2: Run them, confirm they fail**

Run: `pnpm --filter @unison-ui/tokens exec vitest run test/validate.test.ts`
Expect: FAIL, `Failed to resolve import "../src/load"`.

- [ ] **Step 3: Implement `schema.ts`, `validate.ts`, `load.ts`**

`src/schema.ts`: the types listed under Interfaces, plus

```ts
export const TOKEN_TYPES = [
  "color", "dimension", "duration", "number", "fontFamily", "fontWeight", "cubicBezier",
  "typography", "shadow", "transition", "spring", "motionPreset",
] as const;
export const ALIAS = /^\{([a-z0-9.-]+)\}$/;
export const isAlias = (v: unknown): v is string => typeof v === "string" && ALIAS.test(v);
```

`src/validate.ts`: walks the tree like phase 0's `flatten` (group `$type` inheritance, `$`-keys
skipped), and per token calls `normalise(type, value)`, which returns
`{ ok: true, value } | { ok: false, message }`. **Aliases pass through unchanged at any level**
(a whole `$value`, or a field of a composite). Messages, exactly:

| Input | Message |
| --- | --- |
| unknown `$type` | `unknown $type "<type>"` |
| dimension with a unit other than px/rem (`"8em"`, `{value: 8, unit: "em"}`) | `unit "<unit>" not allowed (px, rem)` |
| any other malformed value | `expected <type>, got <JSON of value>` |
| composite field malformed | `<field>: expected <type>, got <JSON>` |

Normalisation rules: dimension `"8px"` → `{ value: 8, unit: "px" }`; duration `"200ms"` →
`{ value: 200, unit: "ms" }` (OQ-16); color `#rgb` / `#rrggbb` / `#rrggbbaa` → `{ hex }`
lowercased and expanded to 6 or 8 digits; fontFamily string → split on commas outside quotes,
trimmed, quotes removed (`'"Inter Variable", Inter'` → `["Inter Variable", "Inter"]`);
fontWeight a number 1–1000; cubicBezier four numbers with x1, x2 in [0, 1]; spring positive
`stiffness`, `damping`, `mass`; shadow an object or array of layers (always normalised to an
array); transition `{ duration, easing }` or `{ spring }`; motionPreset validated in Task 13.1
(until then: any object). `raw` comes from `$extensions["dev.unison"].raw === true`;
`description` from `$description`.

`src/load.ts`:

```ts
export class TokenValidationError extends Error {
  constructor(readonly errors: ValidationError[]) {
    const n = errors.length;
    super([`${n} token error${n === 1 ? "" : "s"}:`,
      ...errors.map((e) => `  ${e.file} › ${e.path}: ${e.message}`)].join("\n"));
  }
}

/** Reads <root>/tokens/{primitive,semantic}/*.json, sorted by file name. */
export function loadSource(root: string): SourceLayers
```

File names in errors are relative to `root`, with `/` separators
(`tokens/primitive/space.json`). `color.light.json` goes to `light`, `color.dark.json` to `dark`,
the other semantic files to `semantic`.

- [ ] **Step 4: Move the phase 0 tokens into the new layout**

Same values as phase 0, so every output and the parity baselines stay unchanged:

- `primitive/space.json`: `space.1` 4px, `space.2` 8px, `space.4` 16px
- `primitive/radius.json`: `radius.md` 8px (Task 9 rewrites this file)
- `primitive/size.json`: `size.box` 96px (migrated in Task 16)
- `primitive/motion.json`: `motion.duration.base` 200ms, `motion.spring.snappy` (as phase 0; Tasks 11–13 move these)
- `semantic/color.light.json`: `color.accent #5b5bd6`, `surface #ffffff`, `fg #111113`, `border #e4e4e7`
- `semantic/color.dark.json`: `color.surface #111113`, `fg #ededef`, `border #2e2e32`, and
  `accent #5b5bd6` (step 3's rule: every semantic colour in both files)
- every other file in the tree from the todo: `{}`

The colour values are temporarily raw. Task 3 marks them `raw` and Task 5 replaces them.

- [ ] **Step 5: Keep the compiler working on the new loader**

`src/build.ts` (grows in later tasks):

```ts
export interface Token { path: string; type: "color" | "dimension" | "duration" | "spring"; value: string | SpringConfig }
export interface TokenSets { light: Token[]; dark: Token[]; darkOverrides: Token[] }

/** Phase 0 emitters still take string values; this adapter goes away in Tasks 14 and 16. */
export function toLegacy(tokens: SourceToken[]): Token[]
export function legacySets(root: string): TokenSets // light = primitive + semantic + light; dark = same with dark merged over light
```

`toLegacy` turns `{ value: 8, unit: "px" }` back into `"8px"`, `{ value: 200, unit: "ms" }` into
`"200ms"` and `{ hex }` into the hex string. `compile()` in `index.ts` calls `legacySets(cwd)`
instead of `readTokens(cwd)`. Move the `low-contrast` fixture to
`fixtures/low-contrast/tokens/{primitive/*.json, semantic/color.light.json, semantic/color.dark.json}`.

- [ ] **Step 6: Run the tests, confirm they pass**

Run: `pnpm --filter @unison-ui/tokens test`
Expect: PASS, including the unchanged `compile.test.ts` snapshot (the outputs are identical).

Run: `pnpm check`
Expect: passes.

- [ ] **Step 7: Done-when check**

Run: `pnpm --filter @unison-ui/tokens exec vitest run test/validate.test.ts -t "em dimension|every error"`
Expect: 2 passed, and the asserted messages are exactly the todo's
`tokens/primitive/space.json › space.2: unit "em" not allowed (px, rem)` and three reported errors.

- [ ] **Step 8: Commit** `feat(tokens): source layout and schema validation`

---

### Task 2: Aliases and the resolver (todo step 2)

**Files:**
- Create: `packages/tokens/src/resolve.ts`
- Modify: `packages/tokens/src/build.ts` (`legacySets` resolves through `resolve()`)
- Test: `packages/tokens/test/resolve.test.ts`

**Interfaces:**
- Consumes: `SourceToken`, `TokenType`, `isAlias`, `ALIAS` (Task 1)
- Produces:
  - `interface ResolvedToken extends Omit<SourceToken, "value"> { value: unknown /* no aliases left */; aliasOf?: string /* direct reference, e.g. "color.gray.900" */ }`
  - `type Resolved = Map<string, ResolvedToken>` (insertion order = sorted by path)
  - `resolve(base: SourceToken[], ...overrides: SourceToken[][]): Resolved`, later layers win per path
  - `class TokenResolveError extends Error` (message = the text below)

- [ ] **Step 1: Write the failing tests**

`packages/tokens/test/resolve.test.ts`:

```ts
import { expect, it } from "vitest";
import { resolve } from "../src/resolve";
import type { SourceToken } from "../src/schema";

const t = (path: string, type: SourceToken["type"], value: unknown, tier: SourceToken["tier"] = "primitive"): SourceToken =>
  ({ path, type, value, tier, file: "test.json" });

it("resolves a three-step chain and keeps the direct reference", () => {
  const map = resolve([
    t("color.gray.900", "color", { hex: "#111111" }),
    t("color.ink", "color", "{color.gray.900}"),
    t("color.text", "color", "{color.ink}"),
    t("color.fg", "color", "{color.text}", "semantic"),
  ]);
  expect(map.get("color.fg")).toMatchObject({ value: { hex: "#111111" }, aliasOf: "color.text" });
});

it("resolves an alias inside a composite", () => {
  const map = resolve([
    t("font-family.sans", "fontFamily", ["Inter"]),
    t("text.body", "typography", { fontFamily: "{font-family.sans}", fontWeight: 400,
      fontSize: { value: 16, unit: "px" }, lineHeight: { value: 24, unit: "px" },
      letterSpacing: { value: 0, unit: "em" } }, "semantic"),
  ]);
  expect(map.get("text.body")?.value).toMatchObject({ fontFamily: ["Inter"] });
});

it("prints the full cycle", () => {
  expect(() => resolve([t("a", "color", "{b}"), t("b", "color", "{c}"), t("c", "color", "{a}")]))
    .toThrow("alias cycle: a → b → c → a");
});

it("names the token and the missing path", () => {
  expect(() => resolve([t("color.fg", "color", "{color.grey.900}")]))
    .toThrow("color.fg: unknown reference {color.grey.900}");
});

it("rejects a type mismatch", () => {
  expect(() => resolve([t("space.4", "dimension", { value: 16, unit: "px" }), t("color.fg", "color", "{space.4}")]))
    .toThrow("color.fg: type mismatch, color aliases dimension space.4");
});

it("later layers win per path", () => {
  const map = resolve(
    [t("color.a", "color", { hex: "#000000" }), t("color.b", "color", "{color.a}")],
    [t("color.a", "color", { hex: "#ffffff" })],
  );
  expect(map.get("color.b")?.value).toEqual({ hex: "#ffffff" });
});
```

- [ ] **Step 2: Run, confirm it fails**

Run: `pnpm --filter @unison-ui/tokens exec vitest run test/resolve.test.ts`
Expect: FAIL, cannot resolve `../src/resolve`.

- [ ] **Step 3: Implement**

```ts
export function resolve(base: SourceToken[], ...overrides: SourceToken[][]): Resolved {
  const source = new Map<string, SourceToken>();
  for (const layer of [base, ...overrides]) for (const tok of layer) source.set(tok.path, tok);
  const done = new Map<string, ResolvedToken>();
  const stack: string[] = [];

  function refOf(v: string) { return (ALIAS.exec(v) as RegExpExecArray)[1] as string; }

  function deref(from: SourceToken, ref: string, expected?: TokenType): unknown {
    const target = source.get(ref);
    if (!target) throw new TokenResolveError(`${from.path}: unknown reference {${ref}}`);
    const resolved = visit(target);
    if (expected && resolved.type !== expected) {
      throw new TokenResolveError(`${from.path}: type mismatch, ${expected} aliases ${resolved.type} ${ref}`);
    }
    return resolved.value;
  }

  function deep(from: SourceToken, v: unknown): unknown {
    if (isAlias(v)) return deref(from, refOf(v));
    if (Array.isArray(v)) return v.map((x) => deep(from, x));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(from, x)]));
    return v;
  }

  function visit(tok: SourceToken): ResolvedToken {
    const hit = done.get(tok.path);
    if (hit) return hit;
    const at = stack.indexOf(tok.path);
    if (at >= 0) throw new TokenResolveError(`alias cycle: ${[...stack.slice(at), tok.path].join(" → ")}`);
    stack.push(tok.path);
    const whole = isAlias(tok.value);
    const value = whole ? deref(tok, refOf(tok.value as string), tok.type) : deep(tok, tok.value);
    stack.pop();
    const out: ResolvedToken = { ...tok, value, ...(whole ? { aliasOf: refOf(tok.value as string) } : {}) };
    done.set(tok.path, out);
    return out;
  }

  for (const path of [...source.keys()].sort()) visit(source.get(path) as SourceToken);
  return new Map([...done].sort(([a], [b]) => a.localeCompare(b)));
}
```

Composite fields are checked against their field type in `deep` (`fontFamily` must resolve to a
`fontFamily`, `fontSize` to a `dimension`, and so on) with the same mismatch message. Keep a
`FIELD_TYPES` table in `schema.ts` for this.

Then switch `legacySets()` to `resolve(primitive, semantic, light)` and
`resolve(primitive, semantic, light, dark)`.

- [ ] **Step 4: Run, confirm it passes**

Run: `pnpm --filter @unison-ui/tokens test`
Expect: PASS (all files; compile snapshot unchanged).

- [ ] **Step 5: Done-when check** — the six tests above, each asserting its exact error text.

Run: `pnpm --filter @unison-ui/tokens exec vitest run test/resolve.test.ts`
Expect: `6 passed`.

- [ ] **Step 6: Commit** `feat(tokens): alias resolver with layering`

---

### Task 3: Tier rules (todo step 3)

**Files:**
- Create: `packages/tokens/src/lint-tiers.ts`
- Modify: `packages/tokens/src/build.ts` (runs the lint before resolving), `tokens/semantic/color.{light,dark}.json` (mark the four phase 0 colours `raw` until Task 5)
- Test: `packages/tokens/test/lint-tiers.test.ts`

**Interfaces:**
- Consumes: `SourceLayers` (Task 1)
- Produces: `lintTiers(layers: SourceLayers): string[]` (empty = pass) and `assertTiers(layers): void`, which throws `TierError` with `tier lint:\n  <line>\n  …`

Messages:
- `semantic token <path> (<file>): raw value not allowed, alias a primitive or mark it raw`
- `primitive token <path> (<file>): may not alias semantic token <ref>`
- `semantic colour <path>: missing in dark` / `…: missing in light`

- [ ] **Step 1: Write the failing tests**

```ts
import { expect, it } from "vitest";
import { lintTiers } from "../src/lint-tiers";
import type { SourceLayers, SourceToken } from "../src/schema";

const tok = (path: string, value: unknown, tier: SourceToken["tier"], extra: Partial<SourceToken> = {}): SourceToken =>
  ({ path, type: "color", value, tier, file: `tokens/${tier}/x.json`, ...extra });
const layers = (p: Partial<SourceLayers>): SourceLayers => ({ primitive: [], semantic: [], light: [], dark: [], ...p });

it("rejects a raw hex in a semantic token, with its path", () => {
  expect(lintTiers(layers({ light: [tok("color.fg", { hex: "#111111" }, "semantic")],
    dark: [tok("color.fg", "{color.gray.950}", "semantic")] })))
    .toEqual(["semantic token color.fg (tokens/semantic/x.json): raw value not allowed, alias a primitive or mark it raw"]);
});

it("allows raw when marked", () => {
  const overlay = tok("color.overlay", { hex: "#00000080" }, "semantic", { raw: true });
  expect(lintTiers(layers({ light: [overlay], dark: [overlay] }))).toEqual([]);
});

it("forbids primitives aliasing semantic tokens", () => {
  expect(lintTiers(layers({ primitive: [tok("color.x", "{color.fg}", "primitive")],
    light: [tok("color.fg", "{color.x}", "semantic")], dark: [tok("color.fg", "{color.x}", "semantic")] })))
    .toContain("primitive token color.x (tokens/primitive/x.json): may not alias semantic token color.fg");
});

it("requires every semantic colour in both schemes", () => {
  expect(lintTiers(layers({ light: [tok("color.fg-muted", "{color.gray.700}", "semantic")] })))
    .toEqual(["semantic colour color.fg-muted: missing in dark"]);
});
```

Semantic-ness of a reference is decided by whether the referenced path is defined in a
semantic layer. Composite semantic tokens (typography, transition, presets) pass if every
field is an alias or a plain number/string that the schema marks "structural" (`fontWeight`
numbers aren't allowed raw; `transition.spring` must be an alias). Keep that rule in one
`isRawLeaf()` helper.

- [ ] **Step 2: Run, confirm it fails** — `pnpm --filter @unison-ui/tokens exec vitest run test/lint-tiers.test.ts` → FAIL (missing module).

- [ ] **Step 3: Implement**, wire `assertTiers(layers)` into `legacySets()` before `resolve()`,
and add `"$extensions": { "dev.unison": { "raw": true } }` to the four phase 0 colours in both
colour files (comment in the commit body: removed in Task 5).

- [ ] **Step 4: Run, confirm it passes** — `pnpm --filter @unison-ui/tokens test` → PASS.

- [ ] **Step 5: Done-when check** (on the real build, not only the unit test)

Run: `cd packages/tokens && node -e 'const f="tokens/semantic/color.light.json";const j=require("./"+f);delete j.color.fg.$extensions;require("fs").writeFileSync(f,JSON.stringify(j,null,2))' && pnpm build; git checkout tokens`
Expect: build fails with `semantic token color.fg (tokens/semantic/color.light.json): raw value not allowed, alias a primitive or mark it raw`.

Run: `cd packages/tokens && node -e 'const f="tokens/semantic/color.dark.json";const j=require("./"+f);j.color["fg-muted"]={$type:"color",$value:"#999999",$extensions:{"dev.unison":{raw:true}}};const l="tokens/semantic/color.light.json";const k=require("./"+l);k.color["fg-muted"]=j.color["fg-muted"];require("fs").writeFileSync(l,JSON.stringify(k,null,2));delete j.color["fg-muted"];require("fs").writeFileSync(f,JSON.stringify(j,null,2))' && pnpm build; git checkout tokens`
Expect: build fails with `semantic colour color.fg-muted: missing in dark`.
(The todo's literal check, deleting `color.fg-muted` from the dark file, is repeated in Task 5,
once `fg-muted` exists.)

- [ ] **Step 6: Commit** `feat(tokens): tier lint`

---

# Section 2: Colour

### Task 4: OKLCH scale generator (todo step 4)

**Files:**
- Create: `packages/tokens/src/color/generate-scale.ts`, `src/color/palettes.ts`
- Modify: `packages/tokens/src/build.ts` (adds generated colour primitives to the primitive layer, per scheme)
- Test: `packages/tokens/test/color/generate-scale.test.ts`, `test/color/__snapshots__/generate-scale.test.ts.snap`

**Interfaces:**
- Consumes: `SourceToken`, `ColorValue` (Task 1)
- Produces:
  - `const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const; type Step = (typeof STEPS)[number]`
  - `type Mode = "light" | "dark"`; `type Scale = Record<Step, { oklch: string; hex: string }>`
  - `generateScale(opts: { name: string; hue: number; chroma: number; mode: Mode }): Scale`
  - `interface PaletteSpec { name: string; hue: number; chroma: number; anchor?: string /* seed hex */ }`
  - `BUILT_IN_PALETTES(accentHue = 275): PaletteSpec[]` (gray, accent, success, warning, danger, info)
  - `paletteFromSeed(seed: string, opts?: { anchor?: boolean; name?: string }): { hue: number; chroma: number; light: Scale; dark: Scale }`
  - `colorPrimitives(palettes: PaletteSpec[], mode: Mode): SourceToken[]` → `color.<name>.<step>` plus `color.white`, `color.black` (`file: "generated"`, `tier: "primitive"`, value `{ hex, oklch }`)

- [ ] **Step 1: Write the failing tests**

```ts
import { inGamut, parse } from "culori";
import { describe, expect, it } from "vitest";
import { generateScale, STEPS } from "../../src/color/generate-scale";
import { BUILT_IN_PALETTES, paletteFromSeed } from "../../src/color/palettes";

const lightness = (oklch: string) => Number(/oklch\(([\d.]+)/.exec(oklch)?.[1]);
const modes = ["light", "dark"] as const;

describe.each(BUILT_IN_PALETTES())("$name", (p) => {
  it.each(modes)("lightness is monotonic in %s", (mode) => {
    const ls = STEPS.map((s) => lightness(generateScale({ ...p, mode })[s].oklch));
    const sorted = [...ls].sort((a, b) => (mode === "light" ? b - a : a - b));
    expect(ls).toEqual(sorted);
    expect(new Set(ls).size).toBe(11);
  });
  it.each(modes)("every hex is inside sRGB in %s", (mode) => {
    for (const s of STEPS) expect(inGamut("rgb")(parse(generateScale({ ...p, mode })[s].hex))).toBe(true);
  });
});

it("matches the committed snapshot of all 12 scales", () => {
  const all = Object.fromEntries(BUILT_IN_PALETTES().flatMap((p) =>
    modes.map((mode) => [`${p.name}/${mode}`, generateScale({ ...p, mode })])));
  expect(all).toMatchSnapshot();
});

it("is deterministic", () => {
  const p = { name: "accent", hue: 275, chroma: 0.2, mode: "light" as const };
  expect(JSON.stringify(generateScale(p))).toBe(JSON.stringify(generateScale(p)));
});

it("anchors a seed exactly", () => {
  const { light, dark } = paletteFromSeed("#e11d48", { anchor: true });
  expect(Object.values(light).map((s) => s.hex)).toContain("#e11d48");
  expect(Object.values(dark).map((s) => s.hex)).toContain("#e11d48"); // OQ-16: both modes
});

it("pins the reference values from the plan's contrast table", () => {
  const gray = (mode: "light" | "dark") => generateScale({ name: "gray", hue: 275, chroma: 0.012, mode });
  const accent = (mode: "light" | "dark") => generateScale({ name: "accent", hue: 275, chroma: 0.2, mode });
  expect([gray("light")[50].hex, gray("light")[500].hex, gray("light")[950].hex]).toEqual(["#fafafb", "#90929a", "#212124"]);
  expect([gray("dark")[100].hex, gray("dark")[500].hex, gray("dark")[950].hex]).toEqual(["#18181a", "#67696f", "#f1f2f5"]);
  expect([accent("light")[600].hex, accent("dark")[500].hex]).toEqual(["#535cda", "#4f58ce"]);
});
```

The last test pins the numbers this plan's contrast table was computed from. If it fails, the
generator differs from the table, and so does every contrast number. Stop and compare.
(⚠ OQ-1: if option (a) is chosen, dark step 500 becomes 0.54 and `accent("dark")[500]` changes;
recompute and update the pinned value in the same commit.)

- [ ] **Step 2: Run, confirm it fails** — `pnpm --filter @unison-ui/tokens exec vitest run test/color` → FAIL (missing module).

- [ ] **Step 3: Implement**

`src/color/generate-scale.ts`:

```ts
import { formatHex, toGamut } from "culori";

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const LIGHT_L = [0.985, 0.967, 0.928, 0.872, 0.775, 0.66, 0.54, 0.48, 0.4, 0.33, 0.25];
const DARK_L = [0.17, 0.21, 0.26, 0.32, 0.4, 0.52, 0.6, 0.7, 0.8, 0.9, 0.96]; // ⚠ OQ-1
const CHROMA = [0.12, 0.25, 0.45, 0.7, 0.9, 1, 0.95, 0.85, 0.7, 0.55, 0.45];
const DARK_CHROMA = 0.9;
const toSrgb = toGamut("rgb", "oklch");
const fmt = (n: number, d: number) => String(Number(n.toFixed(d)));

export function generateScale({ hue, chroma, mode }: { name: string; hue: number; chroma: number; mode: Mode }): Scale {
  const ls = mode === "light" ? LIGHT_L : DARK_L;
  const k = mode === "dark" ? DARK_CHROMA : 1;
  const out = {} as Scale;
  STEPS.forEach((step, i) => {
    const color = { mode: "oklch" as const, l: ls[i] as number, c: chroma * (CHROMA[i] as number) * k, h: hue };
    out[step] = {
      oklch: `oklch(${fmt(color.l, 3)} ${fmt(color.c, 4)} ${fmt(color.h, 2)})`, // unmapped
      hex: formatHex(toSrgb(color)),                                            // mapped
    };
  });
  return out;
}
```

`src/color/palettes.ts`: `BUILT_IN_PALETTES(accentHue = 275)` returns
`gray (accentHue, 0.012)`, `accent (275, 0.20)`, `success (150, 0.17)`, `warning (75, 0.17)`,
`danger (25, 0.20)`, `info (240, 0.15)`. `paletteFromSeed(seed, { anchor })`:
`const { l, c, h } = oklch(parse(seed))` (hue `0` when undefined); both modes via
`generateScale({ hue: h, chroma: c })`; with `anchor`, in each mode replace the step whose ramp
lightness is closest to `l` with `{ hex: seed.toLowerCase(), oklch: <seed as oklch> }`.
`colorPrimitives(specs, mode)` emits one `SourceToken` per step, plus white and black.

Wire into `build.ts`: generated primitives are prepended to the primitive layer, light scales
for the light resolve and dark scales for the dark resolve.

- [ ] **Step 4: Run, confirm it passes, write the snapshot**

Run: `pnpm --filter @unison-ui/tokens exec vitest run test/color -u` then without `-u`.
Expect: PASS; `test/color/__snapshots__/generate-scale.test.ts.snap` is created with 12 scales.

- [ ] **Step 5: Done-when check** — monotonic, in sRGB, 12-scale snapshot committed, and
`paletteFromSeed("#e11d48", { anchor: true })` contains `#e11d48`.

Run: `pnpm --filter @unison-ui/tokens exec vitest run test/color`
Expect: all passed (6 palettes × 2 modes × 2 + 4 tests).

- [ ] **Step 6: Commit** `feat(tokens): oklch scale generator`

---

### Task 5: Semantic colours (todo step 5)

**Files:**
- Modify: `packages/tokens/tokens/semantic/color.light.json`, `color.dark.json` (full table; the phase 0 raw colours go away)
- Test: `packages/tokens/test/semantic-colors.test.ts`

**Interfaces:**
- Consumes: `loadSource`, `lintTiers` (Tasks 1, 3), generated primitives `color.<palette>.<step>`, `color.white`, `color.black` (Task 4)
- Produces: the semantic colour paths used by every later task:
  `color.{canvas, surface, surface-raised, subtle, muted, fg, fg-muted, fg-subtle, border, border-strong, ring, accent, accent-hover, accent-active, accent-subtle, accent-fg, on-accent, overlay}`
  and for each `<status>` in `success, warning, danger, info`:
  `color.<status>`, `color.<status>-subtle`, `color.<status>-fg`, `color.<status>-border`, `color.on-<status>`

- [ ] **Step 1: Write the failing test**

```ts
import { join } from "node:path";
import { expect, it } from "vitest";
import { loadSource } from "../src/load";
import { lintTiers } from "../src/lint-tiers";

const src = loadSource(join(import.meta.dirname, ".."));
const paths = (layer: { path: string }[]) => layer.map((t) => t.path).sort();
const STATUS = ["success", "warning", "danger", "info"].flatMap((s) =>
  [`color.${s}`, `color.${s}-subtle`, `color.${s}-fg`, `color.${s}-border`, `color.on-${s}`]);
const EXPECTED = [
  "canvas", "surface", "surface-raised", "subtle", "muted", "fg", "fg-muted", "fg-subtle", "border",
  "border-strong", "ring", "accent", "accent-hover", "accent-active", "accent-subtle", "accent-fg",
  "on-accent", "overlay",
].map((n) => `color.${n}`).concat(STATUS).sort();

it("light and dark define exactly the same paths, and exactly the todo's set", () => {
  expect(paths(src.light)).toEqual(EXPECTED);
  expect(paths(src.dark)).toEqual(EXPECTED);
});

it("passes the tier lint", () => {
  expect(lintTiers(src)).toEqual([]);
});

it("only the overlay is raw", () => {
  expect(src.light.filter((t) => t.raw).map((t) => t.path)).toEqual(["color.overlay"]);
});
```

- [ ] **Step 2: Run, confirm it fails** — `pnpm --filter @unison-ui/tokens exec vitest run test/semantic-colors.test.ts` → FAIL (path set differs).

- [ ] **Step 3: Write both files** from the todo's table, aliases only, with the "Used for"
column as `$description` (Task 16's `tokens.json` and Task 23's `docs/tokens.md` read it), e.g.
`"fg-muted": { "$type": "color", "$value": "{color.gray.700}", "$description": "Secondary text" }`. Status rows expand per status,
with the warning exceptions (light `warning` → `warning.400`, dark → `warning.700`;
`on-warning` → `color.black`). `overlay` is `#00000080` (light) and `#00000099` (dark), both with
`"$extensions": { "dev.unison": { "raw": true } }`. ⚠ OQ-1 option (a) changes light `ring` to
`{color.accent.600}`. Write the todo's `{color.accent.500}` unless the answer says otherwise.

- [ ] **Step 4: Run, confirm it passes**, then the full package.

Run: `pnpm --filter @unison-ui/tokens test`
Expect: PASS, but `compile.test.ts`'s snapshot fails: `color.accent` etc. are now generated
values. Update it (`-u`) and check the diff is only colour values. Web/native parity baselines
change here too (⚠ OQ-11).

- [ ] **Step 5: Done-when check** (the tier lint passes and both files have the same path set,
plus the todo's step 3 check, now that `fg-muted` exists)

Run: `pnpm --filter @unison-ui/tokens build`
Expect: exit 0, no tier errors.
Run: `cd packages/tokens && node -e 'const f="tokens/semantic/color.dark.json";const j=require("./"+f);delete j.color["fg-muted"];require("fs").writeFileSync(f,JSON.stringify(j,null,2))' && pnpm build; git checkout tokens/semantic/color.dark.json`
Expect: fails with `semantic colour color.fg-muted: missing in dark`.

- [ ] **Step 6: Commit** `feat(tokens): semantic colours`

---

### Task 6: Contrast enforcement (todo step 6)

**Files:**
- Create: `packages/tokens/src/color/contrast.ts` (replaces `src/contrast.ts`), `src/color/contrast-pairs.ts`, `src/color/auto-contrast.ts`
- Delete: `packages/tokens/src/contrast.ts`, `test/contrast.test.ts` (moved), the `low-contrast` fixture's phase 0 semantics (rewritten as below)
- Modify: `packages/tokens/src/build.ts`, `src/index.ts`
- Test: `packages/tokens/test/color/contrast.test.ts`

**Interfaces:**
- Consumes: `Resolved` (Task 2), `colorPrimitives` / `paletteFromSeed` (Task 4), the semantic colour paths (Task 5)
- Produces:
  - `wcagRatio(fg: string, bg: string): number` (culori `wcagContrast`), `apcaLc(fg: string, bg: string): number` (⚠ OQ-13: `colorjs.io` `contrastAPCA`)
  - `interface ContrastPair { fg: string; bg: string; min: 3 | 4.5 }` and `CONTRAST_PAIRS: ContrastPair[]` (expanded: 27 pairs, paths like `"color.on-accent"`)
  - `interface ContrastResult extends ContrastPair { theme: string; scheme: Mode; ratio: number; apca: number; pass: boolean; adjusted?: { from: string; to: string } }`
  - `checkContrast(tokens: Resolved, ctx: { theme: string; scheme: Mode; autoContrast: boolean }): { results: ContrastResult[]; overrides: SourceToken[]; warnings: string[] }`
  - `class ContrastError extends Error { failures: ContrastResult[] }`
  - `build.ts`: `buildTheme(opts: ThemeBuildOptions): ThemeBuild`, where `interface ThemeBuildOptions { name: string; accent: PaletteSpec; neutral: PaletteSpec; autoContrast: boolean }` (Tasks 7, 9, 13.1 and 17 add optional fields), with
    `interface SchemeBuild { tokens: Resolved; contrast: ContrastResult[] }` and
    `interface ThemeBuild { name: string; light: SchemeBuild; dark: SchemeBuild; warnings: string[] }`.
    Task 17 replaces these opts with the full `ThemeOptions`.

Output text, exactly:

```
contrast: theme default, scheme dark, color.accent on color.surface is 2.89:1 (needs 3:1)
auto-contrast: theme default, scheme light, color.on-accent adjusted #ffffff → #000000 on color.accent (4.45:1 → 4.72:1)
```

(Ratios to 2 decimals; the minimum printed as `3` / `4.5`.)

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { CONTRAST_PAIRS } from "../../src/color/contrast-pairs";
import { wcagRatio } from "../../src/color/contrast";
import { buildTheme, ContrastError } from "../../src/build";
import { paletteFromSeed, BUILT_IN_PALETTES } from "../../src/color/palettes";

const neutral = (hue: number) => ({ name: "gray", hue, chroma: 0.012 });
const indigo = { name: "accent", hue: 275, chroma: 0.2 };
const seeded = (hex: string) => {
  const { hue, chroma } = paletteFromSeed(hex);
  return { accent: { name: "accent", hue, chroma, anchor: hex }, neutral: neutral(hue) };
};

it("keeps the phase 0 ratio checks", () => {
  expect(wcagRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
  expect(wcagRatio("#777777", "#ffffff")).toBeLessThan(4.5);
});

it("expands the todo's table to 27 pairs", () => {
  expect(CONTRAST_PAIRS).toHaveLength(27);
  expect(CONTRAST_PAIRS).toContainEqual({ fg: "color.fg-subtle", bg: "color.surface", min: 3 });
  expect(CONTRAST_PAIRS).toContainEqual({ fg: "color.on-warning", bg: "color.warning", min: 4.5 });
});

it("the default theme passes with no adjustments", () => {
  const t = buildTheme({ name: "default", accent: indigo, neutral: neutral(275), autoContrast: true });
  expect(t.warnings).toEqual([]);
  for (const s of [t.light, t.dark]) expect(s.contrast.every((r) => r.pass && !r.adjusted)).toBe(true);
});

it("pins the tightest default ratios from the plan", () => {
  const t = buildTheme({ name: "default", accent: indigo, neutral: neutral(275), autoContrast: true });
  const ratio = (s: typeof t.light, fg: string, bg: string) =>
    Number(s.contrast.find((r) => r.fg === fg && r.bg === bg)?.ratio.toFixed(2));
  expect(ratio(t.light, "color.border-strong", "color.surface")).toBe(3.1);
  expect(ratio(t.light, "color.on-success", "color.success")).toBe(4.65);
  expect(ratio(t.dark, "color.accent", "color.surface")).toBe(3.06);
});

// ⚠ OQ-3: the todo uses #facc15 here; it passes with no warning. #3d846d is the recommended seed.
const WARN_SEED = "#3d846d";

it("rescues on-accent with a warning", () => {
  const t = buildTheme({ name: "default", ...seeded(WARN_SEED), autoContrast: true });
  expect(t.warnings.join("\n")).toMatch(/^auto-contrast: theme default, scheme light, color\.on-accent adjusted #ffffff → #[0-9a-f]{6} on color\.accent/m);
});

it("fails with the exact pair when autoContrast is off", () => {
  expect(() => buildTheme({ name: "default", ...seeded(WARN_SEED), autoContrast: false }))
    .toThrow(/^contrast: theme default, scheme light, color\.on-accent on color\.accent is 4\.\d\d:1 \(needs 4\.5:1\)$/m);
});

it("the yellow accent builds and its on-accent is legible", () => {
  const t = buildTheme({ name: "default", ...seeded("#facc15"), autoContrast: true });
  const r = t.light.contrast.find((x) => x.fg === "color.on-accent" && x.bg === "color.accent");
  expect(r?.ratio).toBeGreaterThanOrEqual(4.5);
});

it("never touches backgrounds", () => {
  const t = buildTheme({ name: "default", ...seeded(WARN_SEED), autoContrast: true });
  const adjusted = [...t.light.contrast, ...t.dark.contrast].filter((r) => r.adjusted).map((r) => r.fg);
  expect(adjusted.every((p) => /^color\.(on-|.*-fg$)/.test(p))).toBe(true);
});

describe("accent presets (⚠ OQ-1)", () => {
  it.each([["indigo", 275, 0.2], ["blue", 255, 0.19], ["orange", 50, 0.19]])("%s passes", (_, hue, chroma) => {
    expect(() => buildTheme({ name: "default", accent: { name: "accent", hue, chroma }, neutral: neutral(hue), autoContrast: true })).not.toThrow();
  });
  // Until OQ-1 is answered these four are expected to throw; with option (a) move them to the list above.
  it.each([["violet", 295, 0.21], ["teal", 185, 0.13], ["green", 150, 0.17], ["rose", 10, 0.21]])("%s currently fails", (_, hue, chroma) => {
    expect(() => buildTheme({ name: "default", accent: { name: "accent", hue, chroma }, neutral: neutral(hue), autoContrast: true })).toThrow(ContrastError);
  });
});
```

- [ ] **Step 2: Run, confirm it fails** — `pnpm --filter @unison-ui/tokens exec vitest run test/color/contrast.test.ts` → FAIL (missing modules).

- [ ] **Step 3: Implement**

`contrast-pairs.ts` expands the todo's table (2 × 4 + 1 + 3 + 1 + 4 × 2 + 3 = 27).

`auto-contrast.ts`:

```ts
const STEP = 0.01;
const MAX_STEPS = 100;

/** Moves fg's OKLCH lightness away from bg until the pair passes (⚠ OQ-4 for the pole flip). */
export function autoAdjust(fg: string, bg: string, min: number): { hex: string; ratio: number } | undefined {
  const f = oklch(parse(fg)); const b = oklch(parse(bg));
  let dir = f.l >= b.l ? 1 : -1;
  let l = f.l; let flipped = false;
  for (let i = 0; i < MAX_STEPS; i++) {
    const next = l + dir * STEP;
    if (next > 1 || next < 0) {
      if (flipped) return undefined;
      flipped = true;
      l = next > 1 ? 0 : 1;   // jump to the other pole…
      dir = l === 0 ? 1 : -1; // …and step back towards bg from there
    } else l = next;
    const hex = formatHex(toSrgb({ ...f, l }));
    const ratio = wcagRatio(hex, bg);
    if (ratio >= min) return { hex, ratio };
  }
  return undefined;
}
```

`checkContrast` evaluates every pair on the resolved hex values. A failing pair whose fg matches
`/^color\.(on-|.*-fg$)/` and `autoContrast` is on: `autoAdjust`; on success, add a raw override
token (⚠ OQ-5: `raw: true`, `file: "auto-contrast"`) and a warning line. If a foreground is
adjusted for several backgrounds (`on-accent` on `accent`, `-hover`, `-active`), keep the
adjustment that passes all three: adjust against the lowest-ratio background, then re-check the
others. `buildTheme` resolves, checks, re-resolves with the overrides, and throws
`ContrastError` listing every remaining failure, one line each.

Move the `low-contrast` fixture to the new layout: semantic `color.fg` → `{color.gray.400}` in
both colour files. Keep `compile.test.ts`'s "rejects low contrast" test, now matching
`/contrast: theme default, scheme light, color\.fg on color\.canvas is \d\.\d\d:1 \(needs 4\.5:1\)/`.

`apcaLc` goes into each `ContrastResult` (`apca`, rounded to 1 decimal). Add `colorjs.io` with
`pnpm --filter @unison-ui/tokens add colorjs.io` (⚠ OQ-13).

- [ ] **Step 4: Run, confirm it passes** — `pnpm --filter @unison-ui/tokens test` → PASS.

- [ ] **Step 5: Done-when check**

Run: `pnpm --filter @unison-ui/tokens exec vitest run test/color/contrast.test.ts`
Expect: all passed. That covers the default theme (no adjustments); the warning case; and
`autoContrast: false` failing with the exact pair. ⚠ OQ-3: with the todo's literal `#facc15`,
the warning test can't pass. Stop here if OQ-3 is unanswered.

- [ ] **Step 6: Commit** `feat(tokens): contrast enforcement`

---

# Section 3: Typography

### Task 7: Type tokens (todo step 7)

**Files:**
- Modify: `packages/tokens/tokens/primitive/font.json`, `tokens/semantic/text.json`
- Create: `packages/tokens/src/typography.ts` (native text-style conversion)
- Modify: `packages/tokens/src/build.ts` (theme options gain `nativeFonts`), `src/emit-web.ts`, `src/emit-native.ts` (text styles only; full rewrites in Tasks 14 and 16)
- Test: `packages/tokens/test/typography.test.ts`

**Interfaces:**
- Consumes: `Resolved`, `Typography` (Tasks 1–2)
- Produces:
  - `type NativeFonts = Record<"sans" | "mono", Partial<Record<400 | 500 | 600 | 700, string>>>`
  - `DEFAULT_NATIVE_FONTS: NativeFonts` = the todo's map (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`, `JetBrainsMono_400Regular`)
  - `interface NativeTextStyle { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing: number }` (no `fontWeight`)
  - `toNativeTextStyle(t: Typography, family: "sans" | "mono", fonts: NativeFonts): NativeTextStyle`
  - `TEXT_STYLES = ["caption", "label", "body-sm", "body", "body-lg", "title-sm", "title", "title-lg", "display", "code"] as const`
  - Tokens: `font-family.{sans,mono}`, `font-weight.{regular,medium,semibold,bold}`, `text.<style>` (typography), `text.max-scale` (number 1.5, raw semantic)

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it } from "vitest";
import { buildTheme } from "../src/build";
import { TEXT_STYLES, toNativeTextStyle, DEFAULT_NATIVE_FONTS } from "../src/typography";

const t = buildTheme({ name: "default", accent: { name: "accent", hue: 275, chroma: 0.2 },
  neutral: { name: "gray", hue: 275, chroma: 0.012 }, autoContrast: true });

it("defines all ten styles", () => {
  for (const s of TEXT_STYLES) expect(t.light.tokens.get(`text.${s}`)?.type).toBe("typography");
});

it("native title-lg tracking is −0.48 px and has no fontWeight", () => {
  const style = toNativeTextStyle(t.light.tokens.get("text.title-lg")?.value as never, "sans", DEFAULT_NATIVE_FONTS);
  expect(style).toEqual({ fontFamily: "Inter_600SemiBold", fontSize: 24, lineHeight: 32, letterSpacing: -0.48 });
});

it("code uses the mono face", () => {
  expect(toNativeTextStyle(t.light.tokens.get("text.code")?.value as never, "mono", DEFAULT_NATIVE_FONTS).fontFamily)
    .toBe("JetBrainsMono_400Regular");
});

it("text.max-scale is 1.5", () => {
  expect(t.light.tokens.get("text.max-scale")?.value).toBe(1.5);
});
```

- [ ] **Step 2: Run, confirm it fails** — `pnpm --filter @unison-ui/tokens exec vitest run test/typography.test.ts` → FAIL.

- [ ] **Step 3: Implement**

`font.json`: the two families exactly as in the todo (a `fontFamily` string), the four weights.
Also the primitives the composites alias: `font-size.{12,13,14,16,18,20,24,36}`,
`line-height.{16,18,20,24,28,32,40}` (px), and `letter-spacing.{0,tight,tighter}`
= `0em`, `-0.011em`, `-0.02em`. `text.json`: ten composites that alias those primitives (no raw
values, so the tier lint passes), plus `text.max-scale` (`$type: "number"`, raw). Which family a
style uses is decided by its `fontFamily` alias (`code` → `font-family.mono`).

`toNativeTextStyle`: `fontFamily` = `fonts[family][fontWeight]` (throw
`no native font for <family> <weight>` when missing); `fontSize` / `lineHeight` in px (`rem` × 16);
`letterSpacing` = `em × fontSize`, rounded to 2 decimals.

Emitters, for now: web adds `--unison-text-<style>-{size,line-height,weight,tracking}`; native
adds `text: { <style>: NativeTextStyle }`. The legacy adapter skips other new types.

- [ ] **Step 4: Run, confirm it passes** — `pnpm --filter @unison-ui/tokens test` → PASS (update the compile snapshot; check the diff adds only text entries).

- [ ] **Step 5: Done-when check**

Run: `pnpm --filter @unison-ui/tokens build && grep -c -- '--unison-text-.*-size' packages/tokens/dist/web/tokens.css && node -e 'import("./packages/tokens/dist/native/theme.js").then(m=>{const t=m.themes.light.text;console.log(Object.keys(t).length, t["title-lg"].letterSpacing)})'`
Expect: `10`, then `10 -0.48`.

- [ ] **Step 6: Commit** `feat(tokens): typography tokens`

---

### Task 8: Loading fonts in the apps (todo step 8)

**Files:**
- Modify: `apps/web-next/package.json`, `apps/web-next/src/app/layout.tsx`
- Modify: `apps/web-vite/package.json`, `apps/web-vite/src/main.tsx`
- Modify: `apps/mobile/package.json`, `apps/mobile/src/app/_layout.tsx`
- Modify: `apps/*/src/**/*.css` (`font-family: var(--unison-font-family-sans)` on `html`, so text uses the token)
- Create: `docs/fonts.md`

**Interfaces:**
- Consumes: `font-family.sans` / `.mono` (CSS `--unison-font-family-sans`), `DEFAULT_NATIVE_FONTS` (Task 7)
- Produces: nothing used by code; app-level font loading

- [ ] **Step 1: Web dependencies and imports**

Run: `pnpm --filter web-next add @fontsource-variable/inter @fontsource-variable/jetbrains-mono`
Run: `pnpm --filter web-vite add @fontsource-variable/inter @fontsource-variable/jetbrains-mono`
Add to the top of `apps/web-next/src/app/layout.tsx` and `apps/web-vite/src/main.tsx`:

```ts
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
```

- [ ] **Step 2: Native dependencies and loading**

Run: `cd apps/mobile && npx expo install expo-font expo-splash-screen @expo-google-fonts/inter @expo-google-fonts/jetbrains-mono`
Expect: `@expo-google-fonts/inter` and `@expo-google-fonts/jetbrains-mono` added; `expo-font`
`~58.0.12` and `expo-splash-screen` `~58.0.14` unchanged.

`apps/mobile/src/app/_layout.tsx`:

```tsx
import "../global.css";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, JetBrainsMono_400Regular });
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
```

The parity route renders text from Task 21 on, so a font error must not leave a blank screen:
on `error`, render anyway (system font) and log it.

- [ ] **Step 3: `docs/fonts.md`**: the web setup (two imports, family names match
`font-family.*`), the native setup (the five faces, `useFonts` keys = `nativeFonts` values,
splash handling), and swapping in a brand font (change `font-family.sans` via `defineTheme`'s
`fonts`, change `nativeFonts`, load the files).

- [ ] **Step 4: Verify the web**

Run: `pnpm build && node -e '
const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  for (const url of ["http://localhost:3000/", "http://localhost:5173/"]) {
    await p.goto(url); await p.evaluate(() => document.fonts.ready);
    const s = await p.context().newCDPSession(p); await s.send("DOM.enable"); await s.send("CSS.enable");
    const { root } = await s.send("DOM.getDocument"); const { nodeId } = await s.send("DOM.querySelector", { nodeId: root.nodeId, selector: "main" });
    const { fonts } = await s.send("CSS.getPlatformFontsForNode", { nodeId });
    console.log(url, fonts.map((f) => f.familyName).join(","));
  } await b.close(); })();'`
(with `pnpm dev:web` running in another shell)
Expect: both lines print `Inter Variable` (the CDP equivalent of DevTools → Rendered Fonts).

- [ ] **Step 5: Verify native** (⚠ OQ-14: needs simulators) — temporarily change
`DEFAULT_NATIVE_FONTS.sans[700]` to `"Missing_700"`, rebuild, see the fallback system font for
bold text on iOS and Android, revert. Android shows four visibly distinct weights (a screenshot
of a demo line per weight). Without devices, record "unverified, needs Mark" in the commit body.

- [ ] **Step 6: Commit** `feat(apps): load inter and jetbrains mono`

---

# Section 4: Space, shape and depth

### Task 9: Space, size, radius, borders, opacity (todo step 9)

**Files:**
- Modify: `packages/tokens/tokens/primitive/{space,size,radius,border}.json`, `tokens/semantic/shape.json`
- Create: `packages/tokens/tokens/primitive/opacity.json` (not in the todo's tree, needed for `opacity.50`; OQ-16)
- Modify: `packages/tokens/src/build.ts` (density and radius options produce override layers)
- Create: `packages/core/src/concentric.ts`; Modify: `packages/core/src/index.ts`, `packages/core/src/components/box/box.styles.ts` (⚠ OQ-11: `radius.card`)
- Test: `packages/tokens/test/shape.test.ts`, `packages/core/test/concentric.test.ts`

**Interfaces:**
- Consumes: `buildTheme` (Task 6)
- Produces:
  - `type Density = "compact" | "default" | "comfortable"`, `type RadiusOption = "none" | "sm" | "md" | "lg" | "full"`
  - `buildTheme` opts gain `density?: Density` (default `"default"`) and `radius?: RadiusOption` (default `"md"`)
  - `densityLayer(d: Density): SourceToken[]` (overrides `size.control-*`), `radiusLayer(r: RadiusOption): SourceToken[]` (overrides `radius.{control,card,overlay}` aliases)
  - Tokens: `space.{0,0.5,1,1.5,2,3,4,5,6,8,10,12,16,20,24}`, `size.{control-sm,control-md,control-lg,icon-sm,icon-md,icon-lg,touch-target}`, `radius.{none,xs,sm,md,lg,xl,2xl,full}`, `radius.{control,card,overlay,pill}`, `border-width.{0,1,2,default,ring}`, `ring-offset.{2,default}`, `opacity.{50,disabled}`
  - `@unison-ui/core`: `concentric(outerRadius: number, padding: number): number`

Path note: `space.0.5` has a dot inside the step name. The JSON key is `"0.5"`, so the path
is `space.0.5` and the CSS name `--unison-space-0-5`. Tailwind's `p-0.5` comes from `--spacing`,
not this name.

- [ ] **Step 1: Write the failing tests**

`packages/tokens/test/shape.test.ts`:

```ts
import { expect, it } from "vitest";
import { buildTheme } from "../src/build";

const base = { name: "default", accent: { name: "accent", hue: 275, chroma: 0.2 },
  neutral: { name: "gray", hue: 275, chroma: 0.012 }, autoContrast: true };
const px = (t: ReturnType<typeof buildTheme>, path: string) => (t.light.tokens.get(path)?.value as { value: number }).value;

it("compact density makes control-md 36", () => expect(px(buildTheme({ ...base, density: "compact" }), "size.control-md")).toBe(36));
it("default density makes control-md 40", () => expect(px(buildTheme(base), "size.control-md")).toBe(40));
it("radius lg makes card 12", () => expect(px(buildTheme({ ...base, radius: "lg" }), "radius.card")).toBe(12));
it.each([["none", 0, 0, 0], ["sm", 4, 6, 8], ["md", 6, 8, 12], ["lg", 8, 12, 16], ["full", 9999, 16, 16]] as const)(
  "radius %s → control %i, card %i, overlay %i", (radius, control, card, overlay) => {
    const t = buildTheme({ ...base, radius });
    expect([px(t, "radius.control"), px(t, "radius.card"), px(t, "radius.overlay")]).toEqual([control, card, overlay]);
  });
it("space.4 is 16 and touch-target is always 44", () => {
  expect(px(buildTheme(base), "space.4")).toBe(16);
  expect(px(buildTheme({ ...base, density: "compact" }), "size.touch-target")).toBe(44);
});
```

`packages/core/test/concentric.test.ts`:

```ts
import { expect, it } from "vitest";
import { concentric } from "../src/concentric";

it("subtracts the padding", () => expect(concentric(16, 4)).toBe(12));
it("never goes below zero", () => expect(concentric(4, 8)).toBe(0));
```

- [ ] **Step 2: Run, confirm they fail**
Run: `pnpm --filter @unison-ui/tokens exec vitest run test/shape.test.ts && pnpm --filter @unison-ui/core exec vitest run test/concentric.test.ts`
Expect: FAIL (`density` ignored / missing module).

- [ ] **Step 3: Implement.** The primitive files hold the todo's numbers; `size.json`
holds the **default** density, and `densityLayer` overrides `control-*` (compact 28/36/44,
comfortable 36/44/52). `shape.json` holds the `md` aliases; `radiusLayer` overrides the three
aliases per the todo's table, and `radius.pill` is always `{radius.full}`. Semantic
`border-width.default` / `.ring`, `ring-offset.default` and `opacity.disabled` as in OQ-16.
`concentric = (outer, padding) => Math.max(0, outer - padding)`, exported from core's index.
Point `boxStyles.radius` at `"radius.card"` (⚠ OQ-11), which stays 8 px, so the Box looks the same.

- [ ] **Step 4: Run, confirm they pass** — `pnpm test` → PASS (update the compile snapshot).

- [ ] **Step 5: Done-when check**

Run: `pnpm --filter @unison-ui/tokens exec vitest run test/shape.test.ts -t "compact density|radius lg"`
Expect: 2 passed (`size.control-md` = 36 for compact; `radius.card` = 12 for `lg`).

- [ ] **Step 6: Commit** `feat(tokens): space, size, radius, borders`

---

### Task 10.1: Elevation, layers, breakpoints: tokens

**Files:**
- Modify: `packages/tokens/tokens/primitive/{shadow,layer}.json`, `tokens/semantic/elevation.json`
- Create: `packages/tokens/src/shadow.ts`
- Test: `packages/tokens/test/shadow.test.ts`

**Interfaces:**
- Consumes: `ShadowLayer` (Task 1), `buildTheme` (Task 9)
- Produces:
  - `shadowToCss(layers: ShadowLayer[]): string` (`"0 1px 2px rgb(0 0 0 / 0.05)"`, alpha with 2 decimals)
  - `darkShadow(layers: ShadowLayer[]): ShadowLayer[]` (every alpha × 2.5, capped at 0.5)
  - `legacyShadow(layers: ShadowLayer[], size: "xs" | "sm" | "md" | "lg" | "xl"): { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number }` (largest layer; Android elevation xs 1, sm 2, md 4, lg 8, xl 12)
  - Tokens: `shadow.{xs,sm,md,lg,xl}`, `elevation.{raised,popover,overlay}`, `z-index.{base,raised,dropdown,sticky,overlay,modal,popover,toast,tooltip}`, `breakpoint.{sm,md,lg,xl,2xl}`

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it } from "vitest";
import { buildTheme } from "../src/build";
import { shadowToCss } from "../src/shadow";

const t = buildTheme({ name: "default", accent: { name: "accent", hue: 275, chroma: 0.2 },
  neutral: { name: "gray", hue: 275, chroma: 0.012 }, autoContrast: true });
const css = (s: "light" | "dark", p: string) => shadowToCss(t[s].tokens.get(p)?.value as never);

it("light values match the todo", () => {
  expect(css("light", "shadow.xs")).toBe("0 1px 2px rgb(0 0 0 / 0.05)");
  expect(css("light", "shadow.lg")).toBe("0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)");
});
it("dark multiplies alpha by 2.5, capped at 0.5", () => {
  expect(css("dark", "shadow.xs")).toBe("0 1px 2px rgb(0 0 0 / 0.13)"); // 0.125 → 2 decimals
  expect(css("dark", "shadow.xl")).toBe("0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)");
});
it("elevations alias shadows", () => {
  expect(t.light.tokens.get("elevation.popover")?.aliasOf).toBe("shadow.lg");
});
it("layers and breakpoints", () => {
  expect((t.light.tokens.get("z-index.toast")?.value)).toBe(1700);
  expect((t.light.tokens.get("breakpoint.2xl")?.value as { value: number }).value).toBe(1536);
});
```

- [ ] **Step 2: Run, confirm it fails.**
- [ ] **Step 3: Implement.** `shadow.json` holds the light layers in the DTCG object form; the
dark primitive layer is produced in `build.ts` with `darkShadow()`, so geometry can't drift.
`z-index.*` are `number`, `breakpoint.*` are `dimension`.
- [ ] **Step 4: Run, confirm it passes.**

### Task 10.2: Native shadow spike (time box: 2 hours; ⚠ OQ-14)

**Files:**
- Create (temporary, not committed): `apps/mobile/src/app/shadow-spike.tsx`
- Modify: `packages/tokens/src/emit-native.ts` (shadow output), `packages/native/src/shadow.ts` (only if the spike fails)
- Record: the result goes into the ADR in Task 23 (create `docs/adr/0016-native-shadows.md` now with Status "Proposed" and the result)

**Interfaces:**
- Consumes: `shadowToCss`, `legacyShadow` (Task 10.1)
- Produces: native theme `shadow.<size>` = the CSS string (always); `shadow.<size>-legacy` = `legacyShadow(…)` only if the spike fails; `@unison-ui/native`'s `shadowStyle(theme, size)` helper in that case

- [ ] **Step 1:** Render five `View`s with `style={{ boxShadow: "<shadow.xs…xl light value>" }}` on `canvas` on the iOS Simulator and Android emulator. Screenshot both.
- [ ] **Step 2: Decide.** Works on both → the native emitter outputs the CSS string as
`shadow.<size>`. Doesn't work → add the legacy objects and the `shadowStyle()` helper.
- [ ] **Step 3: Done-when check.** Run: `pnpm --filter @unison-ui/tokens build && node -e 'import("./packages/tokens/dist/native/theme.js").then(m=>console.log(Object.keys(m.themes.light.shadow)))'`
Expect: `[ 'lg', 'md', 'sm', 'xl', 'xs' ]` (plus `-legacy` keys if the spike failed). The
visual check on both simulators is a device step: without them, the commit body says
"unverified, needs Mark" and the ADR stays Proposed. Delete `shadow-spike.tsx`.
- [ ] **Step 4: Commit** `feat(tokens): elevation, layers, breakpoints`

---

# Section 5: Motion

### Task 11: Durations and easings (todo step 11)

**Files:**
- Modify: `packages/tokens/tokens/primitive/motion.json`, `tokens/semantic/motion.json`
- Modify: `packages/tokens/src/emit-web.ts`, `src/emit-native.ts` (durations and easings)
- Modify: `packages/react` / `packages/native` nothing yet; the phase 0 `motion.duration.base` / `motion.spring.snappy` paths move (no code reads them; grep to confirm: `grep -rn "motion\.\(duration\|spring\)" packages/*/src apps`)
- Test: `packages/tokens/test/motion-tokens.test.ts`

**Interfaces:**
- Consumes: `CubicBezier`, `Duration`, `Transition` (Task 1)
- Produces:
  - Tokens: `duration.{0,50,80,120,140,160,200,240,320,400,500}`; `motion.duration.{fast,base,slow}.{enter,exit}`; `easing.{standard,enter,exit,linear}`; `motion.{enter,exit,emphasis}` (transitions, OQ-16)
  - Web: `--unison-duration-200: 200ms`, `--unison-motion-duration-fast-enter: var(--unison-duration-120)`, `--unison-easing-enter: cubic-bezier(0.05, 0.7, 0.1, 1)`
  - Native (pre-Task 16 shape): `duration: { "200": 200, … }`, `motion: { duration: { "fast-enter": 120, … } }`, `easing: { enter: [0.05, 0.7, 0.1, 1], … }`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { compile } from "../src/index";

const out = mkdtempSync(join(tmpdir(), "unison-motion-"));
await compile({ cwd: join(import.meta.dirname, ".."), outDir: out });
const css = readFileSync(join(out, "web/tokens.css"), "utf8");
const native = (await import(join(out, "native/theme.js"))).themes.light;

it("web has four easings and six semantic durations", () => {
  for (const [name, curve] of [["standard", "0.2, 0, 0, 1"], ["enter", "0.05, 0.7, 0.1, 1"], ["exit", "0.3, 0, 0.8, 0.15"], ["linear", "0, 0, 1, 1"]]) {
    expect(css).toContain(`--unison-easing-${name}: cubic-bezier(${curve});`);
  }
  for (const [n, e, x] of [["fast", 120, 80], ["base", 200, 140], ["slow", 320, 240]]) {
    expect(css).toContain(`--unison-motion-duration-${n}-enter: var(--unison-duration-${e});`);
    expect(css).toContain(`--unison-motion-duration-${n}-exit: var(--unison-duration-${x});`);
  }
});

it("native has the tuples and plain milliseconds", () => {
  expect(native.easing.enter).toEqual([0.05, 0.7, 0.1, 1]);
  expect(native.motion.duration["slow-exit"]).toBe(240);
  expect(Object.keys(native.easing).sort()).toEqual(["enter", "exit", "linear", "standard"]);
});
```

`compile()` gains an optional `outDir` (default `<cwd>/dist`) so tests write to a temp folder.

- [ ] **Step 2: Run, confirm it fails.**
- [ ] **Step 3: Implement.** Semantic durations alias primitives
(`"enter": { "$type": "duration", "$value": "{duration.120}" }`). Until Task 14 the emitter
prints aliases as `var(--unison-<aliasOf>)` only for durations; Task 14 makes that general.
- [ ] **Step 4: Run, confirm it passes** (update the compile snapshot).
- [ ] **Step 5: Done-when check** — `pnpm --filter @unison-ui/tokens exec vitest run test/motion-tokens.test.ts` → 2 passed.
- [ ] **Step 6: Commit** `feat(tokens): durations and easings`

---

### Task 12: Springs (todo step 12)

**Files:**
- Modify: `packages/tokens/src/spring.ts` (⚠ OQ-6: RK4), `tokens/primitive/motion.json` (`spring.*`)
- Modify: `packages/tokens/src/emit-web.ts` (spring variables + `@supports not` fallback), `src/emit-native.ts`
- Test: `packages/tokens/test/spring.test.ts` (extend)

**Interfaces:**
- Consumes: `SpringConfig` (phase 0)
- Produces:
  - `simulateSpring(spring: SpringConfig): { durationMs: number; samples: number[] }` (same signature as phase 0; RK4 inside)
  - `springPosition(spring: SpringConfig, tMs: number): number` (the integrator at an arbitrary time, for tests and the showcase chart)
  - Tokens `spring.{snappy,smooth,bouncy}`; web `--unison-spring-<name>: linear(…)` and `--unison-spring-<name>-duration: <n>ms`; native `spring: { snappy: { stiffness: 400, damping: 30, mass: 1 }, … }`

- [ ] **Step 1: Write the failing tests** (append to `test/spring.test.ts`)

```ts
import { simulateSpring, springPosition } from "../src/spring";

const SPRINGS = { snappy: { stiffness: 400, damping: 30, mass: 1 }, smooth: { stiffness: 300, damping: 35, mass: 1 }, bouncy: { stiffness: 300, damping: 15, mass: 1 } };

/** x(t) for x(0) = 0, v(0) = 0, target 1. */
function analytic({ stiffness: k, damping: d, mass: m }: typeof SPRINGS.snappy, t: number): number {
  const w0 = Math.sqrt(k / m); const z = d / (2 * Math.sqrt(k * m));
  if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t)); }
  const s = Math.sqrt(z * z - 1); const r1 = -w0 * (z - s); const r2 = -w0 * (z + s);
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

describe.each(Object.entries(SPRINGS))("%s", (_, spring) => {
  it.each([50, 100, 200, 300, 500])("matches the analytic solution at %i ms within 0.005", (ms) => {
    expect(Math.abs(springPosition(spring, ms) - analytic(spring, ms / 1000))).toBeLessThan(0.005);
  });
});

it("ζ matches the table", () => {
  const zeta = ({ stiffness, damping, mass }: typeof SPRINGS.snappy) => damping / (2 * Math.sqrt(stiffness * mass));
  expect(zeta(SPRINGS.snappy)).toBeCloseTo(0.75, 2);
  expect(zeta(SPRINGS.smooth)).toBeCloseTo(1.01, 2);
  expect(zeta(SPRINGS.bouncy)).toBeCloseTo(0.43, 2);
});

it("smooth never exceeds 1.0", () => {
  expect(Math.max(...simulateSpring(SPRINGS.smooth).samples)).toBeLessThanOrEqual(1);
});
```

- [ ] **Step 2: Run, confirm it fails**
Run: `pnpm --filter @unison-ui/tokens exec vitest run test/spring.test.ts`
Expect: FAIL, `springPosition` is not exported. (After adding it with the phase 0 Euler step, the
analytic tests fail with errors up to 0.029. That's OQ-6; watch them fail before switching.)

- [ ] **Step 3: Implement** (⚠ OQ-6) — replace the Euler step with RK4:

```ts
function rk4Step(s: SpringConfig, x: number, v: number, h: number): [number, number] {
  const a = (x: number, v: number) => (-s.stiffness * (x - 1) - s.damping * v) / s.mass;
  const k1x = v, k1v = a(x, v);
  const k2x = v + (h / 2) * k1v, k2v = a(x + (h / 2) * k1x, v + (h / 2) * k1v);
  const k3x = v + (h / 2) * k2v, k3v = a(x + (h / 2) * k2x, v + (h / 2) * k2v);
  const k4x = v + h * k3v, k4v = a(x + h * k3x, v + h * k3v);
  return [x + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x), v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v)];
}

export function springPosition(spring: SpringConfig, tMs: number): number {
  const n = Math.round(tMs / 1000 / STEP);
  let x = 0, v = 0;
  for (let i = 0; i < n; i++) [x, v] = rk4Step(spring, x, v, STEP);
  return x;
}
```

`simulateSpring` uses `rk4Step` in its loop and counts steps as integers (`t = i * STEP`), not a
float accumulator. Spring tokens use `$type: "spring"`. Web emitter:

```css
--unison-spring-snappy: linear(0, …, 1);
--unison-spring-snappy-duration: 300ms;
@supports not (transition-timing-function: linear(0, 1)) {
  :root { --unison-spring-snappy: cubic-bezier(0.2, 0, 0, 1); /* …smooth, bouncy */ }
}
```

The phase 0 names `--unison-motion-spring-snappy-easing` / `-duration` go away (no code uses
them; grep as in Task 11).

- [ ] **Step 4: Run, confirm it passes** — `pnpm --filter @unison-ui/tokens test` → PASS (the
compile snapshot's `linear()` strings change because of RK4; check the diff is only those).
- [ ] **Step 5: Done-when check** — `pnpm --filter @unison-ui/tokens exec vitest run test/spring.test.ts` → all passed (15 analytic checks, ζ, smooth ≤ 1, and phase 0's four).
- [ ] **Step 6: Commit** `feat(tokens): springs`

---

### Task 13.1: Presets: tokens and outputs

**Files:**
- Modify: `packages/tokens/tokens/semantic/motion.json` (presets)
- Create: `packages/tokens/src/motion/presets.ts`
- Modify: `packages/tokens/src/validate.ts` (`motionPreset` schema), `src/build.ts` (`motion` option), `src/emit-web.ts` (keyframes, `--unison-animate-*`, reduced media block), `src/emit-native.ts` (`motionPresets`), the Tailwind `theme.css` constant (`--animate-*`)
- Create: `packages/tokens/src/emit-motion.ts` → `dist/motion.js` + `.d.ts` (browser- and Metro-safe preset data)
- Modify: `packages/tokens/package.json` (`"./motion"` export), `tsdown.config.ts` unchanged (generated file)
- Test: `packages/tokens/test/presets.test.ts`

**Interfaces:**
- Consumes: transitions, springs, durations, easings (Tasks 11–12), `simulateSpring` (Task 12)
- Produces:
  - `type MotionFeel = "snappy" | "smooth" | "reduced"`; `buildTheme` opts gain `motion?: MotionFeel` (default `"snappy"`)
  - `type MotionValues = { opacity?: number; scale?: number; translateY?: number | `${number}%` }`
  - `type ResolvedTransition = { type: "spring"; config: SpringConfig } | { type: "timing"; duration: number; easing: CubicBezier }`
  - `interface PresetPhase { from: MotionValues; to: MotionValues; transition: ResolvedTransition }`
  - `interface MotionPresetValue { enter: PresetPhase; exit: PresetPhase; reduced: { enter: PresetPhase; exit: PresetPhase } | null }`
  - `PRESETS = ["fade", "scale-in", "slide-up", "sheet", "pop", "press"] as const; type MotionPresetName = (typeof PRESETS)[number]`
  - `expandPreset(tokens: Resolved, name: MotionPresetName): MotionPresetValue`
  - `dist/motion.js`: `export const motionPresets: Record<string /* theme */, Record<MotionPresetName, MotionPresetValue>>`; importable as `@unison-ui/tokens/motion`
  - Web: `@keyframes unison-<preset>-in`, `unison-<preset>-out`, `unison-<preset>-reduced-in`, `unison-<preset>-reduced-out`; `--unison-animate-<preset>` and `--unison-animate-<preset>-out`; Tailwind `--animate-<preset>: var(--unison-animate-<preset>)`

Source form of one preset (the others follow the todo's table the same way):

```json
"scale-in": {
  "$type": "motionPreset",
  "$value": {
    "enter": { "from": { "opacity": 0, "scale": 0.96 }, "to": { "opacity": 1, "scale": 1 }, "transition": { "spring": "{spring.snappy}" } },
    "exit": { "to": { "opacity": 0, "scale": 0.98 }, "transition": { "duration": "{motion.duration.fast.exit}", "easing": "{easing.exit}" } },
    "reduced": "opacity"
  }
}
```

`exit.from` defaults to `enter.to`. `"reduced": "opacity"` expands to enter = opacity 0→1 and
exit = opacity →0. The todo says "fast, linear" for both, so the reduced enter uses
`motion.duration.fast.enter` (120 ms), the reduced exit `motion.duration.fast.exit` (80 ms), and
both use `easing.linear`.
`"reduced": "none"` (press) gives `null`. Where the todo gives no exit easing ("fast exit"), use
`easing.exit`. `sheet` uses `translateY: "100%"`; `press`'s enter is 80 ms → `{duration.80}`.

Feel (`motion` option), applied in `expandPreset` after resolving: `smooth` swaps any
`spring.snappy` transition for `spring.smooth` and multiplies every timing duration by 1.2
(rounded to whole ms); `reduced` sets `enter`/`exit` to the reduced variants (press: enter/exit
become 0 ms timing, so nothing moves).

- [ ] **Step 1: Write the failing tests**

```ts
import { expect, it, describe } from "vitest";
import { buildTheme } from "../src/build";
import { expandPreset, PRESETS } from "../src/motion/presets";

const theme = (motion?: "snappy" | "smooth" | "reduced") => buildTheme({ name: "default", motion,
  accent: { name: "accent", hue: 275, chroma: 0.2 }, neutral: { name: "gray", hue: 275, chroma: 0.012 }, autoContrast: true });

describe.each(PRESETS)("%s", (name) => {
  const p = expandPreset(theme().light.tokens, name);
  it("has enter and exit", () => { expect(p.enter.transition).toBeDefined(); expect(p.exit.transition).toBeDefined(); });
  it("reduced only animates opacity, linearly", () => {
    if (name === "press") return expect(p.reduced).toBeNull();
    for (const ph of [p.reduced?.enter, p.reduced?.exit]) {
      expect(Object.keys({ ...ph?.from, ...ph?.to })).toEqual(["opacity"]);
      expect(ph?.transition).toMatchObject({ type: "timing", easing: [0, 0, 1, 1] });
    }
  });
});

it("scale-in enters with the snappy spring", () => {
  expect(expandPreset(theme().light.tokens, "scale-in").enter.transition)
    .toEqual({ type: "spring", config: { stiffness: 400, damping: 30, mass: 1 } });
});
it("smooth swaps the spring and stretches durations", () => {
  const p = expandPreset(theme("smooth").light.tokens, "scale-in");
  expect(p.enter.transition).toMatchObject({ config: { stiffness: 300, damping: 35 } });
  expect(p.exit.transition).toMatchObject({ type: "timing", duration: 96 }); // 80 × 1.2
});
it("reduced feel always uses the reduced variant", () => {
  const p = expandPreset(theme("reduced").light.tokens, "slide-up");
  expect(p.enter).toEqual(p.reduced?.enter);
});
it("sheet slides from 100%", () => {
  expect(expandPreset(theme().light.tokens, "sheet").enter.from).toEqual({ translateY: "100%" });
});
```

Plus an output test (temp `outDir` as in Task 11): `tokens.css` contains
`@keyframes unison-scale-in-in`, `--unison-animate-scale-in: unison-scale-in-in var(--unison-spring-snappy-duration) var(--unison-spring-snappy) both;`
and, inside `@media (prefers-reduced-motion: reduce)`,
`--unison-animate-scale-in: unison-scale-in-reduced-in var(--unison-motion-duration-fast-enter) var(--unison-easing-linear) both;`;
`theme.css` contains `--animate-scale-in: var(--unison-animate-scale-in);` and
`--animate-scale-in-out: var(--unison-animate-scale-in-out);`; `dist/motion.js` exports
`motionPresets.default["scale-in"]`; native `themes.light.motionPresets["scale-in"]` deep-equals it.

- [ ] **Step 2: Run, confirm it fails.**
- [ ] **Step 3: Implement** as specified above. Keyframes convert `scale` / `translateY` to a
`transform` (`translateY(8px) scale(0.96)`); numbers for `translateY` are px.
- [ ] **Step 4: Run, confirm it passes.**

### Task 13.2: Platform helpers in `@unison-ui/motion`

**Files:**
- Create: `packages/motion/src/shared/presets.ts`, `src/web/waapi.ts`, `src/native/reanimated.ts`
- Modify: `packages/motion/src/{shared,web,native}/index.ts`, `package.json` (`./reanimated` export, optional peer ⚠ OQ-12), `tsdown.config.ts` (new entry)
- Test: `packages/motion/test/presets.test.ts`, `test/waapi.web.test.ts`, `test/reanimated.test.ts`
- Modify: `apps/web-vite/src/demo-page.tsx` (a `motion-probe` element for the Done-when; Task 20.2 replaces it)

**Interfaces:**
- Consumes: `MotionPresetValue`, `PresetPhase`, `ResolvedTransition` (types re-exported from `@unison-ui/tokens/motion`, Task 13.1)
- Produces:
  - shared: `selectPhase(preset: MotionPresetValue, phase: "enter" | "exit", reduced: boolean): PresetPhase`
  - web: `toWaapi(preset: MotionPresetValue, phase: "enter" | "exit", opts?: { reduced?: boolean }): [Keyframe[], KeyframeAnimationOptions]`; `useWaapi(preset): (phase) => [Keyframe[], KeyframeAnimationOptions]` (passes `useReducedMotion()`)
  - native (`@unison-ui/motion/reanimated`): `toReanimated(transition: ResolvedTransition): (toValue: number, callback?: (finished?: boolean) => void) => number`; `useReanimatedPhase(preset, phase): { phase: PresetPhase; animate: ReturnType<typeof toReanimated> }`
  - `react-native-reanimated` is imported **only** by `src/native/reanimated.ts`, so apps without it can still use the main entry.

- [ ] **Step 1: Write the failing tests**

`test/presets.test.ts` (shared, node env): for every preset in `motionPresets.default`,
`selectPhase(p, ph, true)` returns `p.reduced[ph]` (press: `p[ph]`, because there's no reduced
variant and press changes colour instead), and `selectPhase(p, ph, false)` returns `p[ph]`.

`test/waapi.web.test.ts` (jsdom):

```ts
import { motionPresets } from "@unison-ui/tokens/motion";
import { expect, it } from "vitest";
import { toWaapi } from "../src/web";

const p = motionPresets.default["scale-in"];
it("spring phases use linear() and the simulated duration", () => {
  const [frames, opts] = toWaapi(p, "enter");
  expect(frames).toEqual([{ opacity: 0, transform: "scale(0.96)" }, { opacity: 1, transform: "scale(1)" }]);
  expect(opts).toMatchObject({ easing: expect.stringMatching(/^linear\(0, /), fill: "both" });
  expect(opts.duration).toBeGreaterThan(150);
});
it("timing phases use cubic-bezier", () => {
  expect(toWaapi(p, "exit")[1]).toMatchObject({ duration: 80, easing: "cubic-bezier(0.3, 0, 0.8, 0.15)" });
});
it("reduced only fades", () => {
  const [frames, opts] = toWaapi(p, "enter", { reduced: true });
  expect(frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  expect(opts).toMatchObject({ duration: 120, easing: "linear" });
});
```

`test/reanimated.test.ts` (node env, `vi.mock("react-native-reanimated", () => ({ withSpring: vi.fn((v, c) => ({ spring: [v, c] })), withTiming: vi.fn((v, c) => ({ timing: [v, c.duration] })), Easing: { bezier: vi.fn(() => ({ factory: true })) } }))`):
`toReanimated({ type: "spring", config })(1)` calls `withSpring(1, config)` with exactly
`{ stiffness, damping, mass }`; a timing transition calls `withTiming(1, { duration, easing })`
with `Easing.bezier(0.3, 0, 0.8, 0.15)`. Run every preset × enter / exit / reduced through it
("unit tests cover every preset's three variants on both platforms").

- [ ] **Step 2: Run, confirm they fail** — `pnpm --filter @unison-ui/motion test` → FAIL (missing exports).
- [ ] **Step 3: Implement.** Add the peer:
`"peerDependencies": { "react-native-reanimated": ">=4.7.1 <5" }` with
`peerDependenciesMeta.react-native-reanimated.optional = true`, and the dev dependency with
`pnpm --filter @unison-ui/motion add -D react-native-reanimated@4.7.1 react-native-worklets@0.13.0`
(⚠ OQ-12). Export `"./reanimated": { "types": "./dist/native/reanimated.d.ts", "default": "./dist/native/reanimated.js" }`.
Add `react-native-reanimated` to the motion package's tsdown `neverBundle` list.
- [ ] **Step 4: Run, confirm they pass** — `pnpm --filter @unison-ui/motion test && pnpm --filter @unison-ui/motion typecheck` → PASS. `pnpm lint` → the boundary check passes (`reanimated.ts` is under `src/native`).
- [ ] **Step 5: Done-when check, web** — add
`<div data-testid="motion-probe" className="animate-scale-in size-4" />` to the Vite demo page, then with `pnpm dev:web` running:

Run: `node -e '
const { chromium } = require("playwright");
(async () => { const b = await chromium.launch();
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const p = await b.newPage(); await p.emulateMedia({ reducedMotion }); await p.goto("http://localhost:5173/");
    const s = await p.getByTestId("motion-probe").evaluate((e) => { const c = getComputedStyle(e); return [c.animationName, c.animationTimingFunction.slice(0, 7)].join(" "); });
    console.log(reducedMotion, s);
  } await b.close(); })();'`
Expect:
```
no-preference unison-scale-in-in linear(
reduce unison-scale-in-reduced-in linear
```
- [ ] **Step 6: Done-when check, native** (⚠ OQ-14): with the OS reduce-motion setting on, the
same preset driven by `useReanimatedPhase` only fades. Verified in the showcase in Task 20.3;
record "unverified, needs Mark" here if no simulator.
- [ ] **Step 7: Commit** `feat(motion): presets, reduced motion and platform helpers`

---

# Section 6: Outputs

Two attributes control web theming from here on: `data-theme` (`light` | `dark`) and
`data-unison-theme` (theme name, `default` when absent), on `<html>` or any element.

### Task 14: CSS output, `tokens.css` (todo step 14)

**Files:**
- Rewrite: `packages/tokens/src/emit-web.ts`
- Create: `packages/tokens/src/paths.ts` (browser-safe: `cssVarName` moves here; `emit-web.ts` re-exports it)
- Modify: `packages/tokens/src/build.ts` (drop `toLegacy` for web), `tsdown.config.ts` (entry `src/paths.ts`), `package.json` (`"./paths"` export)
- Modify: `apps/web-vite/src/demo-page.tsx` (a `dark-scope` probe)
- Test: `packages/tokens/test/emit-web.test.ts`

**Interfaces:**
- Consumes: `ThemeBuild` (Task 6; `themes[0]` is the default theme), `ResolvedToken.aliasOf`, colour `{ hex, oklch }`, `shadowToCss`, `simulateSpring`, presets (Tasks 10–13)
- Produces:
  - `cssVarName(path: string): string` (`"color.accent"` → `"--unison-color-accent"`, `"space.0.5"` → `"--unison-space-0-5"`), in `src/paths.ts`
  - `emitTokensCss(themes: ThemeBuild[]): string`
  - `cssValue(t: ResolvedToken): string` (per type: dimension `16px`, duration `200ms`, number as is, fontFamily quoted list, cubicBezier `cubic-bezier(a, b, c, d)`, shadow `shadowToCss`, color hex; an alias → `var(<cssVarName(aliasOf)>)`)

Selectors per theme. For `default`, the todo's shapes:

```css
:root, [data-unison-theme="default"] { /* light: everything */ }
[data-theme="dark"], [data-theme="dark"] [data-unison-theme="default"] { /* dark: only paths whose value differs from light */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { /* same dark overrides */ } }
```

For each other theme `N` (Task 18), the same three shapes with `[data-unison-theme="N"]`. The
light block declares every path whose N-light value differs from default-light. The dark block
declares every path whose N-dark value differs from N-light **or** from default-dark, so nothing
leaks in from an ancestor's default-dark.
⚠ OQ-8 (recommended additions, apply only once answered): add `[data-theme="light"]` to every
light selector list, and `[data-unison-theme="N"][data-theme="dark"]` to every dark one.

Inside each block: hex declarations first, then the block's colour primitives again inside
`@supports (color: oklch(0 0 0)) { <same selector> { … oklch … } }`. Typography as
`--unison-text-<style>-{size,line-height,weight,tracking}` (`tracking` keeps `em`). Shadows as
full strings. Motion as in Tasks 11–13. Declarations sorted by path; blocks in the fixed order
above, themes in config order.

- [ ] **Step 1: Write the failing tests**

```ts
import { gzipSync } from "node:zlib";
import { expect, it } from "vitest";
import { buildTheme } from "../src/build";
import { emitTokensCss } from "../src/emit-web";

const def = buildTheme({ name: "default", accent: { name: "accent", hue: 275, chroma: 0.2 },
  neutral: { name: "gray", hue: 275, chroma: 0.012 }, autoContrast: true });
const css = emitTokensCss([def]);

it("emits semantic tokens as references", () => {
  expect(css).toContain("--unison-color-accent: var(--unison-color-accent-600);");
  expect(css).toContain("--unison-color-fg-muted: var(--unison-color-gray-700);");
});
it("dark only overrides what differs", () => {
  const dark = css.split('[data-theme="dark"], [data-theme="dark"] [data-unison-theme="default"] {')[1]?.split("}")[0] ?? "";
  expect(dark).toContain("--unison-color-accent: var(--unison-color-accent-500);");
  expect(dark).not.toContain("--unison-color-fg:"); // gray.950 in both
  expect(dark).not.toContain("--unison-space-4:");
});
it("emits hex first and oklch under @supports", () => {
  expect(css.indexOf("--unison-color-accent-600: #535cda;")).toBeLessThan(css.indexOf("@supports (color: oklch(0 0 0))"));
  expect(css).toMatch(/@supports \(color: oklch\(0 0 0\)\) \{\n {2}:root, \[data-unison-theme="default"\] \{\n {4}--unison-color-accent-50: oklch\(/);
});
it("emits typography and shadows", () => {
  expect(css).toContain("--unison-text-title-lg-size: 24px;");
  expect(css).toContain("--unison-text-title-lg-tracking: -0.02em;");
  expect(css).toContain("--unison-shadow-xs: 0 1px 2px rgb(0 0 0 / 0.05);");
});
it("is deterministic", () => expect(emitTokensCss([def])).toBe(css));
it("stays under 8 KB gzipped", () => expect(gzipSync(css).length).toBeLessThan(8 * 1024));
```

- [ ] **Step 2: Run, confirm it fails.**
- [ ] **Step 3: Implement**, then delete the web half of `toLegacy`. Update the compile
snapshot. ⚠ OQ-11: the Box's colours change from here, so update the web parity baselines with
`pnpm test:parity --platform web --update` and say "intended visual change: phase 1 colours" in
the commit body.
- [ ] **Step 4: Run, confirm it passes** — `pnpm test` → PASS.
- [ ] **Step 5: Done-when check**

Add to `apps/web-vite/src/demo-page.tsx`:
`<div data-testid="dark-scope" data-theme="dark"><div data-testid="dark-scope-surface" className="bg-surface size-4" /></div>`
and `<div data-testid="light-surface" className="bg-surface size-4" />` next to it.

Run (with `pnpm dev:web` running): `node -e '
const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.emulateMedia({ colorScheme: "light" });
  await p.goto("http://localhost:5173/");
  const bg = (id) => p.getByTestId(id).evaluate((e) => getComputedStyle(e).backgroundColor);
  console.log(await bg("light-surface"), "|", await bg("dark-scope-surface"), "|", await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--unison-color-surface")));
  await b.close(); })();'`
Expect: `rgb(255, 255, 255) | oklch(0.21 0.0027 275) | #ffffff` (only the subtree is dark;
the page stays light).

Run: `pnpm --filter @unison-ui/tokens build && gzip -c packages/tokens/dist/web/tokens.css | wc -c`
Expect: a number below `8192`.

- [ ] **Step 6: Commit** `feat(tokens): full css output`

---

### Task 15: Tailwind v4 output (todo step 15)

**Files:**
- Create: `packages/tokens/src/emit-tailwind.ts` (replaces the `THEME_CSS` constant and `nativeThemeCss` from `emit-native.ts`)
- Modify: `packages/tokens/package.json` (`"./theme-strict.css"` export)
- Modify: `apps/web-next/src/app/globals.css`, `apps/web-vite/src/index.css` (strict file)
- Create: `docs/tailwind.md`
- Test: `packages/tokens/test/emit-tailwind.test.ts`

**Interfaces:**
- Consumes: `ThemeBuild[]`, `cssVarName` (Task 14), `PRESETS` (Task 13.1)
- Produces:
  - `emitThemeCss(themes: ThemeBuild[], opts: { strict: boolean }): string` → `dist/web/theme.css`, `dist/web/theme-strict.css`
  - `emitNativeThemeCss(themes: ThemeBuild[]): string` → `dist/native/theme.css` (Uniwind: literal values, `@layer theme { :root { @variant light {…} @variant dark {…} } }`; named themes as `@variant <name>-light` / `<name>-dark`, ⚠ OQ-19)

`theme-strict.css` starts with

```css
@theme {
  --color-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --font-*: initial;
  --text-*: initial;
}
```

Both files then contain one `@theme inline { … }` block with the todo's mappings:
`--color-<semantic and palette names>: var(--unison-color-…)`,
`--font-sans` / `--font-mono`, `--text-<style>` with `--text-<style>--line-height`,
`--letter-spacing` and `--font-weight`, `--radius-<primitives and control/card/overlay/pill>`,
`--shadow-<xs…xl>` and `--shadow-{raised,popover,overlay}`, `--spacing: var(--unison-space-1)`,
`--ease-<easing>` and `--ease-spring-<name>`, `--animate-<preset>` and `--animate-<preset>-out`.
**Breakpoints go into a separate, non-inline `@theme` with literal values**
(`--breakpoint-md: 768px;`): Tailwind uses them in media queries, where `var()` doesn't work.

- [ ] **Step 1: Write the failing test** — a unit test asserting the reset block (strict only),
`--color-fg-muted: var(--unison-color-fg-muted);`, `--color-gray-100: var(--unison-color-gray-100);`,
`--text-title-lg--line-height: var(--unison-text-title-lg-line-height);`,
`--radius-card: var(--unison-radius-card);`, `--shadow-popover: var(--unison-shadow-popover);`,
`--spacing: var(--unison-space-1);`, `--ease-spring-snappy: var(--unison-spring-snappy);`,
`--animate-scale-in: var(--unison-animate-scale-in);`, and `--breakpoint-md: 768px;` outside
`@theme inline`. Plus a compile test: run Tailwind on a fixture through `@tailwindcss/node`'s
`compile()` (add `@tailwindcss/node` and `tailwindcss` as dev dependencies of the tokens package):

```ts
import { compile } from "@tailwindcss/node";
const classes = ["bg-surface", "text-fg-muted", "bg-accent-hover", "bg-gray-100", "font-sans", "font-mono", "text-body",
  "text-title-lg", "rounded-card", "shadow-popover", "p-4", "gap-6", "ease-enter", "ease-spring-snappy", "animate-scale-in", "md:flex-row"];
async function build(themeFile: string, candidates: string[]) {
  const c = await compile(`@import "tailwindcss/theme.css" layer(theme);\n${themeFile}\n@tailwind utilities;`, { base: process.cwd(), onDependency: () => {} });
  return c.build(candidates);
}
it("strict: every example class compiles, bg-blue-500 doesn't", async () => {
  const css = await build(emitThemeCss([def], { strict: true }), [...classes, "bg-blue-500"]);
  for (const cls of classes) expect(css).toContain(`.${cls.replace(":", "\\:")}`);
  expect(css).not.toContain(".bg-blue-500");
});
it("non-strict keeps Tailwind's palette", async () => {
  expect(await build(emitThemeCss([def], { strict: false }), ["bg-blue-500"])).toContain(".bg-blue-500");
});
```

- [ ] **Step 2: Run, confirm it fails.**
- [ ] **Step 3: Implement**, and switch both web demos to
`@import "@unison-ui/tokens/theme-strict.css";`. Replace `bg-border` / `border-border` usages if
any class leaves the system (grep `className=` in `apps/`).
- [ ] **Step 4: Run, confirm it passes**, then `pnpm build` (both web apps must build with the strict file).
- [ ] **Step 5: Native** (⚠ OQ-14): on iOS and Android, check `bg-surface`, `text-fg-muted`,
`rounded-card`, `text-body`, `p-4` on a temporary screen. Note unsupported families (likely
`shadow-*`, `animate-*`) in `docs/tailwind.md`. `docs/tailwind.md` also gets the namespace table
and strict vs non-strict.
- [ ] **Step 6: Done-when check**

Run: `pnpm --filter @unison-ui/tokens exec vitest run test/emit-tailwind.test.ts && pnpm --filter web-vite build && grep -c "bg-blue-500" apps/web-vite/dist/assets/*.css`
Expect: tests pass; `0` (after temporarily adding `className="bg-blue-500"` to the demo page
before the build, then removing it).

- [ ] **Step 7: Commit** `feat(tokens): tailwind v4 theme and strict mode`

---

### Task 16: Native theme, generated types, `tokens.json` (todo step 16)

**Files:**
- Rewrite: `packages/tokens/src/emit-native.ts`
- Create: `packages/tokens/src/emit-types.ts`, `src/emit-json.ts`, `packages/tokens/schema/tokens.schema.json`
- Modify: `packages/tokens/src/paths.ts` (`nativeKey`), `src/index.ts` (type re-exports), `package.json` (`"./types"` export, `files` adds `schema`), `tokens/semantic/shape.json` (`size.demo-box`)
- Delete: `packages/tokens/tokens/primitive/size.json`'s `size.box`; the rest of `toLegacy`
- Modify: `packages/react/src/css-var.ts`, `packages/native/src/theme.ts`, `packages/core/src/components/box/box.styles.ts`
- Modify: `apps/mobile/src/app/parity/[component]/[case].tsx` (new `themes` shape)
- Test: `packages/tokens/test/emit-native.test.ts`, `test/tokens-json.test.ts`, `packages/native/test/token.test-d.ts`, `packages/react/test/css-var.test-d.ts`

**Interfaces:**
- Consumes: `ThemeBuild[]`, `toNativeTextStyle` (Task 7), `shadowToCss` (Task 10), presets (Task 13.1), contrast results (Task 6)
- Produces:
  - `nativeKey(path: string): readonly string[]` (⚠ OQ-7), in `src/paths.ts`: the property path inside a `UnisonTheme`, e.g. `["color", "accent-600"]`, `["motion", "duration", "fast-enter"]`:

    | Token path | Native location |
    | --- | --- |
    | `color.<rest>` | `color["<rest, dots → dashes>"]` (`color.accent.600` → `color["accent-600"]`) |
    | `space.*`, `size.*`, `radius.*`, `opacity.*`, `shadow.*`, `elevation.*`, `breakpoint.*` | same group, key = rest with dashes |
    | `border-width.*`, `ring-offset.*`, `z-index.*`, `font-family.*`, `font-weight.*` | `borderWidth`, `ringOffset`, `zIndex`, `fontFamily`, `fontWeight` |
    | `text.<style>` | `text[style]` (a `NativeTextStyle`); `text.max-scale` → `text["max-scale"]` |
    | `duration.<n>`, `motion.duration.<a>.<b>` | `motion.duration["<n>"]`, `motion.duration["<a>-<b>"]` |
    | `easing.*`, `spring.*` | `motion.easing[…]`, `motion.spring[…]` |
    | `motion.preset.<name>` | `motion.presets[name]` |
    | `motion.{enter,exit,emphasis}` | `motion.transition[…]` |

  - `dist/native/theme.js`: `export const themes = { [name]: { light: UnisonTheme, dark: UnisonTheme } }`
  - `dist/types.d.ts` (and `.unison/types.d.ts`): `UnisonTheme`; unions `SemanticColor`, `TextStyle`, `RadiusToken`, `ShadowToken`, `ElevationToken`, `MotionPreset`, `ThemeName`; `SemanticTokenPath`; `interface SemanticTokenValues { "color.fg-muted": string; "text.body": NativeTextStyle; "radius.card": number; … }`
  - `@unison-ui/tokens` re-exports `type * from "@unison-ui/tokens/types"` (the phase 0 self-import pattern, OQ-15 there)
  - `dist/tokens.json`: `{ version: 1, defaultTheme, themes: { [name]: { light: Record<path, Entry>, dark: … } } }`, `Entry = { type, value, oklch?, aliasOf?, tier, description?, contrast?: { on, ratio, apca, min, pass, adjusted? }[] }`
  - `@unison-ui/react`: `cssVar(path: SemanticTokenPath): string`
  - `@unison-ui/native`: `token<P extends SemanticTokenPath>(theme: UnisonTheme, path: P): SemanticTokenValues[P]`; `useUnisonTheme()` reads `themes.default[scheme]` (context arrives in Task 19.2)

- [ ] **Step 1: Write the failing tests**

`packages/native/test/token.test-d.ts`:

```ts
import { themes } from "@unison-ui/tokens/native";
import { expectTypeOf, test } from "vitest";
import { token } from "../src/theme";

const theme = themes.default.light;
test("semantic paths compile and are typed", () => {
  expectTypeOf(token(theme, "color.fg-muted")).toEqualTypeOf<string>();
  expectTypeOf(token(theme, "radius.card")).toEqualTypeOf<number>();
});
test("primitive paths are a type error", () => {
  // @ts-expect-error: components may only use semantic tokens
  token(theme, "color.gray.500");
  // @ts-expect-error
  token(theme, "radius.md");
});
```

(`packages/native` gains `vitest` for `test-d` files only: `"test": "jest && vitest run --typecheck.only"`.)
Same for `cssVar` in `packages/react/test/css-var.test-d.ts`.

`packages/tokens/test/tokens-json.test.ts`:

```ts
import Ajv from "ajv/dist/2020.js";
import schema from "../schema/tokens.schema.json" with { type: "json" };
// …build the default theme into a temp outDir, read tokens.json…
it("validates against the committed schema", () => {
  const validate = new Ajv({ allErrors: true }).compile(schema);
  expect(validate(json), JSON.stringify(validate.errors)).toBe(true);
});
it("carries alias, tier, description and contrast", () => {
  expect(json.themes.default.light["color.fg"]).toMatchObject({ aliasOf: "color.gray.950", tier: "semantic",
    description: "Primary text", contrast: expect.arrayContaining([expect.objectContaining({ on: "color.surface", min: 4.5, pass: true })]) });
});
```

`test/emit-native.test.ts`: `themes.default.light.color["fg-muted"] === "#5c5d64"`,
`color["accent-600"] === "#535cda"`, `color.accent === "#535cda"`,
`text["title-lg"].letterSpacing === -0.48`, `motion.spring.snappy` deep-equals
`{ stiffness: 400, damping: 30, mass: 1 }`, `motion.presets["scale-in"]` equals
`motionPresets.default["scale-in"]`, and every leaf is a `number`, `string`, plain object or
array (no functions, no `undefined`), so it can go straight into `StyleSheet`.

- [ ] **Step 2: Run, confirm they fail** — `pnpm --filter @unison-ui/tokens test`, `pnpm --filter @unison-ui/native test`, `pnpm --filter @unison-ui/react test` → FAIL (`token(theme, "color.gray.500")` currently compiles, so `@ts-expect-error` reports "unused directive").
- [ ] **Step 3: Implement.** Add `pnpm --filter @unison-ui/tokens add -D ajv`. Migrate the Box:
`"size": { "demo-box": { "$type": "dimension", "$value": "{space.24}" } }` in `shape.json`;
`boxStyles.size = "size.demo-box"`; `boxStyles.radius` is `"radius.card"` already (Task 9).
Update the native parity route to `themes.default[active].color.surface`.
- [ ] **Step 4: Run, confirm they pass** — `pnpm check` → passes.
- [ ] **Step 5: Done-when check**

Run: `pnpm --filter @unison-ui/native exec vitest run --typecheck.only && pnpm --filter @unison-ui/tokens exec vitest run test/tokens-json.test.ts`
Expect: both pass. That covers `token(theme, "color.gray.500")` as a type error (the
`@ts-expect-error` is used), `"color.fg-muted"` compiling, and `tokens.json` matching the schema.
Run: `pnpm test:parity --platform web`
Expect: layout metrics unchanged (the Box keeps 96 × 96 and radius 8).

- [ ] **Step 6: Commit** `feat(tokens): native theme, generated types and tokens.json`

---

# Section 7: Themes and runtime switching

### Task 17: `defineTheme()` and `unison.config.ts` (todo step 17)

**Files:**
- Create: `packages/tokens/src/config.ts`, `src/suggest.ts`
- Modify: `packages/tokens/src/build.ts` (`build(config)`, `writeOutputs`), `src/bin.ts` (flags, jiti, watch), `src/index.ts` (exports), `package.json` (`jiti` dependency; `build` script becomes `tsdown && node dist/bin.js build --out dist`)
- Test: `packages/tokens/test/config.test.ts`, `test/cli.test.ts`

**Interfaces:**
- Consumes: `buildTheme(opts: ThemeBuildOptions)` (Tasks 6–13: `{ name, accent: PaletteSpec, neutral: PaletteSpec, autoContrast, density?, radius?, motion?, nativeFonts?, fonts?, overrides? }`), every emitter (Tasks 13.1–16)
- Produces:
  - `type AccentPreset = "indigo" | "violet" | "blue" | "teal" | "green" | "orange" | "rose"`, `type NeutralPreset = "gray" | "neutral" | "slate" | "warm"`
  - `interface ThemeOptions { extends?: string; accent?: AccentPreset | `#${string}` | { hue: number; chroma: number }; neutral?: NeutralPreset; radius?: RadiusOption; density?: Density; motion?: MotionFeel; autoContrast?: boolean; fonts?: { sans?: string; mono?: string; nativeFonts?: Partial<NativeFonts> }; overrides?: Partial<Record<SemanticTokenPath, `{${string}}`>> }`
  - `defineTheme(o: ThemeOptions): ThemeOptions`; `interface UnisonConfig { themes: Record<string, ThemeOptions>; defaultTheme?: string }`; `defineConfig(c: UnisonConfig): UnisonConfig`; `DEFAULT_CONFIG: UnisonConfig` (`{ themes: { default: {} } }`)
  - `validateConfig(c: unknown): string[]`; `class ConfigError extends Error { problems: string[] }`
  - `toBuildOptions(name: string, o: ThemeOptions): ThemeBuildOptions` (defaults: accent `indigo`, neutral `gray`, radius `md`, density `default`, motion `snappy`, autoContrast `true`)
  - `interface BuildResult { themes: ThemeBuild[]; defaultTheme: string; warnings: string[] }`; `build(config?: UnisonConfig): BuildResult`; `writeOutputs(r: BuildResult, outDir: string): string[]`
  - CLI: `unison-tokens build [--config <file>] [--out <dir>] [--watch]`; `--out` defaults to `dist` (the package's own build); apps always pass it
  - `compile({ cwd, outDir })` (phase 0 API, used by tests since Task 11) stays as a wrapper: `writeOutputs(build(DEFAULT_CONFIG, { sourceDir: cwd }), outDir ?? join(cwd, "dist"))`; `build` takes an optional second argument `{ sourceDir?: string }` (defaults to the package root) so fixtures keep working

Presets, exactly: accents `indigo (275, 0.20)`, `violet (295, 0.21)`, `blue (255, 0.19)`,
`teal (185, 0.13)`, `green (150, 0.17)`, `orange (50, 0.19)`, `rose (10, 0.21)`; neutrals
`gray (accent hue, 0.012)`, `neutral (0, 0)`, `slate (250, 0.02)`, `warm (60, 0.015)`.
A `#hex` accent is `paletteFromSeed(hex, { anchor: true })`; `gray` then takes the seed's hue.

Messages:
- `themes.default.radius: "medium" is not valid, did you mean "md"?` (nearest valid option by
  edit distance; if the distance is over 3: `expected one of none, sm, md, lg, full`)
- `themes.default.acent: unknown option, did you mean "accent"?`
- `themes.default.overrides["color.gray.500"]: only semantic tokens can be overridden`
- `themes.default.overrides["color.ring"]: must be an alias like "{color.accent.400}"`

- [ ] **Step 1: Write the failing tests**

`test/config.test.ts`:

```ts
import { expect, it } from "vitest";
import { build, ConfigError, defineConfig, defineTheme } from "../src/index";

const one = (o: Parameters<typeof defineTheme>[0]) => build(defineConfig({ themes: { default: defineTheme(o) } }));
const px = (r: ReturnType<typeof build>, p: string) => (r.themes[0]?.light.tokens.get(p)?.value as { value: number }).value;

it("builds the todo's example", () => {
  const r = one({ accent: "#e11d48", radius: "lg", density: "compact" }); // ⚠ OQ-2: fails in dark until answered
  const accent = [...(r.themes[0]?.light.tokens.values() ?? [])]
    .filter((t) => t.path.startsWith("color.accent.")).map((t) => (t.value as { hex: string }).hex);
  expect(accent).toContain("#e11d48");
  expect(px(r, "radius.card")).toBe(12);
  expect(px(r, "size.control-md")).toBe(36);
});

it("suggests the nearest radius", () => {
  expect(() => one({ radius: "medium" as never })).toThrow('themes.default.radius: "medium" is not valid, did you mean "md"?');
});

it.each([
  ["accent", "indigo", "purple"], ["neutral", "slate", "grey"], ["radius", "full", "round"],
  ["density", "compact", "tight"], ["motion", "smooth", "slow"], ["autoContrast", false, "no"],
] as const)("%s: %s is valid, %s is not", (key, ok, bad) => {
  expect(() => one({ [key]: ok } as never)).not.toThrow(ConfigError);
  expect(() => one({ [key]: bad } as never)).toThrow(ConfigError);
});

it("rejects unknown keys with a suggestion", () => {
  expect(() => one({ acent: "indigo" } as never)).toThrow('themes.default.acent: unknown option, did you mean "accent"?');
});

it("overrides accept semantic aliases only", () => {
  expect(px(one({ overrides: { "radius.card": "{radius.2xl}" } }), "radius.card")).toBe(16);
  expect(() => one({ overrides: { "color.gray.500": "{color.gray.400}" } as never })).toThrow("only semantic tokens can be overridden");
});
```

`test/cli.test.ts`: write a temp `unison.config.ts` that imports `defineConfig` / `defineTheme`
from the package's `src/index.ts`, run `tsx src/bin.ts build --config <file> --out <tmp>` with
`execFileSync`, and assert one `wrote <tmp>/<file>` line for each of `web/tokens.css`,
`web/theme.css`, `web/theme-strict.css`, `native/theme.js`, `native/theme.d.ts`,
`native/theme.css`, `motion.js`, `motion.d.ts`, `types.d.ts`, `tokens.json`. Also: without
`--config` it builds the default theme; `--watch` (spawned) rewrites `tokens.css` within 2 s of
the config changing (the new accent hex appears), then the test kills it.

- [ ] **Step 2: Run, confirm they fail** — `pnpm --filter @unison-ui/tokens exec vitest run test/config.test.ts test/cli.test.ts` → FAIL (no `defineTheme` export).
- [ ] **Step 3: Implement.** `overrides` become the last semantic layer in `buildTheme` (after
the density and radius layers, before the contrast check), so an override is contrast-checked
too. `fonts.sans` / `fonts.mono` override `font-family.*`; `fonts.nativeFonts` merges over
`DEFAULT_NATIVE_FONTS`. Run `pnpm --filter @unison-ui/tokens add jiti`. Loading:

```ts
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url, { moduleCache: false }); // no cache, so --watch reloads
const config = await jiti.import<UnisonConfig>(resolve(configPath), { default: true });
```

`--watch` builds once, then uses `fs.watch(configPath)` with a 50 ms debounce. A failing rebuild
prints its error and keeps watching. Auto-contrast warnings go to stderr as `warning: <line>`.
The package's own `build` keeps writing the default theme to `dist/`, so apps that don't
customise need no config.
- [ ] **Step 4: Run, confirm they pass** — `pnpm --filter @unison-ui/tokens test` → PASS.
- [ ] **Step 5: Done-when check**

Run: `pnpm --filter @unison-ui/tokens exec vitest run test/config.test.ts -t "todo's example|nearest radius"`
Expect: 2 passed. ⚠ OQ-2: with the todo's values the first test fails with
`contrast: theme default, scheme dark, color.accent on color.surface is 2.89:1 (needs 3:1)`. Stop there.

- [ ] **Step 6: Commit** `feat(tokens): defineTheme and config file`

---

### Task 18: Named themes (todo step 18)

**Files:**
- Modify: `packages/tokens/src/config.ts` (`extends`, name rules), `src/build.ts`
- Create: `apps/web-next/unison.config.ts`, `apps/web-vite/unison.config.ts`, `apps/mobile/unison.config.ts` (identical)
- Modify: `.gitignore` (`.unison/`), `apps/*/package.json` (scripts, `concurrently`), `apps/web-next/src/app/globals.css`, `apps/web-vite/src/index.css`, `apps/mobile/src/global.css`
- Test: `packages/tokens/test/named-themes.test.ts`

**Interfaces:**
- Consumes: `build`, `defineConfig`, `defineTheme`, `validateConfig` (Task 17); theme blocks in `emitTokensCss` (Task 14)
- Produces:
  - `ThemeOptions.extends` resolved before validation (parent first, child keys win, `overrides` merged per path). Errors: `themes.a.extends: cycle a → b → a`; `themes.brand.extends: no theme "defualt", did you mean "default"?`
  - Name rules: `themes.Brand: theme names may only use a-z, 0-9 and "-"`; `themes: missing the "default" theme`
  - App script `tokens` = `unison-tokens build --config unison.config.ts --out .unison`; generated files under `apps/<app>/.unison/`

Demo config (all three apps):

```ts
import { defineConfig, defineTheme } from "@unison-ui/tokens";

export default defineConfig({
  themes: {
    default: defineTheme({ accent: "indigo" }),
    brand: defineTheme({ extends: "default", accent: "#e11d48", radius: "lg" }), // ⚠ OQ-2
  },
  defaultTheme: "default",
});
```

- [ ] **Step 1: Write the failing tests**: `build()` with the demo config gives two
`ThemeBuild`s; `emitTokensCss` contains `[data-unison-theme="brand"] {`; the native output has
`themes.brand.light` and `themes.brand.dark`; `brand` inherits from `default` (with
`density: "compact"` on default, brand's `size.control-md` is 36); and the name and `extends`
errors above, each with its exact text.
- [ ] **Step 2: Run, confirm they fail.**
- [ ] **Step 3: Implement**, then wire the apps (⚠ OQ-9: pnpm 12 runs no `pre*` scripts, so chain explicitly).

`apps/web-vite/package.json` scripts:

```json
"tokens": "unison-tokens build --config unison.config.ts --out .unison",
"dev": "concurrently --kill-others --names tokens,vite \"unison-tokens build --watch --config unison.config.ts --out .unison\" \"vite\"",
"build": "pnpm tokens && tsc -b && vite build",
"typecheck": "pnpm tokens && tsc -b --noEmit"
```

`web-next`: the same with `next dev` / `next build`; `mobile`: `dev` runs the watcher next to
`expo start`, and `typecheck` runs `pnpm tokens` first. Add `concurrently` to each app with
`pnpm --filter <app> add -D concurrently`.

CSS imports, relative to each CSS file: `apps/web-vite/src/index.css` →
`@import "../.unison/web/tokens.css";` and `@import "../.unison/web/theme-strict.css";`;
`apps/web-next/src/app/globals.css` → `../../.unison/web/…`; `apps/mobile/src/global.css` →
`@import "../.unison/native/theme.css";`. The native `.unison/native/theme.js` goes into the
`UnisonProvider` in Task 19.2; until then, the mobile parity route imports it directly.

- [ ] **Step 4: Run, confirm it passes** — `pnpm test && pnpm build` → passes; `git status --short` lists no `.unison/` files.
- [ ] **Step 5: Live-reload check** (the phase 1 gate depends on it). With `pnpm dev:web` running,
change `accent` in `apps/web-vite/unison.config.ts` to `"blue"`. Within 2 s the watcher prints
`wrote .unison/web/tokens.css`, and Playwright reads a new `--unison-color-accent-600` on
`http://localhost:5173/` with the dev server still running. Revert. Same for `web-next`. On
mobile, Metro must pick up changes under `.unison/`; if it ignores the dot folder, stop and treat
that as a finding.
- [ ] **Step 6: Done-when check**

Run: `pnpm --filter web-vite tokens && grep -c '\[data-unison-theme="brand"\]' apps/web-vite/.unison/web/tokens.css && node -e 'import("./apps/web-vite/.unison/native/theme.js").then(m=>console.log(Object.keys(m.themes), Object.keys(m.themes.brand)))'`
Expect: a count of at least 1, then `[ 'default', 'brand' ] [ 'light', 'dark' ]`. ⚠ OQ-2 blocks
this until answered (brand fails its dark contrast check).

- [ ] **Step 7: Commit** `feat(tokens): named themes with extends`

---

Runtime API shared by web and native (types in `@unison-ui/core`, so the contract test can compare
them):

```ts
// packages/core/src/theme.types.ts
import type { ReactNode } from "react";
export type ColorScheme = "light" | "dark" | "system";
export type ResolvedScheme = "light" | "dark";
export interface ThemeState {
  scheme: ColorScheme;
  resolvedScheme: ResolvedScheme;
  setScheme: (scheme: ColorScheme) => void;
  theme: string;
  setTheme: (theme: string) => void;
  themes: readonly string[];
}
export interface ThemeScopeProps { theme?: string; scheme?: ResolvedScheme; children?: ReactNode }
```

Storage keys: `<storageKey>-scheme` and `<storageKey>-theme` (default `storageKey` `"unison"`).
The phase 0 key `unison-theme` held the scheme and is no longer read.

### Task 19.1: Web runtime (`@unison-ui/react`)

**Files:**
- Create: `packages/core/src/theme.types.ts` (exported from core's index)
- Create: `packages/react/src/theme-script.tsx`, `src/theme-provider.tsx`, `src/theme-scope.tsx`
- Modify: `packages/react/src/index.ts`, `packages/ui/test/contract.test-d.ts` (⚠ OQ-18)
- Test: `packages/react/test/theme-script.test.ts`, `test/theme-scope.test.tsx` (full coverage in Task 22d)

**Interfaces:**
- Consumes: `ThemeState`, `ThemeScopeProps`, `ColorScheme` (above)
- Produces:
  - `themeScript(o?: { storageKey?: string; defaultScheme?: ColorScheme; defaultTheme?: string }): string` (a self-contained IIFE)
  - `ThemeScript(props: same options): JSX.Element` (`<script dangerouslySetInnerHTML={{ __html: themeScript(props) }} />`; no `"use client"`, server-safe)
  - `"use client"` `ThemeProvider(props: { themes: readonly string[]; defaultTheme?: string; defaultScheme?: ColorScheme; storageKey?: string; children: ReactNode })`
  - `useTheme(): ThemeState` (outside a provider it throws `useTheme must be used inside ThemeProvider`)
  - `ThemeScope(props: ThemeScopeProps)` → `<div style={{ display: "contents" }} data-unison-theme={theme} data-theme={scheme}>`

Behaviour: the script reads both keys (storage errors ignored), resolves `system` with
`matchMedia("(prefers-color-scheme: dark)")`, and sets `data-theme` to the **resolved** scheme and
`data-unison-theme` to the theme. The provider's initial state reads what the script set, so
there's no hydration mismatch and no flash. While `scheme === "system"`, a `matchMedia` change
listener updates `resolvedScheme` and the attribute. `setScheme` / `setTheme` write storage and
the attributes. A `storage` event for either key updates state (cross-tab sync).

- [ ] **Step 1: Write the failing tests** (Task 22d adds the rest): run `themeScript()` with
`new Function(script)()` in jsdom after `localStorage.setItem("unison-scheme", "dark")` and
`localStorage.setItem("unison-theme", "brand")`; `document.documentElement.dataset` is
`{ theme: "dark", unisonTheme: "brand" }`. `ThemeScope` renders a `div` whose `style` is
`display: contents;`.
- [ ] **Step 2: Run, confirm they fail** — `pnpm --filter @unison-ui/react test` → FAIL.
- [ ] **Step 3: Implement.** ⚠ OQ-18: the `ui` contract test compares export names, so web-only
and native-only exports go into explicit allowlists in `contract.test-d.ts`:

```ts
type WebOnly = "ThemeScript" | "themeScript" | "ThemeProvider";
type NativeOnly = "UnisonProvider";
expectTypeOf<Exclude<keyof typeof Web, WebOnly>>().toEqualTypeOf<Exclude<keyof typeof Native, NativeOnly>>();
```
- [ ] **Step 4: Run, confirm they pass** — `pnpm --filter @unison-ui/react test && pnpm --filter @unison-ui/ui test`.

### Task 19.2: Native runtime (`@unison-ui/native`)

**Files:**
- Create: `packages/native/src/provider.tsx`, `src/theme-scope.tsx`
- Modify: `packages/native/src/theme.ts` (`useUnisonTheme` reads context), `src/box.tsx`, `src/index.ts`
- Test: `packages/native/test/provider.test.tsx` (full coverage in Task 22e)

**Interfaces:**
- Consumes: `ThemeState`, `ThemeScopeProps`, `ColorScheme`, `ResolvedScheme` (core), `UnisonTheme` (Task 16)
- Produces:
  - `interface StorageAdapter { getItem(key: string): string | null | Promise<string | null>; setItem(key: string, value: string): void | Promise<void> }`
  - `UnisonProvider(props: { themes: Record<string, { light: UnisonTheme; dark: UnisonTheme }>; defaultTheme?: string; defaultScheme?: ColorScheme; storage?: StorageAdapter; storageKey?: string; onThemeChange?: (theme: string, scheme: ResolvedScheme) => void; children: ReactNode })`
  - `useTheme(): ThemeState & { tokens: UnisonTheme }`
  - `ThemeScope(props: ThemeScopeProps)`: a nested provider that overrides `theme` / `resolvedScheme` / `tokens` for its subtree
  - `useUnisonTheme(): UnisonTheme` = `useTheme().tokens`; outside a provider it falls back to `themes.default` from `@unison-ui/tokens/native` and the system scheme, so phase 0 tests keep passing

Behaviour: forcing `light` / `dark` calls `Appearance.setColorScheme(scheme)`; `system` calls
`Appearance.setColorScheme("unspecified")` and follows `useColorScheme()`. The native Tailwind
engine is notified only through `onThemeChange`, the one adapter function, which the app
supplies: the demo passes
``(theme, scheme) => Uniwind.setTheme(theme === "default" ? scheme : `${theme}-${scheme}`)``
(⚠ OQ-19). A library package never imports `uniwind`.

- [ ] **Step 1: Write the failing test**: render `<UnisonProvider themes={themes} storage={mock}>`
where `mock.getItem("unison-theme")` resolves to `"brand"`; after it resolves,
`useTheme().theme` is `"brand"` and `useTheme().tokens` is `themes.brand.light`.
- [ ] **Step 2: Run, confirm it fails** — `pnpm --filter @unison-ui/native test` → FAIL.
- [ ] **Step 3: Implement**; `Box` reads `useUnisonTheme()` (context).
- [ ] **Step 4: Run, confirm it passes.**

### Task 19.3: Demo apps: settings bar and scoped panel

**Files:**
- Create: `packages/demo-content/src/settings.ts` (`SCHEMES = ["system", "light", "dark"] as const`, `THEMES = ["default", "brand"] as const`)
- Delete: `apps/web-next/src/app/theme-toggle.tsx`, `apps/web-vite/src/theme-toggle.tsx`, and the inline scripts in `layout.tsx` / `index.html`
- Create: `apps/web-next/src/app/settings-bar.tsx`, `apps/web-vite/src/settings-bar.tsx`, `apps/mobile/src/settings-bar.tsx`
- Modify: `apps/web-next/src/app/layout.tsx` (`<ThemeScript />` in `<head>`, `<ThemeProvider>`), `apps/web-vite/vite.config.ts` (a `transformIndexHtml` hook injects `themeScript()` into `<head>`, so it can't go stale), `apps/web-vite/src/main.tsx`, `apps/mobile/src/app/_layout.tsx` (`UnisonProvider` with `.unison/native/theme.js`, an AsyncStorage adapter, `onThemeChange`), the three home screens
- Modify: `apps/mobile/package.json` (`npx expo install @react-native-async-storage/async-storage`)
- Modify: `packages/parity/tests/web.spec.ts` and `packages/parity/maestro/case.yaml` if they use `theme-toggle`

**Interfaces:**
- Consumes: `ThemeScript`, `themeScript`, `ThemeProvider`, `useTheme`, `ThemeScope` (19.1), `UnisonProvider`, native `useTheme` / `ThemeScope` (19.2), `SCHEMES`, `THEMES`
- Produces test ids used by Tasks 20–22 and 25: `settings-scheme-<system|light|dark>`, `settings-theme-<default|brand>`, `scoped-panel`

Settings bar: one button per scheme and per theme; the active one has `aria-pressed="true"`
(web) or `accessibilityState={{ selected: true }}` (native). The scoped panel is
`<ThemeScope theme="brand" scheme="dark">` around a card with `bg-surface text-fg` and an
`accent` swatch. On native the card is styled from `useTheme().tokens`, not `className`:
Uniwind's theme is global and wouldn't follow a nested scope (⚠ OQ-19).

- [ ] **Step 1: Web checks** (Playwright, both apps, `pnpm dev:web` running): for each of the
2 themes × 3 schemes, click the buttons and read `html[data-theme]`, `html[data-unison-theme]`,
the computed background of `main` and of the `scoped-panel` card. The card shows brand-dark
values in every combination. Reload each combination: an `addInitScript` that records
`document.documentElement.dataset.theme` at `DOMContentLoaded` sees the final value (no flash).
- [ ] **Step 2: Native checks** (⚠ OQ-14): the same 6 combinations by hand on both simulators;
kill and reopen the app, and the choice is kept (AsyncStorage adapter).
- [ ] **Step 3: Done-when check**

Run: `pnpm check && pnpm test:parity --platform web`
Expect: passes. Plus the Step 1 script: 6 combinations × 2 apps, every line `ok`, no flash.
Native: "verified on iOS and Android" or "unverified, needs Mark" in the commit body.

- [ ] **Step 4: Commit** `feat: runtime theme switching on web and native`

---

# Section 8: Showcase and parity

### Task 20.1: Showcase data

**Files:**
- Create: `packages/demo-content/src/showcase-data.ts`; Modify: `packages/demo-content/src/index.ts` (or the package's entry), `package.json` (`@unison-ui/tokens` dependency, types only)
- Test: `packages/demo-content/test/showcase-data.test.ts` (add `vitest` and a `test` script to demo-content)

**Interfaces:**
- Consumes: `tokens.json` shape (Task 16), `TEXT_STYLES` names, `PRESETS` names, `springPosition` (Task 12, from `@unison-ui/tokens/spring`)
- Produces:
  - `type ShowcaseItem =
      | { kind: "swatch"; token: string; value: string; contrast?: { on: string; ratio: number; pass: boolean } }
      | { kind: "palette"; name: string; steps: { step: number; value: string }[] }
      | { kind: "text"; token: string; style: string; size: number; lineHeight: number; sample: string }
      | { kind: "space"; token: string; px: number }
      | { kind: "radius"; token: string; px: number }
      | { kind: "elevation"; token: string; shadow: string }
      | { kind: "motion"; preset: string; curve: number[] /* 32 samples of the preset's enter spring, empty for timing */ }`
  - `interface ShowcaseSection { id: "semantic-colors" | "palettes" | "typography" | "space" | "radius-elevation" | "motion"; title: string; items: ShowcaseItem[] }`
  - `showcaseSections(tokens: TokensJson, theme: string, scheme: "light" | "dark"): ShowcaseSection[]`
  - `SAMPLE_TEXT = "The quick brown fox — 1234567890"`

Rules: semantic colours in the todo's step 5 order; `contrast` is the item's first contrast entry
from `tokens.json` (text tokens only); palettes are the six built-in palettes (gray, accent,
success, warning, danger, info) × 11 steps; typography in `TEXT_STYLES` order; space in the
todo's step 9 order; `radius-elevation` = the four semantic radii then the three elevations.

- [ ] **Step 1: Write the failing test**: for the default `tokens.json`, the section ids come in
the todo's order; `palettes` has 6 items with 11 steps each; `typography` has 10; every
`swatch.contrast?.pass` is `true` for the default theme; the output is identical for two calls.
- [ ] **Step 2: Run, confirm it fails.**
- [ ] **Step 3: Implement** (a pure function, no React, no platform imports).
- [ ] **Step 4: Run, confirm it passes.**

### Task 20.2: Web routes

**Files:**
- Create: `apps/web-next/src/app/tokens/page.tsx`, `apps/web-next/src/app/tokens/showcase.tsx` (`"use client"`)
- Create: `apps/web-vite/src/tokens-page.tsx`; Modify: `apps/web-vite/src/main.tsx` (route `/tokens`)
- Modify: both home pages (a link to `/tokens`); remove the `motion-probe` and `dark-scope` probes (Tasks 13.2, 14), now covered by the showcase
- Note: demo-content holds the data only; each app renders it (app code, not library code)

**Interfaces:**
- Consumes: `showcaseSections` (20.1), `.unison/tokens.json`, `useTheme` (19.1), `useWaapi` / `toWaapi` (13.2), `motionPresets` from `.unison/motion.js`
- Produces test ids: `section-<id>`, `swatch-<token>`, `badge-<token>` (text `pass` / `fail`), `play-<preset>`, `reduced-switch`, `motion-card`, `curve-<preset>`

Layout with Tailwind classes (`grid`, `gap-4`, `p-4`, `rounded-card`, `text-body`, …). Dynamic
values (swatch colours, shadows, radii) go through `style` with `var(--unison-…)` on web, because
Tailwind can't see class names built at runtime. The settings bar from 19.3 is at the top.
Motion: "Play" runs `element.animate(...toWaapi(preset, "enter", { reduced }))`, where
`reduced` = the switch OR `useReducedMotion()`. The curve is a 120 × 40 SVG `polyline` of
`item.curve`.

- [ ] **Step 1:** Playwright (both apps): `/tokens` has the six `section-*` ids in order, 6 × 11
palette cells, 10 type lines; with the default theme in both schemes every `badge-*` reads
`pass`; clicking `play-scale-in` starts an animation (`document.getAnimations().length > 0`);
with `reducedMotion: "reduce"` the running animation's keyframes only contain `opacity`.

### Task 20.3: Expo route (⚠ OQ-14 for the device checks)

**Files:**
- Create: `apps/mobile/src/app/tokens.tsx`; Modify: `apps/mobile/src/app/index.tsx` (link)

**Interfaces:**
- Consumes: `showcaseSections`, `.unison/tokens.json`, native `useTheme` (19.2), `useReanimatedPhase` / `toReanimated` (13.2, `@unison-ui/motion/reanimated`), `react-native-reanimated`'s `useSharedValue` / `useAnimatedStyle`

Same sections and test ids (`testID`). Colours via `style` from `useTheme().tokens`; layout via
`className`. The curve is drawn with absolutely positioned 2 × 2 `View`s (no SVG dependency).

- [ ] **Step 1: Done-when check**: all four surfaces (Next, Vite, iOS, Android) show six sections
for both themes and both schemes; every badge passes for the default theme; the motion section
looks the same side by side on web and a simulator (manual: overshoot and timing). Web is
covered by 20.2's script; native by hand, or "unverified, needs Mark".
- [ ] **Step 2: Commit** `feat(demo): token showcase`

---

### Task 21.1: Theme dimension and platform-specific registry

**Files:**
- Modify: `packages/parity/src/fixtures/index.ts` (`THEMES`, run ids `component/case/theme/scheme`), `src/types.ts` (`Metrics.parts: Record<string, Rect>`, `Metrics.samples?: Record<string, { x: number; y: number }>`)
- Create: `packages/parity/src/registry.web.tsx`, `src/registry.native.tsx`; Delete: `src/registry.tsx`
- Modify: `packages/parity/package.json` (`"./registry": { "types", "react-native": "./dist/registry.native.js", "default": "./dist/registry.web.js" }`), `tsdown.config.ts`
- Modify: `apps/web-vite/src/parity-page.tsx` (`?theme=` sets `data-unison-theme`), `apps/mobile/src/app/parity/[component]/[case].tsx` (wrap in `ThemeScope`/provider for `theme`, report `parts` and `samples`), `packages/parity/tests/web.spec.ts`, `packages/parity/maestro/case.yaml`, `scripts/run.ts`, `scripts/compare.ts`, `scripts/report.ts`
- Rename: `packages/parity/baselines/*/box/<case>/<scheme>.png` → `box/<case>/default/<scheme>.png` (`git mv`)

**Interfaces:**
- Consumes: `ThemeScope` (19.1, 19.2)
- Produces:
  - `THEMES = ["default", "brand"] as const`; `interface Run { id: string; component: string; caseName: string; theme: string; scheme: Scheme; props: object }`
  - Fixtures declare `themes?: readonly string[]` (default `["default"]`; the token fixtures use `["default", "brand"]`); `box` keeps `["default"]`
  - Registry modules export the same `registry`, `getParityCase`, `fixtures`, `SCHEMES`, `THEMES`
  - Stage contract addition: every fixture reports named `parts` (`subject` plus fixture parts such as `swatch-0` … `swatch-11`, `line-caption` …) and optional `samples` (centre points, stage-relative)

- [ ] **Step 1:** Update `compare.ts`'s cross-platform loop to compare every part present on both
platforms (±1 px on `x`, `y`, `width`, `height`, unless the fixture says otherwise; see 21.2).
Existing compare tests (phase 0, `packages/parity` unit tests if any) still pass with the
`box` runs, now named `box/accent/default/light` etc.
- [ ] **Step 2:** `pnpm test:parity --platform web` → passes with the renamed baselines.

### Task 21.2: Token fixtures and the colour sampler

**Files:**
- Create: `packages/parity/src/fixtures/{swatches,type-ramp,radius,elevation}.ts` and their components in `src/fixtures/components/{web,native}/*.tsx`
- Modify: `packages/parity/scripts/compare.ts` (colour sampler, per-fixture checks), `package.json` (`culori` dev dependency)
- Test: `packages/parity/test/compare.test.ts` (sampler unit test on two hand-made PNGs)

**Interfaces:**
- Consumes: `cssVar` (web components), `token` / `useUnisonTheme` (native components), `Metrics` (21.1)
- Produces:
  - Fixture spec field `check: "layout" | { layout: true; color: { maxDeltaE: number } } | { layout: "height-y" }`
  - `sampleColor(png: PNG, point: { x: number; y: number }, pixelRatio: number): string /* hex */`
  - `deltaE2000(a: string, b: string): number` (culori `differenceCiede2000`)

Fixtures (from the todo):

| Fixture | Renders | Cross-platform check | Baselines |
| --- | --- | --- | --- |
| `swatches` | 12 semantic colours (⚠ OQ-10 set) as 40 × 40 squares, 6 × 2 grid, 8 px gaps | layout ±1 px **and** centre colour ΔE2000 ≤ 3 | yes |
| `type-ramp` | each text style as one line "Ag Hamburgefonstiv", stacked, no gaps | height and y of each line ±1 px; widths skipped | yes |
| `radius` | one 64 × 64 box per semantic radius | layout only | yes |
| `elevation` | one card per elevation on `canvas` | layout only | yes (same-platform only) |

- [ ] **Step 1: Write the failing test** for the sampler: a 4 × 4 PNG filled with `#535cda`,
sampled at (1, 1) with pixel ratio 2, returns `#535cda`; `deltaE2000("#535cda", "#535cda")` is 0
and `deltaE2000("#535cda", "#5b5bd6")` is above 1.
- [ ] **Step 2: Run, confirm it fails.**
- [ ] **Step 3: Implement** the fixtures and the sampler. Cross-platform colour compare reads each
platform's screenshot at `samples[part] × pixelRatio` and fails with
`FAIL swatches/all/brand/dark: swatch-3 colour web-chromium=#… ios=#… (ΔE 4.12 > 3)`.
- [ ] **Step 4: Run, confirm it passes.**

### Task 21.3: Run on all platforms (⚠ OQ-14)

- [ ] **Step 1:** `pnpm test:parity --update` then `pnpm test:parity`, on web here, and on iOS and
Android on a Mac or through CI (`workflow_dispatch` with `update_baselines`).
Expect: `parity ok (<n> runs)`, with the report listing swatches, type-ramp, radius and
elevation for 2 themes × 2 schemes.
- [ ] **Step 2: Sabotage** (then revert both):
  - native `title` line height → 30 (`.unison/native/theme.js` `text.title.lineHeight`) → `FAIL type-ramp/all/default/light: line-title.height …`
  - native `accent` hex nudged a few steps (`#535cda` → `#4b53cf`) → `FAIL swatches/…: swatch-8 colour …`
  Native sabotage needs a native run; on web only, sabotage the web side the same way.
- [ ] **Step 3: Check the browser gamut behaviour** (OQ-10): record in the commit body whether
Chromium and WebKit clip or gamut-map out-of-gamut `oklch()` (compare the sampled colour of a
`warning.400` dark square with both culori results).
- [ ] **Step 4: Commit** `test(parity): token fixtures`

---

# Section 9: Tests, docs and release

### Task 22a: Property-based tests

**Files:** Test: `packages/tokens/test/property.test.ts`; Modify: `packages/tokens/package.json` (`pnpm --filter @unison-ui/tokens add -D fast-check`)

**Interfaces:** Consumes `generateScale`, `STEPS` (Task 4), `autoAdjust` (Task 6)

```ts
import fc from "fast-check";
import { inGamut, parse } from "culori";

const hue = fc.double({ min: 0, max: 360, noNaN: true });
const chroma = fc.double({ min: 0, max: 0.37, noNaN: true });
const mode = fc.constantFrom("light", "dark" as const);

it("scales are monotonic, in sRGB and deterministic for any hue and chroma", () => {
  fc.assert(fc.property(hue, chroma, mode, (h, c, m) => {
    const a = generateScale({ name: "x", hue: h, chroma: c, mode: m });
    const ls = STEPS.map((s) => Number(/oklch\(([\d.]+)/.exec(a[s].oklch)?.[1]));
    const ok = ls.every((l, i) => i === 0 || (m === "light" ? l < (ls[i - 1] as number) : l > (ls[i - 1] as number)));
    return ok && STEPS.every((s) => inGamut("rgb")(parse(a[s].hex))) &&
      JSON.stringify(a) === JSON.stringify(generateScale({ name: "x", hue: h, chroma: c, mode: m }));
  }));
});

it("autoAdjust terminates within 100 steps for any seed (⚠ OQ-4)", () => {
  const hex = fc.integer({ min: 0, max: 0xffffff }).map((n) => `#${n.toString(16).padStart(6, "0")}`);
  fc.assert(fc.property(hex, hex, (fg, bg) => {
    const steps = { n: 0 };
    autoAdjust(fg, bg, 4.5, steps); // the optional 4th argument counts iterations
    return steps.n <= 100;
  }));
});
```

(`autoAdjust` gains an optional `counter?: { n: number }` parameter for this test.)

### Task 22b: Output snapshots and config validation

**Files:** Test: `packages/tokens/test/outputs.test.ts`, `test/__snapshots__/outputs.test.ts.snap`; extend `test/config.test.ts`

- Build the demo config (`default` + `brand`, the Task 18 content) into a temp dir; one
`toMatchFileSnapshot` per file: `tokens.css`, `theme.css`, `theme-strict.css`,
`native/theme.js`, `types.d.ts` (stored under `test/__snapshots__/outputs/`, so a token change
shows up as a readable diff). ⚠ OQ-2 blocks this until brand builds.
- Config validation: the Task 17 table already covers one valid and one invalid value for every
`defineTheme` option; add `fonts` (`{ sans: "Geist" }` valid, `{ sans: 42 }` invalid), `overrides`
(both cases) and `extends` (valid parent, unknown parent).

### Task 22c: Build performance

Run: `pnpm --filter web-vite exec unison-tokens build --config unison.config.ts --out .unison` under `time`.
Expect: `real` under `1.0s`. If slower, profile (`node --cpu-prof`) before adding themes; record
the time in the commit body.

### Task 22d: Web runtime tests (jsdom)

**Files:** Test: `packages/react/test/theme-script.test.ts`, `test/theme-provider.test.tsx`, `test/theme-scope.test.tsx`

- `ThemeScript`: render to static markup, extract the script, execute it; it sets both
attributes from storage, and with empty storage + `matchMedia` dark it sets `data-theme="dark"`
and `data-unison-theme="default"`. A throwing `localStorage` (getter that throws) leaves the
defaults and doesn't throw.
- `ThemeProvider`: with a mocked `matchMedia` (`vi.fn` returning a list with `addEventListener`),
`scheme === "system"` follows a dispatched change; `setScheme("dark")` writes
`unison-scheme = dark`; a `StorageEvent` with `key: "unison-theme", newValue: "brand"` updates
`useTheme().theme`.
- `ThemeScope`: `display: contents` and both attributes.

### Task 22e: Native runtime tests (Jest) and the contract test

**Files:** Test: `packages/native/test/provider.test.tsx`; Modify: `packages/ui/test/contract.test-d.ts`

- `UnisonProvider` with a mock storage adapter restores the saved theme; `useTheme().tokens`
switches from `themes.default.light` to `.dark` when `setScheme("dark")` is called; forcing a
scheme calls `Appearance.setColorScheme("dark")` (spy), and `system` calls it with
`"unspecified"`; `onThemeChange` is called with `("brand", "dark")`.
- Contract (⚠ OQ-18): `Omit<ReturnType<typeof Native.useTheme>, "tokens">` equals
`ReturnType<typeof Web.useTheme>`; `ComponentProps<typeof Web.ThemeScope>` equals
`ComponentProps<typeof Native.ThemeScope>`; the only extra key on native is `tokens`.

### Task 22f: Coverage and the full run

**Files:** Modify: `packages/tokens/vitest.config.ts`: `coverage: { provider: "v8", reporter: ["text"], include: ["src/**"], thresholds: { lines: 90 } }`

- [ ] **Done-when check**

Run: `pnpm check && pnpm test:parity`
Expect: passes, and the tokens package's coverage table shows `All files` lines above 90 %
(vitest fails the run below the threshold). Native parity needs devices or CI (⚠ OQ-14).

- [ ] **Commit** `test: phase 1 test sweep`

---

### Task 23: Docs and ADRs (todo step 23)

**Files:**
- Create: `tooling/scripts/docs-tokens.ts`; Modify: root `package.json` (`"docs:tokens": "tsx tooling/scripts/docs-tokens.ts"`), `.github/workflows/ci.yml` (`check` job: `pnpm docs:tokens && git diff --exit-code docs/tokens.md`)
- Create: `docs/tokens.md` (generated), `docs/theming.md`, `docs/motion.md`; Modify: `docs/tailwind.md` (Task 15), `docs/fonts.md` (Task 8), `docs/architecture.md` (the token pipeline)
- Create: `docs/adr/0012-oklch-generation-and-gamut-mapping.md`, `0013-eleven-step-scales-and-dark-ramps.md`, `0014-wcag-enforced-apca-informational.md`, `0015-inter-and-native-font-faces.md`, `0016-native-shadows.md` (started in Task 10.2), `0017-semantic-only-token-access.md`, `0018-theme-attributes-and-scoping.md`, `0019-app-config-and-unison-folder.md`, each from `docs/adr/0000-template.md`

**Interfaces:**
- Consumes: `packages/tokens/dist/tokens.json` (Task 16)
- Produces: `docs/tokens.md`: one table per scheme of every semantic token (`Token | Light | Dark | Alias | Use`), sorted by path, with a "generated, don't edit" header

Content requirements:
- `docs/theming.md`: every `defineTheme` option with its values and default; named themes and
`extends`; setup for Next.js (`ThemeScript` in `layout.tsx`, `ThemeProvider`), Vite
(`themeScript()` in `index.html`), Expo (`UnisonProvider` in `_layout.tsx`, storage adapter,
`onThemeChange` for Uniwind); `ThemeScope`; the `.unison/` scripts (no `pre*` scripts, OQ-9).
- `docs/motion.md`: the preset table, which spring when, the reduced-motion rules, and exits
running at about 70 % of the matching enter.
- Each ADR records the answers to the open questions that touch it (OQ-1/2/3 in 0012–0014,
OQ-7 in 0017, OQ-8 in 0018, OQ-9 in 0019). Status Accepted, except 0016 if the spike stayed
unverified.

- [ ] **Done-when check**: `pnpm docs:tokens && git diff --exit-code docs/tokens.md` exits 0. Then
follow `docs/theming.md` alone in two scratch apps outside the repo (`npx create-next-app@latest`
and `npx create-expo-app@latest` in the scratchpad), installing the workspace packages with
`pnpm pack` tarballs. Both render a `bg-surface` / `text-fg` page with a custom accent. Every
place where you had to guess becomes a docs fix in this commit.
- [ ] **Commit** `docs: phase 1 docs and ADRs`

---

### Task 24: Release 0.1.0 (todo step 24; human-only parts)

**Files:** Create: `.changeset/phase-1-tokens.md`, `.changeset/phase-1-theming.md`, `.changeset/phase-1-motion.md` (`pnpm changeset`, `minor` for every public package; the `fixed` group keeps them in step)

- [ ] **Step 1:** Add the changesets; `pnpm changeset status` lists `@unison-ui/*` at `minor`.
- [ ] **Step 2 (Mark):** open the PR and label it `snapshot`; install the snapshot in a fresh
Next.js app and a fresh Expo app outside the monorepo, following `docs/theming.md` word for word.
Fix the docs wherever you had to guess (those fixes are normal commits on the branch).
- [ ] **Step 3 (Mark):** merge the "Version packages" PR. The release workflow publishes.
- [ ] **Done-when check**: `npm view @unison-ui/tokens@0.1.0 dist.attestations` (and the same for
`core`, `motion`, `react`, `native`, `ui`) shows a provenance attestation; both outside apps
render swatches and the type ramp with a custom `defineTheme` config. Commit: made by the
Changesets bot.

---

# Section 10: Final acceptance

### Task 25: Clean-clone run and the phase 1 gate (todo step 25; macOS)

Clone into a new folder and go through the list in order, without editing any file:

- [ ] `pnpm install`, `pnpm run doctor`, `pnpm check`, `pnpm check:packages` all pass
- [ ] `pnpm test:parity` passes on web-chromium, web-webkit, iOS and Android, all fixtures × 2 themes × 2 schemes
- [ ] **Gate:** with `pnpm dev` running, change `accent` from `"indigo"` to `"teal"` in all three
`unison.config.ts`; each surface updates without a manual restart. ⚠ OQ-1: with the todo's values
this build fails (`contrast: theme default, scheme light, color.ring on color.surface is 2.87:1 (needs 3:1)`)
- [ ] `/tokens` on all four surfaces shows every section; all default-theme badges pass
- [ ] 2 themes × 3 schemes switch instantly; no flash on web reload; the scoped panel stays brand-dark
- [ ] With the OS reduce-motion setting on, every preset in the motion section only fades, on all four surfaces
- [ ] `bg-blue-500` produces nothing in the strict web apps; `token(theme, "color.gray.500")` is a type error
- [ ] A yellow accent (`#facc15`) builds; its `on-accent` text is legible (5.07:1). ⚠ OQ-3: it
prints no auto-contrast warning
- [ ] `docs/tokens.md` is up to date (the CI check passes); every new decision has an ADR
- [ ] `0.1.0` is on npm; the two outside apps from Task 24 still work after a fresh `pnpm install`

**When everything passes (Mark):** tag `phase-1-complete`, push the tag, and tick the Phase 1 gate
in `docs/planning/roadmap.md`.

---

## Self-review notes

- Spec coverage: every todo step 1–25 has a task (0 → Task 1 Step 0). Every Done-when is the
  last check of its task or sub-task. Deviations are only behind ⚠ OQ markers.
- Name consistency, checked across tasks: `buildTheme` / `ThemeBuildOptions` (6→17),
  `ThemeBuild` / `SchemeBuild` (6→14, 15, 16), `Resolved` / `ResolvedToken` (2→all), `cssVarName`
  (14, in `paths.ts`), `nativeKey` (16), `MotionPresetValue` / `PresetPhase` /
  `ResolvedTransition` (13.1→13.2, 16, 20), `SemanticTokenPath` / `SemanticTokenValues` (16→17,
  19), `ThemeState` / `ThemeScopeProps` (19→22e), `showcaseSections` (20.1→20.2, 20.3).
- Order: each task uses only what earlier tasks produce. The interim legacy emitter adapter
  (Task 1) keeps `pnpm check` green until Tasks 14 and 16 replace it.
