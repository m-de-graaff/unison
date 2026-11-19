# 0006. Web motion engine: CSS and the Web Animations API

- **Status:** Proposed (to be decided in phase 4)
- **Date:** 2026-11-19

## Context

Components animate on web and native from one set of motion tokens. On native, Reanimated is the
clear choice. On web, the options are a library such as Motion or the platform itself.

## Decision (proposed)

Use **CSS transitions plus the Web Animations API** on web, with no Motion dependency. Springs
compile to CSS `linear()` easings with a matching duration (`@unison-ui/tokens/spring`, already
used in phase 0). Phase 4 builds `Presence`, interruptible animations and velocity handoff, then
settles this ADR. concept.md and the roadmap already lean this way ("no Motion dependency").

## Alternatives considered

- **Motion (Framer Motion):** a mature API and gesture support, but it adds bundle size to every page
  and must be kept out of Server Components.
- **CSS only:** no interruptible, velocity-aware animations.

## Consequences

- Phase 0's `springToCssLinear` is the foundation; phase 4 must prove interruption and velocity
  handoff without a library before this becomes Accepted.
