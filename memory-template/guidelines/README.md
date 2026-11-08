# Guidelines (situational, retrieved when needed)

Rules and preferences that matter only in some situations. One file per topic, for
example `email.md`, `python.md`, `travel.md`. They are **not** loaded every
conversation: Claude finds them with `memory_search` when a task might be covered.

- New rules you state land here by default. Claude only moves one to `rules/` (always
  loaded) when you say it applies everywhere.
- Give each file a clear `title` and good `tags` in its frontmatter, so search finds it.
