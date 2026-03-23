---
name: interview
description: Conduct a structured, branching interview to refine a plan into an actionable specification. Use when the user asks to "interview me about the plan", refine implementation decisions, or turn a draft plan into an implementation-ready spec.
---

# Plan Interview

Deep-dive interview to refine a plan into an actionable spec using an interactive question tool when available.

## Critical Rules

1. **USE interactive tool if available** - use structured choices in an interactive question tool; otherwise use numbered inline options
2. **ALWAYS show progress** - display section, question count, and confidence %
3. **NEVER ask obvious questions** - skip anything inferable from context
4. **WAIT between sections** - let user opt-out before each block
5. **BRANCH based on answers** - architecture decisions unlock specific follow-ups

## Interview Structure

### Section Order (most -> least critical)

1. **Architecture** (critical) - tech stack, data model, system boundaries
2. **Core Logic** (critical) - main algorithms, state management, key flows
3. **Integration** (important) - APIs, external services, auth
4. **UI/UX** (important) - layouts, interactions, edge states
5. **Edge Cases** (nice-to-have) - error handling, validation, fallbacks
6. **Polish** (nice-to-have) - performance, accessibility, future-proofing

## Workflow

### Step 0: Read Plan + Initial Assessment

If a plan file path was provided, read it first. If no plan is available, ask for the plan content before proceeding.

Analyze for gaps, then provide upfront estimates:

```
--- Initial Assessment ---

Plan clarity: ~65% (gaps in: data model, auth strategy)
Estimated questions: 12-18 (depends on your answers)
Estimated time: 10-15 min

Note: These are rough estimates. Questions branch based on
your answers - choosing React unlocks state mgmt questions,
choosing REST API unlocks auth questions, etc.
```

----------

### Step 1: Present Interview Overview

Show:
```
Interview Structure:
---------------------
[□□□□□□] Architecture (~4-6 questions) - CRITICAL
[□□□□□□] Core Logic (~3-5 questions) - CRITICAL
[□□□□□□] Integration (~2-4 questions) - important
[□□□□□□] UI/UX (~2-4 questions) - important
[□□□□□□] Edge Cases (~1-2 questions) - nice-to-have
[□□□□□□] Polish (~1-2 questions) - nice-to-have

Est. total: 12-18 questions (varies based on your answers)
Commands: "done" | "skip" | "?" (defer) | "back"
Minimum viable: Architecture + Core Logic (target: 80%+ confidence)
```

----------

### Step 2: Interview Loop

For each section:

1. **Announce section start:**
   ```
   --- ARCHITECTURE (critical) ---
   Questions: 4 | Est: 5 min
   Skip this section? (y/n, default: n)
   ```

2. **Ask questions one at a time:**
   - Interactive question tool: use structured options
   - Fallback: inline numbered options and wait for reply
   - Header: `--- SECTION (X/6) ---`
   - Counter: `[Topic N/M] ~X min left`
   - Options with tradeoffs: `(+overhead)`, `(couples to X)`
   - Impact: `-> Affects: X, Y`

3. **Branch based on answers:**
   - React -> ask about state management
   - API-first -> ask about auth strategy
   - Skip irrelevant questions (do not ask about SSR if SPA chosen)

4. **After section, show confidence + updated estimate:**
   ```
   ✓ Architecture complete | Confidence: 75%

   Progress: 5/~14 questions (was 12-18, now refined)
   Remaining: ~9 questions across 5 sections

   Next: Core Logic (critical, ~3 questions)
   Continue? (y/skip/done)
   ```

### Step 3: Generate Spec

When user says "done" or all sections complete:
- summarize answers
- write refined spec to the target plan file (if path exists) or provide the full spec in chat
- note any unanswered sections as `TBD - decide during implementation`

## Question Guidelines

**Ranking options:**
- rank by: most common pattern -> project-specific best fit -> alternatives
- mark recommendation only when confidence >70%
- always include `other` option for open-ended paths

**Question format (interactive):**
```
--- ARCHITECTURE (1/6) ---
[State 1/4] ~3 min left

How handle state?

1. Zustand [rec: small app, minimal boilerplate]
2. Redux Toolkit (+overhead, need devtools?)
3. React Context (won't scale)
4. Other

-> Affects: components, testing
```

**Question format (inline fallback):**
```
--- ARCHITECTURE (1/6) ---
[State 1/4] ~3 min left

How handle state?

1) Zustand [rec: small app, minimal boilerplate]
2) Redux Toolkit (+overhead, need devtools?)
3) React Context (won't scale)
4) Other

-> Affects: components, testing

Reply: 1/2/3/4 or ? to defer
```

**Option format:**
- recommended: `[rec: WHY]` with brief reasoning
- others: `(tradeoff)` with brief downside
- max 5-7 words per option line
- skip filler words (a/the); abbreviations are acceptable where clear

**Format rules:**
- section: `(1/6)` not verbose phrasing
- time: `~3 min left` not long form
- recommendation must include reason in `[rec: reason]`
- tradeoffs should be concise: `(+overhead)`, `(won't scale)`

**Branching examples:**
- "React" -> unlock state mgmt, component patterns, testing library
- "REST API" -> unlock auth strategy, versioning, rate limiting
- "SPA" -> skip SSR, hydration, edge caching questions

## Exit Behavior

| Command | Action |
|---------|--------|
| `done` | Stop interview and generate spec with current info |
| `skip` | Skip current section and continue to next |
| `?` | Defer this question (mark as deferred in spec) |
| `back` | Revisit previous question |

**Defer handling (`?`):**
- mark question as deferred in spec
- at end: `You have 3 deferred items. Revisit? (y/n)`
- include default recommendation for each deferred item

**Critical exit warning:**
If exiting with confidence <70% on critical sections:
```
Warning: Confidence 45% (below 70% threshold)
Missing: data model, API structure
Risk: may require rework later.
Continue anyway? (y/n)
```

## Output

Write refined spec to target with:

**Header:**
```
## Interview Summary
Confidence: 82% | Questions: 11 asked | Sections: 4/6 | Deferred: 2
Initial estimate was 12-18 questions - actual: 11 (SPA path skipped SSR questions)
```

**Body:**
- answered decisions inline
- TBD markers for skipped items
- deferred markers with recommended default

**Footer:**
```
## Deferred Decisions
- [ ] State management (recommended: Zustand)
- [ ] Error boundary strategy (recommended: per-route)

## Skipped Sections
- Edge Cases (nice-to-have)
- Polish (nice-to-have)
```
