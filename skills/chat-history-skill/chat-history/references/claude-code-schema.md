# Claude Code Conversation Schema

Complete documentation for Claude Code's local conversation storage format.

## Storage Structure

```
~/.claude/
├── projects/
│   ├── Users-me-project-a/
│   │   ├── abc123.jsonl
│   │   ├── def456.jsonl
│   │   └── ...
│   ├── Users-me-project-b/
│   │   └── ...
│   └── ...
├── settings.json
└── statsig/
```

### Project Path Encoding

Project paths are encoded by replacing special characters:
- `/` → `-`
- Leading slash removed

Examples:
- `/Users/me/my-project` → `Users-me-my-project`
- `/home/user/code/app` → `home-user-code-app`

**Decoding is lossy** - underscores, dots, and dashes in original paths all become dashes.

## JSONL Format

Each conversation is a `.jsonl` file where each line is a complete JSON object representing one event in the conversation.

### Message Types

#### User Message
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": "Please help me implement a debounce function"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```
Note: User `message.content` is a **string**.

#### Assistant Message
```json
{
  "type": "assistant",
  "message": {
    "role": "assistant",
    "content": [
      {"type": "thinking", "thinking": "Let me help with this..."},
      {"type": "text", "text": "Here's the implementation..."},
      {"type": "tool_use", "id": "toolu_123", "name": "Write", "input": {...}}
    ],
    "model": "claude-sonnet-4-20250514",
    "stop_reason": "end_turn",
    "usage": {"input_tokens": 100, "output_tokens": 200}
  },
  "costUSD": 0.005
}
```
Note: Assistant `message.content` is an **array** of content blocks.

#### System Message
```json
{
  "type": "system",
  "message": {
    "content": "System context or instructions..."
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Summary (Conversation Compaction)
```json
{
  "type": "summary",
  "summary": "Summary of previous conversation turns..."
}
```

#### Tool Use
```json
{
  "type": "tool_use",
  "id": "toolu_01ABC123",
  "name": "Read",
  "input": {
    "file_path": "/Users/me/project/src/utils.ts"
  },
  "timestamp": "2024-01-15T10:30:10.000Z"
}
```

#### Tool Result
```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01ABC123",
  "content": "export function debounce() {\n  // existing implementation\n}",
  "is_error": false,
  "timestamp": "2024-01-15T10:30:11.000Z"
}
```

### Common Tool Names

| Tool | Purpose |
|------|---------|
| `Read` | Read file contents |
| `Write` | Create/overwrite file |
| `Edit` | Edit existing file |
| `Bash` | Execute shell command |
| `Glob` | Find files by pattern |
| `Grep` | Search file contents |
| `WebFetch` | Fetch URL content |
| `WebSearch` | Search the web |
| `Task` | Spawn sub-agent |
| `TodoWrite` | Update task list |

## Field Reference

### User Message Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"user"` | Message type identifier |
| `message.content` | string | User's message text |
| `timestamp` | string | ISO 8601 timestamp |

### Assistant Message Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"assistant"` | Message type identifier |
| `message.content` | string | Claude's response (may include markdown, code blocks) |
| `timestamp` | string | ISO 8601 timestamp |
| `costUSD` | number | Cost of this response in USD |

### All Message Types

| Type | Description |
|------|-------------|
| `user` | User input message |
| `assistant` | Claude's response |
| `system` | System instructions/context |
| `summary` | Conversation compaction summary |
| `tool_use` | Tool invocation |
| `tool_result` | Tool execution result |
| `file-history-snapshot` | File state snapshot |

### Tool Use Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"tool_use"` | Message type identifier |
| `id` | string | Unique tool invocation ID |
| `name` | string | Tool name (Read, Write, Bash, etc.) |
| `input` | object | Tool-specific parameters |
| `timestamp` | string | ISO 8601 timestamp |

### Tool Result Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"tool_result"` | Message type identifier |
| `tool_use_id` | string | Matching tool_use id |
| `content` | string | Tool output |
| `is_error` | boolean | Whether tool execution failed |
| `timestamp` | string | ISO 8601 timestamp |

## Query Patterns with jq

### Extract All User Messages
```bash
cat conversation.jsonl | jq -r 'select(.type=="user") | .message.content'
```

### Extract All Assistant Messages (text only)
```bash
cat conversation.jsonl | jq -r 'select(.type=="assistant") | .message.content[] | select(.type=="text") | .text'
```

### Extract Conversation Flow
```bash
cat conversation.jsonl | jq -r '
  select(.type=="user" or .type=="assistant") |
  if .type=="user" then "user: \(.message.content[0:100])..."
  else "assistant: \([.message.content[] | select(.type=="text") | .text] | join(" ")[0:100])..."
  end'
```

### Find All Tool Uses
```bash
cat conversation.jsonl | jq -r 'select(.type=="tool_use") | "\(.name): \(.input)"'
```

### Find File Operations
```bash
cat conversation.jsonl | jq -r 'select(.type=="tool_use" and (.name=="Read" or .name=="Write" or .name=="Edit")) | "\(.name): \(.input.file_path)"'
```

### Find Bash Commands
```bash
cat conversation.jsonl | jq -r 'select(.type=="tool_use" and .name=="Bash") | .input.command'
```

### Find Errors
```bash
cat conversation.jsonl | jq -r 'select(.type=="tool_result" and .is_error==true) | .content'
```

### Get Conversation Summary (Fast - Streaming)
```bash
# Preferred: streaming grep (works on any file size)
FILE=conversation.jsonl
echo "total: $(wc -l < "$FILE")"
echo "user: $(grep -c '"type":"user"' "$FILE")"
echo "assistant: $(grep -c '"type":"assistant"' "$FILE")"
echo "tool_use: $(grep -c '"type":"tool_use"' "$FILE")"
```

### Get Conversation Summary (Slow - Small Files Only)
```bash
# WARNING: jq -s loads entire file into memory - avoid on files >10MB
cat conversation.jsonl | jq -s '{
  total_messages: length,
  user: [.[] | select(.type=="user")] | length,
  assistant: [.[] | select(.type=="assistant")] | length,
  tool_uses: [.[] | select(.type=="tool_use")] | length,
  tools_used: [.[] | select(.type=="tool_use") | .name] | unique
}'
```

### Extract Code Blocks from Assistant Messages
```bash
cat conversation.jsonl | jq -r 'select(.type=="assistant") | .content' | grep -A 100 '```' | grep -B 100 '```'
```

## Search Patterns with grep

### Find Conversations About a Topic
```bash
grep -rl "authentication" ~/.claude/projects/ --include="*.jsonl"
```

### Find Conversations with Specific Tool Usage
```bash
grep -rl '"name":"Bash"' ~/.claude/projects/ --include="*.jsonl"
```

### Find Conversations with Errors
```bash
grep -rl '"is_error":true' ~/.claude/projects/ --include="*.jsonl"
```

### Find Conversations Touching a File
```bash
grep -rl "src/components/Button.tsx" ~/.claude/projects/ --include="*.jsonl"
```

### Find Conversations with Code Blocks
```bash
grep -rl '```typescript' ~/.claude/projects/ --include="*.jsonl"
grep -rl '```python' ~/.claude/projects/ --include="*.jsonl"
```

## File Naming

Conversation files are named with UUIDs or hashes:
- `abc123def456.jsonl`
- Files are append-only during a session
- Modification time indicates last activity

## Performance Tips

### Fast (Use These)
- `wc -l` - Count lines (~40ms for 37MB)
- `grep -c` - Count matches (~70ms for 37MB)
- `grep -m N` - Stop after N matches (instant)
- `head -N` / `tail -N` - First/last lines (instant)
- Filter by project path first for 10x speedup

### Slow (Avoid)
- `jq -s` on large files (~250ms for 37MB, loads all into memory)
- `grep -rl` across all projects (~2.3s)
- `cat file | jq` without grep pre-filter

### Patterns
```bash
# Fast: streaming count
grep -c '"type":"user"' file.jsonl

# Fast: filter by project first
grep -rl "keyword" ~/.claude/projects/-Users-me-myproject/

# Slow: avoid on files >10MB
cat file.jsonl | jq -s 'length'
```

### Find recent (macOS)
```bash
find ~/.claude/projects/ -name "*.jsonl" -type f -exec ls -lt {} + | head -20
```

## Limitations

- JSONL files grow indefinitely during long sessions
- No built-in indexing - search is linear
- Project path encoding is lossy (can't perfectly reconstruct original path)
- Tool results may contain large content (file contents, command output)
