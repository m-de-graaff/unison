# Phase 3 — development todo: form engine

Same format as before: follow the steps in order, pass each **Done when**, one commit per step. This phase builds the **form engine** that every future form control will use — field context, form context, the value API, platform input mapping, selection state, the React Hook Form adapter and accessible error handling — proven through two small internal probe controls. No public form components yet; those come later, from the component catalogue.

## 0. Before you start

### Prerequisites

- [ ] `phase-2-complete` is tagged and `0.2.0` is published, CLI included.
- [ ] Install in the demo apps and the test harness only (never in the libraries): `react-hook-form`, `zod`, `@hookform/resolvers`.

### Decisions this phase assumes

Each becomes an ADR in step 10.

| Decision | Default | Why |
| --- | --- | --- |
| Value API | `value` / `defaultValue` / `onValueChange(value)` for every future control, both platforms; `checked` / `onCheckedChange` for toggles. No `onChange(event)`. | Web and React Native events have different shapes; a plain value works for both and for form libraries |
| Validation | The app's job (React Hook Form, Zod, anything). The engine only **carries** state: `invalid`, `error`, `required`, `disabled`, `readOnly`. | No lock-in |
| Selection and toggle state | `react-stately` in `@unison-ui/core`. It's platform-free (no DOM), so the same state hooks serve web and native. | Proven list, selection and toggle logic without writing it twice |
| Web control behaviour | React Aria hooks (`useTextField`, `useCheckbox`, `useSwitch`, `useSelect`, `useListBox`) wrapped by the engine for future components | Keyboard, screen readers, typeahead and autofill already solved |
| Labels | Field context provides label, description and error to any control inside it | One labelling path for every control |
| Haptics rule for controls | Toggles and pickers: `selection` on change, on by default; text entry: none | Phase 2 rule: haptics mark a result |

### How errors reach screen readers

|  | Web | iOS / Android |
| --- | --- | --- |
| Label | `<label for>` via React Aria | `accessibilityLabel` = the label text |
| Description | `aria-describedby` | `accessibilityHint` = the description |
| Error | `aria-invalid` + `aria-describedby` includes the error | The error is **appended** to `accessibilityHint`, and announced once with `AccessibilityInfo.announceForAccessibility` when it first appears |
| Required | `aria-required` | "required" appended to the label for screen readers |

## 1. The form engine

### Step 1 — Tokens for form controls

- [ ] Semantic colour `ring-danger` (danger.500 / danger.600) for the focus ring of an invalid control, with a contrast pair against `surface` at 3.0.
- [ ] Turn on the **component tier** reserved in phase 1: a `tokens/component/` folder, emitted like the other tiers. Extend the tier lint: component tokens may alias semantic or primitive tokens, and only the matching component's spec may reference them. No component tokens are added yet; the probe gets one test token (`probe.track-width`) to prove the mechanism.
- [ ] Write the control colour rules into `docs/authoring-components.md` (they apply when components arrive): input and checkbox borders `border-strong` (3:1 against `surface`), switch track off `border-strong`, on `accent`; placeholders `fg-subtle` (3:1) only because a field label is always required.

**Done when:** the tokens build, contrast passes, and referencing `probe.track-width` from any spec other than the probe's fails the lint. Commit: `feat(tokens): form tokens and component tier`.

### Step 2 — Field context

- [ ] `@unison-ui/core/src/field/field-context.ts`: a React context holding `{ id, labelId, descriptionId, errorId, label, description, error, required, disabled, invalid, readOnly }`, ids from `useId()`. A non-visual `FieldProvider` sets it.
- [ ] `useFieldControl(ownProps)`: merges the context with a control's own props (own props win) and returns what a renderer needs: ids and ARIA attributes on web; composed `accessibilityLabel` and `accessibilityHint` on native, per the table above.
- [ ] `invalid` is `true` when `error` is a non-empty string, unless set explicitly.
- [ ] Native: when `error` goes from empty to non-empty, announce it once with `AccessibilityInfo.announceForAccessibility`; never re-announce the same message on re-render.

**Done when:** unit tests cover merging, ids, invalid-from-error and the single announcement. Commit: `feat(core): field context`.

### Step 3 — Form context

- [ ] A non-visual `FormProvider` and `useFormContext()` in `@unison-ui/core`:
  - `submit()`, called by the platform layer (web: a `<form>`'s submit event; native: the return key)
  - `disabled`, propagated to every field inside (for example while submitting)
  - A field registry: controls register a focusable ref in mount order, so the engine knows the next field
  - `formError` + a one-time announcement helper for form-level messages ("Incorrect email or password")
- [ ] Web helper `useFormElement()` returns props for a `<form noValidate>` that prevent default and call `submit()`. `noValidate`, because validation is the app's job.
- [ ] Native helper `useReturnKey(kind)`: `"next"` focuses the next registered field and keeps the keyboard up; `"done"`, `"go"` and `"send"` call `submit()`.

**Done when:** unit tests on both platforms cover submit, disabled propagation, registry order (including fields added and removed later) and the return-key behaviour. Commit: `feat(core): form context`.

### Step 4 — React Hook Form adapter

- [ ] `fromController({ field, fieldState })` in `@unison-ui/core`, duck-typed so the libraries never import `react-hook-form`:

```ts
const { fieldProps, controlProps } = fromController({ field, fieldState });
// fieldProps:   { error, invalid }
// controlProps: { name, value, onValueChange: field.onChange, onBlur: field.onBlur, ref: field.ref }
```

- [ ] Rule for every future control: its `ref` exposes `focus()`, so React Hook Form's focus-on-error works on both platforms. The contract-test helper from phase 2 checks it.

**Done when:** a test form with React Hook Form + Zod, using the probe controls from step 7, focuses the first invalid control on submit in `jsdom` and in Jest for native. Commit: `feat(core): react hook form adapter`.

### Step 5 — Text-entry platform mapping

- [ ] Pure functions in `@unison-ui/core` that future text inputs will call, so platform differences are decided once:

| Shared prop | Web | Native |
| --- | --- | --- |
| `type` (`text`, `email`, `password`, `number`, `tel`, `url`, `search`) | `type` attribute | `keyboardType` + `secureTextEntry` for password + `autoCapitalize="none"` for email, url and password |
| `autoComplete` (`email`, `username`, `current-password`, `new-password`, `one-time-code`, `name`, `tel`, `postal-code`, `off`) | `autocomplete` | `autoComplete` + iOS `textContentType` |
| `returnKey` (`next`, `done`, `go`, `send`, `search`) | `enterKeyHint` | `returnKeyType` + `useReturnKey` from step 3 |

**Done when:** table-driven tests cover every combination on both platforms. Commit: `feat(core): text entry mapping`.

### Step 6 — Toggle and selection state

- [ ] Add `react-stately` to `@unison-ui/core` and wrap what future controls need behind Unison's value API: `useToggleValue` (checked, indeterminate, controlled and uncontrolled) and `useSelectionValue` (single and multiple selection over an `items` array, with disabled items and typeahead keys).
- [ ] Platform renderers will call these; React Aria's DOM hooks on web take the same state objects.

**Done when:** unit tests cover controlled and uncontrolled modes, `onValueChange` / `onCheckedChange` firing exactly once per change, disabled items and multi-select. Commit: `feat(core): toggle and selection state`.

### Step 7 — Probe controls

- [ ] Two internal controls, exported only from `/internal`, that exist purely to exercise the engine (like phase 2's `Probe`):
  - `ProbeInput`: a bare text input wired to `useFieldControl`, the text-entry mapping and the form registry
  - `ProbeToggle`: a bare checkbox-like toggle wired to `useToggleValue`, `useFieldControl` and haptics
- [ ] A `ProbeForm` screen in `demo-content` (email, password, "remember me") using `FormProvider`, `FieldProvider`, the probe controls, React Hook Form and Zod, with a fake submit that fails for anything but `demo@unison.dev` / `password123`.

**Done when:** the probe form works by hand on all four surfaces: errors show and announce, the return-key flow moves Email → Password → submit on phones, and a wrong password sets the announced form-level error. Commit: `feat: probe controls and form`.

## 2. Tests

### Step 8 — Engine tests

- [ ] Unit tests for steps 2–6 on both platforms (most already exist from the steps; fill the gaps to over 85% coverage in `core`).
- [ ] React Hook Form integration on both platforms: submit with errors focuses the first invalid control; `disabled` blocks input during submit.
- [ ] Screen-reader smoke test by hand, written into `docs/a11y-checks.md` (one table per platform): the probe form with VoiceOver on macOS Safari, VoiceOver on iOS and TalkBack on Android. Name, role, state and errors are announced.

**Done when:** `pnpm test` passes and the manual table has no open issues. Commit: `test: form engine`.

### Step 9 — Cross-platform scenario runner

- [ ] A reusable scenario format in `packages/parity/scenarios/`: steps as data (tap, type, submit, expect text), with a Playwright runner and a Maestro runner (generated YAML) that execute the same steps. Every future component and template reuses it.
- [ ] First scenario: the probe form. Submit empty → expect two errors; fix the email → its error disappears; wrong password → expect the form error; correct credentials → expect "Welcome back".

**Done when:** the probe-form scenario passes on web-chromium, web-webkit, iOS and Android. Commit: `test: scenario runner`.

## 3. Docs and release

### Step 10 — Docs and ADRs

- [ ] `docs/forms.md`: the value API, why validation is the app's job, the React Hook Form adapter, error display and announcement rules, the return-key flow, autofill mapping.
- [ ] `docs/authoring-components.md`: a "Building a form control" chapter that walks through the probe controls step by step.
- [ ] ADRs: the value API; validation out of scope; `react-stately` for shared state; React Aria for web controls; native error announcements; placeholder contrast; the component token tier.

**Done when:** someone builds a small new control (for example a probe slider) on the engine using only the docs. Commit: `docs: form engine`.

### Step 11 — Release 0.3.0

- [ ] Changesets (`minor`) for every public package; snapshot release; run `cli-e2e.ts` and the probe-form scenario against it; merge the "Version packages" PR.

**Done when:** `0.3.0` is on npm with provenance. Commit: (made by the Changesets bot).

## 4. Final acceptance

### Step 12 — Clean-clone run and the phase 3 gate

- [ ] `pnpm install`, `pnpm run doctor`, `pnpm check` and `pnpm check:packages` pass
- [ ] `pnpm test:parity` passes on all four platforms
- [ ] **The roadmap gate:** the probe-form scenario passes on web-chromium, web-webkit, iOS and Android, from one file and one set of steps
- [ ] The screen-reader table in `docs/a11y-checks.md` has no open issues
- [ ] `0.3.0` is on npm; every new decision has an ADR

**When everything passes:** tag `phase-3-complete` and tick the Phase 3 gate in the roadmap tab. Phase 4 adds the motion and overlay engine.
