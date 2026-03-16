---
name: skill-ab-eval
description: A/B test skill changes to measure improvement before committing. Use when the user says "test my skill changes", "A/B test this skill", "compare old vs new skill", "benchmark skill improvement", "did my changes help", "eval skill changes", or has made changes to a SKILL.md and wants to know if they actually improved behavior.
---

# Skill A/B Test

Compare a modified skill against its baseline to measure whether changes actually improve agent behavior. Runs controlled tests with both versions, grades outputs against assertions, and produces a benchmark report.

## When to Use

- After modifying a SKILL.md, references, or scripts
- Before committing skill changes to verify improvement
- When unsure if added instructions actually change behavior
- To identify regressions from refactoring

## Prerequisites

- The skill must be in a git repo (baseline comes from the last commit)
- Node.js available (for the report generator)
- Changes should already be applied to the skill files (working tree = new version, git HEAD = baseline)

---

## Step 1: Identify Skill and Changes

1. Ask the user which skill to test (or detect from recent `git diff`)
2. Determine the skill path (the directory containing SKILL.md)
3. Run `git diff HEAD -- <skill-path>` to see what changed
4. Summarize the changes for the user in a table:

| File | Change type | Summary |
|------|------------|---------|
| SKILL.md | Modified | Added section budget validation step |
| references/quality-gate.md | Modified | Added exclusions list |
| scripts/audit.js | Modified | New analyzeSectionBudgets function |

If there are no uncommitted changes, ask the user what they plan to change or if they want to compare two branches.

---

## Step 2: Create Workspace and Snapshot Baseline

```bash
SKILL_PATH="<skill-path>"
SKILL_NAME="$(basename $SKILL_PATH)"
WORKSPACE="$(pwd)/${SKILL_NAME}-ab-workspace"
mkdir -p "$WORKSPACE/baseline" "$WORKSPACE/evals"

# Snapshot baseline from git HEAD
git show HEAD:"$SKILL_PATH" > /dev/null 2>&1 || echo "ERROR: skill not committed yet"
cd "$(git rev-parse --show-toplevel)"
git archive HEAD -- "$SKILL_PATH" | tar -x -C "$WORKSPACE/baseline/"
```

Verify baseline snapshot:
```bash
diff <(find "$WORKSPACE/baseline/$SKILL_PATH" -type f | sort) \
     <(find "$SKILL_PATH" -type f | sort) || true
```

This shows which files differ between baseline and current.

---

## Step 3: Design Eval Scenarios

Generate 3-5 eval scenarios that specifically target the changes. Each eval should:
- Test behavior the changes are supposed to improve
- Have 3-5 concrete, verifiable assertions
- Be realistic (based on actual use cases, not synthetic)

### Auto-Generating from Diff

For each change in the diff, ask: "What would an agent do differently with vs without this change?" That's your eval.

Example: if you added a section budget validation step, write an eval where the input has sections exceeding the budget and assert the agent flags them.

### Eval Format

Save to `{workspace}/evals/evals.json`:

```json
{
  "skill_name": "<skill-name>",
  "evals": [
    {
      "id": 1,
      "name": "descriptive-kebab-name",
      "prompt": "Realistic task prompt that exercises the changed behavior",
      "expected_output": "Human-readable description of what success looks like",
      "assertions": [
        {
          "text": "Verifiable statement about the output",
          "type": "output_contains_concept"
        }
      ]
    }
  ]
}
```

Present the evals to the user before running. Ask: "These are the test cases. Want to adjust any before I run them?"

---

## Step 4: Run A/B Tests

For each eval, spawn two agents in parallel:

### Variant A: With New Skill (current working tree)

```
You are being evaluated on a skill. Read the skill at {skill-path}/SKILL.md and follow it.

Your task: {eval prompt}

Save all outputs to {workspace}/iteration-{N}/{eval-name}/new_skill/outputs/
Save your full response to {workspace}/iteration-{N}/{eval-name}/new_skill/outputs/response.md
```

### Variant B: With Baseline Skill (from snapshot)

```
You are being evaluated on a skill. Read the skill at {workspace}/baseline/{skill-path}/SKILL.md and follow it.

Your task: {eval prompt}

Save all outputs to {workspace}/iteration-{N}/{eval-name}/old_skill/outputs/
Save your full response to {workspace}/iteration-{N}/{eval-name}/old_skill/outputs/response.md
```

### Execution Strategy

1. Create eval_metadata.json for each eval:
```json
{
  "eval_id": 1,
  "eval_name": "descriptive-name",
  "prompt": "the eval prompt",
  "assertions": [...]
}
```

2. Launch ALL agents in a single turn for maximum parallelism
3. Use background agents — launch all, then wait for notifications
4. Each eval gets 2 agents (new_skill + old_skill) running simultaneously

**Important**: Both variants run in the same repo. The only difference is which SKILL.md they read. No files need to be hidden or moved.

---

## Step 5: Grade Outputs

After all agents complete, grade each run.

### Grading Process

For each run (new_skill and old_skill for each eval):

1. Read the response at `outputs/response.md`
2. Read any other output files in `outputs/`
3. Evaluate each assertion from eval_metadata.json against the outputs
4. Save grading to `grading.json` (sibling to outputs/):

```json
{
  "eval_id": 1,
  "eval_name": "descriptive-name",
  "config": "new_skill",
  "expectations": [
    {
      "text": "Assertion text from eval",
      "passed": true,
      "evidence": "Specific quote or description from the output"
    }
  ],
  "summary": {
    "passed": 3,
    "failed": 1,
    "total": 4,
    "pass_rate": 0.75
  }
}
```

### Grading with Subagent

Spawn a grading subagent using the prompt from [agents/grader.md](agents/grader.md):

```
Grade the following eval runs. For each run directory, read the outputs and evaluate assertions.

Runs to grade:
{list of run directories with their assertions}

For each run, save grading.json as specified in agents/grader.md.
Then write a summary comparing new_skill vs old_skill across all evals.
```

### Automated Assertion Checks

Where possible, use scripted checks before the grading subagent:

```bash
# Check if response mentions a concept
grep -ci "section budget" outputs/response.md

# Check if a file was created
test -f outputs/audit-report.json && echo "PASS" || echo "FAIL"
```

---

## Step 6: Generate Benchmark

Build `{workspace}/iteration-{N}/benchmark.json`:

```json
{
  "metadata": {
    "skill_name": "<skill-name>",
    "skill_path": "<skill-path>",
    "timestamp": "<ISO timestamp>",
    "evals_run": ["eval-name-1", "eval-name-2"],
    "model": "<model used>",
    "changes_summary": "Brief description of what changed"
  },
  "runs": [
    {
      "eval_name": "descriptive-name",
      "new_skill": { "pass_rate": 1.0, "assertions_passed": 4, "assertions_total": 4 },
      "old_skill": { "pass_rate": 0.75, "assertions_passed": 3, "assertions_total": 4 }
    }
  ],
  "summary": {
    "new_skill": { "mean_pass_rate": 0.92, "total_passed": 11, "total_assertions": 12 },
    "old_skill": { "mean_pass_rate": 0.75, "total_passed": 9, "total_assertions": 12 },
    "delta": { "pass_rate": "+0.17", "assertions": "+2" },
    "verdict": "improvement"
  },
  "notes": [
    "All old_skill failures trace to missing section budget validation",
    "No regressions detected"
  ]
}
```

### Verdict Logic

- **improvement**: new_skill pass_rate > old_skill pass_rate AND no regressions
- **regression**: new_skill pass_rate < old_skill pass_rate on any eval
- **no_change**: identical pass rates
- **mixed**: improvement on some evals, regression on others

A regression is any assertion that passes with old_skill but fails with new_skill.

---

## Step 7: Launch Report Viewer

Launch the interactive report viewer with feedback collection:

```bash
node {this-skill-path}/scripts/generate-report.js {workspace}/iteration-{N} --serve
```

This starts a local server (default port 3118) that:
- Shows the benchmark results with side-by-side comparison
- Provides per-eval feedback textareas (auto-saves on typing)
- Saves feedback to `{workspace}/iteration-{N}/feedback.json`
- Has a "Done Reviewing" button that signals review completion

For iteration 2+, pass the previous iteration to show prior feedback:
```bash
node {this-skill-path}/scripts/generate-report.js {workspace}/iteration-2 --serve --previous {workspace}/iteration-1
```

Static mode (no server, feedback downloads on submit):
```bash
node {this-skill-path}/scripts/generate-report.js {workspace}/iteration-{N}
open {workspace}/iteration-{N}/report.html
```

### Report Contents

The report has two tabs:
1. **Results** — summary table with pass rates, deltas, verdict, notes
2. **Per-Eval Details** — assertion-level comparison with evidence, previous feedback, and feedback textarea per eval

Tell the user: "Review the report in your browser. Leave feedback on any eval, then click 'Done Reviewing' when finished."

### Reading Feedback

After the user finishes reviewing, read `{workspace}/iteration-{N}/feedback.json`:

```json
{
  "reviews": [
    { "eval_name": "eval-1", "feedback": "The budget detection was good but missed nested files", "timestamp": "..." },
    { "eval_name": "eval-2", "feedback": "", "timestamp": "..." }
  ],
  "status": "complete"
}
```

- `status: "complete"` means the user clicked "Done Reviewing"
- Empty `feedback` means the eval looked good (no issues flagged)
- Non-empty `feedback` contains specific issues, corrections, or suggestions

Use this feedback to guide iteration (Step 9).

---

## Step 8: Recommend Next Action

Based on the verdict:

### Improvement (no regressions)
> Your changes improved the skill. New skill scores {X}% vs baseline {Y}% (+{delta}%). No regressions detected. Safe to commit.

### Regression detected
> Warning: {N} regressions found. These assertions passed with the old skill but fail with the new one:
> - [eval-name] "assertion text" — old: PASS, new: FAIL
>
> Consider reverting the change that caused this, or adjusting the new skill to preserve the old behavior.

### No change
> Your changes didn't measurably affect behavior on these test cases. The skill scores identically ({X}%) in both versions. Consider:
> - Are the evals testing the right things?
> - Are the changes too subtle to measure with these assertions?
> - Are the changes beneficial for maintainability even without behavioral change?

### Mixed results
> Mixed results: improvement on {N} evals, regression on {M} evals.
> Review the per-eval breakdown to decide if the trade-off is acceptable.

---

## Step 9: Iterate Using Feedback

After the user clicks "Done Reviewing", read `{workspace}/iteration-{N}/feedback.json`.

### Process Feedback

For each eval with non-empty feedback:

1. **Wrong grades**: If the user says a grade is wrong (e.g., "this should be PASS"), update the grading.json and re-generate the benchmark
2. **Skill issues**: If the user flags something the skill should handle differently, propose a specific change to the skill files
3. **Eval issues**: If the user says an eval is weak or testing the wrong thing, revise the eval in evals.json
4. **Observations**: If the user notes patterns (e.g., "both variants missed X"), consider whether the skill needs a new instruction

### Re-run

After applying changes:

1. Make additional changes to the skill
2. Re-run from Step 4 into `iteration-{N+1}/`
3. Compare against the same baseline (not the previous iteration)
4. Launch the viewer with `--previous` to show prior feedback:
   ```bash
   node {this-skill-path}/scripts/generate-report.js {workspace}/iteration-{N+1} --serve --previous {workspace}/iteration-{N}
   ```
5. The user sees their previous feedback alongside new results — they can verify issues were addressed

---

## Workspace Layout

```
{skill-name}-ab-workspace/
  baseline/                    # Git HEAD snapshot of the skill
    {skill-path}/
      SKILL.md
      references/
      scripts/
  evals/
    evals.json                 # Eval definitions
  iteration-1/
    {eval-name}/
      eval_metadata.json
      new_skill/
        outputs/
          response.md
          ...
        grading.json
      old_skill/
        outputs/
          response.md
          ...
        grading.json
    benchmark.json
    feedback.json              # User feedback from reviewer
    report.html
    report.md
  iteration-2/
    ...
```

---

## Common Pitfalls

1. **Testing non-behavioral changes**: If you only reformatted SKILL.md or merged reference docs, the A/B test may show no delta. That's expected — structural improvements don't always change behavior.

2. **Too few evals**: 1-2 evals give noisy results. Aim for 3-5 focused evals that each target a specific change.

3. **Overlapping assertions**: If multiple assertions test the same thing in different words, you get inflated scores. Each assertion should test a distinct behavior.

4. **Baseline drift**: Always snapshot from git HEAD, not from a previous workspace. If you've made commits between iterations, the baseline changes.

5. **Agent variability**: LLMs are non-deterministic. A single run per variant is suggestive, not conclusive. For high-stakes decisions, run 3x per variant and look at the pattern.

6. **Forgetting to check regressions**: A +20% improvement means nothing if there's a -50% regression on one eval. Always check per-eval, not just aggregate.
