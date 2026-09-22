-- L D MODERN EDUCATION ACADEMY ERP
-- V64.21 FRESH SAFE MIGRATION — 2026-09-22
-- PURPOSE: Teacher single identity path + assignment integrity + Due Fee Master support.
-- SAFE RULE: No student/parent/fee rows are deleted or reset. Existing teacher rows are not auto-deleted.

begin;

-- 1) Teacher profile compatibility for the single Admin-created login path.
do $$
begin
  if to_regclass('public.teacher_profiles') is null then
    raise exception 'Required table public.teacher_profiles is missing. Stop and restore the current ERP schema first.';
  end if;
  alter table public.teacher_profiles add column if not exists auth_user_id uuid;
  alter table public.teacher_profiles add column if not exists email text;
  alter table public.teacher_profiles add column if not exists employee_id text;
  alter table public.teacher_profiles add column if not exists contact_email text;
  alter table public.teacher_profiles add column if not exists mobile text;
  alter table public.teacher_profiles add column if not exists phone text;
  alter table public.teacher_profiles add column if not exists teacher_name text;
  alter table public.teacher_profiles add column if not exists full_name text;
  alter table public.teacher_profiles add column if not exists approval_status text default 'Pending';
  alter table public.teacher_profiles add column if not exists status text default 'Active';
  alter table public.teacher_profiles add column if not exists is_active boolean default true;
  alter table public.teacher_profiles add column if not exists password_created boolean default false;
  alter table public.teacher_profiles add column if not exists requested_classes text[] default '{}'::text[];
  alter table public.teacher_profiles add column if not exists requested_subjects text[] default '{}'::text[];
  alter table public.teacher_profiles add column if not exists updated_at timestamptz default now();
end $$;

-- Normalize harmless blank values only; do not merge/delete identities automatically.
update public.teacher_profiles
set mobile = nullif(regexp_replace(coalesce(mobile, phone, ''), '\\D', '', 'g'), ''),
    updated_at = now()
where mobile is null or btrim(mobile) = '';

-- Duplicate-safe indexes: employee id uniqueness is enforced only when current data is already clean.
do $$
begin
  if not exists (
    select 1 from public.teacher_profiles
    where employee_id is not null and btrim(employee_id) <> ''
    group by employee_id having count(*) > 1
  ) then
    execute $q$create unique index if not exists ux_ldmea_teacher_employee_id on public.teacher_profiles(employee_id) where employee_id is not null and btrim(employee_id) <> ''$q$;
  end if;
  create index if not exists ix_ldmea_teacher_auth_user on public.teacher_profiles(auth_user_id);
  create index if not exists ix_ldmea_teacher_mobile on public.teacher_profiles(mobile);
  create index if not exists ix_ldmea_teacher_status on public.teacher_profiles(approval_status,is_active,status);
end $$;

-- 2) Assignment tables are required by the existing Teacher Dashboard.
do $$
begin
  if to_regclass('public.teacher_class_assignments') is null then
    raise exception 'Required table public.teacher_class_assignments is missing. Stop: do not create an incompatible parallel table.';
  end if;
  if to_regclass('public.teacher_subject_assignments') is null then
    raise exception 'Required table public.teacher_subject_assignments is missing. Stop: do not create an incompatible parallel table.';
  end if;
  alter table public.teacher_class_assignments add column if not exists is_active boolean default true;
  alter table public.teacher_class_assignments add column if not exists is_class_teacher boolean default false;
  alter table public.teacher_class_assignments add column if not exists academic_session text default '2026-27';
  alter table public.teacher_class_assignments add column if not exists started_at timestamptz default now();
  alter table public.teacher_class_assignments add column if not exists ended_at timestamptz;
  alter table public.teacher_subject_assignments add column if not exists is_active boolean default true;
  alter table public.teacher_subject_assignments add column if not exists is_special_subject boolean default false;
  alter table public.teacher_subject_assignments add column if not exists academic_session text default '2026-27';
end $$;

create index if not exists ix_ldmea_teacher_class_active
  on public.teacher_class_assignments(teacher_profile_id, academic_session, is_active);
create index if not exists ix_ldmea_teacher_subject_active
  on public.teacher_subject_assignments(teacher_profile_id, academic_session, is_active);

-- Prevent duplicate ACTIVE assignment rows without touching historical inactive rows.
do $$
begin
  if not exists (
    select 1 from public.teacher_class_assignments
    where is_active is true
    group by teacher_profile_id, academic_session, class_name
    having count(*) > 1
  ) then
    execute 'create unique index if not exists ux_ldmea_teacher_class_active on public.teacher_class_assignments(teacher_profile_id,academic_session,class_name) where is_active is true';
  end if;
  if not exists (
    select 1 from public.teacher_subject_assignments
    where is_active is true
    group by teacher_profile_id, academic_session, subject_name
    having count(*) > 1
  ) then
    execute 'create unique index if not exists ux_ldmea_teacher_subject_active on public.teacher_subject_assignments(teacher_profile_id,academic_session,subject_name) where is_active is true';
  end if;
end $$;

-- 3) Due Fee Master support. Existing authoritative tables remain the source of truth.
do $$
begin
  if to_regclass('public.fees') is null then
    raise exception 'Required authoritative fee table public.fees is missing.';
  end if;
  -- Add only compatibility columns used by the current fee UI when absent.
  alter table public.fees add column if not exists due_amount numeric default 0;
  alter table public.fees add column if not exists paid_amount numeric default 0;
  alter table public.fees add column if not exists monthly_fee numeric default 0;
end $$;
create index if not exists ix_ldmea_fees_admission on public.fees(admission_no);

-- Schedule table is optional. If it exists, make Till-Month calculations fast.
do $$
begin
  if to_regclass('public.student_fee_schedules') is not null then
    execute 'create index if not exists ix_ldmea_fee_schedule_admission_due on public.student_fee_schedules(admission_no,due_date)';
  end if;
end $$;

-- 4) Read-only verification view for Admin/SQL Editor diagnosis.
create or replace view public.ldmea_v6421_teacher_identity_audit as
select
  tp.id as teacher_profile_id,
  tp.auth_user_id,
  tp.employee_id,
  coalesce(tp.teacher_name,tp.full_name) as teacher_name,
  tp.mobile,
  tp.phone,
  tp.approval_status,
  tp.status,
  tp.is_active,
  (select count(*) from public.teacher_class_assignments ca where ca.teacher_profile_id=tp.id and ca.is_active is true) as active_classes,
  (select count(*) from public.teacher_subject_assignments sa where sa.teacher_profile_id=tp.id and sa.is_active is true) as active_subjects
from public.teacher_profiles tp;

comment on view public.ldmea_v6421_teacher_identity_audit is
'V64.21 read-only teacher identity/assignment verification. No password is stored here.';

commit;

-- AFTER RUNNING: use these READ-ONLY checks.
-- A. Duplicate auth mapping (must return 0 rows):
select auth_user_id, count(*) from public.teacher_profiles
where auth_user_id is not null group by auth_user_id having count(*) > 1;
-- B. Duplicate employee id (must return 0 rows):
select employee_id, count(*) from public.teacher_profiles
where employee_id is not null and btrim(employee_id)<>'' group by employee_id having count(*) > 1;
-- C. Teacher identity/assignment summary:
select * from public.ldmea_v6421_teacher_identity_audit order by teacher_name;

-- D. RLS / policy inspection for Teacher runtime (READ-ONLY result; no destructive policy rewrite).
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public' and tablename in ('profiles','teacher_profiles','teacher_class_assignments','teacher_subject_assignments','students','attendance','timetable','homework','worksheets','fees','student_fee_schedules')
order by tablename, policyname;
