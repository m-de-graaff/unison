# Component checklist

The definition of done for every Unison component. `pnpm new:component <name>` creates a stub
for each item marked *(generated)*; the rest is yours to finish.

- [ ] Props contract in `packages/core/src/components/<name>/<name>.types.ts` *(generated)*
- [ ] Style spec in `<name>.styles.ts`, token paths only, never raw values *(generated)*
- [ ] Motion spec in `<name>.motion.ts` (if it animates)
- [ ] Headless logic hook (if it has state)
- [ ] Web renderer in `packages/react/src/<name>.tsx` and native renderer in
      `packages/native/src/<name>.tsx`, both exported from their `index.ts` files *(generated)*
- [ ] Parity fixtures covering every variant, both schemes
      (`packages/parity/src/fixtures/<name>.ts`, registered in `fixtures/index.ts` and
      `registry.tsx`) *(a single default case is generated)*
- [ ] Unit tests on both platforms (Vitest in `packages/react/test`, Jest in
      `packages/native/test`); the contract test in `packages/ui/test` passes automatically
- [ ] A changeset (`pnpm changeset`)
