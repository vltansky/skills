---
name: chat-history
description: Search previous AI chat conversations from Cursor IDE and Claude Code by content, affected file, or project. Use when the user asks about previous conversations, wants to find how they solved something before, or needs to recall past AI interactions.
---

# Chat History Search

Search through previous AI chat conversations stored locally by Cursor IDE and Claude Code.

## Context Management Strategy

**IMPORTANT**: Chat histories can be massive. Never load full conversations into context unnecessarily.

**Two-Stage Approach:**
1. **Search** → Returns IDs + metadata + small excerpts (lightweight)
2. **Extract** → Load only what's needed from specific conversations

**Native Tools vs Bash:**
For Claude Code JSONL files, prefer native tools when possible:
| Bash | Native Tool | Benefit |
|------|-------------|---------|
| `head -10` | `Read` with `limit: 10` | Cross-platform |
| `tail -10` | `Read` with `offset: -10` | No escaping |
| `sed -n '20,30p'` | `Read` with `offset: 20, limit: 10` | Cleaner |
| `grep -c` | `Grep` with `output_mode: count` | Native |
| `grep "pattern"` | `Grep` with `output_mode: content` | Built-in |

Bash is still useful for: pipes, parallel ops, complex jq transforms.

**Main Agent vs Subagent:**
| Scenario | Use | Why |
|----------|-----|-----|
| Simple/quick search | Main | Low overhead |
| Results affect current task | Main | Need context continuity |
| Interactive refinement needed | Main | "Not that, find another" |
| Discuss findings with user | Main | Back-and-forth |
| Heavy cross-project search | Subagent | Keep main context clean |
| Background research | Subagent | Don't pollute main context |
| One-off historical lookup | Subagent | Return summary only |

**Subagent Prompt Template** (when appropriate):
```
Search my chat history for conversations about {topic}.
Find relevant conversations, extract key solutions/code, and summarize.
Return: conversation IDs, brief summary, relevant code snippets.
Do not return raw data - only summarized findings.
```

## Detect the Tool

| Tool | Storage | macOS | Linux | Windows |
|------|---------|-------|-------|---------|
| Cursor | SQLite | `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` | `~/.config/Cursor/User/globalStorage/state.vscdb` | `%APPDATA%\Cursor\User\globalStorage\state.vscdb` |
| Claude Code | JSONL | `~/.claude/projects/` | `~/.claude/projects/` | `%USERPROFILE%\.claude\projects\` |

```bash
# Detect which exists (cross-platform)
# macOS
ls "$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb" 2>/dev/null && echo "Cursor (macOS)"
# Linux
ls "$HOME/.config/Cursor/User/globalStorage/state.vscdb" 2>/dev/null && echo "Cursor (Linux)"
# Claude Code (same on macOS/Linux)
ls ~/.claude/projects/ 2>/dev/null && echo "Claude Code"
```

---

# Cursor IDE

## Stage 1: Search (Lightweight)

Returns IDs + metadata only. Never returns full conversation content.

### List Recent (IDs + Size)
```sql
SELECT
  SUBSTR(key, 14) as id,
  LENGTH(value) as size,
  json_extract(value, '$.name') as title
FROM cursorDiskKV
WHERE key LIKE 'composerData:%'
ORDER BY ROWID DESC LIMIT 10;
```

### Search by Keyword (IDs + Excerpt)
```sql
SELECT
  SUBSTR(key, 14) as id,
  LENGTH(value) as size,
  SUBSTR(value, MAX(1, INSTR(value, 'keyword') - 50), 150) as excerpt
FROM cursorDiskKV
WHERE key LIKE 'composerData:%'
  AND value LIKE '%keyword%'
ORDER BY ROWID DESC LIMIT 10;
```

### Search Multiple Keywords (AND)
```sql
SELECT SUBSTR(key, 14) as id, LENGTH(value) as size
FROM cursorDiskKV
WHERE key LIKE 'composerData:%'
  AND value LIKE '%keyword1%'
  AND value LIKE '%keyword2%'
ORDER BY ROWID DESC LIMIT 10;
```

### Find by File Path
```sql
SELECT SUBSTR(key, 14) as id, LENGTH(value) as size, json_extract(value, '$.name') as title
FROM cursorDiskKV
WHERE key LIKE 'composerData:%'
  AND value LIKE '%src/components/Button%'
ORDER BY ROWID DESC LIMIT 10;
```

### Find with Code Blocks
```sql
SELECT SUBSTR(key, 14) as id, LENGTH(value) as size
FROM cursorDiskKV
WHERE key LIKE 'composerData:%'
  AND value LIKE '%"suggestedCodeBlocks":%'
  AND value LIKE '%"code":%'
ORDER BY ROWID DESC LIMIT 10;
```

## Stage 2: Extract (On-Demand)

After finding relevant IDs, extract only what's needed.

### Get Summary/Title Only
```sql
SELECT
  json_extract(value, '$.name') as title,
  json_extract(value, '$.latestConversationSummary.summary.summary') as ai_summary,
  json_extract(value, '$.composerId') as id
FROM cursorDiskKV
WHERE key = 'composerData:{id}';
```

### Get Excerpt Around Match
```sql
SELECT SUBSTR(value, MAX(1, INSTR(value, 'keyword') - 200), 500) as excerpt
FROM cursorDiskKV
WHERE key = 'composerData:{id}';
```

### Get Message Count
```sql
SELECT json_array_length(json_extract(value, '$.conversation')) as message_count
FROM cursorDiskKV
WHERE key = 'composerData:{id}';
```

### Get First N Messages (Legacy Format)
```sql
SELECT json_extract(value, '$.conversation[0].text') as msg1,
       json_extract(value, '$.conversation[1].text') as msg2,
       json_extract(value, '$.conversation[2].text') as msg3
FROM cursorDiskKV
WHERE key = 'composerData:{id}';
```

### Get Full Conversation (Use Sparingly!)
```sql
-- WARNING: Loads entire JSON blob - can be 100KB-500KB per conversation
-- Prefer json_extract() for specific fields when possible
SELECT value FROM cursorDiskKV WHERE key = 'composerData:{id}';
```

**Prefer partial extraction:**
```sql
-- Instead of full load, extract only what you need:
SELECT
  json_extract(value, '$.name') as title,
  json_extract(value, '$.conversation[0].text') as first_msg,
  json_extract(value, '$.conversation[1].text') as first_reply
FROM cursorDiskKV WHERE key = 'composerData:{id}';
```

## Advanced SQLite Functions

For complex queries, use SQLite's full power:

### JSON Functions
```sql
-- Extract nested field
json_extract(value, '$.conversation[0].text')

-- Array length
json_array_length(json_extract(value, '$.conversation'))

-- Check if field exists
json_type(value, '$.name') IS NOT NULL
```

### String Functions
```sql
-- Extract excerpt around match (MAX prevents negative index)
SUBSTR(value, MAX(1, INSTR(value, 'keyword') - 100), 300)

-- Get position of match
INSTR(value, 'search_term')

-- Case-insensitive search
value LIKE '%keyword%' COLLATE NOCASE
```

### Filtering & Ranking
```sql
-- By size (substantial conversations)
ORDER BY LENGTH(value) DESC

-- By recency (chronological)
ORDER BY ROWID DESC

-- Combined score
ORDER BY (LENGTH(value) / 1000) + (ROWID / 1000000) DESC
```

### Aggregations
```sql
-- Count total
SELECT COUNT(*) FROM cursorDiskKV WHERE key LIKE 'composerData:%';

-- Count by criteria
SELECT COUNT(*) FROM cursorDiskKV
WHERE key LIKE 'composerData:%' AND value LIKE '%typescript%';
```

---

# Claude Code

## Stage 1: Search (Lightweight)

Returns file paths only, not content. **Tip:** Filter by project first for speed.

### Find by Keyword (Files Only)
```bash
# All projects (slower ~2s)
grep -rl "keyword" ~/.claude/projects/ --include="*.jsonl" | head -10

# Specific project (faster)
grep -rl "keyword" ~/.claude/projects/-Users-me-myproject/ --include="*.jsonl"
```

### Find Multiple Keywords (AND)
```bash
grep -rl "keyword1" ~/.claude/projects/ --include="*.jsonl" | xargs grep -l "keyword2" | head -10
```

### Find by File Path Discussed
```bash
grep -rl "src/components/Button" ~/.claude/projects/ --include="*.jsonl" | head -10
```

### Find by Project
```bash
# List all projects with conversations
ls ~/.claude/projects/

# List conversations for specific project
# Path encoding: /Users/me/my-project → -Users-me-my-project
ls ~/.claude/projects/-Users-me-my-project/

# All conversations for a project
find ~/.claude/projects/-Users-me-my-project/ -name "*.jsonl" -type f

# Last N conversations for a project (by modification time)
ls -lt ~/.claude/projects/-Users-me-my-project/*.jsonl | head -2

# Search within a project only (fast)
grep -rl "keyword" ~/.claude/projects/-Users-me-my-project/ --include="*.jsonl"
```

### Get Tool Operations on a File
```bash
# Which tools were used on a specific file and how many times?
FILE=~/.claude/projects/{project}/{conversation}.jsonl
TARGET="src/components/Button.tsx"
grep "$TARGET" "$FILE" | jq -r '
  .message.content[]? | select(.type=="tool_use") |
  "\(.name): \(.input.file_path // "other")"
' 2>/dev/null | sort | uniq -c | sort -rn
```
Output example: `15 Edit: /path/to/file.tsx`, `9 Read: /path/to/file.tsx`

### Recent Conversations
```bash
find ~/.claude/projects/ -name "*.jsonl" -mtime -7 -type f | head -20
```

### List with Metadata
```bash
find ~/.claude/projects/ -name "*.jsonl" -type f -exec ls -lh {} + | sort -k6,7 -r | head -20
```

## Stage 2: Extract (On-Demand)

### Get Line Count (Message Estimate)
```bash
wc -l < ~/.claude/projects/{project}/{file}.jsonl
```

### Get Matching Lines Only (Not Full File)
```bash
grep "keyword" ~/.claude/projects/{project}/{file}.jsonl
```

### Get Match with Context
```bash
grep -B1 -A1 "keyword" ~/.claude/projects/{project}/{file}.jsonl
```

### Get First/Last N Lines
```bash
# First 10 messages
head -10 ~/.claude/projects/{project}/{file}.jsonl

# Last 10 messages
tail -10 ~/.claude/projects/{project}/{file}.jsonl

# Messages 20-30
sed -n '20,30p' ~/.claude/projects/{project}/{file}.jsonl
```

### Extract User Messages Only (Streaming)
```bash
# All user messages (streams line-by-line, doesn't load full file)
grep '"type":"user"' ~/.claude/projects/{project}/{file}.jsonl | jq -r '.message.content'

# First 5 user messages only
grep -m 5 '"type":"user"' ~/.claude/projects/{project}/{file}.jsonl | jq -r '.message.content'
```

### Extract Assistant Messages Only (Streaming)
```bash
# First 3 assistant text responses
grep -m 3 '"type":"assistant"' ~/.claude/projects/{project}/{file}.jsonl | jq -r '.message.content[] | select(.type=="text") | .text'
```

### Get Summary Stats (Fast - Parallel)
```bash
FILE=~/.claude/projects/{project}/{file}.jsonl
echo "total: $(wc -l < "$FILE")" &
echo "user: $(grep -c '"type":"user"' "$FILE")" &
echo "assistant: $(grep -c '"type":"assistant"' "$FILE")" &
wait
```
Note: Parallel greps (~300ms) beat jq -s (~235ms). For files >50MB, streaming is essential to avoid memory issues.

## Useful Queries

### Find by Error Message
```bash
# "How did I fix this error before?"
grep -rl "Cannot find module" ~/.claude/projects/ --include="*.jsonl" | head -5
```

### Extract Bash Commands Run
```bash
# "What commands did I run?"
grep '"Bash"' {file}.jsonl | jq -r '.message.content[]? | select(.name=="Bash") | .input.command' | head -10
```

### Extract Web Searches
```bash
# "What did I research?"
grep "WebSearch" {file}.jsonl | jq -r '.message.content[]? | select(.name=="WebSearch") | .input.query'
```

### Find Failed Operations
```bash
grep '"is_error":true' {file}.jsonl | jq -r '.content[0:200]'
```

### Activity Timeline (This Week)
```bash
# "What projects did I work on?"
find ~/.claude/projects/ -name "*.jsonl" -mtime -7 -type f | \
  sed 's|.*/projects/||; s|/.*||' | sort | uniq -c | sort -rn | head -10
```

### Find Subagent Tasks
```bash
# "What complex tasks did I delegate?"
grep '"Task"' {file}.jsonl | jq -r '.message.content[]? | select(.name=="Task") | .input.prompt[0:100]'
```

---

## Advanced jq Patterns

For complex extraction, use jq's full power:

### Filter by Message Type
```bash
jq 'select(.type=="assistant")' file.jsonl
```

### Extract Specific Fields
```bash
jq '{type, content: .message.content[0:200]}' file.jsonl
```

### Find Messages Mentioning File
```bash
jq 'select(.message.content | contains("Button.tsx"))' file.jsonl
```

### Extract Tool Calls
```bash
jq 'select(.type=="tool_use") | {tool: .name, input: .input}' file.jsonl
```

### Truncate Long Content
```bash
jq '.message.content = .message.content[0:300]' file.jsonl
```

### Aggregate with slurp (small files only)
```bash
# WARNING: jq -s loads entire file into memory - avoid on files >10MB
cat file.jsonl | jq -s 'group_by(.type) | map({type: .[0].type, count: length})'
```

---

## Performance Guide

### Fast Operations
| Operation | Speed | Notes |
|-----------|-------|-------|
| `grep -m 5` | Instant | Stop after 5 matches |
| `head -N` / `tail -N` | Instant | First/last lines |
| `wc -l` | ~40ms/37MB | Line count |
| `grep -c` | ~70ms/37MB | Match count |
| Parallel greps | ~300ms/37MB | Multiple counts at once |
| `jq -s` | ~235ms/37MB | Fine for files <50MB |
| `LIMIT N` | Fast | SQLite result cap |

### Slow Operations (Avoid)
| Operation | Speed | Problem | Alternative |
|-----------|-------|---------|-------------|
| `grep -rl` all projects | ~2.3s | Scans everything | Filter by project first |
| `jq -s` on 100MB+ | Seconds | Memory pressure | Use streaming grep |
| Sequential greps | ~410ms/37MB | 3 file scans | Run in parallel with `&` |

### Claude Code: Project Path Encoding
Filter by project for 10x faster searches:
```
/Users/me/my-project → ~/.claude/projects/-Users-me-my-project/
```

---

## Best Practices

### Do
- Always start with Stage 1 (search) to find relevant IDs
- Use `LIMIT` and `head -N` to cap results
- Filter by project path before keyword search
- Use `grep -c` for counts instead of `jq -s | length`
- Extract excerpts around matches, not full content

### Don't
- Use `jq -s` on files >10MB
- Run `grep -rl` across all projects without `| head`
- Load full conversations into context unnecessarily
- Skip the search stage and guess conversation IDs

### Size Thresholds
- **Small** (<100KB): Safe to load full
- **Medium** (100KB-1MB): Load excerpts or specific messages
- **Large** (>1MB): Only load matching lines/fields

## Quick Reference

| Task | Cursor | Claude Code |
|------|--------|-------------|
| List IDs | `SELECT SUBSTR(key,14) ... LIMIT 10` | `find ... \| head` |
| Search | `value LIKE '%x%' LIMIT 10` | `grep -rl "x" \| head -10` |
| Excerpt | `SUBSTR(value, MAX(1,INSTR-100), 300)` | `grep -B1 -A1` |
| Count | `json_array_length(...)` | `grep -c` (fast) |
| Specific field | `json_extract(value, '$.path')` | `grep + jq` |
| First N | `json_extract(value, '$[0]')` | `head -N` |

## Resources

### references/
- `cursor-schema.md` - Cursor database schema and JSON format
- `claude-code-schema.md` - Claude Code JSONL format documentation
