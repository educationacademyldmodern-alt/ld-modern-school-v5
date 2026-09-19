-- V59 Academic Calendar / Holiday Master
-- Additive, idempotent, non-destructive. No existing attendance rows are deleted/reset.
create extension if not exists pgcrypto;

create table if not exists public.school_holidays(
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null,
  holiday_name text not null default 'Holiday',
  holiday_type text not null default 'School Holiday',
  is_working_day boolean not null default false,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(holiday_date)
);
alter table public.school_holidays add column if not exists holiday_name text not null default 'Holiday';
alter table public.school_holidays add column if not exists holiday_type text not null default 'School Holiday';
alter table public.school_holidays add column if not exists is_working_day boolean not null default false;
alter table public.school_holidays add column if not exists note text;
alter table public.school_holidays add column if not exists created_by uuid;
alter table public.school_holidays add column if not exists updated_at timestamptz not null default now();
create unique index if not exists ux_school_holidays_date on public.school_holidays(holiday_date);
create index if not exists ix_school_holidays_date_working on public.school_holidays(holiday_date,is_working_day);

-- Sunday is automatically a holiday unless Admin creates that Sunday as is_working_day=true.
create or replace function public.school_day_status(p_date date)
returns table(is_holiday boolean, label text, source text)
language sql stable security invoker as $$
  with x as (select holiday_name,is_working_day from public.school_holidays where holiday_date=p_date limit 1)
  select
    case when exists(select 1 from x where is_working_day=true) then false
         when exists(select 1 from x where is_working_day=false) then true
         when extract(isodow from p_date)=7 then true else false end,
    case when exists(select 1 from x where is_working_day=true) then 'Working Day'
         when exists(select 1 from x where is_working_day=false) then coalesce((select holiday_name from x),'Holiday')
         when extract(isodow from p_date)=7 then 'Sunday / Weekly Holiday' else 'Working Day' end,
    case when exists(select 1 from x) then 'calendar' when extract(isodow from p_date)=7 then 'sunday' else 'normal' end;
$$;

alter table public.school_holidays enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='school_holidays' and policyname='school_holidays_read') then
    create policy school_holidays_read on public.school_holidays for select to authenticated using (true);
  end if;
exception when others then raise notice 'holiday read policy skipped: %',sqlerrm; end $$;
-- Existing ERP admin authentication/permissions remain the write gate in UI. Do not weaken existing RLS globally.
