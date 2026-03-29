# grill-me

Structured adversarial review for plans and designs.

`grill-me` is not a friendly brainstorming assistant. It is the skill you run when you want pushback before implementation starts.

It challenges the premise, compares alternatives, batches tightly related questions when that is faster, drills into weak branches one at a time when needed, scores readiness with a calibrated rubric, and finishes with a stress-test report and verdict.

When the host supports background subagents, `grill-me` can also use them to prepare the next batch of evidence while the main agent keeps the live review moving.

It should treat the user as a scarce, high-value resource: do not ask obvious questions, and never turn outside analysis into an automatic decision.

## What changed in v2

- Pushes back on the framing first, not just the implementation details
- Requires at least 2 approaches before settling on the plan under review
- Uses a fixed question format with recommendation, impact, and clear options
- Avoids obvious questions and only escalates real decision points to the user
- Searches existing patterns first, then reasons across tried-and-true, new-and-popular, and first-principles layers
- Names a `Eureka` explicitly when it finds a strong reason the conventional approach is wrong
- Scores readiness on a weighted 100-point rubric
- Produces a verdict: `READY`, `READY_WITH_RISKS`, or `NOT_READY`
- Persists a report to disk when a sensible project docs path exists

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

- "Grill me about this plan"
- "Stress-test this design"
- "Poke holes in this approach"
- "Challenge my assumptions before I build this"
- "Push back on this plan"

### Example

```text
> Grill me about the plan in docs/feature-x.md
```

Expected behavior:

1. Reads the plan and nearby code/docs
2. Challenges the premise before debating implementation details
3. Produces at least 2 approaches with a recommendation
4. Uses small batched question clusters when safe, then drills into weak answers one branch at a time
5. Ends with a scored stress-test report and readiness verdict

## File Layout

```text
grill-me/
├── SKILL.md
├── README.md
└── evals/
    └── evals.json
```

## License

MIT
