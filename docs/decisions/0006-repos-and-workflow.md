# 6. Two repos, reviewed main, issues as the backlog

- **Status:** Accepted
- **Date:** 2026-11-08

## Context

The project has code that should be reviewed, and personal data that the server must write
to freely. The user wants agile delivery: small increments, atomic commits, big asks broken
into tasks.

## Decision

- **`mbodag/organise`** (public) holds the code: `memory-mcp/`, `plugin/`,
  `memory-template/`, `docs/`. Changes reach `main` only through PRs the owner merges,
  enforced by the "Protect Main" ruleset (PR required, no force push, no bypass). It is
  public because a free GitHub plan only enforces rulesets on public repos.
- **`mbodag/memory`** (private) holds personal data. The server commits to its `main`
  directly; no PRs.
- Agent instructions live in **`AGENTS.md`** (the cross-tool convention); `CLAUDE.md`
  contains only `@AGENTS.md`, so Claude Code loads the same file.
- The backlog is **GitHub Issues** on `organise`. Work too big for one PR is split into
  issues first. Jira is for personal use only.
- Decisions are recorded here, in `docs/decisions/`.

## Alternatives considered

| Option | Why not |
|---|---|
| One repo for code and memory | Personal data would sit next to public code, and PR rules would block the server's writes |
| Keep `organise` private | Rulesets aren't enforced on private repos without GitHub Pro ($4/month) or Team |
| GitHub organization with org-wide rulesets | Would give every new repo the rule by default, but costs $4/user/month. Deferred |

## Consequences

- Nothing personal goes into `organise`, including its issues.
- New repos don't get the PR rule automatically; it is added per repo.
