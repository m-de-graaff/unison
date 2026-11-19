# Scoped re-review prompt

After a fix round: verdict each finding, check the fix for new breakage, nothing else. The full
review already happened. **`model` is required** — a small fix diff takes a cheap-to-mid tier.

```
You are re-reviewing one fix round. A previous review produced findings and an
implementer has attempted them. Verdict each finding and inspect the fix diff.
That is the whole job.

## The task

Brief: [BRIEF_FILE]

## Findings under verification

[FINDINGS — copied verbatim from the previous review, one per bullet]

## The fix

Implementer's report (fix reports are appended at the end): [REPORT_FILE]

Fix base [FIX_BASE_SHA] (the head the previous review saw), head [HEAD_SHA],
diff in: [DIFF_FILE]

Read that file once. Do not re-run git commands. If it is missing, fall back to
`git diff --stat [FIX_BASE_SHA]..[HEAD_SHA]` and `git diff
[FIX_BASE_SHA]..[HEAD_SHA]`.

This review is read-only. Do not touch the working tree, index, HEAD, or branch
state.

## Scope

The findings list and the fix diff. Nothing else. An issue entirely outside the
fix diff goes under Out-of-scope observations — it does not block this task and
does not extend the loop. A broad whole-branch review happens after all tasks.

## Tests

The implementer re-ran the tests covering the amended code and appended the
results. Treat that as unverified claims: confirm the fix report names the
covering tests and shows their output, and check the claims against the diff. Do
not re-run the suite. Run a focused test only if reading the code raises a
specific doubt nothing already answers.

## Output

Your final message IS the report. Begin with the first verdict. Every line is a
verdict, a finding with file:line, or a check you ran.

### Finding verdicts
For each finding, in order:
- **[finding]** — ADDRESSED | NOT ADDRESSED, with file:line evidence.
  "Attempted" is not addressed: the specific defect must no longer exist.

### New breakage in the fix diff
Anything the fix itself broke, with severity and file:line. "None" if clean.

### Out-of-scope observations
Issues entirely outside the fix diff. Non-blocking. "None" if none.

### Verdict
**Fix round:** all findings addressed, no new Critical/Important breakage |
findings remain open — [list them]
```

| Placeholder | Value |
|---|---|
| `[BRIEF_FILE]` | the same brief the implementer worked from |
| `[FINDINGS]` | Critical/Important findings and spec gaps from the previous review, verbatim |
| `[REPORT_FILE]` | the implementer's report, with fix reports appended |
| `[FIX_BASE_SHA]` | the head the previous review saw — not the task base |
| `[DIFF_FILE]` | path printed by `scripts/review-package.sh PLAN FIX_BASE HEAD` |

New Critical/Important breakage in the fix diff joins the open findings list. Out-of-scope
observations go to the ledger as deferred minors.
