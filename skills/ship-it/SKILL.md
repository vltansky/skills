---
name: ship-it
description: "Create a GitHub PR with conventional format and AI session context. Use when user says 'create PR', 'open PR', 'submit changes', 'send to dev', 'ship it', or is done with their task."
---

# Create PR

## Step 1: Check state

```bash
git branch --show-current && git status -s && git diff HEAD --stat
```

- Detect username: `git config user.name` or extract from branch prefix
- If on `master`/`main`/`prod`: create a feature branch:

```bash
git checkout -b <username>/<feature-name>
```

Branch name from the diff context — short, descriptive, kebab-case.

## Step 2: Commit + Push

If uncommitted changes exist:

**If staged files exist** (respect user's selection):
```bash
git commit -m "<msg>" && git push -u origin HEAD
```

**If no staged files** (stage everything):
```bash
git add . && git commit -m "<msg>" && git push -u origin HEAD
```

Commit message: conventional format (`feat:`, `fix:`, `refactor:`, etc.), concise.

## Step 3: Generate AI Session Context

Generate a privacy-safe summary for reviewers from the current conversation.

You already have full context of:
- What problem was discussed
- What approaches were considered
- What decisions were made and why
- What trade-offs were evaluated

Synthesize directly from your memory of this session.

### What to include vs exclude

| Include | Exclude |
|---------|---------|
| Problem being solved | Exact user prompts |
| Solution approach chosen | Mistakes/failed attempts |
| Key decisions + WHY | Debugging struggles |
| Trade-offs considered | Personal info/credentials |
| Technical rationale | Anything embarrassing |

### Format as collapsible block

```markdown
<details>
<summary>AI Session Context</summary>

**Problem:** [1 sentence - what was broken/needed]

**Approach:** [1 sentence - solution strategy]

**Key Decisions:**
- [Decision]: [Rationale - the WHY]
- [Decision]: [Rationale - the WHY]

**Trade-offs Considered:**
- [Option A vs B]: Chose A because [reason]

</details>
```

### Skip Conditions

Skip AI Session Context if:
- Trivial change (typo, version bump, config)
- No meaningful decisions were made
- User says "no context" or "skip context"

## Step 4: Create PR

**Format:**
```
<feature_area>: <Title> (80 chars max)

<TLDR> (1-2 sentences)

- bullet 1
- bullet 2

<details>
<summary>AI Session Context</summary>
...
</details>
```

```bash
gh pr create --title "<title>" --body "<body>"
```

Display the returned PR URL on its own line so it's clickable.
