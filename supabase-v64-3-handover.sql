-- Atomic teacher relief / handover. No teacher, salary, attendance or student is deleted.
begin;
create table if not exists public.v643_teacher_handover_history(
 id uuid primary key default gen_random_uuid(),old_teacher_id uuid not null,new_teacher_id uuid,
 relieved_date date not null,reason text not null,handled_by uuid not null,
 snapshot jsonb not null,created_at timestamptz not null default now()
);
alter table public.v643_teacher_handover_history enable row level security;
grant select on public.v643_teacher_handover_history to authenticated;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='v643_teacher_handover_history' and policyname='admin_read') then
  create policy admin_read on public.v643_teacher_handover_history for select to authenticated using(public.role_in(array['admin','super_admin']));
 end if;
end $$;
create or replace function public.v643_teacher_handover(p_old uuid,p_new uuid,p_date date,p_reason text)
returns uuid language plpgsql security definer set search_path=public set row_security=off as $$
declare old_t jsonb;new_t jsonb;history_id uuid;classes jsonb;subjects jsonb;times jsonb:='[]';ts timestamptz:=now();setters text:='';col text;val text;newname text;
begin
 perform public.v643_teacher_preflight(auth.uid());
 if p_old is null or p_old=p_new or p_date is null or btrim(coalesce(p_reason,''))='' then raise exception 'Leaving teacher, different replacement, date and reason are required';end if;
 if p_date>current_date then raise exception 'Future relief must be applied on the leaving date';end if;
 perform pg_advisory_xact_lock(hashtext('teacher-responsibilities'));
 select to_jsonb(t) into old_t from public.teacher_profiles t where id=p_old for update;
 if old_t is null or coalesce((old_t->>'is_active')::boolean,true)=false then raise exception 'Leaving teacher is not active';end if;
 if p_new is not null then
  select to_jsonb(t) into new_t from public.teacher_profiles t where id=p_new for update;
  if new_t is null or coalesce((new_t->>'is_active')::boolean,true)=false or lower(coalesce(new_t->>'approval_status',''))<>'approved' then raise exception 'Replacement must be an approved active teacher';end if;
 end if;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]') into classes from public.teacher_class_assignments t where teacher_profile_id=p_old and is_active=true;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]') into subjects from public.teacher_subject_assignments t where teacher_profile_id=p_old and is_active=true;
 if to_regclass('public.timetable') is not null then
  execute 'select coalesce(jsonb_agg(to_jsonb(t)),''[]'') from public.timetable t where to_jsonb(t)->>''teacher_profile_id''=$1 or to_jsonb(t)->>''teacher_id'' in ($1,$2) or (nullif($3,'''') is not null and to_jsonb(t)->>''teacher_name''=$3)' into times using p_old::text,old_t->>'auth_user_id',coalesce(old_t->>'teacher_name',old_t->>'full_name');
 end if;
 insert into public.v643_teacher_handover_history(old_teacher_id,new_teacher_id,relieved_date,reason,handled_by,snapshot)
 values(p_old,p_new,p_date,btrim(p_reason),auth.uid(),jsonb_build_object('teacher',old_t,'classes',classes,'subjects',subjects,'timetable',times)) returning id into history_id;
 update public.teacher_class_assignments set is_active=false,ended_at=ts where teacher_profile_id=p_old and is_active=true;
 update public.teacher_subject_assignments set is_active=false where teacher_profile_id=p_old and is_active=true;
 if p_new is not null then
  insert into public.teacher_class_assignments(teacher_profile_id,academic_session,class_name,is_class_teacher,is_active,approved_by,approved_at,started_at)
  select p_new,j->>'academic_session',j->>'class_name',coalesce((j->>'is_class_teacher')::boolean,false),true,auth.uid(),ts,ts from jsonb_array_elements(classes)j
  where not exists(select 1 from public.teacher_class_assignments a where a.teacher_profile_id=p_new and a.academic_session=j->>'academic_session' and a.class_name=j->>'class_name' and a.is_active=true);
  update public.teacher_class_assignments a set is_class_teacher=true where a.teacher_profile_id=p_new and a.is_active=true and exists(select 1 from jsonb_array_elements(classes)j where j->>'class_name'=a.class_name and j->>'academic_session'=a.academic_session and (j->>'is_class_teacher')::boolean=true);
  insert into public.teacher_subject_assignments(teacher_profile_id,academic_session,subject_name,is_special_subject,is_active)
  select p_new,j->>'academic_session',j->>'subject_name',coalesce((j->>'is_special_subject')::boolean,true),true from jsonb_array_elements(subjects)j
  where not exists(select 1 from public.teacher_subject_assignments a where a.teacher_profile_id=p_new and a.academic_session=j->>'academic_session' and a.subject_name=j->>'subject_name' and a.is_active=true);
 end if;
 -- Assignments in the working timetable change; exact previous rows remain in history.
 if jsonb_array_length(times)>0 then
  if exists(select 1 from jsonb_array_elements(times) j where nullif(j->>'teacher_id','') is not null and j->>'teacher_id'<>p_old::text and j->>'teacher_id'<>coalesce(old_t->>'auth_user_id','')) then raise exception 'Timetable teacher identity is ambiguous; no changes were saved';end if;
  if exists(select 1 from public.teacher_profiles t where t.id<>p_old and coalesce(to_jsonb(t)->>'teacher_name',to_jsonb(t)->>'full_name')=coalesce(old_t->>'teacher_name',old_t->>'full_name')) then
   raise exception 'Two teachers have the same name; resolve timetable identity before handover';
  end if;
  foreach col in array array['teacher_profile_id','teacher_id','teacher_name'] loop
   if exists(select 1 from information_schema.columns where table_schema='public' and table_name='timetable' and column_name=col) then
    if setters<>'' then setters:=setters||',';end if;
    setters:=setters||format('%1$I=(jsonb_populate_record(null::public.timetable,$1)).%1$I',col);
   end if;
  end loop;
  newname:=coalesce(new_t->>'teacher_name',new_t->>'full_name','');
  execute format('update public.timetable t set %s where to_jsonb(t)->>''teacher_profile_id''=$2 or to_jsonb(t)->>''teacher_id'' in ($2,$3) or (nullif($4,'''') is not null and to_jsonb(t)->>''teacher_name''=$4)',setters)
  using jsonb_build_object('teacher_profile_id',p_new,'teacher_id',case when exists(select 1 from jsonb_array_elements(times)j where j->>'teacher_id'=old_t->>'auth_user_id') then new_t->>'auth_user_id' else p_new::text end,'teacher_name',newname),p_old::text,old_t->>'auth_user_id',coalesce(old_t->>'teacher_name',old_t->>'full_name');
 end if;
 update public.teacher_profiles set status='Relieved',is_active=false,updated_at=ts where id=p_old;
 update public.profiles set status='inactive' where id=(old_t->>'auth_user_id')::uuid;
 return history_id;
end $$;
revoke all on function public.v643_teacher_handover(uuid,uuid,date,text) from public;
grant execute on function public.v643_teacher_handover(uuid,uuid,date,text) to authenticated;
commit;
notify pgrst,'reload schema';
