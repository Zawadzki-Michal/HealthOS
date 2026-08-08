-- HealthOS: RLS policies (issue #3).
-- Raw tables: service_role (Worker/backend) and the row's own owner get full
-- access. No policy grants anything to `anon` on raw tables -- RLS defaults
-- to deny-all, so simply not writing an anon policy is sufficient. This is
-- intentional, not an oversight.
--
-- public_insights: anon can SELECT only. service_role has full access
-- (the Phase 4 aggregation cron writes here). No insert/update/delete for
-- anon/authenticated.
--
-- storage.objects (progress-photos bucket): service_role and owner only,
-- same shape as the raw tables.

-- health_metrics
create policy "health_metrics service_role full access"
  on health_metrics for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
create policy "health_metrics owner full access"
  on health_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- workouts
create policy "workouts service_role full access"
  on workouts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
create policy "workouts owner full access"
  on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- training_plan
create policy "training_plan service_role full access"
  on training_plan for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
create policy "training_plan owner full access"
  on training_plan for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- exercise_log
create policy "exercise_log service_role full access"
  on exercise_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
create policy "exercise_log owner full access"
  on exercise_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- calorie_log
create policy "calorie_log service_role full access"
  on calorie_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
create policy "calorie_log owner full access"
  on calorie_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- body_measurements
create policy "body_measurements service_role full access"
  on body_measurements for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
create policy "body_measurements owner full access"
  on body_measurements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- progress_photos
create policy "progress_photos service_role full access"
  on progress_photos for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
create policy "progress_photos owner full access"
  on progress_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- public_insights
create policy "public_insights anon read only"
  on public_insights for select
  using (true);
create policy "public_insights service_role full access"
  on public_insights for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- storage: progress-photos bucket
create policy "progress-photos service_role full access"
  on storage.objects for all
  using (bucket_id = 'progress-photos' and auth.role() = 'service_role')
  with check (bucket_id = 'progress-photos' and auth.role() = 'service_role');
create policy "progress-photos owner full access"
  on storage.objects for all
  using (bucket_id = 'progress-photos' and owner = auth.uid())
  with check (bucket_id = 'progress-photos' and owner = auth.uid());
