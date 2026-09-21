-- LDMEA V65.1 FINAL DEEP SAFE TEACHER MIGRATION — 2026-09-21
-- Non-destructive, idempotent, rerunnable. No DELETE/TRUNCATE.
begin;

alter table if exists public.teacher_profiles add column if not exists contact_email text;
alter table if exists public.teacher_profiles add column if not exists requested_subjects text[] not null default '{}'::text[];
alter table if exists public.teacher_profiles add column if not exists employee_id text;
alter table if exists public.teacher_profiles add column if not exists status text default 'Active';
alter table if exists public.teacher_profiles add column if not exists password_created boolean not null default false;
alter table if exists public.profiles add column if not exists must_change_password boolean not null default false;
alter table if exists public.staff add column if not exists address text;
alter table if exists public.staff add column if not exists father_name text;


-- Authoritative automatic Employee ID for new staff/teachers. Existing nonblank IDs are preserved.
create or replace function public.ldmea_v651_staff_employee_id()
returns trigger language plpgsql set search_path=public as $$
declare n bigint;
begin
 if nullif(btrim(coalesce(new.employee_id,'')),'') is null then
   perform pg_advisory_xact_lock(hashtext('ldmea-staff-employee-id'));
   select coalesce(max((regexp_match(employee_id,'([0-9]+)$'))[1]::bigint),0)+1 into n
   from public.staff where employee_id ~ '[0-9]+$';
   new.employee_id := 'TCH-'||lpad(n::text,5,'0');
 end if;
 return new;
end $$;
do $$ begin
 if to_regclass('public.staff') is not null and not exists(select 1 from pg_trigger where tgname='trg_ldmea_v651_staff_employee_id') then
   create trigger trg_ldmea_v651_staff_employee_id before insert on public.staff for each row execute function public.ldmea_v651_staff_employee_id();
 end if;
end $$;
do $$ begin
 if not exists(select employee_id from public.staff where employee_id is not null and btrim(employee_id)<>'' group by employee_id having count(*)>1) then
   create unique index if not exists staff_employee_id_v651_unique on public.staff(employee_id) where employee_id is not null and btrim(employee_id)<>'';
 else raise notice 'Existing duplicate staff employee_id found; unique index skipped without deleting data'; end if;
end $$;

do $$ begin
 if not exists(select auth_user_id from public.teacher_profiles where auth_user_id is not null group by auth_user_id having count(*)>1) then
  create unique index if not exists teacher_profiles_auth_user_unique_nonnull on public.teacher_profiles(auth_user_id) where auth_user_id is not null;
 else raise notice 'Existing duplicate auth_user_id found; unique index skipped without deleting data'; end if;
 if not exists(select employee_id from public.teacher_profiles where employee_id is not null and btrim(employee_id)<>'' group by employee_id having count(*)>1) then
  create unique index if not exists teacher_profiles_employee_unique_nonblank on public.teacher_profiles(employee_id) where employee_id is not null and btrim(employee_id)<>'';
 else raise notice 'Existing duplicate employee_id found; unique index skipped without deleting data'; end if;
end $$;
create index if not exists teacher_profiles_mobile_lookup on public.teacher_profiles(mobile);
create index if not exists teacher_profiles_phone_lookup on public.teacher_profiles(phone);
create index if not exists teacher_class_assignments_active_lookup on public.teacher_class_assignments(teacher_profile_id,class_name,is_active);
create index if not exists teacher_subject_assignments_active_lookup on public.teacher_subject_assignments(teacher_profile_id,subject_name,is_active);


create or replace function public.v643_teacher_preflight(p_actor uuid)
returns boolean language plpgsql security definer set search_path=public set row_security=off as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and lower(role) in ('admin','super_admin') and lower(coalesce(status,'active'))='active')
 or not exists(select 1 from public.v95_primary_admin where singleton_id=1 and user_id=p_actor) then raise exception 'Primary Admin required' using errcode='42501';end if;
 return true;
end $$;
create or replace function public.v643_teacher_assignments(p_actor uuid,p_teacher uuid,p_classes text[],p_class_teacher text,p_subjects text[],p_session text)
returns boolean language plpgsql security definer set search_path=public set row_security=off as $$
begin
 perform public.v643_teacher_preflight(p_actor);
 if p_session !~ '^[0-9]{4}-[0-9]{2}$' then raise exception 'Academic session required';end if;
 perform pg_advisory_xact_lock(hashtext('teacher-responsibilities'));
 if not exists(select 1 from public.teacher_profiles where id=p_teacher) then raise exception 'Teacher not found';end if;
 update public.teacher_class_assignments set is_active=false,ended_at=now() where teacher_profile_id=p_teacher and academic_session=p_session and is_active=true;
 if coalesce(p_class_teacher,'')<>'' then
  if not p_class_teacher=any(coalesce(p_classes,array[]::text[])) then raise exception 'Class teacher class must be assigned';end if;
  update public.teacher_class_assignments set is_active=false,ended_at=now() where academic_session=p_session and class_name=p_class_teacher and is_class_teacher=true and is_active=true;
 end if;
 insert into public.teacher_class_assignments(teacher_profile_id,academic_session,class_name,is_class_teacher,is_active,approved_by,approved_at,started_at)
 select p_teacher,p_session,c,c=p_class_teacher,true,p_actor,now(),now() from (select distinct btrim(x) c from unnest(coalesce(p_classes,array[]::text[]))x where btrim(x)<>'') q;
 update public.teacher_subject_assignments set is_active=false where teacher_profile_id=p_teacher and academic_session=p_session and is_active=true;
 insert into public.teacher_subject_assignments(teacher_profile_id,academic_session,subject_name,is_special_subject,is_active)
 select p_teacher,p_session,c,true,true from (select distinct btrim(x) c from unnest(coalesce(p_subjects,array[]::text[]))x where btrim(x)<>'') q;
 return true;
end $$;
revoke all on function public.v643_teacher_preflight(uuid) from public;
revoke all on function public.v643_teacher_assignments(uuid,uuid,text[],text,text[],text) from public;
grant execute on function public.v643_teacher_preflight(uuid),public.v643_teacher_assignments(uuid,uuid,text[],text,text[],text) to service_role;

-- Keep historical approval values for audit compatibility. New Admin-created accounts are saved Approved directly.
-- Existing records are NOT auto-approved, deleted, or rewritten here.

commit;
