-- L D MODERN EDUCATION ACADEMY — V53 stability / stack-depth repair
-- Non-destructive, re-runnable. No DROP TABLE / TRUNCATE / data reset.
begin;

-- Role helpers must not re-enter profiles RLS while profiles policies are evaluating.
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path=public
set row_security=off
as $$
  select p.role from public.profiles p where p.id=auth.uid() and coalesce(p.status,'active')='active' limit 1
$$;

create or replace function public.role_in(r text[])
returns boolean
language sql
stable
security definer
set search_path=public
set row_security=off
as $$ select coalesce(public.my_role()=any(r),false) $$;

grant execute on function public.my_role() to authenticated;
grant execute on function public.role_in(text[]) to authenticated;

-- Keep RLS enabled, but do not FORCE it on the owner used by SECURITY DEFINER helpers.
do $$ begin
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles enable row level security';
    execute 'alter table public.profiles no force row level security';
  end if;
end $$;

-- Recreate profile policies in a recursion-safe form.
do $$ begin
 if to_regclass('public.profiles') is not null then
   drop policy if exists profiles_read on public.profiles;
   create policy profiles_read on public.profiles for select to authenticated
     using (id=auth.uid() or public.role_in(array['super_admin','admin','principal']));
   drop policy if exists profiles_update on public.profiles;
   create policy profiles_update on public.profiles for update to authenticated
     using (id=auth.uid() or public.role_in(array['super_admin','admin']))
     with check (id=auth.uid() or public.role_in(array['super_admin','admin']));
 end if;
end $$;

-- Ensure employee number generation remains atomic and does not recurse through staff updates.
create table if not exists public.erp_number_counters(
 kind text not null,
 academic_session text not null default '',
 last_no bigint not null default 0,
 updated_at timestamptz not null default now(),
 primary key(kind,academic_session)
);

create or replace function public.erp_next_number(p_kind text,p_session text default '2026-27',p_prefix text default null)
returns text language plpgsql security definer set search_path=public set row_security=off as $$
declare n bigint; pref text;
begin
 insert into public.erp_number_counters(kind,academic_session,last_no)
 values(p_kind,coalesce(p_session,''),1)
 on conflict(kind,academic_session) do update
 set last_no=public.erp_number_counters.last_no+1,updated_at=now()
 returning last_no into n;
 pref:=coalesce(nullif(p_prefix,''),upper(left(p_kind,3)));
 return pref||'/'||replace(coalesce(p_session,''),'/','-')||'/'||lpad(n::text,5,'0');
end $$;

-- Staff/Teacher employee ID: only fill blank IDs. Existing IDs are untouched.
create or replace function public.ld_v53_staff_employee_no()
returns trigger language plpgsql set search_path=public as $$
begin
 if coalesce(trim(new.employee_id),'')='' then
   new.employee_id:=public.erp_next_number('teacher_employee','2026-27','EMP');
 end if;
 return new;
end $$;

do $$ begin
 if to_regclass('public.staff') is not null then
   drop trigger if exists trg_ld_v53_staff_employee_no on public.staff;
   create trigger trg_ld_v53_staff_employee_no before insert on public.staff
   for each row execute function public.ld_v53_staff_employee_no();
 end if;
end $$;

commit;
