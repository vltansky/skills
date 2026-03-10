# rfc-research

Research a technical topic and produce an RFC document backed by real code evidence from GitHub.

Instead of writing RFCs from vibes and assumptions, this skill uses [octocode MCP](https://github.com/nicepkg/octocode) to investigate actual implementations, patterns, and prior art across GitHub repositories — then structures findings into a standard RFC format where every claim links to evidence.

## What it does

1. **Scopes** the RFC topic — extracts problem, research targets, decision drivers
2. **Plans** concrete research questions mapped to octocode MCP tools
3. **Researches** via parallel subagents — searches repos, reads source code, explores PR history
4. **Synthesizes** findings into a structured RFC with evidence-backed sections
5. **Delivers** the RFC with GitHub URL references for every claim

## RFC structure

Every RFC produced follows this format:

| Section | Content |
|---------|---------|
| Summary | 2-3 sentence overview |
| Problem | What's broken and why it matters |
| Context & Prior Art | How other projects solve this (with GitHub links) |
| Proposal | Detailed solution with design decisions table |
| Alternatives Considered | Real-world examples, not hypotheticals |
| Risks & Mitigations | Evidence-grounded, not speculative |
| Open Questions | Genuine unknowns for discussion |
| References | All GitHub URLs and sources cited |

Full template available in [`references/rfc-template.md`](references/rfc-template.md).

## Requirements

- [octocode MCP server](https://github.com/nicepkg/octocode) configured in your Claude Code / Cursor setup

## Install

### Via skills CLI

```bash
npx skills add vltansky/rfc-research
```

### Manual

```bash
git clone https://github.com/vltansky/rfc-research.git ~/.claude/skills/rfc-research
```

## Usage

Trigger phrases:

- "Write an RFC for [topic]"
- "RFC research on [topic]"
- "Create a technical proposal for [approach]"
- "Design doc for [feature]"
- "Architecture decision record for [decision]"
- "Investigate [topic] and write a proposal"

### Example

```
> Write an RFC for migrating from REST to GraphQL in our API layer
```

The skill will:
1. Ask clarifying questions about scope and decision drivers
2. Present a research plan (which repos/libraries to investigate)
3. Research how projects like Apollo, Relay, and urql handle the migration
4. Produce an RFC with evidence from actual codebases

## How it works

The skill uses octocode MCP tools for research:

| Tool | Purpose |
|------|---------|
| `githubSearchRepositories` | Find projects solving similar problems |
| `githubSearchCode` | Locate specific implementations and patterns |
| `githubGetFileContent` | Read actual source code for evidence |
| `githubViewRepoStructure` | Understand project layouts |
| `githubSearchPullRequests` | Find context on why decisions were made |
| `packageSearch` | Look up packages on npm/pypi |

Research runs in parallel Explore subagents to keep the main conversation context clean.

## Quality gates

The skill enforces evidence standards:
- Every "Prior Art" claim must have a GitHub URL with line numbers
- "Alternatives Considered" must reference real-world usage, not hypotheticals
- "Risks" must be grounded in evidence from research
- At least 2 concrete code references per research question

## License

MIT
