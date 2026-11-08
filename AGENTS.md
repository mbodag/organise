# organise

Personal agent: a memory MCP server (`memory-mcp/`), a starter memory layout
(`memory-template/`) and a Claude Code plugin (`plugin/`). See README.md.

## Git workflow

- Work on a feature branch (`feat/…`, `fix/…`, `chore/…`) and push it whenever you like,
  prototypes included.
- Changes reach `main` only through a pull request. Open the PR; the owner reviews and
  merges it. A ruleset on `main` enforces this.
- Keep commits atomic: one logical change each, small enough to review on its own.
- Track work as GitHub issues on this repo. Split an ask that is too big for one PR into
  issues first, then do them one at a time.
- The user's private memory repo is the exception: the memory server commits to its
  `main` directly.

## Before pushing

- `memory-mcp/` changes: `npm run typecheck` and `npm test` in `memory-mcp/`.
- `plugin/` changes: `claude plugin validate .` and `claude plugin validate plugin`.
