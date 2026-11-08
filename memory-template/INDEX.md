---
title: Memory index
tags: index, conventions
---
# Memory index

This folder is a personal memory. Claude reads this file first and follows these rules.
Edit it freely: change the rules here and Claude's filing changes with them.

## Folders

| Folder | What goes there | Example |
|---|---|---|
| `people/` | One file per person: who they are, how you know them, birthdays, preferences, history | `people/sarah-chen.md` |
| `projects/` | Things with a goal and an end: work projects, trips, a house move | `projects/japan-trip-2027.md` |
| `areas/` | Ongoing parts of life with no end: health, finances, home, career | `areas/health.md` |
| `journal/` | Dated log entries, one file per month | `journal/2026-11.md` |
| `reference/` | Stable facts: accounts, addresses, sizes, how-tos, preferences | `reference/preferences.md` |
| `rules/` | Standing rules for how Claude should work with you. Loaded at the start of every conversation | `rules/projects.md` |
| `inbox.md` | Anything that doesn't clearly fit yet. Tidied up later | |

## File conventions

- File names are lowercase-kebab-case and end in `.md`.
- Every file starts with frontmatter: `title`, `tags` (comma-separated), and `updated` (YYYY-MM-DD).
- Facts go under `##` headings as bullets. Add a date in brackets to anything that can change: `- Lives in Lisbon [2026-11]`.
- When a fact changes, update it in place and keep the old one as `~~struck through~~` with its date, so history is visible.
- Link related files with relative links: `[Sarah](../people/sarah-chen.md)`.

## Not stored here

- Calendar events and reminders live in the calendar.
- Tickets live in Jira.
- Passwords, card numbers and other secrets are never stored here.
