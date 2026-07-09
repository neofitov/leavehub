-- LeaveHub Row-Level Security policies.
-- RLS is the real security boundary: employees can only touch their own data;
-- admins (via is_admin()) can see everything and change request status.

alter table public.profiles       enable row level security;
alter table public.user_roles     enable row level security;
alter table public.leave_types    enable row level security;
alter table public.leave_requests enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------
create policy "roles_select_own_or_admin"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Only admins may add/change/remove roles (e.g. promote a user to admin).
create policy "roles_manage_admin"
  on public.user_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- leave_types: any authenticated user reads; only admins manage.
-- ---------------------------------------------------------------------------
create policy "types_select_authenticated"
  on public.leave_types for select
  to authenticated
  using (true);

create policy "types_manage_admin"
  on public.leave_types for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- leave_requests
-- ---------------------------------------------------------------------------
create policy "requests_select_own_or_admin"
  on public.leave_requests for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Employees may create their own requests, always starting as 'pending'.
create policy "requests_insert_own"
  on public.leave_requests for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- Employees may edit / cancel their own request only while it is still pending,
-- and may never move it to approved/rejected themselves (only pending -> cancelled
-- or edits that keep it pending). Self-approval is thus impossible.
create policy "requests_update_own_pending"
  on public.leave_requests for update
  to authenticated
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status in ('pending', 'cancelled'));

-- Admins may update any request (approve / reject).
create policy "requests_update_admin"
  on public.leave_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
