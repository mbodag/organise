# organise

Personal agent V0: a memory MCP server (`memory-mcp/`), a starter memory layout
(`memory-template/`) and a Claude Code plugin (`plugin/`). See README.md.

## Git workflow

- `main` is reviewed. Never commit or push directly to `main`.
- Do all work on a feature branch (`feat/...`, `fix/...`, `chore/...`). Pushing to
  feature branches is fine at any time, including for prototypes.
- Changes reach `main` only through a pull request that the owner reviews and merges.
  Claude may open the PR but does not merge it.
- The separate memory repo (the user's personal Markdown memory) is the exception:
  the memory server commits to it directly, and that's expected.

## Checks before pushing

- `cd memory-mcp && npm ci && npx tsc --noEmit`
- `claude plugin validate .` and `claude plugin validate plugin` when the plugin changes
