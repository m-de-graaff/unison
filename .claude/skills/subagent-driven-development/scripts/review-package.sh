#!/usr/bin/env bash
# Write a review package — commit list, stat summary, and the net diff with
# extended context — to one file a reviewer reads in a single call, so the diff
# never enters the controller's context.
#
# BASE must be the commit recorded before the implementer was dispatched. HEAD~1
# silently drops every commit but the last of a multi-commit task.
#
# Usage: review-package.sh PLAN_FILE BASE HEAD [OUTFILE]
# Default OUTFILE: <workspace>/review-<base7>..<head7>.diff
# (named per range, so each re-review after a fix round gets a fresh file)
set -euo pipefail

if [ $# -lt 3 ] || [ $# -gt 4 ]; then
  echo "usage: review-package.sh PLAN_FILE BASE HEAD [OUTFILE]" >&2
  exit 2
fi

plan=$1
base=$2
head=$3
[ -f "$plan" ] || { echo "no such plan file: $plan" >&2; exit 2; }
git rev-parse --verify --quiet "$base" >/dev/null || { echo "bad BASE: $base" >&2; exit 2; }
git rev-parse --verify --quiet "$head" >/dev/null || { echo "bad HEAD: $head" >&2; exit 2; }

if [ $# -eq 4 ]; then
  out=$4
else
  dir=$("$(cd "$(dirname "$0")" && pwd)/sdd-workspace.sh" "$plan")
  out="$dir/review-$(git rev-parse --short "$base")..$(git rev-parse --short "$head").diff"
fi

{
  echo "# Review package: ${base}..${head}"
  echo
  echo "## Commits"
  git log --oneline "${base}..${head}"
  echo
  echo "## Files changed"
  git diff --stat "${base}..${head}"
  echo
  echo "## Diff"
  git diff -U10 "${base}..${head}"
} > "$out"

commits=$(git rev-list --count "${base}..${head}")
if [ "$commits" -eq 0 ]; then
  echo "warning: ${base}..${head} contains no commits — the reviewer will see an empty diff" >&2
fi
echo "wrote ${out}: ${commits} commit(s), $(wc -c < "$out" | tr -d ' ') bytes"
