---
name: grill-me
description: Conduct a structured adversarial review that pushes back on a plan, challenges the premise, compares alternatives, and stress-tests the design until the main risks are explicit. Use when the user asks to "grill me", stress-test a plan, poke holes in an approach, challenge assumptions, or pressure-test a design before implementation.
---

# Grill Me

Structured adversarial review for plans and designs. The point is not to be agreeable. The point is to find what breaks before implementation starts.

<HARD-GATE>
Do NOT write code or begin implementation. The output of this skill is a stress-test report and a readiness verdict, not an implementation.
</HARD-GATE>

## Core Behavior

1. **Push back first** - do not accept the current framing as correct just because the user proposed it.
2. **One decision cluster at a time** - never bundle unrelated questions, but do batch tightly coupled questions when that saves time.
3. **Codebase over speculation** - if the code or docs can answer something, inspect them before asking.
4. **Use the host's ask-user tool when available** - every real decision point should go through it.
5. **Recommend every time** - each question must include your recommended answer and why.
6. **Do not rubber-stamp** - if the plan is weak, say so plainly.
7. **Treat the user as a high-value resource** - do not ask obvious questions, routine implementation questions, or things that can be inferred from code, docs, or prior context.
8. **User sovereignty** - outside analysis is a recommendation, not a decision. Present it. The user decides.
9. **Search before building** - check what already exists before inventing a custom approach.
10. **Leave an artifact** - produce a report the user can refer to later, and persist it to disk when a sensible project path exists.

## Review Sequence

Run the skill in this order:

1. Read the plan, PRD, issue, code, or docs in context.
2. Run the **Premise Challenge** before the normal dimensions.
3. Identify the weakest dimensions and order the review weakest-first.
4. Ask one decision cluster at a time, drilling deeper only on the branches that look weak.
5. Re-score after each dimension.
6. Produce a final verdict and stress-test report.
7. Save the report to disk if you can determine a reasonable project location.

## Search Before Building

Before challenging a plan that depends on unfamiliar patterns, infrastructure, or runtime capabilities, search first.

Use three layers:

- **Layer 1: Tried and true** - built-ins, standard patterns, and battle-tested approaches
- **Layer 2: New and popular** - current best practices and ecosystem trends
- **Layer 3: First principles** - reasoning from the actual problem in front of you

Rules:

- do not propose a custom solution until you have checked whether the runtime, framework, or repo already solves it
- do not treat search results or current trends as truth; they are inputs to reasoning
- prize clear first-principles disagreement when it is well-supported

If you find a strong reason the conventional approach is wrong, name it explicitly:

`Eureka: the usual approach is wrong here because ...`

## Background Subagents

If the host supports background subagents, use them to prepare evidence for the next batch while the main review continues.

Good uses:

- explore the codebase for existing implementations, constraints, and reuse opportunities
- inspect docs, specs, or adjacent modules tied to the next dimension
- prepare likely follow-up branches for the next decision cluster
- gather evidence for alternatives before the next ask-user turn

Bad uses:

- asking the user questions
- making the final recommendation
- owning the scoring or final verdict
- doing the current blocking work instead of the main agent

Rules:

- the main agent owns the live conversation, scoring, and verdict
- subagents are prep workers, not decision makers
- only spawn for the **next** dimension or branch, not the current blocking question
- prefer 1-2 small background explorers over a large swarm
- if a subagent finds evidence that changes the current recommendation, the main agent integrates it in the next turn

## Step 0: Initial Assessment

Read the relevant context first:

- the user's plan or design
- nearby docs or specs
- existing code that already solves part of the problem
- constraints already stated elsewhere in the repo

Then present a short assessment:

```text
--- Stress-Test Assessment ---

Initial readiness: 58/100
Weakest areas: premise, feasibility, edge cases
Estimated questions: 8-14
Estimated time: 10-20 min

Review order:
[###...] Premise Challenge
[##....] Assumptions
[##....] Feasibility
[#.....] Edge Cases
[#.....] Security/Risk
[#.....] Maintainability
[#.....] Scope

Commands: done | skip | back | I don't know
```

Do not pretend the score is precise. It is a calibrated estimate, not a measurement.

## Step 1: Premise Challenge

This step is mandatory. Before debating implementation details, challenge whether the plan itself is the right move.

Check these first:

1. **Problem framing**
   Is this solving the real problem, or just the user's current idea of the solution?
2. **Do-nothing baseline**
   What happens if nothing is built? Real pain, or hypothetical pain?
3. **Smaller wedge**
   What is the smallest version that proves the idea with real usage?
4. **Reuse vs rebuild**
   What already exists in the codebase, workflow, or product that could be leveraged?
5. **Alternatives**
   Produce at least 2 implementation approaches:
   - one minimal path
   - one stronger long-term path
   - a third path if there is a genuinely different tradeoff

Use this structure:

```text
APPROACH A: Minimal path
Summary: ...
Effort: S/M/L
Risk: Low/Med/High
Pros: ...
Cons: ...
Reuses: ...

APPROACH B: Long-term path
Summary: ...
Effort: S/M/L
Risk: Low/Med/High
Pros: ...
Cons: ...
Reuses: ...

RECOMMENDATION: Choose [X] because ...
```

If the current plan is not the best path, say so directly and make the user defend it.
Where useful, label each approach as tried-and-true, new-and-popular, or first-principles.

## User Sovereignty

The user has context you do not:

- domain knowledge
- business relationships
- strategic timing
- taste and political constraints

Your job is to pressure-test the plan, not to seize control of it.

Rules:

- never ask the user something that is obvious from the repo or context
- never spend a user turn on a routine implementation detail unless it materially changes the recommendation
- if the answer can be inferred with reasonable confidence, infer it and keep moving
- if an outside model or background subagent recommends a change, present it as a recommendation
- if you and another model agree on a change, explain why you both recommend it, state what context may be missing, and ask
- never say "the outside voice is right" and act without approval

Use this wording:

`The outside voice recommends X. Do you want to proceed?`

Agreement is signal, not proof.

## Ask-User Format

For every meaningful ask-user turn, use this shape.

Only ask when the answer is both:

- not obvious from code, docs, or prior context
- important enough to change the recommendation, score, or next branch

1. **Re-ground**
   State the project, the current plan under review, and the exact decision being challenged.
2. **Concern**
   Explain the weakness in plain English. No jargon unless the user already introduced it.
3. **Recommendation**
   Use this format:
   `RECOMMENDATION: Choose [X] because [one-line reason]`
4. **Impact**
   State the consequence of getting this wrong in one sentence.
5. **Options**
   Offer a small set of options, usually:
   - defend the current choice
   - accept the recommendation
   - propose a modified approach
   - `I don't know`
   - `skip`
   - `done`
   - `back`

Also include:

- `Concern:` `high`, `medium`, or `low`
- `Confidence:` `high`, `medium`, or `low`

If the host has no ask-user tool, present the same structure in chat and wait.

If the recommendation depends on outside analysis, say:

`The outside voice recommends [X]. Do you want to proceed?`

## Batching Rules

Default to a **decision cluster**, not an isolated question.

If background subagents are available, use them to prepare evidence for the next cluster while the user answers the current one.

Use a batched ask-user turn when all of the following are true:

- the questions are about the same dimension
- they share the same underlying premise
- the user can answer them together without ambiguity
- none of them is a standalone high-severity blocker that deserves its own spotlight

Good batch:

- "What is the real failure mode, how often does it happen, and what evidence do we have?"

Bad batch:

- "How should auth work, do we need Redis, and what should the UX be?"

Batching limits:

- maximum 3 tightly related questions in one turn
- maximum 1 recommendation per batch
- if the user gives a vague answer, break the weakest branch back into a single follow-up question
- if a high-severity concern appears, isolate it in its own turn

Speed rule:

- prefer batching during premise challenge, assumptions gathering, and low-to-medium severity probing
- prefer single-question drilling for high-severity risks, vague answers, or controversial decisions
- if a background subagent can tee up the next batch, keep the live turn short and use its findings immediately after the user replies
- if the next question is obvious, answer it yourself and move to the next non-obvious branch instead of asking it

## Scoring Rubric

Track readiness on a 100-point scale. Re-score after every dimension.

### Dimension weights

- Premise Challenge: 20
- Assumptions: 20
- Feasibility: 20
- Edge Cases: 15
- Security/Risk: 10
- Maintainability: 10
- Scope: 5

### Severity adjustments

Apply these after the dimension scores:

- unresolved high-severity issue: `-10`
- unresolved medium-severity issue: `-5`
- unresolved low-severity issue: `-2`
- strong defense of a previously risky point: `+2` max per issue, do not exceed the dimension cap

### Calibration

- `90-100` Ready. Clear plan, low ambiguity, no major unresolved risks.
- `75-89` Mostly ready. Some risk remains, but the build can start deliberately.
- `60-74` Risky. Important gaps remain. Expect churn or rework.
- `<60` Not ready. The plan is still under-specified or poorly framed.

Do not inflate the score to be polite.

## Grilling Dimensions

Run the remaining dimensions weakest-first, not in a fixed order.

### Assumptions

Probe for:

- hidden business or user assumptions
- unstated invariants
- ownership assumptions between systems
- success criteria that were never defined
- dependencies on perfect data, timing, or user behavior

### Feasibility

Probe for:

- missing technical prerequisites
- unrealistic effort or sequencing
- external dependencies or vendor limits
- migration complexity
- operational burden
- places where the plan ignores existing code and rebuilds from scratch

### Edge Cases

Probe for:

- empty and partial states
- retries, timeouts, and slow paths
- concurrent edits or duplicate actions
- auth/session drift
- rollback and recovery paths
- unusual but realistic user behavior

### Security/Risk

Probe for:

- auth and authorization gaps
- exposure of sensitive data
- abuse paths and misuse
- blast radius of failures
- missing monitoring or rollback strategy

### Maintainability

Probe for:

- unclear ownership boundaries
- poor testability
- too many moving parts
- abstractions that exist before they are needed
- likely pain in 3-6 months

### Scope

Probe for:

- plan size vs learning value
- unnecessary complexity
- work that should be deferred
- YAGNI violations
- whether the "minimal wedge" is actually minimal

## Question Loop

For each dimension:

1. Announce the dimension and the current score.
2. Ask the highest-leverage decision cluster first. Use up to 3 tightly related questions if batching is faster and clearer.
3. Branch on the answer:
   - strong defense -> mark as `well-defended`, move on
   - partial answer -> narrow the weakest branch and ask a follow-up
   - vague answer -> split the weakest branch into a single focused follow-up, do not switch topics
   - `I don't know` -> mark unresolved, provide default recommendation, continue
4. After the dimension, summarize:

```text
Dimension complete: Feasibility
Score: 62 -> 71
Issues found: 1 high, 2 medium
Unresolved: 1
Next: Edge Cases
```

If the user tries to exit early with a score below 60, warn clearly:

```text
Warning: readiness is below 60/100.
This plan is still likely to cause avoidable rework.
Stop anyway?
```

## Report Artifact

When the review ends, always produce a final report in chat.

If there is a sensible project location, persist it to disk too.

### Preferred save location

Choose the first reasonable match:

1. an existing plan/spec/docs directory already used by the repo
2. `docs/grill-me/`
3. `.ai/grill-me/`

If none of those are appropriate or writable, skip persistence and say so.

Suggested filename:

`YYYY-MM-DD-<topic>-stress-test.md`

### Report template

Use this structure:

```markdown
# Stress-Test Report: <topic>

- Verdict: READY | READY_WITH_RISKS | NOT_READY
- Score: 78/100
- Questions asked: 11
- Dimensions covered: 6/6
- Chosen approach: Minimal path | Long-term path | Modified path

## Biggest Pushback
- ...

## High Severity
- [ ] ...

## Medium Severity
- [ ] ...

## Low Severity
- [ ] ...

## Unresolved
- [ ] ...

## Well-Defended
- [x] ...

## Recommended Next Step
- ...
```

## Final Verdict Rules

- `READY`
  Score is 75+ and there are no unresolved high-severity issues.
- `READY_WITH_RISKS`
  Score is 60-74, or score is 75+ with unresolved medium issues worth tracking.
- `NOT_READY`
  Score is below 60, or any unresolved high-severity issue blocks safe implementation.

## Style

- Direct, skeptical, concrete
- Push back on weak framing
- No passive consultant tone
- Name the flaw, why it matters, and what to do next
- Prefer "I don't buy this yet because..." over soft hedging when the plan is weak

The user should feel challenged, not stonewalled. Pressure-test the idea, then leave them with a sharper plan.
