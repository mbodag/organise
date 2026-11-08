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

## Update 2026-11-08: instructions alone don't reach every app

In the Claude app, the core rules were **not** in context at the start of a chat
([#14](https://github.com/mbodag/organise/issues/14)), although the server sends them in its
instructions and Claude Code receives them. The likely cause: the app loads connector tools
on demand and doesn't show the model a connector's instructions. That can't be confirmed
from outside the app.

So the core rules now reach Claude three ways, and any one is enough:

1. **Server instructions** (above): automatic where the client supports them, e.g. Claude Code.
2. **The `memory_rules` tool** returns the same rules block. Its description tells Claude to
   call it at the start of every conversation unless the rules are already in context.
3. **A one-line bootstrap in claude.ai profile preferences**, which every chat on every
   device loads:

   > At the start of every conversation, call the Personal memory connector's
   > `memory_rules` tool and follow the rules it returns. Save new rules there, not here.

   This is only a pointer. The rules themselves stay in the memory repo
   ([ADR 0007](0007-stay-portable.md)).

The server logs one line per request (methods and tool names only), so whether a chat
called `memory_rules` can be checked in the Sprite's service log.

## Why

- Server instructions are the only way to get context into **every** conversation on the
  mobile app; there are no hooks or plugins there.
- Editing a rules file takes effect from the next conversation, with no deploy.

## Alternatives considered

| Option | Why not |
|---|---|
| Everything in `CLAUDE.md` / the plugin | Claude Code only, and edits need a PR |
| Profile preferences in claude.ai | Not version-controlled; becomes a second source of truth. Used only for a one-line pointer to `memory_rules` |
| Load every rule always | Bloats context; the user explicitly asked for progressive disclosure |

## Consequences

- Guidelines are only found if Claude thinks to search. If that proves unreliable, list just
  the **titles** of `guidelines/` files in the instructions (cheap, like skill descriptions).
- The core tier must be kept short by hand.
