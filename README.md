# Skills

A collection of [Agent Skills](https://agentskills.io) for Claude Code, Cursor, Codex, and other coding agents.

## Workflow

These skills form a complete plan-to-ship pipeline:

```
grill-me → rfc/plan → autopilot → ship-it → fix-pr-comments
```

See [docs/workflow.md](docs/workflow.md) for the full flow, skill interactions, and how autopilot orchestrates other skills.

## Install All

```bash
npx skills add vltansky/skills/skills --all -g
```

Installs all skills globally with symlinks to `~/.agents/skills/`, `~/.claude/skills/`, `~/.cursor/skills/`, and any other detected agents.

## Install Individual

```bash
npx skills add vltansky/skills/skills/roast-my-agents-md -g -y
```

### Planning

| Skill | Description |
|-------|-------------|
| [grill-me](skills/grill-me) | Adversarial stress-test for plans — challenges premises, compares alternatives, scores readiness |
| [rfc-research](skills/rfc-research) | Research a topic and produce an RFC backed by real GitHub code evidence |

### Building

| Skill | Description |
|-------|-------------|
| [autopilot](skills/autopilot) | Autonomous pipeline: roast → fix → execute (TDD + parallel) → review → QA → cleanup → handoff |
| [tdd](skills/tdd) | Test-driven development loop — write failing test first, implement, verify |
| [debug](skills/debug) | Systematic root-cause debugging — hypothesis-driven investigation with evidence |
| [batch](skills/batch) | Parallel work orchestration — decompose large changes into 5-30 worktree agents |

### Reviewing

| Skill | Description |
|-------|-------------|
| [simplify](skills/simplify) | Review changed code for reuse, quality, and efficiency, then fix issues |
| [roast-my-code](skills/roast-my-code) | Brutally honest code review with comedic flair |
| [design-review](skills/design-review) | Visual audit of a live site with browser screenshots + fix loop |
| [qa](skills/qa) | Browser-based QA testing — find bugs, fix with atomic commits, re-verify |

### Shipping

| Skill | Description |
|-------|-------------|
| [ship-it](skills/ship-it) | Create a GitHub PR with conventional format and AI session context |
| [fix-pr-comments](skills/fix-pr-comments) | Address PR reviewer feedback — fix, reply on-thread, resolve |

### Debugging

| Skill | Description |
|-------|-------------|
| [debug](skills/debug) | General-purpose root-cause investigation (backend, logic, integration) |
| [debug-mode](skills/debug-mode) | Frontend runtime debugging with automated log server |

### Meta

| Skill | Description |
|-------|-------------|
| [roast-my-agents-md](skills/roast-my-agents-md) | Brutally honest AGENTS.md/CLAUDE.md review backed by A/B test evidence |
| [agents-md-evals](skills/agents-md-evals) | Evaluate and optimize instruction files through controlled A/B testing |
| [what-i-did](skills/what-i-did) | Summarize your GitHub activity from the last 24 hours across all repos |
| [retro](skills/retro) | Weekly engineering retrospective from commit history |
| [chat-history](skills/chat-history-skill) | Search previous AI chat conversations from Cursor and Claude Code |

## License

MIT
