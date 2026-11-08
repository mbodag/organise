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

3. **Create a GitHub token for the memory repo.** On GitHub: Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new token. Repository access:
   *Only select repositories* → `mbodag/memory`. Permissions → Repository → **Contents: Read
   and write**. Copy the token.

4. **Write the secrets file on the Sprite.** It lives outside the repo, readable only by the
   Sprite user. Open a shell in the Sprite:

   ```bash
   sprite console
   ```

   Then, inside it:

   ```bash
   umask 077
   cat > ~/.memory-mcp.env <<EOF
   MCP_AUTH_TOKEN=$(openssl rand -hex 32)
   GIT_REMOTE=https://x-access-token:PASTE_GITHUB_TOKEN@github.com/mbodag/memory.git
   GIT_BRANCH=main
   EOF
   git config --global user.name "memory-bot"
   git config --global user.email "memory-bot@users.noreply.github.com"
   grep MCP_AUTH_TOKEN ~/.memory-mcp.env   # note this value for the connector URL
   exit
   ```

5. **Start the service and make the URL public.** The URL is public, but every MCP request
   still needs the `MCP_AUTH_TOKEN`:

   ```bash
   sprite exec -- organise/memory-mcp/scripts/sprite-deploy.sh
   sprite config update --url-auth public
   sprite info        # prints the URL: https://<name>-<org>.sprites.app
   ```

6. **Check it**, then add the connector at
   [claude.ai/customize/connectors](https://claude.ai/customize/connectors) →
   *Add custom connector* with the URL `https://<sprite-url>/mcp/<MCP_AUTH_TOKEN>`:

   ```bash
   curl https://<sprite-url>/health      # {"ok":true}
   ```

## Updating after a merge to main

```bash
sprite exec -- organise/memory-mcp/scripts/sprite-deploy.sh
```

## Troubleshooting

```bash
sprite exec -- sprite-env services list
sprite exec -- tail -n 50 /.sprite/logs/services/memory.log
```

## Not yet verified

These steps follow Fly's Sprites guide but haven't been run end to end yet:

- the output format of `sprite-env services list`, which the deploy script greps
- that a sleeping Sprite wakes fast enough for the connector (ADR 0001 says to test this from the phone)
