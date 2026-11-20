# CLAUDE.md

## What Unison is

Unison is one design system for React on the web (Next.js, Vite) and React Native (Expo), with
motion built in. Components look finished on install, can be customised all the way down, and are
proven identical across web, iOS and Android by a screenshot parity harness. It ships as
`@unison-ui/*` packages built from one token source.

The spec lives in `docs/planning/`:

- `concept.md`: vision and architecture
- `roadmap.md`: phases, their checklists and gates
- `component-catalogue.md`: the components to build
- `todos/phase-N.md`: the step-by-step todo for each phase

## Commands

Defined in the root `package.json`. Run them from the repo root.

| Command | What it does |
| --- | --- |
| `pnpm install` | Install everything; also installs the Lefthook git hooks (`prepare`) |
| `pnpm run doctor` | Check the toolchain (Node, pnpm, Xcode, simulator, emulator, Maestro, ports). Use `pnpm run doctor`: `pnpm doctor` runs pnpm's built-in command instead |
| `pnpm dev` | `turbo run dev`: every package watcher, Next.js (:3000), Vite (:5173), Metro (:8081) |
| `pnpm dev:web` | The two web apps and the packages they use |
| `pnpm dev:mobile` | Metro for the Expo app and the packages it uses |
| `pnpm lint` | `biome check .` plus the import-boundary check |
| `pnpm format` | `biome check --write .` |
| `pnpm typecheck` | `turbo run typecheck` |
| `pnpm test` | `turbo run test` (unit and contract tests) |
| `pnpm build` | `turbo run build` |
| `pnpm check` | lint, typecheck, test, build, in that order |
| `pnpm check:packages` | `publint` and `attw --profile esm-only` on every package in `packages/` |
| `pnpm test:parity` | Parity harness; `--platform web\|ios\|android\|all`, `--update` to rewrite baselines (only for intended visual changes) |
| `pnpm new:component` | Component generator (`tooling/scripts/new-component.ts`) |
| `pnpm release` | Build and `changeset publish` (CI only) |

Toolchain: Node 26 (`.nvmrc`), pnpm from `packageManager` via Corepack.

## Package map

```
packages/
  tokens/        @unison-ui/tokens  token source (DTCG JSON) + compiler
  core/          @unison-ui/core    platform-free hooks, props types, style specs
  motion/        @unison-ui/motion  springs, reduced motion (src/shared, src/web, src/native)
  react/         @unison-ui/react   web renderers
  native/        @unison-ui/native  React Native renderers
  ui/            @unison-ui/ui      public entry; picks react or native via export conditions
  cli/           @unison-ui/cli     empty shell until phase 2
  demo-content/  private            demo screens shared by all apps
  parity/        private            parity fixtures and harness
apps/            web-next, web-vite, mobile (Expo); private demo apps, also host parity routes
tooling/         tsconfig presets; scripts (doctor, boundary check, generators)
```

Flow: `tokens` → `core` and `motion` → `react` and `native` → `ui`. Libraries build to `dist/` with
tsdown (ESM only), and apps consume `dist/`, never `src/`. The platform split happens per
package, never per file (no `.web.tsx` / `.native.tsx` inside packages; ADR 0008).

## Import boundaries

Enforced by `tooling/scripts/check-boundaries.ts` as part of `pnpm lint`:

| Files | Must not import |
| --- | --- |
| `packages/tokens`, `packages/core`, `packages/motion/src/shared/**` | `react-dom`, `react-native`, `react-native-*`, `@unison-ui/react`, `@unison-ui/native`, `@unison-ui/ui` |
| `packages/motion/src/web/**`, `packages/react/**` | `react-native`, `react-native-*`, `@unison-ui/native`, `@unison-ui/ui` |
| `packages/motion/src/native/**`, `packages/native/**` | `react-dom`, `@unison-ui/react`, `@unison-ui/ui` |
| any package | a relative import that leaves its own package |

`tokens`, `core` and `motion/src/shared` are typechecked without the DOM lib, so `window` or
`document` there fails too.

## Working rules

- The phase todo (`docs/planning/todos/phase-N.md`) is the source of truth. Work through its steps
  in order; if the code and the todo disagree, stop and ask rather than pick one.
- One commit per step, using the commit message the todo gives for that step.
- A step is done only when its "Done when" check passes, shown with real command output. Never
  report "should pass".
- Stop and ask before anything that needs the owner's accounts, devices or money: npm or GitHub
  org settings and secrets, publishing, paid services, signing, physical or simulated devices on
  their machine.

## Git

- Never start branch names with `claude/`. Use a descriptive prefix that fits the change
  instead, e.g. `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`.
- Never add `Co-Authored-By` trailers or any other tool attribution to commits, PRs, tags or
  releases.
- Conventional Commits; one changeset per user-facing change (`pnpm changeset`).

## Where things go

- Implementation plans: `docs/plans/phase-N.md`
- Decisions: `docs/adr/NNNN-title.md`, from `docs/adr/0000-template.md` (Context, Decision,
  Alternatives considered, Consequences, Status)
- Architecture overview: `docs/architecture.md`
