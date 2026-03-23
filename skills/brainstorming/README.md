# brainstorming

Explore user intent, constraints, and design **before** any implementation. The agent asks clarifying questions, proposes approaches, presents an approved design, then writes a design doc—no coding until the user signs off.

## Prerequisites

- None for the core skill (dialogue + design doc)
- Optional **visual companion**: Node.js and `npm install` in [`scripts/`](scripts/) if you use the local brainstorming server (see `scripts/start-server.sh`)

## Install

### Via skills CLI

```bash
npx skills add https://github.com/vltansky/skills --skill brainstorming
```

Useful variants:

```bash
npx skills add https://github.com/vltansky/skills --skill brainstorming -g
npx skills add https://github.com/vltansky/skills --skill brainstorming -g -y
```

### Manual

```bash
git clone https://github.com/vltansky/skills.git
cp -r skills/brainstorming ~/.claude/skills/brainstorming
```

## Usage

Trigger phrases:

- "Brainstorm this feature before we build"
- "I need a design before implementation"
- "Explore requirements for [idea]"

The skill is intended to run **before** creative or behavioral changes; it pairs with follow-on planning skills after the design is approved.

## License

MIT
