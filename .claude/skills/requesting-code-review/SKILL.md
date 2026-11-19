---
name: requesting-code-review
description: >
  Use after finishing a task or feature, before opening a PR or merging, before a risky
  refactor, after fixing a subtle bug, or when stuck and a fresh read would help. Also use when
  deciding which review instrument fits — working diff, GitHub PR, security-specific — or when
  asked for a code review, a second opinion, or "check my work".
---

# Requesting Code Review

Review catches issues before they cascade into more work built on top of them.

**Core principle: review is cheap and the only real question is which instrument to reach for.**
The old answer — hand-build a reviewer prompt and dispatch a subagent — is now the *last*
resort, not the first.

## Pick the instrument

| Situation | Use | Notes |
|---|---|---|
| Uncommitted or unpushed work on this branch | **`/code-review`** | The default. Sees your working diff, no setup, no dispatch |
| A GitHub pull request | **`/review <PR#>`** | Fetches and reviews the PR |
| Security specifically | **`/security-review`** | Pending changes on the branch |
| Quality, reuse, and simplification — and you want the fixes applied | **`/simplify`** | Applies changes; it does not hunt for bugs |
| Deep multi-agent review of a branch or PR | `/code-review ultra` | **User-triggered and billed — you cannot launch it.** Suggest it; never attempt it via Bash or otherwise |
| A diff the above cannot see (another worktree, an arbitrary SHA range) | Dispatched reviewer, **only if the user asks** | See [`references/reviewer-prompt.md`](references/reviewer-prompt.md) |
| Two files, obvious change | Read it yourself | A self-review is a real review. Say that's what you did |

Dispatching a subagent reviewer spends the user's tokens, so it needs the same explicit ask as
any other fan-out — see `dispatching-parallel-agents`. `/code-review` needs no such permission
and gets you most of the same value.

## When to request

**Do it:** before opening a PR or merging; after a feature lands; after a fix whose root cause
took real work to find; before a refactor you'd struggle to unwind.

**Worth it:** when you're stuck and want a different read; when you're about to build the next
thing on top of what you just wrote.

**Skip it:** documentation typos, formatting, generated files, and mechanical renames — but say
you skipped it and why, so the omission is visible.

## Scope the request

Whichever instrument you use, three things determine whether the review is any good:

1. **The range.** Be explicit — `origin/main..HEAD`, a SHA pair, or "the working diff". A
   reviewer guessing at scope reviews the wrong thing.
2. **The intent.** What this was supposed to do. Without it, a reviewer can only check the code
   against itself and will never catch "this works, but it isn't what was asked for".
3. **The known trade-offs.** Anything you did deliberately that looks wrong — a global lock, an
   O(n²) scan over a list you know stays small. Otherwise the review spends its budget
   rediscovering decisions you already made.

## Act on what comes back

Fix Critical before anything else, Important before moving on, note Minor. Push back with
technical reasoning when the reviewer is wrong — and verify before you do either.

**How to evaluate and respond is `receiving-code-review`'s job.** Load it when findings arrive;
that's where the discipline lives.

## Rationalizations

| Excuse | Reality |
|---|---|
| "It's simple, it doesn't need review" | Then `/code-review` costs you one command and confirms it. Simplicity is an argument for a *fast* review |
| "I'll dispatch a reviewer subagent" | Not unless asked. `/code-review` is built in, needs no permission, and reads the same diff |
| "I already know what it'll say" | Then you've done the review — say so explicitly, don't skip silently |
| "I'll review after I finish the next part" | The next part is built on this one. That's the cascade review exists to stop |
| "The tests pass" | Tests prove the code does what the tests say. Review is for whether that's the right thing |

## Red flags — stop

- Opening a PR or merging with no review of any kind, not even your own
- Dispatching a reviewer agent without being asked
- Attempting to launch `/code-review ultra` yourself
- Asking for a review without naming the range or the intent
- Treating "no Critical issues" as "no issues"

## Non-goals

Doesn't evaluate or implement the feedback (`receiving-code-review`). Doesn't commit, branch, or
merge (`git-workflow`). Doesn't decide what to build (`brainstorming`).

## Source

Adapted from [obra/superpowers](https://github.com/obra/superpowers).
