# 0007. Package builds: tsdown, ESM only

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Packages must ship JavaScript plus type declarations that work in Next.js (including Server
Components), Vite and Metro. Each module also needs to keep its own `"use client"` directive.

## Decision

- Build every package with **tsdown**, **ESM only** (`format: "esm"`, `dts: true`).
- Renderer packages and `core` build **unbundled** (one output file per source file), so a
  `"use client"` directive stays on its own module: `MotionBadge` and `useControllableState` are
  client boundaries, while `Box` and `boxStyles` remain usable from Server Components.
- Workspace and React imports are never bundled (`deps.neverBundle`).
- Package health is checked with publint and `attw --profile esm-only` (`pnpm check:packages`).

## Alternatives considered

- **tsup:** in maintenance mode; tsdown is its successor on Rolldown.
- **Dual ESM + CJS:** every supported bundler and Node version handles ESM, and dual packages
  bring the dual-instance hazard.
- **Plain `tsc`:** no bundling of entries, slower, and more config per package.

## Consequences

- CommonJS consumers must use dynamic `import()`.
- tsdown defaults to `.mjs` on `platform: "node"`; `@unison-ui/tokens` sets
  `fixedExtension: false` to keep `.js`.
- tsdown warns that its TypeScript 7.0 declaration generator is deprecated; move to TypeScript 7.1
  once it's stable.
