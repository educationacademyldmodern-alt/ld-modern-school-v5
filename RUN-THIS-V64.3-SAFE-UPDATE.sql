-- SINGLE TRANSACTION: apply V64.3 patches only; do not run old schema files.
begin;
-- supabase-v64-3-parent-and-role.sql
-- V64.3 Parent actions + recursion-safe role helpers. Existing records retained.
-- Run as database owner in Supabase SQL Editor, after backup. Transactional and rerunnable.
create table if not exists public.student_leave_requests(
  id uuid primary key default gen_random_uuid(),
  admission_no text not null,
  student_name text,
  class_name text,
  section text,
  parent_user_id uuid,
  parent_email text,
  from_date date not null,
  to_date date not null,
  leave_type text default 'Other',
  reason text,
  attachment_url text,
  status text not null default 'Pending',
  reviewer_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_v64_leave_adm on public.student_leave_requests(admission_no);
create index if not exists idx_v64_leave_class_dates on public.student_leave_requests(class_name,from_date,to_date,status);

create table if not exists public.student_correction_requests(
  id uuid primary key default gen_random_uuid(),
  admission_no text not null,
  student_name text,
  class_name text,
  parent_user_id uuid,
  parent_email text,
  proposed_changes jsonb not null default '{}'::jsonb,
  reason text,
  status text not null default 'Pending',
  reviewer_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_v64_corr_adm on public.student_correction_requests(admission_no);
create index if not exists idx_v64_corr_class_status on public.student_correction_requests(class_name,status);

create table if not exists public.school_complaints(
  id uuid primary key default gen_random_uuid(),
  complaint_no text unique,
  category text not null default 'Other',
  subject text not null,
  description text not null,
  source text not null default 'admin',
  complainant_name text,
  complainant_phone text,
  student_id uuid,
  teacher_profile_id uuid,
  class_name text,
  priority text not null default 'Normal',
  is_confidential boolean not null default true,
  status text not null default 'New',
  admin_note text,
  action_taken text,
  submitted_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_leave_requests enable row level security;
alter table public.student_correction_requests enable row level security;
alter table public.school_complaints enable row level security;
grant select,update on public.student_leave_requests,public.student_correction_requests,public.school_complaints to authenticated;
do $$ declare tab text; begin
 foreach tab in array array['student_leave_requests','student_correction_requests','school_complaints'] loop
  if not exists(select 1 from pg_policies where schemaname='public' and tablename=tab and policyname='v643_admin_requests') then
   execute format('create policy v643_admin_requests on public.%I for all to authenticated using (public.role_in(array[''admin'',''super_admin'',''principal''])) with check (public.role_in(array[''admin'',''super_admin'',''principal'']))',tab);
  end if;
 end loop;
end $$;
create or replace function public.my_role()
returns text language sql stable security definer set search_path=public set row_security=off
as $$ select lower(p.role) from public.profiles p where p.id=auth.uid() and lower(coalesce(p.status,'active'))='active' limit 1 $$;
create or replace function public.role_in(r text[])
returns boolean language sql stable security definer set search_path=public set row_security=off
as $$ select coalesce(public.my_role()=any(r),false) $$;
-- Owner bypasses RLS inside helpers; normal authenticated clients retain RLS.
alter table public.profiles enable row level security;
alter table public.profiles no force row level security;
grant execute on function public.my_role(),public.role_in(text[]) to authenticated,service_role;

create or replace function public.v643_parent_student(p_admission_no text)
returns jsonb language plpgsql stable security definer set search_path=public set row_security=off as $$
declare s jsonb; p jsonb; em text;
begin
 if auth.uid() is null then raise exception 'Login required' using errcode='42501'; end if;
 select to_jsonb(x) into p from public.profiles x where x.id=auth.uid();
 if lower(coalesce(p->>'status','active'))<>'active' or lower(coalesce(p->>'role','')) not in ('parent','student') then
  raise exception 'Active Parent / Student account required' using errcode='42501'; end if;
 select to_jsonb(x) into s from public.students x where x.admission_no=p_admission_no;
 if s is null or lower(coalesce(s->>'status','active')) not in ('active','approved','admitted') then
  raise exception 'Active student record not found' using errcode='42501'; end if;
 em:=lower(trim(coalesce(auth.jwt()->>'email','')));
 if coalesce(p->>'linked_admission_no','')<>p_admission_no and not
   (lower(p->>'role')='parent' and em<>'' and lower(trim(coalesce(s->>'parent_email','')))=em) then
  raise exception 'Student not linked to this login' using errcode='42501'; end if;
 return s;
end $$;
revoke all on function public.v643_parent_student(text) from public;

create or replace function public.v643_parent_data(p_admission_no text,p_kind text)
returns jsonb language plpgsql stable security definer set search_path=public set row_security=off as $$
declare s jsonb; rows jsonb:='[]'; more jsonb:='[]'; current_due numeric; tbl text; keys text[]; filt text; ordering text;
begin
 s:=public.v643_parent_student(p_admission_no);
 if p_kind='profile' then
  select jsonb_object_agg(k,v) into more from jsonb_each(s) e(k,v) where k=any(array['admission_no','student_name','father_name','mother_name','class_name','section','roll_no','dob','phone','address','guardian_name','emergency_phone']);
  return jsonb_build_object('student',more);
 end if;
 filt:='to_jsonb(t)->>''admission_no''=$1';ordering:='coalesce(to_jsonb(t)->>''date'',to_jsonb(t)->>''created_at'','''') desc';
 case p_kind
 when 'attendance' then tbl:='attendance';keys:=array['date','status','remarks'];
 when 'timetable' then tbl:='timetable';keys:=array['day_name','period_no','start_time','end_time','subject','teacher_name'];filt:='to_jsonb(t)->>''class_name''=$2 and (coalesce(to_jsonb(t)->>''section'','''')='''' or coalesce(to_jsonb(t)->>''section'','''')=$4)';ordering:='case to_jsonb(t)->>''day_name'' when ''Monday'' then 1 when ''Tuesday'' then 2 when ''Wednesday'' then 3 when ''Thursday'' then 4 when ''Friday'' then 5 when ''Saturday'' then 6 else 7 end, coalesce((to_jsonb(t)->>''period_no'')::integer,0)';
 when 'notices' then tbl:='notices';keys:=array['id','letter_no','date','title','message','download_url'];filt:='coalesce(to_jsonb(t)->>''audience'','''') in (''all'',''All'',''public'',''parents'',''parent'',''student:all'',''class:''||$2,''student:''||$1)';
 when 'gallery' then tbl:='gallery';keys:=array['title','media_type','media_url'];filt:='coalesce(to_jsonb(t)->>''audience'',''all'') in (''all'',''All'',''public'',''parents'',''parent'',''student:all'',''class:''||$2,''student:''||$1)';
 when 'leave' then tbl:='student_leave_requests';keys:=array['from_date','to_date','reason','status','reviewer_note'];
 when 'correction' then tbl:='student_correction_requests';keys:=array['created_at','reason','status','reviewer_note','proposed_changes'];
 when 'gate' then tbl:='v102_student_gate_pass';keys:=array['gate_date','reason','status','approved_departure_time','left_at','returned_at'];
 when 'help' then tbl:='school_complaints';keys:=array['created_at','subject','status'];filt:='to_jsonb(t)->>''student_id''=$5 and to_jsonb(t)->>''submitted_by''=auth.uid()::text';
 when 'transport' then tbl:='v68_transport_settings';keys:=array['route_name','vehicle_no','monthly_fee','is_active','pickup_point','driver_name','driver_phone'];
 when 'fees' then
  if to_regclass('public.student_fee_schedules') is not null then
   execute 'select coalesce(jsonb_agg(jsonb_build_object(''date'',j->>''due_date'',''label'',coalesce(j->>''schedule_label'',j->>''fee_head''),''amount'',j->''amount'',''paid'',j->''paid_amount'',''due'',greatest(coalesce((j->>''amount'')::numeric,0)-coalesce((j->>''paid_amount'')::numeric,0),0))),''[]'') from (select to_jsonb(t) j from public.student_fee_schedules t where to_jsonb(t)->>''admission_no''=$1 order by to_jsonb(t)->>''due_date'' desc limit 250)x' into rows using p_admission_no;
  end if;
  if rows='[]'::jsonb and to_regclass('public.fees') is not null then
   execute 'select coalesce(jsonb_agg(jsonb_build_object(''date'',j->>''date'',''label'',j->>''receipt_no'',''amount'',j->''total_fee'',''paid'',j->''paid_amount'',''due'',j->''due_amount'')),''[]'') from (select to_jsonb(t) j from public.fees t where to_jsonb(t)->>''admission_no''=$1 order by to_jsonb(t)->>''date'' desc limit 250)x' into rows using p_admission_no;
  end if;
  if to_regprocedure('public.v111_current_due(text)') is not null then execute 'select public.v111_current_due($1)' into current_due using p_admission_no;
  elsif to_regprocedure('public.v67_current_fee_due(text)') is not null then execute 'select public.v67_current_fee_due($1)' into current_due using p_admission_no; end if;
  if to_regclass('public.v111_fee_due_notices') is not null then
   execute 'select coalesce(jsonb_agg(jsonb_build_object(''title'',j->>''title'',''note'',j->>''note'',''deposit_by_date'',j->>''deposit_by_date'')),''[]'') from (select to_jsonb(t) j from public.v111_fee_due_notices t where to_jsonb(t)->>''admission_no''=$1 and coalesce((to_jsonb(t)->>''is_active'')::boolean,true) order by to_jsonb(t)->>''created_at'' desc limit 20)x' into more using p_admission_no;
  end if;
  return jsonb_build_object('rows',rows,'notices',more,'current_due',current_due);
 when 'learning' then
  foreach tbl in array array['teaching_diary','teaching_updates','homework'] loop
   if to_regclass('public.'||tbl) is not null then
    execute format('select coalesce(jsonb_agg(jsonb_build_object(''date'',coalesce(j->>''teaching_date'',j->>''update_date'',j->>''date''),''subject'',j->>''subject'',''period_no'',j->>''period_no'',''title'',coalesce(j->>''topic'',j->>''lesson_topic'',j->>''title''),''details'',coalesce(j->>''details'',j->>''work_done'',j->>''description''),''homework'',coalesce(j->>''homework_remark'',j->>''homework''),''worksheet_url'',coalesce(j->>''worksheet_url'',j->>''attachment_url''))),''[]'') from (select to_jsonb(t) j from public.%I t where to_jsonb(t)->>''class_name''=$1 and (coalesce(to_jsonb(t)->>''section'','''')='''' or to_jsonb(t)->>''section''=$2) order by coalesce(to_jsonb(t)->>''teaching_date'',to_jsonb(t)->>''update_date'',to_jsonb(t)->>''date'') desc limit 60)x',tbl) into more using s->>'class_name',coalesce(s->>'section','');
    rows:=rows||more;
   end if;
  end loop;
  return jsonb_build_object('rows',rows);
 else raise exception 'Unknown parent section';
 end case;
 if to_regclass('public.'||tbl) is null then raise exception 'This section is not configured: %',p_kind; end if;
 execute format('select coalesce(jsonb_agg(x.row),''[]'') from (select (select jsonb_object_agg(k,v) from jsonb_each(to_jsonb(t)) e(k,v) where k=any($3)) row from public.%I t where %s order by %s limit 250)x',tbl,filt,ordering)
 into rows using p_admission_no,s->>'class_name',keys,coalesce(s->>'section',''),s->>'id';
 return jsonb_build_object('rows',rows);
end $$;
revoke all on function public.v643_parent_data(text,text) from public;
grant execute on function public.v643_parent_data(text,text) to authenticated;

create or replace function public.v643_parent_request(p_admission_no text,p_kind text,p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public set row_security=off as $$
declare s jsonb; ident uuid; v_reason text; f date; t date; field text; val text;
begin
 s:=public.v643_parent_student(p_admission_no);v_reason:=btrim(coalesce(p_payload->>'reason',''));
 if length(v_reason)<1 or length(v_reason)>2000 then raise exception 'Reason / message is required (maximum 2000 characters)'; end if;
 -- Serialize identical submissions from the same login to avoid accidental double-click records.
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text||p_admission_no||p_kind));
 if p_kind='leave' then
  f:=(p_payload->>'from')::date;t:=(p_payload->>'to')::date;
  if f is null or t is null or t<f or t-f>60 then raise exception 'Valid leave dates required (maximum 60 days)'; end if;
  select id into ident from public.student_leave_requests where parent_user_id=auth.uid() and admission_no=p_admission_no and from_date=f and to_date=t and reason=v_reason and status='Pending' limit 1;
  if ident is not null then return ident; end if;
  insert into public.student_leave_requests(admission_no,student_name,class_name,section,parent_user_id,parent_email,from_date,to_date,leave_type,reason)
  values(p_admission_no,s->>'student_name',s->>'class_name',s->>'section',auth.uid(),lower(auth.jwt()->>'email'),f,t,coalesce(nullif(p_payload->>'type',''),'Other'),v_reason) returning id into ident;
 elsif p_kind='correction' then
  field:=p_payload->>'field';val:=btrim(coalesce(p_payload->>'value',''));
  if field is null or field<>all(array['student_name','father_name','mother_name','dob','phone','address','guardian_name','emergency_phone','roll_no']) or val='' or length(val)>500 then raise exception 'Invalid correction field/value'; end if;
  insert into public.student_correction_requests(admission_no,student_name,class_name,parent_user_id,parent_email,proposed_changes,reason)
  values(p_admission_no,s->>'student_name',s->>'class_name',auth.uid(),lower(auth.jwt()->>'email'),jsonb_build_object(field,val),v_reason) returning id into ident;
 elsif p_kind='help' then
  if btrim(coalesce(p_payload->>'subject',''))='' or length(p_payload->>'subject')>200 then raise exception 'Subject is required (maximum 200 characters)'; end if;
  insert into public.school_complaints(category,subject,description,source,student_id,class_name,submitted_by,is_confidential,status,priority)
  values(coalesce(nullif(p_payload->>'category',''),'Parent Complaint'),btrim(p_payload->>'subject'),v_reason,'parent',(s->>'id')::uuid,s->>'class_name',auth.uid(),true,'New','Normal') returning id into ident;
 else raise exception 'Unknown request type';end if;
 return ident;
end $$;
revoke all on function public.v643_parent_request(text,text,jsonb) from public;
grant execute on function public.v643_parent_request(text,text,jsonb) to authenticated;

-- supabase-v64-2-profile-guard.sql
-- V64.2 additive guard. Run AFTER existing V64 migration; no existing policy is removed.
-- Requires existing public.profiles and public.my_role(). Transaction rolls back on failure.
alter table public.profiles add column if not exists must_change_password boolean not null default false;
alter table public.profiles add column if not exists password_changed_at timestamptz;
create or replace function public.v642_guard_profile_update()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 -- Trusted SQL maintenance and service-role API remain available.
 if auth.uid() is null and coalesce(auth.role(),'') in ('','service_role') then return new; end if;
 if auth.role()='service_role' then return new; end if;
 if public.my_role() in ('admin','super_admin') then return new; end if;
 if old.id is distinct from auth.uid() or new.id is distinct from old.id then
   raise exception 'Profile update not permitted' using errcode='42501';
 end if;
 -- Self-service may edit presentation/contact fields and password-change state only.
 if (to_jsonb(new)-array['full_name','avatar_url','avatar_path','photo_url','phone','updated_at','must_change_password','password_changed_at'])
    is distinct from
    (to_jsonb(old)-array['full_name','avatar_url','avatar_path','photo_url','phone','updated_at','must_change_password','password_changed_at']) then
   raise exception 'Only Admin can change role, status or student links' using errcode='42501';
 end if;
 return new;
end $$;
do $$ begin
 if not exists(select 1 from pg_trigger where tgrelid='public.profiles'::regclass and tgname='v642_guard_profile_update') then
  create trigger v642_guard_profile_update before update on public.profiles
  for each row execute function public.v642_guard_profile_update();
 end if;
end $$;

-- supabase-v64-3-teacher-assignments.sql
-- Atomic teacher responsibility changes; service role only after API checks.
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

-- supabase-v64-3-handover.sql
-- Atomic teacher relief / handover. No teacher, salary, attendance or student is deleted.
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
