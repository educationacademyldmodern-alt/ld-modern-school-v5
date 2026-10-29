-- V491 root fixes: assignment-scoped attendance/follow-up and central Parent fee due.
-- Additive, rerunnable. Does not delete or rewrite historical student/fee records.
begin;
create or replace function public.ldm_v491_absence_list(p_session text,p_asof date,p_include_today_pending boolean default true,p_class text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_role text; v_start date; v_first date; v_end date; v_today date:=(now() at time zone 'Asia/Kolkata')::date;
 v_rows jsonb; v_classes jsonb; v_overrides jsonb:='{}'; v_conflict_date date; v_resolutions jsonb; v_resolution jsonb; v_adm text; v_status text; v_allowed text[]; v_adms text[];
begin
 select lower(role) into v_role from public.profiles where id=auth.uid() and lower(coalesce(status,'active'))='active';
 if auth.uid() is null or v_role is null or v_role not in ('admin','super_admin','principal','teacher') then raise exception 'Active Admin or assigned Teacher required' using errcode='42501';end if;
 select coalesce(array_agg(distinct public.ldm_v307_class(a.class_name)),array[]::text[]) into v_allowed
 from teacher_profiles t join teacher_class_assignments a on a.teacher_profile_id=t.id
 where t.auth_user_id=auth.uid() and lower(t.approval_status)='approved' and coalesce(t.is_active,true)
 and lower(coalesce(to_jsonb(t)->>'status','active'))='active' and a.is_active=true and a.academic_session=p_session;
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

create or replace function public.ldm_v491_absence_classes(p_session text)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_role text; result jsonb;
begin
 select lower(role) into v_role from profiles where id=auth.uid() and lower(coalesce(status,'active'))='active';
 if v_role is null or v_role not in ('admin','super_admin','principal','teacher') then raise exception 'Active Admin or assigned Teacher required' using errcode='42501';end if;
 if v_role='teacher' then
 select coalesce(jsonb_agg(c.class_name),'[]') into result from (select distinct a.class_name from teacher_profiles t join teacher_class_assignments a on a.teacher_profile_id=t.id where t.auth_user_id=auth.uid() and lower(t.approval_status)='approved' and coalesce(t.is_active,true) and lower(coalesce(to_jsonb(t)->>'status','active'))='active' and a.is_active=true and a.academic_session=p_session) c;
 else
 select jsonb_agg(c.class_name order by c.n,c.class_name) into result from (select distinct on(class_name) class_name,n from (select unnest(array['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10']) class_name,generate_series(1,13) n union all select distinct case when public.ldm_v307_class(class_name)='NURSERY' then 'Nursery' else public.ldm_v307_class(class_name) end,100 from students where coalesce(class_name,'')<>'') x order by class_name,n) c;
 end if;return result;
end $$;

create or replace function public.ldm_v491_teacher_attendance_save(p_class text,p_date date,p_session text,p_rows jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare v_role text; v_start date; v_written integer;
begin
 select lower(coalesce(role,'')) into v_role from public.profiles where id=auth.uid() and lower(coalesce(status,'active'))='active';
 if auth.uid() is null or v_role is null or v_role not in ('admin','super_admin','principal','teacher') then raise exception 'Active school account required' using errcode='42501';end if;
 if p_class is null or btrim(p_class)='' or p_date is null or p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)<1 or jsonb_array_length(p_rows)>600 then raise exception 'Valid class, date and 1–600 attendance rows required';end if;
 if v_role='teacher' and (p_session is null or p_session !~ '^\d{4}-\d{2}$' or not exists(
   select 1 from public.teacher_profiles t join public.teacher_class_assignments a on a.teacher_profile_id=t.id
   where t.auth_user_id=auth.uid() and lower(t.approval_status)='approved' and coalesce(t.is_active,true)
     and lower(coalesce(to_jsonb(t)->>'status','active'))='active' and a.is_active=true
     and a.academic_session=p_session and public.ldm_v307_class(a.class_name)=public.ldm_v307_class(p_class)
 )) then raise exception 'Only your assigned class and session can be marked' using errcode='42501';end if;
 if v_role='teacher' then
   v_start:=make_date(split_part(p_session,'-',1)::integer,4,1);
   if split_part(p_session,'-',2)::integer<>mod(split_part(p_session,'-',1)::integer+1,100) or p_date<v_start or p_date>=(v_start+interval '1 year')::date then
     raise exception 'Attendance date must be within the assigned academic session';
   end if;
 end if;
 if exists(select 1 from jsonb_array_elements(p_rows) x group by x->>'admission_no' having count(*)>1) then raise exception 'Duplicate student in attendance request';end if;
 if exists(select 1 from jsonb_array_elements(p_rows) x where coalesce(x->>'admission_no','')='' or coalesce(x->>'status','') not in ('Present','Absent','Leave','Not Marked')) then raise exception 'Invalid student or attendance status';end if;
 if exists(select 1 from jsonb_array_elements(p_rows) x where not exists(
   select 1 from public.students s where s.admission_no=x->>'admission_no'
    and public.ldm_v307_class(s.class_name)=public.ldm_v307_class(p_class)
    and lower(btrim(coalesce(s.status,'active'))) not in ('inactive','deleted','trashed','recycled','archived','left','withdrawn','transferred')
 )) then raise exception 'One or more students are outside the selected active class' using errcode='42501';end if;
 insert into public.attendance(date,student_name,admission_no,class_name,section,status,remark)
 select p_date,coalesce(s.student_name,''),s.admission_no,s.class_name,coalesce(s.section,''),x->>'status',left(coalesce(x->>'remark','Assigned teacher attendance'),200)
 from jsonb_array_elements(p_rows) x join public.students s on s.admission_no=x->>'admission_no'
 where public.ldm_v307_class(s.class_name)=public.ldm_v307_class(p_class)
 on conflict(date,admission_no) do update set student_name=excluded.student_name,class_name=excluded.class_name,section=excluded.section,status=excluded.status,remark=excluded.remark;
 get diagnostics v_written=row_count;
 return jsonb_build_object('saved',v_written,'class',p_class,'date',p_date);
end $$;

revoke all on function public.ldm_v491_teacher_attendance_save(text,date,text,jsonb) from public,anon;
grant execute on function public.ldm_v491_teacher_attendance_save(text,date,text,jsonb) to authenticated;

-- Keep the existing V466 RPC intact. A new V491 RPC avoids altering its
-- argument defaults or dependencies and requires no DROP operation.
create or replace function public.ldm_v491_parent_fee_due(p_session text)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp set row_security=off as $$
declare v_profile jsonb; v_role text; v_email text; v_link text; v_until text; v_items jsonb:='[]'::jsonb; v_row record; v_snap jsonb; v_fee jsonb; v_verified boolean; v_due numeric;
begin
 if auth.uid() is null then raise exception 'Login required' using errcode='42501';end if;
 select to_jsonb(p),lower(coalesce(p.role,'')),lower(trim(coalesce(auth.jwt()->>'email',''))),coalesce(p.linked_admission_no,'')
 into v_profile,v_role,v_email,v_link from public.profiles p where p.id=auth.uid() and lower(coalesce(p.status,'active'))='active';
 if v_role not in ('parent','student') then raise exception 'Active Parent / Student account required' using errcode='42501';end if;
 if p_session is null or p_session !~ '^\d{4}-\d{2}$' then raise exception 'Valid academic session required';end if;
 v_until:=to_char(now() at time zone 'Asia/Kolkata','YYYY-MM');
 if to_regprocedure('public.ldm_fee_due_snapshot_v2(text,text[],text)') is null then raise exception 'Central fee snapshot service is not installed';end if;
 for v_row in select s.admission_no from public.students s
   where (v_link<>'' and s.admission_no=v_link) or (v_role='parent' and v_email<>'' and lower(trim(coalesce(s.parent_email,'')))=v_email)
   order by s.class_name,s.student_name
 loop
   perform public.v643_parent_student(v_row.admission_no);
   execute 'select to_jsonb(x) from public.ldm_fee_due_snapshot_v2(p_session=>$1,p_admission_nos=>$2,p_until_month=>$3) x limit 1'
     into v_snap using p_session,array[v_row.admission_no],v_until;
   v_verified:=v_snap is not null and coalesce(v_snap->>'current_due','')<>'' and (v_snap->>'current_due') ~ '^-?[0-9]+(\.[0-9]+)?$';
   v_due:=case when v_verified then greatest((v_snap->>'current_due')::numeric,0) else null end;
   v_fee:=jsonb_build_object('verified',v_verified,'due',v_due,'paid',null,'academic_session',p_session,'until_month',v_until);
   v_items:=v_items||jsonb_build_array(jsonb_build_object('admission_no',v_row.admission_no,'fee',v_fee));
 end loop;
 return jsonb_build_object('fee_context',jsonb_build_object('session',p_session,'until_month',v_until,'verified',jsonb_array_length(v_items)>0 and not exists(select 1 from jsonb_array_elements(v_items) x where coalesce(x->'fee'->>'verified','false')<>'true')),'students',v_items);
end $$;
revoke all on function public.ldm_v491_absence_list(text,date,boolean,text),public.ldm_v491_absence_classes(text) from public,anon;
grant execute on function public.ldm_v491_absence_list(text,date,boolean,text),public.ldm_v491_absence_classes(text) to authenticated;
revoke all on function public.ldm_v491_parent_fee_due(text) from public,anon;
grant execute on function public.ldm_v491_parent_fee_due(text) to authenticated;

commit;
notify pgrst,'reload schema';
