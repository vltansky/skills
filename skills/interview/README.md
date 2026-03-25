# interview

Conduct a structured, branching interview to turn a draft plan into an implementation-ready specification—one section at a time, with visible progress and confidence.

Sections cover architecture, core logic, integration, UI/UX, edge cases, and polish. Answers unlock follow-up questions; the agent writes a refined spec at the end.

## Prerequisites

- A plan to refine (file path or pasted content)
- Optional: **ask user question tool** if your host supports it (the skill falls back to numbered options)

## Install

### Via skills CLI

```bash
npx skills add https://github.com/vltansky/skills --skill interview
```

Useful variants:

```bash
npx skills add https://github.com/vltansky/skills --skill interview -g
npx skills add https://github.com/vltansky/skills --skill interview -g -y
```

### Manual

```bash
git clone https://github.com/vltansky/skills.git
cp -r skills/interview ~/.claude/skills/interview
```

## Usage

Trigger phrases:

- "Interview me about the plan"
- "Turn this plan into a spec"
- "Refine implementation decisions for this design"
- "Walk me through decisions before I implement"

### Example

```
> Interview me about the plan in PLAN.md and write the spec back to PLAN.md
```

## License

MIT
