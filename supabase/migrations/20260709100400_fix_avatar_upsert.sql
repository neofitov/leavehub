-- Fix: avatar uploads fail with "new row violates row-level security policy".
--
-- The hardening migration dropped "avatars_read_all", the bucket's only SELECT
-- policy, on the reasoning that a public bucket is served over its public URL
-- and therefore needs no SELECT policy to be *read*. That is true for reads.
--
-- It is not true for writes. storageService.uploadAvatar() uploads with
-- `upsert: true`, which the Storage API executes as
-- `insert into storage.objects ... on conflict (...) do update ...`.
-- Postgres evaluates the target row against the UPDATE policy, and reaching
-- that row requires a SELECT policy on the table. With none, every upsert into
-- `avatars` is rejected -- even when no conflicting row exists.
--
-- Restore SELECT, but scoped to the caller's own folder rather than the whole
-- bucket, so the original advisor finding (any client could enumerate every
-- user's files) stays fixed.

create policy "avatars_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- The UPDATE half of the upsert also needs an explicit WITH CHECK. Without one
-- Postgres reuses USING for the new row, which happens to be correct here, but
-- relying on that is fragile -- state it outright.
drop policy if exists "avatars_update_own" on storage.objects;

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
