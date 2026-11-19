---
name: receiving-code-review
description: >
  Use the moment code review feedback arrives — from the user, a reviewer on a PR, a GitHub
  comment thread, or an automated pass like /code-review or /security-review — and before
  implementing any suggestion. Especially when a finding seems wrong, unclear, or would add
  something nobody asked for, or when you notice yourself agreeing before you have checked.
---

# Receiving Code Review

Review feedback is a technical claim to evaluate, not a social event to perform through.

**Core principle: verify, then act. Agreement is not a substitute for checking.**

## The pattern

1. **Read all of it** before touching anything.
2. **Understand** each item — restate it in your own words, or ask.
3. **Verify** it against the codebase. Does the problem actually exist here?
4. **Evaluate** whether the fix is right *for this codebase*.
5. **Respond** — the correction, or reasoned pushback.
6. **Implement** one item at a time, checking each.

## Verify before implementing

For every finding, before you edit anything:

- Does this problem actually exist, or is the reviewer pattern-matching?
- Does the suggested fix break something that currently works?
- Is there a reason the current code is the way it is? Check history if it isn't obvious.
- Is the reviewer missing context — a constraint, a platform target, a prior decision?

**If you cannot verify it, say so** rather than implementing on faith: "I can't confirm this
without reproducing on Linux — worth doing, or take the fix on trust?"

**Automated findings carry their own confidence.** A finding marked `PLAUSIBLE` rather than
`CONFIRMED` has not been verified by the tool that raised it — reproduce it before you act, and
say which you did. A confirmed finding still deserves a look at the failure scenario; tools
report failure modes that the surrounding code already makes unreachable.

## Unclear items block the whole batch

If any item is unclear, stop and ask before implementing **any** of them. Items are often
related, and a partial reading produces a fix that has to be redone.

> "Clear on 1, 2, 3 and 6. Before I start: on 4, do you mean the retry wrapper or the
> caller? And 5 — is that about the timeout value or that it isn't configurable?"

## Where it came from changes the weight

**From the user:** trusted. Understand it, then act. Ask if the scope is unclear. No preamble —
start working.

**From an external reviewer or a tool:** skeptical, but check carefully. Run the four
verification questions above. If it conflicts with a decision the user already made, stop and
raise that rather than quietly reversing them.

**YAGNI check.** When a reviewer asks you to "implement this properly", grep for actual callers
first. Nothing calls it → propose deleting it instead. You and the reviewer both answer to the
user; a feature nobody needs is not improved by being built well.

## Responding

The failure mode is **agreement standing in for verification** — replying as though the work is
done because the feedback was acknowledged. What that looks like: "You're absolutely right!"
before checking, "Great point, let me implement that" before knowing whether the problem exists,
a paragraph of appreciation and no diff.

State the technical content instead:

> "Confirmed — `parseDate` returns `Invalid Date` for empty input and it's never checked.
> Fixed in `date.ts:31`."

> "Checked: build target is 10.15+, that API needs 13+. The legacy path is load-bearing. The
> bundle ID in it *is* wrong though — fix that, or drop pre-13 support?"

Ordinary courtesy is fine; a sentence of thanks in place of a verified answer is not. If a reply
contains no verification and no change, it isn't a reply yet.

**When you were wrong after pushing back:** state it plainly and move on — "Checked, you're
right: it does reach that branch when the cache is cold. Fixing." No apology, no defence of the
original pushback, no post-mortem.

## Pushing back

Push back when the suggestion breaks working behaviour, the reviewer lacks context, it violates
YAGNI, it's wrong for this stack, compatibility requires the current shape, or it contradicts an
architectural decision the user made.

Use technical reasoning and point at the evidence — the test, the build target, the caller. Not
defensiveness.

**Push back once.** If the user hears the objection and repeats the instruction, that's their
decision: say you're proceeding on their call, and do the whole thing. Re-litigating a settled
point is its own failure mode. This applies to the user's own review, not to an automated
finding you have disproved.

## Order of work

Clarify everything unclear first. Then: blocking issues (breakage, security, data loss) →
simple fixes (typos, imports, missing guards) → complex fixes (refactors, logic changes). Verify
each before the next; run the full suite at the end.

Re-reporting through `ReportFindings` after applying fixes → set `outcome` per finding to what
actually happened: `fixed`, `skipped`, or `no_change_needed`. A skipped finding needs a reason.

## GitHub threads

Reply to an inline review comment **in its thread**
(`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), not as a top-level PR comment.
A top-level reply loses the code context the thread exists to hold.

## Common mistakes

| Mistake | Instead |
|---|---|
| Agreeing before checking | Verify, then state what you found |
| Implementing a finding on faith | Confirm the problem exists here |
| Fixing six things, then testing | One at a time, checked each |
| Assuming the reviewer has full context | Check for the constraint they couldn't see |
| Avoiding pushback to stay agreeable | Technical correctness over comfort |
| Implementing the clear items, asking about the rest later | Clarify all of it first — items interact |
| Treating `PLAUSIBLE` as `CONFIRMED` | Reproduce it, then say which you did |
| Arguing a second time after the user decides | Say you're proceeding on their call, and proceed |

## Non-goals

Doesn't decide when to request review (`requesting-code-review`). Doesn't commit the fixes
(`git-workflow`). Doesn't review anyone else's code.

## Source

Adapted from [obra/superpowers](https://github.com/obra/superpowers).
