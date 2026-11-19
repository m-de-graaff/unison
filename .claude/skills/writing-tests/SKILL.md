---
name: writing-tests
description: >
  Use when writing a test, adding coverage to code that has none, or deciding what a test should
  assert. Also use when a bug needs a regression test, when a test is slow, brittle, or passes and
  fails intermittently, when one small change breaks twenty tests at once, when mocks outnumber
  assertions, and when a coverage percentage is being treated as a target.
---

# Writing Tests

**Core principle: a test you have never watched fail is not a test.** It is a line of code that
runs. Until you have seen it go red for the right reason, you know it executes — you do not know
it detects anything.

## The red gate

<HARD-GATE>
Every test is seen failing before it is seen passing. New feature: write it first, run it, watch
it fail. Existing code: break the code, run it, watch it fail, restore.
</HARD-GATE>

This is one command, and it is the only thing separating a test from decoration. A test written
against working code and never observed red routinely asserts nothing — a typo'd selector, a
mock that returns the expected value regardless, an assertion inside a callback that never fires.
All three pass. All three are invisible without the red step.

For a bug fix specifically, `verification-before-completion` sets the same bar from the other
side: revert the fix, watch the test fail, restore. Same gate, later moment.

## What to test

Test the **behaviour at the boundary of the unit** — what a caller can observe. Inputs to
outputs, inputs to side effects, inputs to errors.

| Test | Don't test |
|---|---|
| The value returned | Which private helper computed it |
| The row that ended up in the database | That the ORM's `save` was called |
| The error raised, and its type | The log line emitted on the way |
| The rendered text a user reads | The component's internal state variable |

The distinction is not academic. A test coupled to how the code works fails on every refactor
that changes nothing observable, and each of those failures trains the team to edit the test
until it passes — which is the exact motion that removes the test's value.

**Prioritise by what breaks.** Untested code is not uniformly risky:

1. **The thing the bug was in.** A regression test for a bug that shipped is worth more than
   three tests for code that never broke.
2. **Branches.** Every `if`, every early return, every `catch`. The happy path gets exercised by
   everything else; the error path gets exercised by nothing.
3. **Boundaries.** Empty, one, many. Zero, negative, maximum. First and last. Null where null is
   allowed. These are where off-by-one and unguarded-optional live.
4. **Money, permissions, and data loss.** Anything where being wrong is not recoverable by
   re-running it.

## What not to test

- **The framework.** That the router routes, that the ORM persists, that the validation library
  rejects a bad email. Their maintainers test this; you are testing your dependencies' CI.
- **Constants and pure config.** A test asserting `TIMEOUT == 30` fails when someone deliberately
  changes the timeout and tells you nothing.
- **Generated code**, unless you wrote the generator.
- **Getters and setters** with no logic in them.

Deleting a test in these categories is a net gain. It cost time to run and it never detected
anything.

## Shape

One test, one reason to fail. If a test can fail for three unrelated reasons, its name cannot
describe what broke, and the failure output makes you read the body to find out.

```python
def test_expired_token_is_rejected():
    token = make_token(expires_at=now() - timedelta(seconds=1))   # arrange

    result = authenticate(token)                                   # act

    assert result.error == "token_expired"                         # assert
```

**Arrange, act, assert, in that order, with the act as one line.** When the act needs five lines
of setup inline, that setup belongs in arrange. When you cannot find the act, the test is
testing more than one thing.

Multiple assertions are fine when they describe **one** outcome from different angles — the
status code and the body of the same response. They are a smell when they describe a sequence:
assert, mutate, assert, mutate. That is three tests sharing a body, and the second failure is
hidden behind the first.

## Naming

The name is the failure message. `test_login` tells you nothing at 3am; `test_login_rejects_a_user_whose_email_is_unverified` tells you what the code was supposed to do
without opening the file.

Name the condition and the expected behaviour: `test_<subject>_<condition>_<expectation>`. Long
is fine. Nobody calls these functions.

## Fixtures and factories

**Build test data with a factory that takes overrides**, not with a shared fixture that every
test inherits:

```python
def make_user(**overrides):
    return User(**{"email": "a@b.com", "verified": True, "role": "member", **overrides})

def test_unverified_user_cannot_post():
    user = make_user(verified=False)   # the one field that matters is the one field visible
```

A shared fixture hides the precondition the test depends on. Six months later someone adds
`verified=True` to it for their own test and yours silently stops testing anything. With a
factory, each test states its own relevant fields and inherits sane defaults for the rest — and
the field that matters is the field you can see.

**Mock at the process boundary, not inside your own code.** Network, clock, filesystem,
randomness, third-party SDKs. Mocking your own service layer to test your own handler means the
test passes when the two disagree, which is the failure it existed to catch. When the mock setup
is longer than the assertion, the unit under test has too many collaborators — that is a design
finding, not a testing one.

## Brittleness

A test that breaks on a change with no behavioural meaning is a tax with no benefit.

| Brittle | Instead |
|---|---|
| Asserting a full JSON blob | Assert the fields the behaviour is about |
| Matching an exact error string | Match an error type or code |
| Selecting by CSS class or DOM path | Select by role, label, or test id — see `react-testing` |
| Asserting on log output | Assert on the state change the log describes |
| Hardcoding today's date | Inject the clock |
| Depending on dict or row ordering | Sort, or compare as sets |

## Flake

**A test that fails intermittently is a bug report, not a nuisance.** It is telling you about a
race — usually in the code, sometimes in the test — and the code path it covers is unprotected
either way.

Never fix flake by adding a retry, a sleep, or a bigger timeout. Those change how often you see
the failure, not whether it exists. Diagnose it with `systematic-debugging`; wait on conditions
rather than durations, which
[`systematic-debugging/references/condition-based-waiting.md`](../systematic-debugging/references/condition-based-waiting.md)
covers. Shared state between tests is the other common source —
[`find-polluter.sh`](../systematic-debugging/scripts/find-polluter.sh) bisects for it.

If it genuinely cannot be fixed now, **quarantine it explicitly** — skipped, with a ticket, and
out of the required set. A test everyone knows to re-run is a required check that has already
stopped being one.

## Coverage

Coverage is a **diagnostic, not a target**. Read it to find the branch nobody exercised. Do not
raise it to a number.

The moment a percentage becomes a goal, the cheapest way to hit it is tests that execute lines
without asserting anything about them — and those score identically to real ones. 100% coverage
of a function whose only assertion is `assert result is not None` is 0% coverage of its
behaviour.

Uncovered *branches* are the signal worth acting on. Uncovered *files* usually mean either dead
code (see `deleting-code`) or the thing nobody wanted to touch, which is where the bugs are.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The code is simple enough not to need a test" | Then the test is short. Simplicity argues for a small test, never for none |
| "I'll add tests after it works" | After it works, the test can only confirm what the code does — including its bugs |
| "I ran it once manually and it worked" | You verified this commit. A test verifies every future one |
| "Watching it fail is a waste of a run" | It is the only run that proves the test is wired up |
| "It's failing because the test is wrong" | Sometimes true. Establish which before editing the test — `systematic-debugging` |
| "Mocking everything makes it fast" | It also makes it pass when the real pieces disagree |
| "Coverage is at 90%, we're fine" | 90% of lines executed. Say nothing about what was asserted |
| "This test is flaky, just re-run CI" | The race it found is in production too |
| "It's too hard to test" | That is a finding about the design. Untestable and badly-factored are the same observation |

## Red flags — stop

- Writing a test and running it green on the first execution
- Editing a test until it passes without establishing whether the code or the test is wrong
- A test name that does not say what behaviour is expected
- More lines of mock setup than of assertion
- `sleep`, a retry wrapper, or a raised timeout added to stop intermittent failure
- Asserting a whole serialized structure to avoid choosing what matters
- A coverage percentage in a goal, a PR description, or a CI gate

## Non-goals

Doesn't cover React Testing Library, MSW, or component queries (`react-testing`), or FastAPI's
httpx setup (`fastapi-patterns`). Doesn't diagnose a failure (`systematic-debugging`). Doesn't
decide whether a claim is proven (`verification-before-completion`). Doesn't design what to build
(`brainstorming`).
