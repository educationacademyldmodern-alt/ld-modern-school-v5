-- L D MODERN EDUCATION ACADEMY ERP
-- V65.0 FINAL SAFE UPDATE — 2026-09-22
-- Non-destructive, idempotent, repeat-safe.
-- Purpose: server-side Admin forgot-password cooldown = 24 hours.
-- No passwords, OTPs, or reset tokens are stored here.


create table if not exists public.v95_primary_admin (
  singleton_id smallint primary key default 1 check (singleton_id = 1),
  user_id uuid not null unique,
  claimed_at timestamptz not null default now()
);
alter table public.v95_primary_admin enable row level security;
revoke all on table public.v95_primary_admin from anon, authenticated;

create or replace function public.v95_claim_primary_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing uuid;
begin
  if v_uid is null then raise exception 'Login required' using errcode='42501'; end if;
  if not exists (
    select 1 from public.profiles
    where id=v_uid and lower(coalesce(role,'')) in ('admin','super_admin')
      and lower(coalesce(status,'active')) not in ('disabled','inactive','pending','suspended','rejected')
  ) then raise exception 'Active Admin required' using errcode='42501'; end if;
  select user_id into v_existing from public.v95_primary_admin where singleton_id=1;
  if v_existing is null then
    insert into public.v95_primary_admin(singleton_id,user_id) values(1,v_uid)
    on conflict (singleton_id) do nothing;
    select user_id into v_existing from public.v95_primary_admin where singleton_id=1;
  end if;
  return v_existing=v_uid;
end;
$$;

create or replace function public.v95_is_primary_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select exists(select 1 from public.v95_primary_admin where singleton_id=1 and user_id=auth.uid()) $$;

revoke all on function public.v95_claim_primary_admin() from public;
revoke all on function public.v95_is_primary_admin() from public;
grant execute on function public.v95_claim_primary_admin(), public.v95_is_primary_admin() to authenticated;

create table if not exists public.v95_admin_recovery_state (
  singleton_id smallint primary key default 1 check (singleton_id = 1),
  last_requested_at timestamptz null,
  updated_at timestamptz not null default now()
);

insert into public.v95_admin_recovery_state(singleton_id)
values (1)
on conflict (singleton_id) do nothing;

alter table public.v95_admin_recovery_state enable row level security;

-- Browser clients do not need direct access. The Vercel server endpoint uses service_role.
revoke all on table public.v95_admin_recovery_state from anon, authenticated;

create or replace function public.v95_take_admin_recovery_slot(p_minutes integer default 1440)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last timestamptz;
  v_wait integer := greatest(coalesce(p_minutes,1440), 1440);
begin
  insert into public.v95_admin_recovery_state(singleton_id)
  values (1)
  on conflict (singleton_id) do nothing;

  select last_requested_at into v_last
  from public.v95_admin_recovery_state
  where singleton_id = 1
  for update;

  if v_last is not null and v_last > now() - make_interval(mins => v_wait) then
    return false;
  end if;

  update public.v95_admin_recovery_state
  set last_requested_at = now(), updated_at = now()
  where singleton_id = 1;
  return true;
end;
$$;

revoke all on function public.v95_take_admin_recovery_slot(integer) from public, anon, authenticated;
grant execute on function public.v95_take_admin_recovery_slot(integer) to service_role;
