---
name: writing-plans
description: >
  Use when an approved design, spec, or set of requirements exists and the work is multi-step —
  before touching code. Also use when a task is big enough that you would otherwise lose track
  of it partway, when handing work to another session or agent, and when someone asks for a
  plan, a breakdown, or an implementation strategy.
---

# Writing Plans

Write the plan for an engineer who is skilled but knows nothing about this codebase, this
domain, or this toolchain — and who will read your tasks out of order.

**Core principle: the plan is done when someone could execute it without asking you anything.**
Every question it leaves open becomes a guess at execution time.

## Before writing

**Check the scope.** If the spec covers several independently shippable subsystems, split it —
one plan each, each producing working software on its own. A plan spanning three subsystems
cannot be reviewed or executed as a unit.

**Map the files first.** Which get created, which modified, what each is responsible for. This
is where decomposition gets locked in, and it is much cheaper to change here than in task 7.

- One clear responsibility per file, with a stated interface.
- Files that change together belong together. Split by responsibility, not by technical layer.
- Follow the patterns already in the codebase. Don't unilaterally restructure — but if a file
  you're modifying has grown unwieldy, planning the split is reasonable.

## Task sizing

**A task is the smallest unit that carries its own test cycle and is worth a fresh reviewer's
gate.** Fold setup, config, scaffolding, and docs into the task whose deliverable needs them.
Split only where a reviewer could reject one task while approving its neighbour. Every task ends
with something independently testable.

**A step inside a task is one action, two to five minutes:** write the failing test / run it and
watch it fail / implement the minimum / run it and watch it pass / commit.

The "watch it fail" step is not padding — `writing-tests` covers why a test never observed red
routinely asserts nothing, and the plan is where that step gets guaranteed rather than intended.

## The document

Save to `docs/plans/YYYY-MM-DD-<feature>.md` unless the user prefers elsewhere.

````markdown
# [Feature] Implementation Plan

> **To execute:** use the `executing-plans` skill. Steps use `- [ ]` for tracking.

**Goal:** [one sentence]
**Architecture:** [2–3 sentences on the approach]
**Tech stack:** [key libraries and versions]

## Global Constraints

[Project-wide requirements from the spec — version floors, dependency limits,
naming and copy rules, platform targets. One line each, exact values copied
verbatim. Every task's requirements implicitly include this section.]

---

### Task N: [Component]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/test_file.py`

**Interfaces:**
- Consumes: [exact signatures this task uses from earlier tasks]
- Produces: [exact names, parameter and return types later tasks rely on]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    assert function(input) == expected
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pytest tests/path/test_file.py::test_specific_behavior -v`
Expect: FAIL, "function not defined"

- [ ] **Step 3: Minimal implementation**

```python
def function(value):
    ...
```

- [ ] **Step 4: Run it, confirm it passes**

- [ ] **Step 5: Commit**
````

**The Interfaces block is not optional on any task after the first.** A task's implementer sees
only their own task — that block is the only way they learn what the neighbouring tasks named
things.

## No placeholders

These are plan failures, not shortcuts. Never write them:

- "TBD", "TODO", "implement later", "fill in the details"
- "Add appropriate error handling" / "handle edge cases" / "add validation"
- "Write tests for the above", with no test code
- "Similar to Task N" — repeat it; the reader may not have read Task N
- A step that says what to do without showing how
- A reference to a type, function, or method no task defines

If you cannot write the actual content, you do not yet know enough to plan that task. Go find
out, or mark it as an open question for the user — explicitly, not as a placeholder.

## Self-review

Run this yourself, on the finished plan, against the spec. Not a subagent dispatch.

1. **Spec coverage** — walk each requirement in the spec. Point to the task implementing it.
   A requirement with no task is a missing task; add it.
2. **Placeholder scan** — search for every pattern above.
3. **Name consistency** — do the types, signatures, and property names in later tasks match
   what earlier tasks defined? `clearLayers()` in Task 3 and `clearFullLayers()` in Task 7 is a
   bug you are shipping into execution.
4. **Order** — can each task actually be done when it appears, given only what precedes it?

Fix inline and move on. No second pass.

## Handoff

The plan is a hypothesis about work not yet done. Say so when handing it over: the executor's
job includes noticing where it was wrong, and `executing-plans` covers what to do then.

Default handoff is **`executing-plans`** — execute it yourself, sequentially. Offer
`subagent-driven-development` as an alternative if the tasks are genuinely independent and the
plan is large enough to be worth it, with the cost named; it only runs if the user says yes.

## Red flags — stop

- Writing a plan before the design is approved (that's `brainstorming`)
- A step with no command and no code
- A task that cannot be tested on its own
- Interfaces blocks omitted because "it's obvious from the spec"
- Planning a change small enough to just make

## Non-goals

Doesn't decide what to build (`brainstorming`). Doesn't execute (`executing-plans`,
`subagent-driven-development`). Doesn't commit (`git-workflow`).

## Source

Adapted from [obra/superpowers](https://github.com/obra/superpowers).
