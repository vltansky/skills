---
name: autopilot
description: "Autonomous plan-to-code pipeline. Stress-tests the plan (using grill-me), fixes issues found, creates a branch, executes step by step with guardrails, runs code review and QA, then hands back a shippable branch. Zero human interaction until the final handoff. Use when the user says 'autopilot', 'just build it', 'auto execute', 'implement this plan', 'take it from here', or wants to go from plan to working code without babysitting."
---

# Autopilot

Plan in, shippable branch out. No hand-holding in between.

Autopilot takes a reviewed or draft plan and runs seven phases autonomously:
1. **Roast** — load and follow the grill-me skill to stress-test the plan
2. **Fix** — apply grill-me findings directly to the plan
3. **Execute** — create branch, add debug instrumentation, implement with TDD + parallel subagents
4. **Review** — self-review the diff (code reuse, quality, efficiency)
5. **QA** — browser-based testing if it's a web app (debug logs provide runtime evidence)
6. **Cleanup** — remove debug instrumentation, verify everything still passes
7. **Handoff** — present results, suggest `/ship-it`

Every intermediate decision is auto-resolved. The user sees the finished result.

## Decision Principles

These auto-answer every question that would normally go to the user:

1. **Completeness** — ship the whole thing. Pick the approach that covers more edge cases.
2. **Pragmatic** — if two options fix the same thing, pick the simpler one. 5 seconds choosing, not 5 minutes.
3. **DRY** — duplicates existing functionality? Reject. Reuse what exists.
4. **Explicit over clever** — 10-line obvious fix > 200-line abstraction.
5. **Bias toward action** — move forward. Flag concerns in the decision log but don't block.
6. **Match the codebase** — follow existing patterns, naming, and structure. Don't introduce new conventions.

## Circuit Breaker

Autopilot runs fully autonomous with one exception:

If the roast phase produces a **NOT_READY** verdict (score below 60) with unresolved
high-severity issues, stop and present the findings to the user. The plan needs
human judgment before execution — autopilot is not the right tool for a fundamentally
broken plan.

For READY or READY_WITH_RISKS verdicts: continue autonomously.

---

## Phase 0: Setup

### Step 1: Read context

- Read CLAUDE.md for project-specific commands (test, build, lint).
- Read the plan file the user pointed to (or the most recent plan in conversation).
- Run `git status` and `git diff` to understand the current state.
- Note the project's test command, build command, and lint command from CLAUDE.md.
  If not found, search for them in package.json, Makefile, or equivalent.
  If still not found, note "unknown" — do not guess.

### Step 2: Create branch

If not already on a feature branch, create one:

```bash
# Detect git user prefix from git config or CLAUDE.md conventions
GIT_USER=$(git config user.name 2>/dev/null | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
```

Derive a branch name from the plan topic: `{user-prefix}/{plan-topic}`.
Use the branch prefix convention from CLAUDE.md if one exists.

```bash
git checkout -b <branch-name>
```

If already on a feature branch (not main/master/develop), stay on it.

### Step 3: Extract plan steps

Break the plan into discrete implementation steps. Each step should be:
- A single logical change (one file or a few tightly coupled files)
- Independently committable
- Ordered by dependency (foundations first, features on top)

List the steps and move on. Do not ask for confirmation.

---

## Phase 1: Roast the Plan

Load the grill-me skill from disk:

```bash
GRILL_PATH=""
for p in ~/.claude/skills/grill-me/SKILL.md ~/.claude/skills/*/grill-me/SKILL.md; do
  [ -f "$p" ] && GRILL_PATH="$p" && break
done
echo "GRILL_PATH=${GRILL_PATH:-not_found}"
```

If found: read the file and follow its full methodology. If not found: run a
lightweight adversarial review yourself (premise challenge, assumptions,
feasibility, edge cases — same dimensions, less ceremony).

### Auto-decision overrides for grill-me

Grill-me is interactive by design. In autopilot mode, every interactive point
is auto-resolved:

- **Step 0.5 (Idea Sharpening)**: Skip — autopilot assumes the plan is already shaped.
- **Step 1 (Initial Assessment)**: Run the assessment. Do not wait for user acknowledgment.
- **Step 2 (Premise Challenge)**: Run it. Auto-decide: accept premises that are
  supported by evidence in the codebase or plan. Challenge premises that contradict
  what you found in pre-scan. For each challenged premise, apply decision principle
  #1 (completeness) — pick the interpretation that covers more ground.
- **Step 3 (Dimension Grilling)**: For each question grill-me would ask the user:
  - Apply the 6 decision principles to pick an answer.
  - Log the question, your answer, and which principle drove it.
  - Do not wait for user input. Do not present options.
- **Step 4 (Outside Voice)**: Skip — the roast findings are sufficient for autopilot.
  Subagent overhead is not worth it when the fix phase follows immediately.
- **Step 5 (Report)**: Produce the report. Do not persist to disk — the findings
  feed directly into Phase 2.

### Circuit breaker check

After the roast completes, check the verdict:

- **NOT_READY** (score < 60, unresolved high-severity): Stop. Present findings to
  the user. Explain what needs human judgment. Do not proceed to Phase 2.
- **READY** or **READY_WITH_RISKS**: Continue autonomously.

---

## Phase 2: Fix the Plan

Take every finding from Phase 1 and apply it to the plan:

1. **High severity** — must be addressed. Modify the plan to resolve each one.
2. **Medium severity** — address if the fix is clear and under ~5 lines of plan change.
   Otherwise note it as a known risk and continue.
3. **Low severity** — note in the decision log, do not modify the plan.
4. **Unresolved items** — apply decision principles to pick a resolution. Log it.

After fixing, re-extract plan steps if the structure changed (new steps, removed
steps, reordered dependencies).

Write the updated plan back to the plan file (or note the changes in the decision
log if there is no plan file on disk).

Emit a short transition summary:
> **Phase 1-2 complete.** Roast score: [N]/100. Fixed [X] high, [Y] medium issues.
> [Z] items noted as known risks. Proceeding to execution with [N] steps.

---

## Phase 3: Execute

Implement the fixed plan. Use parallel subagents when possible.

### Step 0: Load TDD and Debug skills

```bash
TDD_PATH=""
for p in ~/.claude/skills/tdd/SKILL.md ~/.claude/skills/*/tdd/SKILL.md; do
  [ -f "$p" ] && TDD_PATH="$p" && break
done

DEBUG_PATH=""
for p in ~/.claude/skills/debug/SKILL.md ~/.claude/skills/*/debug/SKILL.md; do
  [ -f "$p" ] && DEBUG_PATH="$p" && break
done

echo "TDD_PATH=${TDD_PATH:-not_found}"
echo "DEBUG_PATH=${DEBUG_PATH:-not_found}"
```

If TDD skill found: read it. Workers will follow TDD discipline (test first, then implement).
If not found: workers write tests after implementation as a fallback.

If debug skill found: read its instrumentation approach for Phase 3 step 0b below.

### Step 0b: Add debug instrumentation

Before writing any feature code, instrument the codebase for observability during execution:

1. Identify the modules/files the plan touches.
2. Add lightweight logging at key boundaries — function entry/exit for new or modified
   functions, error paths, and integration points.
3. Use the project's existing logging pattern (console.log, logger.debug, logging.debug, etc.).
   Search the codebase for the existing pattern before adding logs:
   ```bash
   # Find the project's logging convention
   grep -r "console\.\|logger\.\|logging\." --include="*.ts" --include="*.js" --include="*.py" -l | head -5
   ```
4. Wrap all debug instrumentation in a marker comment so it can be found and removed later:
   ```
   // #region autopilot-debug
   console.log('[autopilot] functionName entry', { arg1, arg2 });
   // #endregion autopilot-debug
   ```
5. Commit the instrumentation separately: `chore: add autopilot debug instrumentation`

This instrumentation serves two purposes:
- During execution: when guardrails fail, the logs help diagnose why
- During QA: runtime evidence for browser-based testing

The instrumentation is removed in Phase 6 (cleanup) after everything passes.

### Step 1: Build dependency graph

Group plan steps into layers based on dependencies:

```
Layer 0: [steps with no dependencies — can all run in parallel]
Layer 1: [steps that depend on Layer 0]
Layer 2: [steps that depend on Layer 1]
...
```

If all steps are independent (no shared files, no import dependencies between them),
they are all Layer 0 — maximum parallelism.

If the plan is small (3 or fewer steps) or all steps touch the same files:
skip parallelism, execute sequentially on the current branch.

### Step 2: Execute layers

**For each layer**, launch subagents in parallel. Each subagent gets:

- The overall plan context (one-liner summary, not the full plan)
- Its specific step(s) to implement
- Codebase conventions from CLAUDE.md
- The guardrail commands detected in Phase 0
- These worker instructions:

```
Implement the assigned step using TDD:
1. Write a failing test that defines the expected behavior.
   Match existing test patterns in the project. Run it — verify it fails.
   (If no test infrastructure exists for this area, skip to step 2 and note it.)
2. Write the minimum implementation to make the test pass.
3. Run guardrails: [type check command], [test command], [lint command]
4. If guardrails fail: read the error. Check autopilot-debug logs for context.
   Fix and re-run. Max 2 retries. If still failing after retries, use the
   debug skill's hypothesis approach: generate 3 hypotheses, investigate each.
5. Commit with a descriptive message (not "autopilot step N").
   Stage specific files only — never `git add .` or `git add -A`.
6. Report: list files changed, tests written, guardrail results (pass/fail),
   and any issues you could not resolve.
```

**Sequential fallback:** If the host does not support subagents, or if all steps
have dependencies, execute sequentially yourself — same guardrail gate after each step.

**Layer transitions:** Wait for all subagents in a layer to complete before starting
the next layer. If a subagent in Layer N fails, assess whether Layer N+1 steps
depend on it — if yes, execute those sequentially yourself with the fix. If no,
continue the next layer in parallel.

### Step 3: Pipeline review while executing

As soon as a layer completes, kick off review on that layer's diff in the background
while the next layer executes:

- Launch a background subagent to review the completed layer's changes
  (code reuse, quality, efficiency — same as Phase 4 simplify logic).
- The review subagent reports findings but does NOT apply fixes yet —
  fixes happen in Phase 4 after all execution is done, to avoid conflicts.

This means review runs concurrently with execution of later layers.
For single-layer plans, review runs after execution (no pipelining benefit).

### Step 4: Final validation

After all layers complete, run the full validation suite:
- Type check
- Full test suite
- Build

Fix any integration issues introduced by combining parallel work.

---

## Phase 4: Review

Collect findings from pipelined review subagents (launched during Phase 3).
If no pipelined reviews ran (sequential execution or no subagent support),
run the full review now.

Load the simplify skill from disk if available:

```bash
SIMPLIFY_PATH=""
for p in ~/.claude/skills/simplify/SKILL.md ~/.claude/skills/*/simplify/SKILL.md; do
  [ -f "$p" ] && SIMPLIFY_PATH="$p" && break
done
echo "SIMPLIFY_PATH=${SIMPLIFY_PATH:-not_found}"
```

If found: read it and follow its methodology (3 parallel review agents: code reuse,
code quality, efficiency). If not found: run a lightweight self-review yourself
covering the same three dimensions on the branch diff.

### Applying fixes

Merge findings from all review sources (pipelined + final). Deduplicate.
Then for each finding:

1. Apply the fix.
2. Re-run guardrails (tsc, tests, lint). If the fix breaks something, revert it.
   Execution code takes priority over review polish.
3. Commit review fixes separately: `refactor: [description of cleanup]`

---

## Phase 5: QA (conditional — web apps only)

Detect if this is a web app:

```bash
# Check for web indicators
HAS_WEB=false
[ -f "next.config.js" ] || [ -f "next.config.ts" ] || [ -f "next.config.mjs" ] && HAS_WEB=true
[ -f "vite.config.ts" ] || [ -f "vite.config.js" ] && HAS_WEB=true
[ -f "angular.json" ] && HAS_WEB=true
grep -q '"start"' package.json 2>/dev/null && grep -qE '"(react|vue|svelte|next|nuxt|angular)"' package.json 2>/dev/null && HAS_WEB=true
echo "HAS_WEB=$HAS_WEB"
```

If not a web app: skip Phase 5, proceed to handoff.

If web app: load the QA skill from disk if available:

```bash
QA_PATH=""
for p in ~/.claude/skills/qa/SKILL.md ~/.claude/skills/*/qa/SKILL.md; do
  [ -f "$p" ] && QA_PATH="$p" && break
done
echo "QA_PATH=${QA_PATH:-not_found}"
```

If found: read it and follow its methodology in **diff-aware mode** — only test
pages affected by the branch diff, not the full app.

If not found: skip QA. Do not attempt browser testing without the QA skill — it
requires `agent-browser` setup and structured methodology.

### Auto-decision overrides for QA

- **Tier**: Standard (critical + high + medium).
- **Clean working tree check**: skip — autopilot already committed everything.
- **Fix loop**: follow it. Auto-decide all triage. Commit each fix atomically.
  If a fix causes regression, revert and mark as deferred.
- **WTF self-regulation**: honor it. If WTF > 20%, stop fixing and log remaining
  issues for the handoff.
- **Re-run guardrails** after QA fixes (tsc, tests, lint). QA fixes must not
  break what the execution phase built.

---

## Phase 6: Cleanup

Remove debug instrumentation added in Phase 3 Step 0b.

```bash
# Find all autopilot-debug regions
grep -rn "autopilot-debug" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" .
```

Remove every `#region autopilot-debug` / `#endregion autopilot-debug` block and the
code between them. Verify no functional code was accidentally wrapped in a debug region.

After removal:
1. Run the full guardrail suite (tsc, tests, lint, build). The code must pass
   without the debug logs — they were observability only.
2. If anything breaks after removing debug logs, something depended on a side effect
   of the logging (rare but possible). Investigate and fix.
3. Commit: `chore: remove autopilot debug instrumentation`

---

## Phase 7: Handoff

Present the result to the user:

```
## Autopilot Complete

### Branch
`{branch-name}` — [N] commits ([M] execution, [K] review fixes, [J] QA fixes)

### Pipeline
| Phase | Duration | Result |
|-------|----------|--------|
| Roast | ~Xm | [N]/100 → [M]/100 after fixes |
| Execute | ~Xm | [N/M] steps, [K] parallel / [J] sequential |
| Review | ~Xm | [N] found, [M] fixed |
| QA | ~Xm | [N]/100 health (or skipped) |

### Roast Summary
- Fixed: [X] high, [Y] medium severity issues
- Known risks: [list]

### Execution Summary
- Layers: [N] ([M] steps ran in parallel, [K] sequential)
- Guardrail failures during execution: [N] (all resolved / [X] unresolved)

### Review Summary
- Issues: [N] (code reuse: [X], quality: [Y], efficiency: [Z])
- Fixed: [N], Skipped: [M] (false positives or not worth it)

### QA Summary (if run)
- Health score: [N]/100
- Issues found: [N], Fixed: [M], Deferred: [K]
- Screenshots: `.context/qa-reports/`

### Decision Log
| # | Phase | Decision | Principle | Rationale |
|---|-------|----------|-----------|-----------|
| 1 | Roast | ... | ... | ... |

### Final Guardrails
- Types: pass/fail
- Tests: pass/fail ([N] passed, [M] failed)
- Lint: pass/fail
- Build: pass/fail

### What I'd flag for human review
[Anything that was borderline, surprising, or where the decision principles
produced a defensible but debatable choice]
```

Suggest next step based on results:
- All green → `/ship-it`
- Guardrail failures → list what's broken, recommend fixing
- QA deferred issues → note them for future work

---

## Important Rules

- **Never ask the user anything** during Phases 1-6. The only exception is the
  circuit breaker (NOT_READY verdict in Phase 1).
- **Log every decision.** No silent auto-decisions. The decision log is how the user
  audits what happened while they were away.
- **TDD by default.** Every implementation step writes the failing test first. Skip
  only if no test infrastructure exists for that area — and note it in the log.
- **Debug instrumentation is temporary.** Added at Phase 3 start, removed at Phase 6.
  Never ship debug logs. The cleanup commit must be the last commit before handoff.
- **Do not skip guardrails.** If a project has no test/lint/build commands, note it
  and continue — but never skip a guardrail that exists.
- **Atomic commits.** One commit per logical step. Never one giant commit at the end.
- **Match the codebase.** Autopilot follows existing patterns, not its own preferences.
  If the codebase uses callbacks, don't switch to async/await. If it uses classes,
  don't switch to functions. Read before writing.
- **Do not expand scope.** Implement exactly what the plan says. If you notice
  something that should be done but isn't in the plan, log it in the handoff —
  do not implement it.
