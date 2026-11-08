# 5. Access: a secret token in the connector URL; an SSH deploy key for the memory repo

- **Status:** Accepted
- **Date:** 2026-11-08

## Context

Two things need protecting: who may call the memory server, and how the server reaches the
private memory repo. Secrets should never pass through chat, the code repo, or Claude's
session.

## Decision

- **Calling the server:** a long random `MCP_AUTH_TOKEN`, accepted either in the URL path
  (`/mcp/<token>`, which is what a claude.ai custom connector can send) or as an
  `Authorization: Bearer` header. Compared in constant time; wrong token → 401.
- **Reaching the memory repo:** an **SSH deploy key** generated on the Sprite by
  `scripts/sprite-setup.sh`. Only the public half leaves the Sprite; the user adds it to
  `mbodag/memory` with write access. github.com is trusted only if its host key matches
  GitHub's published fingerprint.
- Both secrets live in `~/.memory-mcp.env` on the Sprite (mode 600), generated there. The
  user reads the token once, on their own machine, to build the connector URL.

## Why

- A deploy key is limited to one repo, doesn't expire, and no secret is ever copied.
- A token in the path is the simplest auth a custom connector supports.

## Alternatives considered

| Option | Why not (for now) |
|---|---|
| Fine-grained GitHub token in `GIT_REMOTE` | Must be pasted (a copied secret) and expires, silently breaking sync. Kept as the fallback if a Sprite can't reach github.com on port 22 |
| OAuth for the connector | Proper per-user auth, but much more work for a single user. Revisit before storing anything highly sensitive |
| No auth, obscure URL | Anyone who learns the URL could read and write the memory |

## Consequences

- Anyone with the connector URL can read and write the memory: treat it like a password.
- Rotating the token means editing `~/.memory-mcp.env`, restarting the service, and
  updating the connector URL.
