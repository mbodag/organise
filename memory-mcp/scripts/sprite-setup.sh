#!/usr/bin/env bash
# One-time setup inside the Sprite. Safe to re-run: keeps anything that exists.
#   sprite exec -- organise/memory-mcp/scripts/sprite-setup.sh
# Creates:
#   ~/.ssh/memory_deploy       SSH deploy key for mbodag/memory (private half never leaves the Sprite)
#   ~/.ssh/known_hosts         GitHub's host key, checked against GitHub's published fingerprint
#   ~/.memory-mcp.env          MCP_AUTH_TOKEN (generated here) and GIT_REMOTE
# Prints the PUBLIC key to add on GitHub. It never prints the auth token.
set -euo pipefail

MEMORY_REPO="${MEMORY_REPO:-mbodag/memory}"
KEY="$HOME/.ssh/memory_deploy"
ENV_FILE="${MEMORY_ENV_FILE:-$HOME/.memory-mcp.env}"
# GitHub's published ed25519 host key fingerprint:
# https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints
GITHUB_ED25519_FP="SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU"

# 0. SSH tools (git needs them for the deploy key; Sprites list Git but not SSH)
if ! command -v ssh-keygen >/dev/null || ! command -v ssh >/dev/null; then
  echo "[setup] installing openssh-client"
  if command -v sudo >/dev/null; then SUDO=sudo; else SUDO=""; fi
  $SUDO apt-get update -qq && $SUDO apt-get install -y -qq openssh-client >/dev/null \
    || { echo "[setup] could not install openssh-client; install it, then re-run" >&2; exit 1; }
fi

umask 077
mkdir -p "$HOME/.ssh"

# 1. Deploy key
if [[ ! -f "$KEY" ]]; then
  ssh-keygen -q -t ed25519 -N "" -C "memory-server@sprite" -f "$KEY"
  echo "[setup] created deploy key"
fi

# 2. Trust github.com, but only if its key matches the published fingerprint
if ! ssh-keygen -F github.com -f "$HOME/.ssh/known_hosts" >/dev/null 2>&1; then
  scanned="$(ssh-keyscan -t ed25519 github.com 2>/dev/null || true)"
  if [[ -z "$scanned" ]]; then
    echo "[setup] could not reach github.com on port 22 (SSH); check the network and re-run" >&2
    exit 1
  fi
  fp="$(printf '%s\n' "$scanned" | ssh-keygen -lf - | awk '{print $2}')"
  if [[ "$fp" != "$GITHUB_ED25519_FP" ]]; then
    echo "[setup] github.com host key fingerprint '$fp' does not match GitHub's published one. Stopping." >&2
    exit 1
  fi
  printf '%s\n' "$scanned" >> "$HOME/.ssh/known_hosts"
  echo "[setup] trusted github.com ($fp)"
fi

# 3. Use the deploy key for github.com
if ! grep -q "memory_deploy" "$HOME/.ssh/config" 2>/dev/null; then
  cat >> "$HOME/.ssh/config" <<CFG
Host github.com
  IdentityFile $KEY
  IdentitiesOnly yes
CFG
  echo "[setup] ssh config written"
fi

# 4. Secrets file: auth token generated here, git remote over SSH
if [[ ! -f "$ENV_FILE" ]]; then
  {
    echo "MCP_AUTH_TOKEN=$(openssl rand -hex 32)"
    echo "GIT_REMOTE=git@github.com:${MEMORY_REPO}.git"
    echo "GIT_BRANCH=main"
  } > "$ENV_FILE"
  echo "[setup] created $ENV_FILE"
fi

# 5. Identity for the server's commits
git config --global user.name >/dev/null || git config --global user.name "memory-bot"
git config --global user.email >/dev/null || git config --global user.email "memory-bot@users.noreply.github.com"

echo
echo "Add this PUBLIC key on GitHub: ${MEMORY_REPO} → Settings → Deploy keys → Add deploy key,"
echo "title 'sprite memory server', tick 'Allow write access':"
echo
cat "$KEY.pub"
