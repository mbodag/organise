---
name: memory-keeper
description: How to save, file and find things in the user's personal memory (the memory_* tools). Use whenever the user shares a fact about their life, people, plans, preferences or decisions; asks Claude to remember or forget something; or asks about anything Claude might have been told before.
---

# Memory keeper

The user's memory is a folder of Markdown files reached through the `memory_*` tools
(`memory_search`, `memory_list`, `memory_read`, `memory_write`, `memory_append`,
`memory_move`, `memory_delete`). It is the source of truth about the user's life
between conversations. The user can browse and edit these files themselves, so keep
them tidy and readable by a person.

## At the start of a conversation

Read `INDEX.md` once. It defines the folders and conventions; follow it over
anything in this skill if they disagree.

## Retrieving

- Before answering anything about the user, a person, a project or a past decision,
  search first. Never say "I don't know" without searching.
- Run 2–4 short keyword searches with different angles (the person's name, the topic,
  a synonym) instead of one long query. Then `memory_read` the top files: snippets are
  not enough to answer from.
- When you answer from memory, say which file it came from, e.g. "(from people/sarah-chen.md)".
- If memories conflict, prefer the most recently dated fact and mention the conflict.

## Saving

Save without being asked when the user shares something durable: a fact about
themselves or someone they know, a preference, a decision, a plan, a commitment, an
important date. Don't save small talk, one-off questions, or anything only relevant
to this conversation. When unsure, save to `inbox.md`.

Never save passwords, card numbers, government IDs or other secrets. Say why you didn't.

How to save:
1. **Search for an existing file first.** Update it rather than creating a duplicate.
2. Choose the folder by the rules in `INDEX.md`. One person = one file in `people/`.
3. Use `memory_append` to add a fact under the right heading, or `memory_read` then
   `memory_write` with `overwrite: true` to edit in place. Never overwrite a file you
   haven't just read.
4. New files get frontmatter (`title`, `tags`, `updated`) and `##` sections.
   Put useful search words in `tags`: nicknames, related topics.
5. Date anything that can change: `- Works at Acme [2026-11]`.
6. Update the `updated:` date in the frontmatter whenever you change a file.
7. Tell the user in one short line what you saved and where. Don't ask permission
   first unless the information is sensitive (health, money, relationships).

## Things that belong elsewhere

- Events with a time → the calendar connector, if available. Note the context in
  memory too if it matters later ("dentist said to come back in 6 months").
- Reminders → a calendar event, or a scheduled task if the user prefers.
- Work tickets → Jira, if available. Memory may hold a short summary and the ticket key.

If the needed connector isn't available, say so and save the item in `inbox.md` under
a "To schedule" heading so it isn't lost.

## Forgetting

When asked to forget something, find every place it appears, remove it, and confirm
which files you changed. Deleting a whole file needs the user's explicit OK.
