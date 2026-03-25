---
name: interview-octocode
description: Interview me about the plan with Octocode research
---

# Plan Interview + Octocode Research

Research-first interview: answer as many questions as possible via Octocode, only ask user for low-confidence decisions.

## Flow

```
READ PLAN → RESEARCH LOOP → SUMMARIZE → ASK REMAINING → GENERATE SPEC
```

## Critical Rules

1. **RESEARCH FIRST** - Try to answer every question via Octocode before asking user
2. **BATCH USER QUESTIONS** - Collect all low-confidence items, ask at end
3. **USE ask user question tool** — when the host provides it; otherwise numbered inline options
4. **SHOW YOUR WORK** - Display research findings as you go

## Confidence Levels

| Level | Action |
|-------|--------|
| ✅ HIGH (>80%) | Auto-answer, no user input needed |
| ⚠️ MED (50-80%) | Auto-answer with caveat, ask user to confirm at end |
| ❓ LOW (<50%) | Save for user, must ask |

## Workflow

### Step 0: Read Plan + Identify Questions

Read `$1`, extract all decision points:

```
─── Plan Analysis ───

Found 14 decision points across 6 sections:

Architecture (4): tech stack, db choice, auth, hosting
Core Logic (3): state mgmt, data flow, caching
Integration (2): API design, external services
UI/UX (3): component lib, styling, layouts
Edge Cases (1): error handling
Polish (1): performance

Starting research loop...
```

──────────

### Step 1: Research Loop

For each question, loop:

```
[1/14] Tech stack?
  → githubSearchCode: similar apps...
  → Found: Next.js dominates for this use case (cal.com, linear, vercel/commerce)
  → Confidence: HIGH (85%)
  → Auto-answer: Next.js + React

[2/14] Database?
  → packageSearch: prisma, drizzle...
  → githubSearchRepositories: postgres vs planetscale...
  → Found: Postgres+Prisma (35k★, used by cal.com/linear)
  → Confidence: HIGH (90%)
  → Auto-answer: Postgres + Prisma

[3/14] Auth strategy?
  → githubSearchCode: auth patterns in Next.js...
  → Found: NextAuth (18k★), Clerk (growing), Auth0 (enterprise)
  → Confidence: MED (65%) - multiple valid options
  → Saved for user: Auth strategy

[4/14] State management?
  → packageSearch: zustand, jotai, redux...
  → Found: Zustand (40k★), but app size unclear
  → Confidence: LOW (45%) - depends on app complexity
  → Saved for user: State management

...continues for all 14 questions...
```

**Loop rules:**
- Max 2-3 Octocode calls per question
- If confidence stays LOW after 2 attempts → save for user
- Track which questions need user input

──────────

### Step 2: Research Summary

After loop completes, show summary:

```
─── Research Complete ───

Auto-answered (HIGH confidence): 9/14
Need confirmation (MED confidence): 2/14
Need user input (LOW confidence): 3/14

## Decisions Made (HIGH confidence)

| Question | Answer | Evidence |
|----------|--------|----------|
| Tech stack | Next.js + React | cal.com, linear use this |
| Database | Postgres + Prisma | 35k★, type-safe |
| API design | tRPC | used by cal.com, type-safe e2e |
| Component lib | shadcn/ui | 50k★, Tailwind-based |
| ... | ... | ... |

## Need Confirmation (MED confidence)

| Question | Suggested | Why uncertain |
|----------|-----------|---------------|
| Auth | NextAuth.js | Clerk also valid, depends on OAuth needs |
| Hosting | Vercel | Railway also good if need more control |

## Need User Input (LOW confidence)

| Question | Options found | Why can't decide |
|----------|---------------|------------------|
| State mgmt | Zustand/Jotai/Context | Depends on app complexity |
| Caching | SWR/React Query/none | Depends on data patterns |
| Error handling | per-route/global/hybrid | Depends on UX preferences |

Ready to ask 5 questions. Continue? (y/n)
```

──────────

### Step 3: Interactive Questions (batch)

Ask all remaining questions using the **ask user question tool** (or numbered inline if unavailable):

**MED confidence (confirm or override):**

```
─── CONFIRM (1/2) ───

Auth strategy - I'm leaning NextAuth.js

Research found:
- NextAuth.js: 18k★, native Next.js, easy OAuth
- Clerk: 8k★, faster setup, hosted
- Auth0: enterprise, +cost

My recommendation: NextAuth.js [rec: most flexible, self-hosted]

1) Confirm NextAuth.js
2) Switch to Clerk (faster setup)
3) Switch to Auth0 (enterprise needs)
4) Other

Reply: 1/2/3/4
```

**LOW confidence (user decides):**

```
─── DECIDE (1/3) ───

State management - couldn't determine from research

Found options:
- Zustand: 40k★, minimal, good for small-med apps
- Jotai: 15k★, atomic, good for complex state
- React Context: built-in, simplest, doesn't scale

App complexity unclear from plan.

1) Zustand [rec if app is simple-medium]
2) Jotai [rec if complex atomic state]
3) React Context [rec if very simple]
4) Redux Toolkit [rec if team knows Redux]
5) Other

→ Affects: component structure, testing, bundle size

Reply: 1/2/3/4/5
```

──────────

### Step 4: Generate Spec

Combine auto-answers + user answers:

```
## Interview Summary
Questions: 14 total | Auto-answered: 9 | Confirmed: 2 | User decided: 3
Confidence: 88%

## Research References
- cal.com (architecture patterns)
- linear (similar product type)
- shadcn/ui (component patterns)
```

## Question Format

**MED confidence (confirm):**
```
─── CONFIRM (N/M) ───

[Topic] - I'm leaning [ANSWER]

Research found:
- Option A: [evidence]
- Option B: [evidence]

My recommendation: [ANSWER] [rec: WHY]

1) Confirm [ANSWER]
2) Switch to [ALT1]
3) Switch to [ALT2]
4) Other

Reply: 1/2/3/4
```

**LOW confidence (decide):**
```
─── DECIDE (N/M) ───

[Topic] - couldn't determine from research

Found options:
- Option A: [evidence]
- Option B: [evidence]

[Reason unclear]

1) [Option A] [rec if CONDITION]
2) [Option B] [rec if CONDITION]
3) Other

→ Affects: [X, Y, Z]

Reply: 1/2/3
```

## Examples

<example name="good-research-loop">
```
[3/14] Auth strategy?
  → githubSearchCode: "NextAuth" OR "Clerk" in Next.js apps
  → Found: NextAuth in cal.com, Clerk in shadcn
  → packageSearch: next-auth → 18k★, clerk → 8k★
  → Both valid, NextAuth more flexible, Clerk faster
  → Confidence: MED (65%)
  → Saved: Auth strategy (NextAuth recommended, Clerk alternative)
```
</example>

<example name="good-auto-answer">
```
[1/14] Tech stack?
  → githubSearchCode: scheduling app React
  → Found: cal.com (Next.js), calendly (React)
  → 90% of similar apps use Next.js
  → Confidence: HIGH (92%)
  → Auto-answer: Next.js + React
  → Reason: Industry standard for this app type
```
</example>

<example name="good-low-confidence">
```
[7/14] Caching strategy?
  → githubSearchCode: SWR vs react-query
  → Both have similar usage patterns
  → Can't determine without knowing data fetch patterns
  → Confidence: LOW (40%)
  → Saved: Caching strategy
  → Note: Need to ask about data patterns first
```
</example>

<example name="good-summary">
```
─── Research Complete (2 min) ───

✅ Auto-answered: 9/14
⚠️ Need confirm: 2/14
❓ Need input: 3/14

HIGH confidence decisions:
• Tech: Next.js (cal.com pattern)
• DB: Postgres+Prisma (35k★)
• API: tRPC (type-safe e2e)
• UI: shadcn/ui (50k★)
• Styling: Tailwind (standard)
• Forms: react-hook-form (37k★)
• Validation: zod (28k★)
• Testing: vitest+playwright
• CI: GitHub Actions

Need your input on 5 items. Ready? (y/n)
```
</example>

<example name="bad-asking-too-early">
```
[1/14] Tech stack?
What framework do you want to use?
1) Next.js
2) Remix
3) Other
```
Why bad: Didn't research first. Should auto-answer if HIGH confidence.
</example>

<example name="bad-over-researching">
```
[1/14] Tech stack?
  → githubSearchCode: Next.js...
  → githubSearchCode: Remix...
  → githubSearchCode: Gatsby...
  → githubSearchCode: Astro...
  → githubViewRepoStructure: cal.com...
  → githubGetFileContent: cal.com/package.json...
  → [10 more calls]
  → Confidence: HIGH (95%)
```
Why bad: Too many calls. 2-3 max per question. Stop when confidence HIGH.
</example>

## Octocode Tools Reference

| Tool | Use for |
|------|---------|
| `githubSearchCode` | Find patterns, see what others use |
| `packageSearch` | Get stars, downloads, repo location |
| `githubSearchRepositories` | Find similar projects |
| `githubGetFileContent` | Check specific implementations |
| `githubViewRepoStructure` | Understand project layout |
| `localSearchCode` | Check current codebase patterns |

**Research efficiency:**
- `packageSearch` first for library comparisons
- `githubSearchCode` for usage patterns
- Max 2-3 calls per question
- Stop when confidence HIGH
