-- =====================================================================
-- L D MODERN EDUCATION ACADEMY
-- V265 ACADEMIC MONITORING CENTER
-- SAFE ADDITIVE / IDEMPOTENT / RE-RUNNABLE / EXISTING-DATA-SAFE
-- Existing teaching/timetable data is READ only. No existing-data rewrite.
-- =====================================================================
begin;

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

notify pgrst, 'reload schema';
commit;
