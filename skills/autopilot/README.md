# autopilot

Autonomous plan-to-code pipeline. Stress-tests the plan, fixes issues, creates a branch, instruments with debug logs, executes with TDD and parallel subagents, self-reviews, runs QA (debug logs provide runtime evidence), cleans up instrumentation, and hands back a shippable branch. Zero human interaction until the final handoff.

## Install

```bash
# Global install
npx skills add vltansky/skills/skills/autopilot -g -y

# Manual
cp -r skills/autopilot ~/.claude/skills/autopilot
```

## Prerequisites

- `git` — for branch creation, commits, and diff detection
- Project-specific tooling (test runner, type checker, linter) — auto-detected from CLAUDE.md or package.json

### Optional skills (loaded from disk if installed)

| Skill | Used in | Fallback |
|-------|---------|----------|
| [grill-me](../grill-me) | Phase 1 (Roast) | Lightweight built-in review |
| [tdd](../tdd) | Phase 3 (Execute) | Tests written after implementation |
| [debug](../debug) | Phase 3 (Execute) | Basic hypothesis-driven debugging |
| [simplify](../simplify) | Phase 4 (Review) | Lightweight self-review |
| [qa](../qa) + `agent-browser` | Phase 5 (QA) | Skipped |

## Usage

Trigger phrases:
- "autopilot"
- "just build it"
- "auto execute"
- "implement this plan"
- "take it from here"

Typical flow:
1. Create a plan (via `/grill-me`, RFC, or Claude plan mode)
2. Run `/autopilot`
3. Review the handoff summary
4. Ship with `/ship-it`

## How it works

1. **Roast** — loads grill-me and runs it autonomously (auto-decides all interactive questions)
2. **Fix** — applies roast findings directly to the plan
3. **Execute** — creates branch, adds debug instrumentation, groups steps into dependency layers, launches parallel subagents with TDD discipline
4. **Review** — collects pipelined review findings + runs simplify on the full diff
5. **QA** — browser-based testing in diff-aware mode (web apps only). Debug logs provide runtime evidence.
6. **Cleanup** — removes all debug instrumentation, verifies everything still passes
7. **Handoff** — presents results with decision log, guardrail status, and flagged items

Circuit breaker: if the plan scores below 60 (NOT_READY), autopilot stops and asks for human input.

## Debug + QA synergy

Debug instrumentation is added before execution and stays through QA. This means:
- Guardrail failures during execution have log context for diagnosis
- QA's browser testing captures debug output as runtime evidence
- After everything passes, instrumentation is removed cleanly

## License

MIT
