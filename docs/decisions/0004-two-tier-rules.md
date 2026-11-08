# 4. Rules in two tiers: core rules always loaded, guidelines retrieved

- **Status:** Accepted
- **Date:** 2026-11-08
- **Issue:** [#1](https://github.com/mbodag/organise/issues/1)

## Context

The user doesn't want to repeat standing preferences ("commits are atomic", "Jira is
personal only") in every conversation, on any surface. But loading every preference into
every conversation wastes context.

## Decision

- **Core rules** live in the memory repo's `rules/` folder: the few that apply to almost
  everything. The memory server reads them on every new connection and appends them to the
  MCP **server instructions**, which Claude receives before the first message. Capped at
  4 KB (about 1,000 tokens); `rules/README.md` is excluded.
- **Guidelines** live in `guidelines/`: situational rules and preferences. They are **not**
  loaded up front; the instructions tell Claude the folder exists and to search it when a
  task might be covered (progressive disclosure, like skills).
- When the user states a new rule, Claude saves it to `guidelines/` by default, and to
  `rules/` only when the user says it applies everywhere.
- In Claude Code, a plugin `SessionStart` hook will add the same context as a backup (#4).

## Why

- Server instructions are the only way to get context into **every** conversation on the
  mobile app; there are no hooks or plugins there.
- Editing a rules file takes effect from the next conversation, with no deploy.

## Alternatives considered

| Option | Why not |
|---|---|
| Everything in `CLAUDE.md` / the plugin | Claude Code only, and edits need a PR |
| Profile preferences in claude.ai | Not version-controlled; becomes a second source of truth. Kept to a one-line pointer (#5) |
| Load every rule always | Bloats context; the user explicitly asked for progressive disclosure |

## Consequences

- Guidelines are only found if Claude thinks to search. If that proves unreliable, list just
  the **titles** of `guidelines/` files in the instructions (cheap, like skill descriptions).
- The core tier must be kept short by hand.
