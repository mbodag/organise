# 2. Store memory as Markdown files in a private git repo

- **Status:** Accepted
- **Date:** 2026-11-08

## Context

The agent needs long-term memory that it can read, write and search, and that the user can
browse and correct by hand ("see how information is organized and make changes yourself").
It must survive the server being moved or rebuilt.

## Decision

Memory is a folder of **Markdown files** in a **private GitHub repo** (`mbodag/memory`).
The memory server keeps a working copy: it pulls before reading (at most every 30 s) and
commits and pushes after every write. Files follow the conventions in the repo's
`INDEX.md` (folders `people/`, `projects/`, `areas/`, `journal/`, `reference/`, `rules/`,
`guidelines/`, `inbox.md`; frontmatter with `title`, `tags`, `updated`).

Search is **keyword-based** for now (`memory_search`), scoring path, title/tags and body.

## Why

- **The user gets a UI for free:** GitHub's web view, or Obsidian on a clone. No admin app
  to build for V0.
- **Every change is versioned.** Mistakes can be undone and history is visible.
- **The server holds no state,** so it can be rebuilt or moved freely ([ADR 0001](0001-host-memory-server-on-fly-sprites.md)).
- **It's portable:** plain text with no vendor format ([ADR 0007](0007-stay-portable.md)).

## Alternatives considered

| Option | Why not (for now) |
|---|---|
| A database (SQLite, Postgres) | Needs its own UI and backups; harder to edit by hand |
| A vector database / embeddings | Better fuzzy recall, but more moving parts and cost. Can be added later behind `memory_search` without changing the tools |
| Claude's built-in memory | Not under the user's control or easily browsable, and tied to one product |
| Notion / Google Docs | Vendor-specific APIs and formats; weaker version history |

## Consequences

- Keyword search can miss things phrased differently. Upgrade path: embeddings behind the
  same tool interface.
- Hand edits on GitHub show up in the server within ~30 s, on the next pull.
- A single writer is assumed. Writes are queued inside the server; two servers writing at
  once would conflict, so run exactly one instance.
- The `memory-template/` folder in `organise` is the blueprint used to seed the repo, and
  the fixture for local testing.
