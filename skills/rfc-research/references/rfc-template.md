# RFC Template

Copy this template when creating a new RFC. Replace all `[bracketed]` placeholders.

---

# RFC: [Title]

**Status:** Draft | In Review | Accepted | Rejected | Superseded
**Date:** [YYYY-MM-DD]
**Author:** [Name / Team]
**Reviewers:** [Names or teams expected to review]
**Deciders:** [Who has final say]

## 1. Summary

[2-3 sentence high-level overview. A busy reader should understand the proposal from this alone.]

## 2. Problem

### What's wrong today?
[Describe the current state and its shortcomings]

### Who's affected?
[Users, teams, systems impacted]

### How bad is it?
[Quantify if possible: error rates, time wasted, user complaints, performance metrics]

## 3. Context & Prior Art

### Current State
[How is this handled today? What exists in the codebase?]

### Prior Art

#### [Project/Library A]
- **Approach:** [How they solve the same problem]
- **Source:** [GitHub URL with line numbers]
- **Tradeoffs:** [What they gain and lose]
- **Applicability:** [How relevant is this to our context?]

#### [Project/Library B]
- **Approach:** [How they solve the same problem]
- **Source:** [GitHub URL with line numbers]
- **Tradeoffs:** [What they gain and lose]
- **Applicability:** [How relevant is this to our context?]

### Industry Patterns
[Any relevant design patterns, architectural styles, or standards]

## 4. Proposal

### Overview
[Describe the proposed solution at a high level]

### Detailed Design

#### API / Interface
```typescript
// Proposed API surface
```

#### Architecture
[Describe how components interact. Use diagrams if helpful.]

#### Data Model
[Any new data structures, schemas, or storage changes]

### Design Decisions

| # | Decision | Choice | Rationale | Evidence |
|---|----------|--------|-----------|----------|
| 1 | [What was decided] | [What was chosen] | [Why] | [Link to supporting evidence] |
| 2 | | | | |

### Implementation Outline

1. **Phase 1:** [What to build first, why]
2. **Phase 2:** [What comes next]
3. **Phase 3:** [Final pieces]

### Migration / Rollout
[How to get from current state to proposed state. Breaking changes? Feature flags?]

## 5. Alternatives Considered

### Alternative A: [Name]
- **Description:** [What this approach does differently]
- **Pros:** [Advantages over the proposal]
- **Cons:** [Disadvantages vs the proposal]
- **Evidence:** [Real-world usage or code references]
- **Why not:** [Specific reason this wasn't chosen]

### Alternative B: [Name]
- **Description:** [What this approach does differently]
- **Pros:** [Advantages over the proposal]
- **Cons:** [Disadvantages vs the proposal]
- **Evidence:** [Real-world usage or code references]
- **Why not:** [Specific reason this wasn't chosen]

### Do Nothing
- **Description:** Keep the current approach
- **Pros:** No migration cost, no risk
- **Cons:** [Why the status quo is unacceptable]

## 6. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | [What could go wrong] | Low/Med/High | Low/Med/High | [How to prevent or handle] |
| 2 | | | | |

## 7. Success Criteria

[How will we know this worked?]
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]

## 8. Open Questions

- [ ] [Question that needs discussion before finalizing]
- [ ] [Question that can be deferred to implementation]

## 9. References

| # | Source | URL | Relevance |
|---|--------|-----|-----------|
| 1 | [Name] | [Full GitHub URL with lines] | [Why it matters] |
| 2 | | | |

---

## Appendix (optional)

### A. Glossary
[Define domain-specific terms]

### B. Related RFCs
[Links to related proposals]

### C. Changelog
| Date | Change | Author |
|------|--------|--------|
| [Date] | Initial draft | [Author] |
