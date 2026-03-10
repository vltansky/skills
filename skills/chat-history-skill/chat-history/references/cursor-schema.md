# Cursor Chat Database Schema

Complete documentation for Cursor IDE's chat history SQLite database.

## Database Structure

```sql
CREATE TABLE cursorDiskKV (
  key TEXT PRIMARY KEY,
  value TEXT  -- JSON encoded
);
```

### Key Patterns

| Pattern | Description |
|---------|-------------|
| `composerData:{uuid}` | Full conversation data |
| `bubbleId:{composerId}:{bubbleId}` | Individual message (modern format) |

## Conversation Formats

Cursor has two conversation formats. Detect by checking for `_v` field.

### Legacy Format

No `_v` field, has `conversation` array directly.

```json
{
  "composerId": "550e8400-e29b-41d4-a716-446655440000",
  "conversation": [
    {
      "type": 1,
      "bubbleId": "bubble-uuid-1",
      "text": "How do I implement a debounce function?",
      "relevantFiles": [],
      "attachedFoldersNew": ["/Users/dev/my-project"],
      "context": {
        "fileSelections": [
          {
            "uri": {
              "fsPath": "/Users/dev/my-project/src/utils.ts",
              "path": "src/utils.ts"
            }
          }
        ]
      }
    },
    {
      "type": 2,
      "bubbleId": "bubble-uuid-2",
      "text": "Here's a debounce implementation...",
      "suggestedCodeBlocks": [
        {
          "language": "typescript",
          "code": "function debounce<T extends (...args: any[]) => any>(...",
          "filename": "utils.ts"
        }
      ],
      "relevantFiles": ["src/utils.ts"]
    }
  ],
  "text": "last user input text",
  "richText": "formatted version of last input",
  "hasLoaded": true
}
```

### Modern Format (v3+)

Has `_v` field and `fullConversationHeadersOnly` array. Message content stored separately.

```json
{
  "_v": 3,
  "composerId": "550e8400-e29b-41d4-a716-446655440000",
  "fullConversationHeadersOnly": [
    {
      "bubbleId": "bubble-uuid-1",
      "type": 1,
      "serverBubbleId": "server-id-1"
    },
    {
      "bubbleId": "bubble-uuid-2",
      "type": 2,
      "serverBubbleId": "server-id-2"
    }
  ],
  "name": "Debounce Implementation",
  "latestConversationSummary": {
    "summary": {
      "summary": "Discussion about implementing a debounce utility function in TypeScript with generic type support."
    }
  },
  "context": {
    "fileSelections": [
      {
        "uri": {
          "fsPath": "/Users/dev/my-project/src/utils.ts",
          "path": "src/utils.ts"
        }
      }
    ]
  }
}
```

**To get full message content in modern format**, query bubble separately:

```sql
SELECT value FROM cursorDiskKV
WHERE key = 'bubbleId:{composerId}:{bubbleId}';
```

Bubble message structure:
```json
{
  "type": 2,
  "text": "Full message content here...",
  "suggestedCodeBlocks": [...],
  "relevantFiles": [...],
  "attachedFoldersNew": [...],
  "timestamp": 1704067200000
}
```

## Field Reference

### Conversation Root

| Field | Type | Description |
|-------|------|-------------|
| `composerId` | string | Unique conversation UUID |
| `_v` | number | Format version (modern only) |
| `conversation` | array | Messages (legacy only) |
| `fullConversationHeadersOnly` | array | Message headers (modern only) |
| `name` | string | User-set conversation title |
| `text` | string | Last user input |
| `richText` | string | Formatted last input |
| `hasLoaded` | boolean | Load state flag |
| `latestConversationSummary` | object | AI summary (modern only) |
| `context` | object | File context |

### Message Object

| Field | Type | Description |
|-------|------|-------------|
| `type` | number | 1 = user, 2 = AI |
| `bubbleId` | string | Message UUID |
| `serverBubbleId` | string | Server-side ID |
| `text` | string | Message content |
| `suggestedCodeBlocks` | array | Code snippets |
| `relevantFiles` | array | Related file paths |
| `attachedFoldersNew` | array | Attached folder paths |
| `context` | object | File selections |
| `timestamp` | number | Unix timestamp (ms) |

### Code Block Object

| Field | Type | Description |
|-------|------|-------------|
| `language` | string | Programming language |
| `code` | string | Code content |
| `filename` | string | Target filename |

### Context Object

```json
{
  "fileSelections": [
    {
      "uri": {
        "fsPath": "/absolute/path/to/file.ts",
        "path": "relative/path/to/file.ts"
      }
    }
  ]
}
```

## Format Detection

```
IF value contains "_v" field:
  → Modern format
  → Messages in fullConversationHeadersOnly (headers only)
  → Full content requires separate bubbleId queries
ELSE:
  → Legacy format
  → Messages in conversation array (full content)
```

## Query Patterns

### Check Format Version
```sql
SELECT
  SUBSTR(key, 14) as id,
  CASE
    WHEN value LIKE '%"_v":%' THEN 'modern'
    ELSE 'legacy'
  END as format
FROM cursorDiskKV
WHERE key LIKE 'composerData:%';
```

### Extract with Title (if exists)
```sql
SELECT
  SUBSTR(key, 14) as id,
  json_extract(value, '$.name') as title,
  LENGTH(value) as size
FROM cursorDiskKV
WHERE key LIKE 'composerData:%'
ORDER BY ROWID DESC LIMIT 20;
```

### Get AI Summary (modern format)
```sql
SELECT
  SUBSTR(key, 14) as id,
  json_extract(value, '$.latestConversationSummary.summary.summary') as summary
FROM cursorDiskKV
WHERE key LIKE 'composerData:%'
  AND value LIKE '%"latestConversationSummary":%'
ORDER BY ROWID DESC;
```

### Find by Attached Folder (project)
```sql
SELECT SUBSTR(key, 14) as id FROM cursorDiskKV
WHERE key LIKE 'composerData:%'
  AND value LIKE '%"attachedFoldersNew":%my-project%'
ORDER BY ROWID DESC;
```

## Performance Notes

- `ROWID` provides insertion order (chronological)
- `LIKE` patterns on JSON avoid full parse overhead
- `LENGTH(value)` is fast (metadata, not content scan)
- `json_extract()` available but slower than LIKE for filtering
- Use LIKE for filtering, json_extract for display/extraction
