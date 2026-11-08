#!/usr/bin/env bash
# Deploy the latest main inside the Sprite: run this *in* the Sprite, e.g.
#   sprite exec -- organise/memory-mcp/scripts/sprite-deploy.sh
# First run creates the service; later runs update and restart it.
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/organise}"
SERVICE="${SERVICE:-memory}"

cd "$REPO_DIR"
git fetch -q origin main
git checkout -q main
git merge -q --ff-only origin/main
echo "[deploy] at $(git log --oneline -1)"

cd memory-mcp
npm ci --no-audit --no-fund
npm run build

if sprite-env services list | grep -qw "$SERVICE"; then
  sprite-env services restart "$SERVICE"
  echo "[deploy] restarted service $SERVICE"
else
  sprite-env services create "$SERVICE" --cmd "$REPO_DIR/memory-mcp/scripts/start.sh" --http-port 8080
  echo "[deploy] created service $SERVICE"
fi
