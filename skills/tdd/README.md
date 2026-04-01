# tdd

Test-driven development loop. Write failing test first, then implement to make it pass.

## Install

```bash
npx skills add vltansky/skills/skills/tdd -g -y
```

## Prerequisites

- A test runner (jest, vitest, pytest, go test, etc.) — auto-detected
- Existing test files to match patterns against (preferred but not required)

## Usage

Trigger phrases:
- "tdd"
- "test first"
- "write the test first"
- "failing test"
- "red green refactor"

Works standalone or as part of `/autopilot`'s execution phase.

## How it works

1. **Red** — write a test that fails (proves the bug exists or defines new behavior)
2. **Green** — write minimum code to make it pass
3. **Refactor** — clean up, re-run tests
4. **Commit** — atomic commits (test + implementation)

## License

MIT
