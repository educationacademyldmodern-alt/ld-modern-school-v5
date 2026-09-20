-- V64.3 Parent actions + recursion-safe role helpers. Existing records retained.
-- Run as database owner in Supabase SQL Editor, after backup. Transactional and rerunnable.
begin;
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
commit;
notify pgrst,'reload schema';
