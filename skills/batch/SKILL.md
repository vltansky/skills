---
name: batch
description: "Parallel work orchestration — decompose large changes into 5-30 worktree agents that each open a PR. Use when the user says 'batch', 'do this in parallel', 'split into PRs', 'bulk change', 'mass refactor', or wants a sweeping mechanical change across many files."
---

# Batch: Parallel Work Orchestration

You are orchestrating a large, parallelizable change across this codebase.

The user's message that triggered this skill is your instruction. Treat it as the change to orchestrate across the codebase.

## Phase 1: Research and Plan (Plan Mode)

Enter plan mode now (use the host's plan mode tool if available), then:

1. **Understand the scope.** Launch one or more subagents (in the foreground — you need their results) to deeply research what this instruction touches. Find all the files, patterns, and call sites that need to change. Understand the existing conventions so the migration is consistent.

2. **Decompose into independent units.** Break the work into 5–30 self-contained units. Each unit must:
   - Be independently implementable in an isolated git worktree (no shared state with sibling units)
   - Be mergeable on its own without depending on another unit's PR landing first
   - Be roughly uniform in size (split large units, merge trivial ones)

   Scale the count to the actual work: few files → closer to 5; hundreds of files → closer to 30. Prefer per-directory or per-module slicing over arbitrary file lists.

3. **Determine the e2e test recipe.** Figure out how a worker can verify its change actually works end-to-end — not just that unit tests pass. Look for:
   - A browser-automation tool or skill (for UI changes: click through the affected flow, screenshot the result)
   - A CLI-verifier skill (for CLI changes: launch the app interactively, exercise the changed behavior)
   - A dev-server + curl pattern (for API changes: start the server, hit the affected endpoints)
   - An existing e2e/integration test suite the worker can run

   If you cannot find a concrete e2e path, ask the user how to verify this change end-to-end using the host's **ask user question tool** when available (otherwise ask in chat). Offer 2–3 specific options based on what you found (e.g., "Screenshot via browser automation", "Run `bun run dev` and curl the endpoint", "No e2e — unit tests are sufficient"). Do not skip this — the workers cannot ask the user themselves.

   Write the recipe as a short, concrete set of steps that a worker can execute autonomously. Include any setup (start a dev server, build first) and the exact command/interaction to verify.

4. **Write the plan.** In your plan file, include:
   - A summary of what you found during research
   - A numbered list of work units — for each: a short title, the list of files/directories it covers, and a one-line description of the change
   - The e2e test recipe (or "skip e2e because …" if the user chose that)
   - The exact worker instructions you will give each agent (the shared template)

5. Exit plan mode and present the plan for user approval.

## Phase 2: Spawn Workers (After Plan Approval)

Once the plan is approved, spawn one background subagent per work unit using the host's subagent/spawn tool. **Each agent should run in an isolated git worktree and in the background.** Launch them all in a single message block so they run in parallel. If the host has no subagent tool, execute the work units sequentially yourself, one at a time, creating a branch and PR for each before moving to the next.

For each agent, the prompt must be fully self-contained. Include:
- The overall goal (the user's instruction)
- This unit's specific task (title, file list, change description — copied verbatim from your plan)
- Any codebase conventions you discovered that the worker needs to follow
- The e2e test recipe from your plan (or "skip e2e because …")
- The worker instructions below, copied verbatim:

```
After you finish implementing the change:
1. **Simplify** — Invoke /simplify if available; otherwise do a quick self-review of your changes for reuse and quality.
2. **Run unit tests** — Run the project's test suite (check for package.json scripts, Makefile targets, or common commands like `npm test`, `bun test`, `pytest`, `go test`). If tests fail, fix them.
3. **Test end-to-end** — Follow the e2e test recipe from the coordinator's prompt (below). If the recipe says to skip e2e for this unit, skip it.
4. **Commit and push** — Commit all changes with a clear message, push the branch, and create a PR with `gh pr create`. Use a descriptive title. If `gh` is not available or the push fails, note it in your final message.
5. **Report** — End with a single line: `PR: <url>` so the coordinator can track it. If no PR was created, end with `PR: none — <reason>`.
```

## Phase 3: Track Progress

After launching all workers, render an initial status table:

| # | Unit | Status | PR |
|---|------|--------|----|
| 1 | <title> | running | — |
| 2 | <title> | running | — |

As background-agent completion notifications arrive, parse the `PR: <url>` line from each agent's result and re-render the table with updated status (`done` / `failed`) and PR links. Keep a brief failure note for any agent that did not produce a PR.

If a worker produces no output or no `PR:` line, mark it `failed — no response` in the table.

When all agents have reported (or timed out), render the final table and a one-line summary (e.g., "22/24 units landed as PRs"). For any unit that reports `PR: none`, include the reason in the table and append a Recovery section listing failed units with suggested retry commands.
