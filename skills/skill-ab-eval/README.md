# skill-ab-eval

A/B test skill changes to measure whether modifications actually improve agent behavior.

## What it does

When you modify a skill (SKILL.md, references, scripts), this skill runs controlled tests with both the old and new versions, grades outputs against assertions, and produces a benchmark report showing whether your changes helped, hurt, or made no difference.

## Install

```bash
# Via npx
npx skills add vltansky/skills/skills/skill-ab-eval -g -y

# Manual
cp -r skills/skill-ab-eval ~/.claude/skills/skill-ab-eval
```

## Prerequisites

- Git (for baseline snapshots)
- Node.js (for report generation)
- Skill changes in the working tree (uncommitted)

## Usage

Trigger phrases:
- "A/B test my skill changes"
- "Test if my skill improvements work"
- "Compare old vs new skill"
- "Benchmark my skill changes"
- "Did my SKILL.md changes help?"

## How it works

1. Snapshots the baseline skill from git HEAD
2. Generates eval scenarios targeting the changes
3. Runs both versions in parallel (new vs baseline)
4. Grades outputs against assertions
5. Produces a benchmark with verdict (improvement/regression/no_change/mixed)
6. Opens an HTML report for review

## Example output

```
Eval                          | New Skill | Baseline | Delta
------------------------------|-----------|----------|------
bloated-cleanup               | 4/4 100%  | 3/4 75%  | +25%
skill-quality-audit           | 3/3 100%  | 1/3 33%  | +67%
content-filtering             | 4/4 100%  | 4/4 100% |  0%
------------------------------|-----------|----------|------
Total                         | 11/11     | 8/11     | +27%

Verdict: improvement (no regressions)
```

## License

MIT
