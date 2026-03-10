# Eval Categories for AGENTS.md / CLAUDE.md

## Rule Categories and Testability

### High-Value Eval Targets (test these first)

**Coupling / parity rules** — Models can't discover these from code structure:
- "When you change component A, also change component B" (e.g., inspector/auditor parity)
- "These 4 sections in this file must stay in sync" (e.g., config file multi-section sync)
- Cross-package dependencies that aren't visible from imports

**Workflow rules** — Models don't do these unprompted:
- TDD (write failing test first)
- Validation steps (run tsc/test/build before finishing)
- Branch naming conventions
- Commit message format
- PR workflow steps

**Decision style** — Models default to option menus:
- "Recommend one path, explain why" vs. listing 3-5 equal alternatives
- "What's next?" response contract (one recommendation first)
- Epistemic separation (known / inferred / uncertain)
- Leading with action, not theory

**Response format** — Some are model defaults, some aren't:
- Checklist as primary output (discriminating — models default to prose/guides)
- Leading recommendation before details (discriminating)
- tldr footer (often non-discriminating — model default in Claude Code)
- Separator lines (often non-discriminating)

### Low-Value Eval Targets (usually non-discriminating)

**Modern coding patterns** — Models already default to these:
- `type` over `interface`
- Arrow functions for components
- No `React.FC`
- Early returns (weakly discriminating)
- No unnecessary comments
- No `any` casts
- No unnecessary try/catch

**Tech stack / library choices** — Model discovers from existing code:
- React vs Angular (reads package.json and existing components)
- Which charting library to use (reads existing imports — Recharts, not tremor)
- Which UI library (reads existing imports — shadcn/ui)
- Which data-fetching library (reads existing hooks — TanStack Query)
- Path alias conventions (reads tsconfig.json)

**Helper functions / project patterns** — Model discovers from codebase:
- Firestore helper functions (companyCollection, serverTimestamp)
- Multi-tenant access patterns (reads existing service files)
- Validation patterns (Zod schemas in existing code)
- Language/locale (reads existing translation files, infers Hebrew/RTL)
- Date/timestamp conventions (reads existing model types)

**Design aesthetics** — Prompt-driven more than instruction-driven:
- Font choices (weak signal unless prompt is generic)
- Color palettes (model avoids AI slop when asked to "stand out")
- Animation patterns

### Untestable (keep regardless)

**Safety guardrails:**
- No force-push, reset --hard, rm -rf
- No dev server without permission
- Filesystem deletion restrictions

**Identity/preferences:**
- Author name, email
- No emojis in code/commits
- No "by claude" in commits
- Branch prefix

**Domain-specific (can't be inferred from code):**
- Parallel component parity requirements (e.g., inspector/auditor must change together)
- Multi-section sync requirements (e.g., config sections that must stay aligned)
- Tool-specific workflows (internal CLIs, custom toolchains)
- Platform-specific commands (signing, notarization)
- Internal URLs and configs
- Environment troubleshooting steps (VPN, proxy, etc.)

---

## Commit-Derived Eval Generation

The most reliable way to find discriminating rules is to analyze what the model gets wrong WITHOUT instruction, not what it gets right WITH instruction.

### How to generate from commits

1. Run `git log --oneline -50` on the target project
2. Look for:
   - **Bug fixes** — the bug reveals a non-obvious convention
   - **Multi-file changes** — coupling that isn't visible from imports
   - **Reverts / follow-up fixes** — mistakes reveal what's hard to get right
   - **Domain-specific patterns** — naming, helpers, config choices

3. For each finding, ask: "Would a model get this right just by reading the codebase?"
   - If YES → skip (non-discriminating eval)
   - If NO → write an eval prompt for it

### Example: from commit to eval

Commit: `fix: also update auditor when changing inspector error handling`

This reveals: inspector and auditor are parallel components that must be changed together. The model won't know this from code structure — the files are in different directories with different names.

Eval prompt: "Fix the error handling bug in inspector-modal.component.ts where the error toast shows 'undefined'"

Discriminating assertion: "Mentions or checks the auditor equivalent"

---

## The Codebase-Teaches-Patterns Effect

### What it means

When a model explores a codebase before writing code, it discovers and follows existing conventions without being told. This makes most instruction-file rules redundant for well-structured projects.

### What gets learned automatically

| Pattern | How the model discovers it |
|---------|---------------------------|
| Tech stack | `package.json` dependencies |
| UI components | Existing imports in similar files |
| Helper functions | Existing service/util files |
| Path aliases | `tsconfig.json` paths config |
| Language/locale | Existing translation files |
| Naming conventions | Existing file and variable names |
| API patterns | Existing endpoint implementations |
| Data models | Existing TypeScript types/interfaces |

### What does NOT get learned automatically

| Pattern | Why the model can't discover it |
|---------|-------------------------------|
| Component coupling | Parallel files in different dirs with different names |
| Multi-section sync | No structural indicator that N sections must update together |
| Workflow rules | No codebase artifact says "write failing test first" |
| Decision/response style | No codebase artifact says "recommend one path" |
| Safety guardrails | No codebase artifact says "never force-push" |

### Implications for CLAUDE.md

A well-structured codebase with consistent patterns may need only 50-100 lines of instruction:
- Coupling rules the model can't discover
- Workflow rules the model doesn't default to
- Decision style preferences
- Safety guardrails
- Domain context (what are the parallel components? how do they relate?)

Everything else is likely redundant.

---

## Empirical Findings (Claude Opus 4.6, March 2026)

These findings are from controlled A/B testing with proper isolation (all CLAUDE.md/AGENTS.md files physically moved to /tmp/ before spawning baselines, not restored until all agents completed).

### Iteration 1: Generic eval prompts (global CLAUDE.md)

**Non-discriminating (model defaults):**
- `type` over `interface` — 100% baseline compliance
- No `React.FC` — 100% baseline compliance
- No unnecessary comments — 100% baseline compliance
- `<tldr>` footer — produced without instruction
- Separators — produced without instruction
- Dark palette / avoid purple-on-white — driven by prompt, not instruction

**Discriminating (instruction required):**
- TDD workflow (failing test first) — 0% baseline -> 100% with instruction (STRONGEST)
- Single recommendation over option menus — 33% baseline -> 100%
- Known/inferred/uncertain separation — 0% baseline -> 100%
- "What's next" response contract — 33% baseline -> 100%
- Concise checklist format (vs guide) — 50% baseline -> 100%
- Early return pattern — 83% baseline -> 100% (WEAK)
- Distinctive font selection — 60% baseline -> 100% (WEAK)

### Iteration 2: Commit-derived eval prompts (project CLAUDE.md, monorepo)

**Protocol**: ALL 10 CLAUDE.md/AGENTS.md files recursively moved to /tmp/. Files NOT restored until ALL baseline agents completed.

**Results**: +3.8% delta (21/26 vs 20/26). Only 1 of 26 assertions discriminating.

**The one discriminating assertion:**
- Parallel component parity mention — pure domain knowledge, codebase can't teach it

**Non-discriminating (model discovers from codebase):**
- React functional components with hooks
- shadcn/ui components from @/components/ui/
- Recharts (not @tremor/react)
- TanStack Query for data fetching
- Hebrew text hardcoded in JSX
- @/ path aliases
- companyCollection() helper
- serverTimestamp() for updatedAt
- stageChangedAt conditional logic
- Zod validation
- ChartContainer + ChartConfig from shadcn
- tool() with Zod inputSchema
- Hebrew tool descriptions
- System prompt capabilities updates

**Always failing (both configs):**
- "Don't ask - just do" examples section update
- OpenRouter/Gemini model reference
- RTL dir='rtl' attribute on chart containers
- Actually applying the parallel component fix (both mention it, neither does it)

### Key Takeaway

For well-structured projects, realistic deltas are +3-10%. If you see +30%+ delta, your baselines are probably contaminated. The codebase-teaches-patterns effect is the dominant factor.
