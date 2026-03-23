# interview-octocode

Research-first plan interview: the agent uses Octocode (GitHub and package research) to auto-answer as many decisions as possible, then batches remaining low-confidence questions for you. Output is a combined research-backed spec.

## Prerequisites

- [Octocode MCP server](https://github.com/nicepkg/octocode) configured in your agent (for `githubSearchCode`, `packageSearch`, and related tools)
- A plan file or path to analyze (the skill refers to a plan placeholder in its workflow)

## Install

### Via skills CLI

```bash
npx skills add https://github.com/vltansky/skills --skill interview-octocode
```

Useful variants:

```bash
npx skills add https://github.com/vltansky/skills --skill interview-octocode -g
npx skills add https://github.com/vltansky/skills --skill interview-octocode -g -y
```

### Manual

```bash
git clone https://github.com/vltansky/skills.git
cp -r skills/interview-octocode ~/.claude/skills/interview-octocode
```

## Usage

Trigger phrases:

- "Interview me about the plan with Octocode research"
- "Research the plan and only ask what you cannot infer"
- "Auto-answer from GitHub evidence, then confirm the rest"

### Example

```
> Use interview-octocode on ./docs/plan.md — research first, then ask what's still uncertain
```

## License

MIT
