# fix-pr-comments

Handle feedback from PR reviewers. Fetches comments, implements fixes, drafts replies, and resolves threads — all with user approval before posting.

## Install

```bash
npx skills add vltansky/skills/skills/fix-pr-comments -g -y
```

## Prerequisites

- `gh` CLI — authenticated with GitHub
- `jq` — for GraphQL response parsing

## Usage

Trigger phrases:
- "address comments"
- "fix PR feedback"
- "what did the reviewer say"
- "handle review"
- "resolve comments"

## How it works

1. Resolves target PR and ensures correct branch
2. Checks build status — analyzes and fixes CI failures if caused by PR
3. Fetches all inline and general comments
4. For each comment: evaluate, implement fix, draft reply, get user approval, post + resolve
5. Summary of addressed vs skipped comments

## License

MIT
