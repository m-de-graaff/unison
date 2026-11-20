# 0019. App config file and the `unison/` output folder

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Each app chooses its own themes, but the packages ship prebuilt CSS. Apps need generated files
that match their config, kept out of git, and updated live while developing.

## Decision

- `unison.config.ts` at each app's root (`defineConfig` / `defineTheme`), loaded with jiti (no
  module cache, so `--watch` reloads it).
- `unison-tokens build --config unison.config.ts --out unison` writes the same file set as the
  package's `dist/` into **`apps/<app>/unison/`** (gitignored). The todo said `.unison/`, but
  Next 16.4.6's Turbopack dev server didn't pick up edits to imported CSS inside a **gitignored
  dot-folder**. Measured: never, not even after a reload. A plain folder (ignored or not) reloads
  in about 120 ms, and so does a dot-folder that isn't ignored. Owner decision: rename.
- OQ-9: pnpm 12 runs no `pre*` scripts, so `build` / `typecheck` chain `pnpm tokens`
  explicitly, and `dev` runs the watcher next to the server with `concurrently`.
- The package's own build keeps writing the default theme to `dist/`, so apps without a config
  need nothing.

## Alternatives considered

- **`next dev --webpack`:** reloads (352 ms), but dev would differ from the Turbopack build.
- **The watcher touching `globals.css`:** works (121 ms), but it's a workaround for a bundler
  quirk.
- **Committing generated files:** noisy diffs, and easy to forget.

## Consequences

- Live reload, measured with `pnpm dev:web`: Vite shows a config change in about 0.3 s, Next in
  about 0.4 s. Metro is unverified.
- An invalid config (including a contrast failure) keeps the previous output and prints the
  error, so a broken edit never blanks the running app.
