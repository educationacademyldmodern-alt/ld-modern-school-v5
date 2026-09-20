-- V64.2 additive guard. Run AFTER existing V64 migration; no existing policy is removed.
-- Requires existing public.profiles and public.my_role(). Transaction rolls back on failure.
begin;
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
commit;
