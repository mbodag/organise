# 8. Deploy the memory server automatically on every merge to main

- **Status:** Accepted
- **Date:** 2026-11-09
- **Issue:** [#17](https://github.com/mbodag/organise/issues/17)

## Context

Deploys were manual: someone with the `sprite` CLI logged in ran
`sprite exec -s memory -- organise/memory-mcp/scripts/sprite-deploy.sh`. Merged changes
didn't reach the Sprite until then, and the Sprite could run code that wasn't on `main`
(it ran the unmerged `feat/sprite-deploy` branch for a while). That drift is the main risk
named in [ADR 0001](0001-host-memory-server-on-fly-sprites.md).

## Decision

Use GitHub Actions for CI/CD:

- **CI** (`.github/workflows/ci.yml`): typecheck and test `memory-mcp/` on every pull request
  and push to `main`. It uses no secrets.
- **CD** (`.github/workflows/deploy.yml`): on a push to `main` that touches `memory-mcp/` (or
  the workflow itself), or when started by hand:
  1. run CI as a gate
  2. install the Sprites CLI and authenticate with `SPRITES_TOKEN`
  3. run `sprite-deploy.sh` on the Sprite with `BRANCH=main`
  4. report the deployed commit and health-check `SPRITE_URL`
- Deploys run **one at a time, in merge order**, and are never cancelled halfway; the server
  assumes a single writer ([ADR 0002](0002-memory-as-markdown-in-git.md)).
- Secrets live in a GitHub **environment** called `production`: `SPRITES_TOKEN`, a Sprites
  token made in the Fly dashboard, and `SPRITE_URL`.
- The deploy workflow **never runs on pull requests**. The repo is public, and a PR from a
  fork must not get a token that can run commands on the Sprite.

## Why

- **Merge = deploy:** the Sprite always runs what's on `main`, which the owner reviewed.
- **No laptop needed:** deploys work from the phone (merge in the GitHub app).
- **Tests gate every deploy,** and failures show up in the Actions tab.
- **It's free:** Actions costs nothing for public repos.

## Alternatives considered

| Option | Why not |
|---|---|
| Keep manual deploys | Drift between `main` and the Sprite, and deploys need a machine with the CLI |
| Sprite pulls `main` on a schedule | Runs untested code, deploy failures are invisible, and it delays every change |
| Sprites REST API instead of the CLI | Same token; the CLI handles exec output and exit codes already |

## Consequences

- A Sprites token in GitHub can run commands on the Sprite, which holds the memory deploy key
  and `MCP_AUTH_TOKEN`. Protect it accordingly: rotate it if exposed, and narrow its scope if
  Fly allows per-Sprite tokens (not found in the docs as of this record).
- Actions logs are public for this repo, so the URL is a secret (masked in logs) and the
  workflow prints nothing sensitive. The deploy script prints only the commit and build output.
- **Rollback:** revert the bad commit on `main` with a PR. Merging it redeploys. For an
  immediate rollback, run the manual command with `BRANCH` set to a branch at the last good
  commit.
- The manual command stays documented in `memory-mcp/DEPLOY.md` as the fallback.
