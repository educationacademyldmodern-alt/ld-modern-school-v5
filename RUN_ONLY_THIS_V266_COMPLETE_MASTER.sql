-- =====================================================================
-- L D MODERN EDUCATION ACADEMY
-- V265.2 COMPLETE MASTER SQL
-- SMART WORK ALARM + ACADEMIC MONITORING
-- RUN ONLY THIS FILE
-- Date: 2026-10-08
--
-- PURPOSE
-- 1) Completes all V264 Smart Work Alarm tables/RPCs.
-- 2) Completes all V265 Academic Monitoring tables/RPCs.
-- 3) Repairs missing columns on these NEW module tables if an earlier run
--    stopped halfway.
-- 4) Reloads Supabase/PostgREST schema cache at the end.
--
-- SAFETY
-- - NO DROP TABLE
-- - NO TRUNCATE
-- - NO DELETE FROM
-- - NO UPDATE/INSERT into existing ERP core business tables
-- - Existing students/timetable/teaching_diary/attendance data is READ only.
-- - Safe to re-run.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- PRE-FLIGHT: required EXISTING ERP foundation only.
-- This does not modify the foundation; it only stops with a clear message
-- if the required base schema is missing.
-- ---------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.v64_is_admin()') is null then
    raise exception 'Base dependency missing: public.v64_is_admin(). Run the existing Master ERP SQL first.';
  end if;
  if to_regclass('public.profiles') is null then
    raise exception 'Base dependency missing: public.profiles';
  end if;
  if to_regclass('public.teacher_profiles') is null then
    raise exception 'Base dependency missing: public.teacher_profiles';
  end if;
  if to_regclass('public.students') is null then
    raise exception 'Base dependency missing: public.students';
  end if;
  if to_regclass('public.timetable') is null then
    raise exception 'Base dependency missing: public.timetable';
  end if;
  if to_regclass('public.teaching_diary') is null then
    raise exception 'Base dependency missing: public.teaching_diary';
  end if;
  if to_regclass('public.syllabus_master') is null then
    raise exception 'Base dependency missing: public.syllabus_master';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- HALF-RUN REPAIR BOOTSTRAP FOR V264 NEW TABLES
-- Full CREATE statements below remain the canonical definitions.
-- These CREATE + ADD COLUMN IF NOT EXISTS lines make a partial previous
-- run recoverable without deleting any row.
-- ---------------------------------------------------------------------
create table if not exists public.ldm_schedule_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  details text not null default '',
  assigned_user_id uuid not null,
  assigned_user_name text not null default '',
  assigned_by uuid not null default auth.uid(),
  assigned_by_name text not null default '',
  source text not null default 'personal',
  start_date date not null default current_date,
  alarm_time time without time zone not null default '09:00',
  recurrence text not null default 'one_time',
  selected_days smallint[] not null default '{}'::smallint[],
  priority text not null default 'Normal',
  module_route text,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ldm_schedule_items add column if not exists title text;
alter table public.ldm_schedule_items add column if not exists details text default '';
alter table public.ldm_schedule_items add column if not exists assigned_user_id uuid;
alter table public.ldm_schedule_items add column if not exists assigned_user_name text default '';
alter table public.ldm_schedule_items add column if not exists assigned_by uuid default auth.uid();
alter table public.ldm_schedule_items add column if not exists assigned_by_name text default '';
alter table public.ldm_schedule_items add column if not exists source text default 'personal';
alter table public.ldm_schedule_items add column if not exists start_date date default current_date;
alter table public.ldm_schedule_items add column if not exists alarm_time time without time zone default '09:00';
alter table public.ldm_schedule_items add column if not exists recurrence text default 'one_time';
alter table public.ldm_schedule_items add column if not exists selected_days smallint[] default '{}'::smallint[];
alter table public.ldm_schedule_items add column if not exists priority text default 'Normal';
alter table public.ldm_schedule_items add column if not exists module_route text;
alter table public.ldm_schedule_items add column if not exists end_date date;
alter table public.ldm_schedule_items add column if not exists is_active boolean default true;
alter table public.ldm_schedule_items add column if not exists created_at timestamptz default now();
alter table public.ldm_schedule_items add column if not exists updated_at timestamptz default now();

create table if not exists public.ldm_schedule_occurrence_state (
  item_id uuid not null references public.ldm_schedule_items(id) on delete cascade,
  occurrence_date date not null,
  assigned_user_id uuid not null,
  state text not null default 'pending',
  snoozed_until timestamptz,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key(item_id,occurrence_date)
);
alter table public.ldm_schedule_occurrence_state add column if not exists assigned_user_id uuid;
alter table public.ldm_schedule_occurrence_state add column if not exists state text default 'pending';
alter table public.ldm_schedule_occurrence_state add column if not exists snoozed_until timestamptz;
alter table public.ldm_schedule_occurrence_state add column if not exists note text default '';
alter table public.ldm_schedule_occurrence_state add column if not exists updated_at timestamptz default now();

create table if not exists public.ldm_schedule_events (
  id bigint generated by default as identity primary key,
  item_id uuid not null references public.ldm_schedule_items(id) on delete cascade,
  occurrence_date date not null,
  actor_user_id uuid not null default auth.uid(),
  action text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table public.ldm_schedule_events add column if not exists occurrence_date date;
alter table public.ldm_schedule_events add column if not exists actor_user_id uuid default auth.uid();
alter table public.ldm_schedule_events add column if not exists action text;
alter table public.ldm_schedule_events add column if not exists note text default '';
alter table public.ldm_schedule_events add column if not exists created_at timestamptz default now();

-- ---------------------------------------------------------------------
-- HALF-RUN REPAIR BOOTSTRAP FOR V265 NEW TABLES
-- ---------------------------------------------------------------------
create table if not exists public.ldm_v265_copy_checks(
  id uuid primary key default gen_random_uuid(),
  academic_session text not null default '2026-27',
  teacher_user_id uuid not null,
  teacher_name text not null default '',
  teaching_date date not null,
  period_no integer not null,
  class_name text not null,
  subject text not null,
  lesson_no integer not null default 0,
  topic text not null default '',
  total_students integer not null default 0,
  checked_students integer not null default 0,
  checked_date date,
  learning_status text not null default 'Not Verified',
  remark text not null default '',
  pending_admission_nos text[] not null default '{}'::text[],
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ldm_v265_copy_checks add column if not exists academic_session text default '2026-27';
alter table public.ldm_v265_copy_checks add column if not exists teacher_user_id uuid;
alter table public.ldm_v265_copy_checks add column if not exists teacher_name text default '';
alter table public.ldm_v265_copy_checks add column if not exists teaching_date date;
alter table public.ldm_v265_copy_checks add column if not exists period_no integer;
alter table public.ldm_v265_copy_checks add column if not exists class_name text;
alter table public.ldm_v265_copy_checks add column if not exists subject text;
alter table public.ldm_v265_copy_checks add column if not exists lesson_no integer default 0;
alter table public.ldm_v265_copy_checks add column if not exists topic text default '';
alter table public.ldm_v265_copy_checks add column if not exists total_students integer default 0;
alter table public.ldm_v265_copy_checks add column if not exists checked_students integer default 0;
alter table public.ldm_v265_copy_checks add column if not exists checked_date date;
alter table public.ldm_v265_copy_checks add column if not exists learning_status text default 'Not Verified';
alter table public.ldm_v265_copy_checks add column if not exists remark text default '';
alter table public.ldm_v265_copy_checks add column if not exists pending_admission_nos text[] default '{}'::text[];
alter table public.ldm_v265_copy_checks add column if not exists updated_by uuid;
alter table public.ldm_v265_copy_checks add column if not exists created_at timestamptz default now();
alter table public.ldm_v265_copy_checks add column if not exists updated_at timestamptz default now();

create table if not exists public.ldm_v265_bell_tests(
  id uuid primary key default gen_random_uuid(),
  academic_session text not null default '2026-27',
  teacher_user_id uuid not null,
  teacher_name text not null default '',
  test_date date not null,
  period_no integer not null,
  class_name text not null,
  section text not null default '',
  subject text not null,
  status text not null default 'Planned',
  test_type text not null default 'Oral',
  topic text not null default '',
  max_marks numeric(10,2) not null default 0,
  students_tested integer not null default 0,
  remark text not null default '',
  rescheduled_date date,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ldm_v265_bell_tests add column if not exists academic_session text default '2026-27';
alter table public.ldm_v265_bell_tests add column if not exists teacher_user_id uuid;
alter table public.ldm_v265_bell_tests add column if not exists teacher_name text default '';
alter table public.ldm_v265_bell_tests add column if not exists test_date date;
alter table public.ldm_v265_bell_tests add column if not exists period_no integer;
alter table public.ldm_v265_bell_tests add column if not exists class_name text;
alter table public.ldm_v265_bell_tests add column if not exists section text default '';
alter table public.ldm_v265_bell_tests add column if not exists subject text;
alter table public.ldm_v265_bell_tests add column if not exists status text default 'Planned';
alter table public.ldm_v265_bell_tests add column if not exists test_type text default 'Oral';
alter table public.ldm_v265_bell_tests add column if not exists topic text default '';
alter table public.ldm_v265_bell_tests add column if not exists max_marks numeric(10,2) default 0;
alter table public.ldm_v265_bell_tests add column if not exists students_tested integer default 0;
alter table public.ldm_v265_bell_tests add column if not exists remark text default '';
alter table public.ldm_v265_bell_tests add column if not exists rescheduled_date date;
alter table public.ldm_v265_bell_tests add column if not exists updated_by uuid;
alter table public.ldm_v265_bell_tests add column if not exists created_at timestamptz default now();
alter table public.ldm_v265_bell_tests add column if not exists updated_at timestamptz default now();

create table if not exists public.ldm_v265_principal_audits(
  id uuid primary key default gen_random_uuid(),
  audit_date date not null default current_date,
  academic_session text not null default '2026-27',
  class_name text not null,
  subject text not null,
  teacher_user_id uuid,
  teacher_name text not null default '',
  sample_admission_nos text[] not null default '{}'::text[],
  rating text not null default 'Good',
  remark text not null default '',
  audited_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.ldm_v265_principal_audits add column if not exists audit_date date default current_date;
alter table public.ldm_v265_principal_audits add column if not exists academic_session text default '2026-27';
alter table public.ldm_v265_principal_audits add column if not exists class_name text;
alter table public.ldm_v265_principal_audits add column if not exists subject text;
alter table public.ldm_v265_principal_audits add column if not exists teacher_user_id uuid;
alter table public.ldm_v265_principal_audits add column if not exists teacher_name text default '';
alter table public.ldm_v265_principal_audits add column if not exists sample_admission_nos text[] default '{}'::text[];
alter table public.ldm_v265_principal_audits add column if not exists rating text default 'Good';
alter table public.ldm_v265_principal_audits add column if not exists remark text default '';
alter table public.ldm_v265_principal_audits add column if not exists audited_by uuid default auth.uid();
alter table public.ldm_v265_principal_audits add column if not exists created_at timestamptz default now();

-- =====================================================================
-- V264 SMART WORK ALARM CANONICAL SQL
-- =====================================================================
-- ================================================================
-- L D MODERN EDUCATION ACADEMY
-- V264 SMART WORK ALARM / DAILY SCHEDULE CENTER
-- SAFE ADDITIVE / RE-RUNNABLE / EXISTING-DATA-SAFE
-- No DROP TABLE, TRUNCATE, DELETE, or existing ERP data rewrite.
-- ================================================================
create table if not exists public.ldm_schedule_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  details text not null default '',
  assigned_user_id uuid not null,
  assigned_user_name text not null default '',
  assigned_by uuid not null default auth.uid(),
  assigned_by_name text not null default '',
  source text not null default 'personal',
  start_date date not null default current_date,
  alarm_time time without time zone not null default '09:00',
  recurrence text not null default 'one_time',
  selected_days smallint[] not null default '{}'::smallint[],
  priority text not null default 'Normal',
  module_route text,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ldm_schedule_user_active
  on public.ldm_schedule_items(assigned_user_id,is_active,start_date,alarm_time);
create index if not exists idx_ldm_schedule_by_active
  on public.ldm_schedule_items(assigned_by,is_active,start_date,alarm_time);

create table if not exists public.ldm_schedule_occurrence_state (
  item_id uuid not null references public.ldm_schedule_items(id) on delete cascade,
  occurrence_date date not null,
  assigned_user_id uuid not null,
  state text not null default 'pending',
  snoozed_until timestamptz,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key(item_id,occurrence_date)
);

create index if not exists idx_ldm_schedule_state_user_date
  on public.ldm_schedule_occurrence_state(assigned_user_id,occurrence_date,state);

create table if not exists public.ldm_schedule_events (
  id bigint generated by default as identity primary key,
  item_id uuid not null references public.ldm_schedule_items(id) on delete cascade,
  occurrence_date date not null,
  actor_user_id uuid not null default auth.uid(),
  action text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_ldm_schedule_events_item
  on public.ldm_schedule_events(item_id,created_at desc);

create or replace function public.ldm_v264_is_teacher()
returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select exists(
    select 1
    from public.profiles p
    join public.teacher_profiles tp on tp.auth_user_id=p.id
    where p.id=auth.uid()
      and lower(coalesce(p.role,''))='teacher'
      and tp.is_active is true
      and lower(coalesce(tp.approval_status,''))='approved'
  );
$$;
revoke all on function public.ldm_v264_is_teacher() from public;
grant execute on function public.ldm_v264_is_teacher() to authenticated;

create or replace function public.ldm_v264_user_name(p_uid uuid)
returns text
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select coalesce(
    (select nullif(tp.teacher_name,'') from public.teacher_profiles tp where tp.auth_user_id=p_uid limit 1),
    (select nullif(p.full_name,'') from public.profiles p where p.id=p_uid limit 1),
    'User'
  );
$$;
revoke all on function public.ldm_v264_user_name(uuid) from public;
grant execute on function public.ldm_v264_user_name(uuid) to authenticated;

alter table public.ldm_schedule_items enable row level security;
alter table public.ldm_schedule_occurrence_state enable row level security;
alter table public.ldm_schedule_events enable row level security;

do $$
begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='ldm_schedule_items' and policyname='ldm_schedule_items_select') then
    create policy ldm_schedule_items_select on public.ldm_schedule_items
    for select to authenticated
    using(public.v64_is_admin() or assigned_user_id=auth.uid() or assigned_by=auth.uid());
  end if;

  if not exists(select 1 from pg_policies where schemaname='public' and tablename='ldm_schedule_occurrence_state' and policyname='ldm_schedule_state_select') then
    create policy ldm_schedule_state_select on public.ldm_schedule_occurrence_state
    for select to authenticated
    using(
      public.v64_is_admin()
      or assigned_user_id=auth.uid()
      or exists(select 1 from public.ldm_schedule_items i where i.id=item_id and i.assigned_by=auth.uid())
    );
  end if;

  if not exists(select 1 from pg_policies where schemaname='public' and tablename='ldm_schedule_events' and policyname='ldm_schedule_events_select') then
    create policy ldm_schedule_events_select on public.ldm_schedule_events
    for select to authenticated
    using(
      public.v64_is_admin()
      or exists(select 1 from public.ldm_schedule_items i where i.id=item_id and (i.assigned_user_id=auth.uid() or i.assigned_by=auth.uid()))
    );
  end if;
end $$;

grant select on public.ldm_schedule_items to authenticated;
grant select on public.ldm_schedule_occurrence_state to authenticated;
grant select on public.ldm_schedule_events to authenticated;
revoke insert,update,delete on public.ldm_schedule_items from authenticated;
revoke insert,update,delete on public.ldm_schedule_occurrence_state from authenticated;
revoke insert,update,delete on public.ldm_schedule_events from authenticated;

create or replace function public.ldm_v264_schedule_create(
  p_title text,
  p_details text,
  p_start_date date,
  p_alarm_time time without time zone,
  p_recurrence text,
  p_selected_days smallint[],
  p_priority text,
  p_module_route text,
  p_assignee_user_ids uuid[]
) returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_uid uuid:=auth.uid();
  v_admin boolean:=public.v64_is_admin();
  v_teacher boolean:=public.ldm_v264_is_teacher();
  v_targets uuid[];
  v_assignee uuid;
  v_name text;
  v_by_name text;
  v_id uuid;
  v_ids jsonb:='[]'::jsonb;
  v_rec text:=lower(trim(coalesce(p_recurrence,'one_time')));
  v_pri text:=initcap(lower(trim(coalesce(p_priority,'Normal'))));
begin
  if v_uid is null then raise exception 'Login Required / लॉगिन आवश्यक'; end if;
  if not v_admin and not v_teacher then raise exception 'Permission Denied / अनुमति नहीं है'; end if;
  if nullif(trim(coalesce(p_title,'')),'') is null then raise exception 'Work / Task required'; end if;
  if p_start_date is null or p_alarm_time is null then raise exception 'Date and time required'; end if;
  if v_rec not in ('one_time','daily','weekly','mon_sat','selected_days') then raise exception 'Invalid recurrence'; end if;
  if v_rec='selected_days' and coalesce(array_length(p_selected_days,1),0)=0 then raise exception 'Selected days required'; end if;
  if exists(select 1 from unnest(coalesce(p_selected_days,'{}'::smallint[])) d where d<0 or d>6) then raise exception 'Invalid weekday'; end if;
  if v_pri not in ('Normal','High','Urgent','Low') then v_pri:='Normal'; end if;

  v_by_name:=public.ldm_v264_user_name(v_uid);
  v_targets:=coalesce(p_assignee_user_ids,'{}'::uuid[]);
  if coalesce(array_length(v_targets,1),0)=0 then v_targets:=array[v_uid]; end if;

  if not v_admin and exists(select 1 from unnest(v_targets) x where x<>v_uid) then
    raise exception 'Teacher can create only personal reminders / Teacher केवल अपना reminder बना सकता है';
  end if;

  for v_assignee in select distinct x from unnest(v_targets) x loop
    if v_assignee is null then continue; end if;

    if v_assignee<>v_uid then
      if not v_admin then raise exception 'Permission Denied'; end if;
      if not exists(
        select 1 from public.teacher_profiles tp
        where tp.auth_user_id=v_assignee
          and tp.is_active is true
          and lower(coalesce(tp.approval_status,''))='approved'
      ) then
        raise exception 'Selected Teacher is not active/approved';
      end if;
    end if;

    v_name:=public.ldm_v264_user_name(v_assignee);

    insert into public.ldm_schedule_items(
      title,details,assigned_user_id,assigned_user_name,assigned_by,assigned_by_name,source,
      start_date,alarm_time,recurrence,selected_days,priority,module_route,is_active
    ) values(
      left(trim(p_title),180),left(trim(coalesce(p_details,'')),1000),
      v_assignee,v_name,v_uid,v_by_name,
      case when v_assignee=v_uid then 'personal' else 'admin_assigned' end,
      p_start_date,p_alarm_time,v_rec,coalesce(p_selected_days,'{}'::smallint[]),
      v_pri,nullif(trim(coalesce(p_module_route,'')),''),true
    ) returning id into v_id;

    insert into public.ldm_schedule_events(item_id,occurrence_date,actor_user_id,action,note)
    values(v_id,p_start_date,v_uid,'created',
      case when v_assignee=v_uid then 'Personal alarm created' else 'Assigned to '||v_name end);

    v_ids:=v_ids||jsonb_build_array(v_id);
  end loop;

  return jsonb_build_object('created_count',jsonb_array_length(v_ids),'ids',v_ids);
end;
$$;
revoke all on function public.ldm_v264_schedule_create(text,text,date,time without time zone,text,smallint[],text,text,uuid[]) from public;
grant execute on function public.ldm_v264_schedule_create(text,text,date,time without time zone,text,smallint[],text,text,uuid[]) to authenticated;

create or replace function public.ldm_v264_schedule_update(
  p_item_id uuid,
  p_title text,
  p_details text,
  p_start_date date,
  p_alarm_time time without time zone,
  p_recurrence text,
  p_selected_days smallint[],
  p_priority text,
  p_module_route text
) returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_uid uuid:=auth.uid();
  r public.ldm_schedule_items%rowtype;
  v_rec text:=lower(trim(coalesce(p_recurrence,'one_time')));
  v_pri text:=initcap(lower(trim(coalesce(p_priority,'Normal'))));
begin
  if v_uid is null then raise exception 'Login Required'; end if;
  select * into r from public.ldm_schedule_items where id=p_item_id for update;
  if r.id is null then raise exception 'Alarm not found'; end if;
  if not public.v64_is_admin() and not (r.assigned_by=v_uid and r.assigned_user_id=v_uid) then
    raise exception 'Admin-assigned alarm cannot be edited by Teacher';
  end if;
  if nullif(trim(coalesce(p_title,'')),'') is null then raise exception 'Work / Task required'; end if;
  if p_start_date is null or p_alarm_time is null then raise exception 'Date and time required'; end if;
  if v_rec not in ('one_time','daily','weekly','mon_sat','selected_days') then raise exception 'Invalid recurrence'; end if;
  if v_rec='selected_days' and coalesce(array_length(p_selected_days,1),0)=0 then raise exception 'Selected days required'; end if;
  if exists(select 1 from unnest(coalesce(p_selected_days,'{}'::smallint[])) d where d<0 or d>6) then raise exception 'Invalid weekday'; end if;
  if v_pri not in ('Normal','High','Urgent','Low') then v_pri:='Normal'; end if;

  update public.ldm_schedule_items
  set title=left(trim(p_title),180),
      details=left(trim(coalesce(p_details,'')),1000),
      start_date=p_start_date,
      alarm_time=p_alarm_time,
      recurrence=v_rec,
      selected_days=coalesce(p_selected_days,'{}'::smallint[]),
      priority=v_pri,
      module_route=nullif(trim(coalesce(p_module_route,'')),''),
      updated_at=now()
  where id=p_item_id;

  insert into public.ldm_schedule_events(item_id,occurrence_date,actor_user_id,action,note)
  values(p_item_id,p_start_date,v_uid,'edited','Schedule updated');

  return true;
end;
$$;
revoke all on function public.ldm_v264_schedule_update(uuid,text,text,date,time without time zone,text,smallint[],text,text) from public;
grant execute on function public.ldm_v264_schedule_update(uuid,text,text,date,time without time zone,text,smallint[],text,text) to authenticated;

create or replace function public.ldm_v264_schedule_set_active(
  p_item_id uuid,
  p_active boolean
) returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_uid uuid:=auth.uid();
  r public.ldm_schedule_items%rowtype;
begin
  if v_uid is null then raise exception 'Login Required'; end if;
  select * into r from public.ldm_schedule_items where id=p_item_id for update;
  if r.id is null then raise exception 'Alarm not found'; end if;
  if not public.v64_is_admin() and not (r.assigned_by=v_uid and r.assigned_user_id=v_uid) then
    raise exception 'Permission Denied';
  end if;

  update public.ldm_schedule_items set is_active=coalesce(p_active,false),updated_at=now() where id=p_item_id;
  insert into public.ldm_schedule_events(item_id,occurrence_date,actor_user_id,action,note)
  values(p_item_id,current_date,v_uid,case when p_active then 'reactivated' else 'cancelled' end,'');
  return true;
end;
$$;
revoke all on function public.ldm_v264_schedule_set_active(uuid,boolean) from public;
grant execute on function public.ldm_v264_schedule_set_active(uuid,boolean) to authenticated;

create or replace function public.ldm_v264_schedule_action(
  p_item_id uuid,
  p_occurrence_date date,
  p_action text,
  p_snooze_minutes integer default 0,
  p_note text default ''
) returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_uid uuid:=auth.uid();
  r public.ldm_schedule_items%rowtype;
  v_action text:=lower(trim(coalesce(p_action,'')));
  v_state text:='pending';
  v_snooze timestamptz;
begin
  if v_uid is null then raise exception 'Login Required'; end if;
  select * into r from public.ldm_schedule_items where id=p_item_id;
  if r.id is null then raise exception 'Alarm not found'; end if;
  if r.assigned_user_id<>v_uid and not public.v64_is_admin() then raise exception 'Permission Denied'; end if;
  if p_occurrence_date is null then raise exception 'Occurrence date required'; end if;
  if v_action not in ('done','skip','snooze','reset') then raise exception 'Invalid action'; end if;

  if v_action='done' then v_state:='done';
  elsif v_action='skip' then v_state:='skipped';
  elsif v_action='snooze' then
    if coalesce(p_snooze_minutes,0)<1 or p_snooze_minutes>1440 then raise exception 'Snooze must be 1–1440 minutes'; end if;
    v_state:='pending';v_snooze:=now()+make_interval(mins=>p_snooze_minutes);
  else
    v_state:='pending';v_snooze:=null;
  end if;

  insert into public.ldm_schedule_occurrence_state(item_id,occurrence_date,assigned_user_id,state,snoozed_until,note,updated_at)
  values(p_item_id,p_occurrence_date,r.assigned_user_id,v_state,v_snooze,left(trim(coalesce(p_note,'')),500),now())
  on conflict(item_id,occurrence_date) do update
    set state=excluded.state,
        snoozed_until=excluded.snoozed_until,
        note=excluded.note,
        updated_at=now();

  insert into public.ldm_schedule_events(item_id,occurrence_date,actor_user_id,action,note)
  values(p_item_id,p_occurrence_date,v_uid,v_action,
    case when v_action='snooze' then 'Snoozed '||p_snooze_minutes||' minutes' else left(trim(coalesce(p_note,'')),500) end);

  return jsonb_build_object('item_id',p_item_id,'state',v_state,'snoozed_until',v_snooze);
end;
$$;
revoke all on function public.ldm_v264_schedule_action(uuid,date,text,integer,text) from public;
grant execute on function public.ldm_v264_schedule_action(uuid,date,text,integer,text) to authenticated;

create or replace function public.ldm_v264_my_schedule(p_date date default current_date)
returns table(
  item_id uuid,
  title text,
  details text,
  assigned_user_id uuid,
  assigned_user_name text,
  assigned_by uuid,
  assigned_by_name text,
  source text,
  start_date date,
  alarm_time time without time zone,
  recurrence text,
  selected_days smallint[],
  priority text,
  module_route text,
  occurrence_date date,
  occurrence_state text,
  snoozed_until timestamptz,
  occurrence_note text,
  can_edit boolean
)
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select
    i.id,i.title,i.details,i.assigned_user_id,i.assigned_user_name,i.assigned_by,i.assigned_by_name,i.source,
    i.start_date,i.alarm_time,i.recurrence,i.selected_days,i.priority,i.module_route,
    p_date,
    coalesce(s.state,'pending') as occurrence_state,
    s.snoozed_until,
    coalesce(s.note,'') as occurrence_note,
    (public.v64_is_admin() or (i.assigned_by=auth.uid() and i.assigned_user_id=auth.uid())) as can_edit
  from public.ldm_schedule_items i
  left join public.ldm_schedule_occurrence_state s
    on s.item_id=i.id and s.occurrence_date=p_date
  where i.is_active is true
    and i.assigned_user_id=auth.uid()
    and i.start_date<=p_date
    and (i.end_date is null or p_date<=i.end_date)
    and (
      (i.recurrence='one_time' and i.start_date=p_date)
      or i.recurrence='daily'
      or (i.recurrence='weekly' and extract(dow from i.start_date)::int=extract(dow from p_date)::int)
      or (i.recurrence='mon_sat' and extract(dow from p_date)::int between 1 and 6)
      or (i.recurrence='selected_days' and extract(dow from p_date)::int=any(i.selected_days))
    )
  order by i.alarm_time,i.priority desc,i.title;
$$;
revoke all on function public.ldm_v264_my_schedule(date) from public;
grant execute on function public.ldm_v264_my_schedule(date) to authenticated;

create or replace function public.ldm_v264_schedule_history(p_limit integer default 100)
returns table(
  event_id bigint,
  item_id uuid,
  title text,
  occurrence_date date,
  action text,
  note text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select e.id,e.item_id,i.title,e.occurrence_date,e.action,e.note,e.created_at
  from public.ldm_schedule_events e
  join public.ldm_schedule_items i on i.id=e.item_id
  where public.v64_is_admin()
     or i.assigned_user_id=auth.uid()
     or i.assigned_by=auth.uid()
  order by e.created_at desc
  limit greatest(1,least(coalesce(p_limit,100),500));
$$;
revoke all on function public.ldm_v264_schedule_history(integer) from public;
grant execute on function public.ldm_v264_schedule_history(integer) to authenticated;

do $$
begin
  if to_regclass('public.ldm_schedule_items') is null then raise exception 'V264 missing ldm_schedule_items'; end if;
  if to_regclass('public.ldm_schedule_occurrence_state') is null then raise exception 'V264 missing ldm_schedule_occurrence_state'; end if;
  if to_regclass('public.ldm_schedule_events') is null then raise exception 'V264 missing ldm_schedule_events'; end if;
  if to_regprocedure('public.ldm_v264_my_schedule(date)') is null then raise exception 'V264 missing schedule RPC'; end if;
  if to_regprocedure('public.ldm_v264_schedule_action(uuid,date,text,integer,text)') is null then raise exception 'V264 missing action RPC'; end if;
end $$;

-- =====================================================================
-- V265 ACADEMIC MONITORING CANONICAL SQL
-- =====================================================================
-- =====================================================================
-- L D MODERN EDUCATION ACADEMY
-- V265 ACADEMIC MONITORING CENTER
-- SAFE ADDITIVE / IDEMPOTENT / RE-RUNNABLE / EXISTING-DATA-SAFE
-- Existing teaching/timetable data is READ only. No existing-data rewrite.
-- =====================================================================
create table if not exists public.ldm_v265_copy_checks(
  id uuid primary key default gen_random_uuid(),
  academic_session text not null default '2026-27',
  teacher_user_id uuid not null,
  teacher_name text not null default '',
  teaching_date date not null,
  period_no integer not null,
  class_name text not null,
  subject text not null,
  lesson_no integer not null default 0,
  topic text not null default '',
  total_students integer not null default 0 check(total_students>=0),
  checked_students integer not null default 0 check(checked_students>=0),
  checked_date date,
  learning_status text not null default 'Not Verified',
  remark text not null default '',
  pending_admission_nos text[] not null default '{}'::text[],
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(checked_students<=total_students),
  check(learning_status in ('Not Verified','Verified','Revision Needed'))
);

create unique index if not exists uq_v265_copy_bell
 on public.ldm_v265_copy_checks(teacher_user_id,teaching_date,period_no);
create index if not exists idx_v265_copy_class_subject_date
 on public.ldm_v265_copy_checks(class_name,subject,teaching_date desc);

create table if not exists public.ldm_v265_bell_tests(
  id uuid primary key default gen_random_uuid(),
  academic_session text not null default '2026-27',
  teacher_user_id uuid not null,
  teacher_name text not null default '',
  test_date date not null,
  period_no integer not null,
  class_name text not null,
  section text not null default '',
  subject text not null,
  status text not null default 'Planned',
  test_type text not null default 'Oral',
  topic text not null default '',
  max_marks numeric(10,2) not null default 0 check(max_marks>=0),
  students_tested integer not null default 0 check(students_tested>=0),
  remark text not null default '',
  rescheduled_date date,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(status in ('Planned','Taken','Not Taken','Rescheduled')),
  check(test_type in ('Oral','Written','Quiz','Other'))
);

create unique index if not exists uq_v265_test_bell
 on public.ldm_v265_bell_tests(teacher_user_id,test_date,period_no);
create index if not exists idx_v265_test_class_subject_date
 on public.ldm_v265_bell_tests(class_name,subject,test_date desc,status);

create table if not exists public.ldm_v265_principal_audits(
  id uuid primary key default gen_random_uuid(),
  audit_date date not null default current_date,
  academic_session text not null default '2026-27',
  class_name text not null,
  subject text not null,
  teacher_user_id uuid,
  teacher_name text not null default '',
  sample_admission_nos text[] not null default '{}'::text[],
  rating text not null default 'Good',
  remark text not null default '',
  audited_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  check(rating in ('Good','Needs Improvement','Recheck'))
);

create index if not exists idx_v265_audit_date
 on public.ldm_v265_principal_audits(audit_date desc,class_name,subject);

alter table public.ldm_v265_copy_checks enable row level security;
alter table public.ldm_v265_bell_tests enable row level security;
alter table public.ldm_v265_principal_audits enable row level security;

do $$
begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='ldm_v265_copy_checks' and policyname='v265_copy_select') then
    create policy v265_copy_select on public.ldm_v265_copy_checks
      for select to authenticated
      using(public.v64_is_admin() or teacher_user_id=auth.uid());
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='ldm_v265_bell_tests' and policyname='v265_test_select') then
    create policy v265_test_select on public.ldm_v265_bell_tests
      for select to authenticated
      using(public.v64_is_admin() or teacher_user_id=auth.uid());
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='ldm_v265_principal_audits' and policyname='v265_audit_select') then
    create policy v265_audit_select on public.ldm_v265_principal_audits
      for select to authenticated
      using(public.v64_is_admin() or teacher_user_id=auth.uid());
  end if;
end $$;

grant select on public.ldm_v265_copy_checks to authenticated;
grant select on public.ldm_v265_bell_tests to authenticated;
grant select on public.ldm_v265_principal_audits to authenticated;

create or replace function public.ldm_v265_teacher_name(p_uid uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select coalesce(
    (select nullif(trim(tp.teacher_name),'') from public.teacher_profiles tp where tp.auth_user_id=p_uid limit 1),
    (select nullif(trim(tp.full_name),'') from public.teacher_profiles tp where tp.auth_user_id=p_uid limit 1),
    (select nullif(trim(p.full_name),'') from public.profiles p where p.id=p_uid limit 1),
    'Teacher'
  )
$$;
revoke all on function public.ldm_v265_teacher_name(uuid) from public;
grant execute on function public.ldm_v265_teacher_name(uuid) to authenticated;

create or replace function public.ldm_v265_norm_class(p_value text)
returns text
language plpgsql
immutable
as $$
declare v text:=regexp_replace(lower(trim(coalesce(p_value,''))),'[^a-z0-9]','','g');
begin
  if v in ('nursery','nur') then return 'nursery'; end if;
  if v='lkg' then return 'lkg'; end if;
  if v='ukg' then return 'ukg'; end if;
  v:=regexp_replace(v,'^class','');
  if v ~ '^[0-9]{1,2}$' then return (v::integer)::text; end if;
  return v;
end
$$;
revoke all on function public.ldm_v265_norm_class(text) from public;
grant execute on function public.ldm_v265_norm_class(text) to authenticated;

create or replace function public.ldm_v265_teacher_can_bell(
  p_date date,
  p_period_no integer,
  p_class_name text,
  p_subject text
) returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select
    public.v64_is_admin()
    or exists(
      select 1
      from public.teacher_profiles tp
      join public.timetable t
        on lower(trim(coalesce(t.teacher_name,''))) in (
          lower(trim(coalesce(tp.teacher_name,''))),
          lower(trim(coalesce(tp.full_name,'')))
        )
      where tp.auth_user_id=auth.uid()
        and lower(coalesce(tp.approval_status,''))='approved'
        and coalesce(tp.is_active,true)=true
        and lower(trim(coalesce(t.day_name,'')))=case extract(dow from p_date)::int
          when 0 then 'sunday' when 1 then 'monday' when 2 then 'tuesday'
          when 3 then 'wednesday' when 4 then 'thursday' when 5 then 'friday'
          else 'saturday' end
        and coalesce(t.period_no,0)=coalesce(p_period_no,0)
        and public.ldm_v265_norm_class(t.class_name)=public.ldm_v265_norm_class(p_class_name)
        and lower(trim(coalesce(t.subject,'')))=lower(trim(coalesce(p_subject,'')))
    )
$$;
revoke all on function public.ldm_v265_teacher_can_bell(date,integer,text,text) from public;
grant execute on function public.ldm_v265_teacher_can_bell(date,integer,text,text) to authenticated;

create or replace function public.ldm_v265_class_roster(
  p_class_name text,
  p_subject text,
  p_date date,
  p_period_no integer
) returns table(
  admission_no text,
  student_name text,
  father_name text,
  roll_no text
)
language plpgsql
stable
security definer
set search_path=public,pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Login Required / लॉगिन आवश्यक'; end if;
  if not public.v64_is_admin()
     and not public.ldm_v265_teacher_can_bell(p_date,p_period_no,p_class_name,p_subject)
     and not exists(
       select 1 from public.teaching_diary d
       where d.teacher_user_id=auth.uid()
         and d.teaching_date=p_date
         and coalesce(d.period_no,0)=coalesce(p_period_no,0)
         and public.ldm_v265_norm_class(d.class_name)=public.ldm_v265_norm_class(p_class_name)
         and lower(trim(coalesce(d.subject,'')))=lower(trim(coalesce(p_subject,'')))
     )
  then raise exception 'Teacher is not assigned to this class/subject/bell'; end if;

  return query
  select s.admission_no::text,s.student_name::text,s.father_name::text,s.roll_no::text
  from public.students s
  where public.ldm_v265_norm_class(s.class_name)=public.ldm_v265_norm_class(p_class_name)
    and lower(coalesce(s.status,'active')) not in ('inactive','deleted','trashed','left','withdrawn','archived')
  order by
    case when coalesce(s.roll_no::text,'') ~ '^[0-9]+$' then s.roll_no::text::integer else 999999 end,
    s.student_name;
end
$$;
revoke all on function public.ldm_v265_class_roster(text,text,date,integer) from public;
grant execute on function public.ldm_v265_class_roster(text,text,date,integer) to authenticated;

create or replace function public.ldm_v265_copy_check_save(
  p_academic_session text,
  p_teacher_user_id uuid,
  p_teaching_date date,
  p_period_no integer,
  p_class_name text,
  p_subject text,
  p_lesson_no integer,
  p_topic text,
  p_total_students integer,
  p_checked_students integer,
  p_checked_date date,
  p_learning_status text,
  p_remark text,
  p_pending_admission_nos text[]
) returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_actor uuid:=auth.uid();
  v_target uuid:=coalesce(p_teacher_user_id,auth.uid());
  v_name text;
  v_id uuid;
  v_learning text:=coalesce(nullif(trim(p_learning_status),''),'Not Verified');
begin
  if v_actor is null then raise exception 'Login Required / लॉगिन आवश्यक'; end if;
  if public.v64_is_admin() and p_teacher_user_id is null then raise exception 'Teacher mapping required'; end if;
  if not public.v64_is_admin() and v_target<>v_actor then raise exception 'Permission Denied / अनुमति नहीं है'; end if;
  if coalesce(p_total_students,0)<0 or coalesce(p_checked_students,0)<0 or coalesce(p_checked_students,0)>coalesce(p_total_students,0) then
    raise exception 'Invalid copy checking count';
  end if;
  if v_learning not in ('Not Verified','Verified','Revision Needed') then raise exception 'Invalid learning status'; end if;

  if not exists(
    select 1 from public.teaching_diary d
    where d.teacher_user_id=v_target
      and d.teaching_date=p_teaching_date
      and coalesce(d.period_no,0)=coalesce(p_period_no,0)
      and public.ldm_v265_norm_class(d.class_name)=public.ldm_v265_norm_class(p_class_name)
      and lower(trim(coalesce(d.subject,'')))=lower(trim(coalesce(p_subject,'')))
  ) then
    raise exception 'Daily Teaching record not found for this bell. Save teaching first.';
  end if;

  v_name:=public.ldm_v265_teacher_name(v_target);

  insert into public.ldm_v265_copy_checks(
    academic_session,teacher_user_id,teacher_name,teaching_date,period_no,class_name,subject,
    lesson_no,topic,total_students,checked_students,checked_date,learning_status,remark,
    pending_admission_nos,updated_by,updated_at
  ) values(
    coalesce(nullif(trim(p_academic_session),''),'2026-27'),v_target,v_name,p_teaching_date,p_period_no,trim(p_class_name),trim(p_subject),
    coalesce(p_lesson_no,0),left(trim(coalesce(p_topic,'')),300),
    coalesce(p_total_students,0),coalesce(p_checked_students,0),coalesce(p_checked_date,current_date),
    v_learning,left(trim(coalesce(p_remark,'')),800),coalesce(p_pending_admission_nos,'{}'::text[]),v_actor,now()
  )
  on conflict(teacher_user_id,teaching_date,period_no) do update set
    class_name=excluded.class_name,
    subject=excluded.subject,
    lesson_no=excluded.lesson_no,
    topic=excluded.topic,
    total_students=excluded.total_students,
    checked_students=excluded.checked_students,
    checked_date=excluded.checked_date,
    learning_status=excluded.learning_status,
    remark=excluded.remark,
    pending_admission_nos=excluded.pending_admission_nos,
    updated_by=v_actor,
    updated_at=now()
  returning id into v_id;

  return v_id;
end
$$;
revoke all on function public.ldm_v265_copy_check_save(text,uuid,date,integer,text,text,integer,text,integer,integer,date,text,text,text[]) from public;
grant execute on function public.ldm_v265_copy_check_save(text,uuid,date,integer,text,text,integer,text,integer,integer,date,text,text,text[]) to authenticated;

create or replace function public.ldm_v265_bell_test_save(
  p_academic_session text,
  p_teacher_user_id uuid,
  p_test_date date,
  p_period_no integer,
  p_class_name text,
  p_section text,
  p_subject text,
  p_teacher_name text,
  p_status text,
  p_test_type text,
  p_topic text,
  p_max_marks numeric,
  p_students_tested integer,
  p_remark text,
  p_rescheduled_date date
) returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_actor uuid:=auth.uid();
  v_target uuid:=coalesce(p_teacher_user_id,auth.uid());
  v_name text;
  v_status text:=initcap(lower(trim(coalesce(p_status,'Planned'))));
  v_type text:=initcap(lower(trim(coalesce(p_test_type,'Oral'))));
  v_id uuid;
begin
  if v_actor is null then raise exception 'Login Required / लॉगिन आवश्यक'; end if;
  if public.v64_is_admin() and p_teacher_user_id is null then raise exception 'Teacher mapping required'; end if;
  if not public.v64_is_admin() then
    if v_target<>v_actor then raise exception 'Permission Denied / अनुमति नहीं है'; end if;
    if not public.ldm_v265_teacher_can_bell(p_test_date,p_period_no,p_class_name,p_subject) then
      raise exception 'This class/subject/bell is not assigned to this Teacher';
    end if;
  end if;

  if v_status not in ('Planned','Taken','Not Taken','Rescheduled') then raise exception 'Invalid test status'; end if;
  if v_type not in ('Oral','Written','Quiz','Other') then raise exception 'Invalid test type'; end if;
  if v_status='Taken' and nullif(trim(coalesce(p_topic,'')),'') is null then raise exception 'Topic required for Taken test'; end if;
  if v_status='Rescheduled' and p_rescheduled_date is null then raise exception 'Rescheduled date required'; end if;
  if coalesce(p_max_marks,0)<0 or coalesce(p_students_tested,0)<0 then raise exception 'Invalid marks/student count'; end if;

  v_name:=coalesce(nullif(trim(p_teacher_name),''),public.ldm_v265_teacher_name(v_target));

  insert into public.ldm_v265_bell_tests(
    academic_session,teacher_user_id,teacher_name,test_date,period_no,class_name,section,subject,
    status,test_type,topic,max_marks,students_tested,remark,rescheduled_date,updated_by,updated_at
  ) values(
    coalesce(nullif(trim(p_academic_session),''),'2026-27'),v_target,v_name,p_test_date,p_period_no,trim(p_class_name),trim(coalesce(p_section,'')),trim(p_subject),
    v_status,v_type,left(trim(coalesce(p_topic,'')),300),coalesce(p_max_marks,0),coalesce(p_students_tested,0),
    left(trim(coalesce(p_remark,'')),800),p_rescheduled_date,v_actor,now()
  )
  on conflict(teacher_user_id,test_date,period_no) do update set
    teacher_name=excluded.teacher_name,
    class_name=excluded.class_name,
    section=excluded.section,
    subject=excluded.subject,
    status=excluded.status,
    test_type=excluded.test_type,
    topic=excluded.topic,
    max_marks=excluded.max_marks,
    students_tested=excluded.students_tested,
    remark=excluded.remark,
    rescheduled_date=excluded.rescheduled_date,
    updated_by=v_actor,
    updated_at=now()
  returning id into v_id;

  return v_id;
end
$$;
revoke all on function public.ldm_v265_bell_test_save(text,uuid,date,integer,text,text,text,text,text,text,text,numeric,integer,text,date) from public;
grant execute on function public.ldm_v265_bell_test_save(text,uuid,date,integer,text,text,text,text,text,text,text,numeric,integer,text,date) to authenticated;

create or replace function public.ldm_v265_principal_audit_save(
  p_academic_session text,
  p_class_name text,
  p_subject text,
  p_teacher_user_id uuid,
  p_teacher_name text,
  p_sample_admission_nos text[],
  p_rating text,
  p_remark text
) returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare v_id uuid;v_rating text:=coalesce(nullif(trim(p_rating),''),'Good');
begin
  if auth.uid() is null then raise exception 'Login Required'; end if;
  if not public.v64_is_admin() then raise exception 'Admin / Principal only'; end if;
  if v_rating not in ('Good','Needs Improvement','Recheck') then raise exception 'Invalid rating'; end if;

  insert into public.ldm_v265_principal_audits(
    audit_date,academic_session,class_name,subject,teacher_user_id,teacher_name,
    sample_admission_nos,rating,remark,audited_by
  ) values(
    current_date,coalesce(nullif(trim(p_academic_session),''),'2026-27'),trim(p_class_name),trim(p_subject),p_teacher_user_id,trim(coalesce(p_teacher_name,'')),
    coalesce(p_sample_admission_nos,'{}'::text[]),v_rating,left(trim(coalesce(p_remark,'')),1000),auth.uid()
  ) returning id into v_id;
  return v_id;
end
$$;
revoke all on function public.ldm_v265_principal_audit_save(text,text,text,uuid,text,text[],text,text) from public;
grant execute on function public.ldm_v265_principal_audit_save(text,text,text,uuid,text,text[],text,text) to authenticated;

do $$
begin
  if to_regclass('public.ldm_v265_copy_checks') is null then raise exception 'V265 copy table missing'; end if;
  if to_regclass('public.ldm_v265_bell_tests') is null then raise exception 'V265 test table missing'; end if;
  if to_regclass('public.ldm_v265_principal_audits') is null then raise exception 'V265 audit table missing'; end if;
  if to_regprocedure('public.ldm_v265_copy_check_save(text,uuid,date,integer,text,text,integer,text,integer,integer,date,text,text,text[])') is null then raise exception 'V265 copy RPC missing'; end if;
  if to_regprocedure('public.ldm_v265_bell_test_save(text,uuid,date,integer,text,text,text,text,text,text,text,numeric,integer,text,date)') is null then raise exception 'V265 test RPC missing'; end if;
end $$;

-- ---------------------------------------------------------------------
-- FINAL SELF-VERIFICATION: catches exactly the class of error in screenshot.
-- ---------------------------------------------------------------------
do $$
begin
  -- V264 tables
  if to_regclass('public.ldm_schedule_items') is null then raise exception 'VERIFY FAIL: ldm_schedule_items missing'; end if;
  if to_regclass('public.ldm_schedule_occurrence_state') is null then raise exception 'VERIFY FAIL: ldm_schedule_occurrence_state missing'; end if;
  if to_regclass('public.ldm_schedule_events') is null then raise exception 'VERIFY FAIL: ldm_schedule_events missing'; end if;

  -- V264 RPCs used by alarm.js
  if to_regprocedure('public.ldm_v264_schedule_create(text,text,date,time without time zone,text,smallint[],text,text,uuid[])') is null then raise exception 'VERIFY FAIL: ldm_v264_schedule_create missing'; end if;
  if to_regprocedure('public.ldm_v264_schedule_update(uuid,text,text,date,time without time zone,text,smallint[],text,text)') is null then raise exception 'VERIFY FAIL: ldm_v264_schedule_update missing'; end if;
  if to_regprocedure('public.ldm_v264_schedule_set_active(uuid,boolean)') is null then raise exception 'VERIFY FAIL: ldm_v264_schedule_set_active missing'; end if;
  if to_regprocedure('public.ldm_v264_schedule_action(uuid,date,text,integer,text)') is null then raise exception 'VERIFY FAIL: ldm_v264_schedule_action missing'; end if;
  if to_regprocedure('public.ldm_v264_my_schedule(date)') is null then raise exception 'VERIFY FAIL: ldm_v264_my_schedule missing'; end if;
  if to_regprocedure('public.ldm_v264_schedule_history(integer)') is null then raise exception 'VERIFY FAIL: ldm_v264_schedule_history missing'; end if;

  -- V265 tables
  if to_regclass('public.ldm_v265_copy_checks') is null then raise exception 'VERIFY FAIL: ldm_v265_copy_checks missing'; end if;
  if to_regclass('public.ldm_v265_bell_tests') is null then raise exception 'VERIFY FAIL: ldm_v265_bell_tests missing'; end if;
  if to_regclass('public.ldm_v265_principal_audits') is null then raise exception 'VERIFY FAIL: ldm_v265_principal_audits missing'; end if;

  -- V265 RPCs used by academic_monitor.js
  if to_regprocedure('public.ldm_v265_class_roster(text,text,date,integer)') is null then raise exception 'VERIFY FAIL: ldm_v265_class_roster missing'; end if;
  if to_regprocedure('public.ldm_v265_copy_check_save(text,uuid,date,integer,text,text,integer,text,integer,integer,date,text,text,text[])') is null then raise exception 'VERIFY FAIL: ldm_v265_copy_check_save missing'; end if;
  if to_regprocedure('public.ldm_v265_bell_test_save(text,uuid,date,integer,text,text,text,text,text,text,text,numeric,integer,text,date)') is null then raise exception 'VERIFY FAIL: ldm_v265_bell_test_save missing'; end if;
  if to_regprocedure('public.ldm_v265_principal_audit_save(text,text,text,uuid,text,text[],text,text)') is null then raise exception 'VERIFY FAIL: ldm_v265_principal_audit_save missing'; end if;
end $$;

-- Force PostgREST/Supabase to see newly created/replaced RPCs immediately.
notify pgrst, 'reload schema';

commit;

-- Visible SQL Editor confirmation row.
select
  'V265.2 COMPLETE'::text as build,
  (to_regprocedure('public.ldm_v264_my_schedule(date)') is not null) as alarm_today_rpc,
  (to_regprocedure('public.ldm_v264_schedule_history(integer)') is not null) as alarm_history_rpc,
  (to_regprocedure('public.ldm_v265_copy_check_save(text,uuid,date,integer,text,text,integer,text,integer,integer,date,text,text,text[])') is not null) as copy_check_rpc,
  (to_regprocedure('public.ldm_v265_bell_test_save(text,uuid,date,integer,text,text,text,text,text,text,text,numeric,integer,text,date)') is not null) as bell_test_rpc;

begin;

-- =====================================================================
-- V266 ASSIGNED WORK LINK ROOT FIX
-- =====================================================================
do $$
begin
  if to_regclass('public.ldm_work_tasks') is null then raise exception 'V266 dependency missing: public.ldm_work_tasks'; end if;
  if to_regclass('public.ldm_work_task_assignees') is null then raise exception 'V266 dependency missing: public.ldm_work_task_assignees'; end if;
  if to_regclass('public.ldm_work_task_events') is null then raise exception 'V266 dependency missing: public.ldm_work_task_events'; end if;
  if to_regprocedure('public.ldm_v187_is_admin()') is null then raise exception 'V266 dependency missing: public.ldm_v187_is_admin()'; end if;
end $$;

create or replace function public.ldm_v266_is_delegable_route(p_route text)
returns boolean
language sql
immutable
as $$
  select nullif(btrim(coalesce(p_route,'')),'') is not null
     and btrim(p_route) = any(array[
      'admissions',
      'students',
      'data_hub',
      'attendance',
      'master_attendance',
      'idcard_center',
      'promotion_center',
      'v90_student_requests',
      'v90_teacher_requests',
      'v74_bell_center',
      'v90_teaching_monitor',
      'exam_admit_center',
      'exams',
      'v65_smart_marks',
      'result_control',
      'marksheet_center',
      'result_receipt_center',
      'v90_exam_monitor',
      'v90_marks_monitor',
      'academics',
      'certificate_center',
      'timetable_master',
      'teaching_monitor',
      'academic_monitor',
      'homework',
      'v65_teaching',
      'v65_achievements',
      'v66_programs',
      'class_review_center',
      'van_center',
      'v130_driver_setup',
      'transport',
      'v90_transport_monitor',
      'notice_order_center',
      'notices',
      'events',
      'gallery',
      'home_highlights',
      'enquiries',
      'library',
      'my_notes',
      'class_teacher_control',
      'v150_student_master',
      'master_gate_pass',
      'attendance_conflict_center',
      'v92_admit_publish',
      'school_documents_center',
      'principal_assembly',
      'up_board_center'
     ]::text[])
$$;
revoke all on function public.ldm_v266_is_delegable_route(text) from public;
grant execute on function public.ldm_v266_is_delegable_route(text) to authenticated;

create or replace function public.ldm_create_work_task(
  p_title text,
  p_details text default '',
  p_module_route text default null,
  p_priority text default 'Normal',
  p_due_date date default null,
  p_assignees jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public,pg_temp
as $$
declare
  v_task_id uuid;
  v_role text;
  v_count integer := 0;
  r record;
begin
  if not public.ldm_v187_is_admin() then raise exception 'Admin / Principal only'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'Task title required'; end if;
  if coalesce(jsonb_typeof(p_assignees),'') <> 'array' then raise exception 'Assignee list must be an array'; end if;

  select count(*) into v_count
  from jsonb_to_recordset(p_assignees)
    as x(teacher_auth_user_id uuid, teacher_profile_id text, teacher_name text, responsibility text)
  where x.teacher_auth_user_id is not null;
  if v_count = 0 then raise exception 'कम से कम एक mapped teacher चुनें'; end if;
  v_count := 0;

  p_priority := case when p_priority in ('Low','Normal','High','Urgent') then p_priority else 'Normal' end;
  p_module_route := nullif(btrim(coalesce(p_module_route,'')),'');
  p_details := btrim(coalesce(p_details,''));

  if p_module_route is null and p_details='' then
    raise exception 'Linked ERP Function चुनें; General Work हो तो Instructions लिखें.';
  end if;
  if p_module_route is not null and not public.ldm_v266_is_delegable_route(p_module_route) then
    raise exception 'Invalid or protected ERP function route: %', p_module_route;
  end if;

  insert into public.ldm_work_tasks(title,details,module_route,priority,due_date,status,is_active,created_by)
  values (btrim(p_title),p_details,p_module_route,p_priority,p_due_date,'assigned',true,auth.uid())
  returning id into v_task_id;

  for r in
    select * from jsonb_to_recordset(p_assignees)
      as x(teacher_auth_user_id uuid, teacher_profile_id text, teacher_name text, responsibility text)
  loop
    if r.teacher_auth_user_id is null then continue; end if;
    v_role := case when r.responsibility='primary' then 'primary' else 'assistant' end;

    if not exists(
      select 1 from public.teacher_profiles tp
      where tp.auth_user_id=r.teacher_auth_user_id
        and lower(coalesce(tp.approval_status,''))='approved'
        and coalesce(tp.is_active,true)=true
    ) then
      raise exception 'Selected teacher is not active/approved/mapped: %', coalesce(r.teacher_name,'Teacher');
    end if;

    insert into public.ldm_work_task_assignees(
      task_id,teacher_auth_user_id,teacher_profile_id,teacher_name,responsibility,status,is_active,assigned_by
    ) values (
      v_task_id,r.teacher_auth_user_id,r.teacher_profile_id,
      coalesce(nullif(btrim(r.teacher_name),''),'Teacher'),v_role,'assigned',true,auth.uid()
    )
    on conflict (task_id,teacher_auth_user_id) do update
      set teacher_profile_id=excluded.teacher_profile_id,
          teacher_name=excluded.teacher_name,
          responsibility=excluded.responsibility,
          status='assigned',is_active=true,updated_at=now();
    v_count := v_count + 1;
  end loop;

  insert into public.ldm_work_task_events(task_id,actor_user_id,actor_role,event_type,note)
  values(v_task_id,auth.uid(),'admin','created',
    'Task assigned to '||v_count||' teacher(s)'||
    case when p_module_route is not null then ' • ERP: '||p_module_route else ' • General Work' end);

  return v_task_id;
end;
$$;

create or replace function public.ldm_admin_update_work_task(
  p_task_id uuid,
  p_title text,
  p_details text default '',
  p_module_route text default null,
  p_priority text default 'Normal',
  p_due_date date default null,
  p_status text default 'assigned'
)
returns boolean
language plpgsql
security definer
set search_path = public,pg_temp
as $$
begin
  if not public.ldm_v187_is_admin() then raise exception 'Admin / Principal only'; end if;
  if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'Task title required'; end if;

  p_priority := case when p_priority in ('Low','Normal','High','Urgent') then p_priority else 'Normal' end;
  p_status := case when p_status in ('assigned','in_progress','submitted','completed','cancelled') then p_status else 'assigned' end;
  p_module_route := nullif(btrim(coalesce(p_module_route,'')),'');
  p_details := btrim(coalesce(p_details,''));

  if p_module_route is not null and not public.ldm_v266_is_delegable_route(p_module_route) then
    raise exception 'Invalid or protected ERP function route: %', p_module_route;
  end if;

  update public.ldm_work_tasks
     set title=btrim(p_title),details=p_details,module_route=p_module_route,
         priority=p_priority,due_date=p_due_date,status=p_status,
         is_active=(p_status not in ('cancelled','completed')),updated_at=now()
   where id=p_task_id;
  if not found then raise exception 'Task not found'; end if;

  insert into public.ldm_work_task_events(task_id,actor_user_id,actor_role,event_type,note)
  values(p_task_id,auth.uid(),'admin','task_updated',
    'Status: '||p_status||
    case when p_module_route is not null then ' • ERP: '||p_module_route
         when p_details<>'' then ' • General Work'
         else ' • Link Pending' end);
  return true;
end;
$$;

revoke all on function public.ldm_create_work_task(text,text,text,text,date,jsonb) from public;
revoke all on function public.ldm_admin_update_work_task(uuid,text,text,text,text,date,text) from public;
grant execute on function public.ldm_create_work_task(text,text,text,text,date,jsonb) to authenticated;
grant execute on function public.ldm_admin_update_work_task(uuid,text,text,text,text,date,text) to authenticated;

notify pgrst, 'reload schema';

do $$
begin
  if to_regprocedure('public.ldm_v266_is_delegable_route(text)') is null then raise exception 'VERIFY FAIL: V266 route validator missing'; end if;
  if to_regprocedure('public.ldm_create_work_task(text,text,text,text,date,jsonb)') is null then raise exception 'VERIFY FAIL: create work RPC missing'; end if;
  if to_regprocedure('public.ldm_admin_update_work_task(uuid,text,text,text,text,date,text)') is null then raise exception 'VERIFY FAIL: update work RPC missing'; end if;
end $$;

select
  'V266 DELEGATION LINK ROOT FIX'::text as build,
  (to_regprocedure('public.ldm_create_work_task(text,text,text,text,date,jsonb)') is not null) as create_work_rpc,
  (to_regprocedure('public.ldm_admin_update_work_task(uuid,text,text,text,text,date,text)') is not null) as update_work_rpc,
  public.ldm_v266_is_delegable_route('van_center') as van_link_allowed,
  public.ldm_v266_is_delegable_route('academic_monitor') as academic_link_allowed,
  public.ldm_v266_is_delegable_route('settings') as settings_protected;

commit;
