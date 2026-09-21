-- L D MODERN EDUCATION ACADEMY — V63 reliability repair
-- Re-runnable and non-destructive to production records. No table/data reset.
begin;

-- Break profiles/RLS recursion that can surface as "stack depth limit exceeded".
create or replace function public.my_role()
returns text language sql stable security definer
set search_path=public set row_security=off
as $$ select p.role from public.profiles p where p.id=auth.uid() and coalesce(p.status,'active')='active' limit 1 $$;

create or replace function public.role_in(r text[])
returns boolean language sql stable security definer
set search_path=public set row_security=off
as $$ select coalesce(public.my_role()=any(r),false) $$;

grant execute on function public.my_role() to authenticated;
grant execute on function public.role_in(text[]) to authenticated;

do $$ begin
 if to_regclass('public.profiles') is not null then
   execute 'alter table public.profiles enable row level security';
   execute 'alter table public.profiles no force row level security';
   drop policy if exists profiles_read on public.profiles;
   create policy profiles_read on public.profiles for select to authenticated using (id=auth.uid() or public.role_in(array['super_admin','admin','principal']));
   drop policy if exists profiles_update on public.profiles;
   create policy profiles_update on public.profiles for update to authenticated using (id=auth.uid() or public.role_in(array['super_admin','admin'])) with check (id=auth.uid() or public.role_in(array['super_admin','admin']));
 end if;
end $$;

-- Public Contact enquiry: allow insert only; staff/admin access remains controlled separately.
do $$ begin
 if to_regclass('public.enquiries') is not null then
   execute 'alter table public.enquiries enable row level security';
   grant insert on public.enquiries to anon, authenticated;
   drop policy if exists public_enquiry on public.enquiries;
   drop policy if exists public_insert_enquiries on public.enquiries;
   drop policy if exists enquiries_insert on public.enquiries;
   drop policy if exists enquiries_public_insert on public.enquiries;
   create policy enquiries_public_insert on public.enquiries for insert to anon, authenticated with check (true);
 end if;
end $$;
commit;
