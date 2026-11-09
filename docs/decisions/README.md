# Architecture decisions

One file per decision: what was decided, why, what else was considered, and what follows.
Add a new numbered file for a new decision; to reverse one, write a new record that
supersedes it rather than editing history.

| # | Decision | Status |
|---|---|---|
| [0001](0001-host-memory-server-on-fly-sprites.md) | Host the memory server on a Fly.io Sprite | Accepted |
| [0002](0002-memory-as-markdown-in-git.md) | Store memory as Markdown files in a private git repo | Accepted |
| [0003](0003-memory-server-as-mcp-connector.md) | Reach the memory through a remote MCP connector; the plugin only adds Claude Code extras | Accepted |
| [0004](0004-two-tier-rules.md) | Rules in two tiers: core rules always loaded, guidelines retrieved | Accepted |
| [0005](0005-access-token-url-and-deploy-key.md) | Access: a secret token in the connector URL; an SSH deploy key for the memory repo | Accepted |
| [0006](0006-repos-and-workflow.md) | Two repos, reviewed main, issues as the backlog | Accepted |
| [0007](0007-stay-portable.md) | Stay portable: open formats and MCP | Accepted |
| [0008](0008-deploy-on-merge-to-main.md) | Deploy the memory server automatically on every merge to main | Accepted |
