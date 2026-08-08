-- Read-only snapshot of the current schema, for human browsing.
-- Source of truth is supabase/migrations/*.sql -- re-sync this file by hand
-- (or via `supabase db dump --schema public,storage`) after each new migration.
--
-- Last synced: after 0001_init.sql (issue #1). No RLS policies yet -- see
-- 0003_rls_policies.sql once PR #3 lands, and re-sync this snapshot then.

create table health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  metric_type text not null,        -- e.g. 'step_count','heart_rate','active_energy','resting_heart_rate','sleep_analysis'
  value numeric not null,
  unit text not null,               -- e.g. 'count','bpm','kcal','hr'
  recorded_at timestamptz not null, -- when the sample was taken (from Health Auto Export payload)
  source text,                      -- e.g. 'Apple Watch', device name from payload
  raw_payload jsonb,                -- full original sample, for reprocessing/debugging
  created_at timestamptz not null default now()
);
create index health_metrics_type_recorded_idx on health_metrics (metric_type, recorded_at);
create index health_metrics_user_recorded_idx on health_metrics (user_id, recorded_at);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  workout_type text not null,        -- e.g. 'Functional Strength Training','Running'
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer,
  active_energy_kcal numeric,
  total_distance_m numeric,
  avg_heart_rate numeric,
  max_heart_rate numeric,
  source text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);
create index workouts_user_started_idx on workouts (user_id, started_at);

create table training_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  week_number integer not null,
  day_of_week integer not null,      -- 1-7
  day_label text,                    -- e.g. 'Push', 'Legs A'
  exercise_name text not null,
  target_sets integer,
  target_reps text,                  -- e.g. '5', '8-12', 'AMRAP'
  target_load_kg numeric,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index training_plan_user_week_day_idx on training_plan (user_id, week_number, day_of_week, sort_order);

create table exercise_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  training_plan_id uuid references training_plan(id) on delete set null,
  workout_id uuid references workouts(id) on delete set null,
  exercise_name text not null,
  set_number integer not null,
  reps integer not null,
  load_kg numeric,
  rpe numeric,
  logged_at timestamptz not null default now(),
  notes text
);
create index exercise_log_user_logged_idx on exercise_log (user_id, logged_at);
create index exercise_log_name_logged_idx on exercise_log (exercise_name, logged_at);

create table calorie_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  logged_date date not null,
  meal_label text,                   -- e.g. 'breakfast', 'snack' -- nullable if just a daily total
  description text,
  kcal numeric not null,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  source text,                       -- e.g. 'manual', 'MCP tool', 'Apple Health'
  created_at timestamptz not null default now()
);
create index calorie_log_user_date_idx on calorie_log (user_id, logged_date);

create table body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  measured_at timestamptz not null default now(),
  weight_kg numeric,
  body_fat_pct numeric,
  waist_cm numeric,
  chest_cm numeric,
  hips_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  notes text
);
create index body_measurements_user_measured_idx on body_measurements (user_id, measured_at);

create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  storage_path text not null,        -- path within the private 'progress-photos' bucket (see 0002)
  week_of date not null,             -- the check-in date this photo belongs to
  angle text,                        -- e.g. 'front','side','back'
  taken_at timestamptz not null default now(),
  body_measurement_id uuid references body_measurements(id) on delete set null,
  notes text
);
create index progress_photos_user_week_idx on progress_photos (user_id, week_of);

-- Aggregate/trend data only. Deliberately has no user_id column so it can
-- never leak raw per-user rows via a future join -- this table IS the public
-- projection. Populated by the Phase 4 aggregation cron job.
create table public_insights (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  insight_type text not null,        -- e.g. 'weekly_summary','monthly_trend'
  metric text not null,              -- e.g. 'avg_weight_kg','total_workouts','avg_steps_per_day'
  value numeric,
  narrative text,                    -- short human-readable summary (Phase 4 OpenRouter step)
  generated_at timestamptz not null default now(),
  unique (period_start, period_end, insight_type, metric)
);
create index public_insights_period_idx on public_insights (period_start, period_end);

alter table health_metrics enable row level security;
alter table workouts enable row level security;
alter table training_plan enable row level security;
alter table exercise_log enable row level security;
alter table calorie_log enable row level security;
alter table body_measurements enable row level security;
alter table progress_photos enable row level security;
alter table public_insights enable row level security;
