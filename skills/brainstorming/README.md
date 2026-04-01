# Brainstorming

Collaborative design skill that turns rough ideas into validated specs before any code is written. Asks clarifying questions one at a time, proposes approaches with trade-offs, and produces a design document for approval.

## Install

```bash
npx skills add vltansky/skills/skills/brainstorming -g -y
```

Or manually copy the `skills/brainstorming` directory to `.claude/skills/` in your project.

## Prerequisites

- None (works with any project)

## Usage

Triggers automatically before creative work — creating features, building components, adding functionality, or modifying behavior.

You can also invoke it explicitly:

- "brainstorm this feature"
- "let's design this before building"
- "I want to build X" (triggers brainstorming flow)
- `/brainstorming`

## What it does

1. Explores project context (files, docs, recent commits)
2. Asks clarifying questions one at a time
3. Proposes 2-3 approaches with trade-offs and a recommendation
4. Presents design in sections, getting approval after each
5. Writes a design doc and commits it
6. Self-reviews the spec for completeness
7. Waits for user approval before transitioning to implementation

## License

MIT
