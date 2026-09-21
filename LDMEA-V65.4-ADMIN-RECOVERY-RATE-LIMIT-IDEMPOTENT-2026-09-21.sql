-- LDMEA V65.4 — Primary Admin recovery server-side cooldown (IDEMPOTENT / NON-DESTRUCTIVE)
create table if not exists public.v95_admin_recovery_state (
  singleton_id integer primary key check (singleton_id = 1),
  last_requested_at timestamptz
);
insert into public.v95_admin_recovery_state(singleton_id,last_requested_at)
values (1,null) on conflict (singleton_id) do nothing;

create or replace function public.v95_take_admin_recovery_slot(p_minutes integer default 30)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_last timestamptz;
begin
  if p_minutes is null or p_minutes < 1 then p_minutes := 30; end if;
  insert into public.v95_admin_recovery_state(singleton_id,last_requested_at)
  values(1,null) on conflict(singleton_id) do nothing;
  select last_requested_at into v_last from public.v95_admin_recovery_state where singleton_id=1 for update;
  if v_last is not null and v_last > now() - make_interval(mins => p_minutes) then return false; end if;
  update public.v95_admin_recovery_state set last_requested_at=now() where singleton_id=1;
  return true;
end $$;
revoke all on function public.v95_take_admin_recovery_slot(integer) from public, anon, authenticated;
