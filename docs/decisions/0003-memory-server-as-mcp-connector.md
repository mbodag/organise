# 3. Reach the memory through a remote MCP connector; the plugin only adds Claude Code extras

- **Status:** Accepted
- **Date:** 2026-11-08

## Context

The user wants to talk to the agent from a phone (text and voice), the web and Claude Code.
Claude Code **plugins** bundle skills, slash commands, subagents, hooks and MCP config,
but they only run in Claude Code, not in the Claude mobile or web chat. **Connectors**
(remote MCP servers added in claude.ai) work on every surface.

## Decision

- The memory is served by **our own remote MCP server** (`memory-mcp/`), added as a
  **custom connector** in claude.ai. This is the part every surface shares.
- The **plugin** (`plugin/`) is a Claude Code add-on: the `memory-keeper` skill,
  `/remember`, `/recall`, `/tidy`, `/brief`, and (planned, #4) a `SessionStart` hook. Its
  `.mcp.json` points at the same server; drop it when the connector is configured, so the
  tools don't appear twice.
- Calendar, email, files and Jira use existing connectors (Google, Atlassian).

## Why

- The connector is the **only** mechanism that reaches the mobile chat app.
- MCP is an open standard, so the server works with any MCP client ([ADR 0007](0007-stay-portable.md)).

## Alternatives considered

| Option | Why not |
|---|---|
| Plugin-only, with a local (stdio) MCP server | Doesn't reach the phone; a cloud session's container is temporary, so local storage would be lost |
| Plugin plus a remote server, no connector | Same: plugins don't run in the mobile chat |

## Consequences

- On mobile and web there are no slash commands; the same asks work in plain words, and the
  skill can be uploaded to claude.ai as a custom skill (#5).
- The server must be hosted, always reachable over HTTPS ([ADR 0001](0001-host-memory-server-on-fly-sprites.md)).
