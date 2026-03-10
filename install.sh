#!/bin/bash
set -euo pipefail

REPO="vltansky/skills/skills"

echo "Installing all skills from $REPO globally..."
npx -y skills add "$REPO" --all -g

echo ""
echo "Done. Installed skills:"
npx -y skills list -g 2>/dev/null || ls -1 ~/.agents/skills/ 2>/dev/null
