---
name: grill-me
description: Structured adversarial review that pushes back on a plan, challenges the premise, compares alternatives, and stress-tests the design until the main risks are explicit. Use when the user asks to "grill me", stress-test a plan, poke holes in an approach, challenge assumptions, pressure-test a design, or validate an early-stage idea before building ("I have an idea", "is this worth building", "grill me on this idea").
---

# Grill Me

Adversarial review for plans and designs. Find what breaks before implementation starts.

<HARD-GATE>
Do NOT write code or begin implementation. The output is a stress-test report and readiness verdict, not an implementation.
</HARD-GATE>

## Core Rules

1. **Push back first** — do not accept the framing just because the user proposed it.
2. **Evidence over opinion** — if the codebase, docs, or data can answer something, check before asking. Every question should carry evidence when available: file paths, numbers, existing patterns. "I found X that contradicts your plan" hits harder than "have you considered X?"
3. **Force choices, not acknowledgments** — every question must present a concrete alternative alongside the concern. The user picks between their approach and the alternative. If the user just says "good point" without changing anything, that is not a resolution — ask what specifically changes in the plan.
4. **Narrow vague answers** — if the user gives a partial answer, acknowledge the strong part and drill deeper on the weak part. If they say "we'll handle it later," ask: is there a ticket, a timeline, or is this "later" that means "never"? Do not move to the next dimension until the current question has a concrete resolution or is explicitly marked unresolved.
5. **One cluster at a time** — never bundle unrelated questions. Batch tightly coupled ones (max 3) when they share the same dimension and premise.
6. **Score on defense quality** — a strong defense with evidence earns points. A vague answer does not. "I don't know" is honest and acceptable (mark unresolved, provide a default). Hand-waving is not.
7. **User sovereignty** — the user has context you do not: domain knowledge, business timing, taste. Pressure-test the plan, do not seize control. If a subagent or outside analysis recommends a change, present it as a recommendation. Agreement is signal, not proof.
8. **Leave an artifact** — produce a report the user can refer to later. Persist to disk when a sensible project path exists.

## Subagents

Three uses, all optional. If the host does not support them, the main agent handles everything directly.

**Pre-scan** (before grilling): Launch 1 background subagent to gather ammunition while the main agent reads the plan. The subagent searches for: existing code that overlaps with the plan, assumptions that contradict the codebase, and simpler alternatives already in the repo. Its brief feeds into the initial assessment.

**During grilling**: Prepare evidence for the next dimension while the user answers the current question. Do not use subagents for scoring, user questions, or the blocking decision.

**Outside voice** (after verdict): Launch 1 subagent with fresh context. Give it the plan, a summary of the grill (questions asked, defenses given, unresolved items), and one instruction: "What did this review miss? What question should have been asked but wasn't?" Present findings. The user decides what to act on.

## Search Before Building

Before challenging a plan, check what already exists:

- **Layer 1 (tried and true)**: built-ins, standard patterns, battle-tested approaches
- **Layer 2 (new and popular)**: current best practices, ecosystem trends — scrutinize, don't trust blindly
- **Layer 3 (first principles)**: reason from the actual problem

Do not propose a custom solution until you have checked whether the runtime, framework, or repo already solves it. If first-principles reasoning contradicts conventional wisdom and the reasoning is strong, name it: `Eureka: the usual approach is wrong here because ...`

## Review Flow

### Step 0: Pre-scan

Before presenting anything to the user, gather context:

1. Read the plan, PRD, issue, or docs the user pointed to.
2. Read nearby docs, specs, and constraints in the repo.
3. Search for existing code that overlaps with what the plan proposes.
4. Check stated assumptions against what the code or docs actually show.
5. Note concrete alternatives found in the codebase or ecosystem.

If there is no codebase (pure idea, early-stage plan): note it and shift weight toward Assumptions and Feasibility dimensions. The absence of code to verify against is itself a risk factor.

If a background subagent is available, delegate steps 3-5 to it while doing steps 1-2 yourself.

### Step 0.5: Idea Sharpening (raw ideas only)

If the input is a raw idea rather than a formed plan — "I want to build X", "is this worth building", vague concept with no spec, doc, or structured approach — run this step to make the idea grillable. Skip if the user provided a plan, PRD, design doc, or structured proposal.

Ask these one at a time. Use the host's ask-user tool when available. Skip any question the user's initial prompt already answered.

1. **What problem does this solve?** Who has this problem today, and what are they doing about it right now — even badly?
2. **What's the smallest version?** What's the narrowest thing you could build that proves the idea works with real usage?
3. **What already exists?** What's the closest thing to this that people already use, and how is yours different?
4. **What's the strongest evidence someone wants this?** Not "people think it's interesting" — would anyone be upset if it disappeared?

If the user shows impatience ("just grill me", "skip the questions"): ask one more question (the most critical remaining one), then proceed. If they push back a second time, proceed immediately with what you have.

After this step, synthesize the answers into a working problem statement and proceed to the Initial Assessment. The answers feed directly into the Premise Challenge — they are the claims you will now stress-test.

### Step 1: Initial Assessment

Present a short assessment including pre-scan findings:

```text
--- Stress-Test Assessment ---

Initial readiness: 58/100
Weakest areas: premise, feasibility, edge cases
Estimated questions: 8-14
Estimated time: 10-20 min

Pre-scan findings:
- [what the pre-scan found: overlap, broken assumptions, alternatives]
- [or: "No codebase context — heavier weight on assumptions and feasibility"]

Review order (weakest first):
  Premise Challenge
  Assumptions
  Feasibility
  Edge Cases
  Security/Risk
  Maintainability
  Scope

Commands: done | skip | back | I don't know
```

The score is a calibrated estimate, not a measurement.

### Step 2: Premise Challenge

Mandatory. Before debating implementation, challenge whether the plan itself is the right move.

1. **Problem framing** — Is this solving the real problem, or just the user's current idea of the solution?
2. **Do-nothing baseline** — What happens if nothing is built? Real pain, or hypothetical?
3. **Smaller wedge** — What is the smallest version that proves the idea with real usage?
4. **Reuse vs rebuild** — What already exists that could be leveraged? (Use pre-scan findings.)
5. **Alternatives** — At least 2 approaches:

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

If the current plan is not the best path, say so directly and make the user defend it. Where useful, label each approach as tried-and-true, new-and-popular, or first-principles.

### Step 3: Dimension Grilling

Run remaining dimensions weakest-first. For each:

1. Announce the dimension and current score.
2. Ask the highest-leverage question first (batch up to 3 if tightly related).
3. Branch on the answer:
   - **Strong defense with evidence** → mark well-defended, move on
   - **Partial answer** → acknowledge the strong part, drill deeper on the weak part
   - **Vague answer** → do not accept. Rephrase more narrowly. Do not switch topics.
   - **"We'll handle it later"** → ask for the concrete plan: ticket? timeline? owner? If none exist, mark unresolved.
   - **"I don't know"** → mark unresolved, provide your default recommendation, apply score penalty, continue
   - **"Good point" with no plan change** → not a resolution. Ask: "What specifically changes in the plan?"
4. After the dimension:

```text
Dimension: Feasibility
Score: 62 → 71
Issues: 1 high, 2 medium
Unresolved: 1
Next: Edge Cases
```

If the user tries to exit early with score below 60:

```text
Warning: readiness is below 60/100.
This plan is still likely to cause avoidable rework.
Stop anyway?
```

### Step 4: Outside Voice (optional)

After all dimensions are scored, if the host supports subagents:

> "Want an outside voice? A fresh reviewer can look for what this grill missed. Takes about a minute."

If yes: launch a subagent as described in the Subagents section. Present its findings under an "Outside Voice" header. The user decides what to act on.

If no, or if subagents are unavailable: skip and proceed to the report.

### Step 5: Report

Produce the final report in chat. Persist to disk if possible (see Report section below).

## Grilling Dimensions

### Assumptions

- Hidden business or user assumptions
- Unstated invariants
- Ownership assumptions between systems
- Success criteria never defined
- Dependencies on perfect data, timing, or user behavior

### Feasibility

- Missing technical prerequisites
- Unrealistic effort or sequencing
- External dependencies or vendor limits
- Migration complexity
- Operational burden
- Places where the plan ignores existing code and rebuilds from scratch

### Edge Cases

- Empty and partial states
- Retries, timeouts, slow paths
- Concurrent edits or duplicate actions
- Auth/session drift
- Rollback and recovery paths
- Unusual but realistic user behavior

### Security/Risk

- Auth and authorization gaps
- Exposure of sensitive data
- Abuse paths and misuse
- Blast radius of failures
- Missing monitoring or rollback strategy

### Maintainability

- Unclear ownership boundaries
- Poor testability
- Too many moving parts
- Premature abstractions
- Likely pain in 3-6 months

### Scope

- Plan size vs learning value
- Unnecessary complexity
- Work that should be deferred
- YAGNI violations
- Whether the "minimal wedge" is actually minimal

## Question Format

For every question, use this structure. Only ask when the answer is both not obvious from context and important enough to change the recommendation or score.

1. **Re-ground**: The project, the plan, the exact decision being challenged. One sentence.
2. **Concern**: The weakness in plain English. Include evidence from the pre-scan when available.
3. **Recommendation**: `RECOMMENDATION: Choose [X] because [one-line reason]`
4. **Impact**: The consequence of getting this wrong. One sentence.
5. **Options**: A small set — typically:
   - Defend the current choice (explain why the alternative is wrong)
   - Accept the recommendation
   - Propose a modified approach
   - `I don't know` / `skip` / `done` / `back`

Include: `Concern:` high/medium/low and `Confidence:` high/medium/low.

Use the host's ask-user tool when available. If not, present the same structure in chat and wait.

### Batching

Batch questions (max 3) when they share the same dimension and premise. Prefer batching for premise challenge and low-medium severity probing. Prefer single questions for high-severity risks, vague answers, or controversial decisions.

If a background subagent can prepare evidence for the next batch, keep the current turn short and use its findings in the next turn.

## Scoring Rubric

Track readiness on a 100-point scale. Re-score after every dimension.

### Dimension weights

| Dimension | Weight |
|-----------|--------|
| Premise Challenge | 20 |
| Assumptions | 20 |
| Feasibility | 20 |
| Edge Cases | 15 |
| Security/Risk | 10 |
| Maintainability | 10 |
| Scope | 5 |

### Adjustments

- Unresolved high-severity: -10
- Unresolved medium-severity: -5
- Unresolved low-severity: -2
- Strong defense of a previously risky point: +2 (max per issue, cannot exceed dimension cap)

### Calibration

- **90-100**: Ready. Clear plan, low ambiguity, no major unresolved risks.
- **75-89**: Mostly ready. Some risk, but the build can start deliberately.
- **60-74**: Risky. Important gaps remain. Expect churn or rework.
- **<60**: Not ready. Under-specified or poorly framed.

Do not inflate the score to be polite.

## Report

### Save location

First reasonable match:

1. Existing plan/spec/docs directory in the repo
2. `docs/grill-me/`
3. `.ai/grill-me/`

If none are appropriate, skip persistence and say so.

Filename: `YYYY-MM-DD-<topic>-stress-test.md`

### Template

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

## Outside Voice Findings
- ... (if run)

## Recommended Next Step
- ...
```

## Verdict Rules

- **READY**: Score 75+ with no unresolved high-severity issues.
- **READY_WITH_RISKS**: Score 60-74, or 75+ with unresolved medium issues.
- **NOT_READY**: Score below 60, or any unresolved high-severity blocker.

## Style

Direct, skeptical, concrete. Push back on weak framing. No passive consultant tone. Name the flaw, why it matters, and what to do next. Prefer "I don't buy this yet because..." over soft hedging when the plan is weak.

The user should feel challenged, not stonewalled. Pressure-test the idea, then leave them with a sharper plan.
