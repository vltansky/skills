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

### skills CLI (Recommended)

Install the `chat-history` skill from this repo:

```bash
npx skills add https://github.com/vltansky/skills --skill chat-history
```

Useful variants:

```bash
npx skills add https://github.com/vltansky/skills --skill chat-history -g
npx skills add https://github.com/vltansky/skills --skill chat-history -g -y
```

Target specific agent:

```bash
npx skills add https://github.com/vltansky/skills --skill chat-history --agent claude-code
npx skills add https://github.com/vltansky/skills --skill chat-history --agent cursor
```

### Manual Installation

#### Claude Code

```bash
git clone https://github.com/vltansky/skills.git
cp -r skills/chat-history-skill/chat-history ~/.claude/skills/chat-history
```

Or project-local:

```bash
mkdir -p .claude/skills
cp -r skills/chat-history-skill/chat-history .claude/skills/chat-history
```

#### Cursor

```bash
cp -r skills/chat-history-skill/chat-history ~/.cursor/skills/chat-history
```

#### OpenCode

```bash
cp -r skills/chat-history-skill/chat-history ~/.config/opencode/skill/chat-history
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
