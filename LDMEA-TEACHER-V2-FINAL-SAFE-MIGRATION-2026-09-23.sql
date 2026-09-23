-- L D MODERN EDUCATION ACADEMY — Teacher V2 Central Master
-- Fresh, idempotent, non-destructive. No DROP / TRUNCATE / production DELETE.
begin;
create extension if not exists pgcrypto;
create sequence if not exists public.teacher_v2_master_seq increment by 1 start with 1001 no cycle;
create table if not exists public.teacher_v2_master(
 id uuid primary key default gen_random_uuid(),
 teacher_profile_id uuid unique,
 auth_user_id uuid unique,
 teacher_code text unique,
 employee_id text,
 teacher_name text not null,
 mobile text,
 legacy_reference text,
 status text not null default 'Active',
 login_enabled boolean not null default true,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.teacher_v2_master add column if not exists teacher_profile_id uuid;
alter table public.teacher_v2_master add column if not exists auth_user_id uuid;
alter table public.teacher_v2_master add column if not exists teacher_code text;
alter table public.teacher_v2_master add column if not exists employee_id text;
alter table public.teacher_v2_master add column if not exists teacher_name text;
alter table public.teacher_v2_master add column if not exists mobile text;
alter table public.teacher_v2_master add column if not exists legacy_reference text;
alter table public.teacher_v2_master add column if not exists status text not null default 'Active';
alter table public.teacher_v2_master add column if not exists login_enabled boolean not null default true;
alter table public.teacher_v2_master add column if not exists is_active boolean not null default true;
alter table public.teacher_v2_master add column if not exists created_at timestamptz not null default now();
alter table public.teacher_v2_master add column if not exists updated_at timestamptz not null default now();
create unique index if not exists teacher_v2_profile_uq on public.teacher_v2_master(teacher_profile_id) where teacher_profile_id is not null;
create unique index if not exists teacher_v2_auth_uq on public.teacher_v2_master(auth_user_id) where auth_user_id is not null;
create unique index if not exists teacher_v2_code_uq on public.teacher_v2_master(teacher_code) where teacher_code is not null;
create index if not exists teacher_v2_mobile_idx on public.teacher_v2_master(mobile);

create or replace function public.teacher_v2_next_code() returns text language plpgsql as $$
declare n bigint; c text; staff_has boolean;
begin
 loop
  n:=nextval('public.teacher_v2_master_seq');
  c:='TCH-'||to_char(current_date,'YYYY')||'-'||lpad(n::text,4,'0');
  staff_has:=false;
  if to_regclass('public.staff') is not null then
    execute 'select exists(select 1 from public.staff where employee_id=$1)' into staff_has using c;
  end if;
  exit when not exists(select 1 from public.teacher_v2_master where teacher_code=c or employee_id=c) and not staff_has;
 end loop;
 return c;
end $$;

create or replace function public.teacher_v2_normalize_mobile(v text) returns text language sql immutable as $$
 select case when length(regexp_replace(coalesce(v,''),'\D','','g'))=12 and regexp_replace(coalesce(v,''),'\D','','g') like '91%' then right(regexp_replace(coalesce(v,''),'\D','','g'),10)
             when length(regexp_replace(coalesce(v,''),'\D','','g'))=10 then regexp_replace(coalesce(v,''),'\D','','g') else null end
$$;

create or replace function public.teacher_v2_defaults() returns trigger language plpgsql as $$
begin
 if new.teacher_code is null or btrim(new.teacher_code)='' then new.teacher_code:=public.teacher_v2_next_code(); end if;
 new.mobile:=public.teacher_v2_normalize_mobile(new.mobile);
 new.updated_at:=now();
 return new;
end $$;
do $$ begin
 if not exists(select 1 from pg_trigger where tgname='trg_teacher_v2_defaults') then
  create trigger trg_teacher_v2_defaults before insert or update on public.teacher_v2_master for each row execute function public.teacher_v2_defaults();
 end if;
end $$;

-- Safe migration from existing teacher_profiles. JSONB reads make optional legacy columns schema-tolerant.
do $$ declare r record; j jsonb; mob text; nm text; emp text; au uuid; st text; active boolean; begin
 if to_regclass('public.teacher_profiles') is null then raise notice 'teacher_profiles not found; V2 master created empty'; return; end if;
 for r in execute 'select id,to_jsonb(t) j from public.teacher_profiles t order by id' loop
  j:=r.j; nm:=coalesce(nullif(j->>'teacher_name',''),nullif(j->>'full_name',''),'Teacher');
  mob:=public.teacher_v2_normalize_mobile(coalesce(j->>'mobile',j->>'phone'));
  emp:=nullif(coalesce(j->>'employee_id',j->>'teacher_id'),'');
  begin au:=nullif(j->>'auth_user_id','')::uuid; exception when others then au:=null; end;
  st:=coalesce(nullif(j->>'status',''),case when lower(coalesce(j->>'approval_status',''))='approved' then 'Active' else 'Inactive' end);
  active:=coalesce((j->>'is_active')::boolean,lower(st) not in ('relieved','inactive'));
  -- If legacy duplicate profiles point to the same auth user, keep ONE central record and preserve the first profile link.
  if au is not null and exists(select 1 from public.teacher_v2_master where auth_user_id=au and teacher_profile_id is distinct from r.id) then
   update public.teacher_v2_master set teacher_name=nm,mobile=coalesce(mob,mobile),employee_id=coalesce(emp,employee_id),legacy_reference=coalesce(legacy_reference,emp),status=st,login_enabled=active,is_active=active,updated_at=now() where auth_user_id=au;
   continue;
  end if;
  insert into public.teacher_v2_master(teacher_profile_id,auth_user_id,employee_id,teacher_name,mobile,legacy_reference,status,login_enabled,is_active)
  values(r.id,au,emp,nm,mob,emp,st,active,active)
  on conflict(teacher_profile_id) do update set auth_user_id=coalesce(excluded.auth_user_id,teacher_v2_master.auth_user_id),employee_id=coalesce(excluded.employee_id,teacher_v2_master.employee_id),teacher_name=excluded.teacher_name,mobile=coalesce(excluded.mobile,teacher_v2_master.mobile),legacy_reference=coalesce(teacher_v2_master.legacy_reference,excluded.legacy_reference),status=excluded.status,login_enabled=excluded.login_enabled,is_active=excluded.is_active,updated_at=now();
 end loop;
end $$;

-- Do not allow an ambiguous active mobile login.

alter table public.teacher_v2_master enable row level security;
grant select on public.teacher_v2_master to authenticated;
do $$ begin
 if to_regprocedure('public.role_in(text[])') is not null and not exists(select 1 from pg_policies where schemaname='public' and tablename='teacher_v2_master' and policyname='teacher_v2_admin_read') then
  create policy teacher_v2_admin_read on public.teacher_v2_master for select to authenticated using(public.role_in(array['admin','super_admin']));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='teacher_v2_master' and policyname='teacher_v2_self_read') then
  create policy teacher_v2_self_read on public.teacher_v2_master for select to authenticated using(auth.uid()=auth_user_id);
 end if;
end $$;

-- Preserve handover history and ensure V2 login is disabled when a teacher is relieved.
create table if not exists public.teacher_v2_handover_history(
 id uuid primary key default gen_random_uuid(),old_teacher_profile_id uuid not null,new_teacher_profile_id uuid,relieved_date date not null,reason text not null,handled_by uuid,snapshot jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
alter table public.teacher_v2_handover_history enable row level security;
grant select on public.teacher_v2_handover_history to authenticated;
do $$ begin
 if to_regprocedure('public.role_in(text[])') is not null and not exists(select 1 from pg_policies where schemaname='public' and tablename='teacher_v2_handover_history' and policyname='teacher_v2_handover_admin_read') then
  create policy teacher_v2_handover_admin_read on public.teacher_v2_handover_history for select to authenticated using(public.role_in(array['admin','super_admin']));
 end if;
end $$;

commit;
notify pgrst,'reload schema';

-- Teacher V2 public-safe login resolver: resolves Teacher ID or normalized mobile to the
-- internal Supabase Auth email already used by the ERP. It returns no password or private auth data.
create or replace function public.teacher_v2_resolve_login(p_identifier text)
returns table(login_email text, error_code text, error_message text)
language plpgsql security definer set search_path=public,auth as $$
declare
  ident text:=upper(btrim(coalesce(p_identifier,'')));
  mob text:=public.teacher_v2_normalize_mobile(p_identifier);
  cnt int:=0;
  r public.teacher_v2_master%rowtype;
begin
  if ident like 'TCH-%' then
    select count(*) into cnt from public.teacher_v2_master m where upper(m.teacher_code)=ident and m.is_active and m.login_enabled;
    if cnt=0 then return query select null::text,'NOT_FOUND','Teacher ID mapping नहीं मिला.'; return; end if;
    select * into r from public.teacher_v2_master m where upper(m.teacher_code)=ident and m.is_active and m.login_enabled limit 1;
  else
    if mob is null or length(mob)<>10 then return query select null::text,'INVALID_IDENTIFIER','Valid Teacher ID या 10 digit mobile डालें.'; return; end if;
    select count(*) into cnt from public.teacher_v2_master m where public.teacher_v2_normalize_mobile(m.mobile)=mob and m.is_active and m.login_enabled;
    if cnt=0 then return query select null::text,'NOT_FOUND','Registered mobile का Teacher V2 mapping नहीं मिला.'; return; end if;
    if cnt>1 then return query select null::text,'AMBIGUOUS_MOBILE','यह mobile एक से अधिक active Teacher records से mapped है. Admin से mapping ठीक कराएँ.'; return; end if;
    select * into r from public.teacher_v2_master m where public.teacher_v2_normalize_mobile(m.mobile)=mob and m.is_active and m.login_enabled limit 1;
  end if;
  if r.mobile is null or length(public.teacher_v2_normalize_mobile(r.mobile))<>10 then return query select null::text,'NO_LOGIN_MOBILE','Teacher V2 record में valid login mobile नहीं है.'; return; end if;
  return query select ('t'||public.teacher_v2_normalize_mobile(r.mobile)||'@teacher.ldmodern.local')::text,null::text,null::text;
end $$;
revoke all on function public.teacher_v2_resolve_login(text) from public;
grant execute on function public.teacher_v2_resolve_login(text) to anon,authenticated;
