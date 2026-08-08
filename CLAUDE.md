# CLAUDE.md

Instructions for Claude Code sessions in this repo.

## Start here, every session
1. Read `PLAN.md` for architecture and phase overview.
2. List open issues labeled with the current phase (see below) — via `gh issue list --label current-phase`
   or the GitHub MCP tools if connected.
3. Pick the next open issue in that list, top to bottom, unless the user directs otherwise.
4. If no issues are labeled `current-phase`, check `PLAN.md` for the next phase, open/label
   the relevant issues, and confirm scope with the user before starting.

## Phase labels
Issues are labeled `phase-1` through `phase-5` per `PLAN.md`. Exactly one phase should carry
the `current-phase` label at a time — move it forward as phases complete.

## Working conventions
- One issue = one focused PR. Keep PRs small and reviewable.
- Reference the issue number in commits/PRs (`Closes #12`).
- Update the issue with a short status comment if you stop mid-task, so the next session
  (possibly weeks later) knows where things were left.
- Secrets (Supabase service key, webhook secret, OpenRouter key) are never committed —
  Worker secrets via `wrangler secret put`, web app via `.env.local` (gitignored).
- RLS is the actual privacy boundary for public vs. private data — any schema change
  touching `public_insights` or the raw tables needs a matching RLS check, not just app-level filtering.

## Repo layout
```
apps/web/          Next.js app (private dashboard + public page)
workers/health-mcp/  Cloudflare Worker (webhook ingest + MCP server)
supabase/           schema.sql, migrations
PLAN.md             architecture + phase roadmap
```

## When stuck or scope is unclear
Stop and ask the user rather than guessing — especially for anything touching auth,
RLS policies, or what's exposed on the public page.