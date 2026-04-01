# Development Workflow

The complete plan-to-ship pipeline using skills from this collection.

## The Flow

```
 grill-me          Challenge the idea — adversarial stress-test
     |
 rfc / plan        Write the plan — research + structure
     |
 autopilot         Build it — autonomous, zero interaction
 |  |  |  |  |
 |  |  |  |  |--- Phase 1: Roast (loads grill-me, auto-decides)
 |  |  |  |------ Phase 2: Fix plan (apply roast findings)
 |  |  |--------- Phase 3: Execute (debug instrumentation + TDD + parallel subagents)
 |  |------------ Phase 4: Review (loads simplify, 3 parallel review agents)
 |--------------- Phase 5: QA (loads qa, browser testing — debug logs = runtime evidence)
 |                 Phase 6: Cleanup (remove debug instrumentation)
 |                 Phase 7: Handoff (decision log + guardrail results)
     |
 ship-it           Create PR
     |
 fix-pr-comments   Address reviewer feedback
```

## Skills by Phase

### Planning

| Skill | What it does | Interactive? |
|-------|-------------|--------------|
| [grill-me](../skills/grill-me) | Adversarial plan review — challenges premises, compares alternatives, scores readiness | Yes — back-and-forth Q&A |
| [rfc-research](../skills/rfc-research) | Researches a topic using GitHub code search, produces evidence-backed RFC | Semi — asks for topic, then autonomous |

### Building

| Skill | What it does | Interactive? |
|-------|-------------|--------------|
| [autopilot](../skills/autopilot) | Full pipeline: roast → fix → execute → review → QA → cleanup → handoff | No — fully autonomous (circuit breaker at score < 60) |
| [tdd](../skills/tdd) | Red/green/refactor loop — write failing test, implement, verify | No |
| [debug](../skills/debug) | Hypothesis-driven root-cause investigation | Semi — may ask after 3 rounds |
| [batch](../skills/batch) | Parallel worktree agents for large mechanical changes | Semi — approves plan, then autonomous |

### Reviewing

| Skill | What it does | Interactive? |
|-------|-------------|--------------|
| [simplify](../skills/simplify) | 3 parallel review agents (reuse, quality, efficiency) + auto-fix | No |
| [roast-my-code](../skills/roast-my-code) | Comedic but actionable code review — user picks what to fix | Yes |
| [design-review](../skills/design-review) | Visual audit with browser screenshots + atomic fix commits | Semi |
| [qa](../skills/qa) | Browser-based QA testing — find bugs, fix, re-verify | No |

### Shipping

| Skill | What it does | Interactive? |
|-------|-------------|--------------|
| [ship-it](../skills/ship-it) | Create branch, commit, push, PR with AI session context | No |
| [fix-pr-comments](../skills/fix-pr-comments) | Fetch PR comments, implement fixes, draft replies, resolve threads | Yes — approves each reply before posting |

### Meta

| Skill | What it does |
|-------|-------------|
| [roast-my-agents-md](../skills/roast-my-agents-md) | Review AGENTS.md/CLAUDE.md for bloat + A/B eval proof |
| [agents-md-evals](../skills/agents-md-evals) | A/B test instruction files to find dead-weight rules |
| [what-i-did](../skills/what-i-did) | GitHub activity summary across all repos |
| [retro](../skills/retro) | Weekly retrospective from commit history |
| [chat-history](../skills/chat-history-skill) | Search previous AI conversations |

## How Autopilot Orchestrates Other Skills

Autopilot loads skills from disk at runtime. It doesn't import them — it reads
their SKILL.md files and follows the instructions, overriding interactive points
with auto-decisions.

```
autopilot
  ├── reads grill-me/SKILL.md      → runs roast, auto-decides all questions
  ├── reads tdd/SKILL.md           → workers follow TDD discipline
  ├── reads debug/SKILL.md         → hypothesis approach for guardrail failures
  ├── reads simplify/SKILL.md      → 3 parallel review agents on the diff
  └── reads qa/SKILL.md            → diff-aware browser testing
```

Each skill is optional. Autopilot degrades gracefully:

| Missing skill | Fallback |
|---------------|----------|
| grill-me | Built-in lightweight review (same dimensions, less ceremony) |
| tdd | Tests written after implementation |
| debug | Basic debugging without structured hypotheses |
| simplify | Lightweight self-review (same 3 dimensions) |
| qa | Skipped entirely |

## Debug + QA Synergy

Debug instrumentation is added at the start of execution (Phase 3) and stays
through QA (Phase 5). This creates a feedback loop:

1. **During execution** — guardrail failures have log context for diagnosis
2. **During QA** — browser testing captures debug output as runtime evidence
3. **After everything passes** — instrumentation is removed cleanly (Phase 6)

All debug code is wrapped in `#region autopilot-debug` markers for reliable cleanup.

## Standalone Usage

Every skill works independently. The workflow above is the recommended pipeline,
but you can use any skill on its own:

- `/grill-me` when you want to stress-test an idea before committing to it
- `/tdd` when fixing a bug or adding a feature with test-first discipline
- `/debug` when investigating unexpected behavior
- `/simplify` after making changes, to catch quality issues
- `/qa` to test a running web app
- `/batch` for large mechanical changes across many files
