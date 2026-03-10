# agents-md-evals

Evaluate and optimize AGENTS.md instruction files through controlled A/B testing. Discover which rules actually change model behavior vs. waste context tokens. Also handles CLAUDE.md and other AI instruction files. Built on [Anthropic's skill-creator](https://github.com/anthropics/claude-code/tree/main/.claude/skills/skill-creator) eval framework.

## The Problem

Most AGENTS.md files are 80-95% redundant. Models discover tech stack choices, library conventions, helper functions, and coding patterns by reading existing code. In controlled testing, **25 of 26 assertions passed identically** with and without a 755-line instruction file.

The rules that actually matter are the ones the codebase can't teach: coupling knowledge, workflow requirements, decision style preferences, and domain context.

## What This Skill Does

1. Reads your instruction file and categorizes each rule
2. Generates eval prompts from your git commit history (not generic prompts)
3. Runs clean A/B tests with proper file isolation (moves files to `/tmp/`, not rename)
4. Grades and benchmarks results with a visual HTML viewer
5. Identifies non-discriminating rules and recommends cuts
6. Iterates until every remaining rule earns its tokens

## Install

```bash
npx skills add vltansky/agents-md-evals
```

Or manually clone into your skills directory:

```bash
git clone https://github.com/vltansky/agents-md-evals.git ~/.claude/skills/agents-md-evals
```

## Usage

Ask Claude Code:
- "eval my AGENTS.md"
- "which rules in my AGENTS.md actually matter?"
- "optimize my instructions"
- "trim my agents file"
- "test my CLAUDE.md"

## Key Concepts

### The Codebase-Teaches-Patterns Effect

Well-structured codebases make most instruction rules redundant. The model reads `package.json`, scans existing components, follows import patterns, and matches conventions automatically. Realistic improvement deltas are +3-10% for well-structured projects.

### Clean Baseline Protocol

Claude Code auto-loads CLAUDE.md for ALL conversations including subagents. You can't just tell an agent "ignore CLAUDE.md" — the file must be physically absent. This skill handles the 7-phase isolation protocol automatically.

### The Keep Test

Every surviving rule must pass at least one criterion: Specificity, Behavior change, Surprise, Pain, Frequency, or No feedback loop. If it fails all six AND is non-discriminating in A/B tests, it's dead weight.

## What's Inside

```
agents-md-evals/
├── SKILL.md                          # Main skill instructions
├── eval-viewer/
│   └── generate_review.py            # HTML eval viewer generator
├── scripts/
│   └── aggregate_benchmark.py        # Benchmark aggregation
├── agents/
│   ├── grader.md                     # Grading subagent prompt
│   └── analyzer.md                   # Analysis subagent prompt
└── references/
    ├── eval-categories.md            # Rule categories & empirical findings
    └── schemas.md                    # JSON schemas for evals/grading/benchmark
```

All dependencies are bundled — no external requirements.

## License

MIT
