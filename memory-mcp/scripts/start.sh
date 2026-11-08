#!/usr/bin/env bash
# Start the memory server. Used as the Sprite service command (see DEPLOY.md).
# Secrets come from an env file outside the repo, never from git.
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${MEMORY_ENV_FILE:-$HOME/.memory-mcp.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[memory] missing $ENV_FILE (MCP_AUTH_TOKEN, GIT_REMOTE): see DEPLOY.md" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

export PORT="${PORT:-8080}"              # Sprites route HTTP to 8080 by default
export MEMORY_DIR="${MEMORY_DIR:-$HOME/memory}"  # persists across Sprite sleeps
exec node dist/index.js
