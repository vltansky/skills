# Hetzner Codex Remote

Prepare a Hetzner Cloud VPS for secure Codex remote SSH access.

## Installation

### Quick Install

```bash
npx skills add https://github.com/vltansky/skills --skill hetzner-codex-remote
```

### Manual

```bash
git clone https://github.com/vltansky/skills.git
cp -r skills/hetzner-codex-remote ~/.codex/skills/hetzner-codex-remote/
```

## Prerequisites

- A Hetzner Cloud account and project
- Local SSH key, preferably Ed25519
- Local `ssh` access to the new server
- Optional: a Tailscale account if the remote should be reachable from changing networks without exposing public SSH
- Optional: local `gh` authentication if the remote should clone private GitHub repositories

## Usage

Use this skill when you want an agent to configure a Hetzner server as a Codex remote machine:

```text
Set up this Hetzner VPS for secure Codex remote control.
```

The workflow creates a dedicated `codex` user, disables password and root SSH login, configures UFW/fail2ban, installs common coding-agent tooling, installs the Codex CLI, verifies non-interactive SSH access, optionally moves SSH behind Tailscale-only access, and optionally transfers GitHub CLI auth from the local machine to clone a repository.

## License

MIT
