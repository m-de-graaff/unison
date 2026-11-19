# Phase 0 — development todo

Follow the steps in order. Each step lists what to do and a **Done when** check; don't start the next step until the check passes. At the end you have a monorepo where one `pnpm dev` runs a Next.js, a Vite and an Expo demo, every package builds for web and native, CI checks parity between platforms, and a placeholder `Box` component proves the whole pipeline end to end. No real components are built in phase 0.

## 0. Before you start

### How to use this todo

- Work on a branch per section (`phase0/repo`, `phase0/tokens`, …) and squash-merge into `main` when the section's checks pass.
- One commit per step, using the commit message given at the end of the step (Conventional Commits).
- Whenever you install a dependency, use `@latest` and let the lockfile pin it. Never hand-type version numbers in this todo's snippets; where a snippet shows `"catalog:"`, the real version lives once in `pnpm-workspace.yaml`.
- If a **Done when** check fails, fix it before moving on. Every later step assumes all earlier ones pass.

### Prerequisites (install once)

- [ ] Node.js, current LTS (`node -v`)
- [ ] Corepack enabled: `corepack enable`
- [ ] Git, and a GitHub account with rights to create an org
- [ ] macOS only: Xcode + iOS Simulator, Watchman (`brew install watchman`)
- [ ] Android Studio with an emulator image (API level that current Expo supports), `ANDROID_HOME` set
- [ ] Maestro CLI: `curl -fsSL "https://get.maestro.mobile.dev" | bash`
- [ ] An Expo account (`npx expo login`) and an npm account (`npm login`)

### Decisions this todo assumes

These are the defaults the steps below are written for. Each one becomes an ADR in step 27. Change one only if you have a concrete reason, and adjust the affected steps.

| Decision | Default | Affects steps |
| --- | --- | --- |
| Name and scope | Unison, npm scope `@unison-ui`, GitHub org `unison-ui` | All |
| Package manager and monorepo | pnpm workspaces + Turborepo | 3, 6 |
| Native support | Expo only for v1 (bare React Native is not tested) | 17, 21 |
| Minimum versions | React 19, React Native New Architecture only | 3, 17 |
| Native Tailwind engine | Uniwind (confirm with the spike in step 17.5; fall back to NativeWind if it fails) | 17 |
| Web motion engine | CSS + Web Animations API; decide on adding Motion in phase 4 | 10 |
| Package builds | tsdown, ESM only | 11–13 |
| Lint and format | Biome | 5 |
| Tests | Vitest for web and shared code, Jest (`jest-expo`) for native | 18 |
| License | MIT | 1 |

### Target layout

This is what the repo looks like after step 29:

```
unison/
├─ apps/
│  ├─ web-next/        Next.js demo (App Router)
│  ├─ web-vite/        Vite demo + parity routes for Playwright
│  └─ mobile/          Expo demo + parity routes for Maestro
├─ packages/
│  ├─ tokens/          @unison-ui/tokens  — token source + compiler
│  ├─ core/            @unison-ui/core    — platform-free hooks, props types
│  ├─ motion/          @unison-ui/motion  — springs, reduced motion
│  ├─ react/           @unison-ui/react   — web renderers
│  ├─ native/          @unison-ui/native  — React Native renderers
│  ├─ ui/              @unison-ui/ui      — public entry, picks web or native
│  ├─ cli/             @unison-ui/cli     — empty CLI shell
│  ├─ demo-content/    private — demo screens shared by all apps
│  └─ parity/          private — fixtures + harness scripts
├─ tooling/
│  ├─ tsconfig/        private — shared tsconfig presets
│  └─ scripts/         doctor, import-boundary check, generators
├─ docs/               architecture, ADRs, checklists
└─ .github/            workflows, templates
```

One architecture note: the platform split happens at package level. Platform-free code (props types, state hooks, style and motion specs) lives in `core` and `motion`; `react` and `native` hold only renderers; `ui` re-exports one or the other through the `react-native` export condition. This avoids per-file `.web.tsx` / `.native.tsx` resolution inside package builds, which is fragile across bundlers.

## 1. Repository, toolchain, workspace

### Step 1 — Claim names and create the repo

- [ ] Create the npm org `unison-ui` on npmjs.com (free, public packages). If it's taken, stop and pick a new scope before continuing; every later step uses it.
- [ ] Create the GitHub org `unison-ui` and an empty public repo `unison` (no README, no license, no .gitignore).
- [ ] Clone it locally and add these files:
  - `LICENSE`: MIT, with your name and the current year
  - `README.md`: one line (`# Unison`) plus "Work in progress"
  - `.gitignore`:

```
node_modules/
dist/
.turbo/
.next/
.expo/
expo-env.d.ts
apps/mobile/ios/
apps/mobile/android/
coverage/
playwright-report/
test-results/
parity-output/
*.tsbuildinfo
.DS_Store
.env*.local
```

- [ ] `.editorconfig`: `root = true`, `indent_style = space`, `indent_size = 2`, `end_of_line = lf`, `insert_final_newline = true`, `charset = utf-8`
- [ ] `.gitattributes`: `* text=auto eol=lf` and `pnpm-lock.yaml -diff`

**Done when:** `git status` shows the five files and nothing else. Commit: `chore: initial repo files`.

### Step 2 — Pin the toolchain

- [ ] `.nvmrc` containing the LTS major you installed (for example `22`)
- [ ] Root `package.json`:

```json
{
  "name": "unison",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@<run `pnpm -v` and paste the exact version>",
  "engines": { "node": ">=22" },
  "scripts": {}
}
```

- [ ] Run `corepack use pnpm@latest` so the `packageManager` field holds an exact, hash-pinned version.

**Done when:** `pnpm -v` inside the repo prints the pinned version, and running it with a different Node major warns. Commit: `chore: pin node and pnpm`.

### Step 3 — pnpm workspace and dependency catalog

- [ ] `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
  - tooling/*

catalog:
  typescript: <latest>
  react: <version Expo's current SDK requires>
  react-dom: <same as react>
  "@types/react": <matching>
```

- [ ] Fill the catalog versions: run `npx create-expo-app@latest --template blank-typescript /tmp/expo-probe`, read the `react` version it installed, and use exactly that for `react` and `react-dom`. Expo is the strictest consumer, so React follows Expo. Delete `/tmp/expo-probe` afterwards.
- [ ] Every package and app references these as `"react": "catalog:"`, never a version number.
- [ ] `.npmrc`:

```
node-linker=hoisted
auto-install-peers=true
strict-peer-dependencies=false
link-workspace-packages=true
```

`node-linker=hoisted` gives a flat `node_modules`, which is what Metro and React Native tooling handle most reliably in a monorepo.

- [ ] Install root dev dependencies: `pnpm add -Dw typescript@catalog: turbo @biomejs/biome @changesets/cli lefthook`

**Done when:** `pnpm install` finishes with no errors and a single `node_modules` at the root. Commit: `chore: pnpm workspace and catalog`.

## 2. TypeScript, linting and import boundaries

### Step 4 — Shared TypeScript presets

- [ ] Create `tooling/tsconfig/package.json`: `{ "name": "@unison-ui/tsconfig", "private": true, "version": "0.0.0", "files": ["*.json"] }`
- [ ] `tooling/tsconfig/base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true
  }
}
```

- [ ] `tooling/tsconfig/web.json`: extends `./base.json`, sets `"lib": ["ES2023", "DOM", "DOM.Iterable"]`
- [ ] `tooling/tsconfig/shared.json`: extends `./base.json`, no DOM lib. Used by `tokens`, `core` and `motion` so a stray `window` or `document` fails typechecking.
- [ ] `tooling/tsconfig/native.json`: extends `./base.json`, no DOM lib. (React Native ships its own types.)
- [ ] Rule for every package from now on: a `typecheck` script of `tsc --noEmit`, and a `tsconfig.json` that extends one of these presets plus `"include": ["src"]`.
- [ ] If a third-party type conflicts with `exactOptionalPropertyTypes`, turn that option off in that one package only and note why in a comment.

**Done when:** the files exist and `pnpm install` links `@unison-ui/tsconfig`. Commit: `chore: shared tsconfig presets`.

### Step 5 — Biome and the import-boundary check

- [ ] Root `biome.json`:

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always" } },
  "linter": { "enabled": true, "rules": { "recommended": true } }
}
```

- [ ] Install `tsx` for running TypeScript scripts: `pnpm add -Dw tsx`
- [ ] Create `tooling/scripts/check-boundaries.ts`. It walks every `packages/*/src/**/*.{ts,tsx}` file, extracts import specifiers (`import … from "x"`, `export … from "x"`, `import("x")`), and fails with file + line for any of these:

| Files | Forbidden imports |
| --- | --- |
| `packages/tokens`, `packages/core`, `packages/motion/src/shared/**` | `react-dom`, `react-native`, anything starting `react-native-` |
| `packages/motion/src/web/**`, `packages/react/**` | `react-native`, anything starting `react-native-` |
| `packages/motion/src/native/**`, `packages/native/**` | `react-dom` |
| any package | a relative import that leaves its own package (`../../other-package`) |

- [ ] Root scripts:

```json
"lint": "biome check . && tsx tooling/scripts/check-boundaries.ts",
"format": "biome check --write ."
```

- [ ] VS Code: `.vscode/extensions.json` recommending `biomejs.biome`, `bradlc.vscode-tailwindcss`, `expo.vscode-expo-tools`; `.vscode/settings.json` with `"editor.defaultFormatter": "biomejs.biome"` and `"editor.formatOnSave": true`.

**Done when:** `pnpm lint` passes on the empty repo, and adding a test file `packages/core/src/x.ts` containing `import "react-native"` makes it fail with that file's path (delete the test file afterwards). Commit: `chore: biome and import boundaries`.

## 3. Task pipeline

### Step 6 — Turborepo and root scripts

- [ ] Root `turbo.json`:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": { "dependsOn": ["^build"], "cache": false, "persistent": true },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "test:parity": { "dependsOn": ["build"], "cache": false }
  }
}
```

- [ ] Root `package.json` scripts (keep `lint` and `format` from step 5):

```json
"build": "turbo run build",
"dev": "turbo run dev",
"dev:web": "turbo run dev --filter=web-next --filter=web-vite",
"dev:mobile": "turbo run dev --filter=mobile",
"typecheck": "turbo run typecheck",
"test": "turbo run test",
"test:parity": "turbo run test:parity --filter=@unison-ui/parity",
"check": "pnpm lint && pnpm typecheck && pnpm test && pnpm build"
```

- [ ] How dev works, so you know what to expect: each library package's `dev` script runs `tsdown --watch` and rebuilds `dist/` on save; each app consumes the packages' `dist/` like a real user would. `^build` makes sure `dist/` exists before any watcher or app starts. Turbo filters (`--filter=web-next`) also run that app's workspace dependencies.
- [ ] Remote cache: skip for now. Add Vercel Remote Cache in step 22 if CI gets slow.

**Done when:** `pnpm build` runs and reports no tasks (nothing to build yet) without errors. Commit: `chore: turborepo pipeline`.

## 4. Tokens

### Step 7 — Tokens package and token source

- [ ] Create `packages/tokens` with `package.json`:

```json
{
  "name": "@unison-ui/tokens",
  "version": "0.0.0",
  "type": "module",
  "files": ["dist", "tokens"],
  "bin": { "unison-tokens": "./dist/bin.js" },
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./spring": { "types": "./dist/spring.d.ts", "default": "./dist/spring.js" },
    "./native": { "types": "./dist/native/theme.d.ts", "default": "./dist/native/theme.js" },
    "./tokens.css": "./dist/web/tokens.css",
    "./theme.css": "./dist/web/theme.css"
  },
  "sideEffects": ["*.css"],
  "scripts": {
    "build": "tsdown && node dist/bin.js build",
    "dev": "tsx watch --include \"tokens/**\" src/bin.ts build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

- [ ] Dev dependencies: `pnpm --filter @unison-ui/tokens add -D tsdown vitest @unison-ui/tsconfig@workspace:* typescript@catalog:`
- [ ] `tsconfig.json` extends `@unison-ui/tsconfig/shared.json`; add `"types": ["node"]` and `pnpm add -D @types/node` (the compiler reads files).
- [ ] `tsdown.config.ts`: entries `src/index.ts`, `src/spring.ts`, `src/bin.ts`; `format: "esm"`, `dts: true`, `platform: "node"`. Make sure `dist/bin.js` starts with `#!/usr/bin/env node` (tsdown keeps a shebang written at the top of `src/bin.ts`).
- [ ] `tokens/base.json`, the light theme and all non-colour tokens. DTCG format; `spring` is our own `$type`, which the compiler understands:

```json
{
  "color": {
    "accent":  { "$type": "color", "$value": "#5b5bd6" },
    "surface": { "$type": "color", "$value": "#ffffff" },
    "fg":      { "$type": "color", "$value": "#111113" },
    "border":  { "$type": "color", "$value": "#e4e4e7" }
  },
  "space": {
    "1": { "$type": "dimension", "$value": "4px" },
    "2": { "$type": "dimension", "$value": "8px" },
    "4": { "$type": "dimension", "$value": "16px" }
  },
  "radius": { "md": { "$type": "dimension", "$value": "8px" } },
  "size":   { "box": { "$type": "dimension", "$value": "96px" } },
  "motion": {
    "duration": { "base": { "$type": "duration", "$value": "200ms" } },
    "spring": {
      "snappy": { "$type": "spring", "$value": { "stiffness": 400, "damping": 30, "mass": 1 } }
    }
  }
}
```

- [ ] `tokens/dark.json`, overrides only (same paths, colour values only):

```json
{
  "color": {
    "surface": { "$type": "color", "$value": "#111113" },
    "fg":      { "$type": "color", "$value": "#ededef" },
    "border":  { "$type": "color", "$value": "#2e2e32" }
  }
}
```

**Done when:** both files parse (`node -e "JSON.parse(require('fs').readFileSync('packages/tokens/tokens/base.json','utf8'))"`). Commit: `feat(tokens): token source`.

### Step 8 — Token compiler

Write these modules in `packages/tokens/src/`:

- [ ] `read.ts`: loads `tokens/base.json` and `tokens/dark.json`, flattens them to `{ path: "color.accent", type, value }` records, and merges dark over light into two resolved sets. Throws with the token path on an unknown `$type` or a malformed value.
- [ ] `spring.ts`: `simulateSpring({ stiffness, damping, mass })` integrates x'' = (−stiffness·(x − 1) − damping·v) / mass from x = 0, v = 0, step 1/240 s, until |x − 1| < 0.001 and |v| < 0.001 (cap at 2 s). It returns `{ durationMs, samples }` with 32 samples evenly spaced in time. `springToCssLinear(spring)` returns `{ easing: "linear(0, …, 1)", durationMs }`, values rounded to 4 decimals.
- [ ] `contrast.ts`: WCAG 2 relative-luminance contrast ratio. The build fails if `fg` on `surface` is below 4.5:1 in either theme.
- [ ] `emit-web.ts`, which writes two files:
  - `dist/web/tokens.css`: `:root { … }` with every light token as `--unison-<path-with-dashes>` (springs become `--unison-motion-spring-snappy-easing` and `-duration`), `[data-theme="dark"] { … }` with dark overrides, and `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` with the same overrides.
  - `dist/web/theme.css`: a Tailwind v4 `@theme inline { … }` block mapping `--color-accent`, `--color-surface`, `--color-fg`, `--color-border` and `--radius-md` to the matching `var(--unison-…)`, and `--spacing` to `var(--unison-space-1)`.
- [ ] `emit-native.ts`: writes `dist/native/theme.js` exporting `export const themes = { light: {…}, dark: {…} }`, with dimensions as numbers (px removed), durations as numbers in ms, colours as strings and springs as `{ stiffness, damping, mass }`. Also writes `dist/native/theme.d.ts` with a `UnisonTheme` type, generated from the same data so it can't drift.
- [ ] `index.ts`: exports `compile({ cwd })`, which runs read → contrast → emit, and the `UnisonTheme` type.
- [ ] `bin.ts`: `#!/usr/bin/env node` + `unison-tokens build` calls `compile({ cwd: process.cwd() })` and prints each written file; unknown commands exit with code 1 and a usage line.

**Done when:**

- `pnpm --filter @unison-ui/tokens build` writes `dist/web/tokens.css`, `dist/web/theme.css`, `dist/native/theme.js` and `dist/native/theme.d.ts`.
- `tokens.css` contains `--unison-color-accent: #5b5bd6` and a `linear(` easing for `snappy` with a duration between 150 and 600 ms.
- Changing `fg` in `base.json` to `#cccccc` makes the build fail with a contrast error naming both colours. Revert it afterwards.

Commit: `feat(tokens): compiler for css, tailwind and native outputs`.

## 5. Platform-free packages

From here on, every library package follows the same template unless a step says otherwise:

- `"type": "module"`, `"version": "0.0.0"`, `"files": ["dist"]`, `"sideEffects": false`
- Scripts: `"build": "tsdown"`, `"dev": "tsdown --watch"`, `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`
- React as a peer dependency (`"react": ">=19"`) and as a dev dependency (`"react": "catalog:"`), never as a regular dependency
- Workspace dependencies written as `"@unison-ui/core": "workspace:^"`

### Step 9 — `@unison-ui/core`

- [ ] Create `packages/core` from the template; `tsconfig.json` extends `shared.json`.
- [ ] `tsdown.config.ts`: entry `src/index.ts`, `format: "esm"`, `dts: true`, `platform: "neutral"`, `external: ["react"]`.
- [ ] `src/use-controllable-state.ts`:

```ts
export function useControllableState<T>(opts: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T | ((prev: T) => T)) => void]
```

It's controlled when `value !== undefined`, otherwise it keeps internal state. `onChange` fires only when the value actually changes (`Object.is`).

- [ ] `src/components/box/box.types.ts`, the props contract both renderers must satisfy:

```ts
import type { ReactNode } from "react";
export interface BoxProps {
  tone?: "accent" | "neutral";
  testID?: string;   // web renders it as data-testid
  children?: ReactNode;
}
```

- [ ] `src/components/box/box.styles.ts`, a platform-free style spec that references token paths, not values:

```ts
export const boxStyles = {
  size: "size.box",
  radius: "radius.md",
  border: "color.border",
  background: { accent: "color.accent", neutral: "color.surface" },
} as const;
```

- [ ] `src/index.ts` re-exports all three.

**Done when:** `pnpm --filter @unison-ui/core build typecheck` passes and `dist/index.d.ts` exports `BoxProps`. Commit: `feat(core): controllable state hook and box contract`.

### Step 10 — `@unison-ui/motion`

- [ ] Create `packages/motion` from the template, with source in three folders: `src/shared/`, `src/web/`, `src/native/`.
- [ ] Dependencies: `"@unison-ui/tokens": "workspace:^"`. Peer dependencies: `react >=19` and `react-native` (marked optional in `peerDependenciesMeta`).
- [ ] `src/shared/index.ts`: re-exports `simulateSpring` and `springToCssLinear` from `@unison-ui/tokens/spring`.
- [ ] `src/web/index.ts`: `export * from "../shared"` plus `useReducedMotion(): boolean`, built on `useSyncExternalStore` over `matchMedia("(prefers-reduced-motion: reduce)")`. The server snapshot returns `false`.
- [ ] `src/native/index.ts`: `export * from "../shared"` plus `useReducedMotion(): boolean`, built on `AccessibilityInfo.isReduceMotionEnabled()` and the `reduceMotionChanged` event, cleaned up on unmount.
- [ ] Both `useReducedMotion` exports must have the identical signature.
- [ ] `tsdown.config.ts` exports two configs:
  - web: entry `{ index: "src/web/index.ts" }`, `outDir: "dist/web"`, `platform: "browser"`
  - native: entry `{ index: "src/native/index.ts" }`, `outDir: "dist/native"`, `platform: "neutral"`, `external: ["react", "react-native"]`
- [ ] `package.json` exports, in exactly this order (bundlers pick the first condition that matches):

```json
"exports": {
  ".": {
    "types": "./dist/web/index.d.ts",
    "react-native": "./dist/native/index.js",
    "default": "./dist/web/index.js"
  }
}
```

The web `.d.ts` serves both platforms. That's safe only because the public signatures are identical, which step 18 tests.

**Done when:** the build produces `dist/web/index.js` and `dist/native/index.js`; `grep -r "react-native" packages/motion/dist/web` finds nothing; `pnpm lint` passes (the boundary rules from step 5 now have real files to check). Commit: `feat(motion): springs and reduced motion for web and native`.

## 6. Renderers and the public entry

Each renderer package ships two placeholder components:

- **`Box`**: no hooks, so it's safe in a Next.js Server Component
- **`MotionBadge`**: uses `useReducedMotion()`, so it's a client component and proves the `"use client"` directive survives the build

### Step 11 — `@unison-ui/react` (web)

- [ ] Create `packages/react` from the template; `tsconfig.json` extends `web.json`.
- [ ] Dependencies: `@unison-ui/core`, `@unison-ui/motion`, `@unison-ui/tokens` (all `workspace:^`). Peer dependencies: `react >=19`, `react-dom >=19`.
- [ ] `src/css-var.ts`: `cssVar("color.accent")` returns `"var(--unison-color-accent)"`.
- [ ] `src/box.tsx`: no directive and no hooks. Renders a `<div>` with `data-testid={testID}` and inline styles built only from `boxStyles` through `cssVar`: width and height `size.box`, `borderRadius` `radius.md`, `border: 1px solid` + `color.border`, `background` from `boxStyles.background[tone]`. The default `tone` is `"accent"`.
- [ ] `src/motion-badge.tsx`: first line `"use client";`. Renders `<span data-testid="motion-badge">motion: full</span>`, or `reduced` when the hook says so.
- [ ] `src/index.ts` exports `Box` and `MotionBadge`, plus `export type { BoxProps } from "@unison-ui/core"`.
- [ ] `tsdown.config.ts`: entry `src/index.ts`, `format: "esm"`, `dts: true`, `platform: "browser"`, `unbundle: true` (one output file per source file, so a directive stays on its own module), `external: [/^react/, /^@unison-ui\//]`.

**Done when:** `head -1 packages/react/dist/motion-badge.js` prints `"use client";`, and `dist/box.js` has no directive. If tsdown strips the directive, add a tsdown `banner` for that one file or a tiny post-build script; don't move on until it's there. Commit: `feat(react): placeholder web renderers`.

### Step 12 — `@unison-ui/native` (React Native)

- [ ] Create `packages/native` from the template; `tsconfig.json` extends `native.json`.
- [ ] Dependencies: `@unison-ui/core`, `@unison-ui/motion`, `@unison-ui/tokens`. Peer dependencies: `react >=19`, `react-native` (no version range narrower than the current Expo SDK's). Dev dependency: `react-native` at the version from step 3's probe.
- [ ] `src/theme.ts`: `useUnisonTheme()` returns `themes[scheme]` from `@unison-ui/tokens/native`, where `scheme` comes from `useColorScheme()` (`"light"` when it's null). Add `token(theme, "color.accent")`, a typed lookup by dot path.
- [ ] `src/box.tsx`: a `<View testID={testID}>` whose style comes from the same `boxStyles` spec through `token()`: width and height, `borderRadius`, `borderWidth: 1` + `borderColor`, `backgroundColor` by tone.
- [ ] `src/motion-badge.tsx`: `<Text testID="motion-badge">` with the same text as web. No directive (React Native ignores it).
- [ ] `src/index.ts`: same export names as `@unison-ui/react`, nothing more and nothing less.
- [ ] `tsdown.config.ts`: as in step 11, but `platform: "neutral"` and `external: [/^react/, /^@unison-ui\//]` (the regex also covers `react-native`).

**Done when:** the build passes and `grep -r "react-dom" packages/native/dist` finds nothing. Commit: `feat(native): placeholder native renderers`.

### Step 13 — `@unison-ui/ui` (the public entry) and package health

- [ ] Create `packages/ui` from the template; dependencies `@unison-ui/react` and `@unison-ui/native`.
- [ ] `src/web.ts`: `export * from "@unison-ui/react";`
- [ ] `src/native.ts`: `export * from "@unison-ui/native";`
- [ ] `tsdown.config.ts`: entries `{ web: "src/web.ts", native: "src/native.ts" }`, `dts: true`, everything external.
- [ ] `package.json` exports, in this order:

```json
"exports": {
  ".": {
    "types": "./dist/web.d.ts",
    "react-native": "./dist/native.js",
    "browser": "./dist/web.js",
    "default": "./dist/web.js"
  }
},
"react-native": "./dist/native.js"
```

The top-level `"react-native"` field is a fallback for tools that ignore `exports`.

- [ ] Package health: `pnpm add -Dw publint @arethetypeswrong/cli`, and root script `"check:packages": "pnpm -r --filter \"./packages/*\" exec sh -c 'publint && attw --pack . --profile esm-only'"`.

**Done when:** `pnpm build && pnpm check:packages` passes for every package, with no publint errors and no attw problems under the ESM-only profile. Commit: `feat(ui): public entry with platform export conditions`.

## 7. Shared demo content and the Next.js app

### Step 14 — `demo-content` package

The same demo renders in all three apps, so a difference between them always points at the library, never at the demos.

- [ ] Create `packages/demo-content` (`"name": "demo-content"`, `"private": true`) from the template, with dependency `@unison-ui/ui` (`workspace:^`).
- [ ] `src/demo.tsx` exports `DemoItems`, a fragment using **only** `@unison-ui/ui` exports, so it stays platform-neutral:

```tsx
import { Box, MotionBadge } from "@unison-ui/ui";
export function DemoItems() {
  return (
    <>
      <Box testID="box-accent" />
      <Box tone="neutral" testID="box-neutral" />
      <MotionBadge />
    </>
  );
}
```

- [ ] Build it with tsdown like the others, with `@unison-ui/ui` and React external. The app's bundler resolves `@unison-ui/ui` to web or native, not this package.

**Done when:** it builds and `dist/demo.js` imports from `"@unison-ui/ui"` (not from `react` or `native` directly). Commit: `feat(demo): shared demo content`.

### Step 15 — `apps/web-next`

- [ ] Run `pnpm create next-app@latest apps/web-next` and answer: TypeScript **yes**, linter **none** (Biome runs from the root), Tailwind **yes**, `src/` directory **yes**, App Router **yes**, Turbopack **yes**, default import alias. Delete any nested `.git` folder or lockfile it creates.
- [ ] In its `package.json`: `"name": "web-next"`, `"private": true`; change `react`, `react-dom`, `@types/react` and `typescript` to `"catalog:"`; add `@unison-ui/ui`, `@unison-ui/tokens` and `demo-content` as `workspace:*`. Run `pnpm install` from the root.
- [ ] Add `"typecheck": "tsc --noEmit"` to scripts. Keep the generated `dev` and `build` scripts.
- [ ] `src/app/globals.css`, replacing the generated content:

```css
@import "tailwindcss";
@import "@unison-ui/tokens/tokens.css";
@import "@unison-ui/tokens/theme.css";
```

- [ ] `src/app/layout.tsx`: `<html lang="en" suppressHydrationWarning>` with an inline `<script>` in `<head>` that runs before paint. It reads `localStorage.getItem("unison-theme")` and, if it's `"light"` or `"dark"`, sets `document.documentElement.dataset.theme`. Wrap it in try/catch. This is what prevents a flash of the wrong theme.
- [ ] `src/app/theme-toggle.tsx` (`"use client"`, app code, not library code): a button cycling system → light → dark. It writes `localStorage` and `data-theme`; on system it removes both.
- [ ] `src/app/page.tsx`, a Server Component (no directive):

```tsx
import { DemoItems } from "demo-content";
import { ThemeToggle } from "./theme-toggle";
export default function Page() {
  return (
    <main className="min-h-dvh bg-surface text-fg p-4 flex flex-wrap items-center gap-4">
      <DemoItems />
      <div data-testid="tw-box" className="size-24 rounded-md border border-border bg-accent" />
      <ThemeToggle />
    </main>
  );
}
```

The `tw-box` is built from Tailwind utilities only. It must look identical to `box-accent`, which proves the token → Tailwind mapping.

**Done when:**

- `pnpm --filter web-next dev`: http://localhost:3000 shows two identical accent squares, one neutral square and `motion: full`.
- Turning on "Reduce motion" in your OS shows `motion: reduced` without a reload.
- Choosing dark and reloading shows no light flash.
- `pnpm --filter web-next build` succeeds and lists `/` as static.
- The page's raw HTML (View Source) contains `data-testid="box-accent"`, so `Box` rendered on the server.
- `grep -rl "react-native" apps/web-next/.next/static` finds nothing.

Commit: `feat(web-next): demo app`.

## 8. The Vite app

### Step 16 — `apps/web-vite`

This app also hosts the web parity routes in step 20, which is why it has no router dependency: plain `location.pathname` checks keep parity pages free of anything that could shift layout.

- [ ] `pnpm create vite@latest apps/web-vite --template react-ts`, then delete any nested lockfile.
- [ ] `package.json`: `"name": "web-vite"`, `"private": true`; React, `@types/react` and TypeScript set to `"catalog:"`; add `@unison-ui/ui`, `@unison-ui/tokens` and `demo-content` as `workspace:*`; add `"typecheck": "tsc -b --noEmit"`. Remove the generated ESLint config and dependencies (Biome covers it).
- [ ] Tailwind: `pnpm --filter web-vite add -D tailwindcss @tailwindcss/vite`; in `vite.config.ts` add `tailwindcss()` to `plugins` next to `react()`. Set `server.port: 5173` and `strictPort: true` (Playwright depends on the port).
- [ ] `src/index.css`: the same three `@import` lines as the Next.js app.
- [ ] `index.html`: the same before-paint theme script as the Next.js layout, inside `<head>`.
- [ ] `src/main.tsx`: if `location.pathname.startsWith("/parity/")`, render `<ParityPage />` (a placeholder that renders `null` until step 20); otherwise render `<DemoPage />`.
- [ ] `src/demo-page.tsx`: the same markup as the Next.js `page.tsx`, including `tw-box` and a copy of the theme toggle.

**Done when:**

- `pnpm --filter web-vite dev` shows the same page as the Next.js app at http://localhost:5173. Open both side by side; they must be visually identical in light and dark.
- `pnpm --filter web-vite build` succeeds and `grep -rl "react-native" apps/web-vite/dist` finds nothing.

Commit: `feat(web-vite): demo app`.

## 9. The Expo app

### Step 17 — `apps/mobile`

Do the sub-steps in order; 17.5 is a time-boxed spike that settles the native Tailwind decision.

**17.1 Create**

- [ ] `pnpm create expo-app@latest apps/mobile` (default template, which includes Expo Router). Then run `pnpm --filter mobile reset-project`, delete the `app-example` folder it creates, and delete any nested lockfile.

**17.2 Configure**

- [ ] `package.json`: `"name": "mobile"`, `"private": true`, `"dev": "expo start"`, `"typecheck": "tsc --noEmit"`. Keep the React and React Native versions Expo chose; they're the source of truth for the catalog (step 3). Add `@unison-ui/ui`, `@unison-ui/tokens` and `demo-content` as `workspace:*`.
- [ ] `app.json`:
  - `"name": "Unison Demo"`, `"slug": "unison-demo"`, `"scheme": "unison-demo"` (step 21's deep links depend on it)
  - `"userInterfaceStyle": "automatic"` (without it, `useColorScheme()` never reports dark)
  - `"ios": { "bundleIdentifier": "dev.unison.demo" }`, `"android": { "package": "dev.unison.demo" }`
  - New Architecture: on (the default in current SDKs; make sure nothing turns it off)
- [ ] `metro.config.js`: only `const { getDefaultConfig } = require("expo/metro-config"); module.exports = getDefaultConfig(__dirname);` Current Expo detects the monorepo and enables package `exports` on its own. Add nothing else unless `npx expo-doctor` says so.
- [ ] Run `npx expo-doctor` in `apps/mobile` and fix everything it reports.

**17.3 Animation dependencies**

- [ ] `npx expo install react-native-reanimated react-native-gesture-handler` (plus `react-native-worklets` if the installed Reanimated version asks for it). Follow the Expo install notes for the Babel plugin. Current `babel-preset-expo` configures it automatically, so add a plugin manually only if those notes say to.

**17.4 Development build**

- [ ] The `ios/` and `android/` folders are generated (Continuous Native Generation) and gitignored, so never edit them by hand.
- [ ] `npx expo run:ios` and `npx expo run:android` build and launch development builds. Expo Go is not used: it can't open the custom `unison-demo://` scheme or load arbitrary native modules.
- [ ] `npx eas-cli@latest build:configure`, then make sure `eas.json` has `development` (developmentClient) and `preview` (internal distribution) profiles.

**17.5 Spike: native Tailwind engine (max half a day)**

- [ ] Install Uniwind by following its Expo guide (a Metro config wrapper plus a `global.css` imported in `app/_layout.tsx`).
- [ ] `global.css`: `@import "tailwindcss";`, the Uniwind import its guide gives, and `@import "@unison-ui/tokens/theme.css";`
- [ ] Test 1: `<View className="size-24 rounded-md bg-accent" />` renders the accent colour.
  - If it renders but colourless: the `var(--unison-…)` chain doesn't resolve on native. Add to the tokens compiler (step 8) a third output, `dist/native/theme.css`, with literal light values plus Uniwind's light/dark theme syntax, export it as `@unison-ui/tokens/native-theme.css`, and import that instead.
- [ ] Test 2: a `FlatList` of 200 rows styled with `className` scrolls without visible jank on the Android emulator, compared with the same list using `StyleSheet`. Use the perf monitor in the dev menu.
- [ ] Test 3: switching the system to dark updates `bg-surface` without a reload.
- [ ] All three pass → keep Uniwind. Any failure you can't fix inside the time box → remove it, repeat the three tests with NativeWind, and keep whichever passes. Write the result in the ADR (step 27).

**17.6 Screens**

- [ ] `app/_layout.tsx`: imports `global.css`, wraps the app in `GestureHandlerRootView`, and renders a `Stack` with headers hidden.
- [ ] `app/index.tsx`: a `SafeAreaView` with `className="flex-1 bg-surface p-4 flex-row flex-wrap items-center gap-4"`, then `<DemoItems />`, a `<View testID="tw-box" className="size-24 rounded-md border border-border bg-accent" />` and a theme toggle button cycling `Appearance.setColorScheme("light" | "dark" | null)` (null means system).
- [ ] `app/parity/[component]/[case].tsx`: a placeholder returning `null` until step 21.

**Done when:**

- iOS Simulator and Android emulator show the same four items as the web apps, with `box-accent` and `tw-box` identical.
- The theme toggle and the system dark mode both work.
- Turning on Reduce Motion (iOS: Settings → Accessibility → Motion; Android: Remove animations) shows `motion: reduced`.
- `npx expo-doctor` reports no issues.

Commit: `feat(mobile): expo demo app` (plus `docs(adr): native tailwind engine` once step 27 exists).

## 10. Unit and contract tests

### Step 18 — Tests per package

The setup is the same everywhere: Vitest for `tokens`, `core`, `motion`, `react` and `ui`; Jest for `native` (React Native's test tooling is Jest-based). Each package's `test` script runs only its own tests; `pnpm test` runs them all through Turbo.

- [ ] `packages/tokens/test/` (Vitest, node environment)
  - `spring.test.ts`: `snappy` settles in 150–600 ms; samples start at 0 and end within 0.001 of 1; a heavily damped spring (`damping: 80`) never exceeds 1; a bouncy one (`stiffness: 300, damping: 10`) overshoots above 1.
  - `contrast.test.ts`: black on white is 21:1 (to 2 decimals); `#777777` on white is below 4.5.
  - `compile.test.ts`: compiles into a temp dir and snapshots `tokens.css`, `theme.css` and `theme.js`; a fixture with low-contrast `fg` rejects with an error mentioning both hex values.
- [ ] `packages/core/test/` (Vitest, `jsdom`, `@testing-library/react`)
  - `useControllableState`: uncontrolled updates internal state; controlled ignores internal updates and calls `onChange`; `onChange` is not called when setting the same value; the functional updater receives the latest value.
- [ ] `packages/motion/test/`
  - `reduced-motion.web.test.tsx` (`jsdom`): mock `matchMedia`; the hook returns false, then true after a `change` event, and removes its listener on unmount.
  - `signature.test-d.ts` (Vitest `--typecheck`): `expectTypeOf(web.useReducedMotion).toEqualTypeOf(native.useReducedMotion)`, importing from `../src/web` and `../src/native`. Needs `react-native` as a dev dependency for its types.
- [ ] `packages/react/test/` (Vitest, `jsdom`)
  - `Box`: renders `data-testid`; inline background is `var(--unison-color-accent)` by default and `var(--unison-color-surface)` for `tone="neutral"`.
  - `renderToString(<Box />)` from `react-dom/server` succeeds (server rendering works).
  - `MotionBadge` shows `motion: full`, and `motion: reduced` with `matchMedia` mocked to match.
- [ ] `packages/native/test/` (Jest)
  - Dev dependencies: `jest`, `jest-expo` (same major as the `expo` version in `apps/mobile`), `@testing-library/react-native`. `jest.config.js`: `preset: "jest-expo"`.
  - If Jest fails with `Cannot use import statement outside a module` for an `@unison-ui/*` file, add `@unison-ui` to the allowlist inside jest-expo's `transformIgnorePatterns`.
  - `Box`: `backgroundColor` equals `themes.light.color.accent`; with `useColorScheme` mocked to `"dark"`, the neutral box uses `themes.dark.color.surface`.
  - `MotionBadge`: mock `AccessibilityInfo.isReduceMotionEnabled` to resolve `true` → text becomes `motion: reduced`.
- [ ] `packages/ui/test/contract.test-d.ts` (Vitest `--typecheck`), the cross-platform contract:
  - `keyof typeof import("@unison-ui/react")` equals `keyof typeof import("@unison-ui/native")` (same export names)
  - `ComponentProps` of web `Box` equals native `Box`; same for `MotionBadge`
- [ ] Coverage: `vitest run --coverage` with the v8 provider, reported but not enforced in phase 0.

**Done when:** `pnpm test` passes from the root. Deliberately adding an extra prop to the native `Box` makes `contract.test-d.ts` fail; revert it afterwards. Commit: `test: unit and contract tests for all packages`.

## 11. Parity harness

The harness renders every fixture case on web (Chromium and WebKit), iOS and Android, in light and dark. It does two different checks:

- **Within a platform:** screenshots are compared with stored baselines, which catches visual regressions.
- **Across platforms:** layout metrics (size and position of named parts) are compared within ±1 px. Pixels are never compared across platforms, because font rendering always differs.

### Step 19 — `packages/parity`: fixtures, collector, compare, report

- [ ] Create `packages/parity` (`"name": "@unison-ui/parity"`, `"private": true`). Dev dependencies: `@playwright/test`, `@axe-core/playwright`, `pixelmatch`, `pngjs`, `sharp`, `tsx`.
- [ ] `src/fixtures/box.ts`:

```ts
export const boxFixture = {
  component: "box",
  cases: {
    accent: { tone: "accent" },
    neutral: { tone: "neutral" },
  },
} as const;
```

- [ ] `src/fixtures/index.ts`: `fixtures = [boxFixture]` and `SCHEMES = ["light", "dark"]`. A **run** is component × case × scheme, with id `box/accent/dark`.
- [ ] `src/registry.tsx`: `{ box: Box }` imported from `@unison-ui/ui`, so it's platform-neutral and the apps' bundlers resolve it like `demo-content`. Export it as a separate entry (`@unison-ui/parity/registry`) built with tsdown; the node scripts below don't need a build.
- [ ] The stage contract, which both apps must follow exactly:
  - A stage element with test id `stage`: width 390, padding 16, background `color.surface`, top-left aligned, no other content
  - Inside it, the component with test id `subject` and the case's props
  - A `ready` signal once fonts and layout have settled
- [ ] `scripts/collector.ts`: an HTTP server on port 4545. `POST /metrics` takes `{ platform, run, pixelRatio, stage: {x, y, width, height}, parts: { subject: {x, y, width, height} } }`, where `parts` positions are relative to `stage`, and writes `parity-output/metrics/<platform>/<run>.json`. Then it responds 204.
- [ ] `scripts/compare.ts`:
  - Cross-platform: for every run, compare the `parts` of `web-chromium`, `ios` and `android` pairwise; fail when any x, y, width or height differs by more than 1.
  - Baselines: compare each screenshot with `baselines/<platform>/<run>.png` using pixelmatch (threshold 0.1); fail when more than 0.1% of pixels differ. A missing baseline fails unless `--update` is passed, which copies the current screenshots into `baselines/`.
  - Exit code 1 on any failure, with a one-line reason per failing run.
- [ ] `scripts/report.ts`: writes `parity-output/report.html`, one row per run with columns web-chromium | web-webkit | iOS | Android (screenshots) and the metrics diff underneath; failures highlighted.
- [ ] `scripts/run.ts`, the entry for `test:parity`: `--platform web|ios|android|all` (default `all`, skipping native platforms whose simulator isn't running, with a warning), `--update`. Order: start the collector → run the platforms → compare → report → stop the collector.
- [ ] `package.json`: `"test:parity": "tsx scripts/run.ts"`. Add `parity-output/` to `.gitignore` (step 1 already has it); commit `baselines/`.

**Done when:** `tsx scripts/compare.ts` against two hand-made metric files that differ by 2 px reports a failure naming the run and the property. Commit: `feat(parity): fixtures, collector, compare and report`.

### Step 20 — Web runner (Playwright)

- [ ] `apps/web-vite/src/parity-page.tsx`: parses `/parity/<component>/<case>?scheme=light|dark`, sets `data-theme` on `<html>`, and renders the stage contract with a plain `<div data-testid="stage">`. After `await document.fonts.ready` and two `requestAnimationFrame`s, it sets `data-parity-ready` on `<html>`.
- [ ] `packages/parity/playwright.config.ts`:
  - `webServer`: `pnpm --filter web-vite dev`, URL `http://localhost:5173`, `reuseExistingServer: !process.env.CI`
  - Projects `web-chromium` and `web-webkit`; viewport 390×844; `deviceScaleFactor: 2`
- [ ] `packages/parity/tests/web.spec.ts`: one test per run. It navigates and waits for `[data-parity-ready]`, then:
  - Screenshots the `stage` element to `parity-output/screenshots/<project>/<run>.png`
  - Writes metrics from `boundingBox()` of `subject` minus `stage` (same JSON shape as the collector)
  - Runs axe on the stage and fails on any violation

**Done when:** `pnpm test:parity --platform web --update` creates 8 screenshots (2 cases × 2 schemes × 2 browsers) and their baselines; running it again without `--update` passes. Commit: `feat(parity): web runner`.

### Step 21 — Native runner (Maestro)

- [ ] `apps/mobile/app/parity/[component]/[case].tsx`:
  - Reads `component`, `case` and the `scheme` query param, calls `Appearance.setColorScheme(scheme)`, and calls `LogBox.ignoreAllLogs()`
  - Renders the stage contract: `<View testID="stage">` (width 390, padding 16, background from `useUnisonTheme()`), with the subject from the registry
  - After layout, measures `subject` relative to `stage` (`measureLayout`) and `stage` in the window (`measureInWindow`)
  - POSTs metrics plus `PixelRatio.get()` to the collector: `http://localhost:4545` on iOS, `http://10.0.2.2:4545` on Android (the emulator's address for the host)
  - Then renders `<Text testID="parity-ready">ready</Text>` **below** the stage, so it falls outside the crop
- [ ] `packages/parity/maestro/case.yaml`:

```yaml
appId: dev.unison.demo
---
- openLink: unison-demo://parity/${COMPONENT}/${CASE}?scheme=${SCHEME}
- extendedWaitUntil:
    visible:
      id: "parity-ready"
    timeout: 15000
- takeScreenshot: ${OUT}
```

- [ ] In `scripts/run.ts` native mode: for each run, `maestro test -e COMPONENT=… -e CASE=… -e SCHEME=… -e OUT=… maestro/case.yaml`. Then crop the full-screen screenshot to the stage using the reported `measureInWindow` × `pixelRatio` (with sharp), and save it to `parity-output/screenshots/<ios|android>/<run>.png`.
- [ ] Run against **release** builds so no dev overlays appear: `npx expo run:ios --configuration Release` and `npx expo run:android --variant release`.
- [ ] Fix the devices so baselines are stable: an iPhone simulator with a 390-pt-wide screen, and one named Android emulator profile. Write both into `CONTRIBUTING.md` (step 26).

**Done when:**

- `pnpm test:parity --update` with both simulators running creates baselines for all four platforms. A second run without `--update` passes, and `report.html` shows four matching columns.
- Sabotage check: adding `margin: 2` to the native `Box` style fails the cross-platform comparison for every native run. Revert it afterwards.

Commit: `feat(parity): native runner`.

## 12. Continuous integration

### Step 22 — `.github/workflows/ci.yml`

It runs on every pull request and on pushes to `main`, with `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`. Every job starts with the same setup steps:

```yaml
- uses: actions/checkout@v4
  with: { fetch-depth: 0 }          # turbo --affected needs history
- uses: pnpm/action-setup@v4        # reads packageManager from package.json
- uses: actions/setup-node@v4
  with: { node-version-file: .nvmrc, cache: pnpm }
- run: pnpm install --frozen-lockfile
```

The jobs:

| Job | Runner | Runs | Needs |
| --- | --- | --- | --- |
| `check` | ubuntu-latest | `pnpm lint`, `pnpm turbo run typecheck test build --affected`, `pnpm check:packages` | — |
| `changes` | ubuntu-latest | `dorny/paths-filter`: outputs `native: true` when `packages/**`, `apps/mobile/**` or `packages/parity/**` changed | — |
| `parity-web` | ubuntu-latest | `pnpm exec playwright install --with-deps chromium webkit`, then `pnpm test:parity --platform web --baseline-only` | check |
| `parity-ios` | macos-latest | Install Maestro; boot the simulator from `CONTRIBUTING.md`; `npx expo run:ios --configuration Release`; `pnpm test:parity --platform ios --baseline-only` | check, changes (only if `native`) |
| `parity-android` | ubuntu-latest | Enable KVM; `actions/setup-java` (Temurin 17); `reactivecircus/android-emulator-runner` with the emulator profile from `CONTRIBUTING.md`, whose script runs `npx expo run:android --variant release` and `pnpm test:parity --platform android --baseline-only` | check, changes (only if `native`) |
| `parity-compare` | ubuntu-latest | Download every parity artefact, then `tsx packages/parity/scripts/compare.ts --cross-only` and `report.ts`; upload `report.html` | all parity jobs (runs if they succeeded or were skipped) |

- [ ] Add the two flags to `scripts/run.ts` and `compare.ts` (step 19): `--baseline-only` skips the cross-platform check (each CI job has only its own platform), and `--cross-only` skips baselines.
- [ ] Every parity job uploads `parity-output/` with `actions/upload-artifact`, using `if: always()` so failures still leave screenshots to look at.
- [ ] Native parity jobs are path-filtered because they're slow (expect 15–25 minutes) and macOS minutes cost more.
- [ ] Branch protection on `main`: require `check`, `parity-web` and `parity-compare`; require a linear history; allow squash merges only. Skipped native jobs count as passing, so docs-only PRs aren't blocked.
- [ ] Optional: if `check` takes over 5 minutes, enable the Turborepo remote cache with `TURBO_TOKEN` and `TURBO_TEAM` as repo secrets.

**Done when:** a PR changing `packages/native/src/box.tsx` runs all six jobs green and the `parity-compare` artefact contains `report.html`; a PR changing only `README.md` skips both native jobs and can still merge. Commit: `ci: checks and parity pipeline`.

## 13. Releases, dependency updates, git hooks

### Step 23 — Changesets and npm publishing

- [ ] `pnpm changeset init`, then set `.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [["@unison-ui/*"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "privatePackages": { "version": false, "tag": false }
}
```

`fixed` keeps every public package on one version number, so users never mix versions.

- [ ] Make `@unison-ui/tsconfig` and `@unison-ui/parity` `"private": true` (already done if you followed steps 4 and 19). Every public package gets `"publishConfig": { "access": "public", "provenance": true }`, plus `"repository"`, `"license": "MIT"` and `"homepage"` fields (publint warns without them).
- [ ] Root script: `"release": "pnpm build && changeset publish"`.
- [ ] `.github/workflows/release.yml`, on push to `main`: the same setup steps as CI, then `changesets/action` with `publish: pnpm release`. Permissions: `contents: write`, `pull-requests: write`, `id-token: write` (provenance). The action opens a "Version packages" PR; merging it publishes.
- [ ] npm authentication: the very first publish uses an npm automation token stored as the `NPM_TOKEN` secret. After the packages exist on npm, configure **Trusted Publishing** for each package (npmjs.com → package settings → GitHub Actions, this repo, `release.yml`) and delete the token.
- [ ] `.github/workflows/snapshot.yml`: on a PR labelled `snapshot`, run `pnpm changeset version --snapshot pr${{ github.event.number }}` and `pnpm changeset publish --tag pr${{ github.event.number }} --no-git-tag`, then comment the install command (`pnpm add @unison-ui/ui@pr123`) on the PR. The PR needs at least one changeset.

**Done when:** a PR with a changeset, labelled `snapshot`, publishes `0.0.0-pr<n>-…` versions of every public package under the `pr<n>` tag, and they show the provenance badge on npmjs.com. Commit: `ci: changesets release and snapshot publishing`.

### Step 24 — Renovate

- [ ] Install the Renovate GitHub App on the repo.
- [ ] `renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended", ":semanticCommits", "group:monorepos"],
  "schedule": ["before 6am on monday"],
  "packageRules": [
    {
      "description": "Expo SDK and everything pinned to it is upgraded by hand with npx expo install --fix",
      "matchPackageNames": ["expo", "react", "react-dom", "react-native", "@types/react", "jest-expo", "react-native-reanimated", "react-native-gesture-handler", "react-native-worklets"],
      "enabled": false
    },
    { "matchDepTypes": ["devDependencies"], "matchUpdateTypes": ["minor", "patch"], "groupName": "dev dependencies (non-major)" }
  ]
}
```

- [ ] Add `docs/expo-upgrade.md` with the manual SDK upgrade procedure: in `apps/mobile`, run `npx expo install expo@latest`, then `npx expo install --fix`; copy the resulting `react` version into the catalog; run `pnpm check` and the full parity suite.

**Done when:** Renovate's onboarding PR is merged and the Dependency Dashboard issue exists. Commit: `chore: renovate config`.

### Step 25 — Git hooks (Lefthook)

- [ ] Root script `"prepare": "lefthook install"`, so hooks install on `pnpm install`.
- [ ] `lefthook.yml`:

```yaml
pre-commit:
  commands:
    no-commit-to-main:
      run: test "$(git branch --show-current)" != "main"
      fail_text: "Commit on a branch, not main."
    format:
      glob: "*.{ts,tsx,js,json,css}"
      run: pnpm biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true
pre-push:
  commands:
    verify:
      run: pnpm lint && pnpm turbo run typecheck --affected
```

**Done when:** committing on `main` is rejected; a badly formatted staged file is fixed automatically during commit; a type error blocks `git push`. Commit: `chore: git hooks`.

## 14. Docs, decisions and tooling for phase 1+

### Step 26 — `CONTRIBUTING.md` and the doctor script

- [ ] `tooling/scripts/doctor.ts` (root script `"doctor": "tsx tooling/scripts/doctor.ts"`) checks each of these and prints ✓ or ✗ with the fix command:
  - Node major matches `.nvmrc`; pnpm matches `packageManager`
  - macOS: `xcodebuild -version` works, the parity iPhone simulator exists (`xcrun simctl list devices`), `watchman` is installed
  - `ANDROID_HOME` is set, `adb` is on PATH, and the parity emulator profile exists (`emulator -list-avds`)
  - `maestro --version` works
  - Ports 3000, 5173, 8081 and 4545 are free
- [ ] `CONTRIBUTING.md`, in this order:
  1. Prerequisites (copy from section 0), then `pnpm install && pnpm doctor`
  2. Running things: `pnpm dev`, `pnpm dev:web`, `pnpm dev:mobile`; `npx expo run:ios` / `run:android` for the first native build
  3. The exact parity devices: simulator name and emulator profile (from step 21)
  4. Tests: `pnpm test`, `pnpm test:parity`, `pnpm test:parity --update`, and when updating baselines is allowed (only for intended visual changes, explained in the PR)
  5. Commits and PRs: Conventional Commits, one changeset per user-facing change (`pnpm changeset`)
  6. Troubleshooting: Metro cache (`npx expo start -c`), stale `dist` (`pnpm build`), a simulator stuck on an old app (uninstall it)
- [ ] `.github/PULL_REQUEST_TEMPLATE.md`: what changed, screenshots or the parity report, a changeset checkbox, and "baselines updated? why?"
- [ ] `.github/ISSUE_TEMPLATE/`: `bug.yml` (platform dropdown: web / iOS / Android, package version, reproduction) and `feature.yml`.
- [ ] GitHub labels: `web`, `native`, `motion`, `a11y`, `tokens`, `parity`, `snapshot`.

**Done when:** a teammate (or you, on a fresh clone in a new folder) gets from zero to `pnpm dev` using only `CONTRIBUTING.md`, and `pnpm doctor` shows all ✓. Commit: `docs: contributing guide and doctor`.

### Step 27 — Architecture doc and ADRs

- [ ] `docs/architecture.md`: the package graph (tokens → core and motion → react and native → ui), what may import what (the step 5 table), how `ui` picks a platform (export conditions), and how a token flows from JSON to a pixel on each platform.
- [ ] `docs/adr/` with `0000-template.md` (Context, Decision, Alternatives considered, Consequences, Status) and one ADR per decision from section 0:
  - `0001-name-and-scope.md`
  - `0002-pnpm-and-turborepo.md`
  - `0003-expo-only-native.md`
  - `0004-react-19-new-architecture.md`
  - `0005-native-tailwind-engine.md`: include the spike results from 17.5
  - `0006-web-motion-engine.md`: status "proposed", to be decided in phase 4
  - `0007-tsdown-esm-only.md`
  - `0008-package-level-platform-split.md`: why renderers are split by package, not by file extension
  - `0009-testing-stack.md`
  - `0010-mit-license.md`

**Done when:** every row of the section 0 decisions table links to an ADR. Commit: `docs: architecture and ADRs`.

### Step 28 — Component checklist and generator

- [ ] `docs/component-checklist.md`, the definition of done for every future component:
  - Props contract in `core/src/components/<name>/<name>.types.ts`
  - Style spec in `<name>.styles.ts`, token paths only
  - Motion spec in `<name>.motion.ts` (if it animates)
  - Headless logic hook (if it has state)
  - Web renderer in `react/src/<name>.tsx` and native renderer in `native/src/<name>.tsx`, both exported from their index files
  - Parity fixtures covering every variant, both schemes
  - Unit tests on both platforms; contract test passes automatically
  - A changeset
- [ ] `tooling/scripts/new-component.ts` (root script `"new:component": "tsx tooling/scripts/new-component.ts"`): `pnpm new:component switch` creates every file in the checklist with a working stub (a `Switch` that renders a placeholder box), adds the exports and a fixture, and prints the remaining TODOs.

**Done when:** `pnpm new:component probe` produces a component that passes `pnpm check` and appears in the parity report. Then delete it again (`git clean` + `git checkout`). Commit: `chore: component checklist and generator`.

## 15. Final acceptance

### Step 29 — Clean-clone run

Clone the repo into a new folder (not your working copy) and go through this list in order. Phase 0 is done only when every item passes without editing any file.

- [ ] `pnpm install` finishes with no errors, and `pnpm doctor` is all ✓
- [ ] `pnpm check` (lint, typecheck, test, build) passes
- [ ] `pnpm check:packages` reports no publint or attw problems
- [ ] `pnpm dev` starts the Next.js app (port 3000), the Vite app (port 5173) and Metro; the iOS and Android dev builds connect
- [ ] All four surfaces show the same four items; `box-accent` and `tw-box` are identical on each
- [ ] With `pnpm dev` running, changing `color.accent` in `packages/tokens/tokens/base.json` updates all four surfaces without restarting anything. Revert it afterwards.
- [ ] Dark mode works on all four surfaces, both from the toggle and from the system setting, with no light flash on web reload
- [ ] Reduce motion switches `MotionBadge` to `reduced` on all four surfaces
- [ ] The Next.js production build serves `/` as static, with `Box` in the server HTML and no `react-native` code in `.next/static`
- [ ] `pnpm test:parity` (both simulators running) passes for web-chromium, web-webkit, iOS and Android, and `report.html` shows four matching columns
- [ ] On GitHub: CI is green on a PR touching `packages/native`, and a `snapshot`-labelled PR publishes installable versions with provenance
- [ ] In a brand-new Next.js app and a brand-new Expo app **outside** the monorepo, `pnpm add @unison-ui/ui@pr<n> @unison-ui/tokens@pr<n>` plus the documented CSS imports renders `Box` correctly
- [ ] Every decision has an ADR, and `CONTRIBUTING.md` got a teammate from zero to `pnpm dev`

**When everything passes:** tag the commit `phase-0-complete`, and tick the Phase 0 gate in the roadmap tab. Phase 1 starts by replacing the minimal token set from step 7 with the full token scale.
