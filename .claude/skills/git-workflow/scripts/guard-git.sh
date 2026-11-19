#!/usr/bin/env sh
# guard-git.sh — PreToolUse(Bash) hook. Blocks destructive git/gh commands.
# Reads the hook JSON payload on stdin. Exit 0 = allow, exit 2 = block
# (stderr is shown to the model, which then has to ask the human).
set -u

payload=$(cat)

# ponytail: grepping the raw payload instead of parsing JSON — no jq/python
# dependency, and the matcher is already scoped to Bash so the payload is a
# shell command. Worst case it blocks a command that merely mentions the
# pattern, which fails safe. Swap in `jq -r .tool_input.command` if that bites.
cmd=$payload

root=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
[ -n "$root" ] && [ -f "$root/.claude/git-workflow-off" ] && exit 0

block() {
  echo "BLOCKED by git-workflow: $1" >&2
  echo "Ask the human to confirm in this turn, or use the safe alternative: $2" >&2
  exit 2
}

case $cmd in
  *git*push*)
    case $cmd in
      *--force-with-lease*) : ;;
      *--force*|*' -f '*|*' -f"'*)
        block "force-push without --force-with-lease" \
              "git push --force-with-lease" ;;
    esac
    case $cmd in
      *--force*main*|*--force*master*|*main*--force*|*master*--force*|*--mirror*)
        block "force-push targeting the default branch" \
              "push to a feature branch and open a PR" ;;
    esac
    case $cmd in
      *--delete*refs/tags*|*push*--delete*' v'*)
        block "deleting a published tag" "cut a new patch release instead" ;;
    esac
    ;;
esac

case $cmd in
  *'git reset --hard'*|*'git reset --keep'*)
    block "reset --hard discards uncommitted work irrecoverably" \
          "git stash push -m wip  (recoverable)" ;;
  *'git clean -'*d*f*|*'git clean -'*f*d*)
    block "clean -fd deletes untracked files with no undo" \
          "git clean -nd first, then confirm the exact paths" ;;
  *'git checkout --'*|*'git restore'*--worktree*|*'git restore .'*|*'git checkout .'*)
    block "this discards uncommitted changes in the working tree" \
          "git stash push -m wip" ;;
  *'filter-branch'*|*'filter-repo'*|*'git rebase'*--root*)
    block "rewriting history across the whole repo" \
          "a normal revert commit" ;;
  *--no-verify*|*' -n '*commit*)
    block "--no-verify skips the hooks that exist to catch this exact commit" \
          "fix the failing hook, or stop and report why it fails" ;;
  *'gh pr merge'*--admin*)
    block "--admin bypasses required checks" \
          "wait for checks, or fix them" ;;
  *'git stash drop'*|*'git stash clear'*)
    block "dropping stashed work is unrecoverable" \
          "git stash list, inspect, then drop one entry by name" ;;
  *'git update-ref -d'*|*'git reflog expire'*)
    block "destroying refs removes the last recovery path" "leave the reflog alone" ;;
esac

exit 0
