-- Teacher V2 central master migration.
-- Safe, idempotent, non-destructive, and schema-aware.
-- Optional legacy fields are read from JSONB so missing columns cannot raise 42703.

begin;

create extension if not exists pgcrypto;
create sequence if not exists public.teacher_v2_master_seq increment by 1 start with 1001 no cycle;

create table if not exists public.teacher_v2_master (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid unique,
  auth_user_id uuid unique,
  teacher_code text unique not null default ('TCH-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.teacher_v2_master_seq')::text, 4, '0')),
  employee_id text unique,
  teacher_name text not null,
  email text,
  mobile text,
  status text not null default 'Active' check (status in ('Active','On Leave','Relieved','Inactive')),
  mapping_status text not null default 'MAPPED' check (mapping_status in ('MAPPED','NEEDS_MAPPING')),
  login_enabled boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  legacy_reference text
);

alter table public.teacher_v2_master add column if not exists teacher_profile_id uuid;
alter table public.teacher_v2_master add column if not exists auth_user_id uuid;
alter table public.teacher_v2_master add column if not exists teacher_code text;
alter table public.teacher_v2_master add column if not exists employee_id text;
alter table public.teacher_v2_master add column if not exists teacher_name text;
alter table public.teacher_v2_master add column if not exists email text;
alter table public.teacher_v2_master add column if not exists mobile text;
alter table public.teacher_v2_master add column if not exists status text not null default 'Active';
alter table public.teacher_v2_master add column if not exists mapping_status text not null default 'MAPPED';
alter table public.teacher_v2_master add column if not exists login_enabled boolean not null default true;
alter table public.teacher_v2_master add column if not exists is_active boolean not null default true;
alter table public.teacher_v2_master add column if not exists created_at timestamptz not null default now();
alter table public.teacher_v2_master add column if not exists updated_at timestamptz not null default now();
alter table public.teacher_v2_master add column if not exists legacy_reference text;

create index if not exists idx_teacher_v2_master_auth_user on public.teacher_v2_master(auth_user_id);
create index if not exists idx_teacher_v2_master_status on public.teacher_v2_master(status,login_enabled,is_active);
create index if not exists idx_teacher_v2_master_employee on public.teacher_v2_master(employee_id);
create index if not exists idx_teacher_v2_master_name on public.teacher_v2_master(teacher_name);

do $$
begin
  if to_regclass('public.teacher_profiles') is not null
    and exists (select 1 from information_schema.columns as ic where ic.table_schema='public' and ic.table_name='teacher_profiles' and ic.column_name='id')
    and not exists (select 1 from pg_constraint as pc where pc.conname='teacher_v2_master_teacher_profile_fk') then
    alter table public.teacher_v2_master add constraint teacher_v2_master_teacher_profile_fk
      foreign key (teacher_profile_id) references public.teacher_profiles(id) on delete restrict;
  end if;
end
$$;

update public.teacher_v2_master as tv2
set mapping_status = case when tv2.auth_user_id is null then 'NEEDS_MAPPING' else 'MAPPED' end
where tv2.mapping_status is null or (tv2.mapping_status = 'MAPPED' and tv2.auth_user_id is null);

create or replace function public.teacher_v2_touch_updated_at()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists teacher_v2_master_touch_updated_at on public.teacher_v2_master;
create trigger teacher_v2_master_touch_updated_at before update on public.teacher_v2_master
for each row execute function public.teacher_v2_touch_updated_at();

create or replace function public.teacher_v2_guard_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if public.my_role() = any (array['admin','super_admin','principal']) then
    return new;
  end if;
  if old.id is distinct from new.id
    or old.status is distinct from new.status
    or old.login_enabled is distinct from new.login_enabled
    or old.is_active is distinct from new.is_active
    or old.auth_user_id is distinct from new.auth_user_id
    or old.teacher_profile_id is distinct from new.teacher_profile_id
    or old.teacher_code is distinct from new.teacher_code
    or old.employee_id is distinct from new.employee_id
    or old.mapping_status is distinct from new.mapping_status
    or old.created_at is distinct from new.created_at
    or old.legacy_reference is distinct from new.legacy_reference then
    raise exception 'Teacher protected fields can only be changed by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists teacher_v2_master_guard_update on public.teacher_v2_master;
create trigger teacher_v2_master_guard_update
before update on public.teacher_v2_master
for each row execute function public.teacher_v2_guard_update();

-- The helper returns the existing composite row type instead of RETURNS TABLE.
-- This prevents implicit OUT variables such as teacher_profile_id from colliding
-- with INSERT/UPSERT column names inside PL/pgSQL.
drop function if exists public.teacher_v2_sync_legacy_teacher(uuid);
create function public.teacher_v2_sync_legacy_teacher(p_teacher_profile_id uuid default null)
returns setof public.teacher_v2_master
language plpgsql security definer set search_path = public
as $$
declare
  v_legacy_row record;
  v_profile_id uuid;
  v_auth_user_id uuid;
  v_code text;
  v_employee_id text;
  v_status text;
  v_login_enabled boolean;
  v_is_active boolean;
begin
  if to_regclass('public.teacher_profiles') is null then return; end if;

  for v_legacy_row in execute
    'select to_jsonb(tp) as data from public.teacher_profiles tp where $1 is null or to_jsonb(tp)->>''id'' = $1::text'
    using p_teacher_profile_id
  loop
    v_profile_id := nullif(v_legacy_row.data->>'id','')::uuid;
    if v_profile_id is null then continue; end if;
    v_auth_user_id := nullif(v_legacy_row.data->>'auth_user_id','')::uuid;
    if v_auth_user_id is not null and exists (select 1 from public.teacher_v2_master as tv2 where tv2.auth_user_id=v_auth_user_id and tv2.teacher_profile_id is distinct from v_profile_id) then
      v_auth_user_id := null;
    end if;
    v_is_active := lower(coalesce(v_legacy_row.data->>'is_active','true')) not in ('false','0','no','inactive');
    v_status := lower(coalesce(nullif(v_legacy_row.data->>'status',''), nullif(v_legacy_row.data->>'approval_status',''), 'active'));
    if v_status in ('approved','active','enabled') then v_status := 'Active';
    elsif v_status in ('on_leave','leave','on-leave') then v_status := 'On Leave';
    elsif v_status in ('relieved','resigned','deactivated') then v_status := 'Relieved';
    elsif v_status in ('inactive','disabled','rejected','suspended') then v_status := 'Inactive';
    else v_status := 'Active'; end if;
    v_login_enabled := v_is_active
      and lower(coalesce(v_legacy_row.data->>'approval_status','approved')) in ('approved','active','enabled')
      and v_status not in ('Relieved','Inactive')
      and lower(coalesce(v_legacy_row.data->>'login_enabled','true')) not in ('false','0','no');

    v_code := nullif(btrim(coalesce(v_legacy_row.data->>'teacher_code','')), '');
    if v_code is null or exists (select 1 from public.teacher_v2_master as tv2 where tv2.teacher_code=v_code and tv2.teacher_profile_id is distinct from v_profile_id) then
      loop
        v_code := 'TCH-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.teacher_v2_master_seq')::text, 4, '0');
        exit when not exists (select 1 from public.teacher_v2_master as tv2 where tv2.teacher_code=v_code and tv2.teacher_profile_id is distinct from v_profile_id);
      end loop;
    end if;
    v_employee_id := nullif(btrim(coalesce(v_legacy_row.data->>'employee_id',v_legacy_row.data->>'staff_employee_id')), '');
    if v_employee_id is null or exists (select 1 from public.teacher_v2_master as tv2 where tv2.employee_id=v_employee_id and tv2.teacher_profile_id is distinct from v_profile_id) then
      loop
        v_employee_id := 'EMP-' || lpad(nextval('public.teacher_v2_master_seq')::text, 6, '0');
        exit when not exists (select 1 from public.teacher_v2_master as tv2 where tv2.employee_id=v_employee_id and tv2.teacher_profile_id is distinct from v_profile_id);
      end loop;
    end if;

    insert into public.teacher_v2_master as tv2 (teacher_profile_id,auth_user_id,teacher_code,employee_id,teacher_name,email,mobile,status,mapping_status,login_enabled,is_active,legacy_reference,created_at,updated_at)
    values (v_profile_id,v_auth_user_id,v_code,v_employee_id,
      coalesce(nullif(btrim(v_legacy_row.data->>'teacher_name'),''),nullif(btrim(v_legacy_row.data->>'full_name'),''),nullif(btrim(v_legacy_row.data->>'staff_name'),''),'Teacher'),
      lower(btrim(coalesce(nullif(v_legacy_row.data->>'email',''),nullif(v_legacy_row.data->>'contact_email',''),''))),
      coalesce(nullif(v_legacy_row.data->>'mobile',''),nullif(v_legacy_row.data->>'phone',''),''),v_status,
      case when v_auth_user_id is null then 'NEEDS_MAPPING' else 'MAPPED' end,v_login_enabled,v_is_active,
      'teacher_profiles:' || v_profile_id,coalesce(nullif(v_legacy_row.data->>'created_at','')::timestamptz,now()),now())
    on conflict (teacher_profile_id) do update set
      auth_user_id=coalesce(tv2.auth_user_id,excluded.auth_user_id),
      teacher_code=tv2.teacher_code,
      employee_id=coalesce(tv2.employee_id,excluded.employee_id),
      teacher_name=tv2.teacher_name,
      email=tv2.email,mobile=tv2.mobile,
      status=tv2.status,
      mapping_status=case when tv2.auth_user_id is null then 'NEEDS_MAPPING' else tv2.mapping_status end,
      login_enabled=tv2.login_enabled,is_active=tv2.is_active,
      legacy_reference=excluded.legacy_reference,updated_at=now();

    return query select tv2.* from public.teacher_v2_master as tv2 where tv2.teacher_profile_id=v_profile_id;
  end loop;
end;
$$;

create or replace function public.teacher_v2_sync_legacy_trigger()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  perform public.teacher_v2_sync_legacy_teacher((to_jsonb(new)->>'id')::uuid);
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.teacher_profiles') is not null
    and exists (select 1 from information_schema.columns as ic where ic.table_schema='public' and ic.table_name='teacher_profiles' and ic.column_name='id') then
    execute 'drop trigger if exists teacher_v2_sync_legacy_profile on public.teacher_profiles';
    execute 'create trigger teacher_v2_sync_legacy_profile after insert or update on public.teacher_profiles for each row execute function public.teacher_v2_sync_legacy_trigger()';
  end if;
end
$$;

select public.teacher_v2_sync_legacy_teacher(null);

create or replace function public.teacher_v2_resolve_for_user(p_user_id uuid)
returns public.teacher_v2_master language plpgsql security definer set search_path=public
as $$
declare v_teacher public.teacher_v2_master;
begin
  if p_user_id is null then return null; end if;
  if p_user_id <> auth.uid() and public.my_role() <> all (array['admin','super_admin','principal']) then
    raise exception 'Teacher mapping lookup requires self or administrator access';
  end if;
  perform public.teacher_v2_sync_legacy_teacher(null);
  select tv2.* into v_teacher from public.teacher_v2_master as tv2 where tv2.auth_user_id=p_user_id limit 1;
  return v_teacher;
end;
$$;

create or replace function public.teacher_v2_ensure_master_for_profile(p_profile_id uuid)
returns uuid language plpgsql security definer set search_path=public
as $$
declare v_id uuid;
begin
  if p_profile_id is null then return null; end if;
  perform public.teacher_v2_sync_legacy_teacher(p_profile_id);
  select tv2.id into v_id from public.teacher_v2_master as tv2 where tv2.teacher_profile_id=p_profile_id limit 1;
  return v_id;
end;
$$;

create or replace function public.teacher_v2_set_login_enabled(p_teacher_id uuid, p_enabled boolean)
returns public.teacher_v2_master language plpgsql security definer set search_path=public
as $$
declare v_teacher public.teacher_v2_master;
begin
  if public.my_role() <> all (array['admin','super_admin','principal']) then raise exception 'Teacher login control requires administrator permission'; end if;
  update public.teacher_v2_master as tv2
  set login_enabled=case when tv2.status in ('Relieved','Inactive') or tv2.is_active=false then false else p_enabled end,
      updated_at=now()
  where tv2.id=p_teacher_id
  returning tv2.* into v_teacher;
  return v_teacher;
end;
$$;

create or replace function public.teacher_v2_set_status(p_teacher_id uuid, p_status text)
returns public.teacher_v2_master language plpgsql security definer set search_path=public
as $$
declare v_teacher public.teacher_v2_master;
begin
  if public.my_role() <> all (array['admin','super_admin','principal']) then raise exception 'Teacher status control requires administrator permission'; end if;
  if p_status not in ('Active','On Leave','Relieved','Inactive') then raise exception 'Invalid teacher status'; end if;
  update public.teacher_v2_master as tv2 set status=p_status,login_enabled=case when p_status in ('Relieved','Inactive') then false else tv2.login_enabled end,is_active=p_status not in ('Relieved','Inactive'),updated_at=now() where tv2.id=p_teacher_id returning tv2.* into v_teacher;
  return v_teacher;
end;
$$;

create or replace function public.teacher_v2_lookup_login_identifier(p_identifier text)
returns public.teacher_v2_master language plpgsql security definer set search_path=public
as $$
declare v text; v_teacher public.teacher_v2_master; v_matches integer;
begin
  v:=lower(btrim(coalesce(p_identifier,'')));
  if v='' then return null; end if;
  perform public.teacher_v2_sync_legacy_teacher(null);
  select count(*) into v_matches
  from public.teacher_v2_master as tv2
  where lower(coalesce(tv2.email,''))=v
    or lower(replace(replace(coalesce(tv2.mobile,''),'+91',''),' ',''))=replace(replace(v,'+91',''),' ','')
    or lower(coalesce(tv2.employee_id,''))=v or lower(coalesce(tv2.teacher_code,''))=v;
  if v_matches <> 1 then return null; end if;
  select tv2.* into v_teacher from public.teacher_v2_master as tv2
  where lower(coalesce(tv2.email,''))=v
    or lower(replace(replace(coalesce(tv2.mobile,''),'+91',''),' ',''))=replace(replace(v,'+91',''),' ','');
  if v_teacher.id is null then
    select tv2.* into v_teacher from public.teacher_v2_master as tv2
    where lower(coalesce(tv2.employee_id,''))=v or lower(coalesce(tv2.teacher_code,''))=v;
  end if;
  return v_teacher;
end;
$$;

alter table public.teacher_v2_master enable row level security;
do $$
begin
  execute 'drop policy if exists teacher_v2_master_self_update on public.teacher_v2_master';
  if not exists (select 1 from pg_policies as pp where pp.schemaname='public' and pp.tablename='teacher_v2_master' and pp.policyname='teacher_v2_master_admin_all') then
    create policy teacher_v2_master_admin_all on public.teacher_v2_master for all to authenticated using (public.my_role()=any(array['admin','super_admin','principal'])) with check (public.my_role()=any(array['admin','super_admin','principal']));
  end if;
  if not exists (select 1 from pg_policies as pp where pp.schemaname='public' and pp.tablename='teacher_v2_master' and pp.policyname='teacher_v2_master_self_select') then
    create policy teacher_v2_master_self_select on public.teacher_v2_master for select to authenticated using (teacher_v2_master.auth_user_id=auth.uid());
  end if;
  if not exists (select 1 from pg_policies as pp where pp.schemaname='public' and pp.tablename='teacher_v2_master' and pp.policyname='teacher_v2_master_self_update') then
    create policy teacher_v2_master_self_update on public.teacher_v2_master for update to authenticated
      using (teacher_v2_master.auth_user_id=auth.uid())
      with check (teacher_v2_master.auth_user_id=auth.uid());
  end if;
end
$$;

grant select,update on public.teacher_v2_master to authenticated;
grant usage,select on sequence public.teacher_v2_master_seq to authenticated;
revoke all on function public.teacher_v2_touch_updated_at() from public;
revoke all on function public.teacher_v2_guard_update() from public;
revoke all on function public.teacher_v2_sync_legacy_trigger() from public;
revoke all on function public.teacher_v2_sync_legacy_teacher(uuid) from public;
revoke all on function public.teacher_v2_ensure_master_for_profile(uuid) from public;
revoke all on function public.teacher_v2_resolve_for_user(uuid) from public;
revoke all on function public.teacher_v2_lookup_login_identifier(text) from public,authenticated;
grant execute on function public.teacher_v2_resolve_for_user(uuid) to authenticated;
revoke all on function public.teacher_v2_set_login_enabled(uuid,boolean) from public;
revoke all on function public.teacher_v2_set_status(uuid,text) from public;
grant execute on function public.teacher_v2_set_login_enabled(uuid,boolean),public.teacher_v2_set_status(uuid,text) to authenticated;

notify pgrst,'reload schema';
commit;