#!/usr/bin/env sh
# stop-check.sh — Stop hook. Refuses to let a turn end on a large uncommitted diff.
# Nags at most once per HEAD commit, so it cannot loop and cannot nag twice for
# the same checkpoint. Exit 0 = let it stop, exit 2 = block with a reason.
set -u

payload=$(cat 2>/dev/null || echo "")
# The harness sets this when a Stop hook already fired for this turn. Respect it.
case $payload in *'"stop_hook_active":true'*) exit 0 ;; esac

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$root/.claude/git-workflow-off" ] && exit 0

files=$(git status --porcelain --untracked-files=no | wc -l | tr -d '[:space:]')
lines=$(git diff HEAD --numstat 2>/dev/null | awk '{a+=$1; d+=$2} END {print a+d+0}')
[ "${files:-0}" -ge 5 ] || [ "${lines:-0}" -ge 150 ] || exit 0

head=$(git rev-parse HEAD 2>/dev/null || echo none)
key=$(printf '%s' "$root" | cksum | cut -d' ' -f1)
stamp="${TMPDIR:-/tmp}/git-workflow-$key.stamp"
[ -f "$stamp" ] && [ "$(cat "$stamp")" = "$head" ] && exit 0
printf '%s' "$head" > "$stamp"

echo "git-workflow: $files uncommitted files / $lines changed lines on \
$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo 'DETACHED HEAD') \
— past the checkpoint threshold." >&2
echo "Commit it (scan secrets first, split unrelated changes), or say explicitly \
why it should stay uncommitted. If the suite is red, say the checkpoint is deferred." >&2
exit 2
