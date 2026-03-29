# Batch

Research and plan a large-scale change, then execute it in parallel across 5-30 isolated worktree agents that each open a PR.

## Install

```bash
npx skills add vltansky/skills/skills/batch -g -y
```

Or manually copy the `skills/batch` directory to your agent's skills folder.

## Prerequisites

- Git repository (uses git worktrees for isolation)
- `gh` CLI (for creating PRs from each worker)

## Usage

```
/batch migrate from react to vue
/batch replace all uses of lodash with native equivalents
/batch add type annotations to all untyped function parameters
```

The skill enters plan mode, decomposes the work into independent units, then spawns parallel worktree agents that each implement, test, and open a PR.

## License

MIT
