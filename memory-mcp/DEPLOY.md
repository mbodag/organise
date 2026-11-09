# Deploy the memory server on a Fly.io Sprite

Why a Sprite: [ADR 0001](../docs/decisions/0001-host-memory-server-on-fly-sprites.md).
The Sprite runs `scripts/start.sh` as a service; `scripts/sprite-deploy.sh` keeps it in step
with `main`. Commands below run wherever the `sprite` CLI is installed and logged in.

## One-time setup

1. **Install and log in** ([fly.io/sprites](https://fly.io/sprites/agent-ready.md)):

   ```bash
   curl https://sprites.dev/install.sh | bash
   sprite login
   ```

2. **Create the Sprite and clone this repo into it:**

   ```bash
   sprite create --skip-console memory
   sprite use memory
   sprite exec -- git clone https://github.com/mbodag/organise
   ```

3. **Run the one-time setup inside the Sprite.** It installs the SSH tools if they're
   missing, creates a **deploy key** (an SSH key pair whose private half never leaves the
   Sprite), trusts github.com after checking its key against
   [GitHub's published fingerprint](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints)
   (Ed25519: `SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU`), and writes
   `~/.memory-mcp.env` with a freshly generated `MCP_AUTH_TOKEN` and
   `GIT_REMOTE=git@github.com:mbodag/memory.git`. Safe to re-run.

   ```bash
   sprite exec -- organise/memory-mcp/scripts/sprite-setup.sh
   ```

   It ends by printing the **public** key, which is safe to share.

4. **Add the deploy key on GitHub:** `mbodag/memory` → Settings → Deploy keys → *Add deploy
   key*. Title `sprite memory server`, paste the public key, tick **Allow write access**,
   then *Add key*. This key can only reach that one repo, and it doesn't expire.

5. **Start the service and make the URL public.** The URL is public, but every MCP request
   still needs the `MCP_AUTH_TOKEN`:

   ```bash
   sprite exec -- organise/memory-mcp/scripts/sprite-deploy.sh
   sprite config update --url-auth public
   sprite info        # prints the URL: https://<name>-<org>.sprites.app
   ```

6. **Check it**, read your token (run this yourself, so the token stays out of any chat),
   then add the connector at
   [claude.ai/customize/connectors](https://claude.ai/customize/connectors) →
   *Add custom connector* with the URL `https://<sprite-url>/mcp/<MCP_AUTH_TOKEN>`:

   ```bash
   curl https://<sprite-url>/health      # {"ok":true}
   sprite exec -- grep MCP_AUTH_TOKEN .memory-mcp.env
   ```

## Finding the URL later

On a machine where the `sprite` CLI isn't set up yet, install it and log in first (step 1 above),
then pick the Sprite:

```bash
sprite login
sprite use memory
sprite info                            # prints https://<name>-<org>.sprites.app
curl https://<sprite-url>/health       # {"ok":true}
```

Without the CLI, the address is also in claude.ai → Settings → Connectors, in the personal-memory
connector's URL: everything before `/mcp/`. The rest of that URL is the token, so don't copy it
anywhere.

The connector URL is that address plus `/mcp/<MCP_AUTH_TOKEN>`. The URL isn't written down
in this repo because the repo is public; `sprite info` is the source of truth.

## Updating after a merge to main

**Automatic.** Every merge to `main` that touches `memory-mcp/` runs
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml): tests, then
`sprite-deploy.sh` on the Sprite, then a health check
([ADR 0008](../docs/decisions/0008-deploy-on-merge-to-main.md)). Watch it under the repo's
**Actions** tab. To redeploy without a code change: Actions → Deploy → *Run workflow*.

**One-time setup** for the automation, in GitHub → Settings → Environments → `production`:

| Secret | Value |
|---|---|
| `SPRITES_TOKEN` | A Sprites token from `https://fly.io/dashboard/<org>/sprites/tokens` (format `org-slug/org-id/token-id/token-value`) |
| `SPRITE_URL` | The Sprite's URL from `sprite info`, e.g. `https://<name>-<org>.sprites.app` |

**By hand** (fallback, e.g. if Actions is down), from any machine where the CLI is logged in:

```bash
sprite exec -s memory -- organise/memory-mcp/scripts/sprite-deploy.sh
```

## Troubleshooting

```bash
sprite exec -- sprite-env services list
sprite exec -- tail -n 50 /.sprite/logs/services/memory.log
```

## Not yet verified

Verified on 2026-11-08: Sprites ship with `openssh-client` and Node, reach github.com on
port 22 (host key matched GitHub's fingerprint), and `sprite-env services list` prints JSON.
Still to verify:

- that a sleeping Sprite wakes fast enough for the connector (ADR 0001 says to test this from the phone)
