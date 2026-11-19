# Reviewer prompt

For dispatching a reviewer subagent — **only when the user has asked for one**, or when the diff
is somewhere `/code-review` cannot see it (another worktree, an arbitrary SHA range). Otherwise
`/code-review` does this without spending a dispatch.

Fill the four bracketed values and send it to a `general-purpose` agent. Everything the reviewer
needs is in the prompt; nothing about how you got there is.

```
Review [DESCRIPTION] against its requirements and flag issues before they cascade.

## What it was supposed to do

[REQUIREMENTS — plan file path, task text, or the actual ask]

## Range

git diff --stat [BASE_SHA]..[HEAD_SHA]
git diff [BASE_SHA]..[HEAD_SHA]

## Known trade-offs

[Deliberate decisions that look wrong — a global lock, an O(n^2) scan over a list
known to stay small. Omit this section if there are none.]

## Constraints

This review is read-only. Do not touch the working tree, index, HEAD, or branch
state. Inspect with git show / diff / log. If you need a working copy of another
revision, use `git worktree add` into a temp directory — never move HEAD here.

## What to check

Does it do what was asked, and are any deviations deliberate improvements or
accidents? Correctness and edge cases. Error handling on the paths that can
actually fail. Tests that verify behaviour rather than mocks. Anything that
breaks compatibility or needs a migration. Security where user input or secrets
are involved.

Judge it against this codebase's existing patterns, not against an ideal.

## Output

### Strengths
Specific, and only what you actually verified.

### Critical — must fix
Bugs, security holes, data loss, broken functionality.

### Important — should fix
Architecture problems, missing requirements, unhandled failure paths, test gaps.

### Minor — optional
Style, polish, small optimisations.

Each issue: file:line, what is wrong, why it matters, and the fix if it is not
obvious.

### Verdict
Ready to merge: yes / no / with fixes — plus one or two sentences of reasoning.

Categorise by real severity; a nitpick marked Critical costs you the reader's
trust for everything else. Do not comment on code you did not read. Do not
report "looks good" in place of a verdict.
```

## Placeholders

| Token | Value |
|---|---|
| `[DESCRIPTION]` | one line on what was built |
| `[REQUIREMENTS]` | what it should do — path, task text, or the ask |
| `[BASE_SHA]` / `[HEAD_SHA]` | the range, resolved to real SHAs before sending |

Resolve the SHAs yourself first (`git rev-parse origin/main`, `git rev-parse HEAD`) — an agent
guessing at the range reviews the wrong commits.

**What comes back is a claim, not a result.** Verify a Critical finding before acting on it and
before repeating it to the user.
