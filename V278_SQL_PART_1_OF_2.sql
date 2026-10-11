-- ================================================================
-- L D MODERN EDUCATION ACADEMY
-- V278 ROOT STABLE DELEGATION REPAIR
-- ADDITIVE / RE-RUNNABLE / EXISTING-DATA SAFE
-- Fixes old V187 route-null problem + India Work Date + exact Teacher operation
-- ================================================================
begin;

create extension if not exists pgcrypto;

-- ---------- Role helper ----------
create or replace function public.ldm_v187_is_admin()
returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
 select exists(
   select 1 from public.profiles p
   where p.id=auth.uid()
     and lower(coalesce(p.role,'')) in ('admin','super_admin','principal')
     and lower(coalesce(p.status,'active'))<>'disabled'
 )
$$;
revoke all on function public.ldm_v187_is_admin() from public;
grant execute on function public.ldm_v187_is_admin() to authenticated;

-- ---------- India date: avoids UTC midnight delay ----------
create or replace function public.ldm_v278_india_date()
returns date
language sql
stable
as $$
 select (now() at time zone 'Asia/Kolkata')::date
$$;
revoke all on function public.ldm_v278_india_date() from public;
grant execute on function public.ldm_v278_india_date() to authenticated;

-- ---------- Canonical delegation-ready route list ----------
create or replace function public.ldm_v278_route_ready(p_route text)
returns boolean
language sql
immutable
as $$
 select btrim(coalesce(p_route,'')) = any(array['attendance','master_attendance','teacher_bells','v90_teacher_daily','homework','academic_monitor','v90_teacher_marks','teacher_notices','gallery','my_notes','class_opinions','v91_student_photos','v143_teacher_qr_attendance','master_gate_pass','v66_programs']::text[])
$$;
revoke all on function public.ldm_v278_route_ready(text) from public;
grant execute on function public.ldm_v278_route_ready(text) to authenticated;

-- Keep V272 compatibility but make V278 canonical.
create or replace function public.ldm_v272_route_ready(p_route text)
returns boolean
language sql
immutable
as $$ select public.ldm_v278_route_ready(p_route) $$;
revoke all on function public.ldm_v272_route_ready(text) from public;
grant execute on function public.ldm_v272_route_ready(text) to authenticated;

-- ---------- Core task tables ----------
create table if not exists public.ldm_work_tasks(
 id uuid primary key default gen_random_uuid(),
 title text not null,
 details text not null default '',
 module_route text,
 priority text not null default 'Normal',
 work_date date,
 due_date date,
 status text not null default 'assigned',
 is_active boolean not null default true,
 created_by uuid not null default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.ldm_work_tasks add column if not exists details text not null default '';
alter table public.ldm_work_tasks add column if not exists module_route text;
alter table public.ldm_work_tasks add column if not exists priority text not null default 'Normal';
alter table public.ldm_work_tasks add column if not exists work_date date;
alter table public.ldm_work_tasks add column if not exists due_date date;
alter table public.ldm_work_tasks add column if not exists status text not null default 'assigned';
alter table public.ldm_work_tasks add column if not exists is_active boolean not null default true;
alter table public.ldm_work_tasks add column if not exists created_by uuid default auth.uid();
alter table public.ldm_work_tasks add column if not exists created_at timestamptz not null default now();
alter table public.ldm_work_tasks add column if not exists updated_at timestamptz not null default now();

-- Old tasks with no Work Date become available from their creation date, not future Due Date.
update public.ldm_work_tasks
set work_date=coalesce((created_at at time zone 'Asia/Kolkata')::date,public.ldm_v278_india_date())
where work_date is null;
alter table public.ldm_work_tasks alter column work_date set default public.ldm_v278_india_date();

create table if not exists public.ldm_work_task_assignees(
 id uuid primary key default gen_random_uuid(),
 task_id uuid not null references public.ldm_work_tasks(id) on delete cascade,
 teacher_auth_user_id uuid not null,
 teacher_profile_id text,
 teacher_name text not null,
 responsibility text not null default 'assistant',
 status text not null default 'assigned',
 teacher_note text not null default '',
 admin_note text not null default '',
 is_active boolean not null default true,
 assigned_by uuid not null default auth.uid(),
 assigned_at timestamptz not null default now(),
 started_at timestamptz,
 submitted_at timestamptz,
 completed_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.ldm_work_task_assignees add column if not exists teacher_profile_id text;
alter table public.ldm_work_task_assignees add column if not exists teacher_name text;
alter table public.ldm_work_task_assignees add column if not exists responsibility text not null default 'assistant';
alter table public.ldm_work_task_assignees add column if not exists status text not null default 'assigned';
alter table public.ldm_work_task_assignees add column if not exists teacher_note text not null default '';
alter table public.ldm_work_task_assignees add column if not exists admin_note text not null default '';
alter table public.ldm_work_task_assignees add column if not exists is_active boolean not null default true;
alter table public.ldm_work_task_assignees add column if not exists assigned_by uuid default auth.uid();
alter table public.ldm_work_task_assignees add column if not exists assigned_at timestamptz not null default now();
alter table public.ldm_work_task_assignees add column if not exists started_at timestamptz;
alter table public.ldm_work_task_assignees add column if not exists submitted_at timestamptz;
alter table public.ldm_work_task_assignees add column if not exists completed_at timestamptz;
alter table public.ldm_work_task_assignees add column if not exists updated_at timestamptz not null default now();

create unique index if not exists ldm_work_task_assignees_uq
 on public.ldm_work_task_assignees(task_id,teacher_auth_user_id);
create index if not exists ldm_work_tasks_work_date_idx
 on public.ldm_work_tasks(work_date,status,is_active);
create index if not exists ldm_work_assignee_user_idx
 on public.ldm_work_task_assignees(teacher_auth_user_id,is_active,status);

create table if not exists public.ldm_work_task_events(
 id bigint generated by default as identity primary key,
 task_id uuid not null references public.ldm_work_tasks(id) on delete cascade,
 assignment_id uuid references public.ldm_work_task_assignees(id) on delete set null,
 actor_user_id uuid default auth.uid(),
 actor_role text,
 event_type text not null,
 note text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists ldm_work_task_events_task_idx
 on public.ldm_work_task_events(task_id,created_at desc);

-- ---------- Read scope ----------
create or replace function public.ldm_v187_can_read_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
 select public.ldm_v187_is_admin()
 or exists(
   select 1 from public.ldm_work_task_assignees a
   where a.task_id=p_task_id
     and a.teacher_auth_user_id=auth.uid()
     and a.is_active is true
     and lower(coalesce(a.status,'assigned'))<>'removed'
 )
$$;
revoke all on function public.ldm_v187_can_read_task(uuid) from public;
grant execute on function public.ldm_v187_can_read_task(uuid) to authenticated;

alter table public.ldm_work_tasks enable row level security;
alter table public.ldm_work_task_assignees enable row level security;
alter table public.ldm_work_task_events enable row level security;

do $$
begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ldm_work_tasks' and policyname='ldm_work_tasks_select') then
   create policy ldm_work_tasks_select on public.ldm_work_tasks for select to authenticated using(public.ldm_v187_can_read_task(id));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ldm_work_task_assignees' and policyname='ldm_work_assignees_select') then
   create policy ldm_work_assignees_select on public.ldm_work_task_assignees for select to authenticated
   using(public.ldm_v187_is_admin() or (teacher_auth_user_id=auth.uid() and is_active is true and lower(coalesce(status,'assigned'))<>'removed'));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='ldm_work_task_events' and policyname='ldm_work_events_select') then
   create policy ldm_work_events_select on public.ldm_work_task_events for select to authenticated using(public.ldm_v187_can_read_task(task_id));
 end if;
end $$;

alter policy ldm_work_tasks_select on public.ldm_work_tasks to authenticated using(public.ldm_v187_can_read_task(id));
alter policy ldm_work_assignees_select on public.ldm_work_task_assignees to authenticated
 using(public.ldm_v187_is_admin() or (teacher_auth_user_id=auth.uid() and is_active is true and lower(coalesce(status,'assigned'))<>'removed'));
alter policy ldm_work_events_select on public.ldm_work_task_events to authenticated using(public.ldm_v187_can_read_task(task_id));

grant select on public.ldm_work_tasks,public.ldm_work_task_assignees,public.ldm_work_task_events to authenticated;

notify pgrst,'reload schema';
commit;

select 'V278 PART 1 READY'::text as status,
 (to_regclass('public.ldm_work_tasks') is not null) as task_table,
 (to_regprocedure('public.ldm_v278_route_ready(text)') is not null) as route_ready;
