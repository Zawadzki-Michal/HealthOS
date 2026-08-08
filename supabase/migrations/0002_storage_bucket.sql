-- HealthOS: private storage bucket for weekly progress photos (issue #2).
-- Storage RLS policies are written and tested in 0003_rls_policies.sql, as
-- part of the "write and test RLS" issue -- this migration only creates the
-- bucket itself.
--
-- Linkage convention: progress_photos.storage_path stores the object path
-- within this bucket, e.g. 'progress/<user_id>/<week_of>-<angle>.jpg'.
-- The bucket is never made public -- reads always go through a signed URL
-- generated on demand (service_role from the Worker, or the authenticated
-- user's session from the Phase 3 dashboard).

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;
