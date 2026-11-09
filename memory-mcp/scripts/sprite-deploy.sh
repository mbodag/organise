#!/usr/bin/env bash
# Deploy the latest main inside the Sprite: run this *in* the Sprite, e.g.
#   sprite exec -- organise/memory-mcp/scripts/sprite-deploy.sh
# First run creates the service; later runs update and restart it.
# BRANCH defaults to main; set it only to try an unmerged branch before review.
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/organise}"
SERVICE="${SERVICE:-memory}"
BRANCH="${BRANCH:-main}"

cd "$REPO_DIR"
git fetch -q origin "$BRANCH"
git checkout -q -B "$BRANCH" "origin/$BRANCH"
echo "[deploy] at $(git log --oneline -1)"

cd memory-mcp
npm ci --no-audit --no-fund
npm run build

# `services list` prints JSON: [{"name":"memory",...}]
if sprite-env services list | grep -q "\"name\":\"$SERVICE\""; then
  sprite-env services restart "$SERVICE"
  echo "[deploy] restarted service $SERVICE"
else
  sprite-env services create "$SERVICE" --cmd "$REPO_DIR/memory-mcp/scripts/start.sh" --http-port 8080
  echo "[deploy] created service $SERVICE"
fi
