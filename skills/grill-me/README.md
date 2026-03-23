# grill-me

Conduct a structured, adversarial interview to stress-test a plan or design until weaknesses and risky assumptions surface—before implementation.

The agent asks one question at a time, follows weakest areas first (assumptions, feasibility, edge cases, security, maintainability, scope), and ends with a stress-test report—not code.

## Install

### Via skills CLI

```bash
npx skills add https://github.com/vltansky/skills --skill grill-me
```

Useful variants:

```bash
npx skills add https://github.com/vltansky/skills --skill grill-me -g
npx skills add https://github.com/vltansky/skills --skill grill-me -g -y
```

### Manual

```bash
git clone https://github.com/vltansky/skills.git
cp -r skills/grill-me ~/.claude/skills/grill-me
```

## Usage

Trigger phrases:

- "Grill me about the plan"
- "Stress-test this design"
- "Poke holes in this approach"
- "Challenge my assumptions before I build this"

### Example

```
> Grill me about the plan in docs/feature-x.md
```

The skill will estimate robustness, grill dimension-by-dimension, and produce a severity-ranked stress-test report.

## License

MIT
