#!/usr/bin/env sh
# git-context.sh — read-only snapshot of the current repo.
# Writes nothing, fetches nothing, exits 0 even outside a repo. Safe to run twice.
# Output is `key: value` lines, one per line, stable key order.
set -u

say() { printf '%s: %s\n' "$1" "$2"; }
count() { wc -l | tr -d '[:space:]'; }

root=$(git rev-parse --show-toplevel 2>/dev/null) || { say repo none; exit 0; }
say repo "$root"

# Per-repo kill switch. Everything downstream (hooks included) honours this.
if [ -f "$root/.claude/git-workflow-off" ]; then
  say enabled false
  exit 0
fi
say enabled true

# --- branch and divergence -------------------------------------------------
branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo "")
if [ -z "$branch" ]; then
  say branch "DETACHED@$(git rev-parse --short HEAD 2>/dev/null)"
  say warn "detached HEAD — commits here are unreachable once you switch away"
else
  say branch "$branch"
fi

default=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
if [ -z "$default" ]; then
  for c in main master trunk; do
    git show-ref --verify --quiet "refs/heads/$c" && { default=$c; break; }
  done
fi
say default_branch "${default:-unknown}"

if upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null); then
  say upstream "$upstream"
  # shellcheck disable=SC2046  # deliberate split: "<behind> <ahead>" into $1 and $2
  set -- $(git rev-list --left-right --count "$upstream...HEAD" 2>/dev/null || echo "0 0")
  say behind "${1:-0}"
  say ahead "${2:-0}"
else
  say upstream none
  [ -n "$branch" ] && say warn "no upstream — nothing on this branch is pushed"
fi

# --- working tree ----------------------------------------------------------
staged=$(git diff --cached --name-only | count)
unstaged=$(git diff --name-only | count)
untracked=$(git ls-files --others --exclude-standard | count)
say staged "$staged"
say unstaged "$unstaged"
say untracked "$untracked"
say diffstat "$(git diff HEAD --shortstat 2>/dev/null | sed 's/^ *//' || echo none)"
say last_commit "$(git log -1 --format='%h %s' 2>/dev/null || echo none)"
say last_commit_age "$(git log -1 --format=%cr 2>/dev/null || echo none)"

if [ "$branch" = "$default" ] && [ $((staged + unstaged)) -gt 0 ]; then
  say warn "uncommitted work on $default"
fi

# --- profile: work vs solo -------------------------------------------------
reason=""
for f in CODEOWNERS .github/CODEOWNERS docs/CODEOWNERS; do
  [ -f "$root/$f" ] && reason="CODEOWNERS"
done
committers=$(git log -100 --format=%ae 2>/dev/null | sort -u | count)
[ "${committers:-1}" -gt 1 ] && reason="${reason:+$reason,}multiple-committers"

if command -v gh >/dev/null 2>&1 && [ -n "$default" ]; then
  slug=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
  if [ -n "$slug" ]; then
    say remote "$slug"
    rules=$(gh api "repos/$slug/rules/branches/$default" -q 'length' 2>/dev/null || echo 0)
    [ "${rules:-0}" -gt 0 ] 2>/dev/null && reason="${reason:+$reason,}branch-protection"
  fi
fi

if [ -n "$reason" ]; then
  say profile work
  say profile_reason "$reason"
else
  say profile solo
fi

# --- kind: package vs app --------------------------------------------------
kind=app
if [ -f "$root/package.json" ]; then
  grep -q '"private"[[:space:]]*:[[:space:]]*true' "$root/package.json" || kind=package
elif [ -f "$root/Cargo.toml" ]; then
  grep -q '^\[package\]' "$root/Cargo.toml" && kind=package
  grep -q '^publish[[:space:]]*=[[:space:]]*false' "$root/Cargo.toml" && kind=app
elif [ -f "$root/pyproject.toml" ]; then
  grep -q '^\[project\]' "$root/pyproject.toml" && kind=package
fi
say kind "$kind"
[ -d "$root/packages" ] || [ -d "$root/apps" ] && say monorepo true

# --- open PRs --------------------------------------------------------------
if command -v gh >/dev/null 2>&1; then
  prs=$(gh pr list --state open --limit 10 \
        --json number,title,headRefName,isDraft \
        -q '.[] | "  #\(.number) \(if .isDraft then "[draft] " else "" end)\(.headRefName) — \(.title)"' \
        2>/dev/null || echo "")
  if [ -n "$prs" ]; then
    printf 'open_prs:\n%s\n' "$prs"
  else
    say open_prs none
  fi
fi
