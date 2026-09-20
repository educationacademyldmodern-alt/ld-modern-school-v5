-- Atomic teacher responsibility changes; service role only after API checks.
begin;
create or replace function public.v643_teacher_preflight(p_actor uuid)
returns boolean language plpgsql security definer set search_path=public set row_security=off as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and lower(role) in ('admin','super_admin') and lower(coalesce(status,'active'))='active')
 or not exists(select 1 from public.v95_primary_admin where singleton_id=1 and user_id=p_actor) then raise exception 'Primary Admin required' using errcode='42501';end if;
 if to_regclass('public.teacher_profiles') is null or to_regclass('public.teacher_class_assignments') is null or to_regclass('public.teacher_subject_assignments') is null then raise exception 'Teacher tables are not configured';end if;
 return true;
end $$;
create or replace function public.v643_teacher_assignments(p_actor uuid,p_teacher uuid,p_classes text[],p_class_teacher text,p_subjects text[],p_session text)
returns boolean language plpgsql security definer set search_path=public set row_security=off as $$
begin
 perform public.v643_teacher_preflight(p_actor);
 if p_session !~ '^[0-9]{4}-[0-9]{2}$' then raise exception 'Academic session required';end if;
 perform pg_advisory_xact_lock(hashtext('teacher-responsibilities'));
 if not exists(select 1 from public.teacher_profiles where id=p_teacher) then raise exception 'Teacher not found';end if;
 update public.teacher_class_assignments set is_active=false,ended_at=now()
 where teacher_profile_id=p_teacher and academic_session=p_session and is_active=true;
 if coalesce(p_class_teacher,'')<>'' then
  if not p_class_teacher=any(coalesce(p_classes,array[]::text[])) then raise exception 'Class teacher class must be assigned';end if;
  update public.teacher_class_assignments set is_active=false,ended_at=now()
  where academic_session=p_session and class_name=p_class_teacher and is_class_teacher=true and is_active=true;
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
commit;
notify pgrst,'reload schema';
