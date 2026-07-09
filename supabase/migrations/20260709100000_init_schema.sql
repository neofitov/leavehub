-- LeaveHub initial schema
-- Tables: profiles, user_roles, leave_types, leave_requests
-- Plus: is_admin() helper (SECURITY DEFINER) and a new-user trigger.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('employee', 'admin');
create type public.request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- ---------------------------------------------------------------------------
-- profiles: 1:1 extension of auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  full_name        text,
  department       text,
  avatar_url       text,
  annual_allowance integer not null default 20 check (annual_allowance >= 0),
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_roles: role-based access control (an account may hold multiple roles)
-- ---------------------------------------------------------------------------
create table public.user_roles (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role    public.app_role not null default 'employee',
  unique (user_id, role)
);

create index idx_user_roles_user on public.user_roles (user_id);

-- ---------------------------------------------------------------------------
-- leave_types: kinds of leave (Vacation, Sick, Personal, Unpaid, ...)
-- ---------------------------------------------------------------------------
create table public.leave_types (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  color        text not null default '#0d6efd',
  default_days integer not null default 0 check (default_days >= 0),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- leave_requests: the core entity
-- ---------------------------------------------------------------------------
create table public.leave_requests (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  leave_type_id  bigint not null references public.leave_types (id) on delete restrict,
  start_date     date not null,
  end_date       date not null,
  days_count     integer not null check (days_count > 0),
  reason         text,
  status         public.request_status not null default 'pending',
  attachment_url text,
  reviewed_by    uuid references auth.users (id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  constraint valid_date_range check (end_date >= start_date)
);

create index idx_leave_requests_user   on public.leave_requests (user_id);
create index idx_leave_requests_status on public.leave_requests (status);
create index idx_leave_requests_type   on public.leave_requests (leave_type_id);

-- ---------------------------------------------------------------------------
-- is_admin(): used by RLS policies. SECURITY DEFINER so it bypasses RLS on
-- user_roles and cannot cause recursive policy evaluation.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = uid
      and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- handle_new_user(): auto-create a profile + default 'employee' role when a
-- new auth user signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'employee')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
