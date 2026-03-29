---
name: retro
description: "Weekly engineering retrospective. Analyzes commit history, work patterns, and code quality metrics with persistent trend tracking. Team-aware: per-person contributions with praise and growth areas. Use when asked to 'weekly retro', 'what did we ship', 'engineering retrospective', 'how was this week', or 'show me the commit stats'. Proactively suggest at the end of a work week or sprint."
---

# /retro — Weekly Engineering Retrospective

Generates a comprehensive engineering retrospective from commit history. Team-aware: identifies you, then analyzes every contributor with per-person praise and growth opportunities.

## Arguments
- `/retro` — last 7 days (default)
- `/retro 24h` — last 24 hours
- `/retro 14d` — last 14 days
- `/retro 30d` — last 30 days
- `/retro compare` — compare current window vs prior same-length window
- `/retro compare 14d` — compare with explicit window

## Instructions

Parse the argument to determine the time window. Default to 7 days.

**Midnight-aligned windows:** For `d`/`w` units, compute an absolute start date at local midnight. Example: if today is 2026-03-18 and window is 7 days, start = 2026-03-11. Use `--since="2026-03-11T00:00:00"` — without `T00:00:00`, git uses the current wall-clock time.

**Invalid argument:** Show usage and stop:
```
Usage: /retro [window | compare]
  /retro              — last 7 days (default)
  /retro 24h          — last 24 hours
  /retro 14d          — last 14 days
  /retro 30d          — last 30 days
  /retro compare      — compare this period vs prior period
  /retro compare 14d  — compare with explicit window
```

---

### Step 1: Gather Raw Data

Identify the current user and default branch, then fetch:
```bash
git config user.name
git config user.email
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || echo "main"
git fetch origin --quiet 2>/dev/null || true
```

The name from `git config user.name` is **"you"**. All others are teammates.

Run ALL of these in parallel (independent):

```bash
# 1. All commits with stats
git log origin/<default> --since="<window>" --format="%H|%aN|%ae|%ai|%s" --shortstat

# 2. Per-commit test vs total LOC breakdown
git log origin/<default> --since="<window>" --format="COMMIT:%H|%aN" --numstat

# 3. Commit timestamps for session detection
git log origin/<default> --since="<window>" --format="%at|%aN|%ai|%s" | sort -n

# 4. Files most frequently changed
git log origin/<default> --since="<window>" --format="" --name-only | grep -v '^$' | sort | uniq -c | sort -rn | head -20

# 5. PR numbers from commit messages
git log origin/<default> --since="<window>" --format="%s" | grep -oE '[#!][0-9]+' | sort -u

# 6. Per-author file hotspots
git log origin/<default> --since="<window>" --format="AUTHOR:%aN" --name-only

# 7. Per-author commit counts
git shortlog origin/<default> --since="<window>" -sn --no-merges

# 8. TODOS.md backlog (if exists)
cat TODOS.md 2>/dev/null || true

# 9. Total test file count
find . -name '*.test.*' -o -name '*.spec.*' -o -name '*_test.*' -o -name '*_spec.*' 2>/dev/null | grep -v node_modules | wc -l

# 10. Regression test commits in window
git log origin/<default> --since="<window>" --oneline --grep="test(qa):" --grep="test(design):" --grep="test: coverage"

# 11. Test files changed in window
git log origin/<default> --since="<window>" --format="" --name-only | grep -E '\.(test|spec)\.' | sort -u | wc -l

# 12. Skill usage analytics (if exists)
cat ~/.gstack/analytics/skill-usage.jsonl 2>/dev/null | tail -200 || true
```

---

### Step 2: Compute Metrics

| Metric | Value |
|--------|-------|
| Commits to main | N |
| Contributors | N |
| PRs merged | N |
| Total insertions | N |
| Total deletions | N |
| Net LOC added | N |
| Test LOC (insertions) | N |
| Test LOC ratio | N% |
| Active days | N |
| Detected sessions | N |
| Avg LOC/session-hour | N |
| Test Health | N total tests · M added · K regression commits |

Then show **per-author leaderboard** immediately below:

```
Contributor         Commits   +/-          Top area
You (vlad)               32   +2400/-300   src/
alice                    12   +800/-150    lib/
bob                       3   +120/-40     tests/
```

Sort by commits descending. Current user always first, labeled "You (name)".

**Backlog Health (if TODOS.md exists):**
- Total open TODOs (exclude `## Completed` section)
- P0/P1 count, P2 count
- Items completed this period (in Completed section with dates in window)

Include in metrics table:
```
| Backlog Health | N open (X P0/P1, Y P2) · Z completed this period |
```

**Skill Usage (if `~/.gstack/analytics/skill-usage.jsonl` exists):**
Filter entries by `ts` within window. Aggregate by skill name. Present as:
```
| Skill Usage | /qa(8) /design-review(3) /retro(2) |
```

---

### Step 3: Commit Time Distribution

Show hourly histogram in local time:

```
Hour  Commits
 00:    4      ████
 07:    5      █████
 10:    8      ████████
 22:   12      ████████████
```

Identify: peak hours, dead zones, bimodal vs continuous, late-night clusters (after 10pm).

---

### Step 4: Work Session Detection

Detect sessions using **45-minute gap** threshold between consecutive commits.

Classify:
- **Deep sessions** (50+ min)
- **Medium sessions** (20-50 min)
- **Micro sessions** (<20 min — single-commit fire-and-forget)

Calculate: total active coding time, average session length, LOC per hour of active time.

---

### Step 5: Commit Type Breakdown

Categorize by conventional commit prefix (feat/fix/refactor/test/chore/docs). Show as percentage bar:

```
feat:     20  (40%)  ████████████████████
fix:      27  (54%)  ███████████████████████████
refactor:  2  ( 4%)  ██
```

Flag if fix ratio exceeds 50% — signals "ship fast, fix fast" that may indicate review gaps.

---

### Step 6: Hotspot Analysis

Top 10 most-changed files. Flag:
- Files changed 5+ times (churn hotspots)
- Test vs production files in hotspot list
- VERSION/CHANGELOG frequency (version discipline)

---

### Step 7: PR Size Distribution

Bucket by LOC:
- **Small** (<100)
- **Medium** (100-500)
- **Large** (500-1500)
- **XL** (1500+)

---

### Step 8: Focus Score + Ship of the Week

**Focus score:** % of commits touching the single most-changed top-level directory. Higher = deeper focused work. Report: "Focus score: 62% (src/auth/)"

**Ship of the week:** Highest-LOC PR in the window. PR number, title, LOC changed, why it matters.

---

### Step 9: Team Member Analysis

For each contributor compute: commits/LOC, areas of focus (top 3 directories), commit type mix, session patterns, test discipline, biggest ship.

**For you:** Deepest treatment — session analysis, time patterns, focus score. First person framing.

**For each teammate:** 2-3 sentences on what they worked on, then:
- **Praise** (1-2 specific things): Anchor in actual commits. Not "great work" — say exactly what was good.
- **Opportunity for growth** (1 specific thing): Frame as leveling up, not criticism. Anchor in data.

**If only one contributor:** Skip team breakdown. Retro is personal.

**Co-Authored-By trailers:** Parse them. Credit co-authors. Track AI co-authors (noreply@anthropic.com, etc.) as "AI-assisted commits" — separate metric, not a team member.

---

### Step 10: Week-over-Week Trends (if window ≥ 14d)

Split into weekly buckets: commits/week, LOC/week, test ratio/week, fix ratio/week, session count/week.

---

### Step 11: Streak Tracking

```bash
# Team streak
git log origin/<default> --format="%ad" --date=format:"%Y-%m-%d" | sort -u

# Personal streak (filter by user name)
git log origin/<default> --author="<user_name>" --format="%ad" --date=format:"%Y-%m-%d" | sort -u
```

Count backward from today — consecutive days with ≥1 commit. Display:
- "Team shipping streak: 47 consecutive days"
- "Your shipping streak: 32 consecutive days"

---

### Step 12: Load History & Compare

```bash
ls -t .context/retros/*.json 2>/dev/null | head -5
```

If prior retros exist: load most recent. Show **Trends vs Last Retro**:
```
                    Last        Now         Delta
Test ratio:         22%    →    41%         ↑19pp
Sessions:           10     →    14          ↑4
LOC/hour:          200     →   350          ↑75%
Fix ratio:          54%    →    30%         ↓24pp (improving)
```

If no prior retros: skip comparison, append "First retro recorded — run again next week to see trends."

---

### Step 13: Save Retro Snapshot

```bash
mkdir -p .context/retros
today=$(date +%Y-%m-%d)
existing=$(ls .context/retros/${today}-*.json 2>/dev/null | wc -l | tr -d ' ')
next=$((existing + 1))
# Save to .context/retros/${today}-${next}.json
```

Write JSON with Write tool:
```json
{
  "date": "YYYY-MM-DD",
  "window": "7d",
  "metrics": {
    "commits": 47,
    "contributors": 3,
    "prs_merged": 12,
    "insertions": 3200,
    "deletions": 800,
    "net_loc": 2400,
    "test_loc": 1300,
    "test_ratio": 0.41,
    "active_days": 6,
    "sessions": 14,
    "deep_sessions": 5,
    "avg_session_minutes": 42,
    "loc_per_session_hour": 350,
    "feat_pct": 0.40,
    "fix_pct": 0.30,
    "peak_hour": 22,
    "ai_assisted_commits": 32
  },
  "authors": {
    "Vlad": { "commits": 32, "insertions": 2400, "deletions": 300, "test_ratio": 0.41, "top_area": "src/" }
  },
  "streak_days": 47,
  "tweetable": "Week of Mar 22: 47 commits (2 contributors), 3.2k LOC, 41% tests, 12 PRs, peak: 10pm | Streak: 47d"
}
```

Include `test_health` only if test files exist. Include `backlog` only if TODOS.md exists.

---

### Step 14: Write the Narrative

**Tweetable summary** (first line, before everything else):
```
Week of Mar 22: 47 commits (2 contributors), 3.2k LOC, 41% tests, 12 PRs, peak: 10pm | Streak: 47d
```

Then structure:

## Engineering Retro: [date range]

### Summary Table
(from Step 2)

### Trends vs Last Retro
(from Step 12 — skip if first retro)

### Time & Session Patterns
(from Steps 3-4)
Narrative: when most productive hours are, whether sessions are getting longer/shorter, notable patterns.

### Shipping Velocity
(from Steps 5-7)
Commit type mix, PR size distribution, fix-chain detection, version bump discipline.

### Code Quality Signals
Test LOC ratio trend, hotspot analysis (same files churning?).

### Test Health
- Total test files, tests added this period, regression test commits
- If test ratio <20%: flag as growth area — "100% coverage is the goal. Tests make fast iteration safe."

### Focus & Highlights
(from Step 8)
Focus score with interpretation, Ship of the Week callout.

### Your Week
(from Step 9, personal deep-dive)
- Your commit count, LOC, test ratio, session patterns, focus areas, biggest ship
- **What you did well** (2-3 specific things anchored in commits)
- **Where to level up** (1-2 specific, actionable suggestions)

### Team Breakdown
(from Step 9, for each teammate — skip if solo repo)
Per-person: what they shipped, **Praise**, **Opportunity for growth**.

### Top 3 Team Wins
Highest-impact things shipped. For each: what, who, why it matters.

### 3 Things to Improve
Specific, actionable, anchored in actual commits. Mix personal and team-level.

### 3 Habits for Next Week
Small, practical, realistic. Each must take <5 minutes to adopt.

---

## Compare Mode

When the user runs `/retro compare [window]`:
1. Compute metrics for current window (midnight-aligned)
2. Compute metrics for prior same-length window (use `--since` + `--until` with midnight-aligned dates to avoid overlap)
3. Show side-by-side comparison table with deltas and arrows
4. Brief narrative: biggest improvements and regressions
5. Save only the current-window snapshot

---

## Tone

- Encouraging but candid, no coddling
- Specific and concrete — always anchor in actual commits
- Skip generic praise ("great job!") — say exactly what was good and why
- Frame improvements as leveling up, not criticism
- **Praise should feel like something you'd say in a 1:1** — specific, earned, genuine
- **Growth suggestions should feel like investment advice** — "this is worth your time because..."
- Never compare teammates against each other negatively
- Keep total output ~3000-4500 words
- Use markdown tables and code blocks for data, prose for narrative

## Important Rules

- ALL narrative output goes directly to the conversation. The ONLY file written is the `.context/retros/` JSON snapshot.
- Use `origin/<default>` for all git queries (not local main which may be stale)
- Display all timestamps in the user's local timezone (do not override `TZ`)
- If window has zero commits, say so and suggest a different window
- Round LOC/hour to nearest 50
- Treat merge commits as PR boundaries
- On first run (no prior retros), skip comparison gracefully
