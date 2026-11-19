---
name: git-workflow
description: >
  Use when a unit of work finishes, tests just went green, a refactor is about to start, a
  work block ends, or the tree has drifted uncommitted — and whenever asked to commit, branch,
  push, open or merge a PR, stack PRs, tag, version, or cut a release. Also use on a dirty
  main, a detached HEAD, a diff that has outgrown one commit, or before any force-push,
  reset --hard, history rewrite, or squash of existing commit messages.
---

# git-workflow

Own the repo's hygiene so the human never has to think about it. Decide when to branch,
commit, push, open a PR, stack, and release — then do it and report. Judgment lives here;
mechanics live in `scripts/` and `gh`.

**Core principle: the tree is never left in a state you would not want to walk back into.**

## 0. Profile the repo first (always)

```sh
bash <skill-dir>/scripts/git-context.sh
```

One read-only call. Returns branch, divergence, dirty counts, open PRs, and two labels that
drive every rule below:

| Label | Meaning | Detected by |
|---|---|---|
| `profile: work` | PRs mandatory, **nothing** is pushed to the default branch | branch protection/ruleset on default branch, `CODEOWNERS`, or >1 committer in last 100 commits |
| `profile: solo` | Direct commits to the default branch are allowed within the limits below | none of the above |
| `kind: package` | Version is a **contract**. Full SemVer, changelog, channels | publishable manifest (not `private: true`) |
| `kind: app` | Version is a **deploy marker**. Tag for rollback, no release ceremony | everything else |

If it prints `enabled: false`, this skill is off for that repo — do only what is explicitly
asked, add nothing.

## Autonomy contract

Commit, push, create branches, and open PRs **without asking**; report what was done in two
or three lines. **Stop and get confirmation in the current turn** for anything on the Never
list, and for: merging, deleting anything, rewriting history, publishing a release, or
touching another person's branch.

## Never

- Never force-push the default branch or any protected branch. Never `push --force` without
  `--force-with-lease`.
- Never `reset --hard`, `clean -fd`, or `checkout --`/`restore` over uncommitted work; never
  rewrite pushed history — without explicit confirmation **in this turn**.
- Never `--no-verify`. A failing hook is a real failure: fix the cause, or stop and say so.
- Never merge with failing or pending checks. Never `gh pr merge --admin`.
- Never commit without running the secret scan (below).
- Never squash away existing commit messages without showing the resulting message first.
- Never add `Co-Authored-By`, `Generated with`, or any tool attribution to a commit, PR body,
  tag, or release note. Not once.
- Never commit a tree you know is broken. A checkpoint on failing tests is **deferred**, not
  skipped — say that you deferred it. Once a deferred checkpoint reaches **2× a threshold**
  (10 files or 300 lines), stop deferring silently: either get to green now, or park a recovery
  point with `git stash create` + `git update-ref refs/wip/<slug> <sha>` (nothing enters
  history, nothing is lost) and say where it is.

## Commits

**Checkpoint when any one of these fires:**

| Trigger | Threshold |
|---|---|
| Files touched since last commit | **≥ 5** |
| Net changed lines since last commit | **≥ 150** |
| Test suite transitions | **red → green** |
| Logical unit complete | a reviewer could describe it in one sentence |

5 files / 150 lines is about the largest diff that still splits cheaply with `git add -p`;
past it, reconstructing intent costs more than the commit would have. Red→green is the only
free known-good point in a session — take it.

**Procedure:**

1. `bash <skill-dir>/scripts/scan-secrets.sh` on the staged set. Non-zero → unstage the file,
   report the finding, do not commit. No exceptions, no `--no-verify`.
2. **One logical change per commit.** Two unrelated top-level scopes dirty → path-scoped
   `git add <paths>`, one commit each. Unrelated changes interleaved inside one file →
   `git add -p`. Never one blob commit.
3. Conventional Commits: `type(scope): subject`. Types: `feat fix perf refactor docs test
   chore ci build style revert`. **Derive scope from the repo, never a hardcoded list** —
   directory names under `packages/`, `apps/`, `services/`; otherwise the top-level directory
   of the changed paths; omit the scope when the change spans more than two.
4. Subject: imperative, ≤ 72 chars, no trailing period. Body only when *why* isn't obvious
   from the subject. Breaking change → `!` after the scope **and** a `BREAKING CHANGE:` footer.

## Branches

Name `type/slug`, or `type/PROJ-123-slug` when a ticket ID is in play. Take the ticket from
the current branch or from what the human said — never invent one. A `DRAFT-nnn` placeholder
from `jira-workflow` is not a ticket ID: branch `type/slug` and rename once a real key exists.

**Work must leave the default branch if any of:** repo is `work`; more than one commit is
expected; ≥ 3 files; or it touches schema/migrations, dependencies, CI config, or a public API.

**Direct commit to the default branch is allowed only when all of:** `profile: solo`, tree was
clean, single commit, and either no behaviour change (docs, typo, formatting) or ≤ 2 files and
≤ 20 lines.

Update a feature branch by **rebase onto the default branch**, never a back-merge. Land via
squash merge on solo repos; follow the repo's configured default on work repos. After a merge:
delete the remote and local branch, then `git fetch --prune`.

## Pull requests

**A PR is warranted when:** repo is `work` (always), or ≥ 3 commits, or ≥ 200 changed lines,
or it touches schema/deps/CI/public API, or CI is the thing you actually want.

Build the body from `git log <base>..HEAD` and `git diff --stat <base>...HEAD` — four sections:
**What changed** (intent, not a file list) / **Why** / **Risk** (what breaks if this is wrong,
and the blast radius) / **How to verify** (commands a reviewer runs). Never restate the diff.

If `.github/PULL_REQUEST_TEMPLATE.md` or `.github/PULL_REQUEST_TEMPLATE/*` exists, fill that
template exactly — every section, no sections added, none removed.

**Draft is the CI signal:** open as draft while checks are pending or red or the work is
incomplete; `gh pr ready` once green. On work repos, request review only after it is ready.

Stacking a change instead of one PR → read `references/stacked-prs.md`. Below ~400 changed
lines or fewer than 3 dependency layers, stacking is pure overhead — one PR.

## Releases

Read `references/versioning.md` before tagging, bumping, or publishing anything. It carries
the SemVer promotion rules, the channel definitions, the rc→stable decision rule, and the
tooling choice.

## Non-goals

Does not manage CI config (`ci-pipelines`), update dependencies, review the diff for correctness
or design, deploy anything, change repo or branch-protection settings, triage issues, resolve
semantic merge conflicts (it stops and hands back), or rewrite history that is already shared.
Owns the *structure* of a commit subject and a PR body; `writing-prose` owns the sentences inside
them.

## Red flags — stop

- Reaching for `--no-verify`, `--force` without lease, or `--admin`
- "I'll commit it all in one go and split it later"
- Committing on a red suite to "checkpoint"
- Writing a PR body by paraphrasing the diff
- Tagging a release straight from a dirty tree
- Adding a co-author trailer out of habit
