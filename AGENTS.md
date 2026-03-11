# Skills Monorepo

Open-source collection of [Agent Skills](https://agentskills.io) for Claude Code, Cursor, Codex, and other AI coding agents.

## Structure

```
skills/
  <skill-name>/
    SKILL.md         # Skill prompt (frontmatter + instructions)
    README.md        # Install instructions, usage, prerequisites
```

## Adding or Editing Skills

### SKILL.md format

Every skill must have YAML frontmatter with `name` and `description`:

```yaml
---
name: my-skill
description: One-line summary. Then trigger phrases the agent should match on.
---
```

The body contains the skill's instructions in markdown.

### Rules

1. **No private data** — never include API keys, tokens, internal URLs, org-specific hostnames, private repo paths, email addresses, or usernames. Skills are public and installable by anyone.
2. **Generic by default** — use dynamic detection (e.g., `gh api user -q '.login'`) instead of hardcoded usernames or org names. If a skill needs org-specific config, accept it as user input.
3. **Self-contained** — each skill directory must work independently. Don't reference files outside its own folder.
4. **Minimal dependencies** — prefer CLI tools users already have (`gh`, `git`, `node`, `npx`). If a skill needs something uncommon, document it in prerequisites.
5. **MIT license** — all contributions are MIT-licensed.

### README.md (required)

Every skill must include a `README.md` with:
- One-line description
- Install commands (`npx skills add` and manual `cp` alternative)
- Prerequisites (CLI tools, auth, etc.)
- Usage examples (trigger phrases)
- License

When adding or modifying a skill, always update:
1. The skill's own `README.md`
2. The root `README.md` skills table (add new skills, update descriptions)

### Before committing

- Grep your changes for secrets: emails, tokens, internal domains, hardcoded paths like `~/Projects/specific-repo`
- Verify SKILL.md frontmatter parses as valid YAML
- Test the skill works with a fresh install: `npx skills add ./skills/<name> -g`

## Install

```bash
# All skills globally
npx skills add vltansky/skills/skills --all -g

# Single skill
npx skills add vltansky/skills/skills/<skill-name> -g -y
```
