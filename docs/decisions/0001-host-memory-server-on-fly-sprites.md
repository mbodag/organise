# 1. Host the memory server on a Fly.io Sprite

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** [#2](https://github.com/mbodag/organise/issues/2)

## Context

The memory server (`memory-mcp/`) must run somewhere always reachable over public
HTTPS, because claude.ai connectors call it from Anthropic's servers at any hour. It
holds no data of its own: the notes live in the private `mbodag/memory` repo, and the
server keeps a working copy that it pulls from and pushes to.

The load is one person's: a handful of small requests a day, idle almost all the time.

Fly.io offers two products on one account:

- **Machines** run a container built from a Dockerfile, replaced on every `fly deploy`.
- **Sprites** are persistent Linux computers that sleep when idle and wake on a command or
  an HTTP request "in well under a second". Fly's own agent guide
  (<https://fly.io/agent-ready.md>) recommends Sprites to "host an MCP server or a
  personal agent".

## Decision

Run the memory server on a **Fly.io Sprite**, as a Sprite service, with its URL made
public. The server's own `MCP_AUTH_TOKEN` stays the access control.

## Why

- **It fits the load.** Sprites bill CPU and memory only while awake, so a mostly idle
  server costs cents. Machines bill an always-on machine (~$2.19–2.49/month).
- **The vendor recommends it** for exactly this use. This is a weak reason on its own,
  because Sprites is Fly's newer product.
- **The working copy persists.** The notes clone stays on disk across sleeps instead of
  being re-cloned on every restart.
- **It prepares the future agent client** ([#6](https://github.com/mbodag/organise/issues/6)),
  which could run on a Sprite too.
- **Switching is cheap.** The server is stateless, so moving hosts means a redeploy and a
  new connector URL.

## Alternatives considered

| Option | Why not (for now) |
|---|---|
| **Fly Machines** | Strongest alternative: deploys are rebuilt from the repo's Dockerfile, and secrets are handled by `fly secrets`. But it is always on and billed as such for a server that is almost always idle. `fly.toml` and the Dockerfile stay in the repo as the fallback |
| **Railway** (~$5/month) | Same model as Machines, at a higher price |
| **Render** | The free plan sleeps for tens of seconds, too slow for a connector. The paid plan is ~$7/month |
| **Google Cloud Run** | Scales to zero but re-clones on every cold start; keeping it warm costs more |
| **A VPS** (Hetzner, DigitalOcean) | Cheap, but we would maintain the OS, HTTPS and restarts ourselves |
| **Own computer + tunnel** | Free, but only up while that computer is on |
| **Cloudflare Workers** | No `git` or ordinary disk, so the storage layer would need a rewrite |

## Consequences

- **Deploys are commands in the Sprite, not image builds.** To stop the Sprite drifting
  from `main`, deploy with a script in the repo (`git pull`, build, restart the service)
  instead of editing the Sprite by hand.
- **The first request after idle pays a wake-up.** Fly says it is under a second. We
  verify this from the phone before relying on it; if it is too slow, we fall back to
  Machines.
- **Secrets handling is unproven.** The guides don't say how a Sprite service receives
  environment secrets (`MCP_AUTH_TOKEN`, the GitHub token). We settle this during setup
  and record it in the deploy script.
- **Costs** are tracked in [`../costs.md`](../costs.md).

## Revisit when

- Wake-up latency makes the connector feel slow or time out.
- Monthly cost passes the $5 waiver.
- The Sprite drifts from `main` despite the deploy script.
