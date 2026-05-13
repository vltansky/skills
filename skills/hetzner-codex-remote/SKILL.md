---
name: hetzner-codex-remote
description: Prepare a Hetzner Cloud VPS for secure Codex remote SSH access. Use when the user wants to create or configure a Hetzner server for Codex remote control, fix "No codex found in PATH" on a remote machine, install agent development tooling on a VPS, harden SSH access to a Hetzner server, or connect the server through Codex Settings, Connections, Add SSH.
---

# Hetzner Codex Remote

## Overview

Set up a Hetzner Cloud server so Codex can use it as a remote SSH connection. Keep the setup secure by default: key-only SSH, no root SSH, a dedicated `codex` user, firewall allowlisting where practical, optional Tailscale-only SSH for roaming clients, and a verified `codex` CLI in `PATH`.

Do not copy personal data from examples or prior chats into commands, files, or documentation. Use placeholders for IPs, keys, project IDs, host aliases, and account details.

## Workflow

1. Determine whether the user already has a Hetzner VPS.
2. If no VPS exists, explain how to create one in Hetzner Cloud Console.
3. Confirm SSH access and the server IP.
4. Harden SSH and create the `codex` user.
5. Install coding-agent tooling and Codex CLI.
6. If the user will connect from changing networks, move SSH behind Tailscale.
7. Verify from a plain non-interactive SSH command.
8. Tell the user to add the host in Codex: Settings > Connections > Add SSH.

## If No VPS Exists

Give concise creation instructions instead of guessing through the UI:

1. Open Hetzner Cloud Console and create or choose a project.
2. Create a server with Ubuntu LTS.
3. Choose a small general-purpose instance to start; CPX or CX instances are fine for agent work. Suggest more CPU/RAM only if the user expects heavy builds.
4. Add the user's SSH public key during server creation. Prefer Ed25519 keys.
5. Enable public IPv4 unless the user has a private-network-only plan.
6. Name the server clearly, for example `codex-remote`.
7. After creation, collect the public IPv4 and continue with SSH setup.

If the user has no local SSH key, create one locally with:

```bash
ssh-keygen -t ed25519 -C "codex-remote"
```

Do not ask the user to paste private keys. Only public keys may be copied to providers or servers.

## Initial Access

Use the server IP from Hetzner:

```bash
ssh -o StrictHostKeyChecking=accept-new root@<SERVER_IP> 'id && uname -a'
```

If root SSH does not work but another user does, adapt the commands to that user with `sudo`. If SSH key injection failed, use Hetzner's web console or rescue mode to add the public key; do not weaken the final SSH policy to password access.

Find the user's current public IPv4 for firewall allowlisting:

```bash
curl -4 -s https://ifconfig.me || curl -4 -s https://icanhazip.com
```

Warn that an IP allowlist can lock out SSH when the user's public IP changes. If the user uses the same client device from different networks, prefer Tailscale-only SSH over chasing public IP allowlists.

## Harden SSH

Run from the local machine, replacing placeholders:

```bash
PUBKEY="$(sed -n '1p' ~/.ssh/id_ed25519.pub)"
MYIP="<USER_PUBLIC_IPV4>"
SERVER="<SERVER_IP>"

ssh root@"$SERVER" "PUBKEY='$PUBKEY' MYIP='$MYIP' bash -s" <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y sudo ufw fail2ban unattended-upgrades curl ca-certificates git

if ! id codex >/dev/null 2>&1; then
  adduser --disabled-password --gecos "Codex remote user" codex
fi
usermod -aG sudo codex

install -d -m 700 -o codex -g codex /home/codex/.ssh
printf '%s\n' "$PUBKEY" > /home/codex/.ssh/authorized_keys
chown codex:codex /home/codex/.ssh/authorized_keys
chmod 600 /home/codex/.ssh/authorized_keys

printf 'codex ALL=(ALL) NOPASSWD:ALL\n' > /etc/sudoers.d/90-codex
chmod 440 /etc/sudoers.d/90-codex
visudo -cf /etc/sudoers.d/90-codex >/dev/null

install -d -m 755 /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-codex-secure.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitRootLogin no
X11Forwarding no
AllowUsers codex
EOF
sshd -t
systemctl reload ssh

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
if [ -n "${MYIP:-}" ] && [ "$MYIP" != "skip" ]; then
  ufw allow from "$MYIP" to any port 22 proto tcp comment 'SSH from user public IP'
else
  ufw allow 22/tcp comment 'SSH key-only'
fi
ufw --force enable

systemctl enable --now fail2ban
systemctl enable --now unattended-upgrades || true
REMOTE
```

Verify before closing any working session:

```bash
ssh -o BatchMode=yes codex@<SERVER_IP> 'id && sudo -n true && echo sudo-ok'
ssh -o BatchMode=yes root@<SERVER_IP> 'echo root-should-not-work'
```

The root command should fail.

## Local SSH Alias

Add a memorable alias to the user's local SSH config:

```sshconfig
Host <HOST_ALIAS>
    HostName <SERVER_IP>
    User codex
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 30
    ServerAliveCountMax 3
```

Verify:

```bash
ssh <HOST_ALIAS> 'whoami && hostname'
```

## Optional: Tailscale-Only SSH

Use this when the same client device needs SSH from different networks, or when the user wants SSH reachable only through their tailnet. Keep the existing public SSH path open until SSH over Tailscale is verified.

Install Tailscale on the remote server:

```bash
ssh <HOST_ALIAS> 'set -euo pipefail
curl -fsSL https://tailscale.com/install.sh | sh
sudo -n systemctl enable --now tailscaled
tailscale version
sudo -n tailscale up --hostname=<HOST_ALIAS> --accept-dns=false || true
sudo -n tailscale status --json | python3 -c "import json,sys; d=json.load(sys.stdin); print({\"BackendState\": d.get(\"BackendState\"), \"AuthURL\": d.get(\"AuthURL\"), \"TailscaleIPs\": (d.get(\"Self\") or {}).get(\"TailscaleIPs\"), \"DNSName\": (d.get(\"Self\") or {}).get(\"DNSName\"), \"HostName\": (d.get(\"Self\") or {}).get(\"HostName\")})"'
```

If `BackendState` is `NeedsLogin`, open the `AuthURL` in the user's browser and connect the device to the intended tailnet. If browser automation is available and the user asked you to handle it, use the browser to authorize the device. Select the correct tailnet when more than one is offered.

After authorization, collect the Tailscale IP:

```bash
TAILSCALE_IP="$(ssh <HOST_ALIAS> 'sudo -n tailscale ip -4 | sed -n "1p"')"
printf '%s\n' "$TAILSCALE_IP"
```

Verify SSH over Tailscale before changing the firewall:

```bash
ssh -o BatchMode=yes -o ConnectTimeout=8 codex@"$TAILSCALE_IP" 'hostname; whoami; codex --version'
```

If SSH reports a host-key mismatch, compare the public and Tailscale host keys before accepting the new host entry:

```bash
ssh-keyscan -T 5 -t ed25519 <SERVER_IP> "$TAILSCALE_IP"
ssh -o StrictHostKeyChecking=accept-new codex@"$TAILSCALE_IP" 'hostname; whoami'
```

Then update the local SSH alias to use the Tailscale IP:

```sshconfig
Host <HOST_ALIAS>
    HostName <TAILSCALE_IP>
    User codex
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 30
    ServerAliveCountMax 3
```

Finally, close public SSH and allow SSH only over `tailscale0`:

```bash
ssh <HOST_ALIAS> 'set -euo pipefail
sudo -n ufw allow in on tailscale0 to any port 22 proto tcp comment "SSH over Tailscale"
sudo -n ufw --force delete allow from <USER_PUBLIC_IPV4> to any port 22 proto tcp || true
sudo -n ufw status numbered'
```

Verify that the alias still works and public SSH is blocked:

```bash
ssh -o BatchMode=yes -o ConnectTimeout=8 <HOST_ALIAS> 'hostname; whoami; sudo -n tailscale status --self; sudo -n ufw status numbered'
nc -vz -G 5 <SERVER_IP> 22
```

The `nc` check should fail or time out. If it succeeds, public SSH is still exposed and the firewall rules need another pass.

Disable Tailscale key expiry for long-lived remotes:

1. Open Tailscale admin console > Machines.
2. Find `<HOST_ALIAS>`.
3. Open the device actions menu.
4. Choose Disable key expiry.
5. Confirm the machine row shows `Expiry disabled`.

## Install Agent Tooling

Install common build and coding-agent dependencies:

```bash
ssh <HOST_ALIAS> 'sudo -n DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo -n DEBIAN_FRONTEND=noninteractive apt-get install -y git gh python3 python-is-python3 python3-pip python3-venv python3-dev pipx build-essential curl ca-certificates unzip jq ripgrep fd-find'
```

Install `nvm`, Node LTS, npm, Corepack-managed pnpm/yarn, and Codex CLI as the `codex` user:

```bash
ssh <HOST_ALIAS> 'bash -s' <<'REMOTE'
set -euo pipefail
NVM_DIR="$HOME/.nvm"
latest_tag=$(git ls-remote --tags https://github.com/nvm-sh/nvm.git 'v*' | awk '{print $2}' | sed 's#refs/tags/##; s#\^{}##' | sort -V | tail -1)

if [ ! -d "$NVM_DIR/.git" ]; then
  git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
fi
git -C "$NVM_DIR" fetch --tags --quiet
git -C "$NVM_DIR" checkout --quiet "$latest_tag"

for f in "$HOME/.bashrc" "$HOME/.profile"; do
  touch "$f"
  if ! grep -q 'NVM_DIR' "$f"; then
    cat >> "$f" <<'EOF'

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"
EOF
  fi
done

. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm alias default 'lts/*'
nvm use default

corepack enable
corepack prepare pnpm@latest --activate
corepack prepare yarn@stable --activate
npm config set fund false
npm config set audit false
npm install -g @openai/codex@latest

NODE_BIN_DIR=$(dirname "$(command -v node)")
for bin in node npm npx corepack pnpm yarn codex; do
  sudo -n ln -sfn "$NODE_BIN_DIR/$bin" "/usr/local/bin/$bin"
done
sudo -n ln -sfn /usr/bin/fdfind /usr/local/bin/fd
REMOTE
```

Use `/usr/local/bin` shims because remote-control checks often run non-interactive shells that do not source `.bashrc`.

## Final Verification

Run the verification from a plain SSH command:

```bash
ssh <HOST_ALIAS> 'set -e
command -v codex
codex --version
node --version
npm --version
pnpm --version
yarn --version
git --version
gh --version | sed -n "1p"
python --version
python3 --version
sudo -n sshd -T | egrep "^(permitrootlogin|passwordauthentication|allowusers|kbdinteractiveauthentication|pubkeyauthentication) "
sudo -n ufw status verbose
sudo -n fail2ban-client status sshd || true
sudo -n tailscale status --self 2>/dev/null || true
test -f /var/run/reboot-required && echo reboot-required || echo reboot-not-required'
```

Expected properties:

- `command -v codex` resolves, preferably under `/usr/local/bin/codex`.
- `codex --version` prints a version.
- SSH config reports `permitrootlogin no`, `passwordauthentication no`, and `allowusers codex`.
- UFW is active.
- `ssh root@<SERVER_IP>` fails.
- If Tailscale-only SSH was configured, `<HOST_ALIAS>` resolves to the Tailscale IP and public `<SERVER_IP>:22` times out.
- `apt-get -s upgrade` shows no urgent pending upgrades, or the remaining work is reported clearly.

If the user sees `No codex found in PATH`, install `@openai/codex` and recreate the `/usr/local/bin/codex` shim.

## GitHub CLI

Install `gh`, but do not invent credentials. If the local machine already has an authenticated GitHub CLI session and the user asks to use GitHub from the remote, prefer transferring that auth through `gh auth token` over a device-code flow. Do not print the token, write it to a file, or ask the user to paste it in chat.

Generic local-to-remote `gh` auth:

```bash
gh auth status -h github.com
gh auth token -h github.com | ssh <HOST_ALIAS> 'gh auth login --hostname github.com --with-token'
ssh <HOST_ALIAS> 'gh auth setup-git --hostname github.com && gh config set git_protocol https --host github.com && gh auth status -h github.com'
```

Then clone the requested repository into a predictable remote workspace:

```bash
ssh <HOST_ALIAS> 'set -euo pipefail
mkdir -p ~/Projects
cd ~/Projects
gh repo clone <OWNER>/<REPO> <REPO>
cd <REPO>
printf "repo=%s\nbranch=%s\nhead=%s\n" "$PWD" "$(git branch --show-current)" "$(git rev-parse --short HEAD)"
git status --short --branch'
```

If local `gh` is not authenticated or token transfer is not appropriate, use the user's normal secure token flow or GitHub's device login:

```bash
ssh <HOST_ALIAS>
gh auth login
```

Do not ask for tokens in chat unless there is no safer route and the user explicitly chooses it.

## Finish In Codex

End by instructing the user:

1. Open Codex Settings.
2. Go to Connections.
3. Choose Add SSH.
4. Enter the SSH host alias, for example `<HOST_ALIAS>`, or the full `codex@<SERVER_IP>` target.
5. Save and test the connection.
