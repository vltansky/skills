# Simplifier

Review changed code for reuse, quality, and efficiency, then fix any issues found.

## Install

```bash
npx skills add vltansky/skills/skills/simplifier -g -y
```

Or manually copy the `skills/simplifier` directory to your agent's skills folder.

## Prerequisites

- Git (for `git diff`)

## Usage

Say any of:
- "simplify"
- "simplify this"
- "review changes"
- "clean up my code"
- "check for duplicates"

The skill runs three parallel review agents (reuse, quality, efficiency) against your recent changes and fixes issues directly.

## License

MIT
