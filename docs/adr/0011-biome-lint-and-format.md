# 0011. Lint and format: Biome

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

The phase 0 todo lists Biome as a decision ("Lint and format") but its ADR list had no entry for
it; this ADR fills that gap.

## Decision

- **Biome** lints and formats JavaScript, TypeScript, JSON, CSS and inline HTML scripts across the
  repo (`biome.json`: 2 spaces, 100 columns, double quotes, semicolons, the recommended rule
  preset).
- Markdown, `.claude/`, generated files (`src/uniwind-types.d.ts`) and app icon assets are excluded.
- `pnpm lint` runs Biome plus the import-boundary check; the pre-commit hook formats staged files.

## Alternatives considered

ESLint + Prettier: more plugins (and the Next.js and Expo templates default to ESLint/oxlint), but
two tools, more configuration and much slower runs.

## Consequences

Generated app scaffolds have their own linters removed; Biome is the single source of style.
