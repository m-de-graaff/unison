# Phase 0 (Setup): Implementation Plan

Nov 19, 2026 · source: [`docs/planning/todos/phase-0.md`](../planning/todos/phase-0.md) (the source of truth)

> **To execute:** use the `executing-plans` skill. Steps use `- [ ]` for tracking. Tasks are
> numbered after the todo's steps (Task 7 = todo step 7). Some steps are split into sub-tasks
> (17.1–17.6, 18a–18f). **A split step still gets exactly one commit**, made at the end of its
> last sub-task with the todo's commit message.
>
> This plan is a hypothesis about work not yet done. If a command's real output differs from the
> "Expect" line, stop and treat it as a finding (see `executing-plans`). Don't push past it.

**Goal:** a pnpm + Turborepo monorepo where one `pnpm dev` runs a Next.js, a Vite and an Expo demo,
every package builds for web and native, CI checks parity between platforms, and a placeholder
`Box` (plus `MotionBadge`) proves the pipeline end to end. No real components are built.

**Architecture:** the token source (DTCG JSON) compiles to CSS variables, a Tailwind v4 `@theme`
file and a typed native theme. The platform-free packages (`tokens`, `core`, `motion/shared`) are
consumed by two renderer packages (`react`, `native`). `@unison-ui/ui` picks one through the
`react-native` / `browser` / `default` export conditions. Apps consume the packages' built `dist/`.
The parity harness renders fixtures on four platforms and compares layout metrics across
platforms, and screenshots against baselines within each platform.

**Tech stack:** see "Current versions". The todo says "install with `@latest` and let the
lockfile pin it". That table only records what `@latest` resolves to today, so drift during
execution is visible. Don't hand-type those numbers into files, except the catalog entries
(Task 3), which the todo requires.

---

## Confirmed decisions (with Mark, Nov 19, 2026)

| Decision | Answer | Matches todo default? |
| --- | --- | --- |
| Native support | **Expo only** for v1; bare React Native isn't tested | Yes (ADR 0003) |
| Minimum versions | **React 19 + React Native New Architecture only** | Yes (ADR 0004) |
| Licence | **MIT** | Yes (ADR 0010) |

concept.md still says "React Native (Expo, bare)" in its vision and lists these as open. See
OQ-9 on whether to update the docs.

---

## Answers (Nov 19, 2026)

| OQ | Answer |
| --- | --- |
| 1 | pnpm 12 (`@latest`); workspace settings in `pnpm-workspace.yaml` (`.npmrc` kept as the todo says) |
| 2 | TypeScript **7.0.2** in the catalog |
| 3 | Node **26**, `.nvmrc` `26`, `engines.node` `^26`; install Corepack with `npm i -g corepack` |
| 4 | `biome.json` excludes `**/*.md` and `.claude` |
| 5 | Repo stays `m-de-graaff/unison`; npm scope stays `@unison-ui` |
| 6 | Single branch `feat/monorepo-foundation`, one commit per todo step |
| 7–12, 14–16 | Plan defaults: no `cli` shell; ADR 0006 Proposed; docs untouched except the final gate tick; `react-native` peer `>=0.88`, required; no React Compiler / AGENTS.md / Cache Components; remove oxlint, add `@types/react-dom` to the catalog; compare only platforms present; self-import for `UnisonTheme`; three tsconfigs for `motion` |
| 13 | `deps: { neverBundle: [...] }` instead of `external` |
| 17 | Do everything possible here; mark checks that need a Mac, simulators or accounts as "unverified, needs Mark" and continue |

## Open questions

These are places where the todo is ambiguous, contradicts the concept or roadmap, or no longer
matches the current tools. **Answer them before you execute the tasks they block.** Where a
task can't be written without picking an answer, it follows the todo literally and marks the
affected step with **⚠ OQ-n**. Stop at that marker if the question is still open.

**OQ-1: pnpm 12 ignores pnpm settings in `.npmrc`** (blocks Task 3).
`pnpm@latest` is 12.21.0. I checked: with `node-linker=hoisted` in `.npmrc`, pnpm 12 reports
`config get node-linker` → `undefined`. pnpm 10 reports `hoisted`. pnpm 12 reads `nodeLinker:
hoisted` from `pnpm-workspace.yaml`. If you follow the todo's `.npmrc` literally, the
"single `node_modules` at the root" check in step 3 fails, and so does the Metro assumption
behind it. Options: (a) put the four settings in `pnpm-workspace.yaml` as `nodeLinker`,
`autoInstallPeers`, `strictPeerDependencies` and `linkWorkspacePackages`, and keep or drop
`.npmrc`; (b) pin pnpm 10 instead of `@latest`.

**OQ-2: Which TypeScript version goes in the catalog?** (blocks Task 3).
The todo says `typescript: <latest>`. Latest is **7.0.2**, the native (Go) compiler. The Expo
SDK 58 templates pin **`typescript ~6.0.3`**. The Vite `react-ts` template pins `~7.0.2`. There
is only one catalog entry. TS 7 compatibility is not yet proven for `tsdown` dts generation,
`vitest --typecheck` and `expo-doctor`. Options: 7.0.2 (follow "latest" and fix what breaks),
or 6.0.x (follow Expo, which the todo treats as "the strictest consumer" for React).

**OQ-3: Which Node major for `.nvmrc`, and what about Corepack?** (blocks Task 2).
The current Active LTS is **Node 26** (26.13.1, "Lithium"). Node 24 (24.22.3) is in maintenance.
This container runs 22.23.5. The todo's example is `22` with `engines: ">=22"`. Two problems:
- `engines: ">=22"` only warns for an *older* major. The Done-when says "a different Node major
  warns", which would need an exact range such as `"^26"`.
- Node 25 and later no longer bundle Corepack, so `corepack enable` and `corepack use` need
  `npm i -g corepack` first on Node 26. The todo assumes Corepack is built in.

Options: `.nvmrc` 26 with `engines: "^26"`; or 24; or keep 22 to match this container.

**OQ-4: Biome 2.6 formats Markdown, so `pnpm lint` fails on today's repo** (blocks Task 5).
`biome check .` with the todo's `biome.json` reports 29 errors right now. All of them are
formatting diffs in `docs/planning/*.md` and `.claude/**` (including `.claude/settings.json`).
That breaks the Done-when "`pnpm lint` passes on the empty repo". Options: (a) add
`"files": { "includes": ["**", "!**/*.md", "!.claude"] }` to `biome.json`; (b) run
`pnpm format` once and commit the reformatted docs and skills.

**OQ-5: Step 1 assumes an empty new repo, but this one already exists** (blocks Tasks 1, 23).
The repo is `m-de-graaff/unison` and already holds `CLAUDE.md`, `.claude/`, `.github/`, `docs/`
and `.gitkeep` placeholders. Questions:
- Do the GitHub org `unison-ui` and the repo `unison-ui/unison` still get created, with this repo
  moved there? Or does this repo stay where it is?
- Which URL goes in `repository` and `homepage` in Task 23?
- Should a `.gitkeep` be deleted once its folder has real files? The plan assumes yes.

The plan reads the Done-when as "`git status` shows exactly these five new files", and leaves
claiming the npm org `unison-ui` to you (a human-only action).

**OQ-6: Branch names conflict** (blocks every commit).
The todo wants `phase0/<section>` branches, squash-merged into `main`. CLAUDE.md requires
prefixes like `feat/`, `chore/`, `docs/` and forbids names starting with `claude/`. This cloud
session was assigned `claude/ecstatic-keller-0zm138`. Which naming should the executor use?
For example `chore/phase0-repo`, `feat/phase0-tokens`, … one branch per todo section.

**OQ-7: Who creates `packages/cli`?** The roadmap's phase 0 and the todo's target layout both list
`packages/cli` (`@unison-ui/cli`, "empty CLI shell"), but no todo step creates it. Following the
"don't add steps" rule, the plan leaves only `packages/cli/.gitkeep`. Should a task create the
shell, or is phase 2 enough?

**OQ-8: What status does ADR 0006 (web motion engine) get?** (blocks Task 27).
The todo says status "proposed", to be decided in phase 4. The roadmap's Decisions section marks
it **decided** ("CSS plus WAAPI, no Motion dependency … ADR closing 0006" in phase 4). concept.md
also says "no Motion dependency". Should it be Proposed or Accepted?

**OQ-9: Should the planning docs be updated with the confirmed decisions?** (affects Tasks 27, 29).
The roadmap's Decisions checkboxes (native support, minimum versions, licence) and concept.md's
"Open:" bullets and "Expo, bare" wording are now out of date. Should Task 27 also tick them in
`roadmap.md` and `concept.md`? The todo only says to write ADRs. Separately, step 29 says "tick
the Phase 0 gate in the roadmap tab". The plan reads that as the Phase 0 checklist and gate in
`docs/planning/roadmap.md`.

**OQ-10: Peer-dependency ranges for `react-native` and `react-dom`** (blocks Tasks 12, 29).
- Step 12 says the `react-native` peer range must be "no version range narrower than the current
  Expo SDK's". Expo SDK 58 = RN 0.88.1. Should the range be `>=0.88`, or wider (Uniwind uses
  `>=0.81`)?
- `@unison-ui/ui` depends on both `@unison-ui/react` and `@unison-ui/native`. With pnpm
  `auto-install-peers` (pnpm's default), a plain Next.js consumer running
  `pnpm add @unison-ui/ui` (step 29) will also install `react-native`. Should `react-native` be
  marked optional in `@unison-ui/native`'s `peerDependenciesMeta`, the way step 10 does for
  `motion`? Should `react-dom` be optional in `@unison-ui/react` too?

**OQ-11: `create-next-app` 16.4 asks questions the todo doesn't answer** (blocks Task 15).
- Should React Compiler be enabled? (`--react-compiler` / `--no-react-compiler`)
- Should it generate `AGENTS.md`? (`--agents-md`)
- Should Cache Components be enabled? (`--cache-components`)
- There is no Turbopack question any more; it's the default.
- Linter "none" is `--no-linter`.

Suggested answers: no, no, no.

**OQ-12: Generated app scaffolds differ from what the todo assumes** (blocks Tasks 15–17).
- The Vite `react-ts` template now ships **oxlint**, not ESLint. Should "Remove the generated
  ESLint config and dependencies" also remove `oxlint` and its `lint` script?
- Both web templates add `@types/react-dom`, which isn't in the catalog. Should a
  `"@types/react-dom": <matching>` catalog entry be added?
- The Expo default template already includes `react-native-reanimated`, `-gesture-handler`,
  `-worklets`, `react-dom` and `react-native-web`, so step 17.3 is mostly already done. Is that OK?

**OQ-13: tsdown 0.23 renamed an option** (blocks Tasks 9–14).
`external` still works but is deprecated in favour of `deps: { neverBundle: [...] }`. Should the
configs follow the todo literally (`external`) or the current API? (Separately: tsdown defaults
`fixedExtension: true` for `platform: "node"`, which would emit `.mjs`/`.d.mts` and break the
`tokens` exports the todo specifies. Task 8 sets `fixedExtension: false` to keep the todo's
file names. That isn't a design choice, so it isn't an open question.)

**OQ-14: What does the cross-platform compare do when platforms are missing?** (blocks Tasks 19, 22).
Step 19 compares `web-chromium`, `ios` and `android` pairwise. But `run.ts` skips simulators that
aren't running, and CI skips the native jobs on docs-only PRs, after which `parity-compare
--cross-only` still runs. Should the compare (a) compare only the platforms that are present and
pass with one; (b) fail if fewer than two are present; or (c) require all three except under a
flag? The plan writes (a) and marks it.

**OQ-15: Where does `UnisonTheme` come from in `@unison-ui/tokens`' own index?** (blocks Task 8).
`index.ts` must export the `UnisonTheme` type, but that type is generated into
`dist/native/theme.d.ts` by the package's own build. The plan re-exports it through a self-import
(`export type { UnisonTheme } from "@unison-ui/tokens/native"`) and makes the tokens `typecheck`
depend on its own `build`. The alternative is a hand-written type, but the todo says the type is
"generated … so it can't drift".

**OQ-16: Which tsconfig preset does `packages/motion` use?** (blocks Task 10).
The todo doesn't say. `src/web` needs the DOM lib, while `src/shared` and `src/native` must not
have it. Options: (a) `tsconfig.json` extends `web.json`, and the boundary check (not tsc)
guards `shared`; (b) three tsconfigs (`tsconfig.shared/web/native.json`) and
`typecheck: tsc -p … && …`. The plan writes (b) and marks it.

**OQ-17: Where do the native steps run?** This cloud container is Linux with no Xcode, iOS
Simulator, Android emulator or KVM. It also has no npm, Expo or GitHub-admin credentials. These
can only be verified on your Mac or in GitHub/npm web UIs:
- 17.4–17.6 native Done-whens
- 21
- the GitHub/npm parts of 22–24 and 26
- most of 29

Should the executor pause at those points so you can run them, attach your Mac through Remote
Control, or something else?

---

## Current versions (looked up Nov 19, 2026)

Sources: the npm registry (`npm view <pkg> version`), the `expo@58.0.26` package's
`bundledNativeModules.json`, `expo-template-blank-typescript@58.0.35` / `expo-template-default@58.0.35`
`package.json`, and nodejs.org/dist/index.json.

| What | Version | Note |
| --- | --- | --- |
| Node.js LTS | **26.13.1** (Active, "Lithium"); 24.22.3 (Maintenance) | OQ-3 |
| pnpm | **12.21.0** | OQ-1 |
| Expo SDK | **58** (`expo` 58.0.26) | |
| `react` / `react-dom` required by Expo SDK 58 | **19.3.0** (exact) | Catalog value. `react@latest` is 19.3.1, so don't use it. |
| `@types/react` for SDK 58 | **~19.3.0** (latest 19.3.0) | Catalog value |
| `react-native` for SDK 58 | **0.88.1** | Dev dependency for `native`/`motion` |
| `jest-expo` for SDK 58 | ~58.0.15 | Peers: `expo`, `jest ^29 \|\| ^30`, `@react-native/jest-preset ^0.88.1` |
| `react-native-reanimated` / `-worklets` / `-gesture-handler` (SDK 58) | 4.7.1 / 0.13.0 / ~3.3.0 | `npx expo install` picks these, not npm latest (4.7.2 / 0.13.1 / 3.5.0) |
| `expo-router` (SDK 58) | ~58.0.32 | |
| TypeScript | latest **7.0.2**; Expo templates **~6.0.3** | OQ-2 |
| turbo | 2.11.13 | |
| @biomejs/biome | 2.6.8 | OQ-4 |
| @changesets/cli | 3.0.3 | |
| lefthook | 2.2.2 | |
| tsx | 4.23.15 | |
| tsdown | 0.23.7 | OQ-13 |
| vitest / @vitest/coverage-v8 | 5.1.1 | |
| next / create-next-app | 16.4.6 | OQ-11 |
| vite / create-vite | 8.3.8 / 9.3.4 | |
| tailwindcss / @tailwindcss/vite | 4.3.5 | |
| uniwind / nativewind | 1.14.0 / 4.2.7 | Uniwind peers: `react >=19`, `react-native >=0.81`, `tailwindcss >=4` |
| @playwright/test / @axe-core/playwright | 1.65.1 / 4.14.0 | |
| pixelmatch / pngjs / sharp | 8.0.0 / 7.0.0 / 0.35.5 | |
| @testing-library/react / jsdom | 16.3.3 / 31.0.1 | |
| @testing-library/react-native / jest | 14.1.0 / 30.5.2 | RNTL 14 peers on `test-renderer ^1.0.0` |
| publint / @arethetypeswrong/cli | 0.3.25 / 0.18.5 | |
| eas-cli | 27.10.0 | |

---

## Global constraints

- Phase 0 only. Build nothing from phases 1–5. No real components; only the placeholders `Box`
  and `MotionBadge`.
- Keep the todo's step order. One commit per todo step, using the todo's commit message exactly.
- Commits: Conventional Commits. **No `Co-Authored-By` trailers and no other AI or tool
  attribution** in commits, PRs, tags or releases.
- Branch names: never start with `claude/`. Use prefixes like `feat/`, `fix/`, `chore/`, `docs/`
  (exact scheme: OQ-6).
- Dependencies: install with `@latest` (or `npx expo install` for anything Expo pins); never
  hand-type versions, except the catalog in `pnpm-workspace.yaml`. Packages and apps reference
  `react`, `react-dom`, `@types/react` and `typescript` as `"catalog:"`.
- React is a peer dependency of every library (`"react": ">=19"`) and a dev dependency
  (`"catalog:"`), never a regular dependency.
- Workspace dependencies: `"workspace:^"` between libraries and `"workspace:*"` in apps.
- Library template: `"type": "module"`, `"version": "0.0.0"`, `"files": ["dist"]`,
  `"sideEffects": false`; scripts `build: tsdown`, `dev: tsdown --watch`,
  `typecheck: tsc --noEmit`, `test: vitest run`.
- ESM only. Builds use tsdown.
- Import boundaries (enforced from Task 5):

| Files | Must not import |
| --- | --- |
| `packages/tokens`, `packages/core`, `packages/motion/src/shared/**` | `react-dom`, `react-native`, `react-native-*` |
| `packages/motion/src/web/**`, `packages/react/**` | `react-native`, `react-native-*` |
| `packages/motion/src/native/**`, `packages/native/**` | `react-dom` |
| any package | a relative import that leaves the package |

- Native: Expo only, New Architecture only (never turned off), development builds only (no
  Expo Go).
- Token CSS variable names: `--unison-<path with dots replaced by dashes>`.
- Fixed ports: Next.js 3000, Vite 5173 (`strictPort`), Metro 8081, parity collector 4545.
- Licence: MIT.

## Human-only actions (the executor can't do these)

| Task | Action |
| --- | --- |
| 1 | Claim the npm org `unison-ui`. Create the GitHub org and repo (OQ-5). |
| 17.4 | `npx expo login`. iOS/Android dev builds on macOS. |
| 22 | Set branch protection on `main`. |
| 23 | Create the `NPM_TOKEN` secret. Configure Trusted Publishing per package after the first publish. |
| 24 | Install the Renovate GitHub App. Merge its onboarding PR. |
| 26 | Create GitHub labels (or the executor uses the GitHub API with your OK). Do the teammate dry-run. |
| 29 | Clean-clone acceptance on macOS with both simulators. Tag `phase-0-complete` and push it. |

---

## File map

| Path | Responsibility | Task |
| --- | --- | --- |
| `LICENSE`, `README.md`, `.gitignore`, `.editorconfig`, `.gitattributes` | Repo basics | 1 |
| `.nvmrc`, root `package.json` | Toolchain pin, root scripts | 2, 3, 5, 6, 13, 23, 25, 26, 28 |
| `pnpm-workspace.yaml`, `.npmrc`, `pnpm-lock.yaml` | Workspace, catalog, linker | 3 |
| `tooling/tsconfig/{package,base,web,shared,native}.json` | TS presets | 4 |
| `biome.json`, `.vscode/*`, `tooling/scripts/check-boundaries.ts` | Lint, format, import boundaries | 5 |
| `turbo.json` | Task graph | 6 |
| `packages/tokens/**` | Token source, compiler, CLI, outputs | 7, 8, 18a |
| `packages/core/**` | `useControllableState`, Box contract and style spec | 9, 18b |
| `packages/motion/**` | Spring re-exports, `useReducedMotion` for web and native | 10, 18c |
| `packages/react/**` | Web `Box`, `MotionBadge`, `cssVar` | 11, 18d |
| `packages/native/**` | Native `Box`, `MotionBadge`, `useUnisonTheme`, `token` | 12, 18e |
| `packages/ui/**` | Public entry, export conditions, contract test | 13, 18f |
| `packages/demo-content/**` | Shared `DemoItems` | 14 |
| `apps/web-next/**` | Next.js demo | 15 |
| `apps/web-vite/**` | Vite demo + web parity page | 16, 20 |
| `apps/mobile/**` | Expo demo + native parity route | 17, 21 |
| `packages/parity/**` | Fixtures, registry, collector, compare, report, runners, baselines | 19–22 |
| `.github/workflows/{ci,release,snapshot}.yml` | CI, releases, snapshots | 22, 23 |
| `.changeset/config.json` | Changesets | 23 |
| `renovate.json`, `docs/expo-upgrade.md` | Dependency updates | 24 |
| `lefthook.yml` | Git hooks | 25 |
| `tooling/scripts/doctor.ts`, `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/{bug,feature}.yml` | Onboarding | 26 |
| `docs/architecture.md`, `docs/adr/*.md` | Architecture, decisions | 27 |
| `docs/component-checklist.md`, `tooling/scripts/new-component.ts` | Future component scaffolding | 28 |

---

# Section 1: Repository, toolchain, workspace

Branch for this section: see OQ-6 (e.g. `chore/phase0-repo`).

### Task 1: Claim names and add the initial repo files (todo step 1)

**Files:**
- Create: `LICENSE`, `README.md`, `.gitignore`, `.editorconfig`, `.gitattributes`

**Interfaces:** Produces the ignore rules every later task relies on (`dist/`, `.turbo/`,
`.next/`, `.expo/`, `apps/mobile/ios|android/`, `parity-output/`, …).

- [ ] **Step 1 (human): claim the names.** Claim the npm org `unison-ui` on npmjs.com. If it's
  taken, **stop**: every later step uses the scope. GitHub org and repo: ⚠ OQ-5.
- [ ] **Step 2: `LICENSE`.** The standard MIT text, with the line
  `Copyright (c) 2026 <your name>` (⚠ ask Mark which name to use if it's not given).
- [ ] **Step 3: `README.md`.**

```md
# Unison

Work in progress.
```

- [ ] **Step 4: `.gitignore`.** Exactly the todo's list:

```
node_modules/
dist/
.turbo/
.next/
.expo/
expo-env.d.ts
apps/mobile/ios/
apps/mobile/android/
coverage/
playwright-report/
test-results/
parity-output/
*.tsbuildinfo
.DS_Store
.env*.local
```

- [ ] **Step 5: `.editorconfig`.**

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
charset = utf-8
```

- [ ] **Step 6: `.gitattributes`.**

```
* text=auto eol=lf
pnpm-lock.yaml -diff
```

- [ ] **Step 7: Verify.**
  Run: `git status --porcelain`
  Expect exactly five lines, in any order:
  `?? .editorconfig`, `?? .gitattributes`, `?? .gitignore`, `?? LICENSE`, `?? README.md`
- [ ] **Step 8: Commit.** `git add -A && git commit -m "chore: initial repo files"`

### Task 2: Pin the toolchain (todo step 2)

**Files:** Create `.nvmrc`, `package.json`

**Interfaces:** Produces the root `package.json` with `"type": "module"` and an empty `scripts`,
which later tasks extend.

- [ ] **Step 1: `.nvmrc`.** ⚠ OQ-3: write the agreed LTS major, e.g. `26`.
- [ ] **Step 2: Root `package.json`.**

```json
{
  "name": "unison",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@0.0.0",
  "engines": { "node": ">=22" },
  "scripts": {}
}
```

  ⚠ OQ-3: the `engines` range. `pnpm@0.0.0` is a stand-in that the next step overwrites.

- [ ] **Step 3: Pin pnpm.** On Node ≥ 25, run `npm i -g corepack` first (Corepack is no longer
  bundled). Then run `corepack enable && corepack use pnpm@latest`.
- [ ] **Step 4: Verify the pin.**
  Run: `grep packageManager package.json && pnpm -v`
  Expect: `"packageManager": "pnpm@12.21.0+sha512.<hash>"` (the exact version `latest` resolves
  to, with a hash), and `pnpm -v` prints the same version (`12.21.0`).
- [ ] **Step 5: Verify the engine warning.**
  Run: `npx -y node@20 $(which pnpm) -v` (or `nvm exec 20 pnpm -v`).
  Expect: a warning containing `Unsupported engine` or `engines.node` (exact wording depends on
  the pnpm version). If nothing warns, it's a finding for OQ-3.
- [ ] **Step 6: Commit.** `git commit -am "chore: pin node and pnpm"` (add `.nvmrc` first).

### Task 3: pnpm workspace and dependency catalog (todo step 3)

**Files:** Create `pnpm-workspace.yaml`, `.npmrc`, `pnpm-lock.yaml`. Modify `package.json`.

**Interfaces:** Produces the `catalog:` entries `typescript`, `react`, `react-dom`
and `@types/react`, used by every later package and app.

- [ ] **Step 1: Probe Expo's React version** (the todo's method, run fresh):
  `npx create-expo-app@latest --template blank-typescript /tmp/expo-probe --no-install`, then
  `node -p "require('/tmp/expo-probe/package.json').dependencies.react"`.
  Expect: `19.3.0` (the SDK 58 value from the version table). If it differs, use the probe's value.
  Also record `react-native` (expect `0.88.1`) and `devDependencies["@types/react"]` (expect
  `~19.3.0`). Then `rm -rf /tmp/expo-probe`.
- [ ] **Step 2: `pnpm-workspace.yaml`.** ⚠ OQ-2: the TypeScript value. ⚠ OQ-1: whether the linker
  settings also go here.

```yaml
packages:
  - apps/*
  - packages/*
  - tooling/*

catalog:
  typescript: 7.0.2        # ⚠ OQ-2 (Expo SDK 58 templates use ~6.0.3)
  react: 19.3.0            # exactly the probe's value
  react-dom: 19.3.0
  "@types/react": ~19.3.0
```

- [ ] **Step 3: `.npmrc`.** Exactly the todo's four lines:

```
node-linker=hoisted
auto-install-peers=true
strict-peer-dependencies=false
link-workspace-packages=true
```

  ⚠ OQ-1: on pnpm 12 these have no effect. If option (a) is chosen, also add this to
  `pnpm-workspace.yaml`:

```yaml
nodeLinker: hoisted
autoInstallPeers: true
strictPeerDependencies: false
linkWorkspacePackages: true
```

- [ ] **Step 4: Root dev dependencies.**
  Run: `pnpm add -Dw typescript@catalog: turbo @biomejs/biome @changesets/cli lefthook`
- [ ] **Step 5: Verify.**
  Run: `pnpm install && pnpm config get node-linker; pnpm config get nodeLinker; find . -name node_modules -type d -prune -not -path "./node_modules" | wc -l`
  Expect: install exits 0 with no `ERR_`; one of the two `config get` lines prints `hoisted`; the
  `find` count is `0`. Also `grep '"typescript": "catalog:"' package.json` matches.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "chore: pnpm workspace and catalog"`

---

# Section 2: TypeScript, linting and import boundaries

### Task 4: Shared TypeScript presets (todo step 4)

**Files:** Create `tooling/tsconfig/{package,base,web,shared,native}.json`. Delete `tooling/tsconfig/.gitkeep`.

**Interfaces:** Produces `@unison-ui/tsconfig/{base,web,shared,native}.json`. **Rule for every
later package:** a `typecheck` script of `tsc --noEmit`, and a `tsconfig.json` that extends one
preset plus `"include": ["src"]`. If a third-party type conflicts with
`exactOptionalPropertyTypes`, turn it off in that one package only, with a comment saying why.

- [ ] **Step 1: `tooling/tsconfig/package.json`.**
  `{ "name": "@unison-ui/tsconfig", "private": true, "version": "0.0.0", "files": ["*.json"] }`
- [ ] **Step 2: `base.json`.** Copy the todo's block verbatim (target ES2022, lib ES2023, module
  ESNext, moduleResolution Bundler, jsx react-jsx, strict, noUncheckedIndexedAccess,
  exactOptionalPropertyTypes, verbatimModuleSyntax, isolatedModules, resolveJsonModule,
  skipLibCheck, forceConsistentCasingInFileNames, noEmit).
- [ ] **Step 3: The three presets.**

```json
// web.json
{ "extends": "./base.json", "compilerOptions": { "lib": ["ES2023", "DOM", "DOM.Iterable"] } }
// shared.json: no DOM, so a stray window/document fails typechecking
{ "extends": "./base.json" }
// native.json: no DOM; React Native ships its own types
{ "extends": "./base.json" }
```

- [ ] **Step 4: Link it.** Run `pnpm install`.
- [ ] **Step 5: Verify.**
  Run: `pnpm ls -r --depth -1 --json | node -e "const a=JSON.parse(require('fs').readFileSync(0));console.log(a.some(p=>p.name==='@unison-ui/tsconfig'))"`
  Expect: `true`.
  Also: `npx tsc -p tooling/tsconfig/base.json --showConfig >/dev/null && echo ok` prints `ok`.
  (With no inputs this may report "No inputs were found". That's acceptable: it proves the JSON
  parses.)
- [ ] **Step 6: Commit.** `chore: shared tsconfig presets`

### Task 5: Biome and the import-boundary check (todo step 5)

**Files:**
- Create: `biome.json`, `tooling/scripts/package.json`, `tooling/scripts/check-boundaries.ts`,
  `.vscode/extensions.json`, `.vscode/settings.json`
- Modify: `package.json` (scripts, plus `tsx` as a dev dependency)
- Delete: `tooling/scripts/.gitkeep`

**Interfaces:** Consumes the boundary table from Global constraints. Produces the root scripts
`lint` and `format`.

- [ ] **Step 1: `biome.json`.** The todo's block verbatim. ⚠ OQ-4: if option (a) is chosen, add
  `"files": { "includes": ["**", "!**/*.md", "!.claude"] }`.
- [ ] **Step 2: Install tsx.** `pnpm add -Dw tsx`
- [ ] **Step 3: `tooling/scripts/package.json`.**
  `{ "name": "@unison-ui/scripts", "private": true, "version": "0.0.0", "type": "module" }`.
  `tooling/*` is a workspace glob, so the folder needs a manifest. Drop this file if pnpm doesn't
  require it.
- [ ] **Step 4: `tooling/scripts/check-boundaries.ts`.**

```ts
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const packagesDir = join(root, "packages");

const NATIVE = (s: string) => s === "react-native" || s.startsWith("react-native-");
const DOM = (s: string) => s === "react-dom" || s.startsWith("react-dom/");

type Rule = { test: (spec: string) => boolean; label: string };

function rulesFor(rel: string): Rule[] {
  // rel is like "packages/motion/src/web/index.ts"
  const p = rel.split(sep).join("/");
  if (/^packages\/(tokens|core)\//.test(p) || p.startsWith("packages/motion/src/shared/"))
    return [{ test: DOM, label: "react-dom" }, { test: NATIVE, label: "react-native" }];
  if (p.startsWith("packages/motion/src/web/") || p.startsWith("packages/react/"))
    return [{ test: NATIVE, label: "react-native" }];
  if (p.startsWith("packages/motion/src/native/") || p.startsWith("packages/native/"))
    return [{ test: DOM, label: "react-dom" }];
  return [];
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?[^'"]*?\sfrom\s*["']([^"']+)["']|import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

const failures: string[] = [];
for (const pkg of existsSync(packagesDir) ? readdirSync(packagesDir) : []) {
  const pkgRoot = join(packagesDir, pkg);
  for (const file of walk(join(pkgRoot, "src"))) {
    const rel = relative(root, file);
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2] ?? m[3];
      if (!spec) continue;
      const line = text.slice(0, m.index).split("\n").length;
      for (const r of rulesFor(rel))
        if (r.test(spec)) failures.push(`${rel}:${line}  forbidden import "${spec}" (${r.label})`);
      if (spec.startsWith(".")) {
        const target = resolve(dirname(file), spec);
        if (!target.startsWith(pkgRoot + sep))
          failures.push(`${rel}:${line}  relative import "${spec}" leaves packages/${pkg}`);
      }
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`\n${failures.length} import-boundary violation(s).`);
  process.exit(1);
}
console.log("import boundaries ok");
```

- [ ] **Step 5: Root scripts.**

```json
"lint": "biome check . && tsx tooling/scripts/check-boundaries.ts",
"format": "biome check --write ."
```

- [ ] **Step 6: VS Code files.**
  `.vscode/extensions.json`:
  `{ "recommendations": ["biomejs.biome", "bradlc.vscode-tailwindcss", "expo.vscode-expo-tools"] }`.
  `.vscode/settings.json`:
  `{ "editor.defaultFormatter": "biomejs.biome", "editor.formatOnSave": true }`.
- [ ] **Step 7: Verify it passes.**
  Run: `pnpm lint`
  Expect: exit 0, with Biome's summary (`Checked N files … No fixes applied.`) followed by
  `import boundaries ok`. If Biome reports errors in `docs/**/*.md` or `.claude/**`, that's OQ-4.
- [ ] **Step 8: Verify it fails (sabotage).**
  Run: `mkdir -p packages/core/src && echo 'import "react-native";' > packages/core/src/x.ts && pnpm lint; echo "exit=$?"`
  Expect: `packages/core/src/x.ts:1  forbidden import "react-native" (react-native)` and `exit=1`.
  Then `rm packages/core/src/x.ts` and `rmdir packages/core/src`.
- [ ] **Step 9: Commit.** `chore: biome and import boundaries`

---

# Section 3: Task pipeline

### Task 6: Turborepo and root scripts (todo step 6)

**Files:** Create `turbo.json`. Modify `package.json`.

**Interfaces:** Produces the turbo tasks `build`, `dev`, `typecheck`, `test` and `test:parity`.
Library `dev` = `tsdown --watch`; apps consume `dist/`.

- [ ] **Step 1: `turbo.json`.** The todo's block verbatim (`$schema`, `"ui": "tui"`, the five tasks
  with their `dependsOn` and `outputs`).
- [ ] **Step 2: Root scripts.** Add these and keep `lint` and `format`:

```json
"build": "turbo run build",
"dev": "turbo run dev",
"dev:web": "turbo run dev --filter=web-next --filter=web-vite",
"dev:mobile": "turbo run dev --filter=mobile",
"typecheck": "turbo run typecheck",
"test": "turbo run test",
"test:parity": "turbo run test:parity --filter=@unison-ui/parity",
"check": "pnpm lint && pnpm typecheck && pnpm test && pnpm build"
```

- [ ] **Step 3: No remote cache yet** (that's revisited in Task 22).
- [ ] **Step 4: Verify.**
  Run: `pnpm build; echo "exit=$?"`
  Expect: Turbo's summary with `Tasks: 0 successful, 0 total` (or `No tasks were executed`), and
  `exit=0`.
- [ ] **Step 5: Commit.** `chore: turborepo pipeline`

---

# Section 4: Tokens

### Task 7: Tokens package and token source (todo step 7)

**Files:**
- Create: `packages/tokens/{package.json,tsconfig.json,tsdown.config.ts}`,
  `packages/tokens/tokens/{base,dark}.json`
- Delete: `packages/tokens/.gitkeep`

**Interfaces:** Produces the token paths that later tasks use:
- `color.accent`, `color.surface`, `color.fg`, `color.border`
- `space.1`, `space.2`, `space.4`
- `radius.md`
- `size.box`
- `motion.duration.base`
- `motion.spring.snappy`

Also produces the package exports `.`, `./spring`, `./native`, `./tokens.css` and `./theme.css`.

- [ ] **Step 1: `package.json`.** The todo's block verbatim (name, version, type, files,
  `bin.unison-tokens`, `exports`, `sideEffects: ["*.css"]`, scripts).
- [ ] **Step 2: Dev dependencies.**
  `pnpm --filter @unison-ui/tokens add -D tsdown vitest @unison-ui/tsconfig@workspace:* typescript@catalog: @types/node`
- [ ] **Step 3: `tsconfig.json`.**

```json
{
  "extends": "@unison-ui/tsconfig/shared.json",
  "compilerOptions": { "types": ["node"] },
  "include": ["src"]
}
```

- [ ] **Step 4: `tsdown.config.ts`.** Entries `src/index.ts`, `src/spring.ts`, `src/bin.ts`;
  `format: "esm"`, `dts: true`, `platform: "node"`, and `fixedExtension: false`. That option
  keeps `.js` and `.d.ts` names: tsdown 0.23 defaults to `.mjs` on `platform: "node"`, which
  would break `exports`.

```ts
import { defineConfig } from "tsdown";
export default defineConfig({
  entry: ["src/index.ts", "src/spring.ts", "src/bin.ts"],
  format: "esm",
  dts: true,
  platform: "node",
  fixedExtension: false,
});
```

- [ ] **Step 5: `tokens/base.json` and `tokens/dark.json`.** Copy the todo's two JSON blocks verbatim.
- [ ] **Step 6: Verify.**
  Run: `node -e "for (const f of ['base','dark']) JSON.parse(require('fs').readFileSync('packages/tokens/tokens/'+f+'.json','utf8')); console.log('ok')"`
  Expect: `ok`.
- [ ] **Step 7: Commit.** `feat(tokens): token source`

### Task 8: Token compiler (todo step 8)

**Files:** Create in `packages/tokens/src/`: `read.ts`, `spring.ts`, `contrast.ts`, `emit-web.ts`,
`emit-native.ts`, `index.ts`, `bin.ts`. Create `packages/tokens/turbo.json` (⚠ OQ-15).

**Interfaces:**
- Consumes: the token files from Task 7.
- Produces:
  - `type TokenType = "color" | "dimension" | "duration" | "spring"`
  - `interface SpringConfig { stiffness: number; damping: number; mass: number }`
  - `interface Token { path: string; type: TokenType; value: string | SpringConfig }`
  - `readTokens(cwd: string): { light: Token[]; dark: Token[]; darkOverrides: Token[] }`
  - `simulateSpring(s: SpringConfig): { durationMs: number; samples: number[] }`
  - `springToCssLinear(s: SpringConfig): { easing: string; durationMs: number }`
  - `contrastRatio(a: string, b: string): number`
  - `assertContrast(sets: { light: Token[]; dark: Token[] }): void` (throws)
  - `emitWeb(outDir: string, sets): string[]`
  - `emitNative(outDir: string, sets): string[]`
  - `compile({ cwd }: { cwd: string }): Promise<string[]>` (returns the written file paths)
  - `type UnisonTheme`
  - `cssVarName(path: string): string`, which returns `--unison-<dashes>`. Later tasks copy this
    rule into `react/src/css-var.ts`.

- [ ] **Step 1: `read.ts`.** Flatten DTCG objects. A node with `$type` + `$value` is a token. Any
  other object recurses with `path.key`. Validate:
  - color: `/^#([0-9a-f]{3}|[0-9a-f]{6})$/i`
  - dimension: `/^-?\d+(\.\d+)?px$/`
  - duration: `/^\d+(\.\d+)?ms$/`
  - spring: an object with finite positive `stiffness`, `damping` and `mass`
  - an unknown `$type` → `throw new Error(\`Unknown $type "${t}" at ${path}\`)`
  - a malformed value → `throw new Error(\`Malformed ${t} value at ${path}: ${JSON.stringify(v)}\`)`

  `dark` = light records with any path in `dark.json` replaced. `darkOverrides` = only the
  records from `dark.json`.
- [ ] **Step 2: `spring.ts`.** No `node:` imports; this file is re-exported to browsers through
  `./spring`.

```ts
export interface SpringConfig { stiffness: number; damping: number; mass: number }

export function simulateSpring(s: SpringConfig): { durationMs: number; samples: number[] } {
  const dt = 1 / 240;
  let x = 0, v = 0, t = 0;
  const xs = [0];
  while (t < 2) {
    const a = (-s.stiffness * (x - 1) - s.damping * v) / s.mass;
    v += a * dt;
    x += v * dt;
    t += dt;
    xs.push(x);
    if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.001) break;
  }
  const n = 32;
  const samples = Array.from({ length: n }, (_, i) => xs[Math.round((i * (xs.length - 1)) / (n - 1))] as number);
  return { durationMs: Math.round(t * 1000), samples };
}

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export function springToCssLinear(s: SpringConfig): { easing: string; durationMs: number } {
  const { durationMs, samples } = simulateSpring(s);
  const pts = samples.map(r4);
  pts[0] = 0;
  pts[pts.length - 1] = 1;
  return { easing: `linear(${pts.join(", ")})`, durationMs };
}
```

  Sanity check: for `snappy` (k=400, c=30, m=1), ζ = 0.75 and ω = 20, so it should settle in
  about 0.45 s, inside 150–600 ms.

- [ ] **Step 3: `contrast.ts`.** WCAG 2 relative luminance.

```ts
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
}
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
export function assertContrast(sets: Record<"light" | "dark", Array<{ path: string; value: unknown }>>): void {
  for (const [scheme, tokens] of Object.entries(sets)) {
    const get = (p: string) => tokens.find((t) => t.path === p)?.value as string;
    const fg = get("color.fg"), surface = get("color.surface");
    const ratio = contrastRatio(fg, surface);
    if (ratio < 4.5)
      throw new Error(`Contrast too low in ${scheme}: color.fg ${fg} on color.surface ${surface} is ${ratio.toFixed(2)}:1 (needs 4.5:1)`);
  }
}
```

- [ ] **Step 4: `emit-web.ts`.** `cssVarName = (p) => "--unison-" + p.replaceAll(".", "-")`.
  Declaration rules: a spring becomes two declarations, `<name>-easing: linear(…)` and
  `<name>-duration: <durationMs>ms`. Every other token becomes `<name>: <value>` (the string as
  written, e.g. `8px`, `200ms`).
  - `dist/web/tokens.css`:
    - `:root { … }` with every light token
    - `[data-theme="dark"] { … }` with the dark overrides
    - `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` with the same
      overrides
  - `dist/web/theme.css`:

```css
@theme inline {
  --color-accent: var(--unison-color-accent);
  --color-surface: var(--unison-color-surface);
  --color-fg: var(--unison-color-fg);
  --color-border: var(--unison-color-border);
  --radius-md: var(--unison-radius-md);
  --spacing: var(--unison-space-1);
}
```

- [ ] **Step 5: `emit-native.ts`.** Build nested objects from the paths (for example
  `{ color: { accent: "#5b5bd6" }, space: { "1": 4 }, motion: { duration: { base: 200 }, spring: { snappy: { stiffness: 400, damping: 30, mass: 1 } } } }`):
  dimensions are numbers with `px` removed, durations are numbers in ms, colours are strings, and
  springs are config objects.
  - Write `dist/native/theme.js`:
    `export const themes = ${JSON.stringify({ light, dark }, null, 2)};`
  - Write `dist/native/theme.d.ts` by walking the **light** tree. A string becomes `string`, a
    number `number`, and a spring
    `{ readonly stiffness: number; readonly damping: number; readonly mass: number }`. Every other
    object becomes a nested `{ readonly "<key>": … }`. Then emit:

```ts
export interface UnisonTheme { /* generated */ }
export declare const themes: { readonly light: UnisonTheme; readonly dark: UnisonTheme };
```

- [ ] **Step 6: `index.ts`.**

```ts
export type { UnisonTheme } from "@unison-ui/tokens/native"; // ⚠ OQ-15
export async function compile({ cwd }: { cwd: string }): Promise<string[]> { /* steps below */ }
```

  `compile({ cwd })` does this, in order:
  1. `readTokens(cwd)`
  2. `assertContrast({ light, dark })`
  3. `emitWeb(join(cwd, "dist/web"), …)`
  4. `emitNative(join(cwd, "dist/native"), …)`

  It creates the directories with `mkdirSync(…, { recursive: true })` and returns every written
  path.
- [ ] **Step 7: `bin.ts`.**

```ts
#!/usr/bin/env node
import { compile } from "./index";
const [cmd] = process.argv.slice(2);
if (cmd !== "build") {
  console.error("Usage: unison-tokens build");
  process.exit(1);
}
const files = await compile({ cwd: process.cwd() });
for (const f of files) console.log(`wrote ${f}`);
```

- [ ] **Step 8: `packages/tokens/turbo.json`** (⚠ OQ-15). The typecheck must wait for this
  package's own build:

```json
{ "extends": ["//"], "tasks": { "typecheck": { "dependsOn": ["^build", "build"] } } }
```

- [ ] **Step 9: Verify the outputs.**
  Run: `pnpm --filter @unison-ui/tokens build && ls packages/tokens/dist/web packages/tokens/dist/native && head -1 packages/tokens/dist/bin.js`
  Expect: the build prints four `wrote …` lines; `ls` shows `theme.css  tokens.css` and
  `theme.d.ts  theme.js`; `head` prints `#!/usr/bin/env node`.
- [ ] **Step 10: Verify the CSS content.**
  Run: `grep -o -- "--unison-color-accent: #5b5bd6" packages/tokens/dist/web/tokens.css && grep -E -- "--unison-motion-spring-snappy-(easing: linear\(|duration: [0-9]+ms)" packages/tokens/dist/web/tokens.css`
  Expect: the accent line, one `…-easing: linear(0, …, 1)` line, and one `…-duration: <N>ms` line
  with 150 ≤ N ≤ 600.
- [ ] **Step 11: Verify that the contrast check fails (sabotage).**
  Set `color.fg.$value` in `base.json` to `#cccccc`, then run
  `pnpm --filter @unison-ui/tokens build; echo "exit=$?"`.
  Expect: `Contrast too low in light: color.fg #cccccc on color.surface #ffffff …` and a non-zero
  exit. Then `git checkout packages/tokens/tokens/base.json`.
- [ ] **Step 12: Verify the typecheck and the unknown-command handling.**
  Run: `pnpm --filter @unison-ui/tokens typecheck && node packages/tokens/dist/bin.js nope; echo "exit=$?"`
  Expect: tsc exits 0, then `Usage: unison-tokens build` and `exit=1`.
- [ ] **Step 13: Commit.** `feat(tokens): compiler for css, tailwind and native outputs`

---

# Section 5: Platform-free packages

### Task 9: `@unison-ui/core` (todo step 9)

**Files:** Create `packages/core/{package.json,tsconfig.json,tsdown.config.ts}`,
`src/use-controllable-state.ts`, `src/components/box/box.types.ts`,
`src/components/box/box.styles.ts` and `src/index.ts`. Delete `.gitkeep`.

**Interfaces:**
- Consumes: the token paths `size.box`, `radius.md`, `color.border`, `color.accent` and
  `color.surface` (Task 7).
- Produces:
  - `useControllableState<T>(opts: { value?: T; defaultValue: T; onChange?: (value: T) => void }): [T, (next: T | ((prev: T) => T)) => void]`
  - `interface BoxProps { tone?: "accent" | "neutral"; testID?: string; children?: ReactNode }`
  - `const boxStyles = { size: "size.box", radius: "radius.md", border: "color.border", background: { accent: "color.accent", neutral: "color.surface" } } as const`

- [ ] **Step 1: Scaffold from the library template.** Name `@unison-ui/core`, peer
  `"react": ">=19"`. Dev dependencies:
  `pnpm --filter @unison-ui/core add -D react@catalog: @types/react@catalog: typescript@catalog: tsdown vitest @unison-ui/tsconfig@workspace:*`.
  `tsconfig.json` extends `@unison-ui/tsconfig/shared.json`, with `"include": ["src"]`.
- [ ] **Step 2: `tsdown.config.ts`.**
  `defineConfig({ entry: ["src/index.ts"], format: "esm", dts: true, platform: "neutral", external: ["react"] })`
  (⚠ OQ-13: `external` vs `deps.neverBundle`).
- [ ] **Step 3: `use-controllable-state.ts`.**

```ts
import { useCallback, useRef, useState } from "react";

export function useControllableState<T>(opts: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T | ((prev: T) => T)) => void] {
  const { value, defaultValue, onChange } = opts;
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : internal;
  const currentRef = useRef(current);
  currentRef.current = current;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = currentRef.current;
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (Object.is(resolved, prev)) return;
      currentRef.current = resolved;
      if (!controlled) setInternal(resolved);
      onChangeRef.current?.(resolved);
    },
    [controlled],
  );
  return [current, set];
}
```

- [ ] **Step 4: `box.types.ts` and `box.styles.ts`.** Copy the todo's two snippets verbatim.
- [ ] **Step 5: `index.ts`.**

```ts
export { useControllableState } from "./use-controllable-state";
export type { BoxProps } from "./components/box/box.types";
export { boxStyles } from "./components/box/box.styles";
```

- [ ] **Step 6: Verify.**
  Run: `pnpm --filter @unison-ui/core build && pnpm --filter @unison-ui/core typecheck && grep -c "BoxProps" packages/core/dist/index.d.ts`
  Expect: both commands exit 0 and the count is ≥ 1.
- [ ] **Step 7: Commit.** `feat(core): controllable state hook and box contract`

### Task 10: `@unison-ui/motion` (todo step 10)

**Files:** Create `packages/motion/{package.json,tsdown.config.ts}`, the tsconfig files
(⚠ OQ-16), `src/shared/index.ts`, `src/web/index.ts` and `src/native/index.ts`. Delete `.gitkeep`.

**Interfaces:**
- Consumes: `simulateSpring` and `springToCssLinear` from `@unison-ui/tokens/spring` (Task 8).
- Produces: `useReducedMotion(): boolean`, with an identical signature on web and native, plus
  the re-exported spring functions. The `.` export uses conditions `types`, `react-native` and
  `default`, in that order.

- [ ] **Step 1: Scaffold from the template.**
  - Dependency: `"@unison-ui/tokens": "workspace:^"`.
  - Peers: `"react": ">=19"` and `"react-native": "*"`, with
    `"peerDependenciesMeta": { "react-native": { "optional": true } }`.
  - Dev dependencies: `react@catalog:`, `@types/react@catalog:`, `typescript@catalog:`, `tsdown`,
    `vitest`, `@unison-ui/tsconfig@workspace:*`, and `react-native@0.88.1` (the probe value from
    Task 3; run `pnpm --filter @unison-ui/motion add -D react-native@<probe value>`).
  - Note: the native dts build needs React Native's types now. The todo only adds `react-native`
    in step 18, so this pulls it forward. Pulling it forward isn't a design change.
- [ ] **Step 2: tsconfig** (⚠ OQ-16, option (b)). Three files:
  - `tsconfig.shared.json`: extends `shared.json`, `include: ["src/shared"]`
  - `tsconfig.web.json`: extends `web.json`, `include: ["src/web", "src/shared"]`
  - `tsconfig.native.json`: extends `native.json`, `include: ["src/native", "src/shared"]`

  Also `tsconfig.json`, extending `shared.json` with `"files": []` and the three as `references`.
  The script becomes
  `"typecheck": "tsc --noEmit -p tsconfig.shared.json && tsc --noEmit -p tsconfig.web.json && tsc --noEmit -p tsconfig.native.json"`.
- [ ] **Step 3: `src/shared/index.ts`.**
  `export { simulateSpring, springToCssLinear } from "@unison-ui/tokens/spring";`
- [ ] **Step 4: `src/web/index.ts`.**

```ts
import { useSyncExternalStore } from "react";
export * from "../shared";

const QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
```

- [ ] **Step 5: `src/native/index.ts`.**

```ts
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
export * from "../shared";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (active) setReduced(v); });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { active = false; sub.remove(); };
  }, []);
  return reduced;
}
```

- [ ] **Step 6: `tsdown.config.ts`.** Two configs:

```ts
import { defineConfig } from "tsdown";
export default defineConfig([
  { entry: { index: "src/web/index.ts" }, outDir: "dist/web", format: "esm", dts: true, platform: "browser", external: [/^react/, /^@unison-ui\//] },
  { entry: { index: "src/native/index.ts" }, outDir: "dist/native", format: "esm", dts: true, platform: "neutral", external: ["react", "react-native", /^@unison-ui\//] },
]);
```

  (The todo lists only `react` and `react-native` as external for native. Keeping
  `@unison-ui/tokens` external in both stops the spring code from being duplicated. ⚠ OQ-13
  covers the `external` spelling.)
- [ ] **Step 7: `package.json` exports.** In exactly the todo's order: `types` →
  `./dist/web/index.d.ts`, `react-native` → `./dist/native/index.js`, `default` →
  `./dist/web/index.js`.
- [ ] **Step 8: Verify.**
  Run: `pnpm --filter @unison-ui/motion build && ls packages/motion/dist/web/index.js packages/motion/dist/native/index.js && (grep -r "react-native" packages/motion/dist/web; echo "grep-exit=$?") && pnpm lint`
  Expect: both paths are listed, `grep-exit=1` (no matches), and lint ends with
  `import boundaries ok`.
- [ ] **Step 9: Commit.** `feat(motion): springs and reduced motion for web and native`

---

# Section 6: Renderers and the public entry

### Task 11: `@unison-ui/react` (todo step 11)

**Files:** Create `packages/react/{package.json,tsconfig.json,tsdown.config.ts}`, `src/css-var.ts`,
`src/box.tsx`, `src/motion-badge.tsx` and `src/index.ts`. Delete `.gitkeep`.

**Interfaces:**
- Consumes: `BoxProps` and `boxStyles` (Task 9), and `useReducedMotion` (Task 10).
- Produces:
  - `cssVar(path: string): string` (e.g. `"var(--unison-color-accent)"`)
  - `Box(props: BoxProps): JSX.Element`
  - `MotionBadge(): JSX.Element`, which renders `<span data-testid="motion-badge">` with the text
    `motion: full` or `motion: reduced`
  - `type BoxProps`

- [ ] **Step 1: Scaffold.**
  - `tsconfig.json` extends `web.json`.
  - Dependencies: `@unison-ui/core`, `@unison-ui/motion` and `@unison-ui/tokens`, all
    `workspace:^`.
  - Peers: `react >=19` and `react-dom >=19` (⚠ OQ-10: optional?).
  - Dev dependencies: `react@catalog:`, `react-dom@catalog:`, `@types/react@catalog:`,
    `typescript@catalog:`, `tsdown`, `vitest`, `@unison-ui/tsconfig@workspace:*`.
- [ ] **Step 2: `css-var.ts`.**
  `export const cssVar = (path: string): string => \`var(--unison-${path.replaceAll(".", "-")})\`;`
- [ ] **Step 3: `box.tsx`** (no directive, no hooks).

```tsx
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
```

- [ ] **Step 4: `motion-badge.tsx`.**

```tsx
"use client";
import { useReducedMotion } from "@unison-ui/motion";

export function MotionBadge() {
  const reduced = useReducedMotion();
  return <span data-testid="motion-badge">{`motion: ${reduced ? "reduced" : "full"}`}</span>;
}
```

- [ ] **Step 5: `index.ts`.**

```ts
export { Box } from "./box";
export { MotionBadge } from "./motion-badge";
export type { BoxProps } from "@unison-ui/core";
```

- [ ] **Step 6: `tsdown.config.ts`.**
  `{ entry: ["src/index.ts"], format: "esm", dts: true, platform: "browser", unbundle: true, external: [/^react/, /^@unison-ui\//] }`
- [ ] **Step 7: Verify.**
  Run: `pnpm --filter @unison-ui/react build && head -1 packages/react/dist/motion-badge.js && head -1 packages/react/dist/box.js`
  Expect: the first line is exactly `"use client";` (single quotes count too, but no other
  statement may come before it). The second must **not** be a directive.
  If tsdown strips the directive, add `banner` for that file:
  `outputOptions: { banner: (chunk) => chunk.fileName === "motion-badge.js" ? '"use client";' : "" }`
  (check the option against tsdown's `banner?: ChunkAddon` type), or add a post-build script
  `tooling/scripts/add-use-client.ts`. Don't move on until the check passes.
- [ ] **Step 8: Commit.** `feat(react): placeholder web renderers`

### Task 12: `@unison-ui/native` (todo step 12)

**Files:** Create `packages/native/{package.json,tsconfig.json,tsdown.config.ts}`, `src/theme.ts`,
`src/box.tsx`, `src/motion-badge.tsx` and `src/index.ts`. Delete `.gitkeep`.

**Interfaces:**
- Consumes: `themes` and `UnisonTheme` from `@unison-ui/tokens/native` (Task 8); `BoxProps` and
  `boxStyles` (Task 9); `useReducedMotion` (Task 10).
- Produces:
  - `useUnisonTheme(): UnisonTheme`
  - `token<P extends TokenPath<UnisonTheme>>(theme: UnisonTheme, path: P): TokenValue<UnisonTheme, P>`
  - `Box(props: BoxProps)`
  - `MotionBadge()`
  - `index.ts` export names are **exactly** `Box`, `MotionBadge` and `type BoxProps`, the same as
    `@unison-ui/react`.

- [ ] **Step 1: Scaffold.**
  - `tsconfig.json` extends `native.json`.
  - Dependencies: `@unison-ui/core`, `@unison-ui/motion` and `@unison-ui/tokens` (`workspace:^`).
  - Peers: `react >=19` and `react-native` (⚠ OQ-10 for the range and whether it's optional).
  - Dev dependencies: `react-native@<probe value 0.88.1>`, `react@catalog:`,
    `@types/react@catalog:`, `typescript@catalog:`, `tsdown`, `@unison-ui/tsconfig@workspace:*`.
- [ ] **Step 2: `theme.ts`.**

```ts
import { themes, type UnisonTheme } from "@unison-ui/tokens/native";
import { useColorScheme } from "react-native";

type Leaf = string | number | { readonly stiffness: number; readonly damping: number; readonly mass: number };
export type TokenPath<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends Leaf ? `${P}${K}` : TokenPath<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TokenValue<T, Path extends string> = Path extends `${infer H}.${infer R}`
  ? H extends keyof T ? TokenValue<T[H], R> : never
  : Path extends keyof T ? T[Path] : never;

export function useUnisonTheme(): UnisonTheme {
  const scheme = useColorScheme();
  return themes[scheme === "dark" ? "dark" : "light"];
}

export function token<P extends TokenPath<UnisonTheme>>(theme: UnisonTheme, path: P): TokenValue<UnisonTheme, P> {
  return path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], theme) as TokenValue<UnisonTheme, P>;
}
```

- [ ] **Step 3: `box.tsx`.**

```tsx
import { type BoxProps, boxStyles } from "@unison-ui/core";
import { View } from "react-native";
import { token, useUnisonTheme } from "./theme";

export function Box({ tone = "accent", testID, children }: BoxProps) {
  const theme = useUnisonTheme();
  const size = token(theme, boxStyles.size);
  return (
    <View
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius: token(theme, boxStyles.radius),
        borderWidth: 1,
        borderColor: token(theme, boxStyles.border),
        backgroundColor: token(theme, boxStyles.background[tone]),
      }}
    >
      {children}
    </View>
  );
}
```

  If `exactOptionalPropertyTypes` rejects `testID={testID}` against React Native's types, turn
  the option off in this package's `tsconfig.json`, with a comment (the rule from Task 4).
- [ ] **Step 4: `motion-badge.tsx`.** No directive.
  `<Text testID="motion-badge">{\`motion: ${reduced ? "reduced" : "full"}\`}</Text>`, using
  `useReducedMotion` from `@unison-ui/motion`.
- [ ] **Step 5: `index.ts`.** The same three exports as Task 11 Step 5, from `./box` and
  `./motion-badge`.
- [ ] **Step 6: `tsdown.config.ts`.**
  `{ entry: ["src/index.ts"], format: "esm", dts: true, platform: "neutral", unbundle: true, external: [/^react/, /^@unison-ui\//] }`
- [ ] **Step 7: Verify.**
  Run: `pnpm --filter @unison-ui/native build && pnpm --filter @unison-ui/native typecheck && (grep -r "react-dom" packages/native/dist; echo "grep-exit=$?")`
  Expect: both exit 0, and `grep-exit=1`.
- [ ] **Step 8: Commit.** `feat(native): placeholder native renderers`

### Task 13: `@unison-ui/ui` and package health (todo step 13)

**Files:** Create `packages/ui/{package.json,tsconfig.json,tsdown.config.ts}`, `src/web.ts` and
`src/native.ts`. Modify the root `package.json`. Delete `.gitkeep`.

**Interfaces:**
- Consumes: the exports of `@unison-ui/react` (Task 11) and `@unison-ui/native` (Task 12).
- Produces: the public import `@unison-ui/ui`, which resolves `react-native` →
  `dist/native.js` and `browser`/`default` → `dist/web.js`, with types from `dist/web.d.ts`.
  Also produces the root script `check:packages`.

- [ ] **Step 1: Scaffold.**
  - Dependencies: `@unison-ui/react` and `@unison-ui/native` (`workspace:^`).
  - Peer: `react >=19`.
  - `tsconfig.json` extends `web.json`. (The todo doesn't name a preset; `web.ts` only re-exports,
    so `web.json` is the least surprising choice. Note this in the PR.)
- [ ] **Step 2: Sources.** `src/web.ts`: `export * from "@unison-ui/react";`. `src/native.ts`:
  `export * from "@unison-ui/native";`.
- [ ] **Step 3: `tsdown.config.ts`.**
  `{ entry: { web: "src/web.ts", native: "src/native.ts" }, format: "esm", dts: true, platform: "neutral", external: [/.*/] }`
  (everything external).
- [ ] **Step 4: Exports.** Use the todo's block verbatim (`types`, `react-native`, `browser`,
  `default`, in that order), plus the top-level `"react-native": "./dist/native.js"`.
- [ ] **Step 5: Package health.** `pnpm add -Dw publint @arethetypeswrong/cli`, then add this root
  script:
  `"check:packages": "pnpm -r --filter \"./packages/*\" exec sh -c 'publint && attw --pack . --profile esm-only'"`
- [ ] **Step 6: Verify.**
  Run: `pnpm build && pnpm check:packages; echo "exit=$?"`
  Expect: Turbo builds tokens, core, motion, react, native and ui; every package prints publint's
  `All good!` (warnings about the missing `repository`/`license` fields are acceptable until Task
  23, but **errors** are not); attw prints `No problems found` under `esm-only`; `exit=0`.
- [ ] **Step 7: Commit.** `feat(ui): public entry with platform export conditions`

---

# Section 7: Shared demo content and the Next.js app

### Task 14: `demo-content` (todo step 14)

**Files:** Create `packages/demo-content/{package.json,tsconfig.json,tsdown.config.ts}` and
`src/demo.tsx`. Delete `.gitkeep`.

**Interfaces:**
- Consumes: `Box` and `MotionBadge` from `@unison-ui/ui`.
- Produces: `DemoItems(): JSX.Element`, a fragment containing `box-accent`, `box-neutral` and
  `motion-badge`. Entry: `dist/demo.js`, exported as `.`.

- [ ] **Step 1: Scaffold.**
  - `"name": "demo-content"`, `"private": true`.
  - Dependency: `"@unison-ui/ui": "workspace:^"`.
  - Peer: `react`.
  - `tsconfig.json` extends `shared.json`.
  - `exports`: `{ ".": { "types": "./dist/demo.d.ts", "default": "./dist/demo.js" } }`.
- [ ] **Step 2: `src/demo.tsx`.** The todo's snippet verbatim.
- [ ] **Step 3: `tsdown.config.ts`.**
  `{ entry: ["src/demo.tsx"], format: "esm", dts: true, platform: "neutral", external: [/^react/, /^@unison-ui\//] }`
- [ ] **Step 4: Verify.**
  Run: `pnpm --filter demo-content build && grep -o 'from "@unison-ui/ui"' packages/demo-content/dist/demo.js && (grep -E 'from "@unison-ui/(react|native)"' packages/demo-content/dist/demo.js; echo "grep-exit=$?")`
  Expect: one `from "@unison-ui/ui"` match, and `grep-exit=1`. (`react/jsx-runtime` imports are
  expected; "not from react or native directly" means `@unison-ui/react` and `@unison-ui/native`.)
- [ ] **Step 5: Commit.** `feat(demo): shared demo content`

### Task 15: `apps/web-next` (todo step 15)

**Files:**
- Create: `apps/web-next/**` (scaffolded)
- Modify: `apps/web-next/package.json`, `src/app/globals.css`, `src/app/layout.tsx`,
  `src/app/page.tsx`
- Create: `src/app/theme-toggle.tsx`
- Delete: `apps/web-next/.gitkeep` and any nested `.git` folder or lockfile

**Interfaces:**
- Consumes: `DemoItems` (Task 14); `@unison-ui/tokens/tokens.css` and `/theme.css` (Task 8); the
  Tailwind utilities `bg-surface`, `text-fg`, `bg-accent`, `border-border`, `rounded-md` and
  `size-24`.
- Produces:
  - the before-paint theme script (`localStorage` key `unison-theme`, values `light` and `dark`)
  - the `ThemeToggle` behaviour (system → light → dark), which Task 16 copies
  - the page markup, which Task 16 copies

- [ ] **Step 1: Scaffold** (⚠ OQ-11). Delete `apps/web-next/.gitkeep` first, then run:

```bash
pnpm create next-app@latest apps/web-next --ts --tailwind --src-dir --app --no-linter --import-alias "@/*" --use-pnpm --skip-install --disable-git --no-react-compiler --no-agents-md --no-cache-components
```

  Then: `rm -rf apps/web-next/.git apps/web-next/pnpm-lock.yaml apps/web-next/pnpm-workspace.yaml`.
- [ ] **Step 2: `package.json`.**
  - Set `"name": "web-next"` and `"private": true`.
  - Set `react`, `react-dom`, `@types/react` and `typescript` to `"catalog:"` (⚠ OQ-12 for
    `@types/react-dom`).
  - Add `"@unison-ui/ui": "workspace:*"`, `"@unison-ui/tokens": "workspace:*"` and
    `"demo-content": "workspace:*"`.
  - Add `"typecheck": "tsc --noEmit"`. Keep the generated `dev` and `build`.
  - Run `pnpm install` from the root.
- [ ] **Step 3: `globals.css`.** Replace the whole file with the todo's three `@import` lines.
- [ ] **Step 4: `layout.tsx`.**

```tsx
import "./globals.css";
import type { ReactNode } from "react";

const themeScript = `try{var t=localStorage.getItem("unison-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

  Keep the generated `metadata` export if there is one. Drop the generated font imports: the todo
  doesn't want them, and Task 20's parity page relies on system fonts.
- [ ] **Step 5: `theme-toggle.tsx`.**

```tsx
"use client";
import { useState } from "react";

type Mode = "system" | "light" | "dark";
const next: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof document === "undefined") return "system";
    const t = document.documentElement.dataset.theme;
    return t === "light" || t === "dark" ? t : "system";
  });
  function cycle() {
    const m = next[mode];
    try {
      if (m === "system") localStorage.removeItem("unison-theme");
      else localStorage.setItem("unison-theme", m);
    } catch {}
    if (m === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = m;
    setMode(m);
  }
  return (
    <button type="button" data-testid="theme-toggle" onClick={cycle} suppressHydrationWarning>
      theme: {mode}
    </button>
  );
}
```

- [ ] **Step 6: `page.tsx`.** The todo's snippet verbatim.
- [ ] **Step 7: Verify the build.**
  Run: `pnpm --filter web-next... build`
  Expect: exits 0; the route table lists `○ /` (static).
- [ ] **Step 8: Verify the server HTML and the bundle.**
  Run: `(cd apps/web-next && (pnpm start -p 3000 &) && sleep 5 && curl -s localhost:3000 | grep -o 'data-testid="box-accent"'; pkill -f "next start"); (grep -rl "react-native" apps/web-next/.next/static; echo "grep-exit=$?")`
  Expect: `data-testid="box-accent"` printed once, and `grep-exit=1`. (In this harness, use
  Monitor or `until curl …` instead of `sleep`.)
- [ ] **Step 9: Verify in the browser** (Playwright in the container, or by hand). Run
  `pnpm --filter web-next dev`, then a Playwright script against http://localhost:3000:
  1. Locators `box-accent`, `box-neutral`, `tw-box` and `motion-badge` are visible.
  2. `getComputedStyle` `backgroundColor` and the bounding boxes of `box-accent` and `tw-box` are
     equal.
  3. `motion-badge` text is `motion: full`.
  4. `page.emulateMedia({ reducedMotion: "reduce" })` changes it to `motion: reduced` with no
     reload.
  5. After clicking the toggle to `dark` and reloading, `document.documentElement.dataset.theme`
     is `"dark"` **before** hydration. Check with `page.addInitScript` +
     `MutationObserver` / first-paint style capture: the body background at first paint is
     `#111113`, not `#ffffff`.

  Expect: all five assertions pass.
- [ ] **Step 10: Commit.** `feat(web-next): demo app`

---

# Section 8: The Vite app

### Task 16: `apps/web-vite` (todo step 16)

**Files:**
- Create: `apps/web-vite/**` (scaffolded)
- Modify: `package.json`, `vite.config.ts`, `index.html`, `src/index.css`, `src/main.tsx`
- Create: `src/demo-page.tsx`, `src/theme-toggle.tsx`, `src/parity-page.tsx` (the placeholder)
- Delete: `.gitkeep`, the nested lockfile, and the oxlint/ESLint config (⚠ OQ-12)

**Interfaces:**
- Consumes: everything Task 15 consumes, plus the theme script and toggle from Task 15.
- Produces: `ParityPage` (returns `null`, filled in by Task 20); the dev server on port 5173 with
  `strictPort`.

- [ ] **Step 1: Scaffold.**
  `rm apps/web-vite/.gitkeep && pnpm create vite@latest apps/web-vite --template react-ts --no-interactive`
  (if the flag isn't recognised, answer the prompts: no overwrite, don't install or start). Then
  delete any nested lockfile.
- [ ] **Step 2: `package.json`.**
  - Set `"name": "web-vite"` and `"private": true`.
  - Set `react`, `react-dom`, `@types/react` and `typescript` to `"catalog:"`.
  - Add `@unison-ui/ui`, `@unison-ui/tokens` and `demo-content` as `workspace:*`.
  - Add `"typecheck": "tsc -b --noEmit"`.
  - ⚠ OQ-12: remove `oxlint` and the `lint` script, plus any `eslint*` files or dependencies.
- [ ] **Step 3: Tailwind.** Run `pnpm --filter web-vite add -D tailwindcss @tailwindcss/vite`.
  `vite.config.ts`:

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({ plugins: [react(), tailwindcss()], server: { port: 5173, strictPort: true } });
```

- [ ] **Step 4: CSS and the theme script.** Replace `src/index.css` with the same three `@import`
  lines as Task 15. In `index.html`, add
  `<script>try{var t=localStorage.getItem("unison-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}</script>`
  as the first child of `<head>`. Delete `src/App.tsx`, `src/App.css` and `src/assets/` if nothing
  uses them.
- [ ] **Step 5: `main.tsx`.**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { DemoPage } from "./demo-page";
import { ParityPage } from "./parity-page";

const page = location.pathname.startsWith("/parity/") ? <ParityPage /> : <DemoPage />;
createRoot(document.getElementById("root") as HTMLElement).render(<StrictMode>{page}</StrictMode>);
```

  `parity-page.tsx`: `export function ParityPage() { return null; }`
- [ ] **Step 6: `demo-page.tsx` and `theme-toggle.tsx`.** Copy Task 15's `page.tsx` markup (rename
  the function to `DemoPage`) and `theme-toggle.tsx` (drop the `"use client"` line; it's harmless
  but unnecessary).
- [ ] **Step 7: Verify the build.**
  Run: `pnpm --filter web-vite... build && (grep -rl "react-native" apps/web-vite/dist; echo "grep-exit=$?")`
  Expect: the build exits 0 and `grep-exit=1`.
- [ ] **Step 8: Verify visual identity.** With both dev servers running
  (`pnpm dev:web`), a Playwright script screenshots `main` on :3000 and :5173 at 390×844, in both
  `colorScheme: "light"` and `"dark"`, and diffs them with pixelmatch.
  Expect: 0 differing pixels in both schemes. If there are differences, compare the layout
  first; font differences point to leftover template CSS.
- [ ] **Step 9: Commit.** `feat(web-vite): demo app`

---

# Section 9: The Expo app

Step 17 is split into six sub-tasks. **One commit** at the end of 17.6.

### Task 17.1: Create the Expo app

**Files:** Create `apps/mobile/**`. Delete `apps/mobile/.gitkeep`, `app-example/` and the nested
lockfile.

**Interfaces:** Produces an Expo Router app with an empty `app/`.

- [ ] **Step 1:** `rm apps/mobile/.gitkeep && pnpm create expo-app@latest apps/mobile --no-install`
  (default template).
- [ ] **Step 2:** `pnpm install` from the root, then `pnpm --filter mobile reset-project`. Answer
  "no" when it asks whether to keep the example: it moves files to `app-example`. Then
  `rm -rf apps/mobile/app-example apps/mobile/pnpm-lock.yaml apps/mobile/package-lock.json`.
- [ ] **Step 3: Verify.**
  Run: `ls apps/mobile/app && node -p "require('./apps/mobile/package.json').dependencies.expo"`
  Expect: `index.tsx  _layout.tsx` (as produced by `reset-project`) and `~58.0.26` (or whatever
  is current at execution time).

### Task 17.2: Configure

**Files:** Modify `apps/mobile/package.json` and `app.json`. Create or overwrite `metro.config.js`.

**Interfaces:**
- Produces: scheme `unison-demo`; `bundleIdentifier` and `package` `dev.unison.demo` (used by
  Task 21 and `case.yaml`); the scripts `dev` and `typecheck`.
- Consumes: the catalog (Task 3).

- [ ] **Step 1: `package.json`.**
  - Set `"name": "mobile"` and `"private": true`.
  - Add `"dev": "expo start"` and `"typecheck": "tsc --noEmit"`.
  - Keep the `react` and `react-native` versions Expo chose. Check that `react` equals the catalog
    value. If it doesn't, the catalog is wrong: go back to Task 3.
  - Set `typescript` and `@types/react` to `"catalog:"` (⚠ OQ-2: if the catalog TS is 7.x and
    Expo pins ~6.0.3, that's where the conflict surfaces).
  - Add `@unison-ui/ui`, `@unison-ui/tokens` and `demo-content` as `workspace:*`.
- [ ] **Step 2: `app.json`.** Set:
  - `name` "Unison Demo", `slug` "unison-demo", `scheme` "unison-demo"
  - `userInterfaceStyle` "automatic"
  - `ios.bundleIdentifier` and `android.package`: "dev.unison.demo"
  - New Architecture: make sure no `newArchEnabled: false` appears anywhere
- [ ] **Step 3: `metro.config.js`.** Exactly the todo's two lines.
- [ ] **Step 4: Verify.**
  Run: `cd apps/mobile && npx expo-doctor`
  Expect: `No issues detected!` (or every check passes). Fix anything it reports, then rerun.
  Also: `npx expo config --json | node -e "const c=JSON.parse(require('fs').readFileSync(0));console.log(c.scheme,c.ios.bundleIdentifier,c.android.package,c.userInterfaceStyle)"`
  Expect: `unison-demo dev.unison.demo dev.unison.demo automatic`.

### Task 17.3: Animation dependencies

**Files:** Modify `apps/mobile/package.json` (and maybe `babel.config.js`).

- [ ] **Step 1:** `cd apps/mobile && npx expo install react-native-reanimated react-native-gesture-handler react-native-worklets`
  (⚠ OQ-12: the default template already ships these; the command just confirms the SDK-pinned
  versions).
- [ ] **Step 2:** Read the Reanimated section of Expo's install notes (printed by the command, or
  at docs.expo.dev/versions/latest/sdk/reanimated). Add a Babel plugin only if they say to. With
  `babel-preset-expo` on SDK 58, expect no change.
- [ ] **Step 3: Verify.**
  Run: `node -p "const d=require('./apps/mobile/package.json').dependencies;[d['react-native-reanimated'],d['react-native-gesture-handler'],d['react-native-worklets']].join(' ')" && (cd apps/mobile && npx expo-doctor)`
  Expect: `4.7.1 ~3.3.0 0.13.0` (or the current SDK-pinned equivalents) and no doctor issues.

### Task 17.4: Development build (macOS for iOS; ⚠ OQ-17)

**Files:** Create `apps/mobile/eas.json`.

**Interfaces:** Produces the dev-build apps `dev.unison.demo` on the simulator and emulator, and
the EAS profiles `development` and `preview`.

- [ ] **Step 1:** Confirm `apps/mobile/ios/` and `apps/mobile/android/` are gitignored:
  `git check-ignore apps/mobile/ios apps/mobile/android` prints both paths.
- [ ] **Step 2 (human):** `npx expo login`.
- [ ] **Step 3:** `cd apps/mobile && npx eas-cli@latest build:configure`, then make sure `eas.json`
  contains:

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

  (Keep whatever other keys `build:configure` writes, such as `cli.version`.)
- [ ] **Step 4: Verify.**
  Run: `npx expo run:ios` (macOS) and `npx expo run:android`.
  Expect: each ends with the app open on the simulator/emulator, connected to Metro on 8081 (the
  Metro log shows `iOS Bundled …` / `Android Bundled …`). The app shows the empty
  `reset-project` screen.

### Task 17.5: Spike: native Tailwind engine (time box: half a day)

**Files:** Modify `apps/mobile/metro.config.js`. Create `apps/mobile/global.css`. Modify
`app/_layout.tsx`. Write the results to `docs/adr/notes/17.5-native-tailwind-spike.md`, a scratch
file that Task 27 folds into ADR 0005.

**Interfaces:**
- Consumes: `@unison-ui/tokens/theme.css`.
- Produces: a working `className` on native, and a recorded decision (Uniwind or NativeWind).
  Possibly a new tokens output `dist/native/theme.css`, exported as
  `@unison-ui/tokens/native-theme.css`.

- [ ] **Step 1: Install Uniwind** by following its Expo guide (docs.uniwind.dev). Expect:
  `pnpm --filter mobile add uniwind tailwindcss` and a Metro wrapper:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
module.exports = withUniwindConfig(getDefaultConfig(__dirname), { cssEntryFile: "./global.css" });
```

  (Check the exact export names against the guide; the todo allows this one wrapper.)
- [ ] **Step 2: `global.css`.**

```css
@import "tailwindcss";
@import "uniwind";
@import "@unison-ui/tokens/theme.css";
```

  Use the Uniwind import line exactly as the guide gives it. Import `../global.css` at the top of
  `app/_layout.tsx`.
- [ ] **Step 3: Test 1.** Temporarily render `<View className="size-24 rounded-md bg-accent" />`
  in `app/index.tsx`.
  Expect: a 96×96 square in `#5b5bd6`. If it renders but has no colour, the
  `var(--unison-…)` chain doesn't resolve on native. Add the third compiler output to Task 8's
  `emit-web.ts`/`emit-native.ts`: `dist/native/theme.css` with literal light values plus Uniwind's
  light/dark theme syntax. Add `"./native-theme.css": "./dist/native/theme.css"` to the tokens
  exports, and import that instead of `theme.css`. Rebuild tokens and retest.
- [ ] **Step 4: Test 2.** Add a temporary screen: a `FlatList` of 200 rows styled with
  `className`, next to a copy styled with `StyleSheet`. On the Android emulator, open the dev menu
  → Perf Monitor and fling each list.
  Expect: UI and JS FPS stay within a few frames of each other, with no visible jank. Record both
  sets of numbers.
- [ ] **Step 5: Test 3.** Switch the simulator to dark
  (`xcrun simctl ui booted appearance dark`; on Android, `adb shell cmd uimode night yes`).
  Expect: a `bg-surface` view changes to `#111113` with no reload.
- [ ] **Step 6: Decide.** If all three pass, keep Uniwind. If any failure can't be fixed inside the
  time box, uninstall Uniwind, repeat Steps 1–5 with NativeWind (its Expo guide), and keep
  whichever passes. Write the numbers and the outcome to the spike notes file. Remove the
  temporary test screens.
- [ ] **Step 7: Verify.**
  Run: `test -s docs/adr/notes/17.5-native-tailwind-spike.md && grep -E "^Decision: (Uniwind|NativeWind)$" docs/adr/notes/17.5-native-tailwind-spike.md`
  Expect: one `Decision:` line.

### Task 17.6: Screens

**Files:** Modify `app/_layout.tsx` and `app/index.tsx`. Create `app/parity/[component]/[case].tsx`
(the placeholder).

**Interfaces:**
- Consumes: `DemoItems`, Tailwind `className` (17.5), and `GestureHandlerRootView`.
- Produces: the route `app/parity/[component]/[case].tsx`, which returns `null` until Task 21.

- [ ] **Step 1: `_layout.tsx`.**

```tsx
import "../global.css";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: `index.tsx`.**

```tsx
import { DemoItems } from "demo-content";
import { useState } from "react";
import { Appearance, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mode = "system" | "light" | "dark";
const next: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };

export default function Index() {
  const [mode, setMode] = useState<Mode>("system");
  function cycle() {
    const m = next[mode];
    Appearance.setColorScheme(m === "system" ? null : m);
    setMode(m);
  }
  return (
    <SafeAreaView className="flex-1 bg-surface p-4 flex-row flex-wrap items-center gap-4">
      <DemoItems />
      <View testID="tw-box" className="size-24 rounded-md border border-border bg-accent" />
      <Pressable testID="theme-toggle" onPress={cycle}>
        <Text className="text-fg">theme: {mode}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
```

  If `SafeAreaView` from `react-native-safe-area-context` doesn't take `className` under the
  chosen engine, wrap it with that engine's `withUniwind` / `cssInterop` helper. This is
  documented in both guides. Also check whether the installed RN typings accept
  `Appearance.setColorScheme(null)`; if they want `"unspecified"`, use that and note it in the
  commit body.
- [ ] **Step 3: `app/parity/[component]/[case].tsx`.**
  `export default function ParityCase() { return null; }`
- [ ] **Step 4: Verify (macOS + emulator, ⚠ OQ-17).**
  1. `npx expo run:ios` and `npx expo run:android`. Expect: each shows two identical accent
     squares (`box-accent`, `tw-box`), one neutral square, and `motion: full`. Check identity with
     the Maestro Studio inspector or a screenshot: same size and colour.
  2. Tap the toggle through light → dark → system, and also flip the system appearance. Expect:
     the colours follow every time.
  3. Turn on Reduce Motion (iOS: Settings → Accessibility → Motion; Android: Remove animations).
     Expect: `motion: reduced`.
  4. `cd apps/mobile && npx expo-doctor`. Expect: no issues.
- [ ] **Step 5: Commit (all of step 17).** `feat(mobile): expo demo app`. (The follow-up
  `docs(adr): native tailwind engine` commit belongs to Task 27, once `docs/adr/` exists.)

---

# Section 10: Unit and contract tests

Step 18 is split into sub-tasks 18a–18f. **One commit** at the end of 18f. Each sub-task first
runs its tests red, either by running them before the implementation fix or by a sabotage
step, so every assertion has been seen to fail.

### Task 18a: `tokens` tests

**Files:**
- Create: `packages/tokens/test/{spring,contrast,compile}.test.ts`,
  `packages/tokens/test/fixtures/low-contrast/tokens/{base,dark}.json`,
  `packages/tokens/vitest.config.ts`
- Modify: `package.json` (dev dependency `@vitest/coverage-v8`; `test` = `vitest run --coverage`)

**Interfaces:** Consumes `simulateSpring`, `springToCssLinear`, `contrastRatio` and `compile`
(Task 8).

- [ ] **Step 1: `vitest.config.ts`.**
  `defineConfig({ test: { environment: "node", coverage: { provider: "v8", reporter: ["text"] } } })`
- [ ] **Step 2: `spring.test.ts`.**

```ts
import { describe, expect, it } from "vitest";
import { simulateSpring } from "../src/spring";

describe("simulateSpring", () => {
  it("snappy settles in 150–600 ms", () => {
    const { durationMs } = simulateSpring({ stiffness: 400, damping: 30, mass: 1 });
    expect(durationMs).toBeGreaterThanOrEqual(150);
    expect(durationMs).toBeLessThanOrEqual(600);
  });
  it("samples start at 0 and end within 0.001 of 1", () => {
    const { samples } = simulateSpring({ stiffness: 400, damping: 30, mass: 1 });
    expect(samples).toHaveLength(32);
    expect(samples[0]).toBe(0);
    expect(Math.abs((samples.at(-1) as number) - 1)).toBeLessThan(0.001);
  });
  it("heavily damped spring never exceeds 1", () => {
    const { samples } = simulateSpring({ stiffness: 400, damping: 80, mass: 1 });
    expect(Math.max(...samples)).toBeLessThanOrEqual(1);
  });
  it("bouncy spring overshoots", () => {
    const { samples } = simulateSpring({ stiffness: 300, damping: 10, mass: 1 });
    expect(Math.max(...samples)).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 3: `contrast.test.ts`.**
  `expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2)` and
  `expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5)`.
- [ ] **Step 4: `compile.test.ts`.** For each case, `mkdtempSync(join(tmpdir(), "unison-tokens-"))`
  and copy in a `tokens/` folder: the real one for the snapshot case, `test/fixtures/low-contrast`
  for the rejection case. Then:
  - `await compile({ cwd: tmp })`, and `toMatchSnapshot()` on the contents of
    `dist/web/tokens.css`, `dist/web/theme.css` and `dist/native/theme.js`
  - `await expect(compile({ cwd: lowTmp })).rejects.toThrow(/#bbbbbb.*#ffffff|#ffffff.*#bbbbbb/)`

  The fixture `base.json` is a copy of the real one with `color.fg` = `#bbbbbb`; the fixture
  `dark.json` is a copy of the real one.
- [ ] **Step 5: Watch it fail.** Temporarily change `simulateSpring`'s cap from `t < 2` to
  `t < 0.1`, then run `pnpm --filter @unison-ui/tokens test`. Expect: the "settles in 150–600 ms"
  and "end within 0.001" tests FAIL. Revert.
- [ ] **Step 6: Verify.**
  Run: `pnpm --filter @unison-ui/tokens test`
  Expect: `Test Files  3 passed`, a coverage table printed, and `Snapshots  3 written` on the
  first run (`3 passed` after that).

### Task 18b: `core` tests

**Files:** Create `packages/core/test/use-controllable-state.test.tsx` and
`packages/core/vitest.config.ts`. Modify `package.json`.

**Interfaces:** Consumes `useControllableState` (Task 9).

- [ ] **Step 1: Dev dependencies.** `jsdom`, `@testing-library/react`, `react-dom@catalog:`,
  `@vitest/coverage-v8`. Config: `environment: "jsdom"`.
- [ ] **Step 2: Tests.**

```tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useControllableState } from "../src/use-controllable-state";

describe("useControllableState", () => {
  it("uncontrolled updates internal state", () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 1 }));
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(2);
  });
  it("controlled ignores internal updates and calls onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ value: 1, defaultValue: 0, onChange }));
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(1);
    expect(onChange).toHaveBeenCalledWith(5);
  });
  it("does not call onChange for the same value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultValue: 3, onChange }));
    act(() => result.current[1](3));
    expect(onChange).not.toHaveBeenCalled();
  });
  it("functional updater receives the latest value", () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 0 }));
    act(() => { result.current[1]((p) => p + 1); result.current[1]((p) => p + 1); });
    expect(result.current[0]).toBe(2);
  });
});
```

- [ ] **Step 3: Watch it fail.** Temporarily delete the `if (Object.is(resolved, prev)) return;`
  line and run `pnpm --filter @unison-ui/core test`. Expect: "does not call onChange for the same
  value" FAILS. Restore the line.
- [ ] **Step 4: Verify.** Run `pnpm --filter @unison-ui/core test`. Expect: `Tests  4 passed`.

### Task 18c: `motion` tests

**Files:** Create `packages/motion/test/reduced-motion.web.test.tsx`,
`packages/motion/test/signature.test-d.ts` and `packages/motion/vitest.config.ts`. Modify
`package.json`.

**Interfaces:** Consumes `useReducedMotion` from `../src/web` and `../src/native` (Task 10).

- [ ] **Step 1: Config.**
  `test: { environment: "jsdom", typecheck: { enabled: true, include: ["test/**/*.test-d.ts"], tsconfig: "./tsconfig.native.json" } }`.
  Add `test` to that tsconfig's `include` if Vitest needs it. Dev dependencies: `jsdom`,
  `@testing-library/react`, `react-dom@catalog:`, `@vitest/coverage-v8`. (`react-native` is already
  there from Task 10.)
- [ ] **Step 2: `reduced-motion.web.test.tsx`.**

```tsx
import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useReducedMotion } from "../src/web";

it("tracks prefers-reduced-motion and cleans up", () => {
  let matches = false;
  const listeners = new Set<() => void>();
  const mql = {
    get matches() { return matches; },
    addEventListener: vi.fn((_: string, cb: () => void) => listeners.add(cb)),
    removeEventListener: vi.fn((_: string, cb: () => void) => listeners.delete(cb)),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mql));
  const { result, unmount } = renderHook(() => useReducedMotion());
  expect(result.current).toBe(false);
  act(() => { matches = true; for (const l of listeners) l(); });
  expect(result.current).toBe(true);
  unmount();
  expect(mql.removeEventListener).toHaveBeenCalled();
  expect(listeners.size).toBe(0);
});
```

- [ ] **Step 3: `signature.test-d.ts`.**

```ts
import { expectTypeOf, test } from "vitest";
import * as native from "../src/native";
import * as web from "../src/web";

test("useReducedMotion has the same signature on both platforms", () => {
  expectTypeOf(web.useReducedMotion).toEqualTypeOf(native.useReducedMotion);
});
```

  `src/web` uses `window`, which needs the DOM lib. If the native tsconfig can't typecheck
  `src/web`, point the typecheck at `tsconfig.web.json` and add `react-native` to its `types`.
  Whichever tsconfig is used must resolve both files.
- [ ] **Step 4: Watch it fail.** Temporarily change the native signature to
  `useReducedMotion(_x?: number): boolean` and run `pnpm --filter @unison-ui/motion test`. Expect:
  a type error from `signature.test-d.ts`. Revert.
- [ ] **Step 5: Verify.** Run `pnpm --filter @unison-ui/motion test`. Expect: the runtime test and
  the type test both pass (`Type Errors  no errors`).

### Task 18d: `react` tests

**Files:** Create `packages/react/test/box.test.tsx`, `packages/react/test/motion-badge.test.tsx`
and `vitest.config.ts`. Modify `package.json`.

**Interfaces:** Consumes `Box` and `MotionBadge` (Task 11).

- [ ] **Step 1: Setup.** Dev dependencies `jsdom`, `@testing-library/react`, `@vitest/coverage-v8`;
  `environment: "jsdom"`.
- [ ] **Step 2: `box.test.tsx`.**

```tsx
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { Box } from "../src/box";

it("renders data-testid and accent background by default", () => {
  render(<Box testID="b" />);
  expect(screen.getByTestId("b").style.background).toBe("var(--unison-color-accent)");
});
it("uses surface for tone=neutral", () => {
  render(<Box tone="neutral" testID="n" />);
  expect(screen.getByTestId("n").style.background).toBe("var(--unison-color-surface)");
});
it("renders on the server", () => {
  expect(renderToString(<Box testID="s" />)).toContain('data-testid="s"');
});
```

- [ ] **Step 3: `motion-badge.test.tsx`.** Stub `matchMedia` to return
  `{ matches: false, addEventListener() {}, removeEventListener() {} }` and expect
  `motion: full`. Then stub it with `matches: true` and expect `motion: reduced`. Call
  `vi.unstubAllGlobals()` in `afterEach`.
- [ ] **Step 4: Watch it fail.** Temporarily change the default `tone = "accent"` to
  `"neutral"` in `box.tsx` and run the tests. Expect: the first test FAILS. Revert.
- [ ] **Step 5: Verify.** Run `pnpm --filter @unison-ui/react test`. Expect: `Tests  5 passed`.

### Task 18e: `native` tests (Jest)

**Files:** Create `packages/native/jest.config.js`, `packages/native/test/box.test.tsx` and
`packages/native/test/motion-badge.test.tsx`. Modify `package.json` (`"test": "jest"`).

**Interfaces:** Consumes `Box`, `MotionBadge` and `themes` (`@unison-ui/tokens/native`).

- [ ] **Step 1: Dev dependencies.**
  `pnpm --filter @unison-ui/native add -D jest jest-expo@<apps/mobile's expo major, e.g. ~58> @testing-library/react-native test-renderer expo@<apps/mobile's expo version> @react-native/jest-preset@<react-native version>`.
  These are `jest-expo`'s and RNTL 14's peers, listed explicitly so the package resolves on its
  own. Use the versions from `apps/mobile/package.json`; don't type new ones.
- [ ] **Step 2: `jest.config.js`.**
  `module.exports = { preset: "jest-expo" };`. The package is `"type": "module"`, so name it
  `jest.config.cjs` if Jest refuses ESM config. If Jest fails with
  `Cannot use import statement outside a module` for an `@unison-ui/*` file, add
  `transformIgnorePatterns` with jest-expo's default pattern plus `|@unison-ui/.*`.
- [ ] **Step 3: `box.test.tsx`.**

```tsx
import { render, screen } from "@testing-library/react-native";
import { themes } from "@unison-ui/tokens/native";
import * as RN from "react-native";
import { Box } from "../src/box";

afterEach(() => jest.restoreAllMocks());

test("accent box uses the light accent", () => {
  render(<Box testID="b" />);
  expect(screen.getByTestId("b")).toHaveStyle({ backgroundColor: themes.light.color.accent });
});
test("neutral box in dark uses the dark surface", () => {
  jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");
  render(<Box tone="neutral" testID="n" />);
  expect(screen.getByTestId("n")).toHaveStyle({ backgroundColor: themes.dark.color.surface });
});
```

  If `jest.spyOn(RN, "useColorScheme")` can't redefine the export, use
  `jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({ __esModule: true, default: jest.fn(() => "dark") }))`.
- [ ] **Step 4: `motion-badge.test.tsx`.**
  `jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true)`, render, then
  `expect(await screen.findByText("motion: reduced")).toBeOnTheScreen()`.
- [ ] **Step 5: Watch it fail.** Temporarily swap `"dark"` / `"light"` in `useUnisonTheme` and run
  `pnpm --filter @unison-ui/native test`. Expect: the dark test FAILS. Revert.
- [ ] **Step 6: Verify.** Run `pnpm --filter @unison-ui/native test`. Expect:
  `Tests: 3 passed, 3 total`.

### Task 18f: The `ui` contract test, coverage, then the full run and commit

**Files:** Create `packages/ui/test/contract.test-d.ts` and `packages/ui/vitest.config.ts`. Modify
`packages/ui/package.json`.

**Interfaces:** Consumes the public exports of `@unison-ui/react` and `@unison-ui/native`.

- [ ] **Step 1: Config.** `test: { typecheck: { enabled: true, only: true, include: ["test/**/*.test-d.ts"] } }`.
  Dev dependencies: `vitest`, `react-native@<probe version>` (for the types),
  `@types/react@catalog:`. The test script is `vitest run` (coverage isn't meaningful for a
  type-only test).
- [ ] **Step 2: `contract.test-d.ts`.**

```ts
import type { ComponentProps } from "react";
import { expectTypeOf, test } from "vitest";
import type * as Native from "@unison-ui/native";
import type * as Web from "@unison-ui/react";

test("same export names", () => {
  expectTypeOf<keyof typeof Web>().toEqualTypeOf<keyof typeof Native>();
});
test("same props", () => {
  expectTypeOf<ComponentProps<typeof Web.Box>>().toEqualTypeOf<ComponentProps<typeof Native.Box>>();
  expectTypeOf<ComponentProps<typeof Web.MotionBadge>>().toEqualTypeOf<ComponentProps<typeof Native.MotionBadge>>();
});
```

- [ ] **Step 3: Coverage.** Every Vitest package's `test` script is `vitest run --coverage` with
  `coverage.provider: "v8"`; it's reported, not enforced (`ui` excepted, see Step 1).
- [ ] **Step 4: Watch it fail (the todo's sabotage).** In `packages/native/src/box.tsx`, change the
  signature to `({ …, extra }: BoxProps & { extra?: string })`, then run
  `pnpm build --filter @unison-ui/native && pnpm --filter @unison-ui/ui test`. Expect: a type
  error in `contract.test-d.ts` on the "same props" test. Revert with
  `git checkout packages/native/src/box.tsx`.
- [ ] **Step 5: Verify (all of step 18).**
  Run: `pnpm test; echo "exit=$?"`
  Expect: Turbo runs `test` in tokens, core, motion, react, native and ui, all passing; `exit=0`.
- [ ] **Step 6: Commit.** `test: unit and contract tests for all packages`

---

# Section 11: Parity harness

Shared definitions used by Tasks 19–22 (write them in `packages/parity/src/types.ts` in Task 19):

```ts
export type Platform = "web-chromium" | "web-webkit" | "ios" | "android";
export interface Rect { x: number; y: number; width: number; height: number }
export interface Metrics {
  platform: Platform;
  run: string;                       // "box/accent/dark"
  pixelRatio: number;
  stage: Rect;                       // stage in window coordinates
  parts: { subject: Rect };          // relative to stage
}
export const OUT = "parity-output";  // relative to packages/parity
export const metricsPath = (p: Platform, run: string) => `${OUT}/metrics/${p}/${run}.json`;
export const screenshotPath = (p: Platform, run: string) => `${OUT}/screenshots/${p}/${run}.png`;
export const baselinePath = (p: Platform, run: string) => `baselines/${p}/${run}.png`;
```

### Task 19: `packages/parity`: fixtures, collector, compare, report (todo step 19)

**Files:**
- Create in `packages/parity/`: `package.json`, `tsconfig.json`, `tsdown.config.ts`,
  `src/types.ts`, `src/fixtures/{box,index}.ts`, `src/registry.tsx`, `scripts/{collector,compare,report,run}.ts`,
  `baselines/.gitkeep`, `test-fixtures/metrics/{web-chromium,ios}/box/accent/light.json`
- Delete: `packages/parity/.gitkeep`

**Interfaces:**
- Consumes: `Box` from `@unison-ui/ui`.
- Produces:
  - `boxFixture`
  - `fixtures: readonly Fixture[]`
  - `SCHEMES = ["light", "dark"] as const`
  - `runs(): Array<{ id: string; component: string; caseName: string; scheme: "light" | "dark"; props: object }>`
  - `registry = { box: Box }`
  - the `@unison-ui/parity/registry` export, which also re-exports `fixtures` and `SCHEMES` so the
    apps can look up case props
  - the collector `POST /metrics` on :4545
  - the CLI flags `compare.ts [--update] [--metrics-dir <dir>]` and
    `run.ts --platform web|ios|android|all [--update]`
  - the stage contract: test ids `stage` (width 390, padding 16, background `color.surface`,
    top-left) and `subject`, plus a ready signal

- [ ] **Step 1: Scaffold.**
  - `"name": "@unison-ui/parity"`, `"private": true`, `"type": "module"`.
  - Dependency: `"@unison-ui/ui": "workspace:^"`. Peer: `react`.
  - Dev dependencies: `@playwright/test`, `@axe-core/playwright`, `pixelmatch`, `pngjs`,
    `@types/pngjs`, `sharp`, `tsx`, `@types/node`, `tsdown`, `typescript@catalog:`,
    `@types/react@catalog:`, `@unison-ui/tsconfig@workspace:*`.
  - Scripts: `"build": "tsdown"`, `"typecheck": "tsc --noEmit"`,
    `"test:parity": "tsx scripts/run.ts"`.
  - `exports`: `{ "./registry": { "types": "./dist/registry.d.ts", "default": "./dist/registry.js" } }`.
  - `tsconfig.json` extends `base.json`, with `types: ["node"]` and
    `include: ["src", "scripts", "tests"]`.
  - Do **not** run Playwright's browser install. The container has Chromium preinstalled (see
    Task 20 for WebKit).
- [ ] **Step 2: Fixtures.** `src/fixtures/box.ts` is the todo's snippet verbatim. `index.ts`:

```ts
import { boxFixture } from "./box";
export const fixtures = [boxFixture] as const;
export const SCHEMES = ["light", "dark"] as const;
export type Scheme = (typeof SCHEMES)[number];
export function runs() {
  return fixtures.flatMap((f) =>
    Object.entries(f.cases).flatMap(([caseName, props]) =>
      SCHEMES.map((scheme) => ({ id: `${f.component}/${caseName}/${scheme}`, component: f.component, caseName, scheme, props })),
    ),
  );
}
```

- [ ] **Step 3: `src/registry.tsx`.**

```tsx
import { Box } from "@unison-ui/ui";
export const registry = { box: Box } as const;
export { fixtures, SCHEMES } from "./fixtures";
```

  `tsdown.config.ts`:
  `{ entry: { registry: "src/registry.tsx" }, format: "esm", dts: true, platform: "neutral", external: [/^react/, /^@unison-ui\//] }`
- [ ] **Step 4: `scripts/collector.ts`.** Exports `startCollector(port = 4545): Promise<() => Promise<void>>`.
  It's a `node:http` server:
  - `OPTIONS` → 204, with `Access-Control-Allow-Origin: *` and
    `Access-Control-Allow-Headers: content-type`.
  - `POST /metrics`: parse the JSON body as `Metrics`, check `platform` is one of the four and
    `run` matches `/^[a-z0-9-]+\/[a-z0-9-]+\/(light|dark)$/` (else 400),
    `mkdirSync(dirname(path), { recursive: true })`, write `metricsPath(platform, run)`
    pretty-printed, respond 204.
  - Anything else → 404.
  - When run directly (`import.meta.url === pathToFileURL(process.argv[1]).href`), start it and
    log `collector listening on :4545`.
- [ ] **Step 5: `scripts/compare.ts`.** Exports
  `compare(opts: { update?: boolean; baselineOnly?: boolean; crossOnly?: boolean; metricsDir?: string }): string[]`,
  which returns failure lines. It's also a CLI that prints the failures and exits 1 if there are
  any, otherwise prints `parity ok (<n> runs)`.
  - **Cross-platform** (skipped if `baselineOnly`): for every run id found under
    `<metricsDir ?? OUT/metrics>/*/`, load the metrics of `web-chromium`, `ios` and `android`
    **that exist** (⚠ OQ-14). For each pair and each of `x`, `y`, `width` and `height` of
    `parts.subject`, if `|a - b| > 1` push
    `FAIL <run>: subject.<prop> <pA>=<a> <pB>=<b> (Δ<abs diff>)`.
  - **Baselines** (skipped if `crossOnly`): for every PNG under `OUT/screenshots/<platform>/**`,
    with `update` copy it to `baselinePath(...)`. Otherwise:
    - baseline missing → `FAIL <run> [<platform>]: missing baseline (run with --update)`
    - sizes differ → `FAIL <run> [<platform>]: size <w>x<h> vs baseline <w>x<h>`
    - else `pixelmatch(a, b, null, w, h, { threshold: 0.1 })` and, if `diff / (w*h) > 0.001`,
      `FAIL <run> [<platform>]: <pct>% pixels differ`
  - Parse flags with `node:util` `parseArgs`: `--update`, `--baseline-only`, `--cross-only` and
    `--metrics-dir`. (Task 22 relies on the two "-only" flags; adding them now costs nothing, and
    Task 22 verifies them.)
- [ ] **Step 6: `scripts/report.ts`.** Exports `writeReport(failures: string[]): string`. It writes
  `parity-output/report.html` (static HTML, inline CSS) with:
  - one `<tr>` per run id from `runs()`
  - four `<td>` columns, web-chromium | web-webkit | iOS | Android, each holding the screenshot
    `<img src="screenshots/<platform>/<run>.png">` or "—" when missing
  - a row underneath with the metrics table (x, y, width, height per platform) and any failure
    lines for that run
  - failing rows get `class="fail"` (red outline)

  Returns the path.
- [ ] **Step 7: `scripts/run.ts`.** `parseArgs` options:
  - `--platform` (`web|ios|android|all`, default `all`)
  - `--update`
  - (Task 22 adds `--baseline-only`)

  Order:
  1. `const stop = await startCollector()`
  2. run each selected platform. Web: Task 20. Native: Task 21. For a native platform whose
     simulator isn't running, print a `warn: skipping ios (no booted simulator)` line.
     - iOS check: `xcrun simctl list devices booted` contains `(Booted)`.
     - Android check: `adb devices` has a line ending in `\tdevice`.
  3. `compare(...)`
  4. `writeReport(...)`
  5. `await stop()`
  6. exit 1 if compare failed

  Until Tasks 20/21 exist, the platform runners are functions that throw
  `new Error("web runner not implemented (Task 20)")`.
- [ ] **Step 8: Hand-made fixture metrics.**
  `test-fixtures/metrics/web-chromium/box/accent/light.json` contains
  `{ "platform": "web-chromium", "run": "box/accent/light", "pixelRatio": 2, "stage": {"x":0,"y":0,"width":390,"height":128}, "parts": { "subject": {"x":16,"y":16,"width":96,"height":96} } }`.
  The `ios/…` copy is the same, with `"platform": "ios"`, `"pixelRatio": 3` and `subject.x` = `18`.
- [ ] **Step 9: Verify.**
  Run: `cd packages/parity && pnpm exec tsx scripts/compare.ts --cross-only --metrics-dir test-fixtures/metrics; echo "exit=$?"`
  Expect: `FAIL box/accent/light: subject.x web-chromium=16 ios=18 (Δ2)` and `exit=1`.
  Then `pnpm --filter @unison-ui/parity build typecheck` exits 0, and
  `ls packages/parity/dist/registry.js` exists.
- [ ] **Step 10: Commit.** `feat(parity): fixtures, collector, compare and report`

### Task 20: Web runner, Playwright (todo step 20)

**Files:** Modify `apps/web-vite/src/parity-page.tsx` and `apps/web-vite/package.json` (add
`"@unison-ui/parity": "workspace:*"`). Create `packages/parity/playwright.config.ts` and
`packages/parity/tests/web.spec.ts`. Modify `packages/parity/scripts/run.ts`.

**Interfaces:**
- Consumes: `registry`, `fixtures`, `runs()`, `Metrics`, `screenshotPath` and `metricsPath`
  (Task 19); the Vite app on :5173 (Task 16).
- Produces: the ready signal `html[data-parity-ready]` on web; Playwright projects `web-chromium`
  and `web-webkit`; `runWeb({ update }): Promise<void>` in `run.ts`.

- [ ] **Step 1: `parity-page.tsx`.**

```tsx
import { fixtures, registry } from "@unison-ui/parity/registry";
import { useEffect } from "react";

export function ParityPage() {
  const [, , component = "", caseName = ""] = location.pathname.split("/");
  const scheme = new URLSearchParams(location.search).get("scheme") === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = scheme;
  const fixture = fixtures.find((f) => f.component === component);
  const props = fixture?.cases[caseName as keyof typeof fixture.cases];
  const Subject = registry[component as keyof typeof registry];

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!cancelled) document.documentElement.dataset.parityReady = "";
      })),
    );
    return () => { cancelled = true; };
  }, []);

  if (!Subject || !props) return <p>unknown case</p>;
  return (
    <div data-testid="stage" style={{ width: 390, padding: 16, background: "var(--unison-color-surface)", display: "flex", alignItems: "flex-start", justifyContent: "flex-start", boxSizing: "border-box" }}>
      <Subject {...props} testID="subject" />
    </div>
  );
}
```

  Rebuild with `pnpm --filter web-vite... build` to check it compiles.
- [ ] **Step 2: `playwright.config.ts`.**

```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  reporter: "list",
  use: { baseURL: "http://localhost:5173", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  webServer: { command: "pnpm --filter web-vite dev", url: "http://localhost:5173", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "web-chromium", use: { browserName: "chromium" } },
    { name: "web-webkit", use: { browserName: "webkit" } },
  ],
});
```

- [ ] **Step 3: `tests/web.spec.ts`.**

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { runs } from "../src/fixtures";
import { type Metrics, type Platform, metricsPath, screenshotPath } from "../src/types";

for (const r of runs()) {
  test(r.id, async ({ page }, info) => {
    const platform = info.project.name as Platform;
    await page.goto(`/parity/${r.component}/${r.caseName}?scheme=${r.scheme}`);
    await page.locator("html[data-parity-ready]").waitFor({ state: "attached" });
    const stage = page.getByTestId("stage");
    const shot = screenshotPath(platform, r.id);
    mkdirSync(dirname(shot), { recursive: true });
    await stage.screenshot({ path: shot });
    const s = await stage.boundingBox();
    const sub = await page.getByTestId("subject").boundingBox();
    if (!s || !sub) throw new Error("stage or subject not found");
    const m: Metrics = {
      platform, run: r.id, pixelRatio: 2, stage: s,
      parts: { subject: { x: sub.x - s.x, y: sub.y - s.y, width: sub.width, height: sub.height } },
    };
    const mp = metricsPath(platform, r.id);
    mkdirSync(dirname(mp), { recursive: true });
    writeFileSync(mp, JSON.stringify(m, null, 2));
    const axe = await new AxeBuilder({ page }).include('[data-testid="stage"]').analyze();
    expect(axe.violations).toEqual([]);
  });
}
```

- [ ] **Step 4: `run.ts` `runWeb`.** It runs `pnpm exec playwright test` (with `--trace off`)
  from `packages/parity` via `spawnSync(..., { stdio: "inherit" })`, and throws if it exits
  non-zero. With `--platform web`, compare runs baselines and cross-checks. Only web-chromium is
  in the cross set, so cross passes trivially (⚠ OQ-14).
- [ ] **Step 5: Browsers.** Chromium is preinstalled here, so don't run `playwright install` for
  it. WebKit isn't preinstalled. In this container, run
  `pnpm --filter @unison-ui/parity exec playwright install webkit` only if `@playwright/test`'s
  version matches the preinstalled one (`node -p "require('playwright/package.json').version"`).
  Otherwise, verify WebKit on your Mac or in CI.
- [ ] **Step 6: Verify the baseline creation.**
  Run: `pnpm test:parity --platform web --update && find packages/parity/baselines -name "*.png" | wc -l`
  Expect: 8 Playwright tests passed (2 cases × 2 schemes × 2 browsers) and a count of `8`.
- [ ] **Step 7: Verify a rerun passes.**
  Run: `pnpm test:parity --platform web; echo "exit=$?"`
  Expect: `parity ok (4 runs)` (or similar) and `exit=0`.
- [ ] **Step 8: Commit** (including `packages/parity/baselines/**`). `feat(parity): web runner`

### Task 21: Native runner, Maestro (todo step 21; macOS ⚠ OQ-17)

**Files:**
- Modify: `apps/mobile/app/parity/[component]/[case].tsx`, `apps/mobile/package.json` (add
  `"@unison-ui/parity": "workspace:*"`), `packages/parity/scripts/run.ts`
- Create: `packages/parity/maestro/case.yaml`, and `packages/parity/parity-devices.json` (the
  device names that Task 26 copies into `CONTRIBUTING.md`)

**Interfaces:**
- Consumes: the collector (Task 19); `useUnisonTheme` from `@unison-ui/native`. ⚠ It isn't
  exported from `@unison-ui/ui`, and Task 12 fixes the export names to `Box`, `MotionBadge` and
  `BoxProps`. So the stage reads `themes` from `@unison-ui/tokens/native` together with
  `useColorScheme()` instead. That's equivalent, and it keeps the export contract.
- Produces: `runNative(platform: "ios" | "android", { update }): Promise<void>`; native
  screenshots at `parity-output/screenshots/<ios|android>/<run>.png`.

- [ ] **Step 1: The parity route.**

```tsx
import { fixtures, registry } from "@unison-ui/parity/registry";
import { themes } from "@unison-ui/tokens/native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Appearance, LogBox, PixelRatio, Platform, Text, useColorScheme, View } from "react-native";

LogBox.ignoreAllLogs();
const COLLECTOR = Platform.OS === "android" ? "http://10.0.2.2:4545" : "http://localhost:4545";

export default function ParityCase() {
  const { component = "", case: caseName = "", scheme = "light" } = useLocalSearchParams<{ component: string; case: string; scheme?: string }>();
  const target = scheme === "dark" ? "dark" : "light";
  useEffect(() => { Appearance.setColorScheme(target); }, [target]);
  const active = useColorScheme() === "dark" ? "dark" : "light";
  const stage = useRef<View>(null);
  const subject = useRef<View>(null);
  const [ready, setReady] = useState(false);
  const fixture = fixtures.find((f) => f.component === component);
  const props = fixture?.cases[caseName as keyof typeof fixture.cases];
  const Subject = registry[component as keyof typeof registry];

  function onLayout() {
    if (active !== target || !stage.current || !subject.current) return;
    subject.current.measureLayout(stage.current, (x, y, width, height) => {
      stage.current?.measureInWindow(async (sx, sy, sw, sh) => {
        await fetch(`${COLLECTOR}/metrics`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            platform: Platform.OS, run: `${component}/${caseName}/${target}`, pixelRatio: PixelRatio.get(),
            stage: { x: sx, y: sy, width: sw, height: sh }, parts: { subject: { x, y, width, height } },
          }),
        });
        setReady(true);
      });
    });
  }

  if (!Subject || !props) return <Text>unknown case</Text>;
  return (
    <View style={{ flex: 1 }}>
      <View ref={stage} testID="stage" onLayout={onLayout}
        style={{ width: 390, padding: 16, backgroundColor: themes[active].color.surface, alignItems: "flex-start" }}>
        <View ref={subject} collapsable={false}><Subject {...props} testID="subject" /></View>
      </View>
      {ready && <Text testID="parity-ready">ready</Text>}
    </View>
  );
}
```

  Note the `collapsable={false}` wrapper. `measureLayout` needs a native view ref, and the `Box`
  doesn't forward refs. The wrapper has the same frame as the `Box`, so the metrics are
  unaffected. Re-trigger `onLayout` after the scheme flips: put `active` in the stage's `key`.
- [ ] **Step 2: `maestro/case.yaml`.** The todo's YAML verbatim.
- [ ] **Step 3: `run.ts` `runNative`.** For each run:
  1. `maestro test -e COMPONENT=… -e CASE=… -e SCHEME=… -e OUT=<abs tmp path without .png> maestro/case.yaml`
  2. read `metricsPath(platform, run)` (posted by the app)
  3. crop the full-screen PNG with
     `sharp(full).extract({ left: round(stage.x*pr), top: round(stage.y*pr), width: round(stage.width*pr), height: round(stage.height*pr) })`
  4. write it to `screenshotPath(platform, run)`

  Throw if the metrics file is missing after Maestro returns.
- [ ] **Step 4: Release builds.**
  `cd apps/mobile && npx expo run:ios --configuration Release` and
  `npx expo run:android --variant release`.
- [ ] **Step 5: Fix the devices.**
  - iOS: a 390-pt-wide iPhone simulator. Check with `xcrun simctl list devicetypes`; for example,
    "iPhone 16e" is 390×844 pt. Confirm the width from the device spec before you choose.
    Create it as `xcrun simctl create "Unison Parity iPhone" "<device type id>"`.
  - Android: `avdmanager create avd -n unison-parity -d pixel_7 -k "system-images;android-<API>;google_apis;<arch>"`.
    `<API>` is the `targetSdkVersion` from `apps/mobile/android/build.gradle` after
    `npx expo prebuild`; `<arch>` is `arm64-v8a` on Apple Silicon and `x86_64` elsewhere.
  - Write both to `packages/parity/parity-devices.json` as
    `{ "ios": { "name": "Unison Parity iPhone", "deviceType": "…", "runtime": "…" }, "android": { "avd": "unison-parity", "device": "pixel_7", "systemImage": "…" } }`.
- [ ] **Step 6: Verify baselines on all four platforms.**
  Run (both devices booted): `pnpm test:parity --update && pnpm test:parity; echo "exit=$?"`
  Expect: the first run writes 16 baselines (4 runs × 4 platforms); the second prints `parity ok`
  and `exit=0`; `packages/parity/parity-output/report.html` shows four filled, matching columns.
- [ ] **Step 7: Sabotage check.** Add `margin: 2` to the native `Box` style, then
  `pnpm build --filter @unison-ui/native` and rebuild both release apps.
  Run: `pnpm test:parity; echo "exit=$?"`
  Expect: a `FAIL <run>: subject.x … (Δ2)` (and `.y`) line for **every** native run (8 runs ×
  pairs), and `exit=1`. Revert, rebuild.
- [ ] **Step 8: Commit** (including the native baselines). `feat(parity): native runner`

---

# Section 12: Continuous integration

### Task 22: `.github/workflows/ci.yml` (todo step 22)

**Files:** Create `.github/workflows/ci.yml`. Modify `packages/parity/scripts/{run,compare}.ts`.
Delete `.github/workflows/.gitkeep`.

**Interfaces:**
- Consumes: the root scripts `lint`, `check:packages` and `test:parity`; `compare.ts`'s
  `--cross-only`; `parity-devices.json` (Task 21).
- Produces: the jobs `check`, `changes`, `parity-web`, `parity-ios`, `parity-android` and
  `parity-compare`; `run.ts --baseline-only`.

- [ ] **Step 1: Flags.** `run.ts` accepts `--baseline-only` and passes it to
  `compare({ baselineOnly: true })`. `compare.ts` already parses `--baseline-only` and
  `--cross-only` (Task 19).
  Verify: `cd packages/parity && pnpm exec tsx scripts/compare.ts --baseline-only --metrics-dir test-fixtures/metrics; echo "exit=$?"` prints
  `parity ok …` with `exit=0` (cross skipped). The `--cross-only` run from Task 19 Step 9 still
  fails.
- [ ] **Step 2: Write `ci.yml`.**
  - `on: { pull_request: {}, push: { branches: [main] } }`, plus the todo's `concurrency`.
  - Every job starts with the todo's four setup steps verbatim.
  - The jobs follow the todo's table:
    - `check`: `pnpm lint`, `pnpm turbo run typecheck test build --affected`,
      `pnpm check:packages`.
    - `changes`: `dorny/paths-filter@v3` with a filter `native` on `packages/**`,
      `apps/mobile/**` and `packages/parity/**`. Output: `native`.
    - `parity-web` (`needs: check`):
      `pnpm --filter @unison-ui/parity exec playwright install --with-deps chromium webkit`, then
      `pnpm test:parity --platform web --baseline-only`.
    - `parity-ios` (`macos-latest`, `needs: [check, changes]`,
      `if: needs.changes.outputs.native == 'true'`):
      1. install Maestro (`curl -fsSL "https://get.maestro.mobile.dev" | bash` and add
         `$HOME/.maestro/bin` to `GITHUB_PATH`)
      2. boot the simulator from `parity-devices.json`
      3. `pnpm build`
      4. `cd apps/mobile && npx expo run:ios --configuration Release --device "<name>"`
      5. `pnpm test:parity --platform ios --baseline-only`
    - `parity-android` (`ubuntu-latest`, same `needs` and `if`):
      1. enable KVM (the udev rule snippet from the `android-emulator-runner` README)
      2. `actions/setup-java@v4` with `distribution: temurin` and `java-version: 17`
      3. Maestro install
      4. `reactivecircus/android-emulator-runner@v2` with the API, arch and profile from
         `parity-devices.json`; its `script` runs
         `pnpm build && (cd apps/mobile && npx expo run:android --variant release) && pnpm test:parity --platform android --baseline-only`
    - `parity-compare`: `needs: [parity-web, parity-ios, parity-android]`,
      `if: always() && !contains(needs.*.result, 'failure') && !contains(needs.*.result, 'cancelled')`.
      It runs `actions/download-artifact@v4` with `path: packages/parity/parity-output` and
      `merge-multiple: true`, then `pnpm exec tsx packages/parity/scripts/compare.ts --cross-only`
      and `report.ts` (run from `packages/parity`), and uploads `report.html` as the artifact
      `parity-report`.
  - Every parity job ends with `actions/upload-artifact@v4`
    (`name: parity-${{ github.job }}`, `path: packages/parity/parity-output`,
    `if: always()`).
- [ ] **Step 3: Lint the workflow locally.**
  Run: `npx -y @action-validator/cli .github/workflows/ci.yml` (or `actionlint` if available).
  Expect: no errors.
- [ ] **Step 4 (human, ⚠ OQ-5 for the repo):** branch protection on `main`:
  - require `check`, `parity-web` and `parity-compare`
  - require a linear history
  - allow squash merges only

  The executor can do this with `gh api` only with your explicit OK.
- [ ] **Step 5: Optional.** If `check` takes over 5 minutes, add the `TURBO_TOKEN` / `TURBO_TEAM`
  secrets and `env` to the jobs.
- [ ] **Step 6: Verify on GitHub.**
  1. Open a PR touching `packages/native/src/box.tsx` (e.g. a comment). Expect: all six jobs
     green, and the `parity-report` artifact contains `report.html`.
  2. Open a PR touching only `README.md`. Expect: `parity-ios` and `parity-android` are
     **skipped**, `parity-compare` runs, and the PR is mergeable under the protection rules.
  3. Close both PRs without merging (or merge the README one if it's a real change).
- [ ] **Step 7: Commit.** `ci: checks and parity pipeline`

---

# Section 13: Releases, dependency updates, git hooks

### Task 23: Changesets and npm publishing (todo step 23)

**Files:**
- Create: `.changeset/config.json`, `.changeset/README.md` (from init),
  `.github/workflows/release.yml`, `.github/workflows/snapshot.yml`
- Modify: every public `packages/*/package.json`, and the root `package.json`

**Interfaces:**
- Consumes: the CI setup steps (Task 22).
- Produces: the root script `release`; the `snapshot` label flow.

- [ ] **Step 1:** Run `pnpm changeset init`, then replace `.changeset/config.json` with the todo's
  block verbatim.
  Verify: `pnpm changeset status` exits 0. If changesets v3 rejects
  `"changelog": "@changesets/cli/changelog"`, record the error and use the default changelog v3
  documents (a finding, not a guess).
- [ ] **Step 2:** Check that `@unison-ui/tsconfig`, `@unison-ui/parity` and `demo-content` are
  `"private": true`.
  Add to tokens, core, motion, react, native and ui:
  - `"publishConfig": { "access": "public", "provenance": true }`
  - `"license": "MIT"`
  - `"repository": { "type": "git", "url": "git+https://github.com/<OQ-5>/unison.git", "directory": "packages/<name>" }`
  - `"homepage": "https://github.com/<OQ-5>/unison#readme"`

  ⚠ OQ-5 decides the owner. Don't publish until it's answered.
- [ ] **Step 3:** Add the root script `"release": "pnpm build && changeset publish"`.
- [ ] **Step 4: `release.yml`.**
  - `on: push: branches: [main]`
  - `permissions: { contents: write, pull-requests: write, id-token: write }`
  - the same four setup steps as CI
  - `changesets/action@v1` with `publish: pnpm release`
  - `env: GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` and `NPM_TOKEN: ${{ secrets.NPM_TOKEN }}`
    (the latter only until Trusted Publishing is set up)
- [ ] **Step 5: `snapshot.yml`.**
  - `on: pull_request: types: [labeled, synchronize]`
  - `if: contains(github.event.pull_request.labels.*.name, 'snapshot')`
  - the same permissions plus `issues: write`
  - steps:
    1. the setup steps
    2. `pnpm build`
    3. `pnpm changeset version --snapshot pr${{ github.event.number }}`
    4. `pnpm changeset publish --tag pr${{ github.event.number }} --no-git-tag`
    5. `actions/github-script@v7` posts a comment with
       `pnpm add @unison-ui/ui@pr${{ github.event.number }} @unison-ui/tokens@pr${{ github.event.number }}`
- [ ] **Step 6 (human):** create the npm automation token as the `NPM_TOKEN` secret. After the
  first real publish, configure Trusted Publishing per package (npmjs.com → package → Settings →
  Trusted Publisher → GitHub Actions, this repo, `release.yml`), then delete the token.
- [ ] **Step 7: Verify locally.**
  Run: `pnpm build && pnpm check:packages && pnpm changeset status`
  Expect: publint no longer warns about `repository` or `license`; attw is clean.
- [ ] **Step 8: Verify on GitHub.** Open a PR with one changeset (`pnpm changeset`, patch, all
  public packages) and add the label `snapshot`.
  Expect:
  - the workflow publishes `0.0.0-pr<n>-<timestamp>` for all six public packages under the dist
    tag `pr<n>` (`npm view @unison-ui/ui dist-tags` shows `pr<n>`)
  - the bot comment appears
  - npmjs.com shows the provenance badge on each version
- [ ] **Step 9: Commit.** `ci: changesets release and snapshot publishing`

### Task 24: Renovate (todo step 24)

**Files:** Create `renovate.json` and `docs/expo-upgrade.md`.

**Interfaces:** Consumes the package names pinned by Expo (Task 17).

- [ ] **Step 1 (human):** install the Renovate GitHub App on the repo.
- [ ] **Step 2: `renovate.json`.** The todo's block verbatim.
- [ ] **Step 3: `docs/expo-upgrade.md`.** The manual procedure:
  1. `cd apps/mobile`
  2. `npx expo install expo@latest`
  3. `npx expo install --fix`
  4. copy the resulting `react` version into `pnpm-workspace.yaml` → `catalog.react` and
     `react-dom`, and update `@types/react` to match
  5. `pnpm install`
  6. `pnpm check`
  7. `pnpm test:parity` on all four platforms (both simulators running)
  8. commit as `chore(mobile): upgrade to Expo SDK <n>`
- [ ] **Step 4: Verify locally.**
  Run: `npx -y --package renovate -- renovate-config-validator renovate.json`
  Expect: `Config validated successfully`.
- [ ] **Step 5: Verify on GitHub.** Renovate's onboarding PR is merged, and the "Dependency
  Dashboard" issue exists (`gh api -X GET search/issues -f q='repo:<owner>/unison "Dependency Dashboard"'`).
- [ ] **Step 6: Commit.** `chore: renovate config`

### Task 25: Git hooks, Lefthook (todo step 25)

**Files:** Create `lefthook.yml`. Modify the root `package.json`.

**Interfaces:** Consumes `pnpm lint` and turbo `typecheck`.

- [ ] **Step 1:** Add the root script `"prepare": "lefthook install"`. Write `lefthook.yml` from the
  todo's block verbatim. Run `pnpm install` (which installs the hooks).
- [ ] **Step 2: Verify that committing on main is blocked.**
  Run: `git stash -u; git switch main && git commit --allow-empty -m "test"; echo "exit=$?"; git switch -; git stash pop`
  Expect: `Commit on a branch, not main.` and a non-zero exit. (Run it on a throwaway clone if
  `main` is checked out elsewhere.)
- [ ] **Step 3: Verify auto-format.** On the feature branch, `printf 'export const a = {b:1}\n' > packages/core/src/tmp.ts && git add packages/core/src/tmp.ts && git commit -m "test: tmp"`.
  Expect: the commit succeeds, and `git show HEAD:packages/core/src/tmp.ts` prints
  `export const a = { b: 1 };`. Then `git reset --hard HEAD~1`.
- [ ] **Step 4: Verify that a type error blocks the push.** Commit
  `export const n: number = "x";` in `packages/core/src/tmp.ts`, then run
  `git push --dry-run; echo "exit=$?"`.
  Expect: lefthook's `verify` fails with `TS2322` and a non-zero exit. Then
  `git reset --hard HEAD~1`.
- [ ] **Step 5: Commit.** `chore: git hooks`

---

# Section 14: Docs, decisions and tooling for phase 1+

### Task 26: `CONTRIBUTING.md` and the doctor script (todo step 26)

**Files:**
- Create: `tooling/scripts/doctor.ts`, `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`,
  `.github/ISSUE_TEMPLATE/{bug,feature}.yml`
- Modify: the root `package.json`
- Delete: `.github/ISSUE_TEMPLATE/.gitkeep`

**Interfaces:** Consumes `.nvmrc`, `packageManager` and `packages/parity/parity-devices.json`.

- [ ] **Step 1: `doctor.ts`** (`"doctor": "tsx tooling/scripts/doctor.ts"`). It's a list of checks
  `{ name, run: () => boolean | Promise<boolean>, fix: string, when?: () => boolean }`. Each
  prints `✓ name` or `✗ name → fix`. It exits 1 if any applicable check fails.
  - **Node:** `process.versions.node.split(".")[0] === readFileSync(".nvmrc").trim()`.
    Fix: `nvm use`.
  - **pnpm:** `execSync("pnpm -v")` equals the version in `packageManager`.
    Fix: `corepack install`.
  - **Xcode** (macOS only): `xcodebuild -version`. Fix: install Xcode from the App Store.
  - **Parity simulator** (macOS only): `xcrun simctl list devices` contains
    `parity-devices.json`'s `ios.name`. Fix: the `xcrun simctl create …` line from
    CONTRIBUTING.md.
  - **watchman** (macOS only): `watchman -v`. Fix: `brew install watchman`.
  - **`ANDROID_HOME`** is set. Fix: export it, pointing at the Android SDK.
  - **adb:** `adb version`. Fix: add `$ANDROID_HOME/platform-tools` to `PATH`.
  - **Parity emulator:** `emulator -list-avds` contains `android.avd`. Fix: the
    `avdmanager create avd …` line.
  - **Maestro:** `maestro --version`. Fix: the curl install line.
  - **Ports 3000, 5173, 8081 and 4545 are free:** `net.createServer().listen(port)` succeeds, then
    close it. Fix: `lsof -i :<port>`.
- [ ] **Step 2: `CONTRIBUTING.md`.** Six sections in the todo's order:
  1. Prerequisites (copied from todo section 0, with the Node version from OQ-3), then
     `pnpm install && pnpm doctor`
  2. Running things
  3. Parity devices (from `parity-devices.json`, with the exact create commands)
  4. Tests, plus the baseline-update policy: only for intended visual changes, explained in the PR
  5. Commits and PRs: Conventional Commits; `pnpm changeset` for each user-facing change; no AI
     attribution trailers
  6. Troubleshooting: `npx expo start -c`; `pnpm build`; uninstall a stale simulator app with
     `xcrun simctl uninstall booted dev.unison.demo` / `adb uninstall dev.unison.demo`
- [ ] **Step 3: Templates.**
  - `PULL_REQUEST_TEMPLATE.md`: headings "What changed", "Screenshots / parity report", a
    checkbox "- [ ] Changeset added (or not needed)", and "Baselines updated? Why?".
  - `bug.yml`: GitHub issue form with a `dropdown` "Platform" (Web, iOS, Android, `multiple: true`),
    an `input` "Package version", and a `textarea` "Reproduction" (required).
  - `feature.yml`: `textarea`s "Problem" and "Proposal".
- [ ] **Step 4 (human, or `gh api` with OK):** create the labels `web`, `native`, `motion`, `a11y`,
  `tokens`, `parity` and `snapshot`.
- [ ] **Step 5: Verify.**
  Run: `pnpm doctor; echo "exit=$?"`
  Expect: on your Mac with everything installed, every line is `✓` and `exit=0`. In this Linux
  container, the macOS checks are skipped and the Android and Maestro checks show `✗` with fixes.
  That's the expected output there; it proves the ✗ path.
  Then do the fresh-clone dry-run: `git clone <repo> /tmp/unison-fresh && cd /tmp/unison-fresh`,
  and follow only `CONTRIBUTING.md` sections 1–2. Expect: `pnpm dev` starts all three apps.
  Record any gap and fix the doc.
- [ ] **Step 6: Commit.** `docs: contributing guide and doctor`

### Task 27: Architecture doc and ADRs (todo step 27)

**Files:**
- Create: `docs/architecture.md`, `docs/adr/0000-template.md` through `0010-mit-license.md`
- Modify: `docs/planning/todos/phase-0.md`, only to turn the section 0 decision rows into links
  (the Done-when demands it)
- Delete: `docs/adr/.gitkeep` and `docs/adr/notes/` (after you fold the notes into ADR 0005)

**Interfaces:** Consumes the boundary table (Global constraints), the export conditions
(Tasks 10 and 13), the spike notes (17.5) and the confirmed decisions.

- [ ] **Step 1: `architecture.md`.** Four sections:
  1. **Package graph:** a Mermaid diagram, `tokens → core, motion → react, native → ui`, plus
     `demo-content` and `parity` → `ui`.
  2. **Import rules:** the boundary table.
  3. **How `ui` picks a platform:** the `exports` block and which bundler uses which condition
     (Metro → `react-native`; Vite/Next client → `browser`; Next server → `default`).
  4. **Token to pixel:** web is `base.json` → `tokens.css` var → `theme.css` → Tailwind utility
     or `cssVar()` inline style. Native is `base.json` → `themes` object → `useUnisonTheme()` +
     `token()` → `StyleSheet` value, with Uniwind/NativeWind reading `theme.css` for `className`.
- [ ] **Step 2: ADRs.** `0000-template.md` has the headings Context, Decision, Alternatives
  considered, Consequences and Status. Write 0001–0010 with the todo's file names:
  - **0003** (Expo only) and **0004** (React 19 + New Architecture): Status Accepted, with
    "confirmed by Mark on 2026-11-19" in Context.
  - **0005**: includes the 17.5 numbers and the decision.
  - **0006**: Status per ⚠ OQ-8.
  - **0010**: MIT, Accepted.
- [ ] **Step 3: Link the decision rows.** In `docs/planning/todos/phase-0.md`'s decisions table,
  make each Decision cell a link to its ADR (e.g. `[Native support](../../adr/0003-expo-only-native.md)`).
  The table has ten rows. "Native Tailwind engine" → 0005, "Package builds" → 0007, "Tests" → 0009,
  and so on. 0008 (package-level platform split) isn't a row, so link it from `architecture.md`.
  ⚠ OQ-9 decides whether `roadmap.md` and `concept.md` are touched as well.
- [ ] **Step 4: Verify.**
  Run: `ls docs/adr | sort && grep -c "](../../adr/" docs/planning/todos/phase-0.md && for f in $(grep -o "../../adr/[^)]*" docs/planning/todos/phase-0.md); do test -f "docs/planning/todos/$f" || echo "broken $f"; done`
  Expect: `0000-template.md` … `0010-mit-license.md` (11 files), a link count of `10`, and no
  `broken` lines.
- [ ] **Step 5: Commits.** First `docs(adr): native tailwind engine` (ADR 0005 only, the follow-up
  promised in step 17), then `docs: architecture and ADRs` (everything else).

### Task 28: Component checklist and generator (todo step 28)

**Files:** Create `docs/component-checklist.md` and `tooling/scripts/new-component.ts`. Modify the
root `package.json`.

**Interfaces:**
- Consumes these patterns, which the generator copies:
  - `core/src/components/<name>/<name>.{types,styles}.ts`
  - `react/src/<name>.tsx`, `native/src/<name>.tsx`
  - the index exports
  - `parity/src/fixtures/<name>.ts` and its registration in `fixtures/index.ts` and `registry.tsx`
- Produces: `pnpm new:component <kebab-name>`.

- [ ] **Step 1: `component-checklist.md`.** The todo's eight bullets, verbatim.
- [ ] **Step 2: `new-component.ts`.**
  - **Arguments:** `process.argv[2]` must match `/^[a-z][a-z0-9-]*$/`, otherwise print
    `Usage: pnpm new:component <kebab-name>` and exit 1. `Pascal` = the PascalCase form.
  - **Refusal:** if any target file exists, exit 1 and list them.
  - **Files it creates** (all stubs):
    - `<pascal>Props { testID?: string; children?: ReactNode }`
    - `<camel>Styles = { size: "size.box", radius: "radius.md", border: "color.border", background: "color.surface" } as const`
    - a web renderer that copies `Box`'s render with the background fixed to `background`
    - a native renderer that does the same
    - `<camel>Fixture = { component: "<name>", cases: { default: {} } } as const`
  - **Edits it makes:** it appends export lines to `core/src/index.ts`, `react/src/index.ts` and
    `native/src/index.ts`, adds the fixture to `fixtures` in `parity/src/fixtures/index.ts`, and
    adds `<name>: <Pascal>` to `registry`.
  - **Output:** it prints the remaining TODOs: motion spec if it animates, a headless hook if it
    has state, real styles, unit tests on both platforms, a changeset.
  - Add the root script `"new:component": "tsx tooling/scripts/new-component.ts"`.
- [ ] **Step 3: Verify (the todo's check).**
  Run: `pnpm new:component probe && pnpm check && pnpm test:parity --platform web --update && grep -c "probe/default" packages/parity/parity-output/report.html`
  Expect: the generator lists the created files and the TODOs; `pnpm check` exits 0 (the
  contract test passes automatically); the report has ≥ 1 `probe/default` row. (Native columns
  need macOS, ⚠ OQ-17.)
  Then clean up: `git checkout -- . && git clean -fd packages/ && git status --porcelain` should
  show only the two new files from Steps 1–2 and `package.json`.
- [ ] **Step 4: Commit.** `chore: component checklist and generator`

---

# Section 15: Final acceptance

### Task 29: Clean-clone run (todo step 29; macOS + GitHub ⚠ OQ-17)

**Files:** none, as long as everything passes. Any edit means a failed item: fix it in the
step that owns it, then restart this task. The exceptions are the roadmap tick and the tag at the
end.

**Interfaces:** Consumes everything above.

- [ ] **Step 1:** `git clone <repo> ~/unison-acceptance && cd ~/unison-acceptance && pnpm install && pnpm doctor`.
  Expect: install has no errors, and doctor shows all ✓.
- [ ] **Step 2:** `pnpm check`. Expect: exit 0.
- [ ] **Step 3:** `pnpm check:packages`. Expect: no publint errors or warnings, and attw
  `No problems found` for every package.
- [ ] **Step 4:** `pnpm dev`. Expect: Next on :3000, Vite on :5173 and Metro on :8081. The iOS and
  Android dev builds (installed with `npx expo run:*`) connect (Metro logs `Bundled`).
- [ ] **Step 5:** On all four surfaces (Next, Vite, iOS, Android): `box-accent`, `box-neutral`,
  `motion-badge` and `tw-box` are visible, and `box-accent` ≡ `tw-box`.
- [ ] **Step 6:** With `pnpm dev` running, change `color.accent` in
  `packages/tokens/tokens/base.json` to `#e5484d`. Expect: all four surfaces turn red without a
  restart. Revert.
- [ ] **Step 7:** Dark mode works on all four surfaces, from the toggle and from the system
  setting; reloading the web pages in dark mode shows no light flash.
- [ ] **Step 8:** Reduce motion makes `MotionBadge` show `motion: reduced` on all four.
- [ ] **Step 9:** `pnpm --filter web-next build` lists `○ /`; the `next start` HTML contains
  `data-testid="box-accent"`; `grep -rl react-native apps/web-next/.next/static` is empty.
- [ ] **Step 10:** `pnpm test:parity` with both simulators running. Expect: it passes for
  web-chromium, web-webkit, iOS and Android, and `report.html` has four matching columns.
- [ ] **Step 11:** On GitHub: CI is green on a PR touching `packages/native`, and a PR labelled
  `snapshot` publishes installable `pr<n>` versions with provenance.
- [ ] **Step 12:** Outside the monorepo, check a new Next.js app and a new Expo app.
  - Next.js: `pnpm create next-app@latest /tmp/ext-next --ts --tailwind --app --src-dir --no-linter --use-pnpm`.
  - Expo: `pnpm create expo-app@latest /tmp/ext-expo`.
  - In each, run `pnpm add @unison-ui/ui@pr<n> @unison-ui/tokens@pr<n>`, add the CSS imports
    documented in CONTRIBUTING/README, and render `<Box testID="x" />`.
  - Expect: an accent 96×96 square on both. ⚠ OQ-10: watch whether `react-native` was pulled into
    the Next app.
- [ ] **Step 13:** Every decision has an ADR (Task 27 Step 4 still passes), and the teammate
  dry-run from Task 26 succeeded.
- [ ] **Step 14: Close out.** Tick the Phase 0 checklist and gate in `docs/planning/roadmap.md`
  (⚠ OQ-9), and commit it as `docs: mark phase 0 complete`. Then, **with Mark's go-ahead**, tag
  it: `git tag -a phase-0-complete -m "Phase 0 complete" && git push origin phase-0-complete`.
  Verify: `git ls-remote --tags origin phase-0-complete` prints one line.

---

## Self-review (done while writing)

- **Spec coverage:**
  - every todo step 1–29 maps to Task 1–29 (17 → 17.1–17.6, 18 → 18a–18f)
  - every Done-when appears as a Verify step
  - every commit message is kept verbatim
  - step 17's ADR follow-up commit is placed in Task 27
- **Placeholders:** where a value can't be known yet (owner for the URLs, the Node major, the TS
  version, device names), it's either an ⚠ OQ marker or a concrete procedure that produces the
  value (e.g. the AVD API from `targetSdkVersion`).
- **Names, defined once and reused:**
  - `cssVar`, `useUnisonTheme`, `token`, `TokenPath`
  - `simulateSpring`, `springToCssLinear`, `contrastRatio`, `assertContrast({ light, dark })`
  - `compile({ cwd })`
  - `Metrics`, `metricsPath`, `screenshotPath`, `baselinePath`
  - `runs()`, `registry`, `fixtures`, `SCHEMES`
  - `startCollector`, `compare`, `writeReport`, `runWeb`, `runNative`
- **Deviations from the todo's literal text, all needed to make its own checks pass:**
  - `fixedExtension: false` (Task 8)
  - `react-native` as a dev dependency of `motion` from step 10
  - a `collapsable={false}` wrapper for `measureLayout`
  - the native parity stage reads `themes` directly instead of `useUnisonTheme`, to keep the
    `@unison-ui/ui` export contract
  - `compare.ts` gets its `--*-only` flags in Task 19 instead of 22 (still verified in 22)
  - `tooling/scripts/package.json`

  Each is flagged inline.
