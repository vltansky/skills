# JSON Schemas

Schemas used by skill-ab-eval.

---

## evals.json

Defines the eval scenarios. Located at `{workspace}/evals/evals.json`.

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "name": "descriptive-kebab-name",
      "prompt": "Realistic task that exercises the changed behavior",
      "expected_output": "Human-readable description of success",
      "assertions": [
        {
          "text": "Verifiable statement about the output",
          "type": "output_contains_concept"
        }
      ]
    }
  ]
}
```

**Fields:**
- `skill_name`: Name of the skill being tested
- `evals[].id`: Unique integer identifier
- `evals[].name`: Kebab-case name used for directory names
- `evals[].prompt`: The task to execute
- `evals[].expected_output`: Human-readable success description
- `evals[].assertions[]`: Verifiable statements
  - `text`: The assertion to check
  - `type`: `output_contains_concept` (semantic check) or `output_matches_pattern` (regex)

---

## eval_metadata.json

Per-eval metadata. Located at `{workspace}/iteration-N/{eval-name}/eval_metadata.json`.

```json
{
  "eval_id": 1,
  "eval_name": "descriptive-name",
  "prompt": "The eval prompt",
  "assertions": [
    { "text": "Assertion text", "type": "output_contains_concept" }
  ]
}
```

---

## grading.json

Per-run grading. Located at `{workspace}/iteration-N/{eval-name}/{variant}/grading.json`.

```json
{
  "eval_id": 1,
  "eval_name": "descriptive-name",
  "config": "new_skill",
  "expectations": [
    {
      "text": "Assertion text",
      "passed": true,
      "evidence": "Specific quote or description"
    }
  ],
  "summary": {
    "passed": 3,
    "failed": 1,
    "total": 4,
    "pass_rate": 0.75
  }
}
```

**Fields:**
- `config`: Must be `"new_skill"` or `"old_skill"`
- `expectations[].text`: Original assertion text
- `expectations[].passed`: Boolean verdict
- `expectations[].evidence`: Supporting or contradicting evidence
- `summary`: Aggregate counts

---

## benchmark.json

Aggregated results. Located at `{workspace}/iteration-N/benchmark.json`.

```json
{
  "metadata": {
    "skill_name": "example-skill",
    "skill_path": "skills/example-skill",
    "timestamp": "2026-03-11T10:00:00Z",
    "evals_run": ["eval-1", "eval-2"],
    "model": "claude-opus-4-6",
    "changes_summary": "Brief description of changes"
  },
  "runs": [
    {
      "eval_name": "eval-1",
      "new_skill": { "pass_rate": 1.0, "assertions_passed": 4, "assertions_total": 4 },
      "old_skill": { "pass_rate": 0.75, "assertions_passed": 3, "assertions_total": 4 }
    }
  ],
  "summary": {
    "new_skill": { "mean_pass_rate": 0.92, "total_passed": 11, "total_assertions": 12 },
    "old_skill": { "mean_pass_rate": 0.75, "total_passed": 9, "total_assertions": 12 },
    "delta": { "pass_rate": "+0.17", "assertions": "+2" },
    "verdict": "improvement"
  },
  "notes": ["Observation strings"]
}
```

**Verdict values:** `improvement`, `regression`, `no_change`, `mixed`
