# ship-it

Create a GitHub PR with conventional format and AI session context. Handles branch creation, commit, push, and PR creation in one command.

## Install

```bash
npx skills add vltansky/skills/skills/ship-it -g -y
```

## Prerequisites

- `gh` CLI — authenticated with GitHub
- `git` — with push access to the remote

## Usage

Trigger phrases:
- "ship it"
- "create PR"
- "open PR"
- "submit changes"
- "send to dev"

## How it works

1. Checks git state (branch, uncommitted changes)
2. Creates feature branch if on main/master
3. Commits and pushes
4. Generates privacy-safe AI session context (decisions, trade-offs, rationale)
5. Creates PR with conventional format + collapsible session context

## License

MIT
