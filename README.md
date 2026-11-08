# Personal agent (V0)

Talk to Claude by text or voice, and have it remember things about your life in a
memory you can browse and edit yourself.

```
Claude (mobile app with voice, claude.ai, Claude Code)
   │
   ├── personal-memory connector ──► memory-mcp (hosted, always on) ──► Markdown files ──► private GitHub repo
   ├── Google Calendar connector                                                          (browse/edit on GitHub or in Obsidian)
   └── Atlassian (Jira) connector

Claude Code only: the personal-agent plugin adds the memory-keeper skill and /remember, /recall, /tidy, /brief
```

| Folder | What it is |
|---|---|
| `memory-mcp/` | Remote MCP server. Stores memory as Markdown files and commits every change to git |
| `memory-template/` | Starter memory: folder layout plus `INDEX.md`, which sets the filing rules Claude follows |
| `plugin/` | Claude Code plugin: the `memory-keeper` skill, slash commands, and an optional MCP config |
| `.claude-plugin/marketplace.json` | Lets you install the plugin straight from this repo |

Architecture diagram and status: [`docs/architecture.html`](docs/architecture.html) (download and open in a browser). Running costs: [`docs/costs.md`](docs/costs.md). Why things are built this way: [`docs/decisions/`](docs/decisions/README.md).

## 1. Create the memory repo

Create a **private** GitHub repo (for example `my-memory`), and copy the contents of
`memory-template/` into it. That repo is your memory; you can edit it anytime and the
server picks up your changes within about 30 seconds.

Create a fine-grained GitHub token with **Contents: read and write** on that repo only.

## 2. Deploy the memory server

We host it on a Fly.io Sprite (see [docs/decisions/0001](docs/decisions/0001-host-memory-server-on-fly-sprites.md)); deploy steps land with issue #2.
Any host that runs a Docker container and keeps it running also works (Fly.io Machines, Railway,
Render, a small VPS). Set these environment variables (see `memory-mcp/.env.example`):

| Variable | Value |
|---|---|
| `MCP_AUTH_TOKEN` | A long random secret: `openssl rand -hex 32` |
| `GIT_REMOTE` | `https://x-access-token:<github-token>@github.com/<you>/my-memory.git` |
| `GIT_BRANCH` | `main` |

With git sync on, the files on the server are just a working copy, so the host doesn't
need a persistent disk.

Run it locally first:

```bash
cd memory-mcp && npm install && npm run dev
```

`npm run dev` serves `memory-template/` on http://localhost:8787/mcp with **no auth**, for testing only.

## 3. Add it as a custom connector

In https://claude.ai/customize/connectors choose **Add custom connector** and use the URL:

```
https://<your-host>/mcp/<MCP_AUTH_TOKEN>
```

The token in the path is the V0 auth (see Security). Then turn on the **Google Calendar**
and **Atlassian** connectors on the same page. They are then available in the mobile app,
on claude.ai and in new Claude Code sessions.

## 4. Install the plugin (Claude Code)

After pushing this repo to GitHub:

```
/plugin marketplace add <you>/<this-repo>
/plugin install personal-agent@personal-agent
```

`plugin/.mcp.json` connects to the memory server directly
(`PERSONAL_MEMORY_URL`, `PERSONAL_MEMORY_TOKEN`; it defaults to `localhost:8787` for local dev).
**If you added the custom connector, delete `plugin/.mcp.json`**, or you'll get the memory tools twice.

Commands: `/remember <thing>`, `/recall <question>`, `/tidy` (file the inbox), `/brief [today|this week]`.

On claude.ai and in the mobile app the plugin isn't available, but the connector's
built-in instructions and `INDEX.md` still guide how Claude files things. For tighter
behaviour there, paste the body of `plugin/skills/memory-keeper/SKILL.md` into a Claude
Project's instructions, or upload it as a skill.

## Memory tools

`memory_search`, `memory_list`, `memory_read`, `memory_write` (refuses to overwrite unless asked),
`memory_append`, `memory_move`, `memory_delete`. Paths can't leave the memory folder and must end in `.md`.

## Security (V0)

- Auth is a single shared secret, in the URL path or as `Authorization: Bearer`. Anyone
  with the URL can read and write your memory, so treat the URL like a password and use HTTPS.
- Before storing anything really sensitive, replace this with OAuth (claude.ai custom
  connectors support it).
- The skill tells Claude never to store passwords, card numbers or IDs.

## Next steps (not in V0)

- **Better retrieval:** search is keyword-based. Add embeddings (for example SQLite + sqlite-vec,
  or Postgres + pgvector) behind `memory_search` without changing the tool interface.
- **A custom UI:** GitHub or Obsidian is the V0 UI. A small web app over the same repo can come later.
- **Proactive reminders:** a scheduled task that runs `/brief` each morning and sends a notification.
- **OAuth** for the connector.
