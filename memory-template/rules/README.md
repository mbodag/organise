# Rules (core, always loaded)

Core rules for how Claude works with you: the few that apply to almost everything.
One file per topic, for example `git.md`, `projects.md`, `tools.md`.

- Everything in this folder **except this README** is sent to Claude at the start of
  every conversation, through the memory connector. That costs context every time, so
  keep this tier short: the total is capped at 4 KB (about 1,000 tokens), and anything
  past that is left out.
- Rules that matter only sometimes ("when writing emails…", "for Python projects…")
  go in `guidelines/` instead. Claude searches for those when a task needs them.
- Write each rule as a bullet. Say what to do, not just what to avoid.
- You can edit these files directly. Changes apply from the next conversation.
