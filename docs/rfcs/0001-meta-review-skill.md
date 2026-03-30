# RFC: Add a `meta-review` Skill for Human PR Walkthroughs

**Status:** Draft
**Date:** 2026-03-29
**Author:** vltansky
**Reviewers:** skills repo maintainers
**Deciders:** skills repo maintainers

## 1. Summary

Add a `meta-review` skill whose job is to help a human review a PR, not to replace that review. The skill should answer: what changed, what design or architecture moves matter, where the author is likely low-confidence, and in what order the reviewer should inspect the change.

## 2. Problem

The bottleneck is no longer writing code; it is building the mental model needed to review AI-heavy changes. A reviewer often needs a guided walkthrough before they can even judge correctness: what moved, what assumptions changed, which parts are architectural versus mechanical, and where the code looks tentative or over-generated. Existing review skills tend to optimize for finding issues or fixing code; this skill should optimize for reviewer understanding and attention direction.

## 3. Prior Art

- **qodo-ai/pr-agent** separates review output from PR description and walkthrough-style summaries, which is evidence that human-facing explanation should be a first-class artifact instead of a side effect of raw findings. Evidence: https://github.com/qodo-ai/pr-agent/blob/main/pr_agent/tools/pr_reviewer.py#L82-L104.
- **coderabbitai/ai-pr-reviewer** stages review by summarizing file diffs, grouping related changesets, and only then doing detailed inspection. Evidence: https://github.com/coderabbitai/ai-pr-reviewer/blob/main/src/prompts.ts#L5-L76 and https://github.com/coderabbitai/ai-pr-reviewer/blob/main/src/prompts.ts#L78-L154.
- **reviewdog** preserves exact diff mapping and suppression metadata, which is useful because a walkthrough must stay anchored to changed lines and changed files rather than drift into generic commentary. Evidence: https://github.com/reviewdog/reviewdog/blob/master/filter/filter.go#L7-L25.
- **smontanari/code-forensics** shows that hotspot, ownership, and churn signals can help a reviewer decide where attention matters most, even before judging code quality. Evidence: https://github.com/smontanari/code-forensics/blob/main/lib/tasks/hotspot_analysis_tasks.js#L1-L29 and https://github.com/smontanari/code-forensics/blob/main/lib/tasks/social_analysis_tasks.js#L53-L139.

## 4. Proposal

Add a new skill named `meta-review` with a single core contract:

> “Walk me through this PR so I can review it well.”

The skill should not primarily emit bug findings, approval decisions, or auto-fixes. It should produce a reviewer briefing that helps the human understand the change and choose a review lens.

### 4.1 Reviewer Questions the Skill Must Answer

1. What changed at a system or feature level?
2. Which files are central versus incidental?
3. What architectural or design decisions changed?
4. Where does the author look low-confidence or AI-generated?
5. What should I inspect first if I only have 5-10 minutes?
6. Which questions should I ask before approving?

### 4.2 Primary Output

The output should be a short walkthrough packet with these sections:

1. **One-paragraph change narrative**
   Explains the PR in subsystem terms, not file order.
2. **Review path**
   Recommends 3-6 files/modules in the order the reviewer should read them.
3. **Architecture / design delta**
   Calls out boundary changes, new abstractions, ownership shifts, public API changes, schema/config changes, and coupling changes.
4. **Low-confidence zones**
   Flags areas that look stitched together, weakly justified, inconsistent with nearby patterns, or insufficiently validated.
5. **Questions to resolve**
   Gives the reviewer a small set of concrete questions to answer before merge.
6. **Optional lenses**
   Lets the user ask for `architecture`, `design`, `behavior`, `low-confidence`, or `tests` mode for a second pass.

### 4.3 Suggested Output Contract

```ts
type ReviewLens = 'architecture' | 'design' | 'behavior' | 'low-confidence' | 'tests';

type WalkthroughStep = {
  target: string;
  why_read_it_now: string;
  what_to_look_for: string;
};

type Delta = {
  area: 'architecture' | 'design' | 'api' | 'data-flow' | 'tests';
  summary: string;
  evidence: string[];
};

type Concern = {
  level: 'high' | 'medium';
  kind: 'low-confidence' | 'design-tension' | 'unclear-intent' | 'regression-surface';
  summary: string;
  evidence: string[];
  reviewer_question: string;
};

type MetaReviewWalkthrough = {
  narrative: string;
  review_path: WalkthroughStep[];
  deltas: Delta[];
  concerns: Concern[];
  suggested_lenses: ReviewLens[];
};
```

## 5. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Main job | Guided walkthrough, not issue list | The bottleneck is reviewer orientation, not issue generation. |
| Organizing unit | Subsystems and intent, not raw file order | File-by-file summaries are noisy; grouped changesets are easier to understand. Supported by CodeRabbit's summarize-and-group flow: https://github.com/coderabbitai/ai-pr-reviewer/blob/main/src/prompts.ts#L5-L76 |
| Evidence model | Every claim stays tied to changed files or lines | A walkthrough must stay anchored to the actual diff. Supported by reviewdog's diff-linked diagnostic model: https://github.com/reviewdog/reviewdog/blob/master/filter/filter.go#L7-L25 |
| Human-facing output | Separate briefing from raw analysis | PR-Agent's separate summary/review artifacts show the value of a dedicated reviewer digest: https://github.com/qodo-ai/pr-agent/blob/main/pr_agent/tools/pr_reviewer.py#L82-L104 |
| Risk signals | Use hotspot/ownership signals as attention hints only | code-forensics is useful for “where to look first,” but should not dominate the walkthrough: https://github.com/smontanari/code-forensics/blob/main/lib/tasks/hotspot_analysis_tasks.js#L1-L29 |
| Interaction model | First give the walkthrough, then allow focused follow-up lenses | The reviewer often wants “explain first, inspect second.” |

## 6. Workflow

1. Determine scope from chat context, explicit files, or `git diff`.
2. Build a high-level map of the PR: entry points, touched subsystems, tests, configs, schemas, and external interfaces.
3. Group changed files into a few coherent change clusters.
4. Generate the walkthrough packet:
   - change narrative
   - review path
   - architecture/design deltas
   - low-confidence zones
   - reviewer questions
5. Offer lens-based follow-up:
   - `walk me through architecture`
   - `show me low-confidence parts`
   - `explain the design changes`
   - `what should I validate manually`

## 7. Implementation

1. Create `skills/meta-review/SKILL.md` and `skills/meta-review/README.md`.
2. Reuse the parallel-pass pattern from `simplify`, but change the passes to understanding-oriented roles:
   - change mapper
   - architecture/design explainer
   - low-confidence detector
   - reviewer-question generator
3. Add an aggregation step that merges the passes into one walkthrough packet instead of one finding list.
4. Ensure the default output is concise and ordered for reading, not exhaustive.
5. Add follow-up modes for deeper architecture/design/low-confidence exploration.
6. Update the root `README.md` skills table.

## 8. Alternatives

### 8.1 Build another code review skill

- Pros: familiar pattern.
- Cons: wrong problem. A normal review skill produces findings; this skill should produce understanding.
- Why not: it keeps the reviewer stuck at the same bottleneck.

### 8.2 Extend `simplify`

- Pros: existing multi-pass structure.
- Cons: `simplify` is a cleanup/fix workflow, not a reviewer briefing workflow.
- Why not: the contract would become muddled and the output would drift toward “issues to fix” instead of “how to review this PR.”

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| The walkthrough becomes a verbose file-by-file recap | High | Force grouping by subsystem/change cluster and cap the review path. |
| The skill invents intent where the code does not support it | High | Require evidence lines/files for every architecture or design claim. |
| “Low-confidence” labeling becomes vague or moralizing | Medium | Phrase it as reviewer attention guidance with concrete evidence and a question to validate. |

## 10. References

1. PR-Agent reviewer artifact setup: https://github.com/qodo-ai/pr-agent/blob/main/pr_agent/tools/pr_reviewer.py#L82-L104
2. CodeRabbit summary and triage prompts: https://github.com/coderabbitai/ai-pr-reviewer/blob/main/src/prompts.ts#L5-L76
3. CodeRabbit detailed review prompt: https://github.com/coderabbitai/ai-pr-reviewer/blob/main/src/prompts.ts#L78-L154
4. reviewdog filtered diagnostics: https://github.com/reviewdog/reviewdog/blob/master/filter/filter.go#L7-L25
5. code-forensics hotspot analysis: https://github.com/smontanari/code-forensics/blob/main/lib/tasks/hotspot_analysis_tasks.js#L1-L29
6. code-forensics ownership and coupling analysis: https://github.com/smontanari/code-forensics/blob/main/lib/tasks/social_analysis_tasks.js#L53-L139
