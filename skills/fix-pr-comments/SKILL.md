---
name: fix-pr-comments
description: "Handle feedback from PR reviewers. For each inline thread: reply on-thread and resolve after user approves. Use when developers left comments on your PR and you need to address them. Triggers on 'address comments', 'fix PR feedback', 'what did the reviewer say', 'handle review', 'resolve comments', 'comments from dev', 'dev feedback'."
---

# Fix PR Comments

## Step 0: Resolve PR & Ensure Correct Branch

### 0a. Determine Target PR

Check if the user mentioned a PR number or URL in the conversation.

If yes — use that:
```bash
PR_NUM=$(gh pr view <number-or-url> --json number --jq .number)
PR_BRANCH=$(gh pr view <number-or-url> --json headRefName --jq .headRefName)
```

If no — use the current branch's PR:
```bash
PR_NUM=$(gh pr view --json number --jq .number)
PR_BRANCH=$(gh pr view --json headRefName --jq .headRefName)
```

If `gh pr view` fails (no PR found): tell user "No PR found" and stop.

```bash
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
```

### 0b. Check Current Branch

```bash
CURRENT_BRANCH=$(git branch --show-current)
```

If `CURRENT_BRANCH` equals `PR_BRANCH` — proceed to Step 1.

### 0c. Handle Branch Mismatch

Check for uncommitted changes:
```bash
git status --porcelain
```

**If uncommitted changes exist:** Ask the user with the file list. Options:
- **Stash & switch** — `git stash --include-untracked --message "fix-pr-comments: auto-stash from $CURRENT_BRANCH"`, then checkout
- **Switch without stashing** — Checkout directly (changes carry over if no conflicts)
- **Cancel** — Stop, keep current branch

**If clean:** Ask the user:
- "You're on `$CURRENT_BRANCH` but PR #$PR_NUM is on `$PR_BRANCH`. Switch branch?"
- Options: **Switch** / **Stay**

If switching:
```bash
git checkout $PR_BRANCH && git pull
```

## Step 1: Check Build Status

```bash
SHA=$(gh pr view $PR_NUM --json commits --jq '.commits[-1].oid')
BUILD_STATE=$(gh api repos/$REPO/commits/$SHA/status --jq '.state')
echo "Build: $BUILD_STATE"
```

Also check for CI status via checks API:
```bash
gh pr checks $PR_NUM
```

| Build Status | Action |
|--------------|--------|
| **success** | Proceed to Step 2 |
| **failure** | Analyze failure (Step 1a), then ask user |
| **pending** | Tell user: "Build still running. Proceed with comments or wait?" |
| **No status** | Proceed to Step 2 |

### If Build Failed

#### Step 1a: Analyze the Failure

```bash
# Check for CI bot comments with build output
gh pr view $PR_NUM --json comments --jq '.comments[-1].body' | head -50
```

1. **Identify the error** — parse for test failures, type errors, lint errors, build errors.
2. **Check if caused by this PR:**
   ```bash
   gh pr view $PR_NUM --json files --jq '.files[].path'
   ```

| Error Location | Action |
|----------------|--------|
| File in PR diff | Fix it — it's your change |
| File NOT in PR diff | Likely flaky/external — explain to user |

**If caused by PR:** Read the failing file, fix, commit: `fix: [description]`

**If external:** Present options to user:
- Post explanation as PR comment
- Re-run the build (if CI supports re-trigger comments)
- Skip and proceed with PR comments

## Step 2: Fetch Comments

```bash
# General PR comments
gh pr view $PR_NUM --json comments --jq '.comments[] | {id, body, author: .author.login}'

# Inline code review comments
gh api repos/$REPO/pulls/$PR_NUM/comments --jq '.[] | {id, body, author: .user.login, path, line}'
```

If no comments: "No PR comments to address."

## Step 3: Create TODO List

One TODO per comment. Include file:line for inline comments.

## Step 4: For Each Comment

### 4a. Evaluate

Is this valid feedback?
- Does it improve correctness or quality?
- Is it based on accurate understanding of the code?

### 4b. Decide Action

| Confidence | Action |
|------------|--------|
| **High (agree)** | Implement the fix |
| **Low (disagree/unsure)** | Ask the user before implementing |

For low confidence, explain your concern then ask:
- "The reviewer suggested X, but [concern]. What should we do?"
- Options: "Skip and reply why" / "Implement it anyway"

### 4c. Draft Reply & Get Approval

Show the comment and your draft reply:

```
> [original comment text]

Draft reply: [your draft reply]

Why: [brief reasoning]

After posting: resolve this review thread?
```

Options: "Post reply and resolve" / "Post reply only" / "Edit reply first"

### 4d. Post Reply (after approval only)

```bash
# Reply to inline review comment
gh api repos/$REPO/pulls/$PR_NUM/comments/$COMMENT_ID/replies \
  -f body="<reply>"

# Reply to general PR comment
gh pr comment $PR_NUM --body "<reply>" --reply-to $COMMENT_ID
```

### 4e. Resolve Thread (inline review comments only, after approval)

Resolve via GraphQL — find the review thread containing this comment, then resolve it:

```bash
OWNER=$(echo "$REPO" | cut -d/ -f1)
NAME=$(echo "$REPO" | cut -d/ -f2)

THREADS_JSON=$(gh api graphql -f query='
query($owner:String!,$name:String!,$pr:Int!) {
  repository(owner:$owner,name:$name) {
    pullRequest(number:$pr) {
      reviewThreads(first:100) {
        nodes { id isResolved comments(first:50) { nodes { databaseId } } }
      }
    }
  }
}' -f owner="$OWNER" -f name="$NAME" -f pr="$PR_NUM")

THREAD_ID=$(echo "$THREADS_JSON" | jq -r --argjson cid "$COMMENT_ID" '
  .data.repository.pullRequest.reviewThreads.nodes[]
  | select(.isResolved == false)
  | select([.comments.nodes[].databaseId] | contains([$cid]))
  | .id
' | head -1)

if [ -n "$THREAD_ID" ]; then
  gh api graphql -f query='mutation($id:ID!){ resolveReviewThread(input:{threadId:$id}) { thread { isResolved } } }' -f id="$THREAD_ID"
fi
```

If `THREAD_ID` is empty: tell user the reply was posted and they can resolve manually in the PR UI.

Mark TODO complete, move to next comment.

## Critical Rules

1. **Never post or resolve without explicit approval** — show draft first, wait for confirmation
2. **Always reply to the specific comment** — use replies API, not a new top-level comment
3. **Never post a general PR comment** when addressing inline review comments (stay on-thread)
4. **Default: reply + resolve** for inline threads after user approves (unless they opt out)

## Summary

| Scenario | Response |
|----------|----------|
| No comments | "No PR comments to address." |
| All addressed | "All done! Addressed X comments." |
| Some skipped | "Addressed X comments, skipped Y. Let me know if you want to revisit." |
