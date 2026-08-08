# scripts

Utility scripts for HealthOS, run from the repo root.

## test-rls.mjs

Confirms the RLS policies in `supabase/migrations/0003_rls_policies.sql` actually
hold: the anon key must be blocked from reading/writing every raw table, and
allowed to read (but not write) `public_insights`.

```bash
npm install
npm run test:rls
```

Reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from a `.env` file at the repo root
(gitignored). Exits non-zero if any check fails, so it can be wired into CI later.
