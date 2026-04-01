# debug

Systematic root-cause debugging. Hypothesis-driven investigation with evidence collection. Works for backend, frontend, logic, and integration bugs.

## Install

```bash
npx skills add vltansky/skills/skills/debug -g -y
```

## Prerequisites

- Access to the codebase and its test runner
- For frontend-specific runtime debugging with a log server, use `/debug-mode` instead

## Usage

Trigger phrases:
- "debug"
- "investigate"
- "why is this broken"
- "root cause"
- "trace this bug"
- "figure out why"

## How it works

1. **Reproduce** — confirm the bug, minimize the repro
2. **Hypothesize** — 3-5 specific, testable hypotheses
3. **Investigate** — gather evidence, confirm/reject each hypothesis
4. **Isolate** — find the exact root cause (not symptoms)
5. **Fix** — TDD when possible (failing test → fix → verify)
6. **Verify** — prove it works, run full suite
7. **Prevent** — add test, search for siblings, guard boundaries

## Relationship to debug-mode

- `/debug` — general-purpose, any bug type, code-level investigation
- `/debug-mode` — frontend-specific, runtime log collection via browser + debug server

## License

MIT
