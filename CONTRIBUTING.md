# Contributing to Unison

Unison is a pnpm + Turborepo monorepo: design-system packages under `packages/`, three demo apps
under `apps/` (Next.js, Vite, Expo) and shared tooling under `tooling/`. See
[docs/architecture.md](docs/architecture.md) for how the pieces fit together.

## 1. Prerequisites

Install these once:

- **Node.js 26** (the major in `.nvmrc`). With nvm: `nvm install && nvm use`.
- **Corepack**: Node 25 and later no longer bundle it, so install it first:

  ```bash
  npm i -g corepack
  ```

  ```bash
  corepack enable
  ```

- **Git**, and a GitHub account with access to the repo.
- **macOS only:** Xcode + iOS Simulator, and Watchman (`brew install watchman`).
- **Android Studio** with an emulator image (see [Parity devices](#3-parity-devices)), and
  `ANDROID_HOME` set to the Android SDK path, with `$ANDROID_HOME/platform-tools` and
  `$ANDROID_HOME/emulator` on your `PATH`.
- **Maestro CLI:**

  ```bash
  curl -fsSL "https://get.maestro.mobile.dev" | bash
  ```

- An **Expo account** (`npx expo login`) and an **npm account** (`npm login`), only needed for EAS
  builds and publishing.

Then, from the repo root:

```bash
pnpm install
```

```bash
pnpm run doctor
```

`pnpm run doctor` checks Node, pnpm, Xcode, the parity simulator and emulator, Maestro and the dev
ports, and prints the fix for anything that's missing. Use `pnpm run doctor`, not `pnpm doctor`:
the latter is pnpm's own built-in health check.

`pnpm install` also installs the git hooks (Lefthook). Commits on `main` are rejected, staged files
are formatted on commit, and `git push` runs lint plus a typecheck of the affected packages.

## 2. Running things

| Command | What it does |
| --- | --- |
| `pnpm dev` | Every package watcher, the Next.js app (http://localhost:3000), the Vite app (http://localhost:5173) and Metro (port 8081) |
| `pnpm dev:web` | Only the two web apps (and the packages they use) |
| `pnpm dev:mobile` | Only Metro for the Expo app (and the packages it uses) |
| `pnpm build` | Builds every package and app |
| `pnpm check` | Lint, typecheck, unit tests and build: what CI's `check` job runs |

Libraries rebuild their `dist/` on save, and the apps consume `dist/` like a real user would, so a
change in a package shows up in every app without a restart.

**First native build.** The Expo app runs as a development build, not in Expo Go (Expo Go can't
open the `unison-demo://` links the parity tests use). Build and install it once per simulator or
emulator, from `apps/mobile`:

```bash
npx expo run:ios
```

```bash
npx expo run:android
```

After that, `pnpm dev` (or `pnpm dev:mobile`) is enough: the installed app connects to Metro. The
`ios/` and `android/` folders are generated (Continuous Native Generation) and gitignored; never
edit them by hand.

## 3. Parity devices

Parity baselines are only stable on fixed devices. They're defined in
[`packages/parity/parity-devices.json`](packages/parity/parity-devices.json):

| Platform | Device | Create it with |
| --- | --- | --- |
| iOS | Simulator **"Unison Parity iPhone"**, an iPhone 16e (390 × 844 pt) | `xcrun simctl create "Unison Parity iPhone" com.apple.CoreSimulator.SimDeviceType.iPhone-16e` |
| Android | AVD **`unison-parity`**: Pixel 7 profile, API 36, Google APIs | see below |

Android (on Apple Silicon use `arm64-v8a` instead of `x86_64` in both commands):

```bash
sdkmanager "system-images;android-36;google_apis;x86_64"
```

```bash
avdmanager create avd -n unison-parity -d pixel_7 -k "system-images;android-36;google_apis;x86_64"
```

Parity runs use **release** builds, so no dev overlays end up in the screenshots. From
`apps/mobile`, with the device booted:

```bash
npx expo run:ios --configuration Release --device "Unison Parity iPhone"
```

```bash
npx expo run:android --variant release
```

## 4. Tests

| Command | What it does |
| --- | --- |
| `pnpm test` | Unit and contract tests: Vitest for `tokens`, `core`, `motion`, `react`, `ui`; Jest (`jest-expo`) for `native` |
| `pnpm test:parity` | Renders every parity fixture on web (Chromium + WebKit), iOS and Android, in light and dark; compares layout across platforms (±1 px) and screenshots against `packages/parity/baselines/` |
| `pnpm test:parity --platform web` | Only the web platforms (also `ios`, `android`) |
| `pnpm test:parity --update` | Overwrites the baselines with the current screenshots |

Native platforms whose simulator or emulator isn't running are skipped with a warning. The report
is written to `packages/parity/parity-output/report.html`.

The web runner needs Playwright's browsers (`pnpm --filter @unison-ui/parity exec playwright
install chromium webkit`). Two optional environment variables help on machines with a
preinstalled browser set: `PARITY_CHROMIUM_PATH` (a Chromium executable to use instead of
Playwright's) and `PARITY_WEB_PROJECTS` (e.g. `web-chromium` to skip WebKit).

**When native parity runs in CI:** a normal PR push runs only `check`, `parity-web` and
`parity-compare`, which takes about two minutes. The `parity-ios` and `parity-android` jobs run:

| Trigger | Native jobs |
| --- | --- |
| PR with the `native` label (adding the label starts them), when native code changed | both |
| PR head commit message containing `[update-baselines]`, when native code changed | both, regenerating baselines |
| Push to `main`, when native code changed | both |
| Nightly on `main` (03:17 UTC) | both, with full builds |
| Manual: Actions → CI → Run workflow (pick the branch, platforms, update baselines, full build) | as chosen |

Skipped native jobs count as passing. "Native code changed" means a change in `packages/tokens`, `core`,
`motion`, `native`, `ui`, `demo-content` or `parity`, in `apps/mobile`, the lockfile or `ci.yml`.

**How the native jobs stay fast:** each job computes the `@expo/fingerprint` of `apps/mobile`
for its platform. It covers native dependencies, config plugins, `app.json` and its assets, but not
the JS of the workspace packages. The release app (`.app` / `.apk`) is cached under that
fingerprint. On a cache hit, `@expo/repack-app --js-bundle-only` puts a fresh JS bundle into the
cached app. It uses `expo export:embed` with Hermes bytecode, as a release build does. Only a
native change rebuilds the app. Measured on this repo: with a cached app, about 5 minutes for
Android and 10–13 minutes for iOS (most of it setup); with a rebuild, about 14 minutes for Android
and 45 minutes for iOS. The jobs run in parallel. The nightly run
and the manual "full build" option always rebuild, so a repacked app can't drift from a real build
for long. Caches written on `main` are shared with every PR. A PR's own caches are shared only
with later runs of the same PR. The iOS build step has its own timeout, and if it fails or hangs,
its log is uploaded as `ios-build-log`.

**Native baselines without a Mac:** CI can generate them. Push a commit whose message contains
`[update-baselines]`, or run the workflow manually with "update baselines" ticked. The native jobs
then run with `--update`. Once every parity job passed, `commit-baselines` commits the new images
for all regenerated platforms to the branch, in one commit as `github-actions[bot]`. A push made
by the bot starts no CI of its own, so that job then starts CI on the new head (without native
jobs), and the PR shows checks for it. Review the images in the PR like any other baseline change.
On failure the jobs upload Maestro's debug output (`maestro-debug-*`), and the log shows what was
on screen.

**When you may update baselines:** only for an intended visual change. Say why in the PR, and
attach the parity report. A baseline update that nobody explains will be sent back.

## 5. Commits and pull requests

- Branch from `main` with a prefix that fits the change (`feat/…`, `fix/…`, `chore/…`, `docs/…`).
  Never commit to `main` directly; PRs are squash-merged.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat(tokens): …`, `fix(native): …`, `chore: …`).
- Every user-facing change to a published package needs a changeset:

  ```bash
  pnpm changeset
  ```

  All public `@unison-ui/*` packages share one version number.
- No `Co-Authored-By` trailers or other tool attribution in commits, PRs, tags or releases.
- Label a PR `snapshot` to publish `pr<n>` versions to npm for testing in another project.

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Metro serves stale code or can't resolve a package | `npx expo start -c` in `apps/mobile` (clears the Metro cache) |
| An app imports something from a package that "doesn't exist" | `pnpm build` (a package's `dist/` is stale or missing) |
| The simulator or emulator keeps running an old version of the app | Uninstall it, then run `npx expo run:ios` / `run:android` again: `xcrun simctl uninstall booted dev.unison.demo` or `adb uninstall dev.unison.demo` |
| `pnpm install` stops with "Ignored build scripts" | A new dependency wants to run an install script. Decide in `allowBuilds` in `pnpm-workspace.yaml` (`pnpm approve-builds <pkg>`) |
| Typecheck fails on `*.css` imports in `apps/mobile` | Make sure `src/expo-types.d.ts` exists (it references `expo/types`) |
