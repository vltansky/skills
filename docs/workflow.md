# Development Workflow

A practical plan-to-ship flow using the skills in this collection.

## The Flow

```
 grill-me          Challenge the idea — adversarial stress-test
     |
 rfc-research      Write the plan — research + structure
     |
 debug / batch     Build it — investigate bugs or split large changes
     |
 review            Check code quality or visual quality
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
| [debug](../skills/debug) | Hypothesis-driven root-cause investigation | Semi — may ask after 3 rounds |
| [batch](../skills/batch) | Parallel worktree agents for large mechanical changes | Semi — approves plan, then autonomous |

### Reviewing

| Skill | What it does | Interactive? |
|-------|-------------|--------------|
| [roast-my-code](../skills/roast-my-code) | Comedic but actionable code review — user picks what to fix | Yes |
| [design-review](../skills/design-review) | Visual audit with browser screenshots + atomic fix commits | Semi |

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
| [retro](../skills/retro) | Weekly retrospective from commit history |
| [chat-history](../skills/chat-history-skill) | Search previous AI conversations |

## How Skills Combine

The workflow is intentionally modular. Use `grill-me` before investing in a plan,
`rfc-research` when the decision needs external code evidence, `debug` for
runtime or logic failures, and `batch` when a large change can be split across
independent worktrees.

Review happens with the skill that matches the risk: `roast-my-code` for code
review, `design-review` for UI quality, and `debug-mode` when frontend runtime
evidence is needed.

## Standalone Usage

Every skill works independently. The workflow above is the recommended pipeline,
but you can use any skill on its own:

- `/grill-me` when you want to stress-test an idea before committing to it
- `/debug` when investigating unexpected behavior
- `/batch` for large mechanical changes across many files
- `/roast-my-code` when you want a review before shipping
- `/design-review` when a UI needs visual QA
