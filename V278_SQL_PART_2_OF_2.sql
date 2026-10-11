-- V278 PART 2 OF 2 — run only after PART 1 succeeds
begin;

-- ---------- Canonical admin create (repairs old V187 limited route whitelist) ----------
create or replace function public.ldm_create_work_task(
 p_title text,p_details text default '',p_module_route text default null,
 p_priority text default 'Normal',p_due_date date default null,p_assignees jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare v_task_id uuid; r record; v_role text; v_count integer:=0; v_route text;
begin
 if not public.ldm_v187_is_admin() then raise exception 'Admin / Principal only'; end if;
 if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'Task title required'; end if;
 if coalesce(jsonb_typeof(p_assignees),'')<>'array' then raise exception 'Assignee list must be an array'; end if;
 v_route:=nullif(btrim(coalesce(p_module_route,'')),'');
 if v_route is not null and not public.ldm_v278_route_ready(v_route) then
   raise exception 'This ERP route is not delegation-ready: %',v_route;
 end if;
 select count(*) into v_count from jsonb_to_recordset(p_assignees)
  as x(teacher_auth_user_id uuid,teacher_profile_id text,teacher_name text,responsibility text)
  where x.teacher_auth_user_id is not null;
 if v_count=0 then raise exception 'कम से कम एक mapped teacher चुनें'; end if;
 p_priority:=case when p_priority in ('Low','Normal','High','Urgent') then p_priority else 'Normal' end;

 insert into public.ldm_work_tasks(title,details,module_route,priority,work_date,due_date,status,is_active,created_by)
 values(btrim(p_title),coalesce(p_details,''),v_route,p_priority,public.ldm_v278_india_date(),p_due_date,'assigned',true,auth.uid())
 returning id into v_task_id;

 for r in select * from jsonb_to_recordset(p_assignees)
  as x(teacher_auth_user_id uuid,teacher_profile_id text,teacher_name text,responsibility text)
 loop
   if r.teacher_auth_user_id is null then continue; end if;
   v_role:=case when r.responsibility='primary' then 'primary' else 'assistant' end;
   insert into public.ldm_work_task_assignees(
    task_id,teacher_auth_user_id,teacher_profile_id,teacher_name,responsibility,status,is_active,assigned_by
   ) values(
    v_task_id,r.teacher_auth_user_id,r.teacher_profile_id,
    coalesce(nullif(btrim(r.teacher_name),''),'Teacher'),v_role,'assigned',true,auth.uid()
   )
   on conflict(task_id,teacher_auth_user_id) do update set
    teacher_profile_id=excluded.teacher_profile_id,teacher_name=excluded.teacher_name,
    responsibility=excluded.responsibility,status='assigned',is_active=true,updated_at=now();
 end loop;

 insert into public.ldm_work_task_events(task_id,actor_user_id,actor_role,event_type,note)
 values(v_task_id,auth.uid(),'admin','created','Task created');
 return v_task_id;
end;
$$;

create or replace function public.ldm_admin_update_work_task(
 p_task_id uuid,p_title text,p_details text default '',p_module_route text default null,
 p_priority text default 'Normal',p_due_date date default null,p_status text default 'assigned'
)
returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare v_route text;
begin
 if not public.ldm_v187_is_admin() then raise exception 'Admin / Principal only'; end if;
 if nullif(btrim(coalesce(p_title,'')),'') is null then raise exception 'Task title required'; end if;
 v_route:=nullif(btrim(coalesce(p_module_route,'')),'');
 if v_route is not null and not public.ldm_v278_route_ready(v_route) then
   raise exception 'This ERP route is not delegation-ready: %',v_route;
 end if;
 p_priority:=case when p_priority in ('Low','Normal','High','Urgent') then p_priority else 'Normal' end;
 p_status:=case when p_status in ('assigned','in_progress','submitted','completed','cancelled') then p_status else 'assigned' end;
 update public.ldm_work_tasks set
  title=btrim(p_title),details=coalesce(p_details,''),module_route=v_route,
  priority=p_priority,due_date=p_due_date,status=p_status,
  is_active=(p_status not in ('cancelled','completed')),updated_at=now()
 where id=p_task_id;
 if not found then raise exception 'Task not found'; end if;
 insert into public.ldm_work_task_events(task_id,actor_user_id,actor_role,event_type,note)
 values(p_task_id,auth.uid(),'admin','task_updated','Status: '||p_status);
 return true;
end;
$$;

create or replace function public.ldm_admin_set_task_team(p_task_id uuid,p_assignees jsonb)
returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare r record; v_role text; v_count integer:=0;
begin
 if not public.ldm_v187_is_admin() then raise exception 'Admin / Principal only'; end if;
 if not exists(select 1 from public.ldm_work_tasks where id=p_task_id) then raise exception 'Task not found'; end if;
 if coalesce(jsonb_typeof(p_assignees),'')<>'array' then raise exception 'Assignee list must be an array'; end if;
 select count(*) into v_count from jsonb_to_recordset(p_assignees)
  as x(teacher_auth_user_id uuid,teacher_profile_id text,teacher_name text,responsibility text)
 where x.teacher_auth_user_id is not null;
 if v_count=0 then raise exception 'कम से कम एक mapped teacher रखें'; end if;

 update public.ldm_work_task_assignees a set is_active=false,status='removed',updated_at=now()
 where a.task_id=p_task_id and not exists(
  select 1 from jsonb_to_recordset(p_assignees)
   as x(teacher_auth_user_id uuid,teacher_profile_id text,teacher_name text,responsibility text)
  where x.teacher_auth_user_id=a.teacher_auth_user_id
 );

 for r in select * from jsonb_to_recordset(p_assignees)
  as x(teacher_auth_user_id uuid,teacher_profile_id text,teacher_name text,responsibility text)
 loop
  if r.teacher_auth_user_id is null then continue; end if;
  v_role:=case when r.responsibility='primary' then 'primary' else 'assistant' end;
  insert into public.ldm_work_task_assignees(
   task_id,teacher_auth_user_id,teacher_profile_id,teacher_name,responsibility,status,is_active,assigned_by
  ) values(
   p_task_id,r.teacher_auth_user_id,r.teacher_profile_id,
   coalesce(nullif(btrim(r.teacher_name),''),'Teacher'),v_role,'assigned',true,auth.uid()
  )
  on conflict(task_id,teacher_auth_user_id) do update set
   teacher_profile_id=excluded.teacher_profile_id,teacher_name=excluded.teacher_name,
   responsibility=excluded.responsibility,
   status=case when public.ldm_work_task_assignees.status='removed' then 'assigned' else public.ldm_work_task_assignees.status end,
   is_active=true,updated_at=now();
 end loop;

 insert into public.ldm_work_task_events(task_id,actor_user_id,actor_role,event_type,note)
 values(p_task_id,auth.uid(),'admin','team_updated','Assigned team updated');
 return true;
end;
$$;

-- ---------- V272/V278 frontend RPCs, now self-contained ----------
create or replace function public.ldm_v272_create_work_task(
 p_title text,p_details text default '',p_module_route text default null,
 p_priority text default 'Normal',p_work_date date default null,p_due_date date default null,
 p_assignees jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare v_id uuid;
begin
 v_id:=public.ldm_create_work_task(p_title,p_details,p_module_route,p_priority,p_due_date,p_assignees);
 update public.ldm_work_tasks
 set work_date=coalesce(p_work_date,public.ldm_v278_india_date()),updated_at=now()
 where id=v_id;
 return v_id;
end;
$$;

create or replace function public.ldm_v272_update_work_task(
 p_task_id uuid,p_title text,p_details text default '',p_module_route text default null,
 p_priority text default 'Normal',p_work_date date default null,p_due_date date default null,
 p_status text default 'assigned'
)
returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
 perform public.ldm_admin_update_work_task(p_task_id,p_title,p_details,p_module_route,p_priority,p_due_date,p_status);
 update public.ldm_work_tasks set
  work_date=coalesce(p_work_date,work_date,public.ldm_v278_india_date()),updated_at=now()
 where id=p_task_id;
 return true;
end;
$$;

create or replace function public.ldm_v272_has_delegated_route(p_route text)
returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
 select public.ldm_v278_route_ready(p_route) and exists(
  select 1 from public.ldm_work_task_assignees a
  join public.ldm_work_tasks t on t.id=a.task_id
  where a.teacher_auth_user_id=auth.uid()
    and a.is_active is true
    and lower(coalesce(a.status,'assigned')) not in ('removed','completed')
    and t.is_active is true
    and lower(coalesce(t.status,'assigned')) not in ('cancelled','completed')
    and btrim(coalesce(t.module_route,''))=btrim(coalesce(p_route,''))
    and coalesce(t.work_date,public.ldm_v278_india_date())<=public.ldm_v278_india_date()
 )
$$;

create or replace function public.ldm_v272_my_assignment_for_route(p_route text)
returns uuid
language sql
stable
security definer
set search_path=public,pg_temp
as $$
 select a.id from public.ldm_work_task_assignees a
 join public.ldm_work_tasks t on t.id=a.task_id
 where a.teacher_auth_user_id=auth.uid()
   and a.is_active is true
   and lower(coalesce(a.status,'assigned')) not in ('removed','completed')
   and t.is_active is true
   and lower(coalesce(t.status,'assigned')) not in ('cancelled','completed')
   and public.ldm_v278_route_ready(t.module_route)
   and btrim(coalesce(t.module_route,''))=btrim(coalesce(p_route,''))
   and coalesce(t.work_date,public.ldm_v278_india_date())<=public.ldm_v278_india_date()
 order by a.assigned_at desc limit 1
$$;

create or replace function public.ldm_v272_validate_delegated_route(p_assignment_id uuid,p_route text)
returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
 select exists(
  select 1 from public.ldm_work_task_assignees a
  join public.ldm_work_tasks t on t.id=a.task_id
  where a.id=p_assignment_id
    and a.teacher_auth_user_id=auth.uid()
    and a.is_active is true
    and lower(coalesce(a.status,'assigned')) not in ('removed','completed')
    and t.is_active is true
    and lower(coalesce(t.status,'assigned')) not in ('cancelled','completed')
    and public.ldm_v278_route_ready(t.module_route)
    and btrim(coalesce(t.module_route,''))=btrim(coalesce(p_route,''))
    and coalesce(t.work_date,public.ldm_v278_india_date())<=public.ldm_v278_india_date()
 )
$$;

create or replace function public.ldm_teacher_update_task_assignment(
 p_assignment_id uuid,p_status text,p_note text default ''
)
returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare v_task uuid; v_remaining integer;
begin
 if p_status not in ('in_progress','submitted','completed') then raise exception 'Invalid task status'; end if;
 select a.task_id into v_task
 from public.ldm_work_task_assignees a join public.ldm_work_tasks t on t.id=a.task_id
 where a.id=p_assignment_id
   and a.teacher_auth_user_id=auth.uid()
   and a.is_active=true
   and lower(coalesce(a.status,'assigned')) not in ('removed','completed')
   and t.is_active=true
   and lower(coalesce(t.status,'assigned')) not in ('cancelled','completed')
   and coalesce(t.work_date,public.ldm_v278_india_date())<=public.ldm_v278_india_date();
 if v_task is null then raise exception 'Active assignment not found or Work Date has not started'; end if;

 update public.ldm_work_task_assignees set
  status=p_status,teacher_note=coalesce(p_note,''),
  started_at=case when p_status='in_progress' and started_at is null then now() else started_at end,
  submitted_at=case when p_status='submitted' then now() else submitted_at end,
  completed_at=case when p_status='completed' then now() else completed_at end,
  updated_at=now()
 where id=p_assignment_id;

 if p_status in ('in_progress','submitted') then
  update public.ldm_work_tasks set status='in_progress',updated_at=now()
  where id=v_task and status='assigned';
 end if;

 select count(*) into v_remaining from public.ldm_work_task_assignees
 where task_id=v_task and is_active=true and lower(coalesce(status,'assigned')) not in ('removed','completed');
 if v_remaining=0 then
  update public.ldm_work_tasks set status='completed',is_active=false,updated_at=now() where id=v_task;
 end if;

 insert into public.ldm_work_task_events(task_id,assignment_id,actor_user_id,actor_role,event_type,note)
 values(v_task,p_assignment_id,auth.uid(),'teacher',p_status,coalesce(p_note,''));
 return true;
end;
$$;

-- ---------- Grants ----------
revoke all on function public.ldm_create_work_task(text,text,text,text,date,jsonb) from public;
revoke all on function public.ldm_admin_update_work_task(uuid,text,text,text,text,date,text) from public;
revoke all on function public.ldm_admin_set_task_team(uuid,jsonb) from public;
revoke all on function public.ldm_v272_create_work_task(text,text,text,text,date,date,jsonb) from public;
revoke all on function public.ldm_v272_update_work_task(uuid,text,text,text,text,date,date,text) from public;
revoke all on function public.ldm_v272_has_delegated_route(text) from public;
revoke all on function public.ldm_v272_my_assignment_for_route(text) from public;
revoke all on function public.ldm_v272_validate_delegated_route(uuid,text) from public;
revoke all on function public.ldm_teacher_update_task_assignment(uuid,text,text) from public;

grant execute on function public.ldm_create_work_task(text,text,text,text,date,jsonb) to authenticated;
grant execute on function public.ldm_admin_update_work_task(uuid,text,text,text,text,date,text) to authenticated;
grant execute on function public.ldm_admin_set_task_team(uuid,jsonb) to authenticated;
grant execute on function public.ldm_v272_create_work_task(text,text,text,text,date,date,jsonb) to authenticated;
grant execute on function public.ldm_v272_update_work_task(uuid,text,text,text,text,date,date,text) to authenticated;
grant execute on function public.ldm_v272_has_delegated_route(text) to authenticated;
grant execute on function public.ldm_v272_my_assignment_for_route(text) to authenticated;
grant execute on function public.ldm_v272_validate_delegated_route(uuid,text) to authenticated;
grant execute on function public.ldm_teacher_update_task_assignment(uuid,text,text) to authenticated;

-- ---------- Program/Tour exact-route delegation ----------
do $$
begin
 if to_regclass('public.v66_programs') is not null then
  execute 'alter table public.v66_programs enable row level security';
  execute 'grant select,insert,update,delete on public.v66_programs to authenticated';
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_programs' and policyname='v272_program_delegate_select') then
    execute $p$create policy v272_program_delegate_select on public.v66_programs for select to authenticated using(public.ldm_v272_has_delegated_route('v66_programs'))$p$;
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_programs' and policyname='v272_program_delegate_insert') then
    execute $p$create policy v272_program_delegate_insert on public.v66_programs for insert to authenticated with check(public.ldm_v272_has_delegated_route('v66_programs'))$p$;
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_programs' and policyname='v272_program_delegate_update') then
    execute $p$create policy v272_program_delegate_update on public.v66_programs for update to authenticated using(public.ldm_v272_has_delegated_route('v66_programs')) with check(public.ldm_v272_has_delegated_route('v66_programs'))$p$;
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_programs' and policyname='v272_program_delegate_delete') then
    execute $p$create policy v272_program_delegate_delete on public.v66_programs for delete to authenticated using(public.ldm_v272_has_delegated_route('v66_programs'))$p$;
  end if;
 end if;

 if to_regclass('public.v66_program_participants') is not null then
  execute 'alter table public.v66_program_participants enable row level security';
  execute 'grant select,insert,update,delete on public.v66_program_participants to authenticated';
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_program_participants' and policyname='v272_program_part_delegate_select') then
    execute $p$create policy v272_program_part_delegate_select on public.v66_program_participants for select to authenticated using(public.ldm_v272_has_delegated_route('v66_programs'))$p$;
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_program_participants' and policyname='v272_program_part_delegate_insert') then
    execute $p$create policy v272_program_part_delegate_insert on public.v66_program_participants for insert to authenticated with check(public.ldm_v272_has_delegated_route('v66_programs'))$p$;
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_program_participants' and policyname='v272_program_part_delegate_update') then
    execute $p$create policy v272_program_part_delegate_update on public.v66_program_participants for update to authenticated using(public.ldm_v272_has_delegated_route('v66_programs')) with check(public.ldm_v272_has_delegated_route('v66_programs'))$p$;
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_program_participants' and policyname='v272_program_part_delegate_delete') then
    execute $p$create policy v272_program_part_delegate_delete on public.v66_program_participants for delete to authenticated using(public.ldm_v272_has_delegated_route('v66_programs'))$p$;
  end if;
 end if;
end $$;

-- Existing roster adapters (created only when referenced columns/tables exist in this ERP baseline).
create or replace function public.ldm_v272_program_students()
returns table(id uuid,admission_no text,student_name text,father_name text,phone text,class_name text,section text,roll_no text,status text)
language sql
stable
security definer
set search_path=public,pg_temp
as $$
 select s.id,s.admission_no,s.student_name,s.father_name,s.phone,s.class_name,s.section,s.roll_no::text,s.status
 from public.students s
 where public.ldm_v187_is_admin() or public.ldm_v272_has_delegated_route('v66_programs')
 order by s.class_name,s.student_name
$$;

create or replace function public.ldm_v272_program_people()
returns table(kind text,id text,name text,mobile text,designation text,employee_id text)
language plpgsql
stable
security definer
set search_path=public,pg_temp
as $$
begin
 if not(public.ldm_v187_is_admin() or public.ldm_v272_has_delegated_route('v66_programs')) then
  raise exception 'Program delegation required';
 end if;
 return query
 select 'Teacher'::text,tp.id::text,coalesce(tp.teacher_name,'')::text,coalesce(tp.mobile,'')::text,'Teacher'::text,''::text
 from public.teacher_profiles tp
 where lower(coalesce(tp.approval_status,''))='approved'
 union all
 select 'Staff'::text,st.id::text,coalesce(st.staff_name,'')::text,coalesce(st.phone,'')::text,
        coalesce(st.designation,st.staff_type,'Staff')::text,coalesce(st.employee_id,'')::text
 from public.staff st
 where lower(coalesce(st.status,'active'))='active';
end;
$$;
revoke all on function public.ldm_v272_program_students() from public;
revoke all on function public.ldm_v272_program_people() from public;
grant execute on function public.ldm_v272_program_students() to authenticated;
grant execute on function public.ldm_v272_program_people() to authenticated;

-- ---------- Health check used by Assistant Center ----------
create or replace function public.ldm_v278_delegation_health()
returns jsonb
language sql
stable
security definer
set search_path=public,pg_temp
as $$
 select jsonb_build_object(
  'ready', public.ldm_v187_is_admin(),
  'route_count', 15,
  'task_table', to_regclass('public.ldm_work_tasks') is not null,
  'assignee_table', to_regclass('public.ldm_work_task_assignees') is not null,
  'india_date', public.ldm_v278_india_date()
 )
$$;
revoke all on function public.ldm_v278_delegation_health() from public;
grant execute on function public.ldm_v278_delegation_health() to authenticated;

notify pgrst,'reload schema';
commit;

select 'V278 PART 2 READY'::text as status,
 (to_regprocedure('public.ldm_v278_delegation_health()') is not null) as health_rpc,
 (to_regprocedure('public.ldm_v272_create_work_task(text,text,text,text,date,date,jsonb)') is not null) as create_rpc,
 (to_regprocedure('public.ldm_teacher_update_task_assignment(uuid,text,text)') is not null) as teacher_update_rpc;
