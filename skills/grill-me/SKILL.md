---
name: grill-me
description: Conduct a structured, adversarial interview to stress-test a plan or design until every weakness is found. Use when the user asks to "grill me about the plan", stress-test a design, poke holes in an approach, or challenge assumptions before implementation.
---

# Grill Me

Adversarial interview that stress-tests a plan by finding weaknesses, challenging assumptions, and probing edge cases — one question at a time.

<HARD-GATE>
Do NOT write code or begin implementation. The output of this skill is a stress-test report, not an implementation.
</HARD-GATE>

## Critical Rules

1. **ONE question at a time** — never bundle questions
2. **Use interactive prompts** — for every interactive prompt (dimension gates, each grilling turn, continue/skip/done, early exit), use the host’s **ask user question tool** when it exists. Include your recommended stance as an option plus alternatives such as defending a different choice, **I don't know**, **done**, **skip**, **back** as the flow requires. If the host has no ask user question tool, fall back to a single numbered or labeled reply block and wait for the user’s answer in chat.
3. **Devil's advocate** — assume flaws exist; your job is to find them
4. **Probe weakness** — if an answer is vague or hand-wavy, dig deeper on that branch before moving on
5. **Codebase over questions** — if a question can be answered by exploring the codebase, explore silently and present findings instead of asking
6. **Recommend with every question** — provide your suggested answer and why (surface it inside the ask user question tool’s options where it fits)
7. **Show progress** — display dimension, question count, and plan robustness %

## Step 0: Read Plan + Initial Assessment

Read the plan (file or context). Identify the weakest areas. Present:

```
--- Stress-Test Assessment ---

Plan robustness: ~50% (weakest areas: auth strategy, error handling, data model)
Estimated questions: 10-20 (depends on how well you defend)
Estimated time: 10-20 min

Grilling order (weakest first):
[██░░░░] Assumptions (~3-5 questions) - CRITICAL
[██░░░░] Feasibility (~2-4 questions) - CRITICAL
[░░░░░░] Edge Cases (~2-4 questions) - important
[░░░░░░] Security/Risk (~1-3 questions) - important
[░░░░░░] Maintainability (~1-2 questions) - nice-to-have
[░░░░░░] Scope (~1-2 questions) - nice-to-have

Commands: "done" | "skip" | "back" | "I don't know" (marks as unresolved)
```

## Grilling Dimensions (weakest-first order)

1. **Assumptions** (critical) — What's taken for granted? What if those are wrong?
2. **Feasibility** (critical) — Can this actually be built? Technical blockers? Dependencies?
3. **Edge Cases** (important) — What breaks under unusual inputs, load, timing, or user behavior?
4. **Security/Risk** (important) — Attack vectors, data exposure, failure modes, rollback?
5. **Maintainability** (nice-to-have) — Will this be painful to change in 6 months?
6. **Scope** (nice-to-have) — Over-engineered? Under-engineered? YAGNI violations?

## Grilling Loop

For each dimension:

1. **Announce dimension:**
   ```
   --- ASSUMPTIONS (critical) ---
   Questions: ~4 | Est: 5 min
   Skip this dimension? (y/n)
   ```

2. **Ask one question at a time** via the **ask user question tool** when available:
   - State the weakness or concern you see (in the question text or preamble)
   - Ask the user to defend their decision; provide your recommended answer and reasoning
   - Rate the concern: `[high]` `[medium]` `[low]`
   - **Call the ask user question tool** with one question and a small set of options (e.g. defend with your own reasoning, accept the recommendation, **I don't know**, **done**, **skip**, **back**) — never rely on freeform chat alone when the tool exists

3. **Branch on weak answers:**
   - Strong answer → move to next question
   - Vague/hand-wavy → follow up on the same topic, drill deeper
   - "I don't know" → log as unresolved, suggest a default, move on

4. **After each dimension:**
   ```
   ✓ Assumptions grilled | Robustness: 60% → 72%
   Issues found: 2 high, 1 medium
   Next: Feasibility (critical, ~3 questions)
   Continue? (y/skip/done)
   ```

## Exit Behavior

| Command | Action |
|---------|--------|
| `done` | Stop grilling, generate report with current findings |
| `skip` | Skip current dimension, continue to next |
| `back` | Revisit previous question |
| `I don't know` | Mark as unresolved with recommended default |

**Early exit warning (robustness < 60%):**
```
⚠ Plan robustness: 45% (below 60% threshold)
Unresolved: 3 high-severity issues
Risk: significant rework likely.
Stop anyway? (y/n)
```

## Output: Stress-Test Report

When done, produce:

**Header:**
```
## Stress-Test Report
Robustness: 78% | Questions: 14 | Dimensions: 4/6 | Unresolved: 2
```

**Issues by severity:**
```
### High Severity
- [ ] No auth strategy defined — recommend: JWT with refresh tokens
- [ ] Race condition in concurrent updates — recommend: optimistic locking

### Medium Severity
- [ ] No rate limiting on public endpoints — recommend: token bucket

### Low Severity
- [ ] Console.log left in error handler — recommend: structured logging
```

**Unresolved Decisions:**
```
### Unresolved (user deferred)
- [ ] Cache invalidation strategy (recommended: TTL-based with event-driven purge)
- [ ] Retry policy for external API calls (recommended: exponential backoff, max 3)
```

**Passed (well-defended):**
```
### Well-Defended
- ✓ Data model handles multi-tenancy correctly
- ✓ Deployment strategy covers zero-downtime rollback
```
