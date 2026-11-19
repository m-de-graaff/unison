---
name: executing-plans
description: >
  Use when a written implementation plan, spec, or task list exists and the work is to carry it
  out — a plan file from writing-plans, a design doc with numbered steps, a checklist handed
  over from a previous session. Also use when partway through a plan and a step turns out to be
  blocked, wrong, or based on something that has since changed.
---

# Executing Plans

Load the plan, read it critically, execute it, verify as you go, report honestly.

**Core principle: the plan is a hypothesis about work that hadn't been done yet.** Following it
exactly is the default; noticing where it was wrong is the job.

## Before starting

1. **Read the whole plan first.** Not step one — all of it. Steps interact, and the cost of
   discovering that at step seven is the six steps you already built.
2. **Read it critically.** Missing prerequisites, steps that contradict each other, assumptions
   about the codebase that no longer hold, verification that wouldn't actually catch a failure.
3. **Raise concerns now**, in one message, before any code. After this point you're committed to
   the approach and objections cost more.
4. **Get on a branch.** `git-workflow` owns that decision — plan work is never a direct commit
   to the default branch. A separate worktree only if you need the current one to stay usable.
5. **Create a task per plan item**, so progress is visible without reading the diff.

## Executing

For each task: mark in progress → follow the step as written → run the verification the plan
specifies → mark complete.

**A task is not complete until its verification has actually run and passed.** Not "should
pass", not "passes as far as I can tell". If the plan doesn't specify a verification for a step
that changes behaviour, that's a gap — add one, and say you did.

Follow the steps as written. A plan whose steps you improvise past isn't being executed, and the
person who wrote it can no longer predict what they'll get.

## Review checkpoints

The plan is the requirements document a reviewer needs. Request review — `requesting-code-review`
picks the instrument — at these points:

- **After a task that changes a public interface**, before anything is built on top of it
- **After the last task**, before finishing the branch
- **Whenever you deviated** from the plan, so the deviation gets a second read while it's still
  cheap to undo

Not after every task. A checkpoint on a three-line step costs more attention than it returns.

## When a step is blocked vs. when the plan is wrong

These need different responses, and conflating them is the most common way plan execution goes
bad.

| | Blocked | Plan defect |
|---|---|---|
| Looks like | Missing dependency, failing setup, an instruction you don't understand, a verification that fails repeatedly | The step is clear and executable, but doing it would now be wrong given what earlier steps revealed |
| Do | **Stop.** Report what blocked you and what you tried. Don't guess your way past it | **Say so, propose the amendment, and keep going on the parts it doesn't touch** |
| Don't | Force through with a workaround the plan didn't sanction | Silently implement your better idea |

Either way it goes in the report. A plan followed exactly except for one silent substitution is
worse than one that was openly amended.

If the plan is reworked in response, go back and re-read it from the top — the change may have
invalidated steps you'd already reasoned about.

## Finishing

When every task is complete and verified: run the full suite, then hand off to `git-workflow` to
land the work — PR or direct commit per its rules, with a body built from the commit range.

Report what actually happened: what was completed, what deviated and why, what was left out.
If a verification was skipped, say which and why. A completion claim with an unrun check behind
it is the failure this skill exists to prevent.

## About subagents

Plans full of independent tasks are tempting to fan out, and `subagent-driven-development`
does exactly that. **It requires the user to ask.** Executing the plan yourself,
sequentially, is the default — see `dispatching-parallel-agents` for when an offer is
appropriate and what it costs.

## Red flags — stop

- Starting step one without having read step ten
- Marking a task complete on a verification you didn't run
- Implementing your own better idea without saying so
- Working around a blocker the plan didn't anticipate
- "The plan says to test this but it's obviously fine"
- Executing on the default branch

## Non-goals

Doesn't write the plan (`writing-plans`) or the design behind it (`brainstorming`). Doesn't
commit, branch, or merge (`git-workflow`). Doesn't review its own output
(`requesting-code-review`).

## Source

Adapted from [obra/superpowers](https://github.com/obra/superpowers).
