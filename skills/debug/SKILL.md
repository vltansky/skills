---
name: debug
description: "Systematic root-cause debugging for any bug — backend, frontend, logic, integration. Hypothesis-driven investigation with evidence collection. Use when the user says 'debug', 'investigate', 'why is this broken', 'root cause', 'trace this bug', 'figure out why', 'this doesn't work', 'unexpected behavior', or when autopilot's guardrails fail repeatedly. For frontend-specific runtime debugging with a log server, use /debug-mode instead."
---

# Debug

Find the root cause. Don't guess, don't patch symptoms.

```
Reproduce → Hypothesize → Investigate → Isolate → Fix → Verify → Prevent
```

## When to Use

- Test failures you can't explain by reading the code
- Guardrail failures during autopilot that resist 2+ fix attempts
- "It works locally but fails in CI"
- Unexpected behavior with no obvious cause
- Integration bugs between systems

For frontend/UI runtime debugging with browser log collection, use `/debug-mode`.
This skill handles everything else.

## Phase 1: Reproduce

Before investigating, confirm the bug is real and reproducible.

1. **Get the exact error.** Read the full error output — stack trace, exit code,
   failing assertion, log output. Not a summary. The actual output.

2. **Reproduce it.**
   ```bash
   # Run the exact command that fails
   ```
   If it passes now, it's intermittent. Note that — intermittent bugs need different
   strategies (timing, state, concurrency).

3. **Minimize the reproduction.** Can you trigger it with a smaller input? A single
   test? A simpler scenario? The smaller the repro, the faster the investigation.

## Phase 2: Hypothesize

Generate 3-5 specific hypotheses. Each must be testable.

```
H1: The function receives null because the caller doesn't check the return value
    Test: add assertion at function entry, run the failing case

H2: The config file is missing in CI but present locally
    Test: check if the file exists in the CI environment / test context

H3: Race condition — async operation completes before the setup finishes
    Test: add deterministic ordering or log timestamps at both points
```

**Order hypotheses by likelihood.** Start with the most probable.

**Common root cause categories:**
- **State**: wrong value, missing value, stale value, mutation
- **Timing**: race condition, async ordering, timeout
- **Environment**: missing file, wrong path, different config
- **Types**: wrong type at boundary, implicit coercion, null/undefined
- **Logic**: off-by-one, wrong condition, missing branch
- **Integration**: API contract mismatch, schema drift, version skew

## Phase 3: Investigate

For each hypothesis (most likely first):

### 3a. Gather evidence

Use the right tool for the bug type:

**Code path tracing:**
```bash
# Find where the value comes from
# Search for the function, trace callers, check the data flow
```

**Test isolation:**
```bash
# Run just the failing test with verbose output
# e.g.: npx jest --verbose path/to/test
# e.g.: pytest -xvs path/to/test
```

**State inspection:**
- Read the code around the failure point
- Trace the data flow backward: where does the bad value originate?
- Check for mutations between origin and failure

**Diff analysis (for "it used to work"):**
```bash
# What changed recently?
git log --oneline -20 -- <affected-files>
git diff <last-known-good>..HEAD -- <affected-files>
```

**Environment comparison:**
```bash
# Compare local vs CI / vs other environment
node --version
cat .env  # (don't log secrets)
ls -la <expected-file>
```

### 3b. Classify the hypothesis

- **CONFIRMED** — evidence proves this is the cause
- **REJECTED** — evidence rules this out. Note what you learned.
- **INCONCLUSIVE** — need more evidence. Add specific next steps.

### 3c. Iterate

If all hypotheses are rejected or inconclusive:
1. What did you learn from the investigation?
2. Generate new hypotheses informed by what you now know.
3. Widen the search — look at adjacent systems, recent changes, dependencies.

Max 3 investigation rounds. If still stuck after 3 rounds, summarize what you know
and what you've ruled out, and ask the user for additional context.

## Phase 4: Isolate

You've confirmed a hypothesis. Now isolate the root cause precisely:

1. **Find the exact line/condition** where behavior diverges from expectation.
2. **Verify it's the root cause, not a symptom.** Ask: "If I fix this, does the
   original bug go away? Or does it just move the failure somewhere else?"
3. **Check for siblings.** Is this the same bug in multiple places? Search for the
   same pattern elsewhere.

## Phase 5: Fix

Apply the fix using TDD discipline when possible:

1. Write a test that reproduces the bug (if one doesn't exist from Phase 1).
2. Verify the test fails.
3. Apply the minimal fix.
4. Verify the test passes.
5. Run the full test suite — no regressions.

If TDD isn't practical (environment bug, config issue, infra problem):
1. Apply the fix.
2. Reproduce the original scenario — verify it now works.
3. Run the full test suite.

## Phase 6: Verify

Prove the fix works:

```bash
# The specific failing command now passes
# The full test suite passes
# Build passes (if applicable)
```

If the bug was intermittent: run the reproduction multiple times.

## Phase 7: Prevent

After fixing, spend 60 seconds on prevention:

1. **Should there be a test?** If the bug wasn't caught by existing tests, add one
   (already done if you used TDD in Phase 5).
2. **Is this a pattern?** Could the same mistake happen elsewhere? Search for it.
   If found, fix the siblings now — don't file tickets.
3. **Was the root cause a missing guard?** Add validation at the boundary where
   bad data entered the system.

Do NOT:
- Add defensive checks everywhere "just in case"
- Refactor the entire module because one function had a bug
- Add logging that will never be read

## Reporting

After the investigation, summarize:

```
## Debug Report

### Bug
[One-line description]

### Root Cause
[What was actually wrong and why]

### Evidence
[The specific evidence that confirmed the root cause]

### Fix
[What was changed — files and lines]

### Prevention
[Test added? Pattern searched? Guard added?]

### Ruled Out
[Hypotheses that were rejected and why — saves time if the bug recurs]
```

## Rules

- **Never fix without understanding.** A fix you can't explain is a timebomb.
- **Never patch symptoms.** If a value is null, don't add a null check — find out
  why it's null and fix the source.
- **Evidence over intuition.** "I think it's X" is a hypothesis, not a conclusion.
  Confirm with actual output.
- **Minimize the blast radius.** Fix the bug. Don't refactor the neighborhood.
- **Time-box investigation.** 3 rounds of hypothesize-investigate. If still stuck,
  escalate to the user with everything you've learned.
