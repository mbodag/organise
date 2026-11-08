# Rules

Standing rules for how Claude works with you: one file per topic, for example
`git.md`, `projects.md`, `tools.md`, `communication.md`.

- Everything in this folder **except this README** is sent to Claude at the start
  of every conversation, through the memory connector. Keep rules short: the total
  is capped at 8 KB, and anything past that is left out.
- Write each rule as a bullet. Say what to do, not just what to avoid.
- Claude adds rules here when you state one ("from now on…", "always…").
  You can also edit these files directly. Changes apply from the next conversation.
- Personal facts belong elsewhere (`people/`, `reference/`…). Rules are about how
  Claude should behave.
