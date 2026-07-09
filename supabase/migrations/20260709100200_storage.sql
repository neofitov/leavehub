-- LeaveHub storage buckets + policies.
-- Files are stored under a "<user_id>/<filename>" path so the first path segment
-- identifies the owner. Policies key off that segment.
--
--   avatars     : public bucket (profile pictures; simple public URL)
--   attachments : private bucket (leave-request documents; owner or admin only)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- avatars (public read; users manage only their own folder)
-- ---------------------------------------------------------------------------
create policy "avatars_read_all"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- attachments (private; owner or admin read; owner writes own folder)
-- ---------------------------------------------------------------------------
create policy "attachments_read_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'attachments'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "attachments_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
