-- Security hardening in response to Supabase's database linter (security advisor).

-- 1. The `avatars` bucket is public, so objects are served via the public URL
--    without any SELECT policy on storage.objects. The broad listing policy only
--    let clients enumerate every file, so drop it.
drop policy if exists "avatars_read_all" on storage.objects;

-- 2. handle_new_user() is only ever invoked by the on_auth_user_created trigger
--    (fired by the auth server as supabase_auth_admin). No client role should be
--    able to call it via PostgREST RPC. Trigger invocation does not need EXECUTE.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3. is_admin() is an RLS helper. The `authenticated` role must keep EXECUTE
--    because the policies call it, but anonymous users never evaluate those
--    (authenticated-only) policies, so remove anon and the default PUBLIC grant.
revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;
