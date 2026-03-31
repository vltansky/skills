# Standalone PR Walkthrough App Design

- Date: 2026-03-30
- Status: Draft
- Owner: vltansky
- Chosen approach: Approach C, constrained

## 1. Goal

Build a standalone local app that helps a human review AI-heavy PRs by walking them through the change before they read the raw diff.

The app is not a code host replacement, not an auto-review bot, and not a full diff viewer. Its job is to reduce time-to-orientation and make reviewer feedback sharper.

## 2. Product Shape

The product is a local review workspace for one PR at a time.

Core flow:
1. Generate a structured walkthrough brief for a PR.
2. Open the standalone app on that brief.
3. Let the reviewer annotate brief sections and linked evidence.
4. Send structured feedback back to the agent.
5. Regenerate the brief while preserving reviewer context where possible.

Hard boundary:
- The brief is the primary object.
- Drill-down exists only as supporting evidence.
- No GitHub replacement workflow in v1.
- No cloud backend in v1.
- No multi-reviewer collaboration in v1.

## 3. Why This Shape

The main problem is reviewer orientation, not issue detection. A reviewer often needs to understand:
- what changed at the subsystem level
- which files are central versus incidental
- what design or architecture moves matter
- where the author or model looks low-confidence
- what to inspect first

Starting from the raw diff is the wrong default. The product should start from a reviewer brief and only open code evidence on demand.

## 4. Architecture

The app is split into five units.

### 4.1 Brief Generator

Produces a `WalkthroughBrief` from PR, diff, and code context.

Responsibilities:
- identify the main change clusters
- generate the reviewer narrative
- extract architecture and design deltas
- identify low-confidence zones
- propose reviewer questions
- attach evidence references

Non-goals:
- rendering the UI
- storing reviewer state

Allowed read sources:
- the `GenerateInput` payload
- local repository files reachable from the PR workspace
- git metadata available in the local checkout

The generator may read the local repository directly. Callers do not need to inline full code context into `GenerateInput`, but they must provide enough PR metadata and changed-file information for the generator to resolve the relevant workspace content.

### 4.2 Review Workspace

The standalone browser app.

Responsibilities:
- render the brief
- show the review path
- manage section navigation
- render drill-down evidence
- collect reviewer comments and actions

Non-goals:
- generating the brief
- full diff exploration outside referenced evidence

### 4.3 Evidence Resolver

Maps brief sections to code evidence.

Responsibilities:
- resolve file paths and line/hunk ranges
- provide excerpts and context
- keep drill-down scoped to referenced evidence

Non-goals:
- general repo search UI
- full code browser

### 4.4 Feedback Loop

Turns reviewer actions into structured feedback for the agent.

Responsibilities:
- capture comments on brief sections
- capture comments on code evidence
- capture reviewer intent
- support regeneration requests

Non-goals:
- PR approval automation
- GitHub comment sync

### 4.5 Session Store

Local-only session persistence.

Responsibilities:
- store the current brief
- store prior brief versions
- store reviewer feedback history
- keep regeneration state stable

Non-goals:
- multi-project history product
- remote sync

## 5. UX Model

V1 uses a two-pane workspace.

### 5.1 Left Pane: Review Brief

Contains:
- PR title and summary
- ordered review path
- section cards
- reviewer questions
- section status: untouched, commented, resolved, changed-after-regeneration

Section types:
- narrative
- architecture delta
- design delta
- low-confidence zone
- question

### 5.2 Right Pane: Drill-Down Evidence

Contains:
- linked code excerpts
- file and hunk references
- short explanation of why the evidence supports the section

Key rule:
the reviewer never starts from raw code. They start from the brief and open evidence only when needed.

### 5.3 Reviewer Actions

The reviewer can:
- comment on a brief section
- comment on a code evidence excerpt
- mark a reviewer question as resolved
- request regeneration
- approve the brief as sufficient for review

### 5.4 Regeneration Behavior

Regeneration must:
- preserve comments when section IDs survive
- clearly mark changed sections
- avoid silently reordering the reviewer's context

## 6. Data Model

Markdown is not the source of truth. Structured JSON is.

### 6.1 WalkthroughBrief

```ts
type WalkthroughBrief = {
  pr_id: string;
  version: number;
  base_ref?: string;
  head_ref?: string;
  title: string;
  summary: string;
  review_path: ReviewPathStep[];
  sections: BriefSection[];
};

type ReviewPathStep = {
  id: string;
  label: string;
  why_read_it_now: string;
  section_ids: string[];
};

type BriefSection = {
  id: string;
  kind: "narrative" | "architecture_delta" | "design_delta" | "low_confidence" | "question";
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
  evidence_refs: EvidenceRef[];
  drilldown_targets: DrilldownTarget[];
};

type EvidenceRef = {
  id: string;
  stable_key: string;
  file_path: string;
  start_line?: number;
  end_line?: number;
  excerpt: string;
  rationale: string;
};

type DrilldownTarget = {
  file_path: string;
  start_line?: number;
  end_line?: number;
};
```

### 6.2 ReviewerFeedback

```ts
type ReviewerFeedback = {
  session_id: string;
  brief_version: number;
  intent: "clarify" | "revise_brief" | "revise_code" | "approve_brief";
  comments: ReviewerComment[];
  open_questions: string[];
};

type ReviewerComment = {
  id: string;
  target_type: "section" | "evidence";
  target_id: string;
  target_brief_version: number;
  body: string;
};
```

### 6.3 ReviewSession

```ts
type ReviewSession = {
  session_id: string;
  status: "open" | "awaiting_regeneration" | "closed";
  source_revision: {
    base_ref?: string;
    head_ref?: string;
  };
  current_brief: WalkthroughBrief;
  prior_briefs: WalkthroughBrief[];
  feedback_log: ReviewerFeedback[];
  metadata: SessionMetadata;
};

type SessionMetadata = {
  superseded_sections: Array<{
    old_section_id: string;
    new_section_ids: string[];
  }>;
  regeneration_failures: Array<{
    brief_version: number;
    reason: string;
    recorded_at: string;
  }>;
};
```

Critical rule:
section IDs must stay stable across regeneration whenever the section is semantically the same.

Section mapping rules during regeneration:
- unchanged section: keep the same `id`
- renamed section with the same underlying meaning: keep the same `id`
- reordered section: keep the same `id`
- split section: retire the old `id`, create new section IDs, and record the old section as superseded by the new IDs in session metadata
- merged sections: create a new section ID and record the prior section IDs as superseded
- deleted section: keep historical comments attached to the old brief version only
- newly created section: assign a new section ID

Evidence stability rule:
- `EvidenceRef.id` is unique within one brief version.
- `EvidenceRef.stable_key` is the cross-version identity used for migration when the underlying evidence is semantically the same.
- If evidence cannot be matched across versions, evidence comments remain attached to the older brief version and are shown as historical, not silently migrated.

## 7. Command Flow

V1 should have a small local command surface.

### 7.1 `generate`

Inputs:
- `GenerateInput`

```ts
type GenerateInput = {
  pr_id: string;
  title: string;
  base_ref?: string;
  head_ref?: string;
  changed_files: Array<{
    file_path: string;
    patch?: string;
  }>;
  repo_metadata?: {
    default_branch?: string;
    languages?: string[];
  };
};
```

Output:
- `GenerateOutput`

```ts
type GenerateOutput = {
  brief: WalkthroughBrief;
  session: ReviewSession;
};
```

### 7.2 `open`

Starts the standalone app on a given session.

Responsibilities:
- boot local server
- open browser
- load current brief

### 7.3 `submit-feedback`

Submits `ReviewerFeedback` back to the agent.

Responsibilities:
- validate payload shape
- persist feedback locally
- invoke the regeneration path if requested

Transport contract:
- `submit-feedback` always appends feedback to the active session.
- if `intent` is `clarify` or `approve_brief`, the command returns an acknowledgement only
- if `intent` is `revise_brief` or `revise_code`, the command triggers regeneration and returns a new `WalkthroughBrief`
- regeneration ownership belongs to the feedback loop command, not the browser UI directly
- on regeneration failure, the active session remains on the previous brief version and the failure is recorded in metadata

Public/internal boundary:
- `submit-feedback` is the public command used by the app
- `regenerate` is an internal workflow step invoked by `submit-feedback` for revise intents
- external callers should not call `regenerate` directly in v1

### 7.4 `regenerate`

Produces a new `WalkthroughBrief` version from prior brief + reviewer feedback.

Responsibilities:
- preserve section identities where possible
- mark changed sections
- update the active session

Versioning rules:
- the initial brief starts at `version: 1`
- each successful regeneration increments `WalkthroughBrief.version` by `1`
- `ReviewSession.current_brief` always points to the latest successful version
- previous versions are appended to `prior_briefs` unchanged
- feedback must always specify the `target_brief_version` it was authored against

### 7.5 `close`

Finalizes the session and persists the bundle locally.

## 8. Local Storage

Each review gets a session directory.

Suggested contents:
- `session.json`
- `brief.v1.json`
- `brief.v2.json`
- `feedback.1.json`
- `metadata.json`

Requirements:
- local only
- easy to inspect manually
- deterministic filenames
- no database in v1

Persistence requirement:
- both `WalkthroughBrief` and `ReviewSession` must persist the source revision (`base_ref`, `head_ref`) that produced the current brief so reopening or regenerating the session cannot silently drift to a different local checkout state

Lifecycle model:
- `open`: active session with editable brief
- `awaiting_regeneration`: feedback submitted and a replacement brief is in flight
- `closed`: review session finalized by user action

Transitions:
- `open -> awaiting_regeneration` on `revise_brief` or `revise_code`
- `awaiting_regeneration -> open` on successful regeneration
- `awaiting_regeneration -> open` on regeneration failure, with the prior brief retained
- `open -> closed` on explicit close/finalize action

## 9. Reuse Strategy

Creator Kit is a source of primitives, not the product shell.

Reuse:
- local loopback server pattern
- callback transport
- regeneration/update transport
- session persistence ideas

Do not reuse as the core UI model:
- single-file annotation UX
- text-selection anchoring as the primary review abstraction
- “approve/request changes” semantics tied to file review

Reason:
the standalone app reviews walkthrough entities first, not arbitrary selected text in one file.

## 10. Non-Goals

V1 will not include:
- full diff viewer
- repo explorer
- GitHub comment sync
- inline code editing
- team collaboration
- remote storage
- PR inbox/history product

## 11. Risks

### 11.1 Scope Creep

Risk:
drill-down expands into a general diff viewer.

Mitigation:
only allow drill-down from explicit brief references.

### 11.2 Weak Regeneration Semantics

Risk:
comments are lost or detached after regeneration.

Mitigation:
stable section IDs and explicit changed-section markers.

### 11.3 Markdown Drift

Risk:
the product falls back to markdown blobs and loses structure.

Mitigation:
keep JSON as the source of truth and render from it.

### 11.4 Session Bloat

Risk:
the app turns into a history/notebook product too early.

Mitigation:
keep storage local and simple, with no history UI beyond the current session.

## 12. Success Criteria

The app succeeds when it becomes the default first step for reviewing AI-heavy PRs.

Signals:
- the app is used before opening the raw diff in at least 70% of target PR reviews during the evaluation window
- median time from session open to first reviewer comment is lower than the current cold-diff baseline
- at least 50% of reviewed sessions use regeneration for clarification or refinement rather than being abandoned after the first brief
- reviewer self-report after each session averages at least 4/5 on “this helped me orient faster”

Measurement definitions:
- target PR reviews: AI-heavy PR reviews that you intentionally route through this app during the trial
- evaluation window: the first 20 target PR reviews or 14 calendar days, whichever completes later
- current cold-diff baseline: the median time-to-first-review-comment measured from a comparable set of recent PR reviews where you started from the raw diff without this app

## 13. Recommended Next Design Step

Before implementation, define:
1. the exact `WalkthroughBrief` schema
2. the exact `ReviewerFeedback` schema
3. how section identity survives regeneration
4. the minimum drill-down payload needed for v1
