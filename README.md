# Skills

A collection of [Agent Skills](https://agentskills.io) for Claude Code, Cursor, Codex, and other coding agents.

## Install All

```bash
npx skills add vltansky/skills/skills --all -g
```

Installs all skills globally with symlinks to `~/.agents/skills/`, `~/.claude/skills/`, `~/.cursor/skills/`, and any other detected agents.

## Install Individual

```bash
npx skills add vltansky/skills/skills/roast-my-agents-md -g -y
```

| Skill | Description |
|-------|-------------|
| [roast-my-agents-md](skills/roast-my-agents-md) | Brutally honest AGENTS.md/CLAUDE.md review backed by A/B test evidence |
| [agents-md-evals](skills/agents-md-evals) | Evaluate and optimize instruction files through controlled A/B testing |
| [rfc-research](skills/rfc-research) | Research a topic and produce an RFC backed by real GitHub code evidence |
| [debug](skills/debug-skill) | Runtime debugging with automated log collection |
| [chat-history](skills/chat-history-skill) | Search previous AI chat conversations from Cursor and Claude Code |

## License

MIT
