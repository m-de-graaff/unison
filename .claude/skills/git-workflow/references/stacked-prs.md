# Stacked PRs

A stack is several PRs where each is based on the one below it, reviewed and merged bottom-up.
`gh stack` (public preview, 2026-07-31) does the mechanics. **This skill decides whether to
stack and where the layer boundaries go — it never reimplements retargeting or rebase logic.**

## Should this be a stack?

Stack only when **all three** hold:

1. **≥ 400 changed lines** (excluding lockfiles, generated code, snapshots).
2. **≥ 3 layers** that are genuinely ordered by dependency.
3. Each layer is **independently reviewable and independently revertible** — the bottom layer
   can sit on the default branch on its own without breaking anything or shipping a half-feature.

Below that, one PR. The overhead of a stack is real: N PR bodies, N review threads, a rebase
cascade on every change to a lower layer, and a merge order you have to hold in your head.
Two PRs is not a stack, it is two PRs.

**Also don't stack when:** the layers churn against each other (you already know layer 1's
interface will move once you write layer 3 — build it as one branch, split at the end if it
is worth it), or when a reviewer would have to read the whole stack to review any one part.
That second one means the boundary is wrong, not that stacking is wrong.

## Where the boundaries go

**Rule: cut where an interface freezes.** A layer boundary is a place where the thing below
exports something stable that the thing above consumes. If layer N+1 forces you to change
layer N, the boundary was in the wrong place.

Canonical order for a full-stack feature — each is a superset of what the one below exposes:

| Layer | Contains | Frozen interface it exports |
|---|---|---|
| 1 | migration / schema change | table + column shape |
| 2 | data access, models, repository | typed read/write functions |
| 3 | API surface: handler, contract, validation | request/response shape |
| 4 | client/UI consuming that API | — |
| 5 | docs, changelog, feature flag flip | — |

Other boundaries that freeze cleanly: pure refactor **before** the behaviour change that needs
it (this one is the highest-value split there is — a reviewer reads a no-op diff and a small
diff, instead of a large one where the behaviour change is hidden inside the move); dependency
bump before the code that uses the new API; type/interface definitions before implementations.

**Layer 1 is expected to be mergeable and inert on its own.** A migration that adds a nullable
column ships safely with nothing reading it. If your layer 1 breaks production when merged
alone, it is not layer 1 — put the feature behind a flag and make the flag layer 1.

Merge bottom-up, one at a time, only when that layer's checks are green.

## Executing with `gh stack`

Requires `gh` ≥ **2.90.0** and Git ≥ 2.20. Check before assuming:

```sh
gh --version
gh extension list | grep -q gh-stack && echo "stack available"
```

Install (once, with the human's go-ahead — it is a tool install, not a repo change):

```sh
gh extension install github/gh-stack
gh skill install github/gh-stack     # optional: teaches the agent the commands
```

Commands — these are the whole surface:

```sh
gh stack init                  # start a stack from the current branch
gh stack add BRANCH            # add an existing branch as the next layer
gh stack add -Am "feat: ..."   # stage all, commit, and add as the next layer
gh stack push                  # push every layer, retarget as needed
gh stack submit                # open/update the PRs, with the stack navigation table
gh stack view                  # show the stack and each layer's state
```

Rebasing a lower layer, retargeting PR bases after a merge, and keeping the navigation comment
current are `gh stack`'s job. Do not script around them.

## Degrading when `gh stack` is not available

`gh` 2.83.2 (current on this machine) is **below** the 2.90.0 requirement — assume the plain
path until `gh --version` says otherwise. It is a preview extension; treat it as absent by
default and never as a hard dependency.

Plain fallback — same slicing, manual chaining:

```sh
git checkout -b feat/x-1-schema main
gh pr create --base main --draft --title "feat(db): x — 1/3 schema"

git checkout -b feat/x-2-api feat/x-1-schema
gh pr create --base feat/x-1-schema --draft --title "feat(api): x — 2/3 API"
```

Then, by hand:

- Put a stack table at the top of **every** PR body (`1/3 schema ← you are here`, `2/3 API`,
  `3/3 UI`), so a reviewer landing on #2 knows what #1 was.
- Layer 1 changes → rebase the layers above it: `git rebase --onto feat/x-1-schema
  <old-base-sha> feat/x-2-api`, then `git push --force-with-lease`. Never plain `--force`.
- After merging layer 1, retarget layer 2's PR to the default branch:
  `gh pr edit <n> --base main`. GitHub does this automatically only for the immediate child —
  check the rest with `gh pr list`.
- Merge strictly bottom-up. A squash-merge of layer 1 rewrites its SHAs, so layer 2 **must** be
  rebased onto the default branch afterwards, not merged from its stale base.

That last point is the actual cost of the plain path, and the reason the 400-line / 3-layer
threshold exists: below it, you pay this bookkeeping for a change that fit in one PR.
