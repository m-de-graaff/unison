# 0001. Name and npm scope: Unison, @unison-ui

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Every package name, import path and CLI command depends on the name and scope, so it had to be
settled before phase 0.

## Decision

The project is called **Unison**. Packages are published under the **`@unison-ui`** npm scope
(`@unison-ui/tokens`, `core`, `motion`, `react`, `native`, `ui`, later `cli` and `icons`). The
repository lives at `m-de-graaff/unison` for now; a `unison-ui` GitHub organisation can take it
over later without renaming packages.

## Alternatives considered

A bare `unison` package name was unavailable and gives no room for several packages. Other scopes
were less clear about being a UI library.

## Consequences

- The npm organisation `unison-ui` must be claimed before the first publish (a human step).
- Package `repository` and `homepage` fields point at `m-de-graaff/unison` until the repo moves.
