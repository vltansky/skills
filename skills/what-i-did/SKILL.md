---
name: what-i-did
description: Summarize your GitHub activity from the last 24 hours across all repos. Use when user says "what did I do", "my activity", "standup", "recap", "summarize my day", "what-i-did", "git activity", "daily summary".
---

# What I Did

Summarize GitHub activity from the last 24 hours using the `gh` CLI.

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
- For private org repos, your token needs `repo` scope

## Workflow

### Step 1: Detect GitHub username

```bash
gh api user -q '.login'
```

Store the result as `$GH_USER` for all subsequent queries.

### Step 2: Fetch events (single API call)

Get all GitHub events from the last 24 hours:

```bash
SINCE=$(date -u -v-24H '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d '24 hours ago' '+%Y-%m-%dT%H:%M:%SZ')
gh api "/users/$GH_USER/events" --paginate -q ".[] | select(.created_at >= \"$SINCE\")"
```

This covers pushes, PRs, reviews, comments, branch creation — everything.

### Step 3: Fetch commit details

Events API omits commit messages for private repos. Use `gh search commits` to get the actual messages. Search across all orgs/owners the user contributes to (extract unique owners from Step 2 events):

```bash
# Public repos
gh search commits --author=$GH_USER --committer-date=">$SINCE" --json repository,sha,commit --limit 100

# For each private org found in events (e.g., wix-private):
gh search commits --author=$GH_USER --owner=<org> --committer-date=">$SINCE" --json repository,sha,commit --limit 100
```

Run all searches in parallel. Deduplicate by SHA.

### Step 4: Fetch PRs

Get PRs authored that were active in the last 24h:

```bash
gh search prs --author=$GH_USER --updated=">$SINCE" --json repository,title,number,state,url --limit 50
```

### Step 5: Present summary

Group everything by repo. For each repo show:

```
### owner/repo-name

**Commits** (N)
- `sha` message (time ago)
- ...

**PRs**
- #123 PR title [merged/open] - url

**Reviews & Comments** (N)
```

### Step 6: Daily narrative

Write a short standup-style paragraph (3-5 sentences) summarizing what was accomplished, the themes, and focus areas. Conversational tone.

End with totals:

```
---
Totals: X commits across Y repos | Z PRs | W reviews/comments
```

## Rules

- Use `gh` CLI exclusively — no local repo scanning
- Detect the GitHub username dynamically (don't hardcode)
- Discover private orgs from the events API response — don't assume org names
- Run independent API calls in parallel
- Skip event types with zero activity
- If no activity found, say so clearly
- Keep output concise — commit messages only, no diffs
