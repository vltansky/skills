# Chat History Skill

Search previous AI chat conversations from **Cursor IDE** and **Claude Code** by content, affected file, or project.

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-supported-blue" alt="Claude Code">
  <img src="https://img.shields.io/badge/Cursor-supported-purple" alt="Cursor">
</p>

## Features

- **Two-stage search**: Lightweight search → targeted extraction (context-efficient)
- **Cross-platform**: macOS, Linux, Windows paths
- **Performance optimized**: Streaming patterns, parallel operations, benchmarked
- **Multiple query types**: Keywords, file paths, errors, commands, web searches
- **Native tools support**: Uses Claude's Read/Grep tools for cleaner extraction

## Installation

### npx add-skill (Recommended)

The simplest way to install. Works with Claude Code, Cursor, OpenCode, and Codex:

```bash
npx add-skill vltansky/chat-history-skill
```

The interactive picker displays available skills. Use `--global` for user-wide installation:

```bash
npx add-skill vltansky/chat-history-skill --global
```

Target specific agent:

```bash
npx add-skill vltansky/chat-history-skill --agent claude-code
npx add-skill vltansky/chat-history-skill --agent cursor
```

### Manual Installation

#### Claude Code

```bash
# Clone and copy
git clone https://github.com/vltansky/chat-history-skill.git
cp -r chat-history-skill/chat-history ~/.claude/skills/
```

Or project-local:

```bash
mkdir -p .claude/skills
cp -r chat-history-skill/chat-history .claude/skills/
```

#### Cursor

```bash
cp -r chat-history-skill/chat-history ~/.cursor/skills/
```

#### OpenCode

```bash
cp -r chat-history-skill/chat-history ~/.config/opencode/skill/
```

## Usage Examples

Once installed, just ask naturally:

```
"Find conversations where I worked on authentication"
"How did I fix the TypeScript error last week?"
"What bash commands did I run in that deploy session?"
"Which conversations touched src/components/Button.tsx?"
"Show me my activity this week"
"What did I research about React hooks?"
```

## Storage Locations

| Tool | Format | macOS | Linux |
|------|--------|-------|-------|
| Cursor | SQLite | `~/Library/Application Support/Cursor/.../state.vscdb` | `~/.config/Cursor/.../state.vscdb` |
| Claude Code | JSONL | `~/.claude/projects/` | `~/.claude/projects/` |

## Structure

```
chat-history-skill/
├── README.md
└── chat-history/
    ├── SKILL.md              # Main skill instructions
    └── references/
        ├── cursor-schema.md      # Cursor database format
        └── claude-code-schema.md # Claude Code JSONL format
```

## Documentation

- [SKILL.md](chat-history/SKILL.md) - Full skill documentation with all query patterns
- [Cursor Schema](chat-history/references/cursor-schema.md) - SQLite database structure
- [Claude Code Schema](chat-history/references/claude-code-schema.md) - JSONL format reference

## Resources

- [Agent Skills Spec](https://agentskills.io) - Open format for extending AI agent capabilities
- [add-skill CLI](https://github.com/vercel-labs/add-skill) - Install skills from any git repo
- [Claude Code Skills](https://code.claude.com/docs/en/skills) - Skills documentation

## License

MIT
