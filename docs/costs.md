# Costs

Every running or planned cost of the personal agent, in one place. Update this file
whenever something is added, removed, or changes price, and update the cost table in
[`architecture.html`](architecture.html) to match.

**Last checked:** 2026-11-08 · **Currency:** USD

## Total

| | Per month |
|---|---|
| **Today** (nothing deployed yet) | **$0** on top of your Claude plan |
| **After deploying the memory server** (issue #2) | **~$2.19** on top of your Claude plan |

## Line items

| Item | What it's for | Status | Monthly cost | Notes |
|---|---|---|---|---|
| Claude subscription | The Claude apps, Claude Code, connectors | Existing | _your plan_ | Already paid; this project adds nothing to it. Connectors and plugins carry no extra charge |
| GitHub Free | `mbodag/organise` (public) and `mbodag/memory` (private) | Live | $0 | Free includes unlimited public and private repos. Rulesets are enforced on `organise` because it is public |
| Fly.io machine | Runs the memory server 24/7: `shared-cpu-1x`, 256 MB, always on, one machine | Planned (#2) | ~$2.19 | Fly's list price for this preset. Regions can differ slightly; London may be a little more |
| Fly.io IPv4 | Public address for the server | Planned (#2) | $0 | Each app gets a shared IPv4 and IPv6 free. A dedicated IPv4 would be $2/month and isn't needed |
| Fly.io bandwidth | Traffic between Claude and the server | Planned (#2) | ~$0 | Text-only requests from one person: far below anything billable |
| Google Calendar, Gmail, Drive, Atlassian connectors | Calendar, email, files, Jira | Live | $0 | Part of the Claude plan; the Google and Atlassian accounts are your existing ones |

## Optional / not chosen

| Item | Would give | Monthly cost | Decision |
|---|---|---|---|
| GitHub Pro | Enforced rulesets on private repos | $4 | Not needed: `organise` was made public instead |
| GitHub Team organization | Org-wide default rulesets for every future repo | $4 per user | Deferred; revisit if repos multiply |
| Railway (instead of Fly.io) | Same hosting, friendlier dashboard | ~$5 | Alternative if Fly doesn't work out |
| Render paid (instead of Fly.io) | Same hosting | ~$7 | Free plan sleeps, which breaks connectors |

## Future (not planned yet)

| Item | When it would apply | Cost model |
|---|---|---|
| Claude API usage | If we build our own agent client (issue #6) instead of using the Claude apps | Pay per token; depends on usage |
| Embeddings for smarter search | If keyword search isn't good enough | Small per-request cost, or a self-hosted model |
| Custom domain | If we want `memory.<you>.com` instead of `*.fly.dev` | ~$10–15 per year |

## Sources

- Fly.io: list price for `shared-cpu-1x` / 256 MB at $0.0030/hour ($2.19/month) and $2/month for a
  dedicated IPv4, per [fly.io/pricing](https://fly.io/pricing) as quoted in search results on
  2026-11-08 (the page itself was not reachable from the session that wrote this). The
  smallest preset rose from $1.94 when Fly raised its RAM price; older guides show the old figure.
- GitHub: [github.com/pricing](https://github.com/pricing): Free $0 with unlimited private
  repos, Team $4 per user/month. Pro $4/month per third-party 2026 guides.
