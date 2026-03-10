---
name: rfc-research
description: "Research a technical topic and produce an RFC document backed by real code evidence from GitHub. Use when user says 'write an RFC', 'RFC research', 'create RFC for', 'technical proposal', 'design doc', 'investigate X', 'research X and write a proposal', 'architecture decision record', 'ADR', or needs a structured technical decision document with prior art analysis."
metadata:
  author: vltansky
  version: 1.0.0
  mcp-server: octocode
  category: research
  tags: [rfc, research, architecture, decision-record, proposal]
---

# RFC Research

Produce a well-researched RFC (Request for Comments) document by investigating real implementations, patterns, and prior art across GitHub repositories using octocode MCP tools.

## Phase 0: Pre-flight Check

Before starting, verify octocode MCP is available by checking if `mcp__octocode__githubSearchRepositories` (or any `mcp__octocode__*` tool) is in your available tools.

**IF octocode tools are available:** proceed to Phase 1.

**IF octocode tools are NOT available:** stop and tell the user:

```
Octocode MCP server is not configured. This skill requires it for GitHub code research.

Install options:

1. npm (recommended):
   npx -y @anthropic-ai/claude-code mcp add octocode -- npx -y octocode-mcp

2. Manual — add to ~/.claude/settings.json under "mcpServers":
   {
     "octocode": {
       "command": "npx",
       "args": ["-y", "octocode-mcp"]
     }
   }

After adding, restart Claude Code and re-run this skill.
```

Do NOT proceed without octocode MCP. The skill cannot produce evidence-backed RFCs without it.

## Workflow

### Phase 1: Scope the RFC

Use `AskUserQuestion` to clarify scope before researching. Only ask about what's missing or ambiguous from the user's request — skip questions you can infer.

**Question 1 — Problem & scope** (ask if problem statement is vague):
- "What specific problem are you trying to solve?" with options based on what you inferred from their request

**Question 2 — Research targets** (ask if not obvious):
- "Which ecosystems/repos should I investigate?" with options like specific libraries, orgs, or "Open-ended — find the best options"

**Question 3 — Decision drivers** (always ask — priorities shape the RFC):
- "What matters most for this decision?" with options like: Performance, Developer experience, Compatibility/migration cost, Community/ecosystem size — allow multi-select

After answers, present a brief summary:

```
RFC: [Title]
Problem: [1-2 sentences]
Research targets: [repos/libraries to investigate]
Decision drivers: [ranked list]

Proceed?
```

### Phase 2: Research Plan

Break the RFC topic into 2-5 concrete research questions. Each question maps to octocode MCP tool calls.

Example research questions:
- "How does [library X] implement [feature]?" -> `githubSearchCode` + `githubGetFileContent`
- "What repos solve [problem]?" -> `githubSearchRepositories`
- "What changed when [library] adopted [pattern]?" -> `githubSearchPullRequests`
- "What's the directory structure of [project]?" -> `githubViewRepoStructure`

Present the plan to the user before executing:

```
## Research Plan
1. [Question] -> [tool] on [target repo/org]
2. [Question] -> [tool] on [target repo/org]
...

Proceed?
```

### Phase 3: Execute Research

Use octocode MCP tools via subagents for parallel investigation.

**Rules:**
- ALWAYS use the Agent tool with `subagent_type="Explore"` for octocode MCP calls (keeps main context clean)
- Independent research domains -> parallel agents
- Sequential dependencies -> sequential agents
- Every tool call MUST include `mainResearchGoal`, `researchGoal`, and `reasoning`
- Follow hints in tool responses
- Collect file:line references for every finding

**Tool selection guide:**

| Research Need | Tool | When |
|---------------|------|------|
| Find repos | `githubSearchRepositories` | Discovering projects, comparing solutions |
| Find code patterns | `githubSearchCode` | Locating implementations, API usage |
| Read source | `githubGetFileContent` | Understanding implementation details |
| Explore structure | `githubViewRepoStructure` | Understanding project layout |
| Find PR history | `githubSearchPullRequests` | Understanding why decisions were made |
| Find packages | `packageSearch` | Looking up npm/pypi packages |

**Research depth:**
- For each research question, aim for 2-3 concrete code references
- Read actual implementations, not just READMEs
- Look at PRs for context on why patterns were adopted
- Compare at least 2 approaches when evaluating alternatives

### Phase 4: Synthesize RFC

Structure the output using the RFC template below. Every claim must link to evidence found in Phase 3.

**RFC Document Structure:**

```markdown
# RFC: [Title]

**Status:** Draft
**Date:** [today]
**Author:** [user or team]

## 1. Summary

[2-3 sentence overview of what this RFC proposes]

## 2. Problem

[What problem exists today? Why does it matter?]
[Include metrics, pain points, or user feedback if available]

## 3. Context & Prior Art

[What exists today in the ecosystem?]
[How do other projects/teams solve this?]

For each prior art finding:
- **[Project/Library]**: [How they solve it]
  - Evidence: [GitHub URL with line numbers]
  - Tradeoffs: [What they gain/lose]

## 4. Proposal

[Detailed description of the proposed solution]
[Include code examples, API sketches, or architecture diagrams]

### 4.1 Design Decisions

[Key decisions and their rationale, backed by research]

| Decision | Choice | Rationale | Evidence |
|----------|--------|-----------|----------|
| [What] | [Chosen approach] | [Why] | [link] |

### 4.2 Implementation Outline

[High-level steps to implement]

## 5. Alternatives Considered

For each alternative:
### 5.N [Alternative Name]
- **Description:** [What this approach does]
- **Pros:** [Advantages]
- **Cons:** [Disadvantages]
- **Evidence:** [Links to repos/code using this approach]
- **Why not:** [Specific reason for rejecting]

## 6. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk] | Low/Med/High | Low/Med/High | [How to address] |

## 7. Open Questions

[Unresolved items that need further discussion or decision]

## 8. References

[All GitHub URLs, docs, and sources cited in this RFC]
```

### Phase 5: Roast & Distill

Before delivering, ruthlessly edit the RFC down to only what a senior engineer needs to make a decision. The goal is a short, high-signal document — not a comprehensive essay.

**Kill on sight:**
- Obvious statements ("We need good performance", "Security is important")
- Generic risks that apply to literally any project ("Team needs to learn new tool", "Migration takes time")
- Filler prior art that doesn't actually inform the decision — if a project is mentioned but doesn't change your recommendation, cut it
- Hedging language ("It might be worth considering", "One could argue") — take a position or remove the sentence
- Redundant alternatives where the "Why not" is already obvious from the proposal section
- Empty open questions that are really just rephrased risks

**Compress:**
- Prior Art: keep only findings that directly influenced the proposal or ruled out an alternative. Max 3-4 entries.
- Alternatives: only the 1-2 strongest contenders that a reviewer might actually push back with. Kill the rest.
- Risks table: max 3 rows. If a risk is low-likelihood AND low-impact, it doesn't belong in the RFC.
- Implementation outline: bullet points only, no paragraphs. Max 5-7 steps.
- Design decisions table: every row must have an evidence link. No link = cut the row or find one.

**Tighten:**
- Summary should be exactly 2-3 sentences. If you need more, the proposal isn't clear enough.
- Problem section: max 1 paragraph. If the reader doesn't feel the pain in 3 sentences, rewrite.
- Total RFC length target: under 500 lines of markdown. If longer, keep cutting.

Re-read the entire RFC after editing. If any section makes you think "obviously" — that section shouldn't exist.

### Phase 6: Deliver

1. Save the RFC to `docs/rfcs/NNNN-[slug].md`
2. Present a summary in the conversation with key findings and the file path

## Research Quality Gates

Before completing each research question, verify:
- [ ] At least 2 concrete code references (file:line or GitHub URL)
- [ ] Actual source code was read, not just repo descriptions
- [ ] Both positive evidence (this works) and negative evidence (this doesn't) considered

Before completing the RFC, verify:
- [ ] Every claim in "Prior Art" has a GitHub link
- [ ] "Alternatives Considered" has real-world examples, not hypotheticals
- [ ] "Risks" are grounded in evidence, not speculation
- [ ] "Open Questions" are genuine unknowns, not lazy gaps

## Troubleshooting

**No results from octocode:**
- Broaden search terms, try synonyms
- Search by topic instead of keyword
- Try a different owner/repo combination

**Too many results:**
- Add `owner` and `repo` filters
- Use `path` filter to narrow to specific directories
- Filter by `stars` for quality signal

**Can't find prior art:**
- This is a valid finding - document it as "novel approach" in the RFC
- Search for the problem being solved, not the specific solution
- Look at adjacent ecosystems (e.g., if no React solution, check Vue/Angular)

## References

- For the full RFC template, see [references/rfc-template.md](references/rfc-template.md)
