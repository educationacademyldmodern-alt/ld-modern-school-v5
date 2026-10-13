-- V307: shared absence follow-up. Additive; existing attendance/calendar/roles are unchanged.
begin;

-- Only create the missing calendar; existing calendar and policies stay as they are.
do $v308_calendar$
begin
 if to_regclass('public.school_holidays') is null then
  create table public.school_holidays(
   id uuid primary key default gen_random_uuid(),holiday_date date not null unique,
   holiday_name text not null default 'Holiday',holiday_type text not null default 'School Holiday',
   is_working_day boolean not null default false,note text,created_by uuid,
   created_at timestamptz not null default now(),updated_at timestamptz not null default now());
  alter table public.school_holidays enable row level security;
  grant select,insert,update on public.school_holidays to authenticated;
  create policy ldm_v308_calendar_read on public.school_holidays for select to authenticated using(true);
  create policy ldm_v308_calendar_admin_insert on public.school_holidays for insert to authenticated
   with check(exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('admin','super_admin','principal') and lower(coalesce(p.status,'active'))='active'));
  create policy ldm_v308_calendar_admin_update on public.school_holidays for update to authenticated
   using(exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('admin','super_admin','principal') and lower(coalesce(p.status,'active'))='active'))
   with check(exists(select 1 from public.profiles p where p.id=auth.uid() and lower(p.role) in ('admin','super_admin','principal') and lower(coalesce(p.status,'active'))='active'));
 end if;
end
$v308_calendar$;
create table if not exists public.ldm_v307_absence_followups(
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null,
 academic_session text not null,
 episode_start date,
 last_absent_date date,
 absent_days integer,
 contact_result text not null,
 remark text not null default '',
 next_followup date,
 actor uuid not null,
 actor_name text not null,
 actor_role text not null,
 created_at timestamptz not null default now(),
 check(contact_result in ('Not Called','Connected','No Answer','Switched Off','Wrong Number','Callback Required','Parent Will Visit','Resolved')),
 check(length(remark)<=1500)
);
create index if not exists ldm_v307_followup_student_idx on public.ldm_v307_absence_followups(student_id,academic_session,created_at desc);
-- No FK is added to old student/user tables: their existing delete/archive lifecycle stays unchanged.
create or replace function public.ldm_v307_class(p_class text)
returns text language sql immutable set search_path=public,pg_temp as $$
 with clean as(select upper(regexp_replace(regexp_replace(btrim(coalesce(p_class,'')),'^(CLASS|STD|GRADE)[ ._-]*','','i'),'[ ._-]','','g')) n)
 select case n when 'I' then '1' when 'II' then '2' when 'III' then '3' when 'IV' then '4' when 'V' then '5' when 'VI' then '6' when 'VII' then '7' when 'VIII' then '8' when 'IX' then '9' when 'X' then '10' when 'XI' then '11' when 'XII' then '12'
 when 'NUR' then 'NURSERY' when 'NURS' then 'NURSERY' when 'LOWERKG' then 'LKG' when 'UPPERKG' then 'UKG' when 'KG1' then 'LKG' when 'KG2' then 'UKG'
 else case when n ~ '^(0?[1-9]|1[0-2])(ST|ND|RD|TH)?$' then regexp_replace(n,'(ST|ND|RD|TH)$','')::int::text else n end end from clean
$$;
create or replace function public.ldm_v307_can_access(p_student uuid,p_session text)
returns boolean language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_role text; v_class text;
begin
 select lower(role) into v_role from public.profiles where id=auth.uid() and lower(coalesce(status,'active'))='active';
 if auth.uid() is null or v_role is null then return false;end if;
 select class_name into v_class from public.students where id=p_student;
 if not found then return false;end if;
 if v_role in ('admin','super_admin','principal') then return true;end if;
 if v_role<>'teacher' then return false;end if;
 return exists(select 1 from public.teacher_profiles t join public.teacher_class_assignments a on a.teacher_profile_id=t.id
 where t.auth_user_id=auth.uid() and lower(t.approval_status)='approved' and coalesce(t.is_active,true)=true
 and lower(coalesce(to_jsonb(t)->>'status','active'))='active'
 and a.academic_session=p_session and a.is_active=true and a.is_class_teacher=true
 and public.ldm_v307_class(a.class_name)=public.ldm_v307_class(v_class));
end $$;
create or replace function public.ldm_v309_absence_list(p_session text,p_asof date,p_include_today_pending boolean default true,p_class text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_role text; v_start date; v_first date; v_end date; v_today date:=(now() at time zone 'Asia/Kolkata')::date;
 v_rows jsonb; v_classes jsonb; v_overrides jsonb:='{}'; v_conflict_date date; v_resolutions jsonb; v_resolution jsonb; v_adm text; v_status text; v_allowed text[]; v_adms text[];
begin
 select lower(role) into v_role from public.profiles where id=auth.uid() and lower(coalesce(status,'active'))='active';
 if auth.uid() is null or v_role is null or v_role not in ('admin','super_admin','principal','teacher') then raise exception 'Active Admin or Class Teacher required' using errcode='42501';end if;
 select coalesce(array_agg(distinct public.ldm_v307_class(a.class_name)),array[]::text[]) into v_allowed
 from teacher_profiles t join teacher_class_assignments a on a.teacher_profile_id=t.id
 where t.auth_user_id=auth.uid() and lower(t.approval_status)='approved' and coalesce(t.is_active,true)
 and lower(coalesce(to_jsonb(t)->>'status','active'))='active' and a.is_active=true and a.is_class_teacher=true and a.academic_session=p_session;
 if p_session is null or p_session !~ '^\d{4}-\d{2}$' or p_asof is null then raise exception 'Session and as-of date required';end if;
 v_start:=make_date(substring(p_session,1,4)::int,4,1);v_end:=(v_start+interval '1 year'-interval '1 day')::date;
 if substring(p_session,6,2)::int<>mod(substring(p_session,1,4)::int+1,100) or p_asof<v_start or p_asof>v_end or p_asof>v_today then raise exception 'As-of date must be within selected academic session and not future';end if;
 if to_regclass('public.school_holidays') is null then raise exception 'School holiday/calendar setup required; no guessed streak will be shown';end if;
 v_first:=greatest(v_start,p_asof-119);
 -- Use existing conflict-resolution service when present; unavailable conflicting days stay UNKNOWN.
 select array_agg(distinct s.admission_no) into v_adms from students s where (v_role<>'teacher' or public.ldm_v307_class(s.class_name)=any(v_allowed)) and (p_class is null or public.ldm_v307_class(s.class_name)=public.ldm_v307_class(p_class));
 if to_regprocedure('public.ldm_attendance_resolution_statuses(date,text[])') is not null then
  for v_conflict_date in select distinct z.date from (select a.date from public.attendance a join unnest(v_adms) permitted(admission_no) on permitted.admission_no=a.admission_no
   where a.date between v_first and p_asof
   group by a.date,a.admission_no having count(distinct lower(btrim(coalesce(a.status,''))))>1) z loop
   execute 'select coalesce(jsonb_agg(to_jsonb(r)),''[]''::jsonb) from public.ldm_attendance_resolution_statuses($1,$2) r'
    into v_resolutions using v_conflict_date,null::text[];
   for v_resolution in select value from jsonb_array_elements(v_resolutions) loop
    v_adm:=v_resolution->>'admission_no';v_status:=lower(btrim(coalesce(v_resolution->>'chosen_status','')));
    if v_adm is not null and v_status in ('absent','a','present','p','leave','l') then
     v_overrides:=v_overrides||jsonb_build_object(v_conflict_date::text||'|'||v_adm,v_status);
    end if;
   end loop;
  end loop;
 end if;
 with duplicate_ids as materialized (select admission_no from students group by admission_no having count(*)>1), visible as materialized (
  select s.* from public.students s where (v_role<>'teacher' or public.ldm_v307_class(s.class_name)=any(v_allowed))
   and lower(btrim(coalesce(s.status,'active'))) not in ('inactive','deleted','trashed','recycled','archived','left','withdrawn','transferred')
   and coalesce(to_jsonb(s)->>'academic_session','') in ('',p_session)
   and coalesce(btrim(s.admission_no),'')<>'' and (p_class is null or public.ldm_v307_class(s.class_name)=public.ldm_v307_class(p_class))
 ), eligible as materialized (
  select s.*,public.ldm_v307_class(s.class_name) normalized_class from visible s where not exists(select 1 from duplicate_ids x where x.admission_no=s.admission_no)
 ), days as (
  select d::date as school_date from generate_series(v_first,p_asof,interval '1 day') d
  left join public.school_holidays h on h.holiday_date=d::date
  where case when h.holiday_date is not null then h.is_working_day else extract(isodow from d)<>7 end
 ), normalized_attendance as materialized (
  select e.id,a.date,case lower(btrim(coalesce(a.status,''))) when 'a' then 'absent' when 'p' then 'present' when 'l' then 'leave' else lower(btrim(coalesce(a.status,''))) end status
  from eligible e join attendance a on a.admission_no=e.admission_no and a.date between v_first and p_asof
   and (a.class_name=e.class_name or public.ldm_v307_class(a.class_name)=e.normalized_class)
 ), aggregated_attendance as materialized (
  select id,date,case when count(distinct status)=1 then min(status) else 'conflict' end status
  from normalized_attendance group by id,date
 ), daily as (
  select e.id,d.school_date,case when v_overrides ? (d.school_date::text||'|'||e.admission_no)
   then case v_overrides->>(d.school_date::text||'|'||e.admission_no) when 'a' then 'absent' when 'p' then 'present' when 'l' then 'leave' else v_overrides->>(d.school_date::text||'|'||e.admission_no) end
   else coalesce(a.status,'unknown') end status
  from eligible e cross join days d left join aggregated_attendance a on a.id=e.id and a.date=d.school_date
 ), effective as (
  select x.* from daily x where not(p_include_today_pending and p_asof=v_today and x.school_date=p_asof and x.status in ('unknown',''))
 ), numbered as (
  select e.*,sum(case when status='absent' then 0 else 1 end) over(partition by id order by school_date desc) breaks from effective e
 ), streaks as (
  select id,count(*)::int absent_days,min(school_date) episode_start,max(school_date) last_absent_date,min(school_date)=(select min(school_date) from days) window_limited
  from numbered where breaks=0 and status='absent' group by id having count(*)>=4
 ), joined as (
  select s.id student_id,s.student_name,s.father_name,s.admission_no,s.class_name,s.section,s.roll_no,s.phone,
   st.absent_days,st.episode_start,st.last_absent_date,st.window_limited,
   coalesce(today_status.status,'holiday') as_of_status,
   (select jsonb_build_object('id',f.id,'contact_result',f.contact_result,'remark',f.remark,'next_followup',f.next_followup,'actor_name',f.actor_name,'actor_role',f.actor_role,'created_at',f.created_at)
    from public.ldm_v307_absence_followups f where f.student_id=s.id and f.academic_session=p_session
    order by f.created_at desc,f.id desc limit 1) latest_followup
  from eligible s join streaks st on st.id=s.id left join daily today_status on today_status.id=s.id and today_status.school_date=p_asof
 ) select coalesce(jsonb_agg(to_jsonb(j) order by absent_days desc,class_name,student_name),'[]') into v_rows from joined j;
 select coalesce(jsonb_agg(x.class_name),'[]') into v_classes from (select distinct s.class_name from public.students s where (v_role<>'teacher' or public.ldm_v307_class(s.class_name)=any(v_allowed))) x;
 return jsonb_build_object('rows',v_rows,'classes',v_classes,'asof',p_asof,'window_start',v_first,'minimum_days',4,'calendar_entries',(select count(*) from public.school_holidays where holiday_date between v_first and p_asof),
  'calendar_rule','Sundays and configured non-working holidays excluded; configured working Sundays included',
  'note','Present/Leave/missing/conflicting school-day records break a streak. Today unmarked may show confirmed streak through previous school day, labelled pending. Remarks never change attendance.');
end $$;
create or replace function public.ldm_v307_absence_list(p_session text,p_asof date,p_include_today_pending boolean default true)
returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select public.ldm_v309_absence_list(p_session,p_asof,p_include_today_pending,null)
$$;
create or replace function public.ldm_v307_followup_save(p_student uuid,p_session text,p_episode_start date,p_last_absent date,p_days integer,p_result text,p_remark text,p_next date default null,p_request uuid default gen_random_uuid())
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.profiles%rowtype; result public.ldm_v307_absence_followups%rowtype;
begin
 if not public.ldm_v307_can_access(p_student,p_session) then raise exception 'Class Teacher assignment or Admin access required' using errcode='42501';end if;
 if p_session is null or p_session !~ '^\d{4}-\d{2}$' or p_result is null or p_result not in ('Not Called','Connected','No Answer','Switched Off','Wrong Number','Callback Required','Parent Will Visit','Resolved')
 or length(coalesce(p_remark,''))>1500 or (p_result='Not Called' and btrim(coalesce(p_remark,''))='')
 or p_days is null or p_days<4 or p_episode_start is null or p_last_absent is null or p_episode_start>p_last_absent
 or p_last_absent>(now() at time zone 'Asia/Kolkata')::date or p_request is null then raise exception 'Valid streak context, contact result and/or remark required';end if;
 select * into strict p from public.profiles where id=auth.uid();
 -- Client keeps one request UUID across network retries. No duplicate follow-up entries.
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,307));
 select * into result from public.ldm_v307_absence_followups where id=p_request;
 if found then
  if result.actor<>auth.uid() or result.student_id<>p_student or result.academic_session<>p_session or result.episode_start is distinct from p_episode_start or result.last_absent_date is distinct from p_last_absent or result.absent_days is distinct from p_days or result.contact_result<>p_result or result.remark<>btrim(coalesce(p_remark,'')) or result.next_followup is distinct from p_next then raise exception 'Follow-up request already used for another entry';end if;
  return to_jsonb(result);
 end if;
 insert into public.ldm_v307_absence_followups(id,student_id,academic_session,episode_start,last_absent_date,absent_days,contact_result,remark,next_followup,actor,actor_name,actor_role)
 values(p_request,p_student,p_session,p_episode_start,p_last_absent,p_days,p_result,btrim(coalesce(p_remark,'')),p_next,auth.uid(),coalesce(p.full_name,'User'),p.role)
 returning * into result;return to_jsonb(result);
end $$;
create or replace function public.ldm_v307_followup_history(p_student uuid,p_session text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if not public.ldm_v307_can_access(p_student,p_session) then raise exception 'Not your assigned class' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc),'[]') into result from
 (select * from public.ldm_v307_absence_followups where student_id=p_student and academic_session=p_session order by created_at desc,id desc limit 100) x;
 return result;
end $$;
alter table public.ldm_v307_absence_followups enable row level security;
revoke all on public.ldm_v307_absence_followups from anon,authenticated;
grant select on public.ldm_v307_absence_followups to authenticated;
-- Add this feature's read policy only when absent. Preserve it on re-run.
do $v307_policy$
begin
 if not exists(select 1 from pg_policies where schemaname='public'
  and tablename='ldm_v307_absence_followups' and policyname='ldm_v307_followup_read') then
  create policy ldm_v307_followup_read on public.ldm_v307_absence_followups
   for select to authenticated using(public.ldm_v307_can_access(student_id,academic_session));
 end if;
end
$v307_policy$;
revoke all on function public.ldm_v307_class(text),public.ldm_v307_can_access(uuid,text),public.ldm_v307_absence_list(text,date,boolean),public.ldm_v307_followup_save(uuid,text,date,date,integer,text,text,date,uuid),public.ldm_v307_followup_history(uuid,text) from public,anon;
grant execute on function public.ldm_v307_class(text),public.ldm_v307_can_access(uuid,text),public.ldm_v307_absence_list(text,date,boolean),public.ldm_v307_followup_save(uuid,text,date,date,integer,text,text,date,uuid),public.ldm_v307_followup_history(uuid,text) to authenticated;
create or replace function public.ldm_v309_absence_classes(p_session text)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_role text; result jsonb;
begin
 select lower(role) into v_role from profiles where id=auth.uid() and lower(coalesce(status,'active'))='active';
 if v_role is null or v_role not in ('admin','super_admin','principal','teacher') then raise exception 'Active Admin or Class Teacher required' using errcode='42501';end if;
 if v_role='teacher' then
 select coalesce(jsonb_agg(c.class_name),'[]') into result from (select distinct a.class_name from teacher_profiles t join teacher_class_assignments a on a.teacher_profile_id=t.id where t.auth_user_id=auth.uid() and lower(t.approval_status)='approved' and coalesce(t.is_active,true) and lower(coalesce(to_jsonb(t)->>'status','active'))='active' and a.is_active=true and a.is_class_teacher=true and a.academic_session=p_session) c;
 else
 select jsonb_agg(c.class_name order by c.n,c.class_name) into result from (select distinct on(class_name) class_name,n from (select unnest(array['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10']) class_name,generate_series(1,13) n union all select distinct case when public.ldm_v307_class(class_name)='NURSERY' then 'Nursery' else public.ldm_v307_class(class_name) end,100 from students where coalesce(class_name,'')<>'') x order by class_name,n) c;
 end if;return result;
end $$;
revoke all on function public.ldm_v309_absence_classes(text),public.ldm_v309_absence_list(text,date,boolean,text) from public,anon;
grant execute on function public.ldm_v309_absence_classes(text),public.ldm_v309_absence_list(text,date,boolean,text) to authenticated;
create index if not exists ldm_v309_attendance_adm_date_idx on public.attendance(admission_no,date);
commit;
notify pgrst,'reload schema';
