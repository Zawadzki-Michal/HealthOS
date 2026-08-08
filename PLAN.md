# HealthOS — Plan

A personal health/training OS: Apple Health ingestion, a private tracking dashboard,
a public "case study" page, and a Claude Project on top that can read and log data.

## Architecture

```
Apple Watch/Health
   -> Health Auto Export (webhook)
   -> Cloudflare Worker (workers/health-mcp)
        - /webhook/health-auto-export  (ingest, writes RAW tables)
        - /mcp                         (MCP server, tools for Claude)
   -> Supabase (raw tables: service_role only)
        - aggregation job (cron) -> public_insights (anon-readable)
   -> apps/web (Next.js)
        - /app/(private)/*   private dashboard, Supabase Auth gated
        - /app/(public)/*    public aggregate page on the main site
```

Two privacy tiers, enforced at the DB level via RLS — not just "not displayed":
- **Raw tables** (training, kcal, measurements, photos, per-workout data): `service_role` only.
- **`public_insights`**: aggregate/trend data only, readable by `anon` key.

## Phases

### Phase 1 — Schema + ingestion foundation
- Full Supabase schema: raw health metrics/workouts (from health-mcp) + training,
  kcal, measurements, photos, public_insights, Supabase Auth, private Storage bucket
- health-mcp Worker deployed, webhook receiving live data
- RLS policies written and tested (raw = locked, public_insights = anon-readable)

### Phase 2 — MCP tool coverage
- Extend health-mcp tools: log_set, log_calories, log_measurement, log_photo_checkin,
  get_training_plan, get_next_session
- Manual test via Claude custom connector

### Phase 3 — Private dashboard (apps/web)
- Auth (Supabase Auth, single user)
- Tabs: Training program, Kcal tracker, Measurements, Weekly/monthly regression
  charts, Steps/workouts, Private photo gallery (weekly check-ins)

### Phase 4 — Public page + automation
- Weekly Cron Trigger: aggregate raw -> public_insights
- OpenRouter call: turn aggregates into a short narrative summary
- Public page on michalzawadzki.dev (or subdomain) reading only public_insights

### Phase 5 — Claude Project
- Project with custom instructions, wired to the health-mcp connector
- Can answer questions and log data conversationally (e.g. "log today's bench: 3x5 @ 80kg")

## Non-goals (for now)
- Multi-user support — this is single-user (you) only
- Native mobile app — web dashboard, mobile-responsive, is enough
- Real-time sync — daily/weekly batch via Health Auto Export is fine