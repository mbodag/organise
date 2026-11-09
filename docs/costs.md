# Costs

Every running or planned cost of the personal agent, in one place. Update this file
whenever something is added, removed, or changes price, and update the cost table in
[`architecture.html`](architecture.html) to match.

**Last checked:** 2026-11-08 · **Currency:** USD

## Total

| | Per month |
|---|---|
| **Today** (nothing deployed yet) | **$0** on top of your Claude plan |
| **After deploying the memory server** (issue #2) | **~$0**: usage of a few cents, and Fly waives invoices under $5 |

## Line items

| Item | What it's for | Status | Monthly cost | Notes |
|---|---|---|---|---|
| Claude subscription | The Claude apps, Claude Code, connectors | Existing | _your plan_ | Already paid; this project adds nothing to it. Connectors and plugins carry no extra charge |
| GitHub Free | `mbodag/organise` (public) and `mbodag/memory` (private) | Live | $0 | Free includes unlimited public and private repos. Rulesets are enforced on `organise` because it is public |
| GitHub Actions | CI on PRs, deploy on merge to `main` ([ADR 0008](decisions/0008-deploy-on-merge-to-main.md)) | Planned (#17) | $0 | Free for public repos. Each deploy also uses a minute or two of Sprite CPU: cents at most |
| Fly.io Sprite | Runs the memory server; sleeps when idle, wakes on a request ([ADR 0001](decisions/0001-host-memory-server-on-fly-sprites.md)) | Planned (#2) | ~$0.10 or less | Metered only while awake: CPU $0.0385/CPU-hour, memory $0.021875/GB-hour. Disk: $0.50/GB-month while awake, $0.02/GB-month always. A mostly idle server with a few hundred MB on disk lands in cents. Estimate, to check against the first invoice |
| Fly.io waiver | | | −(all of it) | "Invoices under $5 are waived" for the whole Fly account invoice. Unclear whether a $5+ invoice is then charged in full; assume it is |
| Google Calendar, Gmail, Drive, Atlassian connectors | Calendar, email, files, Jira | Live | $0 | Part of the Claude plan; the Google and Atlassian accounts are your existing ones |

## Optional / not chosen

| Item | Would give | Monthly cost | Decision |
|---|---|---|---|
| GitHub Pro | Enforced rulesets on private repos | $4 | Not needed: `organise` was made public instead |
| GitHub Team organization | Org-wide default rulesets for every future repo | $4 per user | Deferred; revisit if repos multiply |
| Fly.io Machine (instead of a Sprite) | Always-on container rebuilt from the Dockerfile; the fallback in ADR 0001 | $2.19 (US) · $2.28 (Amsterdam) · $2.49 (Paris, London) | Not chosen; still under the $5 waiver if we switch |
| Railway (instead of Fly.io) | Same hosting, friendlier dashboard | ~$5 | Alternative if Fly doesn't work out |
| Render paid (instead of Fly.io) | Same hosting | ~$7 | Free plan sleeps, which breaks connectors |

## Future (not planned yet)

| Item | When it would apply | Cost model |
|---|---|---|
| Claude API usage | If we build our own agent client (issue #6) instead of using the Claude apps | Pay per token; depends on usage |
| Embeddings for smarter search | If keyword search isn't good enough | Small per-request cost, or a self-hosted model |
| Custom domain | If we want `memory.<you>.com` instead of `*.sprites.app` | ~$10–15 per year |

## Sources

- Fly.io: [fly.io/pricing.md](https://fly.io/pricing.md), read directly on 2026-11-08: Sprites
  metered rates, Machines regional prices, the $1 trial and "invoices under $5 are waived".
  Fly has no region in Spain; Amsterdam is the cheapest in Europe.
- GitHub: [github.com/pricing](https://github.com/pricing): Free $0 with unlimited private
  repos, Team $4 per user/month. Pro $4/month per third-party 2026 guides.
