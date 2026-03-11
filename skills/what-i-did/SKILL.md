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

# For each private org found in events:
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

### Step 6: Totals

End the detailed log with totals:

```
---
Totals: X commits across Y repos | Z PRs | W reviews/comments
```

### Step 7: Slack-ready summary

After the full commit log, add a clearly separated section:

```
---

## TL;DR — share this in Slack

<human-readable summary here>
```

Write this as a casual, first-person message you'd actually post in a team Slack channel. Rules for this section:
- Sound like a human, not a changelog — "Wrapped up the auth migration, fixed a nasty race condition in the queue worker, and reviewed a couple of PRs" not "Committed 3 files to auth-service"
- Group related commits into themes/accomplishments — don't list individual commits
- Mention PRs by what they do, not by number
- Keep it to 2-4 sentences max
- No markdown headers, bullet lists, or code formatting — just plain text a person would type
- If there were reviews/comments, mention them naturally ("also reviewed X's PR on ...")

## Rules

- Use `gh` CLI exclusively — no local repo scanning
- Detect the GitHub username dynamically (don't hardcode)
- Discover private orgs from the events API response — don't assume org names
- Run independent API calls in parallel
- Skip event types with zero activity
- If no activity found, say so clearly
- Keep output concise — commit messages only, no diffs
