# Upgrading the Expo SDK

Renovate does not update Expo or anything Expo pins (see `renovate.json`). React follows Expo:
the `react` version in the pnpm catalog is always the one the current Expo SDK requires.
Upgrade by hand:

1. In `apps/mobile`, move to the new SDK:

   ```bash
   npx expo install expo@latest
   ```

2. Let Expo align every package it pins:

   ```bash
   npx expo install --fix
   ```

3. Copy the resulting `react` version from `apps/mobile/package.json` into
   `pnpm-workspace.yaml` → `catalog.react` and `catalog.react-dom`, and set `@types/react` and
   `@types/react-dom` to the matching `~` range. Update `react-native` in the dev dependencies of
   `packages/motion`, `packages/native` and `packages/ui`, and `jest-expo`, `expo` and
   `@react-native/jest-preset` in `packages/native`, to the versions Expo chose.
4. From the repo root:

   ```bash
   pnpm install
   ```

5. Run the full check:

   ```bash
   pnpm check
   ```

6. Run the full parity suite with both simulators running (see `CONTRIBUTING.md`):

   ```bash
   pnpm test:parity
   ```

7. Run `npx expo-doctor` in `apps/mobile`. TypeScript is deliberately excluded from Expo's
   version check (`expo.install.exclude` in `apps/mobile/package.json`), because the repo uses
   the TypeScript version in the catalog.
8. Commit as `chore(mobile): upgrade to Expo SDK <n>`.
