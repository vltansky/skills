# grill-me

Structured adversarial review for plans and designs.

`grill-me` is not a friendly brainstorming assistant. It is the skill you run when you want pushback before implementation starts.

It challenges the premise, compares alternatives, forces concrete choices (not vague acknowledgments), drills into weak branches until you defend or concede, scores readiness with a calibrated rubric, and finishes with a stress-test report and verdict.

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

1. Pre-scans the codebase for overlap, broken assumptions, and alternatives
2. Presents initial assessment with pre-scan findings
3. Challenges the premise before debating implementation details
4. Produces at least 2 approaches with a recommendation
5. Forces concrete defenses — drills into vague answers instead of moving on
6. Ends with a scored stress-test report and readiness verdict
7. Optionally runs an outside voice for blind-spot detection

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
