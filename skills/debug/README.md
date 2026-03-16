# Debug Skill

Ported [Cursor's Debug Mode](https://cursor.com/blog/debug-mode) as a skill for Claude Code, OpenCode, Codex, Cursor, and any agent that supports skills.

![Debug Skill Screenshot](screenshot.png)

**How it works:**
- Start a log server on localhost
- Instrument code to send logs
- Read logs from file, fix with evidence

Runtime agnostic - works anywhere with localhost access.

## Installation

### Quick Install (recommended)

```bash
npx skills add https://github.com/vltansky/skills --skill debug
```

Installs to all detected agents (Claude Code, OpenCode, Codex, Cursor, Antigravity).

**Options:**
```bash
npx skills add https://github.com/vltansky/skills --skill debug -g
npx skills add https://github.com/vltansky/skills --skill debug --agent claude-code
npx skills add https://github.com/vltansky/skills --skill debug -g -y
```

### Manual

```bash
git clone https://github.com/vltansky/skills.git
cp -r skills/debug ~/.claude/skills/debug
```

## Usage

In your AI agent, invoke the skill:

```
/debug /path/to/project
```

Or just describe a bug - the skill auto-triggers on phrases like:
- "debug this", "fix this bug", "why isn't this working"
- "investigate this issue", "trace the problem"
- "UI not updating", "state is wrong", "value is null"

## Permissions

To skip permission prompts, add to `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["Skill(debug:debug)", "Bash(node:*)"]
  }
}
```

## Agent Compatibility

| Agent | Global Path | Project Path |
|-------|-------------|--------------|
| Claude Code | `~/.claude/skills/debug/` | `.claude/skills/debug/` |
| OpenCode | `~/.config/opencode/skill/debug/` | `.opencode/skill/debug/` |
| Codex | `~/.codex/skills/debug/` | `.codex/skills/debug/` |
| Cursor | `~/.cursor/skills/debug/` | `.cursor/skills/debug/` |
| Antigravity | `~/.gemini/antigravity/skills/debug/` | `.agent/skills/debug/` |

## Structure

```
debug/
├── SKILL.md              # Skill instructions
└── scripts/
    ├── debug_server.js   # Log server
    └── debug_cleanup.js  # Log cleanup utility
```

## Requirements

- Node.js 18+

## License

MIT
