# git-workflow

Owns git and GitHub hygiene so you don't have to think about it during a session. It decides
when to branch, commit, push, open a PR, stack, and release — then does it and tells you what
it did.

## What it does

- **Profiles the repo first.** `work` (branch protection, CODEOWNERS, or more than one
  committer) → PRs are mandatory, nothing touches the default branch. `solo` → small clean
  changes may land directly. `package` (published) → version is a contract. `app` (deployed) →
  version is a deploy marker.
- **Commits at defined checkpoints:** 5 files, 150 changed lines, a red→green suite, or a
  finished logical unit. Conventional Commits, with the scope vocabulary derived from the
  repo's own `packages/`/`apps/` layout rather than a fixed list.
- **Splits unrelated changes** into separate commits with path-scoped adds or `git add -p`,
  instead of committing a blob.
- **Scans staged content for secrets before every commit** — env files, provider key formats,
  private key blocks, credential-shaped assignments. Uses `gitleaks` when installed.
- **Opens PRs** with a body derived from the commit range: what changed, why, risk, how to
  verify. Follows the repo's PR template exactly when one exists. Draft while CI is red or
  pending, ready when green.
- **Stacks PRs** via `gh stack` when a change is genuinely ≥ 3 dependency layers and ≥ 400
  lines. Degrades to plain chained-base PRs when the extension isn't installed.
- **Versions and releases** from conventional commits, with separate rules for published
  packages and deployed apps, and a concrete rc→stable promotion rule.

## What it will never do

- Force-push the default or a protected branch; `push --force` without `--force-with-lease`.
- `reset --hard`, `clean -fd`, `checkout --` over uncommitted work, or rewrite pushed history
  without your confirmation in that turn.
- Use `--no-verify`, or merge with failing or pending checks.
- Squash away your commit messages without showing you the result first.
- Add `Co-Authored-By` or any tool attribution to a commit, PR, tag, or release.
- Commit a tree it knows is broken.

**Non-goals** (deliberately out of scope, so it doesn't sprawl): CI config management,
dependency updates, correctness or design review of the diff, deployment, repo or branch
protection settings, issue triage, semantic merge-conflict resolution, rewriting shared history.

## Install

Ships in the `toolkit` plugin:

```
/plugin marketplace add m-de-graaff/skills
/plugin install toolkit@skills
```

Already installed? `/plugin marketplace update skills`, then `/reload-plugins`.

It loads on its own when its description matches what you're doing, or explicitly via
`/toolkit git-workflow`.

### Hooks

Three hooks ship with the plugin via `hooks/hooks.json` and load automatically — nothing to
paste into `settings.json`, no absolute path to keep in sync across updates. `SessionStart`
reports the repo state, `PreToolUse` blocks destructive git commands, `Stop` refuses to end a
turn on a large uncommitted diff. Rationale, costs, and what deliberately does *not* ship:
[`references/hooks.md`](references/hooks.md).

They're on as soon as the plugin is installed. Turn them off per repo with the kill switch
below, or everywhere with `/plugin disable toolkit@skills`.

### Developing on it

To edit the skill and have changes apply without reinstalling, point a link at the checkout.
Windows (PowerShell, Developer Mode on or elevated):

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\git-workflow" `
  -Target "C:\Development\skills\skills\git-workflow"
```

macOS/Linux: `ln -s ~/src/skills/skills/git-workflow ~/.claude/skills/git-workflow`

Note this links the *skill* only — hooks still come from the installed plugin, so hook changes
need `/plugin marketplace update skills` to take effect.

## Disable per repo

```sh
mkdir -p .claude && touch .claude/git-workflow-off
```

Every script exits early and the skill stands down for that repo — it will still do git work
you ask for directly, but it stops volunteering. Delete the file to re-enable.

To disable everywhere, remove the hook block from `settings.json`; to remove it entirely,
`/plugin uninstall toolkit@skills`.

## Layout

```
SKILL.md                     policy and thresholds — the part the model reads
references/versioning.md     SemVer rules, channels, rc→stable, tooling choice
references/stacked-prs.md    slicing heuristic, gh stack, plain-PR fallback
references/hooks.md          opt-in settings.json snippet, annotated
scripts/git-context.sh       read-only repo snapshot (SessionStart hook + skill)
scripts/scan-secrets.sh      staged-content secret scan, exit 2 on a finding
scripts/guard-git.sh         PreToolUse(Bash) block list for destructive commands
scripts/stop-check.sh        Stop hook, once per HEAD, no silent uncommitted work
```

All four scripts are read-only apart from `stop-check.sh`'s stamp file in the temp directory,
idempotent, and safe to run twice.
