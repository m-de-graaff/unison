# 0002. pnpm workspaces and Turborepo

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

The repo holds nine packages and three apps (Next.js, Vite, Expo) that must build in dependency
order, run in watch mode together, and work with Metro, which handles symlinked `node_modules`
poorly.

## Decision

- **pnpm workspaces** with a dependency **catalog** in `pnpm-workspace.yaml`. Shared versions
  (TypeScript, React, React DOM, their types) live there once; packages reference them as
  `"catalog:"`. React follows Expo: the catalog uses exactly the version the current Expo SDK
  requires.
- **`nodeLinker: hoisted`**: a flat `node_modules`, the layout Metro and React Native tooling handle
  most reliably. pnpm 12 reads this from `pnpm-workspace.yaml`, not `.npmrc`.
- **Turborepo** for the task graph: `build`, `dev`, `typecheck` and `test` depend on `^build`, so a
  package's dependencies are built first; apps consume `dist/` like real users.
- pnpm 12's install-script gate stays on: each dependency that wants a build script is decided
  explicitly in `allowBuilds`.

## Alternatives considered

- **npm or Yarn workspaces:** no catalog (npm), weaker strictness, slower installs.
- **Nx:** more powerful but heavier, and it brings its own conventions on top of the package
  managers.
- **pnpm's default isolated linker:** stricter, but Metro needs extra configuration and still
  breaks on some React Native packages.

## Consequences

- `pnpm dev` starts many persistent tasks; `turbo.json` sets `concurrency` above their count.
- Turbo runs tasks in strict environment mode: variables a task needs (browser paths, Android SDK)
  must be listed in `passThroughEnv`.
- Hoisting can hide a missing dependency declaration; the import-boundary check and publint/attw
  partly compensate.
