# 7. Stay portable: open formats and MCP, so the Claude apps can be replaced later

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** [#6](https://github.com/mbodag/organise/issues/6)

## Context

Getting always-loaded context into the Claude mobile app needs a workaround
([ADR 0004](0004-two-tier-rules.md)). The user may later build their own agent client (for
example with the Claude Agent SDK, with its own voice and mobile UI) instead of using the
Claude apps.

## Decision

Build every part so it survives that move:

- Data and rules are plain Markdown in the user's own git repo.
- Tools are exposed over MCP, an open standard.
- Skills, commands and rules are files in repos. Claude app settings (profile preferences,
  uploaded skills) are copies of those files, never the only source.
- Avoid features that exist in one Claude surface only, unless a file-based equivalent exists.

## Consequences

- Moving to an own client changes only the front end; the memory server, memory repo and
  rules are reused unchanged.
- An own client would bill Claude API usage per token instead of the subscription (see
  `docs/costs.md`).
