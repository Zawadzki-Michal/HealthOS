// Verifies the RLS policies from supabase/migrations/0003_rls_policies.sql
// actually hold: the anon key must be blocked from every raw table, allowed
// to read public_insights, and blocked from writing anywhere.
//
// Usage: npm run test:rls   (reads SUPABASE_URL / SUPABASE_ANON_KEY from .env)

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RAW_TABLES = [
  "health_metrics",
  "workouts",
  "training_plan",
  "exercise_log",
  "calorie_log",
  "body_measurements",
  "progress_photos",
];

let failures = 0;

function ok(message) {
  console.log(`OK: ${message}`);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  failures++;
}

for (const table of RAW_TABLES) {
  const { data, error } = await anon.from(table).select("*").limit(1);
  if (error) {
    ok(`anon blocked from reading ${table} (${error.message})`);
  } else if (data && data.length > 0) {
    fail(`anon could read ${table} -- got ${data.length} row(s)`);
  } else {
    ok(`anon reads ${table} but gets zero rows (RLS filtered)`);
  }

  const { error: insertError } = await anon
    .from(table)
    .insert({ user_id: "00000000-0000-0000-0000-000000000000" });
  if (insertError) {
    ok(`anon blocked from inserting into ${table} (${insertError.message})`);
  } else {
    fail(`anon could insert into ${table}`);
  }
}

const { error: pubError } = await anon.from("public_insights").select("*").limit(1);
if (pubError) {
  fail(`anon could not read public_insights: ${pubError.message}`);
} else {
  ok("anon can read public_insights");
}

const { error: pubInsertError } = await anon
  .from("public_insights")
  .insert({ period_start: "2026-01-01", period_end: "2026-01-07", insight_type: "test", metric: "test" });
if (pubInsertError) {
  ok(`anon blocked from inserting into public_insights (${pubInsertError.message})`);
} else {
  fail("anon could insert into public_insights");
}

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`);
process.exit(failures > 0 ? 1 : 0);
