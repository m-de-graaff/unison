#!/usr/bin/env sh
# scan-secrets.sh — scan STAGED content for credentials. Read-only, idempotent.
# Exit 0 = clean. Exit 2 = findings printed to stderr; do not commit.
# Delegates to gitleaks when installed; otherwise uses the built-in rules below.
set -u

root=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "not a git repo" >&2; exit 0; }
[ -f "$root/.claude/git-workflow-off" ] && exit 0

git diff --cached --quiet && { echo "nothing staged"; exit 0; }

status=0

# --- 1. env files ----------------------------------------------------------
# .env.example / .env.sample / .env.template (and .env.<anything>.example) are fine.
envs=$(git diff --cached --name-only --diff-filter=ACM \
       | grep -E '(^|/)\.env' \
       | grep -Ev '\.(example|sample|template|dist)$' || true)
if [ -n "$envs" ]; then
  echo "BLOCKED — environment files staged:" >&2
  echo "$envs" | sed 's/^/  /' >&2
  echo "  Unstage them and add the pattern to .gitignore." >&2
  status=2
fi

# --- 2. gitleaks, if available --------------------------------------------
if command -v gitleaks >/dev/null 2>&1; then
  if ! gitleaks protect --staged --redact --no-banner 2>&1; then
    echo "BLOCKED — gitleaks found staged secrets (above)." >&2
    status=2
  fi
  exit $status
fi

# --- 3. built-in rules ----------------------------------------------------
# ponytail: regex + a length/charset proxy for entropy, not a real entropy
# calculation. Install gitleaks if you want the real thing — this branch is
# then skipped entirely.
findings=$(git diff --cached -U0 --diff-filter=ACM -- \
    ':(exclude)*lock.json' ':(exclude)*.lock' ':(exclude)*lock.yaml' \
    ':(exclude)*.min.js' ':(exclude)*.map' ':(exclude)*.snap' \
  | awk '
    /^\+\+\+ b\// { file = substr($0, 7); next }
    /^@@ / { split($0, h, "+"); split(h[2], n, /[, ]/); line = n[1] - 1; next }
    /^\+/ {
      line++
      s = substr($0, 2)

      # obvious placeholders — skip before anything else
      if (s ~ /(xxxx|XXXX|changeme|CHANGEME|your[-_]?(key|token|secret)|placeholder|dummy|example|redacted|\$\{|process\.env|os\.environ|getenv|<[A-Za-z_]+>)/) next

      hit = ""
      if (s ~ /AKIA[0-9A-Z]{16}/)                                    hit = "aws-access-key-id"
      else if (s ~ /(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}/)          hit = "github-token"
      else if (s ~ /github_pat_[A-Za-z0-9_]{60,}/)                   hit = "github-fine-grained-pat"
      else if (s ~ /xox[baprs]-[A-Za-z0-9-]{10,}/)                   hit = "slack-token"
      else if (s ~ /(sk|rk)_live_[A-Za-z0-9]{20,}/)                  hit = "stripe-live-key"
      else if (s ~ /sk-ant-[A-Za-z0-9_-]{20,}/)                      hit = "anthropic-api-key"
      else if (s ~ /sk-[A-Za-z0-9]{32,}/)                            hit = "openai-api-key"
      else if (s ~ /AIza[0-9A-Za-z_-]{35}/)                          hit = "google-api-key"
      else if (s ~ /-----BEGIN[ A-Z]*PRIVATE KEY-----/)              hit = "private-key-block"
      else if (s ~ /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./) hit = "jwt"
      else if (s ~ /(npm_[A-Za-z0-9]{36})/)                          hit = "npm-token"
      else if (s ~ /(glpat-[A-Za-z0-9_-]{20,})/)                     hit = "gitlab-pat"
      # generic: secret-shaped name assigned a long literal
      else if (tolower(s) ~ /(password|passwd|secret|token|api[-_]?key|access[-_]?key|private[-_]?key|credential)[a-z0-9_]*[[:space:]]*[:=][[:space:]]*.?[A-Za-z0-9+\/_=-]{16,}/) hit = "credential-assignment"

      if (hit != "") {
        gsub(/^[[:space:]]+/, "", s)
        printf "  %s:%d  [%s]  %.10s…\n", file, line, hit, s
      }
    }
  ')

if [ -n "$findings" ]; then
  echo "BLOCKED — possible secrets in staged content:" >&2
  echo "$findings" >&2
  echo "  Unstage, remove the value, load it from the environment instead." >&2
  echo "  False positive? Say so explicitly and commit that file on purpose." >&2
  status=2
fi

[ $status -eq 0 ] && echo "staged content clean"
exit $status
