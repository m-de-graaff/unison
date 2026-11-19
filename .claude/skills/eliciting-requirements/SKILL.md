---
name: eliciting-requirements
description: >
  Use when a request is too vague to design against — "build me a dashboard", "we need
  notifications", "make it better" — or when nobody can state what success would look like. Also
  use when the request names a solution and the problem behind it is unstated, when different
  people want different things from the same feature, when scope keeps growing mid-conversation,
  and when you are about to assume a requirement nobody said.
---

# Eliciting Requirements

Getting from a request to a problem statement precise enough to design against.

**Core principle: one question at a time, and stop when a new answer would not change the
design.** Both halves matter. Questions asked in a batch cannot use each other's answers, and
questions asked past the stopping point are interrogation billed as diligence.

This runs *before* `brainstorming`. Brainstorming turns a known problem into an agreed design;
this turns a vague request into a known problem. When the problem is already clear — most
requests — skip straight to `brainstorming`.

## The gate

<HARD-GATE>
No design, no approaches, no implementation while you cannot state the problem in one sentence
and the success criterion in another. Not the solution — the problem.
</HARD-GATE>

## One question at a time

`brainstorming` batches independent questions, up to four, because at that stage the answers are
independent. Here they are not. The second question is chosen by the first answer, and asking
both at once means asking the wrong second question.

- **Ask one. Wait. Let it change what you ask next.** If you can write question two before hearing
  answer one, they are independent and belong in `brainstorming`'s batch instead.
- **Read the repo between questions.** A question the codebase answers costs credibility and a
  round trip.
- **Use AskUserQuestion when the answer is a choice** among discrete options. Prose when it is
  open.
- **Never ask two questions in one message** by joining them with "and" or "also". That is a batch
  wearing a single question mark.

## The ladder

Climb until you can state the problem. Most requests need three or four rungs, not all seven.

1. **The problem.** "What goes wrong today?" Not what they want built — what breaks, who notices,
   how often.
2. **The person.** Who hits this, and how many of them. "The user" is not an answer; an admin
   doing it twice a month and a customer doing it hourly want different things.
3. **The current workaround.** There is almost always one — a spreadsheet, a manual step, a
   Slack message. It tells you the real requirement more reliably than any answer to "what do you
   want", because someone already paid to solve it once.
4. **Success.** "How will you know this worked?" If the answer is "it'll be better", push once:
   what would you see, count, or stop doing?
5. **Constraints.** Deadline, existing system, compliance, a decision already made elsewhere. Ask
   for the ones that would invalidate an otherwise good design.
6. **Non-goals.** "What is explicitly not part of this?" The single most under-asked question. It
   is also the cheapest scope control available, because it is agreed before anything is built.
7. **Volume and edge.** Scale, concurrency, the awkward case. Only when the answer changes the
   design.

## A solution-shaped request

Most requests arrive as solutions. "Add a CSV export" is an answer to a question nobody said out
loud.

**Read it back to the problem, once, and check:**

> "So the goal is getting this data into a spreadsheet for the monthly report — is a download the
> right shape, or would a scheduled email be better?"

If the reading-back is right, you now have a problem statement and possibly a better solution. If
it is wrong, you have learned that in one exchange rather than after building the wrong thing.

**Do this once, not repeatedly.** A second attempt to reframe a request the user has already
confirmed reads as obstruction. They may also simply have decided — a stated preference is a
constraint, and it goes in the constraints list rather than back into the questioning.

## Confidence check

Before leaving, state the following back and get a yes:

```
Problem:     [one sentence — what goes wrong today]
For:         [who, and roughly how many]
Success:     [the observable change]
Constraints: [the ones that rule designs out]
Non-goals:   [what this explicitly does not cover]
Open:        [anything unresolved, and what you are assuming instead]
```

The **Open** line is what makes this honest. Some questions cannot be answered now, and naming
the assumption you are proceeding on is a complete answer — silently assuming it is not.

Then hand off to `brainstorming`. Do not design here.

## Stopping

**Stop when you cannot say what a new answer would change.** That is the test, and it is
observable — if the next question's answer does not move a decision, it is curiosity.

Also stop when:

- The user answers "I don't know" twice. They do not have the information; note it as Open and
  proceed on a stated assumption.
- The answers start repeating in different words.
- Three or more shippable pieces have appeared. That is a decomposition problem, not a
  requirements problem — `brainstorming`'s Decompose tier handles it, and refining a project that
  needs splitting first wastes every question.

## Rationalizations

| Excuse | Reality |
|---|---|
| "They were clear about what they want" | They were clear about what they want *built*. The problem is still unstated |
| "I'll batch these to save round trips" | Question two is chosen by answer one. Batching picks the wrong question two |
| "I can infer the problem from the request" | You can infer *a* problem. It is not checkable until you say it out loud |
| "Asking looks like I don't understand" | Building the wrong thing looks considerably worse, and later |
| "It's a small feature" | Then the ladder is two rungs. Small argues for fewer questions, not none |
| "I'll clarify as I build" | Clarifying as you build is discovering the requirement after the cost of the wrong one |
| "They said just do it" | They are declining ceremony. One question is not ceremony |
| "I have enough for a first version" | Then say what you are assuming. That is the Open line, and it takes one sentence |

## Red flags — stop

- A message containing two question marks
- Proposing an approach before the problem statement exists
- A sixth question with no decision hanging on it
- Reframing a request the user has already confirmed
- Writing code, files, or a design while any ladder rung is blank
- Non-goals never asked

## Non-goals

Doesn't produce a design or approaches (`brainstorming`). Doesn't write a plan (`writing-plans`)
or a ticket (`jira-workflow`). Doesn't research the market or score competitors
(`competitive-benchmarking`).

## Source

The one-question-at-a-time interview and the confidence checkpoint are adapted from
`interview-me` in [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills).
