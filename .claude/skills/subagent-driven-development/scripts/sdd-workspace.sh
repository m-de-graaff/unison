#!/usr/bin/env bash
# Resolve (and create) the directory holding one plan's short-lived SDD
# artifacts: task briefs, implementer reports, review packages, and the
# progress ledger. Prints the absolute path.
#
# One directory per plan (<repo-root>/.sdd/<plan-basename>/) so a later plan in
# the same working tree can never read or overwrite this one's artifacts. A
# stale ledger misread as current progress makes a controller skip whole task
# sequences — per-plan scoping removes that failure structurally.
#
# It lives in the working tree rather than under .git/ because agents are denied
# writes to .git/, which would block an implementer writing its report. A
# self-ignoring .gitignore at .sdd/ keeps every workspace out of `git status`
# and out of accidental commits without touching any tracked file.
#
# Single source of truth for the location, so task-brief.sh and
# review-package.sh cannot drift apart.
#
# Usage: sdd-workspace.sh PLAN_FILE
set -euo pipefail

[ $# -eq 1 ] || { echo "usage: sdd-workspace.sh PLAN_FILE" >&2; exit 2; }

plan=$1
[ -f "$plan" ] || { echo "no such plan file: $plan" >&2; exit 2; }

slug=$(basename "$plan" .md)
case "$slug" in
  "" | . | ..) echo "cannot derive a workspace name from: $plan" >&2; exit 2 ;;
esac

root=$(git rev-parse --show-toplevel)
base="$root/.sdd"
dir="$base/$slug"
mkdir -p "$dir"
printf '*\n' > "$base/.gitignore"
cd "$dir" && pwd
