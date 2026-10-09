-- L D MODERN EDUCATION ACADEMY — V273 PART 2 OF 2
-- Run only after PART 1 succeeds. Safe to re-run.
begin;

-- ------------------------------------------------
-- Program / Tour Register delegated operation
-- Exact active v66_programs assignment only.
-- ------------------------------------------------
do $$
begin
 if to_regclass('public.v66_programs') is not null then
   execute 'alter table public.v66_programs enable row level security';
   execute 'grant select,insert,update,delete on public.v66_programs to authenticated';
   if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_programs' and policyname='v272_program_delegate_select') then
     execute $p$create policy v272_program_delegate_select on public.v66_programs for select to authenticated using (public.ldm_v272_has_delegated_route('v66_programs'))$p$;
   end if;
   if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_programs' and policyname='v272_program_delegate_insert') then
     execute $p$create policy v272_program_delegate_insert on public.v66_programs for insert to authenticated with check (public.ldm_v272_has_delegated_route('v66_programs'))$p$;
   end if;
   if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_programs' and policyname='v272_program_delegate_update') then
     execute $p$create policy v272_program_delegate_update on public.v66_programs for update to authenticated using (public.ldm_v272_has_delegated_route('v66_programs')) with check (public.ldm_v272_has_delegated_route('v66_programs'))$p$;
   end if;
   if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_programs' and policyname='v272_program_delegate_delete') then
     execute $p$create policy v272_program_delegate_delete on public.v66_programs for delete to authenticated using (public.ldm_v272_has_delegated_route('v66_programs'))$p$;
   end if;
 end if;

 if to_regclass('public.v66_program_participants') is not null then
   execute 'alter table public.v66_program_participants enable row level security';
   execute 'grant select,insert,update,delete on public.v66_program_participants to authenticated';
   if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_program_participants' and policyname='v272_program_part_delegate_select') then
     execute $p$create policy v272_program_part_delegate_select on public.v66_program_participants for select to authenticated using (public.ldm_v272_has_delegated_route('v66_programs'))$p$;
   end if;
   if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_program_participants' and policyname='v272_program_part_delegate_insert') then
     execute $p$create policy v272_program_part_delegate_insert on public.v66_program_participants for insert to authenticated with check (public.ldm_v272_has_delegated_route('v66_programs'))$p$;
   end if;
   if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_program_participants' and policyname='v272_program_part_delegate_update') then
     execute $p$create policy v272_program_part_delegate_update on public.v66_program_participants for update to authenticated using (public.ldm_v272_has_delegated_route('v66_programs')) with check (public.ldm_v272_has_delegated_route('v66_programs'))$p$;
   end if;
   if not exists(select 1 from pg_policies where schemaname='public' and tablename='v66_program_participants' and policyname='v272_program_part_delegate_delete') then
     execute $p$create policy v272_program_part_delegate_delete on public.v66_program_participants for delete to authenticated using (public.ldm_v272_has_delegated_route('v66_programs'))$p$;
   end if;
 end if;
end $$;

-- Limited roster RPCs: no broad Student/Staff table RLS is opened.
create or replace function public.ldm_v272_program_students()
returns table(
 id uuid, admission_no text, student_name text, father_name text, phone text,
 class_name text, section text, roll_no text, status text
)
language sql
stable
security definer
set search_path=public,pg_temp
as $$
 select s.id,s.admission_no,s.student_name,s.father_name,s.phone,s.class_name,s.section,s.roll_no::text,s.status
 from public.students s
 where (public.ldm_v187_is_admin() or public.ldm_v272_has_delegated_route('v66_programs'))
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
 if not (public.ldm_v187_is_admin() or public.ldm_v272_has_delegated_route('v66_programs')) then
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

notify pgrst, 'reload schema';
commit;

select 'V273 PART 2 OK'::text as status,
 (to_regprocedure('public.ldm_v272_program_students()') is not null) as program_students_rpc,
 (to_regprocedure('public.ldm_v272_program_people()') is not null) as program_people_rpc;
